// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { BRAND } from '../../lib/brandConfig';

type AuthState = 'checking' | 'authed' | 'anon';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [fullName, setFullName] = useState<string | null>(null);
  const router = useRouter();

  // Debug state changes
  useEffect(() => {
    console.log('[auth] State changed to:', authState);
  }, [authState]);

  useEffect(() => {
    console.log('[auth] Full name updated:', fullName);
  }, [fullName]);

  // Check authentication status on mount
  useEffect(() => {
    let isMounted = true;

        async function check() {
          console.log('[auth] mount → checking session');
          console.log('[auth] Supabase client config:', {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          });
          
          // Debug: Check localStorage for session data
          const sessionStorage = localStorage.getItem('sb-rydvyhzbudmtldmfelby-auth-token');
          console.log('[auth] localStorage session:', sessionStorage ? 'EXISTS' : 'MISSING');
          console.log('[auth] localStorage content:', sessionStorage);
          
          const { data, error } = await supabase.auth.getSession();
      console.log('[auth] getSession result:', { 
        hasSession: !!data.session, 
        hasUser: !!data.session?.user,
        userId: data.session?.user?.id,
        userEmail: data.session?.user?.email,
        error: error?.message 
      });
      
      if (error) {
        console.warn('[auth] getSession error', error);
        if (isMounted) {
          console.log('[auth] Setting state to anon due to error');
          setAuthState('anon');
        }
        return;
      }
      const session = data.session;
      console.log('[auth] session exists:', !!session);

      if (session?.user) {
        console.log('[auth] Valid user found:', session.user.email);
        
        // Fetch profile to check onboarding status
        try {
          console.log('[auth] Fetching profile for user:', session.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, church_code, role, gift_selections')
            .eq('id', session.user.id)
            .maybeSingle();
          
          console.log('[auth] Profile fetch result:', { 
            profile: profile?.full_name, 
            church_code: profile?.church_code,
            error: profileError?.message,
            fullProfile: profile // DEBUG: Show complete profile object
          });
          
          // DEBUG: Check if profile exists and what data it contains
          if (profile) {
            console.log('[auth] 🔍 DEBUG: Profile exists with data:', {
              id: profile.id,
              full_name: profile.full_name,
              church_code: profile.church_code,
              hasChurchCode: !!(profile.church_code && profile.church_code.trim() !== ''),
              profileKeys: Object.keys(profile)
            });
          } else {
            console.log('[auth] 🔍 DEBUG: No profile found for user:', session.user.id);
          }
          
          if (isMounted) setFullName(profile?.full_name ?? null);

          if (isMounted) {
            console.log('[auth] Setting state to authed');
            setAuthState('authed');
          }

          // Determine redirect based on profile completeness
          const hasChurchCode = profile?.church_code && profile.church_code.trim() !== '';
          const hasRole = profile?.role && profile.role.trim() !== '';
          const hasGiftSelections = profile?.gift_selections && profile.gift_selections.length > 0;
          
          console.log('[auth] Profile completeness check:', { 
            hasChurchCode, 
            hasRole,
            hasGiftSelections,
            church_code: profile?.church_code,
            role: profile?.role,
            gift_selections: profile?.gift_selections
          });

          // Determine redirect based on profile completeness
          let redirectPath;
          if (!hasChurchCode || !hasRole) {
            redirectPath = '/survey'; // Start from Step 1 (church + role selection)
          } else if (!hasGiftSelections) {
            redirectPath = '/survey?step=2'; // Skip to gift selection
          } else {
            redirectPath = '/dashboard'; // Complete profile
          }
          
          console.log(`[auth] Starting 3-second countdown to ${redirectPath}`);
          
          let n = 3;
          const id = setInterval(() => {
            n--;
            console.log('[auth] Countdown:', n);
            if (n <= 0) {
              clearInterval(id);
              console.log(`[auth] Redirecting to ${redirectPath}`);
              router.replace(redirectPath);
            }
          }, 1000);
          
        } catch (e) {
          console.log('[auth] profile fetch exception:', e);
          
          // If profile fetch fails, default to setup for safety
          if (isMounted) {
            console.log('[auth] Setting state to authed (fallback)');
            setAuthState('authed');
          }
          
          console.log('[auth] Starting 3-second countdown to survey (fallback)');
          let n = 3;
          const id = setInterval(() => {
            n--;
            console.log('[auth] Countdown:', n);
            if (n <= 0) {
              clearInterval(id);
              console.log('[auth] Redirecting to survey (fallback)');
              router.replace('/survey');
            }
          }, 1000);
        }
        return;
      }

      console.log('[auth] No valid session, setting state to anon');
      if (isMounted) setAuthState('anon');
    }

    check();
    return () => { isMounted = false };
  }, [router]);

  // Handle sign out with confirmation
  const handleSignOut = async () => {
    console.log('[auth] Sign out requested');
    
    if (confirm('Sign out? You\'ll need your email again to sign in.')) {
      console.log('[auth] User confirmed sign out');
      // Clear cached role
      sessionStorage.removeItem('user_role');
      await supabase.auth.signOut();
      console.log('[auth] Sign out complete, redirecting to auth');
      router.replace('/auth');
    } else {
      console.log('[auth] User cancelled sign out');
    }
  };

  async function handleSignIn() {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`
      }
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for the login link!');
    }
    setLoading(false);
  }

  if (authState === 'checking') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#f9fafb',
        padding: '48px 24px'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 24px'
            }}>
              <Image 
                src={BRAND.logo.path} 
                alt={BRAND.logo.alt} 
                width={90} 
                height={90}
                priority
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  borderRadius: '12px'
                }}
              />
            </div>
          </div>
          <div style={{ color: '#6b7280', fontSize: '16px' }}>Checking authentication...</div>
        </div>
      </div>
    );
  }

  if (authState === 'authed') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#f9fafb',
        padding: '48px 24px'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          {/* Logo Area */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 24px'
            }}>
              <Image 
                src={BRAND.logo.path} 
                alt={BRAND.logo.alt} 
                width={90} 
                height={90}
                priority
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  borderRadius: '12px'
                }}
              />
            </div>
            
            {/* Welcome Message */}
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '400', 
              marginBottom: '12px',
              color: '#111827',
              lineHeight: '1.2'
            }}>
              Welcome back{fullName ? `, ${fullName}` : ''} 👋
            </h1>
            
            {/* Tagline */}
            <p style={{ 
              fontSize: '18px', 
              color: '#374151',
              fontWeight: '500',
              lineHeight: '1.4'
            }}>
              Where your gifts meet God's work
            </p>
          </div>

          {/* Authenticated User Container */}
          <div style={{ 
            width: '100%',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '20px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ 
                fontSize: '16px', 
                color: BRAND.colors.primary,
                marginBottom: '24px',
                fontWeight: '500'
              }}>
                Redirecting you to the right place…
              </p>
              
              <button
                onClick={async () => {
                  // Get current user and profile to determine redirect
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) {
                    router.replace('/survey');
                    return;
                  }
                  
                  try {
                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('church_code, role, gift_selections')
                      .eq('id', user.id)
                      .maybeSingle();
                    
                    const hasChurchCode = profile?.church_code && profile.church_code.trim() !== '';
                    const hasRole = profile?.role && profile.role.trim() !== '';
                    const hasGiftSelections = profile?.gift_selections && profile.gift_selections.length > 0;
                    
                    let redirectPath;
                    if (!hasChurchCode || !hasRole) {
                      redirectPath = '/survey'; // Start from Step 1 (church + role selection)
                    } else if (!hasGiftSelections) {
                      redirectPath = '/survey?step=2'; // Skip to gift selection
                    } else {
                      redirectPath = '/dashboard'; // Complete profile
                    }
                    
                    router.replace(redirectPath);
                  } catch (error) {
                    console.error('Profile check failed:', error);
                    // Fallback to survey if profile check fails
                    router.replace('/survey');
                  }
                }}
                className="active:scale-95"
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  backgroundColor: BRAND.colors.primary,
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  minHeight: '56px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 12px rgba(32, 201, 151, 0.3)',
                  marginBottom: '16px'
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover;
                  e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onTouchEnd={(e) => {
                  const target = e.currentTarget;
                  setTimeout(() => {
                    if (target && target.style) {
                      target.style.backgroundColor = BRAND.colors.primary;
                      target.style.transform = 'scale(1)';
                    }
                  }, 150);
                }}
              >
                Continue
              </button>
              
              <button
                onClick={handleSignOut}
                className="active:bg-gray-50"
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '500',
                  minHeight: '48px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Switch account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // state === 'anon' → magic-link form UI
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f9fafb',
      padding: '48px 24px'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Logo Area */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 24px'
          }}>
            <Image 
              src={BRAND.logo.path} 
              alt="giveU Logo" 
              width={90} 
              height={90}
              style={{ 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                borderRadius: '12px'
              }}
            />
          </div>
          
          {/* Main Heading */}
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '400', 
            marginBottom: '12px',
            color: '#111827',
            lineHeight: '1.2'
          }}>
            sign in to <span style={{ color: BRAND.colors.primary, fontWeight: '700' }}>giveU</span>
          </h1>
          
          {/* Tagline */}
          <p style={{ 
            fontSize: '18px', 
            color: '#374151',
            fontWeight: '500',
            lineHeight: '1.4'
          }}>
            Where your gifts meet God's work
          </p>
        </div>

        {/* Form Container */}
        <div style={{ 
          width: '100%',
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        className="sm:p-10"
        >
          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                minHeight: '56px',
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = BRAND.colors.primary;
                e.target.style.boxShadow = '0 0 0 3px rgba(32, 201, 151, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <button
            onClick={handleSignIn}
            disabled={loading}
            className={!loading ? 'active:scale-95' : ''}
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: loading ? '#9ca3af' : BRAND.colors.primary,
              color: 'white',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              minHeight: '56px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(32, 201, 151, 0.3)'
            }}
            onTouchStart={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover;
                e.currentTarget.style.transform = 'scale(0.98)';
              }
            }}
            onTouchEnd={(e) => {
              if (!loading) {
                const target = e.currentTarget;
                setTimeout(() => {
                  if (target && target.style) {
                    target.style.backgroundColor = BRAND.colors.primary;
                    target.style.transform = 'scale(1)';
                  }
                }, 150);
              }
            }}
          >
            {loading ? 'Sending...' : 'Send Link'}
          </button>
          
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginTop: '20px',
            lineHeight: '1.4'
          }}>
            We'll send you a secure link to sign in
          </p>
        </div>
      </div>
    </div>
  );
}
