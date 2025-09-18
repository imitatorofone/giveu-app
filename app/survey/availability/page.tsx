'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

const availabilityOptions = [
  { id: 'Mornings', text: "Mornings" },
  { id: 'Afternoons', text: "Afternoons" },
  { id: 'Nights', text: "Nights" },
  { id: 'Anytime', text: "Anytime" }
];

export default function SurveyAvailability() {
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
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

  const handleAvailabilityChange = (optionId: string) => {
    setSelectedAvailability(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(item => item !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  const handleNext = async () => {
    if (!user || selectedAvailability.length === 0) return;

    // Save availability level
    await supabase
      .from('profiles')
      .update({
        availability_level: JSON.stringify(selectedAvailability)
      })
      .eq('id', user.id);

    router.push('/survey/complete');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <main style={{ maxWidth: 520, margin: '40px auto', fontFamily: 'sans-serif' }}>
      {/* Progress indicator */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Question 5 of 6</div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>83% complete</div>
        <div style={{ width: '100%', height: 4, backgroundColor: '#eee', borderRadius: 2 }}>
          <div style={{ width: '83%', height: '100%', backgroundColor: '#4ECDC4', borderRadius: 2 }}></div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #eee', 
        borderRadius: 12, 
        padding: 32,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
          When are you typically available to serve?
        </h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Select all that apply
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {availabilityOptions.map((option) => (
            <label
              key={option.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px',
                border: selectedAvailability.includes(option.id) ? '2px solid #4ECDC4' : '1px solid #ddd',
                borderRadius: 8,
                backgroundColor: selectedAvailability.includes(option.id) ? '#f0fffe' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={selectedAvailability.includes(option.id)}
                onChange={() => handleAvailabilityChange(option.id)}
                style={{ margin: 0 }}
              />
              <span style={{ fontSize: 16, fontWeight: 500 }}>{option.text}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
        <button
          onClick={() => router.push('/survey/step5')}
          style={{
            color: '#666',
            background: 'none',
            border: 'none',
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          ← Previous
        </button>

        <button
          onClick={handleNext}
          disabled={selectedAvailability.length === 0}
          style={{
            backgroundColor: selectedAvailability.length > 0 ? '#4ECDC4' : '#ccc',
            color: 'white',
            padding: '16px 32px',
            borderRadius: 8,
            border: 'none',
            fontSize: 16,
            fontWeight: 500,
            cursor: selectedAvailability.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          Share This
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <p style={{ color: '#999', fontSize: 14 }}>
          Let's discover how God has gifted you for His glory.
        </p>
      </div>
    </main>
  );
}
