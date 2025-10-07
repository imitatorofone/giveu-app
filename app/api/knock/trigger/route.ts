import { NextRequest, NextResponse } from 'next/server';
import { Knock } from '@knocklabs/node';

const knock = new Knock(process.env.KNOCK_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { workflow, userId, data, recipient } = await request.json();

    // Build recipients array - support both userId and recipient object
    let recipients;
    if (recipient) {
      // New format: recipient object with phone_number
      recipients = [{
        id: userId,
        ...recipient
      }];
    } else {
      // Legacy format: just userId
      recipients = [userId];
    }

    console.log('Knock trigger request:', { workflow, recipients, data });

    await knock.workflows.trigger(workflow, {
      recipients: recipients,
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
