'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, User, Calendar, MapPin, Phone, Clock, Key, Crown } from 'lucide-react';

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
  const [churchCode, setChurchCode] = useState('');
  const [role, setRole] = useState('');
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

    // Validate church code
    const validChurchCodes = ['123harmony', '123newlondon', '123brighton'];
    if (!validChurchCodes.includes(churchCode.toLowerCase())) {
      setError('Invalid church code. Please contact your church leadership.');
      return;
    }

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
      availability: availability,
      church_code: churchCode.toLowerCase(),
      role: role,
      is_leader: role === 'leader'
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
        email: user.email,
        availability: availability,
        church_code: churchCode.toLowerCase(),
        role: role,
        is_leader: role === 'leader'
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
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className={SURVEY_CARD}>
        {/* Progress indicator */}
        <div className={`w-full ${SURVEY_PROGRESS}`}>
          <div className="bg-[#20c997] h-2 rounded-full transition-all" style={{ width: '25%' }}></div>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-2">Step 1 of 4</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h1>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Sarah Johnson"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20c997] focus:border-[#20c997]"
            />
        </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Age *
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="25"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20c997] focus:border-[#20c997]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              City *
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Austin"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20c997] focus:border-[#20c997]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20c997] focus:border-[#20c997]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Church Code *
            </label>
            <input
              type="text"
              placeholder="Enter your church access code"
              value={churchCode}
              onChange={(e) => setChurchCode(e.target.value.toLowerCase())}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20c997] focus:border-[#20c997]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Your Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20c997] focus:border-[#20c997]"
            >
              <option value="">Select your role</option>
              <option value="member">Church Member</option>
              <option value="leader">Church Leader</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              When are you typically available?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Morning', 'Afternoon', 'Evening', 'Weekends'].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => toggleAvailability(time)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                    availability.includes(time) ? SELECTED_STYLE : UNSELECTED_STYLE
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!fullName || !age || !city || !phone || !churchCode || !role}
            className="transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: fullName && age && city && phone && churchCode && role ? SURVEY_GREEN : '#9ca3af',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: 16,
              fontWeight: 600,
              cursor: fullName && age && city && phone && churchCode && role ? 'pointer' : 'not-allowed',
              width: '100%'
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
