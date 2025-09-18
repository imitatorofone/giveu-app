'use client';

import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

interface LayoutWithNotificationsProps {
  children: React.ReactNode;
}

export default function LayoutWithNotifications({ children }: LayoutWithNotificationsProps) {
  const { user, profile, loading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Debug logging
  console.log('LayoutWithNotifications render:', { loading, user: !!user, profile: !!profile });

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('LayoutWithNotifications: Loading timeout reached');
        setLoadingTimeout(true);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timer);
  }, [loading]);

  // Reset timeout when loading changes
  useEffect(() => {
    if (!loading) {
      setLoadingTimeout(false);
    }
  }, [loading]);

  if (loading && !loadingTimeout) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div>Loading...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {user ? 'Loading your profile...' : 'Checking authentication...'}
        </div>
        <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
          Debug: loading={loading.toString()}, user={user ? 'exists' : 'null'}, profile={profile ? 'exists' : 'null'}
        </div>
      </div>
    );
  }

  if (loadingTimeout) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px'
      }}>
        <div>Loading timeout</div>
        <p style={{ textAlign: 'center', maxWidth: '400px' }}>
          Something went wrong while loading. You can try refreshing or continue anyway.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => {
              try {
                window.location.reload();
              } catch (error) {
                console.error('Error refreshing page:', error);
                // Fallback: try to navigate to home page
                window.location.href = '/';
              }
            }}
            style={{
              background: '#20c997',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          <button 
            onClick={() => {
              setLoadingTimeout(false);
            }}
            style={{
              background: '#666',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Main Content - No header here, handled by individual pages */}
      {children}
    </div>
  );
}
