import { NextRequest, NextResponse } from 'next/server';
import { Knock } from '@knocklabs/node';

const knock = new Knock(process.env.KNOCK_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { workflow, userId, data } = await request.json();

    await knock.workflows.trigger(workflow, {
      recipients: [userId],
      data: data
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Knock trigger error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
