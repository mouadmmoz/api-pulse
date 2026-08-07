import asyncio
import json
import re
import os
import uuid
import hmac
import hashlib
from typing import Any, Dict, Optional

from fastapi import FastAPI, Request, HTTPException, status, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from genson import SchemaBuilder
import google.generativeai as genai
from supabase import create_client, Client

app = FastAPI(title="API-Pulse FSM Backend (Enterprise)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Supabase init error: {e}")

# Security
security = HTTPBearer(auto_error=False)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Verifies the JWT token from Supabase."""
    if not supabase:
        # If no DB configured, allow bypass for local dev
        return {"id": "local_dev_user", "tier": "pro"}
        
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    token = credentials.credentials
    try:
        res = supabase.auth.get_user(token)
        if not res.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Fetch user tier
        user_record = supabase.table("users").select("tier").eq("id", res.user.id).execute()
        tier = user_record.data[0]['tier'] if user_record.data else "free"
        
        return {"id": res.user.id, "tier": tier}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


class GenerateResponse(BaseModel):
    schema_id: str
    mock_url: str
    openapi_spec: Dict[str, Any]
    fallback_used: bool

def calculate_json_depth(obj: Any, current_depth: int = 0) -> int:
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

def genson_fallback(payload: Any) -> Dict[str, Any]:
    builder = SchemaBuilder()
    builder.add_object(payload)
    return {
        "openapi": "3.1.0",
        "info": {"title": "API-Pulse Generated Mock", "version": "1.0.0"},
        "paths": {
            "/mock": {
                "post": {
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

async def call_llm(payload_str: str) -> Dict[str, Any]:
    if not model:
        raise ValueError("LLM not configured")
    prompt = f"Convert this JSON payload into a strict OpenAPI 3.1 specification returning JSON:\n{payload_str}\n\nRespond ONLY with valid JSON."
    response = await model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
    if response.text:
        return json.loads(response.text)
    raise ValueError("Empty LLM response")

@app.post("/api/generate", response_model=GenerateResponse)
async def generate_schema(request: Request, user: dict = Depends(get_current_user)):
    # Usage Lock / Rate Limiting based on tier
    if supabase and user["tier"] == "free":
        count_res = supabase.table("generations").select("id", count="exact").eq("user_id", user["id"]).execute()
        if count_res.count and count_res.count >= 10:
            raise HTTPException(status_code=402, detail="Payment Required: Free tier limit reached. Please upgrade to Pro.")

    body = await request.body()
    if len(body) > 500 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payload exceeds 500KB limit")
    
    try:
        payload_str = body.decode("utf-8")
        payload = json.loads(payload_str)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    depth = calculate_json_depth(payload)
    if depth > 7:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="JSON payload deeper than 7 levels")
    
    sanitized_str = sanitize_payload(payload_str)
    schema_id = str(uuid.uuid4())
    openapi_spec = None
    fallback_used = False
    
    try:
        openapi_spec = await asyncio.wait_for(call_llm(sanitized_str), timeout=3.5)
    except (asyncio.TimeoutError, Exception) as e:
        print(f"LLM failed: {e}. Executing fallback...")
        fallback_used = True
        openapi_spec = genson_fallback(json.loads(sanitized_str))
        
    if supabase:
        try:
            supabase.table("mock_endpoints").insert({
                "id": schema_id,
                "spec": openapi_spec,
                "payload": json.loads(sanitized_str)
            }).execute()
            
            # Log generation usage
            if user["id"] != "local_dev_user":
                supabase.table("generations").insert({
                    "user_id": user["id"],
                    "schema_id": schema_id
                }).execute()
        except Exception as e:
            print(f"Database error: {e}")
            
    return GenerateResponse(
        schema_id=schema_id,
        mock_url=f"https://your-worker.workers.dev/mock/{schema_id}",
        openapi_spec=openapi_spec,
        fallback_used=fallback_used
    )

# Lemon Squeezy Webhook
LEMON_SQUEEZY_WEBHOOK_SECRET = os.getenv("LEMON_SQUEEZY_WEBHOOK_SECRET", "dummy_secret")

@app.post("/api/webhooks/payments")
async def payments_webhook(request: Request, x_signature: str = Header(None)):
    body = await request.body()
    
    # Verify signature
    digest = hmac.new(LEMON_SQUEEZY_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(digest, x_signature or ""):
        raise HTTPException(status_code=400, detail="Invalid signature")

    payload = json.loads(body)
    event_name = payload.get("meta", {}).get("event_name")
    
    # Assuming user ID is passed in custom_data
    custom_data = payload.get("meta", {}).get("custom_data", {})
    user_id = custom_data.get("user_id")

    if event_name == "subscription_created" and user_id and supabase:
        supabase.table("users").update({"tier": "pro"}).eq("id", user_id).execute()
        
    elif event_name in ["subscription_cancelled", "subscription_expired"] and user_id and supabase:
        supabase.table("users").update({"tier": "free"}).eq("id", user_id).execute()

    return {"status": "success"}
