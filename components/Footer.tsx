'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Heart, CalendarDays, Plus, UserCircle, Settings, MessageSquare } from 'lucide-react';
import { supabaseBrowser as supabase } from '../lib/supabaseBrowser';

export default function Footer() {
  const pathname = usePathname();
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
        
        console.log('[Footer] User role check:', { 
          userId: user.id, 
          profile: prof, 
          role, 
          isLeader: isLeaderResult 
        });
        
        setIsLeader(isLeaderResult);
      } catch (error) {
        console.error('Error checking user role:', error);
        // Default to showing Tools for leaders when role check fails
        setIsLeader(true);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Render loading skeleton to keep layout stable
  if (loading) {
    return (
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '16px 0 12px 0'
      }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
          {/* Existing buttons */}
          <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', flex: 1 }}>
            <Heart size={24} />
            <span style={{ fontSize: '12px', marginTop: '4px', fontFamily: 'Quicksand, sans-serif', fontWeight: '600' }}>Ways to Serve</span>
          </button>
          <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', flex: 1 }}>
            <CalendarDays size={24} />
            <span style={{ fontSize: '12px', marginTop: '4px', fontFamily: 'Quicksand, sans-serif', fontWeight: '600' }}>Commitments</span>
          </button>
          <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', flex: 1 }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#20c997', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid white', boxShadow: '0 6px 20px rgba(32, 201, 151, 0.4)', marginBottom: '4px', marginTop: '-20px' }}>
              <Plus size={32} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'Quicksand, sans-serif', color: '#374151', fontWeight: '600' }}>Share a Need</span>
          </button>
          <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', flex: 1 }}>
            <UserCircle size={24} />
            <span style={{ fontSize: '12px', marginTop: '4px', fontFamily: 'Quicksand, sans-serif', fontWeight: '600' }}>Profile</span>
          </button>
          {/* Loading skeleton for last button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', flex: 1, opacity: 0.5 }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
            <div style={{ width: '40px', height: '12px', backgroundColor: '#e5e7eb', borderRadius: '2px', marginTop: '4px' }} />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '1px solid #e5e7eb',
      padding: '16px 0 12px 0'
    }}>
      <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            color: pathname === '/dashboard' ? '#20c997' : '#9ca3af',
            cursor: 'pointer',
            flex: 1
          }}>
          <Heart size={24} />
          <span style={{ 
            fontSize: '12px', 
            marginTop: '4px', 
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: '600'
          }}>
            Ways to Serve
          </span>
        </button>
        
        <button 
          onClick={() => window.location.href = '/commitments'}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            color: pathname === '/commitments' ? '#20c997' : '#9ca3af',
            cursor: 'pointer',
            flex: 1
          }}>
            <CalendarDays size={24} />
          <span style={{ 
            fontSize: '12px', 
            marginTop: '4px', 
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: '600'
          }}>
            Commitments
          </span>
        </button>
        
        <button 
          onClick={() => window.location.href = '/share-need?modal=1'}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0 8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            flex: 1
          }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#20c997',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '4px solid white',
            boxShadow: '0 6px 20px rgba(32, 201, 151, 0.4)',
            marginBottom: '4px',
            marginTop: '-20px'
          }}>
            <Plus size={32} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ 
            fontSize: '12px', 
            fontFamily: 'Quicksand, sans-serif',
            color: '#374151',
            fontWeight: '600'
          }}>
            Share a Need
          </span>
        </button>
        
        <button 
          onClick={() => window.location.href = '/profile'}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            color: pathname === '/profile' ? '#20c997' : '#9ca3af',
            cursor: 'pointer',
            flex: 1
          }}>
          <UserCircle size={24} />
          <span style={{ 
            fontSize: '12px', 
            marginTop: '4px', 
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: '600'
          }}>
            Profile
          </span>
        </button>
        
          {/* Role-gated: Leadership Tools for leaders/admins, Feedback for others */}
          {isLeader ? (
            // Leadership Tools for leaders/admins
            <button 
              onClick={() => window.location.href = '/leader/tools'}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 4px',
                background: 'none',
                border: 'none',
                color: pathname.startsWith('/leader/tools') ? '#20c997' : '#9ca3af',
                cursor: 'pointer',
                flex: 1
              }}
              aria-label="Leadership Tools"
              aria-current={pathname.startsWith('/leader/tools') ? 'page' : undefined}
            >
              <Settings size={24} />
              <span style={{ 
                fontSize: '12px', 
                marginTop: '4px', 
                fontFamily: 'Quicksand, sans-serif',
                fontWeight: '600'
              }}>
                Tools
              </span>
            </button>
          ) : (
            // Feedback for non-leaders
            <button 
              onClick={() => window.location.href = '/feedback'}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 4px',
                background: 'none',
                border: 'none',
                color: pathname === '/feedback' ? '#20c997' : '#9ca3af',
                cursor: 'pointer',
                flex: 1
              }}
              aria-label="Feedback"
              aria-current={pathname === '/feedback' ? 'page' : undefined}
            >
              <MessageSquare size={24} />
              <span style={{ 
                fontSize: '12px', 
                marginTop: '4px', 
                fontFamily: 'Quicksand, sans-serif',
                fontWeight: '600'
              }}>
                Feedback
              </span>
            </button>
          )}
      </div>
    </nav>
  );
}
