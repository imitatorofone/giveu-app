export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getUser(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data } = await anon.auth.getUser(token);
  return data.user || null;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await ctx.params;
    const memberId = params.id;
    const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // caller profile
    const { data: me } = await svc
      .from('profiles')
      .select('id, is_leader, church_code')
      .eq('id', user.id)
      .maybeSingle();
    if (!me || !me.is_leader) return NextResponse.json({ error: 'Leader access required' }, { status: 403 });

    // target member
    const { data: member, error: mErr } = await svc
      .from('profiles')
      .select('id, email, full_name, role, approval_status, is_leader, church_code, city, phone, age, availability, gift_selections, selected_gift_categories')
      .eq('id', memberId)
      .maybeSingle();

        if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });
        if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (member.church_code !== me.church_code) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Fetch friendly church name
        let church_name: string | null = null;
        if (member.church_code) {
          const { data: church } = await svc
            .from('churches')
            .select('name')
            .eq('code', member.church_code)
            .maybeSingle();
          church_name = church?.name ?? null;
        }

        return NextResponse.json({ member: { ...member, church_name } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
