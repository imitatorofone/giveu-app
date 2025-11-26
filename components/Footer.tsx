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
  
  // Initialize isLeader state with safe default (no sessionStorage during SSR)
  const [isLeader, setIsLeader] = useState(false);

  // 🔧 DEBUG: Log every render
  console.log('🔧 Footer render - isLeader:', isLeader);
  console.log('🔧 Footer render - pathname:', pathname);

  useEffect(() => {
    // Guard: only run in browser
    if (typeof window === 'undefined') return;
    
    console.log('🔧 Footer component mounted/updated');
    console.log('🔧 isLeader value:', isLeader);
    console.log('🔧 Current pathname:', pathname);
    
    const run = async () => {
      try {
        // 🚀 PERFORMANCE: Check cache first
        const cachedRole = sessionStorage.getItem('user_role');
        const cachedChurchCode = sessionStorage.getItem('user_church_code');
        
        if (cachedRole) {
          const leaderStatus = cachedRole === 'leader' || cachedRole === 'admin';
          console.log('🔧 Footer useEffect: Using cached role:', { cachedRole, leaderStatus });
          // Only update state if it's different to prevent unnecessary re-renders
          setIsLeader(prev => {
            if (prev !== leaderStatus) {
              console.log('🔧 Footer useEffect: Updating isLeader from', prev, 'to', leaderStatus);
              return leaderStatus;
            }
            return prev;
          });
          setLoading(false);
          return; // ✅ Skip Supabase query!
        }

        // Only query if not cached
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLeader(prev => prev !== false ? false : prev);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('user_role', 'member');
          }
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
        
        console.log('🔧 Footer useEffect: Fresh profile data:', { role, isLeaderResult, profile: prof });
        
        // 🚀 PERFORMANCE: Cache the results
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('user_role', role || 'member');
          sessionStorage.setItem('user_is_leader', String(isLeaderResult));
          if (prof?.church_code) {
            sessionStorage.setItem('user_church_code', prof.church_code);
          }
        }
        
        setIsLeader(prev => {
          if (prev !== isLeaderResult) {
            console.log('🔧 Footer useEffect: Updating isLeader from', prev, 'to', isLeaderResult);
            return isLeaderResult;
          }
          return prev;
        });
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsLeader(prev => prev !== false ? false : prev);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // 🔧 DEBUG: Log component unmounting
  useEffect(() => {
    console.log('🔧 Footer component UNMOUNTING');
    return () => {
      console.log('🔧 Footer cleanup running');
    };
  }, []);

  // 🔧 DEBUG: Log route changes
  useEffect(() => {
    console.log('🔧 Route changed to:', pathname);
    console.log('🔧 isLeader after route change:', isLeader);
  }, [pathname]);

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

  // 🔧 DEBUG: Log tabs being rendered
  console.log('🔧 Tabs being rendered:', regularTabs.map(t => t.name));
  console.log('🔧 Tools/Feedback tab:', regularTabs.find(t => t.name === 'Tools' || t.name === 'Feedback'));

  const RegularTab = ({ tab }: { tab: typeof regularTabs[0] }) => {
    const Icon = tab.icon;
    const isActive = pathname === tab.path || 
                    (tab.path === '/dashboard' && pathname === '/') ||
                    (tab.path === '/leader/tools' && pathname.startsWith('/leader')) ||
                    (tab.path === '/feedback' && pathname === '/feedback');
    
    return (
      <button
        onClick={() => {
          console.log('🔧 TOOLS TAB CLICKED');
          console.log('🔧 Current isLeader state:', isLeader);
          if (typeof window !== 'undefined') {
            console.log('🔧 SessionStorage role:', sessionStorage.getItem('user_role'));
          }
          console.log('🔧 About to navigate to:', tab.path);
          console.log('🔧 Tab name:', tab.name);
          router.push(tab.path);
          console.log('🔧 After navigation triggered');
        }}
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
