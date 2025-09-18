'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Ministry = { id: string; name: string; description: string | null; is_active: boolean };

export default function ServePage() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const u = auth.user;
      if (!u) { setMsg('Please sign in on Home first.'); setLoading(false); return; }
      setUserId(u.id);

      // load ministries
      const { data: mins, error: mErr } = await supabase
        .from('ministries')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (mErr) { setMsg(`Load error: ${mErr.message}`); setLoading(false); return; }
      setMinistries(mins || []);

      // load current selections for this user
      const { data: mine, error: sErr } = await supabase
        .from('profile_ministries')
        .select('ministry_id')
        .eq('profile_id', u.id);

      if (sErr) { setMsg(`Load error: ${sErr.message}`); setLoading(false); return; }

      const set = new Set<string>((mine || []).map(r => r.ministry_id as string));
      setSelected(set);
      setLoading(false);
    })();
  }, []);

  function toggle(id: string) {
    const copy = new Set(selected);
    if (copy.has(id)) copy.delete(id); else copy.add(id);
    setSelected(copy);
  }

  async function save() {
    if (!userId) return;
    setMsg('Saving…');

    // Easiest: replace all rows for this user
    const del = await supabase.from('profile_ministries').delete().eq('profile_id', userId);
    if (del.error) { setMsg(`Save error: ${del.error.message}`); return; }

    if (selected.size > 0) {
      const rows = Array.from(selected).map(id => ({ profile_id: userId, ministry_id: id }));
      const ins = await supabase.from('profile_ministries').insert(rows);
      if (ins.error) { setMsg(`Save error: ${ins.error.message}`); return; }
    }

    setMsg('Saved!');
  }

  if (loading) return <main style={{maxWidth:700,margin:'40px auto',fontFamily:'sans-serif'}}>Loading…</main>;

  return (
    <main style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Teams & Ministries</h1>
      {msg && <p style={{ opacity: 0.8 }}>{msg}</p>}

      {ministries.length === 0 ? (
        <p>No ministries yet.</p>
      ) : (
        <div style={{ display:'grid', gap:10, marginTop:12 }}>
          {ministries.map(m => (
            <label key={m.id} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'8px 10px', border:'1px solid #eee', borderRadius:8 }}>
              <input
                type="checkbox"
                checked={selected.has(m.id)}
                onChange={() => toggle(m.id)}
                style={{ marginTop:3 }}
              />
              <div>
                <div style={{ fontWeight:600 }}>{m.name}</div>
                {m.description && <div style={{ fontSize:13, opacity:0.8 }}>{m.description}</div>}
              </div>
            </label>
          ))}
        </div>
      )}

      <button onClick={save} style={{ marginTop:16, padding:'8px 12px' }}>
        Save
      </button>
    </main>
  );
}
