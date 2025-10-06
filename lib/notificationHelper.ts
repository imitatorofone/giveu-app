import { createClient } from '@supabase/supabase-js';

export async function createNotification({
  userId, eventType, title, description, path, needId,
  need_title, volunteer_name, volunteer_id,
}: {
  userId: string
  eventType: string
  title?: string
  description?: string
  path?: string
  needId?: string
  need_title?: string
  volunteer_name?: string
  volunteer_id?: string
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const event_data = {
    title,
    description,
    path: path ?? "/dashboard",
    need_id: needId ?? null,
    need_title: need_title ?? null,
    volunteer_name: volunteer_name ?? null,
    volunteer_id: volunteer_id ?? null,
  };

  try {
    console.log('🔔 Creating notification:', { userId, eventType, event_data });
    
    // Check if notification already exists (for volunteer signups)
    if (eventType === 'volunteer.signed_up' && needId) {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'volunteer.signed_up')
        .contains('event_data', { need_id: needId })
        .maybeSingle();

      if (existing) {
        console.log('🔔 Notification already exists, skipping');
        return;
      }
    }
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data,
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
