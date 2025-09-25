'use client';

import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SignOutButtonProps {
  className?: string;
  children: React.ReactNode;
}

export default function SignOutButton({ className = '', children }: SignOutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabaseBrowser.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        return;
      }
      
      // Redirect to home page or login page after successful sign out
      router.push('/');
      router.refresh(); // Refresh to clear any cached data
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
      style={{ 
        color: '#6b7280',
        background: 'none',
        border: 'none',
        fontSize: '14px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.6 : 1
      }}
    >
      {isLoading ? 'Signing out...' : children}
    </button>
  );
}
