import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Read bearer token from header and decode user via anon client
async function getUserFromAuthHeader(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data } = await anon.auth.getUser(token);
  return data.user || null;
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // --- SELF-HEAL: ensure profiles row exists and is aligned to auth.users.id
    // 1) Try fetch by id
    let { data: me, error: meErr } = await svc
      .from('profiles')
      .select('id, email, church_code, is_leader, role, approval_status')
      .eq('id', user.id)
      .maybeSingle();

    // 2) If not found, try by email (older rows were keyed by email)
    if ((!me || meErr) && user.email) {
      const { data: byEmail } = await svc
        .from('profiles')
        .select('id, email, church_code, is_leader, role, approval_status')
        .eq('email', user.email)
        .maybeSingle();

      if (byEmail && byEmail.id !== user.id) {
        // realign id to auth id
        const { error: alignErr } = await svc
          .from('profiles')
          .update({ id: user.id })
          .eq('id', byEmail.id);
        if (!alignErr) me = { ...byEmail, id: user.id };
      } else if (byEmail) {
        me = byEmail;
      }
    }

    // 3) Still missing? create it now with Harmony defaults for this beta
    if (!me) {
      const { data: inserted, error: insErr } = await svc
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: (user.email || '').split('@')[0],
          role: user.email === 'imitatorofone@gmail.com' ? 'leader' : 'member',
          approval_status: 'approved',
          is_leader: user.email === 'imitatorofone@gmail.com',
          church_code: '123harmony',
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (insErr) {
        return NextResponse.json({ error: `Profile create failed: ${insErr.message}` }, { status: 500 });
      }
      me = inserted!;
    }

    // Guard: leader only
    if (!me.is_leader) {
      return NextResponse.json({ error: 'Leader access required' }, { status: 403 });
    }

        // Fetch members in same church - split into approved and pending
        const { data: allMembers, error: membersErr } = await svc
          .from('profiles')
          .select('id, email, full_name, role, approval_status, is_leader, city, gift_selections')
          .eq('church_code', me.church_code)
          .order('is_leader', { ascending: false });

    if (membersErr) {
      return NextResponse.json({ error: membersErr.message }, { status: 500 });
    }

    // Split members into approved and pending arrays
    const approved = allMembers?.filter(m => m.approval_status === 'approved') || [];
    const pending = allMembers?.filter(m => m.approval_status !== 'approved') || [];

    // Fetch friendly church name
    let church_name: string | null = null;
    console.log('🔍 User church_code:', me.church_code);
    
    // First, let's see what's in the churches table
    const { data: allChurches, error: allChurchesErr } = await svc
      .from('churches')
      .select('*');
    console.log('🔍 All churches in database:', { allChurches, allChurchesErr });
    
    if (me.church_code) {
      const { data: church, error: churchErr } = await svc
        .from('churches')
        .select('name')
        .eq('code', me.church_code)
        .maybeSingle();
      console.log('🔍 Church lookup result:', { church, churchErr });
      
      if (church) {
        church_name = church.name;
      } else {
        // If church not found, create it with a default name
        console.log('🔍 Church not found, creating default entry for code:', me.church_code);
        const defaultName = me.church_code === '123harmony' ? 'Harmony Church' : `${me.church_code} Church`;
        
        const { data: newChurch, error: createErr } = await svc
          .from('churches')
          .upsert({
            code: me.church_code,
            name: defaultName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('name')
          .maybeSingle();
        
        console.log('🔍 Created church:', { newChurch, createErr });
        church_name = newChurch?.name ?? defaultName;
      }
    }

    return NextResponse.json({ 
      me: { id: me.id, email: me.email, church_code: me.church_code, is_leader: me.is_leader, church_name },
      approved,
      pending,
      counts: { approved: approved.length, pending: pending.length }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}