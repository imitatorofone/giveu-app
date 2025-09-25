'use client';

import { usePathname } from 'next/navigation';
import { Heart, CalendarDays, Plus, UserCircle, MessageCircle } from 'lucide-react';
import LeadershipTools from './LeadershipTools';

export default function Footer() {
  const pathname = usePathname();
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
        
          {/* Leaders see Leadership Tools; everyone else sees Feedback */}
          <LeadershipTools pathname={pathname} />
          
          {/* Fallback Feedback button for non-leaders */}
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
            }}>
            <MessageCircle size={24} />
          <span style={{ 
            fontSize: '12px', 
            marginTop: '4px', 
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: '600'
          }}>
            Feedback
          </span>
        </button>
      </div>
    </nav>
  );
}
