// @ts-nocheck
// RESERVED FOR FUTURE PUSH NOTIFICATIONS
// This endpoint exists but is not currently used for in-app notifications.
// DIY notifications (Supabase) handle all in-app messaging.
// This will be activated when we implement push notification delivery via Knock.

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Check environment variables first
    const apiKey = process.env.KNOCK_API_KEY;
    console.log('[knock/messages] API key present:', !!apiKey);
    console.log('[knock/messages] API key prefix:', apiKey?.substring(0, 15));
    
    if (!apiKey) {
      return NextResponse.json({ error: 'KNOCK_API_KEY not configured' }, { status: 500 });
    }

    const { Knock } = await import('@knocklabs/node');
    const knock = new Knock({ apiKey });

    // Get userId from query param for testing
    const userId = req.nextUrl.searchParams.get('userId');
    console.log('[knock/messages] UserId:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Check if the method exists
    console.log('[knock/messages] knock.users methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(knock.users)));

    // Try different approaches to get messages
    let result;
    
    try {
      // First try: listMessages with no filters
      result = await knock.users.listMessages(userId, {
        page_size: 50
      });
      console.log('[knock/messages] listMessages result:', result);
      
      // COMMENTED OUT: total_count doesn't exist in Knock API response type
      // if (result.page_info?.total_count > 0 && (!result.entries || result.entries.length === 0)) {
      //   console.log('[knock/messages] Found total_count but no entries, trying to get all messages...');
      //   
      //   // Try with different parameters
      //   const allResult = await knock.users.listMessages(userId, {
      //     page_size: 100,
      //     status: 'unread'
      //   });
      //   console.log('[knock/messages] All messages (unread):', allResult);
      //   
      //   if (allResult.entries && allResult.entries.length > 0) {
      //     result = allResult;
      //   } else {
      //     // Try with read messages
      //     const readResult = await knock.users.listMessages(userId, {
      //       page_size: 100,
      //       status: 'read'
      //     });
      //     console.log('[knock/messages] All messages (read):', readResult);
      //     
      //     if (readResult.entries && readResult.entries.length > 0) {
      //       result = readResult;
      //     }
      //   }
      // }
    } catch (listError) {
      console.log('[knock/messages] listMessages failed:', listError);
      
      // Second try: try without any parameters
      result = await knock.users.listMessages(userId);
      console.log('[knock/messages] listMessages (no params) result:', result);
    }

    console.log('[debug] full result:', JSON.stringify(result, null, 2));

    return NextResponse.json({ 
      count: result.entries?.length || 0,
      messages: result.entries || [],
      metadata: result.page_info || {},
      debug: {
        total_count: result.page_info?.total_count,
        has_after: !!result.page_info?.after,
        has_before: !!result.page_info?.before,
        page_size: result.page_info?.page_size
      }
    });
  } catch (error: any) {
    console.error('[knock/messages] error:', error);
    console.error('[knock/messages] error status:', error.status);
    console.error('[knock/messages] error message:', error.message);
    console.error('[knock/messages] error details:', error.details);
    return NextResponse.json({ 
      error: error.message,
      status: error.status,
      details: error.details 
    }, { status: 500 });
  }
}
