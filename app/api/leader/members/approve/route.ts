export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getUserFromAuthHeader(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data } = await anon.auth.getUser(token);
  return data.user || null;
}

export async function PATCH(req: Request) {
  try {
    const caller = await getUserFromAuthHeader(req);
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { memberId, action } = await req.json().catch(() => ({}));
    if (!memberId || !['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'memberId and action=approve|deny required' }, { status: 400 });
    }

    const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // fetch caller profile
    const { data: me, error: meErr } = await svc
      .from('profiles')
      .select('id, is_leader, church_code')
      .eq('id', caller.id)
      .maybeSingle();

    if (meErr || !me) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
    if (!me.is_leader) return NextResponse.json({ error: 'Leader access required' }, { status: 403 });

    // fetch target member
    const { data: target, error: tErr } = await svc
      .from('profiles')
      .select('id, church_code, approval_status')
      .eq('id', memberId)
      .maybeSingle();

    if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (target.church_code !== me.church_code) {
      return NextResponse.json({ error: 'Cross-church action forbidden' }, { status: 403 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied';

    const { data: updated, error: uErr } = await svc
      .from('profiles')
      .update({ approval_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .select('id, email, full_name, role, approval_status, is_leader')
      .maybeSingle();

    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, member: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
