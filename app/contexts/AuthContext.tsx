'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Emergency fallback: force loading to false after 25 seconds
  useEffect(() => {
    const emergencyTimer = setTimeout(() => {
      if (loading) {
        console.log('AuthContext: Emergency fallback - forcing loading to false');
        setLoading(false);
        // Try to get user from localStorage as fallback
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            console.log('AuthContext: Using stored user data as fallback');
            setUser(JSON.parse(storedUser));
          }
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
    }, 25000);

    return () => clearTimeout(emergencyTimer);
  }, [loading]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('AuthContext: Getting initial session...');
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve({ data: { session: null }, timeout: true }), 15000)
        );
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (result.timeout) {
          console.log('AuthContext: Session loading timeout - continuing without session');
          return;
        }
        
        const { data: { session } } = result;
        console.log('AuthContext: Initial session result:', { hasUser: !!session?.user, userEmail: session?.user?.email });
        
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        console.log('AuthContext: Setting loading to false (initial session)');
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, session?.user?.email);
        
        try {
          if (session?.user) {
            setUser(session.user);
            await loadProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        } catch (error) {
          console.error('AuthContext: Error in auth state change:', error);
        } finally {
          console.log('AuthContext: Setting loading to false (auth state change)');
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Loading profile for user:', userId);
      
      // Add timeout to prevent hanging
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ data: null, error: null, timeout: true }), 20000)
      );
      
      const result = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      if (result.timeout) {
        console.log('AuthContext: Profile loading timeout - continuing without profile');
        setProfile(null);
        return;
      }
      
      const { data: profileData, error } = result;
      
      if (error) {
        console.error('AuthContext: Profile loading error:', error);
        setProfile(null);
      } else {
        console.log('AuthContext: Profile loaded successfully:', !!profileData);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('AuthContext: Error loading profile:', error);
      setProfile(null);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
