'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { BRAND } from '../../lib/brandConfig';

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
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-gray-100 p-8">
        <div style={{ 
          width: 80, 
          height: 80, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 24px'
        }}>
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
        
        <h1 
          className="text-4xl font-bold text-gray-900 mb-2 text-center"
          style={{ fontFamily: 'Quicksand, sans-serif' }}
        >
          giveU
        </h1>
        
        <p className="text-gray-600 mb-8 text-center">
          One body, many members—your part matters.
        </p>

        <button 
          onClick={() => router.push('/survey/step1')}
          className="w-full py-3 bg-[#20c997] text-white rounded-lg font-semibold hover:bg-[#1ba87f] transition flex items-center justify-center gap-2 mb-6"
          style={{ 
            minHeight: '44px',
            fontFamily: 'Quicksand, sans-serif'
          }}
        >
          Begin Gift Discovery
          <ArrowRight size={18} strokeWidth={1.5} />
        </button>

        <p className="text-sm text-gray-500 text-center">
          4 quick steps • 2 minutes
        </p>
      </div>
    </main>
  );
}
