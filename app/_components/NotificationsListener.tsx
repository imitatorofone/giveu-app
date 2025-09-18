'use client';

import { useEffect } from 'react';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser';

async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// TEMP: basic toast so we can see it works.
// Later we'll swap to shadcn or Sonner.
function showToast(title: string, description?: string) {
  alert(`${title}\n${description ?? ''}`);
}

export default function NotificationsListener() {
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    (async () => {
      const userId = await getCurrentUserId();
      if (!isMounted || !userId) return;

      channel = supabase
        .channel('realtime:notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const n: any = payload.new;
            showToast(n.title, n.body);
          }
        )
        .subscribe();
    })();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
