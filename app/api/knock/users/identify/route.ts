import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { Knock } = await import('@knocklabs/node');
    const knock = new Knock({ apiKey: process.env.KNOCK_API_KEY! });

    const { userId, email, name } = await req.json();

    // update() creates the user if they don't exist
    await knock.users.update(userId, {
      email,
      name,
    });

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('[knock/users/identify] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
