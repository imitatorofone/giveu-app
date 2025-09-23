'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';

type Member = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  approval_status: string | null;
  is_leader: boolean | null;
  city?: string | null;                     // NEW
  gift_selections?: string[] | string | null; // NEW (array or comma-string)
};

// local optimistic update helpers
function removeFrom<T extends { id: string }>(arr: T[], id: string) {
  return arr.filter(x => x.id !== id);
}

function initialsOf(name?: string | null, fallbackEmail?: string | null) {
  const src = (name || fallbackEmail || '').trim();
  if (!src) return '?';
  const parts = src.split(/[.\s_@-]+/).filter(Boolean);
  const a = parts[0]?.[0] || '';
  const b = parts.length > 1 ? parts[1]?.[0] : '';
  return (a + b).toUpperCase();
}

// Filter chip component
function FilterChip({
  active,
  children,
  onClick,
}: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition ${
        active ? 'text-white' : 'text-gray-700'
      }`}
      style={{
        borderColor: active ? '#20c997' : '#e5e7eb',
        backgroundColor: active ? '#20c997' : 'white',
      }}
    >
      {children}
    </button>
  );
}


function MemberTile({
  m,
  status,                 // 'pending' | 'active'
  onOpen,
  onApprove,
  onDeny,
}: {
  m: Member;
  status: 'pending' | 'active';
  onOpen: () => void;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
}) {
  return (
    <div
      role="button"
      onClick={onOpen}
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition cursor-pointer select-none"
    >
      {/* Left: Avatar + Name */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shrink-0"
          style={{ backgroundColor: '#20c997' }}
          aria-hidden
        >
          {initialsOf(m.full_name, m.email)}
        </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm md:text-base truncate">
                  {m.full_name || '—'}
                </span>
              </div>
              <div className="text-xs md:text-sm text-gray-600 truncate capitalize">
                {m.is_leader ? (
                  <span className="font-semibold" style={{ color: '#20c997' }}>
                    Leader
                  </span>
                ) : (
                  m.role || 'member'
                )}
              </div>
            </div>
      </div>

      {/* Right: Status + Actions (buttons stop propagation) */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide"
          style={{ borderColor: '#20c997', color: '#20c997' }}
        >
          {status === 'pending' ? 'Pending' : 'Active'}
        </span>

        {status === 'pending' && onApprove && onDeny ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(m.id); }}
              className="px-3 py-1.5 rounded-lg text-white text-sm font-semibold hover:opacity-90"
              style={{ backgroundColor: '#20c997' }}
            >
              Approve
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeny(m.id); }}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200"
            >
              Deny
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function MembersPage() {
  const router = useRouter();

  // existing state you already had:
  const [approved, setApproved] = useState<Member[]>([]);
  const [pending, setPending] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [churchName, setChurchName] = useState<string>('Your Church');

  // NEW: search + filters
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'member' | 'leader'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active'>('all');

  // Clear filters functionality
  const hasFilters =
    query.trim().length > 0 ||
    roleFilter !== 'all' ||
    statusFilter !== 'all';

  function resetFilters() {
    setQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  }

  // Modal state
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [detail, setDetail] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      console.log('👤 MembersPage session email:', session?.user?.email);

      if (!token) {
        setErr('Please sign in.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/leader/members', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text(); // <-- capture raw body
        console.error('❌ /api/leader/members failed:', res.status, text);
        try {
          const body = JSON.parse(text);
          setErr(body?.error || `Failed with ${res.status}`);
        } catch {
          setErr(text || `Failed with ${res.status}`);
        }
        setLoading(false);
        return;
      }

          const body = await res.json();
          console.log('👤 session:', session?.user?.email, 'counts:', body?.counts);
          setApproved(body.approved || []);
          setPending(body.pending || []);
          setChurchName(body.me?.church_name || 'Your Church');
          setLoading(false);
    })();
  }, []);

  async function reloadMembers() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch('/api/leader/members', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
        const body = await res.json();
        setApproved(body.approved || []);
        setPending(body.pending || []);
        setChurchName(body.me?.church_name || 'Your Church');
        console.log('🔁 reloaded members counts:', body?.counts);
  }

  // Filter logic (client-side for now)
  const norm = (v: any) =>
    (Array.isArray(v) ? v.join(' ') : (v ?? '')).toString().toLowerCase();

  const tagsOf = (v: Member['gift_selections']) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const match = (m: Member) => {
    const q = query.trim().toLowerCase();
    const haystack =
      norm(m.full_name) + ' ' +
      norm(m.city) + ' ' +
      norm(tagsOf(m.gift_selections));

    const inText = !q || haystack.includes(q);

    const roleOk =
      roleFilter === 'all' ||
      (roleFilter === 'leader' ? !!m.is_leader : !m.is_leader);

    // status filter is already applied by which list we render,
    // but if you want it to also constrain within each list:
    const statusOk =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && m.approval_status !== 'approved') ||
      (statusFilter === 'active' && m.approval_status === 'approved');

    return inText && roleOk && statusOk;
  };

  const filteredPending = useMemo(
    () => pending.filter(match),
    [pending, query, roleFilter, statusFilter]
  );
  const filteredApproved = useMemo(
    () => approved.filter(match),
    [approved, query, roleFilter, statusFilter]
  );

  // navigate to detail
  const openMember = (id: string) => router.push(`/leader/members/${id}`);

  // Modal functions
  function closeProfile() {
    setProfileOpen(false);
    setDetail(null);
    setSelected(null);
    document.body.style.overflow = '';
  }

  async function openProfile(m: Member) {
    setSelected(m);
    setProfileOpen(true);
    setProfileLoading(true);
    document.body.style.overflow = 'hidden'; // lock scroll

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { toast.error('Please sign in.'); setProfileLoading(false); return; }

    const res = await fetch(`/api/leader/members/${m.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('profile load failed:', res.status, text);
      toast.error('Could not load profile.');
      setProfileLoading(false);
      return;
    }
    const body = await res.json();
    setDetail(body.member);
    setProfileLoading(false);
  }

  async function actOnMember(memberId: string, action: 'approve' | 'deny') {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { toast.error('Please sign in.'); return; }

    // optimistic move for approve
    if (action === 'approve') {
      const idx = pending.findIndex(m => m.id === memberId);
      if (idx !== -1) {
        const moved = pending[idx];
        setPending(prev => removeFrom(prev, memberId));
        setApproved(prev => [{ ...moved, approval_status: 'approved' }, ...prev]);
      }
    } else {
      // optimistic remove for deny
      setPending(prev => removeFrom(prev, memberId));
    }

    const res = await fetch('/api/leader/members/approve', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ memberId, action }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('approve/deny failed:', res.status, text);
      toast.error('Action failed. Reverting…');

      // revert optimistic change
      // simplest approach: refetch full list after failure
      await reloadMembers();
      return;
    }

    const body = await res.json().catch(() => ({}));
    toast.success(action === 'approve' ? 'Member approved' : 'Member denied');
  }

  if (loading) return <div className="p-6">Loading members…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;


  return (
    <div style={{ paddingBottom: '100px' }}>
      <Header />
      
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-bold">Members of {churchName}</h1>

        {/* Search + filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="who/what are you looking for?"
                className="w-full md:w-1/2 rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-gray-400"
              />
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>All Roles</FilterChip>
            <FilterChip active={roleFilter === 'member'} onClick={() => setRoleFilter('member')}>Members</FilterChip>
            <FilterChip active={roleFilter === 'leader'} onClick={() => setRoleFilter('leader')}>Leaders</FilterChip>

            <span className="mx-1 text-gray-300">|</span>

            <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All Status</FilterChip>
            <FilterChip active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')}>Pending</FilterChip>
            <FilterChip active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>Active</FilterChip>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-full text-sm border transition text-white"
                style={{ borderColor: '#20c997', backgroundColor: '#20c997' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Pending */}
        {statusFilter !== 'active' && (
          <>
            <h2 className="text-lg font-semibold mt-2">Pending Members ({filteredPending.length})</h2>
            <div className="mt-3 space-y-3">
              {filteredPending.length === 0 ? (
                <p className="text-sm text-gray-600">No pending members.</p>
              ) : (
                filteredPending.map((m) => (
                  <MemberTile
                    key={m.id}
                    m={m}
                    status="pending"
                    onOpen={() => openProfile(m)}
                    onApprove={(id) => actOnMember(id, 'approve')}
                    onDeny={(id) => actOnMember(id, 'deny')}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* Active */}
        {statusFilter !== 'pending' && (
          <>
            <h2 className="text-lg font-semibold mt-8">Active Members ({filteredApproved.length})</h2>
            <div className="mt-3 space-y-3">
              {filteredApproved.length === 0 ? (
                <p className="text-sm text-gray-600">No active members yet.</p>
              ) : (
                filteredApproved.map((m) => (
                  <MemberTile
                    key={m.id}
                    m={m}
                    status="active"
                    onOpen={() => openProfile(m)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
      
      <Footer />

      {/* Profile Modal */}
      {profileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50"
          onKeyDown={(e) => e.key === 'Escape' && closeProfile()}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeProfile}
          />
          {/* Panel */}
          <div className="absolute inset-x-0 top-[8vh] mx-auto w-[92vw] max-w-xl rounded-2xl bg-white shadow-lg">
            <div className="flex items-start justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: '#20c997' }}
                >
                  {initialsOf(detail?.full_name ?? selected?.full_name, detail?.email ?? selected?.email)}
                </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {detail?.full_name || selected?.full_name || '—'}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        { (detail?.is_leader || selected?.is_leader) ? (
                          <span className="font-semibold" style={{ color: '#20c997' }}>Leader</span>
                        ) : (
                          (detail?.role || selected?.role || 'member')
                        )}
                        {' • '}
                        {(detail?.approval_status || selected?.approval_status || 'approved')}
                      </div>
                    </div>
              </div>

              <button
                onClick={closeProfile}
                className="rounded-lg px-2 py-1 text-sm border hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {profileLoading ? (
                <div className="text-sm text-gray-600">Loading profile…</div>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <div className="text-gray-600">Email</div>
                    <div>{detail?.email || '—'}</div>
                        <div className="text-gray-600">Church</div>
                        <div>{detail?.church_name || detail?.church_code || '—'}</div>
                    <div className="text-gray-600">City</div>
                    <div>{detail?.city || '—'}</div>
                    <div className="text-gray-600">Phone</div>
                    <div>{detail?.phone || '—'}</div>
                    <div className="text-gray-600">Age</div>
                    <div>{detail?.age ?? '—'}</div>
                  </div>

                  {(detail?.gift_selections && Array.isArray(detail.gift_selections) && detail.gift_selections.length > 0) ? (
                    <div>
                      <div className="text-sm font-semibold mb-2">Giftings</div>
                      <div className="flex flex-wrap gap-2">
                        {detail.gift_selections.map((g: string) => (
                          <span key={`sel-${g}`} className="px-2 py-0.5 rounded-full text-xs border" style={{ borderColor: '#e5e7eb' }}>
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Footer: actions for pending */}
            {selected && (selected.approval_status !== 'approved') && (
              <div className="flex items-center justify-end gap-2 p-5 border-t">
                <button
                  onClick={async () => { await actOnMember(selected.id, 'deny'); closeProfile(); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200"
                >
                  Deny
                </button>
                <button
                  onClick={async () => { await actOnMember(selected.id, 'approve'); closeProfile(); }}
                  className="px-3 py-1.5 rounded-lg text-white text-sm font-semibold hover:opacity-90"
                  style={{ backgroundColor: '#20c997' }}
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
