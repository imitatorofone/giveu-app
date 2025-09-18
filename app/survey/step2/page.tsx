'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { GiftingCategory, GIFTING_ICONS } from '../../../icons/index';

const giftAreas = [
  { id: 'hands-on-skills', name: 'Hands-On Skills', description: '(building, fixing, crafting)' },
  { id: 'people-relationships', name: 'People & Relationships', description: '(connecting, encouraging, caring for others)' },
  { id: 'problem-solving-organizing', name: 'Problem-Solving & Organizing', description: '(planning, strategizing, making things work)' },
  { id: 'care-comfort', name: 'Care & Comfort', description: '(helping others feel better, providing support)' },
  { id: 'learning-teaching', name: 'Learning & Teaching', description: '(sharing knowledge, helping others grow)' },
  { id: 'creativity-expression', name: 'Creativity & Expression', description: '(art, music, writing, design)' },
  { id: 'leadership-motivation', name: 'Leadership & Motivation', description: '(guiding others, inspiring action)' },
  { id: 'behind-scenes-support', name: 'Behind-the-Scenes Support', description: '(making things happen quietly)' },
  { id: 'physical-active', name: 'Physical & Active', description: '(using body and energy to serve)' },
  { id: 'pioneering-connecting', name: 'Pioneering & Connecting', description: '(starting new things, bringing people together)' }
];

export default function SurveyStep2() {
  const [selectedGifts, setSelectedGifts] = useState(new Set());
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

  const toggleGift = (giftId: string) => {
    const newSelected = new Set(selectedGifts);
    
    if (newSelected.has(giftId)) {
      newSelected.delete(giftId);
    } else if (newSelected.size < 2) {
      newSelected.add(giftId);
    }
    
    setSelectedGifts(newSelected);
  };

  const handleNext = async () => {
    if (!user || selectedGifts.size === 0) return;

    const selectedGiftNames = Array.from(selectedGifts).map(id => 
      giftAreas.find(area => area.id === id)?.name
    );

    console.log('Saving gift selections:', { selectedGiftNames, userId: user.id });

    const { data, error } = await supabase
      .from('profiles')
      .update({
        gift_selections: selectedGiftNames,
        primary_gift_area: selectedGiftNames[0]
      })
      .eq('id', user.id)
      .select();

    console.log('Profile update result:', { data, error });

    if (error) {
      console.error('Error updating profile:', error);
      alert(`Error saving your selections: ${error.message}. Please try again.`);
      return;
    }

    router.push('/survey/step3');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <main style={{ maxWidth: 520, margin: '40px auto', fontFamily: 'var(--font-family)' }}>
      {/* Progress indicator */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)', marginBottom: 'var(--space-2)' }}>Question 1 of 6</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)', marginBottom: 'var(--space-2)' }}>17% complete</div>
        <div style={{ width: '100%', height: 4, backgroundColor: 'var(--gray-200)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ width: '17%', height: '100%', backgroundColor: 'var(--brand-primary-600)', borderRadius: 'var(--radius-sm)' }}></div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid var(--gray-200)', 
        borderRadius: 'var(--radius-lg)', 
        padding: 'var(--space-8)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
          Which of these areas sound most like you?
        </h1>
        <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-6)' }}>
          Select up to 2 giftings that resonate with how God has made you
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {giftAreas.map((area) => {
            const isSelected = selectedGifts.has(area.id);
            const isDisabled = !isSelected && selectedGifts.size >= 2;
            
            return (
              <div key={area.id} style={{ opacity: isDisabled ? 0.5 : 1 }}>
                <GiftingCategory
                  category={area.id as keyof typeof GIFTING_ICONS}
                  selected={isSelected}
                  onClick={() => !isDisabled && toggleGift(area.id)}
                  showDescription={true}
                />
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
          Selected: {selectedGifts.size}/2
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
        <button
          onClick={() => router.push('/survey/step1')}
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
          disabled={selectedGifts.size === 0}
          style={{
            backgroundColor: selectedGifts.size > 0 ? 'var(--brand-primary-600)' : 'var(--gray-400)',
            color: 'white',
            padding: 'var(--space-4) var(--space-8)',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-medium)',
            cursor: selectedGifts.size > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease'
          }}
        >
          Keep Going →
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
