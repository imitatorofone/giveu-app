'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { supabaseBrowser as supabase } from '../../../lib/supabaseBrowser';
import { BRAND } from '../../../lib/brandConfig';

export default function NotificationOnboarding() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Check authentication on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('[NotificationOnboarding] No user found, redirecting to auth');
          router.push('/auth');
          return;
        }
        setUser(user);
        setLoading(false);
      } catch (error) {
        console.error('[NotificationOnboarding] Auth check error:', error);
        router.push('/auth');
      }
    };

    checkAuth();
  }, [router]);

  const handleRedirectBasedOnStatus = async () => {
    try {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('approval_status, church_code, role, gift_selections')
        .eq('id', user.id)
        .single();

      console.log('[NotificationOnboarding] Profile data:', profile);

      // Check if user has completed the survey (has church_code and gift_selections)
      const hasChurchCode = profile?.church_code && profile.church_code.trim() !== '';
      const hasGiftSelections = profile?.gift_selections && profile.gift_selections.length > 0;

      if (hasChurchCode && hasGiftSelections) {
        // User has completed survey, redirect to dashboard regardless of approval status
        console.log('[NotificationOnboarding] User completed survey, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        // User hasn't completed survey, redirect back to survey
        console.log('[NotificationOnboarding] User incomplete survey, redirecting to survey');
        router.push('/survey');
      }
    } catch (error) {
      console.error('[NotificationOnboarding] Error checking profile status:', error);
      // Fallback to dashboard if check fails
      router.push('/dashboard');
    }
  };

  const handleEnableNotifications = async () => {
    setProcessing(true);
    
    try {
      // Request browser notification permission
      console.log('[NotificationOnboarding] Requesting notification permission...');
      
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('[NotificationOnboarding] Permission result:', permission);
        
        if (permission === 'granted') {
          console.log('[NotificationOnboarding] ✅ Notification permission granted');
          // TODO: Add Expo token generation here in next step
        } else if (permission === 'denied') {
          console.log('[NotificationOnboarding] ❌ Notification permission denied');
        } else {
          console.log('[NotificationOnboarding] ⚠️ Notification permission dismissed');
        }
      } else {
        console.log('[NotificationOnboarding] ⚠️ Notifications not supported in this browser');
      }
    } catch (error) {
      console.error('[NotificationOnboarding] Error requesting notification permission:', error);
    } finally {
      setProcessing(false);
      // Redirect regardless of permission result
      await handleRedirectBasedOnStatus();
    }
  };

  const handleSkipNotifications = async () => {
    console.log('[NotificationOnboarding] User skipped notification setup');
    await handleRedirectBasedOnStatus();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        fontFamily: BRAND.fonts.heading
      }}>
        <div style={{
          fontSize: '18px',
          color: '#6b7280'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: BRAND.fonts.heading
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '48px 40px',
        boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        {/* Notification Bell Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: BRAND.colors.primary,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
          boxShadow: '0 4px 12px rgba(32, 201, 151, 0.3)'
        }}>
          <Bell size={40} color="white" />
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '600',
          color: BRAND.colors.text,
          marginBottom: '16px',
          fontFamily: BRAND.fonts.heading,
          lineHeight: '1.2'
        }}>
          Stay Connected
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '18px',
          color: BRAND.colors.textLight,
          lineHeight: '1.6',
          marginBottom: '40px',
          fontFamily: BRAND.fonts.body
        }}>
          We'll let you know when there are opportunities to serve that match your gifts, and when others respond to needs you share with the community.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Enable Notifications Button */}
          <button
            onClick={handleEnableNotifications}
            disabled={processing}
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: processing ? '#9ca3af' : BRAND.colors.primary,
              color: 'white',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              cursor: processing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: processing ? 'none' : '0 4px 12px rgba(32, 201, 151, 0.3)',
              fontFamily: BRAND.fonts.heading
            }}
            onMouseEnter={(e) => {
              if (!processing) {
                e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!processing) {
                e.currentTarget.style.backgroundColor = BRAND.colors.primary;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {processing ? 'Setting up notifications...' : 'Enable Notifications'}
          </button>

          {/* Skip Button */}
          <button
            onClick={handleSkipNotifications}
            disabled={processing}
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '500',
              border: '1px solid #d1d5db',
              cursor: processing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: BRAND.fonts.heading
            }}
            onMouseEnter={(e) => {
              if (!processing) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }
            }}
            onMouseLeave={(e) => {
              if (!processing) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#d1d5db';
              }
            }}
          >
            Skip for Now
          </button>
        </div>

        {/* Helpful Note */}
        <p style={{
          fontSize: '14px',
          color: '#9ca3af',
          marginTop: '24px',
          lineHeight: '1.5',
          fontFamily: BRAND.fonts.heading
        }}>
          You can always change notification settings later in your profile.
        </p>
      </div>
    </main>
  );
}
