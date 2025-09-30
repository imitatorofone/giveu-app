import Knock from "@knocklabs/node";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.needId || !Array.isArray(body.recipients) || body.recipients.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
    }

    const apiKey = process.env.KNOCK_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: "KNOCK_API_KEY missing" }), { status: 500 });
    }

    const knock = new Knock(apiKey);

    const resp = await knock.workflows.trigger("need_match", {
      recipients: body.recipients,
      data: {
        needId: body.needId,
        matchedGifts: body.matchedGifts ?? [],
      },
    });

    console.log("[knock:need_match:resp]", resp);
    return new Response(JSON.stringify({ ok: true, stage: "knock", accepted: true }), { status: 202 });
  } catch (err: any) {
    // NEW: bubble up Knock's error payload if present
    const status = err?.statusCode ?? err?.status ?? 500;
    const payload = err?.body ?? err?.response?.data ?? { message: String(err) };
    console.error("[knock:need_match:error]", status, payload);
    return new Response(JSON.stringify({ ok: false, stage: "knock", status, error: payload }), {
      status,
      headers: { "content-type": "application/json" },
    });
  }
}