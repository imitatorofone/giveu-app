'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function PendingApproval() {
  const [user, setUser] = useState<any>(null);
  const [church, setChurch] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/');
        return;
      }
      setUser(authData.user);

      // Check membership status
      const { data: membershipData, error: membershipError } = await supabase
        .from('org_members')
        .select(`
          *,
          orgs (name, city, state)
        `)
        .eq('user_id', authData.user.id)
        .single();

      console.log('Membership query result:', { membershipData, membershipError });

      if (!membershipData) {
        // No membership found, redirect to setup
        router.push('/setup');
        return;
      }

      if (membershipData.status === 'approved') {
        // Already approved, redirect to dashboard
        router.push('/dashboard');
        return;
      }

      if (membershipData.status === 'denied') {
        // Membership was denied
        setMembership(membershipData);
        setLoading(false);
        return;
      }

      // Status is pending
      setMembership(membershipData);
      setChurch(membershipData.orgs);
      setLoading(false);

      // Poll every 30 seconds to check for approval
      const interval = setInterval(async () => {
        const { data: updatedMembership } = await supabase
          .from('org_members')
          .select('status')
          .eq('user_id', authData.user.id)
          .single();

        if (updatedMembership?.status === 'approved') {
          clearInterval(interval);
          router.push('/dashboard');
        } else if (updatedMembership?.status === 'denied') {
          clearInterval(interval);
          setMembership((prev: any) => ({ ...prev, status: 'denied' }));
        }
      }, 30000);

      return () => clearInterval(interval);
    };

    checkStatus();
  }, [router]);

  const handleTakeSurvey = () => {
    router.push('/survey');
  };

  const handleTryAnotherChurch = async () => {
    // Remove current membership and go back to setup
    if (membership) {
      await supabase
        .from('org_members')
        .delete()
        .eq('id', membership.id);
    }
    router.push('/setup');
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  if (membership?.status === 'denied') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dbeafe 50%, #faf5ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: 48, 
          borderRadius: 12, 
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          maxWidth: 500,
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            backgroundColor: '#ef4444', 
            borderRadius: 20, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px',
            fontSize: 40 
          }}>
            ❌
          </div>
          
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: '0 0 16px' }}>Access Not Approved</h1>
          <p style={{ color: '#6b7280', marginBottom: 32 }}>
            Your request to join {church?.name} was not approved. Please contact your church leadership 
            or try joining a different church.
          </p>

          <button 
            onClick={handleTryAnotherChurch}
            style={{
              backgroundColor: '#4ECDC4',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Try Another Church
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dbeafe 50%, #faf5ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: 48, 
        borderRadius: 12, 
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: 500,
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: 80, 
          height: 80, 
          backgroundColor: '#f59e0b', 
          borderRadius: 20, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 24px',
          fontSize: 40 
        }}>
          ⏳
        </div>
        
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: '0 0 16px' }}>Waiting for Approval</h1>
        <p style={{ color: '#6b7280', marginBottom: 32 }}>
          Your request to join <strong>{church?.name}</strong> is pending approval from church leadership. 
          You'll be notified once approved.
        </p>

        <div style={{ 
          backgroundColor: '#f9fafb', 
          border: '1px solid #e5e7eb',
          borderRadius: 8, 
          padding: 24,
          marginBottom: 24,
          textAlign: 'left'
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>While you wait:</h3>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>
            You can complete your spiritual gifts survey to be ready once approved!
          </p>
          <button 
            onClick={handleTakeSurvey}
            style={{
              backgroundColor: '#4ECDC4',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14
            }}
          >
            Take Gifts Survey
          </button>
        </div>

        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          Need help? Contact your church leadership directly.
        </div>
      </div>
    </div>
  );
}
