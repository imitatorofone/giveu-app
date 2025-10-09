'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Heart, Users, Calendar } from 'lucide-react';
import Image from 'next/image';
import { BRAND } from '../../../lib/brandConfig';

// Survey-wide design constants
const SURVEY_GREEN = '#20c997';
const SURVEY_CARD = 'max-w-2xl mx-auto bg-white rounded-xl shadow-sm border-2 border-gray-100 p-8';
const SURVEY_BUTTON = 'w-full py-3 bg-[#20c997] text-white rounded-lg font-semibold hover:opacity-90';
const SURVEY_PROGRESS = 'h-2 bg-gray-200 rounded-full mb-6';
const SELECTED_STYLE = 'bg-[#20c997] text-white border-[#20c997]';
const UNSELECTED_STYLE = 'bg-white border-gray-300 text-gray-700 hover:border-[#20c997]';

export default function SurveyComplete() {
  const [user, setUser] = useState<any>(null);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [showContent, setShowContent] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [fadeOutConfetti, setFadeOutConfetti] = useState(false);
  const [fadeOutCheckmark, setFadeOutCheckmark] = useState(false);
  const [fadeInContent, setFadeInContent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/');
        return;
      }
      setUser(data.user);

      // Get user's profile data including name, skills, and approval status
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, gift_selections, approval_status')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        // Set first name from profile
        if (profile.full_name) {
          const firstName = profile.full_name.split(' ')[0];
          setUserFirstName(firstName);
        }
        
        // Set skills
        if (profile.gift_selections) {
          // Remove duplicates and ensure unique skills
          const uniqueSkills = [...new Set(profile.gift_selections)] as string[];
          setUserSkills(uniqueSkills);
        }
      }
    };
    getUser();

    // Confetti starts immediately (already set to true in state)

    // Start checkmark fade out after 2 seconds
    const checkmarkFadeTimer = setTimeout(() => {
      setFadeOutCheckmark(true);
    }, 2000);

    // Start content fade-in after 5 seconds (while confetti is still falling)
    const contentFadeInTimer = setTimeout(() => {
      setFadeInContent(true);
    }, 5000);

    // Start confetti fade out after 12 seconds, then hide after 13 seconds
    const fadeOutTimer = setTimeout(() => {
      setFadeOutConfetti(true);
    }, 12000);

    const hideTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 13000);

    return () => {
      clearTimeout(checkmarkFadeTimer);
      clearTimeout(contentFadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleGetStarted = () => {
    // Redirect to notification onboarding page
    router.push('/onboarding/notifications');
  };


  if (!user) return <div>Loading...</div>;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: BRAND.colors.background, padding: '48px 16px' }}>
      {/* Confetti Animation */}
      {showConfetti && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 999,
          opacity: fadeOutConfetti ? 0 : 1,
          transition: 'opacity 1s ease-out'
        }}>
          {[...Array(300)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: Math.random() * 15 + 8,
                height: Math.random() * 15 + 8,
                backgroundColor: ['#4ECDC4', '#FF6B6B', '#FFE66D', '#95E1D3', '#F38BA8', '#A8E6CF', '#FFD93D', '#6BCF7F'][Math.floor(Math.random() * 8)],
                left: Math.random() * 100 + '%',
                top: '-20px',
                borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                animation: `confetti-fall ${Math.random() * 4 + 3}s linear forwards`,
                animationDelay: Math.random() * 3 + 's',
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}

      {/* Animated check mark */}
      {!fadeInContent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          opacity: fadeOutCheckmark ? 0 : 1,
          transition: 'opacity 3.5s ease-out'
        }}>
          <div style={{
            width: 120,
            height: 120,
            backgroundColor: BRAND.colors.success,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 1.5s ease-in-out',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <CheckCircle size={60} color="white" strokeWidth={1.5} style={{
              animation: 'checkmark 0.8s ease-in-out 0.5s both'
            }} />
          </div>
        </div>
      )}

      {/* Main content */}
      {showContent && (
        <div style={{
          opacity: fadeInContent ? 1 : 0,
          transition: 'opacity 3s ease-in',
          pointerEvents: fadeInContent ? 'auto' : 'none'
        }}>
          <div style={{ maxWidth: '672px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '32px 24px' }}>
            {/* giveU logo - centered with proper margin */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <Image 
                src={BRAND.logo.path}
                alt={BRAND.logo.alt}
                width={100} 
                height={100}
                style={{ 
                  borderRadius: '12px',
                  objectFit: 'contain'
                }}
              />
            </div>
            
            {/* Title section with proper spacing */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: BRAND.colors.text, marginBottom: '12px', fontFamily: BRAND.fonts.heading }}>
                Welcome to giveU{userFirstName ? `, ${userFirstName}` : ''}! 🎉
              </h1>
              
              <p style={{ color: BRAND.colors.textLight, marginBottom: '24px', fontSize: '16px', fontFamily: BRAND.fonts.body }}>
                You're now ready to serve! Leadership has recognized your gifts and will help you put them into action.
              </p>
            </div>

            {/* User's Selected Skills */}
            {userSkills.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '14px', color: BRAND.colors.textLight, marginBottom: '16px', textAlign: 'center', fontFamily: BRAND.fonts.body }}>
                  Your Gifts & Skills
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                  {userSkills.map((skill, index) => (
                    <span
                      key={index}
                      style={{ 
                        padding: '8px 16px', 
                        backgroundColor: BRAND.colors.primary, 
                        color: 'white', 
                        borderRadius: '9999px', 
                        fontSize: '14px', 
                        fontWeight: '500',
                        fontFamily: BRAND.fonts.heading
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* What happens next section */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: BRAND.colors.primary, marginBottom: '12px', textAlign: 'center', fontFamily: BRAND.fonts.heading }}>
                What happens next?
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: BRAND.colors.textLight, textAlign: 'left', fontSize: '14px', fontFamily: BRAND.fonts.body }}>
                <li>• You'll see personalized ways to serve</li>
                <li>• You can share needs in the community</li>
                <li>• Journey together with your church family</li>
              </ul>
            </div>

            {/* Action button */}
            <button 
              onClick={handleGetStarted}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: BRAND.colors.primary,
                color: 'white',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                fontFamily: BRAND.fonts.heading,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '44px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = BRAND.colors.primary;
              }}
            >
              Explore Ways to Serve
              <ArrowRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes checkmark {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg) scale(1);
            opacity: 1;
          }
          10% {
            transform: translateY(-80vh) rotate(180deg) scale(1.1);
            opacity: 1;
          }
          50% {
            transform: translateY(0vh) rotate(900deg) scale(0.8);
            opacity: 0.8;
          }
          90% {
            transform: translateY(80vh) rotate(1620deg) scale(0.6);
            opacity: 0.4;
          }
          100% {
            transform: translateY(120vh) rotate(1800deg) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}
