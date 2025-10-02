import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { config } = await import('dotenv');
  config({ path: require('node:path').join(process.cwd(), '.env.local') });
  
  const envPath = path.join(process.cwd(), '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');

  // Try to parse the keys directly from the file (without printing secrets)
  const apiMatch = raw.match(/^\s*KNOCK_API_KEY\s*=\s*(.+)\s*$/m);
  const secMatch = raw.match(/^\s*KNOCK_SECRET_KEY\s*=\s*(.+)\s*$/m);
  const parsedKey = (apiMatch?.[1]?.trim() || secMatch?.[1]?.trim() || '');

  if (!process.env.KNOCK_API_KEY && parsedKey) process.env.KNOCK_API_KEY = parsedKey;

  console.log('[probe] env-after-set:', { KNOCK_API_KEY: !!process.env.KNOCK_API_KEY });
  
  const { default: Knock } = await import('@knocklabs/node');
  const knock = new Knock({ apiKey: process.env.KNOCK_API_KEY! });
  console.log('[probe] after-knock-init');
  
  // --- recipient probe (no send yet) ---
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { needId } = body;

  // 1) Need lookup
  const { data: needRow, error: needErr } = await supabase
    .from('needs')
    .select('id, church_code, created_by')
    .eq('id', needId)
    .single();

  console.log('[probe] need:', { needId, found: !!needRow, needErr: needErr?.message || null });
  if (!needRow) {
    return NextResponse.json({ error: 'need-not-found', needId }, { status: 404 });
  }

  // 2) Effective church (need → creator fallback)
  const { data: creator } = await supabase
    .from('profiles')
    .select('church_code')
    .eq('id', needRow.created_by)
    .single();

  const effectiveChurch = needRow.church_code ?? creator?.church_code ?? null;

  // 3) Recipients
  const { data: rows, error: recErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('church_code', effectiveChurch)
    .eq('is_leader', true)
    .neq('id', needRow.created_by);

  const recipientIds = (rows ?? []).map(r => r.id);

  console.log('[probe] recipients:', {
    effectiveChurch,
    count: recipientIds.length,
    ids: recipientIds,
    recErr: recErr?.message || null,
  });

  // If nobody to notify, exit cleanly
  if (recipientIds.length === 0) {
    return NextResponse.json({ ok: true, recipientIds, sent: 0 }, { status: 200 });
  }

  try {
    const result = await knock.workflows.trigger('need_match', {
      recipients: recipientIds,
      data: { needId },
    });
    console.log('[probe] knock result:', result?.id || result);
    return NextResponse.json({ ok: true, recipientIds, sent: recipientIds.length }, { status: 200 });
  } catch (err: any) {
    console.error('[probe] knock error:', err?.status || '', err?.message || err);
    return NextResponse.json({ error: 'knock-failed', detail: String(err?.message || err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ alive: true }, { status: 200 });
}