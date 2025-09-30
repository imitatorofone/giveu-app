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

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('🔔 Notifications data:', data);
      console.log('🔔 Notifications error:', error);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read_at).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
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
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    refresh: fetchNotifications
  };
}
