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
        // 🚀 PERFORMANCE: Check cache first
        const cachedRole = sessionStorage.getItem('user_role');
        const cachedChurchCode = sessionStorage.getItem('user_church_code');
        
        if (cachedRole) {
          setIsLeader(cachedRole === 'leader' || cachedRole === 'admin');
          setLoading(false);
          return; // ✅ Skip Supabase query!
        }

        // Only query if not cached
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLeader(false);
          sessionStorage.setItem('user_role', 'member');
          return;
        }
        
        const { data: prof } = await supabase
          .from('profiles')
          .select('role, is_leader, church_code')
          .eq('id', user.id)
          .single();

        const norm = (v?: string) => (v ?? '').toLowerCase().trim();
        const role = norm(prof?.role);
        const isLeaderResult = prof?.is_leader || role === 'leader' || role === 'admin';
        
        // 🚀 PERFORMANCE: Cache the results
        sessionStorage.setItem('user_role', role || 'member');
        sessionStorage.setItem('user_is_leader', String(isLeaderResult));
        if (prof?.church_code) {
          sessionStorage.setItem('user_church_code', prof.church_code);
        }
        
        setIsLeader(isLeaderResult);
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsLeader(false);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const regularTabs = [
    {
      name: 'Serve',
      icon: Heart,
      path: '/dashboard'
    },
    {
      name: 'Plans',
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
                    (tab.path === '/leader/tools' && pathname.startsWith('/leader')) ||
                    (tab.path === '/feedback' && pathname === '/feedback');
    
    return (
      <button
        onClick={() => router.push(tab.path)}
        className="flex flex-col items-center gap-1 active:opacity-70 transition-opacity min-w-[60px]"
      >
        <Icon 
          size={24}
          strokeWidth={isActive ? 2.5 : 2}
          className={isActive ? '' : 'text-gray-600'}
          style={{ color: isActive ? BRAND.colors.primary : undefined }}
        />
        
        <span 
          className={`text-xs ${isActive ? 'font-semibold' : ''}`}
          style={{ 
            fontFamily: BRAND.fonts.heading,
            color: isActive ? BRAND.colors.primary : '#6b7280'
          }}
        >
          {tab.name}
        </span>
      </button>
    );
  };

  if (loading) {
    return (
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
        style={{ 
          height: '64px',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)'
        }}
      >
        <div className="relative h-full flex items-end justify-between max-w-lg mx-auto px-6 opacity-50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-0.5" style={{ width: '64px', paddingTop: '8px', paddingBottom: '8px' }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
              <div style={{ width: '32px', height: '10px', backgroundColor: '#e5e7eb', borderRadius: '2px', marginTop: '2px' }} />
            </div>
          ))}
        </div>
      </nav>
    );
  }

  const CenterButton = () => {
    const isActive = pathname === '/share-need';
    
    return (
      <button
        onClick={() => router.push('/share-need?modal=1')}
        className="flex flex-col items-center gap-1 -mt-6 active:scale-95 transition-all min-w-[60px]"
      >
        <div className="w-16 h-16 bg-[#20c997] rounded-full flex items-center justify-center shadow-lg mb-1">
          <Plus size={32} className="text-white" strokeWidth={2.5} />
        </div>
        <span 
          className="text-xs font-medium"
          style={{ 
            fontFamily: BRAND.fonts.heading,
            color: BRAND.colors.primary
          }}
        >
          Share
        </span>
      </button>
    );
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
      style={{ 
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)',
        paddingTop: '2px',
        paddingBottom: 'calc(6px + env(safe-area-inset-bottom, 8px))'
      }}
    >
      <div className="relative flex items-end justify-around max-w-md mx-auto px-4">
        <RegularTab tab={regularTabs[0]} />
        <RegularTab tab={regularTabs[1]} />
        <CenterButton />
        <RegularTab tab={regularTabs[2]} />
        <RegularTab tab={regularTabs[3]} />
      </div>
    </nav>
  );
}
