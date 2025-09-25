'use client';

import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  className?: string;
  children: React.ReactNode;
}

export default function SignOutButton({ className = '', children }: SignOutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    console.log('[SignOutButton] Sign out requested');
    
    if (confirm('Sign out? You\'ll need your email again to sign in.')) {
      try {
        console.log('[SignOutButton] User confirmed sign out');
        setIsLoading(true);
        const { error } = await supabaseBrowser.auth.signOut();
        
        if (error) {
          console.error('[SignOutButton] Error signing out:', error);
          return;
        }
        
        console.log('[SignOutButton] Sign out successful, redirecting');
        // Redirect to auth page after successful sign out
        router.push('/auth');
        router.refresh(); // Refresh to clear any cached data
      } catch (error) {
        console.error('[SignOutButton] Unexpected error during sign out:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('[SignOutButton] User cancelled sign out');
    }
  };

  return (
    <button 
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
      style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#6b7280',
        background: 'none',
        border: 'none',
        fontSize: '14px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.6 : 1
      }}
    >
      <LogOut size={16} />
      {isLoading ? 'Signing out...' : children}
    </button>
  );
}
