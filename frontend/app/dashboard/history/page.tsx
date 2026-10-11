"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, Server, ExternalLink, Copy, Check, RotateCw, Plus } from 'lucide-react';

export default function HistoryPage() {
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) setGenerations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getOrigin = () => {
    return typeof window !== 'undefined' ? window.location.origin : '';
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-100">Generation History</h2>
          <p className="text-neutral-400 mt-1">Review your previously generated schemas and live mock endpoints.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-sm transition"
            title="Refresh history"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Generator</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-neutral-400 gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
              <Server className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">No generations yet</h3>
              <p className="text-sm text-neutral-400 max-w-sm">
                Generate your first OpenAPI schema and mock endpoint using the Generator tab.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Generate First Mock</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-neutral-400">
              <thead className="text-xs uppercase bg-neutral-950 border-b border-neutral-800 text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Schema ID</th>
                  <th className="px-6 py-4 font-medium">Live Mock URL</th>
                  <th className="px-6 py-4 font-medium">Created At</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {generations.map((gen) => {
                  const schemaId = gen.schema_id || gen.id;
                  const mockUrl = `${getOrigin()}/mock/${schemaId}`;
                  const isCopied = copiedId === gen.id;

                  return (
                    <tr key={gen.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition">
                      <td className="px-6 py-4 font-mono text-indigo-300">
                        <span title={schemaId}>
                          {schemaId.slice(0, 8)}...{schemaId.slice(-4)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-neutral-300">
                        <span className="truncate max-w-xs inline-block text-neutral-300" title={mockUrl}>
                          /mock/{schemaId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(gen.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live 200 OK
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => copyToClipboard(mockUrl, gen.id)}
                            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition"
                            title="Copy mock URL"
                          >
                            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <a
                            href={mockUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition"
                            title="Open mock endpoint in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
