'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Gift } from 'lucide-react';

export default function ChurchSetup() {
  const [user, setUser] = useState<any>(null);
  const [churches, setChurches] = useState<any[]>([]);
  const [selectedChurch, setSelectedChurch] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/');
        return;
      }
      setUser(authData.user);

      // Check if user is already assigned to a church
      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id, role, orgs(name)')
        .eq('user_id', authData.user.id)
        .single();

      if (membership) {
        // User already has a church, redirect to dashboard
        router.push('/dashboard');
        return;
      }

      // Load available churches
      const { data: churchData, error: churchError } = await supabase
        .from('orgs')
        .select('*')
        .order('name');

      console.log('Church query result:', { churchData, churchError });
      
      if (churchError) {
        console.error('Church query error:', churchError);
        alert(`Error loading churches: ${churchError.message}`);
        setChurches([]);
      } else {
        setChurches(churchData || []);
      }
      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleJoinChurch = async () => {
    if (!selectedChurch || !user) return;

    try {
      console.log('Attempting to join church:', { selectedChurch, userId: user.id, role });

      // Create pending membership (not approved yet)
      const { data: memberData, error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: selectedChurch,
          user_id: user.id,
          role: role,
          status: 'pending'
        })
        .select();

      console.log('Member insert result:', { memberData, memberError });
      if (memberError) throw memberError;

      // Update profile with org_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          org_id: selectedChurch
        })
        .select();

      console.log('Profile update result:', { profileData, profileError });
      if (profileError) throw profileError;

      // Redirect to pending page
      router.push('/pending');
      
    } catch (error) {
      console.error('Error joining church:', error);
      console.error('Error details:', {
        message: (error as any).message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code
      });
      alert(`Error requesting to join church: ${(error as any).message}. Please try again.`);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

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
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            backgroundColor: '#4ECDC4', 
            borderRadius: 20, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px',
            fontSize: 40 
          }}>
            <Gift size={40} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', margin: '0 0 8px' }}>Welcome to Engage</h1>
          <p style={{ color: '#6b7280' }}>Let's connect you with your church community</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
            Select Your Church:
          </label>
          <select
            value={selectedChurch}
            onChange={(e) => setSelectedChurch(e.target.value)}
            style={{ 
              width: '100%', 
              padding: 12, 
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 16
            }}
          >
            <option value="">Choose your church...</option>
            {churches.map(church => (
              <option key={church.id} value={church.id}>
                {church.name} - {church.city}, {church.state}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
            Your Role:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { value: 'member', label: 'Member - I want to discover my gifts and serve' },
              { value: 'leader', label: 'Leader - I help coordinate ministry opportunities and manage church settings' }
            ].map(option => (
              <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={(e) => setRole(e.target.value)}
                />
                <span style={{ fontSize: 14 }}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={handleJoinChurch}
          disabled={!selectedChurch}
          style={{
            width: '100%',
            backgroundColor: selectedChurch ? '#4ECDC4' : '#e5e7eb',
            color: selectedChurch ? 'white' : '#9ca3af',
            border: 'none',
            padding: 16,
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: selectedChurch ? 'pointer' : 'not-allowed'
          }}
        >
          Join Church & Continue
        </button>

        <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
            Don't see your church? This is currently in beta testing with select churches. 
            Contact your church leadership about joining the Engage beta program.
          </p>
        </div>
      </div>
    </div>
  );
}
