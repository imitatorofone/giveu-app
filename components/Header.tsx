'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser as supabase } from '../lib/supabaseBrowser';
import NotificationDropdown from './NotificationDropdown';
import { Edit2 } from 'lucide-react';

// Brand typography
const quicksandFont = 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif';
const merriweatherFont = 'Merriweather, Georgia, serif';

interface HeaderProps {
  profileActions?: React.ReactNode;
  onEditClick?: () => void;
}

export default function Header({ profileActions, onEditClick }: HeaderProps = {}) {
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
        {/* Left side - Edit button on profile page */}
        <div style={{ width: '44px', display: 'flex', alignItems: 'center' }}>
          {isProfilePage && onEditClick && (
            <button
              onClick={onEditClick}
              className="p-2 active:bg-gray-100 rounded-full transition-colors"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Edit profile"
            >
              <Edit2 size={22} style={{ color: '#374151' }} />
            </button>
          )}
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
        
        {/* Right side - Notifications */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {userId && (
            <NotificationDropdown />
          )}
        </div>
      </div>
    </header>
  );
}
