'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import ClientOnly from '../../_clientOnly';

export default function NotesPage() {
  const search = useSearchParams();
  const router = useRouter();
  const pid = search.get('pid'); // profile id from ?pid=...

  const [loading, setLoading] = useState(true);
  const [who, setWho] = useState<{ full_name: string | null; email: string | null } | null>(null);
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      if (!pid) {
        setMsg('Missing person id.');
        setLoading(false);
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setMsg('Please sign in on Home first.');
        setLoading(false);
        return;
      }

      // Check if user is a leader by checking email
      if (authData.user.email !== 'imitatorofone@gmail.com') {
        // Not a leader, redirect to home
        window.location.href = '/';
        return;
      }

      // profile header
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', pid)
        .maybeSingle();

      if (profErr) {
        setMsg(`Profile load error: ${profErr.message}`);
        setLoading(false);
        return;
      }
      setWho(prof || { full_name: null, email: null });

      // existing note (leaders only; RLS enforces)
      const { data: n, error: nErr } = await supabase
        .from('profile_leader_notes')
        .select('notes')
        .eq('profile_id', pid)
        .maybeSingle();

      if (nErr) {
        setMsg(`Notes load error: ${nErr.message}`);
      } else if (n) {
        setNotes(n.notes || '');
      }
      setLoading(false);
    })();
  }, [pid]);

  async function save() {
    if (!pid) return;
    setMsg('Saving...');
    const { data: authData } = await supabase.auth.getUser();
    const leaderId = authData.user?.id || null;

    const { error } = await supabase
      .from('profile_leader_notes')
      .upsert(
        { profile_id: pid, notes, updated_by: leaderId, updated_at: new Date().toISOString() },
        { onConflict: 'profile_id' }
      );

    setMsg(error ? `Save error: ${error.message}` : 'Saved!');
  }

  if (loading) {
    return (
      <ClientOnly>
        <main style={{maxWidth:700,margin:'40px auto',fontFamily:'sans-serif'}}>Loading…</main>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <main style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => router.back()}>&larr; Back</button>
        </div>

        <h1>Leader Notes</h1>
        <p style={{ opacity: 0.8, marginTop: 4 }}>
          For: <strong>{who?.full_name || '—'}</strong> ({who?.email || '—'})
        </p>

        <label style={{ display:'block', marginTop:12 }}>Notes (leaders only)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={10}
          style={{ width:'100%', padding:8, fontFamily:'inherit' }}
          placeholder="Placement ideas, care needs, follow-ups…"
        />

        <button onClick={save} style={{ marginTop:12, padding:'8px 12px' }}>
          Save
        </button>

        {msg && <p style={{ marginTop:8 }}>{msg}</p>}
      </main>
    </ClientOnly>
  );
}
