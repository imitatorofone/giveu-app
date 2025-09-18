'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ClientOnly from '../_clientOnly';

export default function LeaderPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // Redirect non-leaders to dashboard
  useEffect(() => {
    if (!loading && user && profile && profile?.full_name !== 'Harmony Mitchell') {
      router.push('/dashboard');
    }
  }, [loading, user, profile, router]);

  if (loading) {
    return (
      <ClientOnly>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div>Loading dashboard...</div>
        </div>
      </ClientOnly>
    );
  }

  if (!user || !profile) {
    return (
      <ClientOnly>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div>Please log in to access the leader dashboard.</div>
        </div>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h1>Leader Dashboard</h1>
        <p>Welcome, {profile?.full_name || 'User'}!</p>
        <p>This is a simplified version to test the basic structure.</p>
      </div>
    </ClientOnly>
  );
}
