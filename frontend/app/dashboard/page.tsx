"use client";

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function APIPulse() {
  const [path, setPath] = useState('/api/users');
  const [method, setMethod] = useState('GET');
  const [jsonInput, setJsonInput] = useState('{\n  "id": 1,\n  "name": "Jane Doe",\n  "email": "jane@example.com"\n}');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [openApiSpec, setOpenApiSpec] = useState<string>('');
  const [mockUrl, setMockUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setOpenApiSpec('');
    setMockUrl('');

    try {
      // Basic JSON validation before sending
      try {
        JSON.parse(jsonInput);
      } catch (e) {
        throw new Error("Invalid JSON in input.");
      }

      // Get real session for Auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Backend route is /api/generate
      const response = await fetch('http://localhost:8000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: jsonInput,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const errDetail = errData?.detail || `HTTP Error ${response.status}`;
        throw new Error(errDetail);
      }

      const data = await response.json();
      
      // Update Spec
      setOpenApiSpec(JSON.stringify(data.openapi_spec, null, 2));
      
      // Construct Mock URL based on response and user input path
      const baseMockUrl = data.mock_url || `https://your-worker.workers.dev/mock/${data.schema_id}`;
      // Append the custom path the user wants
      const finalUrl = `${baseMockUrl}${path.startsWith('/') ? path : '/' + path}`;
      setMockUrl(finalUrl);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!mockUrl) return;
    navigator.clipboard.writeText(mockUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          API-Pulse
        </h1>
        <button 
          onClick={handleGenerate}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isLoading ? 'Generating...' : 'Generate Spec & Mock'}
        </button>
      </header>

      {/* Error Toast */}
      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 mx-6 mt-6 rounded-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Content Split */}
      <main className="flex-1 flex flex-col md:flex-row p-6 gap-6 overflow-hidden">
        
        {/* Left Pane: Input */}
        <div className="flex-1 flex flex-col gap-4 border border-neutral-800 bg-neutral-900 rounded-xl p-4 shadow-xl">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Input Configuration</h2>
          
          <div className="flex gap-3">
            <select 
              value={method} 
              onChange={(e) => setMethod(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
            <input 
              type="text" 
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/api/resource"
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex-1 rounded-md overflow-hidden border border-neutral-800 mt-2 min-h-[300px]">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={jsonInput}
              onChange={(val) => setJsonInput(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        {/* Right Pane: Output */}
        <div className="flex-1 flex flex-col gap-4 border border-neutral-800 bg-neutral-900 rounded-xl p-4 shadow-xl">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Generated Output</h2>
          
          {/* Live Mock URL Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex flex-col gap-2 relative">
            <span className="text-xs text-neutral-500 font-medium">Live Mock API URL</span>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-neutral-900 px-3 py-2 rounded text-sm text-indigo-300 font-mono overflow-x-auto whitespace-nowrap">
                {mockUrl || "Awaiting generation..."}
              </div>
              <button 
                onClick={copyToClipboard}
                disabled={!mockUrl}
                className="p-2 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent flex-shrink-0"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* OpenAPI Spec Editor */}
          <div className="flex-1 rounded-md overflow-hidden border border-neutral-800 mt-2 min-h-[300px]">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={openApiSpec || "// Your OpenAPI 3.1 schema will appear here..."}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

      </main>
    </div>
  );
}
