'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser as supabase } from '../lib/supabaseBrowser';
import NotificationDropdown from './NotificationDropdown';

// Brand typography
const quicksandFont = 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif';
const merriweatherFont = 'Merriweather, Georgia, serif';

export default function Header() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
        // Check if user is a leader
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_leader')
          .eq('id', session.user.id)
          .single();
        
        setIsLeader(profile?.is_leader || false);
      }
    };

    checkUser();
  }, []);

  return (
    <header style={{ 
      backgroundColor: 'white', 
      borderBottom: '1px solid #e5e7eb',
      padding: '12px 24px',
      fontFamily: merriweatherFont
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ 
            fontWeight: '700', 
            fontSize: '18px', 
            color: 'white',
            fontFamily: quicksandFont,
            backgroundColor: '#20c997',
            padding: '4px 16px',
            borderRadius: '20px',
            display: 'inline-block'
          }}>giveU</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {userId && (
            <NotificationDropdown />
          )}
        </div>
      </div>
    </header>
  );
}
