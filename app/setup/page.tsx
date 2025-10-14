'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChurchSetup() {
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately to survey - this page is obsolete
    console.log('[Setup] Redirecting to survey - setup page is obsolete');
    router.replace('/survey');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg">Redirecting to survey...</div>
    </div>
  );
}