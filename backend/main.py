import asyncio
import json
import re
import os
import uuid
import hmac
import hashlib
from typing import Any, Callable, Dict, Optional, cast
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, Request, HTTPException, status, Depends, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from genson import SchemaBuilder
import google.generativeai as genai
from supabase import create_client, Client
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

# Configurations
# [PAYMENT SYSTEM COMMENTED OUT - 100% Free Beta Mode]
# LEMON_SQUEEZY_WEBHOOK_SECRET = os.getenv("LEMON_SQUEEZY_WEBHOOK_SECRET", "test-secret")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://api-pulse.com").split(",")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")

supabase: Client | None = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

security = HTTPBearer(auto_error=False)

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="API-Pulse Backend (Hardened)")
app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    cast(Callable[[Request, Exception], Response], _rate_limit_exceeded_handler),
)

# Security Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Strict CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"], # Restricted methods
    allow_headers=["Authorization", "Content-Type"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
else:
    model = None

# In-memory mock store for instant responses and local fallback
mock_store: Dict[str, Any] = {}

# Dependency to get current user from Supabase Auth token
async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials or not credentials.credentials:
        return {"id": None, "tier": "free"}
    token = credentials.credentials
    if supabase:
        try:
            user_res = supabase.auth.get_user(token)
            if user_res and user_res.user:
                user_id = user_res.user.id
                tier = "free"
                try:
                    profile_res = supabase.table("users").select("tier").eq("id", user_id).execute()
                    if profile_res.data and isinstance(profile_res.data, list) and len(profile_res.data) > 0:
                        first_row = profile_res.data[0]
                        if isinstance(first_row, dict):
                            tier = str(first_row.get("tier", "free"))
                except Exception:
                    pass
                return {"id": user_id, "tier": tier, "email": user_res.user.email}
        except Exception:
            pass
    return {"id": None, "tier": "free"}

class GenerateResponse(BaseModel):
    schema_id: str
    mock_url: str
    openapi_spec: Dict[str, Any]
    fallback_used: bool

def calculate_json_depth(obj: Any, current_depth: int = 0) -> int:
    if current_depth > 15: # Early exit to prevent deep recursion DoS
        return current_depth
    if isinstance(obj, dict):
        if not obj:
            return current_depth + 1
        return max(calculate_json_depth(v, current_depth + 1) for v in obj.values())
    elif isinstance(obj, list):
        if not obj:
            return current_depth + 1
        return max(calculate_json_depth(v, current_depth + 1) for v in obj)
    else:
        return current_depth

def sanitize_payload(payload_str: str) -> str:
    payload_str = re.sub(r'(?i)(AKIA[0-9A-Z]{16})', '[REDACTED_SECRET]', payload_str)
    payload_str = re.sub(r'(?i)(bearer\s+[a-zA-Z0-9_\-\.]+)', 'Bearer [REDACTED_SECRET]', payload_str)
    payload_str = re.sub(r'(?i)("password"\s*:\s*")[^"]+(")', r'\1[REDACTED_SECRET]\2', payload_str)
    return payload_str

def genson_fallback(payload: Any, method: str, path: str) -> Dict[str, Any]:
    builder = SchemaBuilder()
    builder.add_object(payload)
    return {
        "openapi": "3.1.0",
        "info": {"title": "API-Pulse Generated Mock", "version": "1.0.0"},
        "paths": {
            path: {
                method.lower(): {
                    "responses": {
                        "200": {
                            "description": "Mock response",
                            "content": {"application/json": {"schema": builder.to_schema()}}
                        }
                    }
                }
            }
        }
    }

async def call_llm(payload_str: str, method: str, path: str) -> Dict[str, Any]:
    if not model:
        raise ValueError("LLM not configured")
    prompt = f"Create an OpenAPI 3.1 specification for a {method.upper()} request to {path}. The endpoint returns this JSON payload:\n{payload_str}\n\nRespond ONLY with valid JSON."
    response = await model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
    if response.text:
        return json.loads(response.text)
    raise ValueError("Empty LLM response")

@app.post("/api/generate", response_model=GenerateResponse)
@limiter.limit("20/minute")
async def generate_schema(
    request: Request, 
    method: str = "POST", 
    path: str = "/api/resource",
    user: dict = Depends(get_current_user)
):
    # Strict Payload Size Validation (500KB max)
    body = await request.body()
    if len(body) > 500 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Payload exceeds 500KB limit")
    
    try:
        payload_str = body.decode("utf-8")
        payload = json.loads(payload_str)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    depth = calculate_json_depth(payload)
    if depth > 15:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="JSON payload deeper than 15 levels")
    
    sanitized_str = sanitize_payload(payload_str)
    schema_id = str(uuid.uuid4())
    openapi_spec = None
    fallback_used = False
    
    try:
        openapi_spec = await asyncio.wait_for(call_llm(sanitized_str, method, path), timeout=25.0)
    except (asyncio.TimeoutError, Exception) as e:
        print(f"LLM failed: {e}. Executing fallback...")
        fallback_used = True
        openapi_spec = genson_fallback(json.loads(sanitized_str), method, path)

    payload_obj = json.loads(sanitized_str)

    # 1. Save in local memory cache
    mock_store[schema_id] = {
        "payload": payload_obj,
        "spec": openapi_spec,
        "method": method.upper(),
        "path": path,
    }

    # 2. Persist in Supabase mock_endpoints
    if supabase:
        try:
            supabase.table("mock_endpoints").insert({
                "id": schema_id,
                "spec": openapi_spec,
                "payload": payload_obj
            }).execute()
        except Exception as e:
            print(f"Supabase mock_endpoints error: {e}")

        # 3. Log user generation history if authenticated
        user_id = user.get("id")
        if user_id:
            try:
                supabase.table("generations").insert({
                    "user_id": user_id,
                    "schema_id": schema_id
                }).execute()
            except Exception as e:
                print(f"Supabase generations error: {e}")

    # 4. Generate the live mock URL
    mock_base = os.getenv("MOCK_BASE_URL", "").rstrip("/")
    if not mock_base:
        host = request.headers.get("x-forwarded-host") or request.headers.get("host") or "localhost:8000"
        proto = request.headers.get("x-forwarded-proto") or ("https" if request.url.scheme == "https" else "http")
        mock_base = f"{proto}://{host}"

    normalized_path = "/" + path.lstrip("/") if path else ""
    live_mock_url = f"{mock_base}/mock/{schema_id}{normalized_path}"

    return GenerateResponse(
        schema_id=schema_id,
        mock_url=live_mock_url,
        openapi_spec=openapi_spec,
        fallback_used=fallback_used
    )

