'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SettingsList from '../../components/SettingsList';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes.user?.id;
        
        if (!userId) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Fetch profile data (only role field exists in current schema)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        // Simple role check
        const userIsLeader = profile?.role === 'leader' || profile?.role === 'admin';
        setIsLeader(userIsLeader);
      } catch (error) {
        console.error('Error checking auth/role:', error);
        setIsAuthenticated(false);
        setIsLeader(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Redirect non-authed users
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [loading, isAuthenticated, router]);

  // Don't render content for non-authed users
  if (!loading && !isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="flex-1 py-8">
          <div className="max-w-md mx-auto">
            {/* Loading skeleton */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white mb-1">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <SettingsList isLeader={isLeader} />
      </main>
      
      <Footer />
    </div>
  );
}
