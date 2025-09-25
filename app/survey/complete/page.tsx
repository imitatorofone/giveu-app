'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Heart, Users, Calendar } from 'lucide-react';
import Image from 'next/image';

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

      // Get user's profile data including name and skills
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, gift_selections')
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
    router.push('/dashboard');
  };


  if (!user) return <div>Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
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
            backgroundColor: SURVEY_GREEN,
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
          <div className={SURVEY_CARD}>
            {/* giveU logo - centered with proper margin */}
            <div className="flex justify-center mb-6">
              <div style={{ 
                width: 100, 
                height: 100, 
                backgroundColor: SURVEY_GREEN, 
                borderRadius: 25, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}>
                <Image 
                  src="/logo.svg" 
                  alt="giveU Logo" 
                  width={100} 
                  height={100}
                  style={{ 
                    borderRadius: 25,
                    objectFit: 'cover',
                    width: '100px',
                    height: '100px'
                  }}
                />
              </div>
            </div>
            
            {/* Title section with proper spacing */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Welcome to giveU{userFirstName ? `, ${userFirstName}` : ''}! 🎉
              </h1>
              
              <p className="text-gray-600 mb-6">
                You're now ready to serve! Leadership has recognized your gifts and will help you put them into action.
              </p>
            </div>

            {/* User's Selected Skills */}
            {userSkills.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm text-gray-500 mb-4 text-center">
                  Your Gifts & Skills
                </h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {userSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-[#20c997] text-white rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* What happens next section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#20c997] mb-3 text-center">
                What happens next?
              </h3>
              <ul className="space-y-2 text-gray-600 text-left">
                <li>• You'll see personalized ways to serve</li>
                <li>• You can share needs in the community</li>
                <li>• Journey together with your church family</li>
              </ul>
            </div>

            {/* Action button */}
            <button 
              onClick={handleGetStarted}
              className={`${SURVEY_BUTTON} flex items-center justify-center gap-2`}
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