@app.api_route(
    "/mock/{schema_id}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
)
@app.api_route(
    "/mock/{schema_id}/{subpath:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
)
async def serve_mock_endpoint(request: Request, schema_id: str, subpath: str = ""):
    # Handle CORS preflight explicitly
    if request.method == "OPTIONS":
        return Response(
            status_code=204,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )

    # 1. Fetch from local cache
    mock_data = mock_store.get(schema_id)

    # 2. Fetch from Supabase if not in memory
    if not mock_data and supabase:
        try:
            res = supabase.table("mock_endpoints").select("payload, spec").eq("id", schema_id).execute()
            if res.data and isinstance(res.data, list) and len(res.data) > 0:
                first_row = res.data[0]
                if isinstance(first_row, dict):
                    mock_data = first_row
                    mock_store[schema_id] = first_row
        except Exception as e:
            print(f"Error reading mock from DB: {e}")

    if not isinstance(mock_data, dict):
        raise HTTPException(status_code=404, detail="Mock API endpoint not found or expired")

    response_payload = mock_data.get("payload", {})
    return Response(
        content=json.dumps(response_payload, indent=2),
        media_type="application/json",
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
            "X-Powered-By": "API-Pulse Live Mock",
            "X-Schema-ID": schema_id,
        }
    )

# ==============================================================================
# PAYMENT WEBHOOK (LEMON SQUEEZY) - COMMENTED OUT FOR FREE BETA / PORTFOLIO MODE
# Uncomment below to re-enable Lemon Squeezy subscription webhooks.
# ==============================================================================
# @app.post("/api/webhook/lemonsqueezy")
# @limiter.limit("10/minute") # Rate limit webhook endpoint
# async def lemonsqueezy_webhook(request: Request, x_signature: str = Header(None)):
#     body = await request.body()
#     
#     # 1. Verify HMAC Signature
#     if not LEMON_SQUEEZY_WEBHOOK_SECRET:
#         raise HTTPException(status_code=500, detail="Webhook secret not configured")
#     if not x_signature:
#         raise HTTPException(status_code=401, detail="Missing signature")
#         
#     digest = hmac.new(
#         LEMON_SQUEEZY_WEBHOOK_SECRET.encode("utf-8"),
#         body,
#         hashlib.sha256
#     ).hexdigest()
#     
#     if not hmac.compare_digest(digest, x_signature):
#         raise HTTPException(status_code=401, detail="Invalid signature")
#         
#     # 2. Process Event securely
#     try:
#         data = json.loads(body.decode("utf-8"))
#         event_name = data.get("meta", {}).get("event_name")
#         
#         if event_name == "subscription_created":
#             custom_data = data.get("meta", {}).get("custom_data", {})
#             user_id = custom_data.get("user_id")
#             
#             if user_id and supabase:
#                 try:
#                     # Update securely using service_role
#                     supabase.table("users").update({"tier": "pro"}).eq("id", user_id).execute()
#                     return {"status": "success", "message": "User upgraded successfully"}
#                 except Exception as e:
#                     print(f"Error updating user: {e}")
#                     raise HTTPException(status_code=500, detail="Database update failed")
#             else:
#                 return {"status": "ignored", "message": "No user_id found or Supabase not configured"}
#                 
#         return {"status": "ignored", "message": f"Unhandled event {event_name}"}
#         
#     except json.JSONDecodeError:
#         raise HTTPException(status_code=400, detail="Invalid JSON")

