'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, CalendarDays, Plus, UserCircle, Settings, MessageSquare } from 'lucide-react';
import { supabaseBrowser as supabase } from '../lib/supabaseBrowser';
import { BRAND } from '../lib/brandConfig';

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLeader(false);
          return;
        }
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const norm = (v?: string) => (v ?? '').toLowerCase().trim();
        const role = norm(prof?.role);
        const isLeaderResult = role === 'leader' || role === 'admin';
        
        setIsLeader(isLeaderResult);
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsLeader(true);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const regularTabs = [
    {
      name: 'Ways to Serve',
      icon: Heart,
      path: '/dashboard'
    },
    {
      name: 'Commitments',
      icon: CalendarDays,
      path: '/commitments'
    },
    {
      name: 'Profile',
      icon: UserCircle,
      path: '/profile'
    },
    {
      name: isLeader ? 'Tools' : 'Feedback',
      icon: isLeader ? Settings : MessageSquare,
      path: isLeader ? '/leader/tools' : '/feedback'
    }
  ];

  const RegularTab = ({ tab }: { tab: typeof regularTabs[0] }) => {
    const Icon = tab.icon;
    const isActive = pathname === tab.path || 
                    (tab.path === '/dashboard' && pathname === '/') ||
                    (tab.path === '/leader/tools' && pathname.startsWith('/leader'));
    
    return (
      <button
        onClick={() => router.push(tab.path)}
        className="relative flex flex-col items-center justify-between active:opacity-70 transition-opacity"
        style={{ 
          minWidth: '72px',
          height: '64px',
          paddingTop: '6px',
          paddingBottom: '24px'
        }}
      >
        {/* Icon in upper area */}
        <div className="flex items-center justify-center" style={{ minWidth: '44px', minHeight: '44px' }}>
          <Icon 
            size={24}
            strokeWidth={isActive ? 2.5 : 2}
            style={{ color: isActive ? BRAND.colors.primary : '#9ca3af' }}
          />
        </div>
        
        {/* Text absolutely positioned at bottom */}
        <span 
          style={{ 
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            lineHeight: '14px',
            fontWeight: isActive ? 600 : 500,
            fontFamily: BRAND.fonts.heading,
            color: isActive ? BRAND.colors.primary : '#6b7280',
            whiteSpace: 'nowrap'
          }}
        >
          {tab.name}
        </span>
      </button>
    );
  };

  if (loading) {
    return (
      <>
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
          style={{ 
            height: '64px',
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)',
            paddingBottom: 'env(safe-area-inset-bottom, 8px)'
          }}
        >
          <div className="relative h-full flex items-center justify-around max-w-screen-xl mx-auto px-4">
            <div className="relative flex flex-col items-center justify-between opacity-50" style={{ minWidth: '64px', height: '64px', paddingTop: '8px', paddingBottom: '24px' }}>
              <div className="flex items-center justify-center">
                <div style={{ width: '22px', height: '22px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
              </div>
            </div>
            <div className="relative flex flex-col items-center justify-between opacity-50" style={{ minWidth: '64px', height: '64px', paddingTop: '8px', paddingBottom: '24px' }}>
              <div className="flex items-center justify-center">
                <div style={{ width: '22px', height: '22px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
              </div>
            </div>
            <div style={{ width: '70px' }} />
            <div className="relative flex flex-col items-center justify-between opacity-50" style={{ minWidth: '64px', height: '64px', paddingTop: '8px', paddingBottom: '24px' }}>
              <div className="flex items-center justify-center">
                <div style={{ width: '22px', height: '22px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
              </div>
            </div>
            <div className="relative flex flex-col items-center justify-between opacity-50" style={{ minWidth: '64px', height: '64px', paddingTop: '8px', paddingBottom: '24px' }}>
              <div className="flex items-center justify-center">
                <div style={{ width: '22px', height: '22px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </nav>
        
        <div 
          className="fixed left-1/2 z-50 opacity-50"
          style={{
            bottom: 'calc(34px + env(safe-area-inset-bottom, 8px))',
            transform: 'translateX(-50%)'
          }}
        >
          <button
            className="flex items-center justify-center rounded-full"
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: BRAND.colors.primary,
              border: 'none',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.18), 0 3px 12px rgba(0, 0, 0, 0.12)'
            }}
          >
            <Plus size={28} className="text-white" strokeWidth={2.5} />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Nav bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
        style={{ 
          height: '64px',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)'
        }}
      >
        <div className="relative h-full flex items-center justify-around max-w-screen-xl mx-auto px-4">
          <RegularTab tab={regularTabs[0]} />
          <RegularTab tab={regularTabs[1]} />
          
          {/* Spacer for center button */}
          <div style={{ width: '70px' }} />
          
          <RegularTab tab={regularTabs[2]} />
          <RegularTab tab={regularTabs[3]} />
        </div>
      </nav>

      {/* Center button - button only, NO text */}
      <div 
        className="fixed left-1/2 z-50"
        style={{
          bottom: 'calc(34px + env(safe-area-inset-bottom, 8px))',
          transform: 'translateX(-50%)'
        }}
      >
        <button
          onClick={() => router.push('/share-need?modal=1')}
          className="flex items-center justify-center rounded-full active:scale-95 transition-transform"
          style={{
            width: '60px',
            height: '60px',
            backgroundColor: BRAND.colors.primary,
            border: 'none',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.18), 0 3px 12px rgba(0, 0, 0, 0.12)'
          }}
        >
          <Plus size={28} className="text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Text - SEPARATE element, same level as nav */}
      <span 
        className="fixed left-1/2"
        style={{ 
          bottom: '10px',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          lineHeight: '14px',
          fontWeight: 600,
          fontFamily: BRAND.fonts.heading,
          color: BRAND.colors.primary,
          whiteSpace: 'nowrap',
          zIndex: 51
        }}
      >
        Share a Need
      </span>
    </>
  );
}
