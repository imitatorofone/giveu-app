import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { default: Knock } = await import('@knocklabs/node');
    const knock = new Knock({ apiKey: process.env.KNOCK_API_KEY! });
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { needId } = body;

    // Need lookup
    const { data: needRow, error: needErr } = await supabase
      .from('needs')
      .select('id, church_code, created_by')
      .eq('id', needId)
      .single();

    if (!needRow) {
      return NextResponse.json({ error: 'need-not-found', needId }, { status: 404 });
    }

    // Effective church (need → creator fallback)
    const { data: creator } = await supabase
      .from('profiles')
      .select('church_code')
      .eq('id', needRow.created_by)
      .single();

    const effectiveChurch = needRow.church_code ?? creator?.church_code ?? null;

    // Recipients
    const { data: rows, error: recErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('church_code', effectiveChurch)
      .eq('is_leader', true)
      .neq('id', needRow.created_by);

    const recipientIds = (rows ?? []).map(r => r.id);

    // If nobody to notify, exit cleanly
    if (recipientIds.length === 0) {
      return NextResponse.json({ ok: true, recipientIds, sent: 0 }, { status: 200 });
    }

    const recipientsForKnock = recipientIds.map(id => ({ id }));

    await knock.workflows.trigger('need_match', {
      recipients: recipientsForKnock,
      data: { needId },
    });

    return NextResponse.json({ ok: true, recipientIds, sent: recipientIds.length }, { status: 200 });
  } catch (err: any) {
    console.error('[knock] error:', err?.message || err);
    return NextResponse.json({ error: 'knock-failed', detail: String(err?.message || err) }, { status: 500 });
  }
}