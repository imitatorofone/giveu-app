'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, User, Calendar, MapPin, Phone } from 'lucide-react';

export default function SurveyStep1() {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
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

  const handleNext = async () => {
    if (!user) return;

    // Extract last 4 digits of phone number
    const phoneLastFour = phone.replace(/\D/g, '').slice(-4);

    console.log('Saving profile data:', {
      id: user.id,
      full_name: fullName,
      age: parseInt(age),
      city: city,
      phone: phone,
      phone_last_four: phoneLastFour,
      email: user.email
    });

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        age: parseInt(age),
        city: city,
        phone: phone,
        phone_last_four: phoneLastFour,
        email: user.email
      })
      .select();

    console.log('Profile upsert result:', { data, error });

    if (error) {
      console.error('Error saving profile:', error);
      alert(`Error saving your information: ${error.message}. Please try again.`);
      return;
    }

    router.push('/survey/step2');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <main style={{ 
      maxWidth: 520, 
      margin: '40px auto', 
      fontFamily: 'var(--font-family)',
      backgroundColor: '#FDFBF7',
      minHeight: '100vh',
      padding: 'var(--space-6)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-2)', color: '#333333', fontFamily: 'var(--font-quicksand)' }}>Tell us about yourself</h1>
        <p style={{ color: '#666666', fontSize: 'var(--text-base)', fontFamily: 'var(--font-merriweather)' }}>Let's discover how God has gifted you</p>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid var(--gray-200)', 
        borderRadius: 'var(--radius-lg)', 
        padding: 'var(--space-8)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)', color: '#333333' }}>
            <User size={16} strokeWidth={1.5} color="#2BB3A3" />
            Full Name *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Sarah Johnson"
            style={{ 
              width: '100%', 
              padding: 'var(--space-3)', 
              border: '1px solid var(--gray-300)', 
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)', color: '#333333' }}>
            <Calendar size={16} strokeWidth={1.5} color="#2BB3A3" />
            Age *
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="32"
            style={{ 
              width: '100%', 
              padding: 'var(--space-3)', 
              border: '1px solid var(--gray-300)', 
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)', color: '#333333' }}>
            <MapPin size={16} strokeWidth={1.5} color="#2BB3A3" />
            Town/City *
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Springfield"
            style={{ 
              width: '100%', 
              padding: 'var(--space-3)', 
              border: '1px solid var(--gray-300)', 
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)', color: '#333333' }}>
            <Phone size={16} strokeWidth={1.5} color="#2BB3A3" />
            Phone Number *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            style={{ 
              width: '100%', 
              padding: 'var(--space-3)', 
              border: '1px solid var(--gray-300)', 
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
        <button
          onClick={handleNext}
          disabled={!fullName || !age || !city || !phone}
          style={{
            backgroundColor: fullName && age && city && phone ? '#2BB3A3' : 'var(--gray-300)',
            color: 'white',
            padding: 'var(--space-4) var(--space-8)',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-semibold)',
            cursor: fullName && age && city && phone ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            margin: '0 auto'
          }}
        >
          Keep Going
          <ArrowRight size={18} strokeWidth={1.5} />
        </button>
        <p style={{ color: '#666666', fontSize: 'var(--text-sm)', marginTop: 'var(--space-4)' }}>
          This will take about 2 minutes to complete
        </p>
      </div>
    </main>
  );
}
