import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser';

interface Notification {
  id: string;
  user_id: string;
  event_type: string;
  event_data: any;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // supabase is imported at the top of the file

  const fetchNotifications = useCallback(async () => {
    console.log('🔔 Fetching notifications...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔔 User:', user?.id);
      if (!user) return;

      // Fetch DIY notifications from Supabase
      const { data: diyNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('🔔 DIY Notifications data:', diyNotifications);
      console.log('🔔 DIY Notifications error:', error);

      if (error) throw error;

      // Fetch Knock messages
      let knockMessages: any[] = [];
      try {
        const knockResponse = await fetch(`/api/knock/messages?userId=${user.id}`);
        if (knockResponse.ok) {
          const knockData = await knockResponse.json();
          console.log('🔔 Knock API response:', knockData);
          
          // Transform Knock messages to match our notification format
          knockMessages = (knockData.messages || []).map((msg: any) => ({
            id: `knock_${msg.id}`,
            user_id: user.id,
            event_type: 'knock_message',
            event_data: {
              title: msg.content || 'New notification',
              path: '/dashboard', // Default path, could be extracted from Knock data
              knock_message: msg
            },
            read_at: msg.read_at,
            created_at: msg.created_at || msg.inserted_at
          }));
          
          // Log debug info
          if (knockData.debug) {
            console.log('🔔 Knock debug info:', knockData.debug);
          }
        } else {
          console.warn('🔔 Knock API returned error:', knockResponse.status, await knockResponse.text());
        }
      } catch (knockError) {
        console.warn('Failed to fetch Knock messages:', knockError);
        // Continue with DIY notifications even if Knock fails
      }

      // Combine and sort all notifications
      const allNotifications = [...(diyNotifications || []), ...knockMessages]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20); // Limit to 20 total

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const isKnockMessage = notificationId.startsWith('knock_');
      
      if (isKnockMessage) {
        // For Knock messages, we'll need a separate API endpoint to mark as read
        // For now, just update local state
        console.log('🔔 Marking Knock message as read:', notificationId);
      } else {
        // For DIY notifications, update in Supabase
        const { error } = await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notificationId);

        if (error) throw error;
      }

      // Update local state for both types
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Polling: fetch on mount, on focus, and every 60 seconds
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000); // 60 seconds
    
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // ← CRITICAL: Empty dependency array means this only runs once

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    refresh: fetchNotifications
  };
}
