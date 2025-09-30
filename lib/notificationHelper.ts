import { supabaseBrowser as supabase } from '../lib/supabaseBrowser';

export async function createNotification(params: {
  userId: string;
  eventType: string;
  eventData: any;
}) {
  
  try {
    console.log('🔔 Creating notification:', params);
    
    // Insert directly into notifications table
    // The webhook will automatically send it to Knock
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        event_type: params.eventType,
        event_data: params.eventData
      });

    if (error) {
      console.error('Failed to create notification:', error);
    } else {
      console.log('🔔 Notification created successfully');
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}
