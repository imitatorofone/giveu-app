'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Heart, Users, Calendar } from 'lucide-react';

export default function SurveyComplete() {
  const [user, setUser] = useState<any>(null);
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
    <main style={{ 
      maxWidth: 600, 
      margin: '40px auto', 
      fontFamily: 'var(--font-family)', 
      textAlign: 'center',
      position: 'relative',
      minHeight: '80vh',
      backgroundColor: '#FDFBF7',
      padding: 'var(--space-6)'
    }}>
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
            backgroundColor: '#2BB3A3',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 1.5s ease-in-out',
            boxShadow: 'var(--shadow-xl)'
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
          {/* Gift box icon */}
          <div style={{ 
            width: 100, 
            height: 100, 
            backgroundColor: '#2BB3A3', 
            borderRadius: 25, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto var(--space-10)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <Heart size={50} color="white" strokeWidth={1.5} />
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid var(--gray-200)', 
            borderRadius: 'var(--radius-xl)', 
            padding: 'var(--space-10)', 
            margin: '0 0 var(--space-10)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-bold)', margin: '0 0 var(--space-4)', color: '#333333' }}>
              You're now ready to serve! 🎉
            </h1>
            
            <p style={{ color: '#666666', fontSize: 'var(--text-lg)', lineHeight: 1.5, marginBottom: 'var(--space-8)' }}>
              Leadership has now recognized your gifts and will help you put them into action. Together, we'll use these gifts to serve His kingdom.
            </p>

            {/* What happens next section */}
            <div style={{ 
              backgroundColor: '#f0fdfa', 
              border: '1px solid #2BB3A3', 
              borderRadius: 'var(--radius-lg)', 
              padding: 'var(--space-6)', 
              marginBottom: 'var(--space-8)'
            }}>
              <h3 style={{ color: '#2BB3A3', margin: '0 0 var(--space-4)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', textAlign: 'center' }}>
                What happens next?
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#666666', textAlign: 'left' }}>
                <li style={{ marginBottom: 'var(--space-2)' }}>• You'll see personalized ways to serve</li>
                <li style={{ marginBottom: 'var(--space-2)' }}>• You can share needs in the community</li>
                <li>• Journey together with your church family</li>
              </ul>
            </div>

            {/* Action button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={handleGetStarted}
                style={{
                  backgroundColor: '#2BB3A3',
                  color: 'white',
                  padding: 'var(--space-4) var(--space-8)',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-semibold)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: 180,
                  transition: 'background-color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)'
                }}
              >
                Let's Get Started
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
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
