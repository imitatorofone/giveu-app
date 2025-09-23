'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { GiftingCategory, GIFTING_ICONS } from '../../../icons/index';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Survey-wide design constants
const SURVEY_GREEN = '#20c997';
const SURVEY_CARD = 'max-w-2xl mx-auto bg-white rounded-xl shadow-sm border-2 border-gray-100 p-8';
const SURVEY_BUTTON = 'w-full py-3 bg-[#20c997] text-white rounded-lg font-semibold hover:opacity-90';
const SURVEY_PROGRESS = 'h-2 bg-gray-200 rounded-full mb-6';
const SELECTED_STYLE = 'bg-[#20c997] text-white border-[#20c997]';
const UNSELECTED_STYLE = 'bg-white border-gray-300 text-gray-700 hover:border-[#20c997]';

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
    const selectedCategoryIds = Array.from(selectedGifts);
    
    if (selectedCategoryIds.length !== 2) {
      alert('Please select exactly 2 gifting categories');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      alert('Please sign in to continue');
      router.push('/auth');
      return;
    }

    // Convert IDs to names for storage
    const selectedCategoryNames = selectedCategoryIds.map(id => 
      giftAreas.find(area => area.id === id)?.name
    ).filter(Boolean);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        selected_gift_categories: selectedCategoryNames,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving categories:', error);
      alert(`Error: ${error.message}`);
      return;
    }

    router.push('/survey/step3');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className={SURVEY_CARD}>
        {/* Progress indicator */}
        <div className={`w-full ${SURVEY_PROGRESS}`}>
          <div className="bg-[#20c997] h-2 rounded-full transition-all" style={{ width: '50%' }}></div>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-2">Step 2 of 4</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Which of these areas sound most like you?
          </h1>
          <p className="text-gray-600">
            Select up to 2 giftings that resonate with how God has made you
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

        <div style={{ 
          textAlign: 'center', 
          marginTop: 24, 
          padding: '8px 16px',
          backgroundColor: selectedGifts.size > 0 ? SURVEY_GREEN : '#f9fafb',
          border: selectedGifts.size > 0 ? `1px solid ${SURVEY_GREEN}` : '1px solid #e5e7eb',
          borderRadius: '9999px',
          display: 'inline-block',
          margin: '24px auto 0',
          color: selectedGifts.size > 0 ? 'white' : '#6b7280',
          fontWeight: 600,
          fontSize: 14
        }}>
          Selected: {selectedGifts.size}/2
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, gap: 16 }}>
          <button
            onClick={() => router.push('/survey/step1')}
            className="text-gray-600 hover:text-gray-800 transition flex items-center gap-2"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 16,
              cursor: 'pointer',
              padding: '12px 24px',
              minWidth: '120px',
              justifyContent: 'flex-start'
            }}
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={selectedGifts.size !== 2}
            className="transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              backgroundColor: selectedGifts.size === 2 ? SURVEY_GREEN : '#9ca3af',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: 16,
              fontWeight: 600,
              cursor: selectedGifts.size === 2 ? 'pointer' : 'not-allowed',
              minWidth: '120px',
              justifyContent: 'flex-end'
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
