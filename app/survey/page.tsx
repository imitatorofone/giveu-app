'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Gift, ArrowRight } from 'lucide-react';

export default function SurveyWelcome() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/');
        return;
      }
      setUser(data.user);
    };
    getUser();
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <main style={{ 
      maxWidth: 520, 
      margin: '40px auto', 
      fontFamily: 'var(--font-merriweather)', 
      textAlign: 'center',
      backgroundColor: '#FDFBF7',
      minHeight: '100vh',
      padding: 'var(--space-6)'
    }}>
      <div style={{ 
        width: 80, 
        height: 80, 
        backgroundColor: '#20c997', 
        borderRadius: 20, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        margin: '0 auto 40px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <Gift size={40} color="white" strokeWidth={1.5} />
      </div>
      
      <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 700, margin: '0 0 var(--space-5)', color: '#333333', fontFamily: 'var(--font-quicksand)' }}>ENGAGE</h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid var(--gray-200)', 
        borderRadius: 'var(--radius-lg)', 
        padding: 'var(--space-8)', 
        margin: '0 0 var(--space-10)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <p style={{ color: '#666666', fontSize: 'var(--text-lg)', margin: 0 }}>
          One body, many members—your part matters.
        </p>
      </div>

      <button 
        onClick={() => router.push('/survey/step1')}
        style={{
          backgroundColor: '#20c997',
          color: 'white',
          padding: 'var(--space-4) var(--space-8)',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-semibold)',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          margin: '0 auto'
        }}
      >
        Start Survey
        <ArrowRight size={18} strokeWidth={1.5} />
      </button>
    </main>
  );
}
