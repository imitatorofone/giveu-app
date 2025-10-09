'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Gift, Check } from 'lucide-react';
import { BRAND } from '../../lib/brandConfig';
import Image from 'next/image';

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

      // Check if user already has a church_code in their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('church_code')
        .eq('id', authData.user.id)
        .single();

      if (profile?.church_code && profile.church_code.trim() !== '') {
        // User already has a church, redirect to dashboard
        console.log('User already has church_code:', profile.church_code);
        router.push('/dashboard');
        return;
      }

      // Load beta churches (hard-coded for consistency)
      const betaChurches = [
        { id: 'harmony', name: 'Harmony Church', city: 'Harmony', state: 'IA' },
        { id: 'brighton', name: 'Brighton Bible Church', city: 'Brighton', state: 'IA' },
        { id: 'newlondon', name: 'New London Christian Church', city: 'New London', state: 'IA' }
      ];

      console.log('Beta churches loaded:', betaChurches);
      setChurches(betaChurches);
      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleJoinChurch = async () => {
    if (!selectedChurch || !user) return;

    try {
      console.log('Attempting to join church:', { selectedChurch, userId: user.id, role });

      // Find the selected church to get its name
      const selectedChurchData = churches.find(church => church.id === selectedChurch);
      if (!selectedChurchData) {
        alert('Selected church not found. Please try again.');
        return;
      }

      // Map church name to correct church_code
      let churchCode;
      if (selectedChurchData.name === "Harmony Church") {
        churchCode = "123harmony";
      } else if (selectedChurchData.name === "Brighton Bible Church") {
        churchCode = "456brighton";
      } else if (selectedChurchData.name === "New London Christian Church") {
        churchCode = "789newlondon";
      } else {
        alert('Invalid church selection. Please try again.');
        return;
      }

      console.log('Church mapping:', { selectedChurch: selectedChurchData.name, churchCode });

      // Update profile with church_code and role information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          church_code: churchCode,
          role: role,
          is_leader: role === 'leader',
          approval_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .select();

      console.log('Profile update result:', { profileData, profileError });
      if (profileError) throw profileError;

      // Redirect to gift survey to complete profile
      router.push('/survey');
      
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

  if (loading) return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: BRAND.colors.background,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: BRAND.fonts.body
    }}>
      <div style={{ textAlign: 'center', color: BRAND.colors.textLight }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dbeafe 50%, #faf5ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: BRAND.fonts.body
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '32px 24px', 
        borderRadius: '12px', 
        border: '1px solid #f3f4f6',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* giveU Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <Image 
              src={BRAND.logo.path}
              alt={BRAND.logo.alt}
              width={80}
              height={80}
              style={{ 
                borderRadius: '12px',
                objectFit: 'contain'
              }}
            />
          </div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            margin: '0 0 8px',
            color: BRAND.colors.text,
            fontFamily: 'Quicksand, sans-serif'
          }}>
            Welcome to giveU
          </h1>
          <p style={{ 
            color: BRAND.colors.textLight,
            fontSize: '16px',
            margin: 0,
            fontFamily: BRAND.fonts.body
          }}>
            Let's connect you with your church community
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: '600', 
            marginBottom: '8px',
            fontSize: '14px',
            color: BRAND.colors.text,
            fontFamily: BRAND.fonts.body
          }}>
            Select Your Church:
          </label>
          <select
            value={selectedChurch}
            onChange={(e) => setSelectedChurch(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              minHeight: '44px',
              color: BRAND.colors.text,
              fontFamily: BRAND.fonts.body,
              backgroundColor: 'white',
              cursor: 'pointer',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = BRAND.colors.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND.colors.primary}20`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
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

        <div style={{ marginBottom: '32px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: '600', 
            marginBottom: '12px',
            fontSize: '14px',
            color: BRAND.colors.text,
            fontFamily: BRAND.fonts.body
          }}>
            Your Role:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { value: 'member', label: 'Member - I want to discover my gifts and serve' },
              { value: 'leader', label: 'Leader - I help coordinate ministry opportunities and manage church settings' }
            ].map(option => (
              <div 
                key={option.value}
                onClick={() => setRole(option.value)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '16px',
                  border: `2px solid ${role === option.value ? BRAND.colors.primary : '#e5e7eb'}`,
                  borderRadius: '8px',
                  backgroundColor: role === option.value ? BRAND.colors.primary : 'white',
                  color: role === option.value ? 'white' : BRAND.colors.text,
                  transition: 'all 0.2s',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  if (role !== option.value) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (role !== option.value) {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
              >
                {role === option.value && (
                  <Check size={20} color="white" strokeWidth={3} />
                )}
                <span style={{ 
                  fontSize: '14px',
                  fontFamily: BRAND.fonts.body,
                  lineHeight: '1.5',
                  flex: 1
                }}>
                  {option.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleJoinChurch}
          disabled={!selectedChurch}
          style={{
            width: '100%',
            backgroundColor: selectedChurch ? BRAND.colors.primary : '#d1d5db',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            fontFamily: BRAND.fonts.heading,
            cursor: selectedChurch ? 'pointer' : 'not-allowed',
            minHeight: '44px',
            transition: 'all 0.2s',
            opacity: selectedChurch ? 1 : 0.6
          }}
          onMouseEnter={(e) => {
            if (selectedChurch) {
              e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover;
            }
          }}
          onMouseLeave={(e) => {
            if (selectedChurch) {
              e.currentTarget.style.backgroundColor = BRAND.colors.primary;
            }
          }}
        >
          Join Church & Continue
        </button>

        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          backgroundColor: '#f9fafb', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: BRAND.colors.textLight, 
            margin: 0,
            lineHeight: '1.5',
            fontFamily: BRAND.fonts.body
          }}>
            Don't see your church? This is currently in beta testing with select churches. 
            Contact your church leadership about joining the giveU beta program.
          </p>
        </div>
      </div>
    </div>
  );
}
