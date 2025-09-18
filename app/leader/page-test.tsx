'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ClientOnly from '../_clientOnly';

export default function LeaderPage() {
  console.log('=== LEADER PAGE TEST COMPONENT STARTING ===');
  
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [testState, setTestState] = useState('initial');

  // Test Supabase connection
  const testConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase.from('profiles').select('count');
      console.log('DB connection result:', { data, error });
    } catch (err) {
      console.error('DB connection error:', err);
    }
  };

  useEffect(() => {
    console.log('=== useEffect running ===');
    console.log('Auth state:', { user: !!user, profile: !!profile, loading });
    setTestState('mounted');
    testConnection();
  }, [user, profile, loading]);

  console.log('=== RENDER PHASE ===');
  console.log('Current state:', { testState, user: !!user, profile: !!profile, loading });

  if (loading) {
    console.log('=== LOADING STATE ===');
    return (
      <ClientOnly>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h1>Loading Leader Dashboard...</h1>
          <p>Loading state: {loading ? 'true' : 'false'}</p>
          <p>User: {user ? 'exists' : 'null'}</p>
          <p>Profile: {profile ? 'exists' : 'null'}</p>
        </div>
      </ClientOnly>
    );
  }

  if (!user || !profile) {
    console.log('=== NO USER/PROFILE STATE ===');
    return (
      <ClientOnly>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h1>Access Denied</h1>
          <p>Please log in to access the leader dashboard.</p>
          <p>User: {user ? 'exists' : 'null'}</p>
          <p>Profile: {profile ? 'exists' : 'null'}</p>
        </div>
      </ClientOnly>
    );
  }

  console.log('=== MAIN RENDER ===');
  return (
    <ClientOnly>
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h1>Leader Dashboard Test</h1>
        <p>Welcome, {profile?.full_name || 'User'}!</p>
        <p>Test State: {testState}</p>
        <p>User ID: {user?.id}</p>
        <p>Profile Name: {profile?.full_name}</p>
        <button 
          onClick={() => {
            console.log('Button clicked!');
            setTestState('button-clicked');
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2dd4bf',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Button
        </button>
      </div>
    </ClientOnly>
  );
}
