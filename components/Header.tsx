'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser as supabase } from '../lib/supabaseBrowser';
import NotificationDropdown from './NotificationDropdown';

// Brand typography
const quicksandFont = 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif';
const merriweatherFont = 'Merriweather, Georgia, serif';

interface HeaderProps {
  profileActions?: React.ReactNode;
}

export default function Header({ profileActions }: HeaderProps = {}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isProfilePage = pathname === '/profile';

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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm" style={{ 
      fontFamily: merriweatherFont
    }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ 
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Left spacer for balance (empty when no profile actions) */}
        <div className="w-10" style={{ minWidth: isProfilePage ? 'auto' : '40px' }}>
          {/* Profile actions appear here on profile page, otherwise empty for balance */}
        </div>
        
        {/* Centered Logo */}
        <div className="flex items-center justify-center flex-1">
          <button
            onClick={() => router.push('/dashboard')}
            className="active:scale-95 transition-transform"
            style={{ 
              fontWeight: '700', 
              fontSize: '20px', 
              color: 'white',
              fontFamily: quicksandFont,
              backgroundColor: '#20c997',
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            giveU
          </button>
        </div>
        
        {/* Right side - Notifications (and profile actions if on profile page) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isProfilePage && profileActions}
          {userId && (
            <NotificationDropdown />
          )}
        </div>
      </div>
    </header>
  );
}
