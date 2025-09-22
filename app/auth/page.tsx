'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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
      backgroundColor: '#f9fafb' 
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%', 
        padding: '32px', 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          marginBottom: '24px',
          color: '#111827'
        }}>
          Sign In to ENGAGE
        </h2>
        
        <div style={{ marginBottom: '16px' }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#20c997'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
        
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#9ca3af' : '#20c997',
            color: 'white',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
        
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280', 
          textAlign: 'center', 
          marginTop: '16px' 
        }}>
          We'll send you a secure link to sign in
        </p>
      </div>
    </div>
  );
}
