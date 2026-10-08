"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Server } from 'lucide-react';

export default function HistoryPage() {
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setGenerations(data);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full h-full p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-100">Generation History</h2>
        <p className="text-neutral-400 mt-1">Review your previously generated schemas and mocks.</p>
      </div>

      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-4">
            <Server className="w-12 h-12 opacity-20" />
            <p>No generations found. Create one in the Generator tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-400">
              <thead className="text-xs uppercase bg-neutral-950 border-b border-neutral-800 text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Schema ID</th>
                  <th className="px-6 py-4 font-medium">Created At</th>
                  <th className="px-6 py-4 font-medium">Mock Status</th>
                </tr>
              </thead>
              <tbody>
                {generations.map((gen) => (
                  <tr key={gen.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition">
                    <td className="px-6 py-4 font-mono text-indigo-400">{gen.id}</td>
                    <td className="px-6 py-4">{new Date(gen.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-medium">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
