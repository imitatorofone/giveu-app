'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Mail } from 'lucide-react';

type MemberDetail = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  approval_status: string | null;
  is_leader: boolean | null;
  church_code: string | null;
  city?: string | null;
  phone?: string | null;
  age?: number | null;
  availability?: string[] | null;
  gift_selections?: string[] | null;
  selected_gift_categories?: string[] | null;
};

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [m, setM] = useState<MemberDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setErr('Please sign in.'); setLoading(false); return; }

      const res = await fetch(`/api/leader/members/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setErr(text || `Failed with ${res.status}`);
        setLoading(false);
        return;
      }
      const body = await res.json();
      setM(body.member);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!m) return <div className="p-6">Not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="px-3 py-1.5 rounded-lg text-sm border"
        style={{ borderColor: '#e5e7eb' }}
      >
        ← Back
      </button>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center font-bold text-white"
            style={{ backgroundColor: '#20c997' }}
          >
            {(m.full_name || m.email || '?').split(/[.\s_@-]+/).map(s => s[0]).slice(0,2).join('').toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold">{m.full_name || '—'}</h1>
            <div className="text-sm text-gray-600 capitalize">
              {m.role || 'member'} • {m.approval_status || 'approved'}
              {m.is_leader ? <span className="ml-2 font-semibold" style={{ color: '#20c997' }}>Leader</span> : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            <span>{m.email || '—'}</span>
          </div>
          <div className="text-sm">Church: {m.church_code || '—'}</div>
          <div className="text-sm">City: {m.city || '—'}</div>
          <div className="text-sm">Phone: {m.phone || '—'}</div>
          <div className="text-sm">Age: {m.age ?? '—'}</div>
        </div>

        {/* Optional: tags/chips */}
        {(m.selected_gift_categories?.length || m.gift_selections?.length) ? (
          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">Giftings</div>
            <div className="flex flex-wrap gap-2">
              {(m.selected_gift_categories || []).map((g) => (
                <span key={`cat-${g}`} className="px-2 py-0.5 rounded-full text-xs border" style={{ borderColor: '#e5e7eb' }}>{g}</span>
              ))}
              {(m.gift_selections || []).map((g) => (
                <span key={`sel-${g}`} className="px-2 py-0.5 rounded-full text-xs border" style={{ borderColor: '#e5e7eb' }}>{g}</span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
