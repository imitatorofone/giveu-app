'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, User, Calendar, MapPin, Phone, Clock } from 'lucide-react';
import { formatPhoneToE164 } from '../../../lib/phoneFormatter';
import { BRAND } from '../../../lib/brandConfig';

// Survey-wide design constants
const SURVEY_GREEN = '#20c997';
const SURVEY_CARD = 'max-w-2xl mx-auto bg-white rounded-xl shadow-sm border-2 border-gray-100 p-8';
const SURVEY_BUTTON = 'w-full py-3 bg-[#20c997] text-white rounded-lg font-semibold hover:opacity-90';
const SURVEY_PROGRESS = 'h-2 bg-gray-200 rounded-full mb-6';
const SELECTED_STYLE = 'bg-[#20c997] text-white border-[#20c997]';
const UNSELECTED_STYLE = 'bg-white border-gray-300 text-gray-700 hover:border-[#20c997]';

export default function SurveyStep1() {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [availability, setAvailability] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Phone formatting function
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const toggleAvailability = (time: string) => {
    setAvailability(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
    };
    getUser();
  }, []);

  const handleNext = async () => {
    if (!user) return;

    // Clear any previous errors
    setError('');

    // Extract last 4 digits of phone number
    const phoneLastFour = phone.replace(/\D/g, '').slice(-4);

    console.log('Saving profile data:', {
      id: user.id,
      full_name: fullName,
      age: parseInt(age),
      city: city,
      phone: phone,
      phone_last_four: phoneLastFour,
      email: user.email,
      availability: availability
    });

    // Format phone number to E.164 format for Twilio compatibility
    const formattedPhone = formatPhoneToE164(phone);

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        age: parseInt(age),
        city: city,
        phone: formattedPhone,
        phone_last_four: phoneLastFour,
        email: user.email,
        availability: availability
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
    <main style={{ minHeight: '100vh', backgroundColor: BRAND.colors.background, padding: '48px 16px' }}>
      <div style={{ maxWidth: '672px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '32px 24px' }}>
        {/* Progress indicator */}
        <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '9999px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: BRAND.colors.primary, height: '8px', borderRadius: '9999px', transition: 'all 0.3s', width: '25%' }}></div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: BRAND.colors.textLight, marginBottom: '8px', fontFamily: BRAND.fonts.body }}>Step 1 of 4</p>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: BRAND.colors.text, marginBottom: '8px', fontFamily: BRAND.fonts.heading }}>Tell us about yourself</h1>
        </div>
        {error && (
          <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#fef2f2', border: `1px solid ${BRAND.colors.danger}`, borderRadius: '8px' }}>
            <p style={{ color: BRAND.colors.danger, fontSize: '14px', fontFamily: BRAND.fonts.body }}>{error}</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: BRAND.colors.textLight, marginBottom: '8px', fontFamily: BRAND.fonts.body }}>
              <User size={16} />
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Sarah Johnson"
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: BRAND.fonts.body, minHeight: '44px' }}
            />
        </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: BRAND.colors.textLight, marginBottom: '8px', fontFamily: BRAND.fonts.body }}>
              <Calendar size={16} />
              Age *
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="25"
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: BRAND.fonts.body, minHeight: '44px' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: BRAND.colors.textLight, marginBottom: '8px', fontFamily: BRAND.fonts.body }}>
              <MapPin size={16} />
              City *
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Austin"
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: BRAND.fonts.body, minHeight: '44px' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: BRAND.colors.textLight, marginBottom: '8px', fontFamily: BRAND.fonts.body }}>
              <Phone size={16} />
              Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: BRAND.fonts.body, minHeight: '44px' }}
            />
          </div>


          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: BRAND.colors.textLight }}>
              <Clock className="w-4 h-4" />
              When are you typically available?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['Morning', 'Afternoon', 'Evening', 'Weekends'].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => toggleAvailability(time)}
                  style={{
                    backgroundColor: availability.includes(time) ? BRAND.colors.primary : '#f3f4f6',
                    color: availability.includes(time) ? 'white' : BRAND.colors.text,
                    border: availability.includes(time) ? `2px solid ${BRAND.colors.primary}` : '1px solid #e5e7eb',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: BRAND.fonts.heading,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    if (availability.includes(time)) {
                      e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover;
                    } else {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (availability.includes(time)) {
                      e.currentTarget.style.backgroundColor = BRAND.colors.primary;
                    } else {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!fullName || !age || !city || !phone}
            style={{
              width: '100%',
              backgroundColor: (fullName && age && city && phone) ? BRAND.colors.primary : '#9ca3af',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: BRAND.fonts.heading,
              cursor: (fullName && age && city && phone) ? 'pointer' : 'not-allowed',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              opacity: (fullName && age && city && phone) ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (fullName && age && city && phone) {
                e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover;
              }
            }}
            onMouseLeave={(e) => {
              if (fullName && age && city && phone) {
                e.currentTarget.style.backgroundColor = BRAND.colors.primary;
              }
            }}
          >
            Keep Going
            <ArrowRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </main>
  );
}
