'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn() {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for the login link!');
    }
    setLoading(false);
  }

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
              src="/giveU logo.svg" 
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
            sign in to <span style={{ color: '#20c997', fontWeight: '700' }}>giveU</span>
          </h1>
          
          {/* Tagline */}
          <p style={{ 
            fontSize: '18px', 
            color: '#374151',
            fontWeight: '500',
            lineHeight: '1.4'
          }}>
            Your gifts. Real Impact.
          </p>
        </div>

        {/* Form Container */}
        <div style={{ 
          width: '100%',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
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
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#20c997';
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
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: loading ? '#9ca3af' : '#20c997',
              color: 'white',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(32, 201, 151, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#1ba085';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#20c997';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.opacity = '1';
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
