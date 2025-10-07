import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notificationHelper';

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
      me = inserted;

      // Notify leaders about new member join request
      try {
        console.log('[Members API] New profile created, notifying leaders...');
        
        // Get all leaders in the same church
        const { data: leaders, error: leadersError } = await svc
          .from('profiles')
          .select('id')
          .eq('church_code', me.church_code)
          .eq('is_leader', true);

        if (leadersError) {
          console.error('[Members API] Error fetching leaders:', leadersError);
        } else if (leaders && leaders.length > 0) {
          const memberName = me.full_name || 'A new member';
          
          for (const leader of leaders) {
            // Skip notifying the new member if they're also a leader
            if (leader.id === me.id) continue;
            
            console.log('[Members API] Notifying leader:', leader.id);
            
            // Create DIY in-app notification
            await createNotification({
              userId: leader.id,
              eventType: 'member.join_request',
              title: 'New Member Wants to Join',
              description: `${memberName} wants to join your church community`,
              path: '/leader/members',
              needId: null,
              need_title: null
            });
            
            // Trigger Knock workflow for push notification
            try {
              const knockResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/knock/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  workflow: 'member_join_request',
                  userId: leader.id,
                  data: {
                    member_name: memberName,
                    member_id: me.id,
                    church_code: me.church_code
                  }
                })
              });

              if (knockResponse.ok) {
                console.log('[Members API] ✅ Knock workflow triggered for member_join_request to leader:', leader.id);
              } else {
                console.warn('[Members API] Knock trigger failed for leader:', leader.id, knockResponse.status);
              }
            } catch (knockError) {
              console.warn('[Members API] Knock trigger error for leader:', leader.id, knockError);
            }
          }
          
          console.log(`[Members API] Sent member_join_request notifications to ${leaders.length} leaders`);
        } else {
          console.log('[Members API] No leaders found to notify');
        }
      } catch (notificationError) {
        console.error('[Members API] Error in member join notification logic:', notificationError);
        // Don't fail profile creation if notifications fail
      }
    }

    // Guard: leader only
    if (!me || !me.is_leader) {
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
    if (me.church_code) {
      const { data: church, error: churchErr } = await svc
        .from('churches')
        .select('name')
        .eq('code', me.church_code)
        .maybeSingle();

      if (church) {
        church_name = church.name;
      } else {
        // If church not found, create it with a default name
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
