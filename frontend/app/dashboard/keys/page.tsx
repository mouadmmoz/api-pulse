"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Key, Plus, Trash2 } from 'lucide-react';

export default function APIKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const fetchKeys = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setKeys(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Generate a random key for demonstration purposes
    const rawKey = 'sk_' + Math.random().toString(36).substr(2, 12) + Math.random().toString(36).substr(2, 12);
    
    // Securely hash the key before sending it to the server
    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const { error } = await supabase
      .from('api_keys')
      .insert({
        user_id: session.user.id,
        name: newKeyName,
        key_hash: hashedKey
      });

    if (!error) {
      setNewKeyName('');
      alert(`Your new API Key is: ${rawKey}\nPlease save it now, as you won't be able to see it again.`);
      fetchKeys();
    } else {
      alert("Error creating key.");
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this key?')) return;
    
    await supabase.from('api_keys').delete().eq('id', id);
    fetchKeys();
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-100">API Keys</h2>
          <p className="text-neutral-400 mt-1">Manage your secret API keys to programmatically generate schemas.</p>
        </div>
      </div>

      <div className="mb-8 p-4 bg-neutral-900 border border-neutral-800 rounded-xl max-w-xl">
        <h3 className="text-sm font-semibold text-neutral-300 mb-3">Create New Key</h3>
        <form onSubmit={handleCreateKey} className="flex gap-3">
          <input 
            type="text" 
            placeholder="e.g. Production App" 
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
            required
          />
          <button 
            type="submit"
            disabled={creating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Key
          </button>
        </form>
      </div>

      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-neutral-500 gap-4">
            <Key className="w-12 h-12 opacity-20" />
            <p>You haven't created any API keys yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-400">
              <thead className="text-xs uppercase bg-neutral-950 border-b border-neutral-800 text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Key Prefix</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition">
                    <td className="px-6 py-4 text-neutral-200">{k.name}</td>
                    <td className="px-6 py-4 font-mono">{k.key_hash.slice(0, 8)}...</td>
                    <td className="px-6 py-4">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(k.id)} className="text-red-400 hover:text-red-300 p-2 rounded-md hover:bg-red-500/10 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
