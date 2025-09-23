'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Heart, ArrowLeft, ArrowRight } from 'lucide-react';

// Survey-wide design constants
const SURVEY_GREEN = '#20c997';
const SURVEY_CARD = 'max-w-2xl mx-auto bg-white rounded-xl shadow-sm border-2 border-gray-100 p-8';
const SURVEY_BUTTON = 'w-full py-3 bg-[#20c997] text-white rounded-lg font-semibold hover:opacity-90';
const SURVEY_PROGRESS = 'h-2 bg-gray-200 rounded-full mb-6';
const SELECTED_STYLE = 'bg-[#20c997] text-white border-[#20c997]';
const UNSELECTED_STYLE = 'bg-white border-gray-300 text-gray-700 hover:border-[#20c997]';

const giftTags: { [key: string]: string[] } = {
  'Hands-On Skills': ['Carpentry', 'Repairs', 'Gardening', 'Sewing', 'Cooking', 'Decorating', 'Setup/Tear-down'],
  'People & Relationships': ['Hospitality', 'Listening', 'Mentoring', 'Counseling', 'Welcoming', 'Hosting'],
  'Problem-Solving & Organizing': ['Planning', 'Budgeting', 'Logistics', 'Strategy', 'Administration', 'Research'],
  'Care & Comfort': ['Visiting the Sick', 'Meal Prep', 'Childcare', 'Encouragement', 'Prayer', 'Compassion Care'],
  'Learning & Teaching': ['Tutoring', 'Bible Study Leading', 'Skill Training', 'Coaching', 'Public Speaking'],
  'Creativity & Expression': ['Art', 'Music', 'Writing', 'Photography', 'Design', 'Storytelling', 'Media Production'],
  'Leadership & Motivation': ['Facilitating Groups', 'Casting Vision', 'Mentoring Teams', 'Event Leadership', 'Preaching'],
  'Behind-the-Scenes Support': ['Tech Support', 'AV/Production', 'Finance', 'Cleaning', 'Setup Crew', 'Admin Tasks'],
  'Physical & Active': ['Sports Coaching', 'Outdoor Projects', 'Moving Help', 'Event Setup', 'Fitness Activities'],
  'Pioneering & Connecting': ['Evangelism', 'Community Outreach', 'Starting Ministries', 'Networking', 'Fundraising']
};

export default function SurveyStep4() {
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentGiftArea, setCurrentGiftArea] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function loadCategories() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth');
        return;
      }

      setUser(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_gift_categories')
        .eq('id', session.user.id)
        .single();

      if (profile?.selected_gift_categories) {
        // Use these categories to filter which skills to show
        if (profile.selected_gift_categories.length > 1) {
          setCurrentGiftArea(profile.selected_gift_categories[1]); // Second selected gift area
          setUserProfile(profile);
        } else {
          // No second gift area, go to step 5
          console.log('No second gift area found, going to step 5');
          router.push('/survey/step5');
        }
      } else {
        console.log('No selected categories found, redirecting to step 2');
        router.push('/survey/step2');
      }
    }
    
    loadCategories();
  }, []);

  const toggleTag = (tag: string) => {
    const newSelected = new Set(selectedTags);
    
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else if (newSelected.size < 2) {
      newSelected.add(tag);
    }
    
    setSelectedTags(newSelected);
  };

  const handleNext = async () => {
    const selectedTagsArray = Array.from(selectedTags);
    
    if (selectedTagsArray.length === 0) {
      alert('Please select at least one skill');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert('Please sign in to continue');
      return;
    }

    // Get existing gift_selections and append new ones
    const { data: profile } = await supabase
      .from('profiles')
      .select('gift_selections')
      .eq('id', session.user.id)
      .single();

    const existingSelections = profile?.gift_selections || [];
    const updatedSelections = [...existingSelections, ...selectedTagsArray];

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        gift_selections: updatedSelections,  // Use existing column
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving:', error);
      alert(`Error saving your selections: ${error.message}. Please try again.`);
      return;
    }

    console.log('Survey completed! All skills saved:', updatedSelections);
    router.push('/survey/complete');
  };

  if (!user || !currentGiftArea) return <div>Loading...</div>;

  const availableTags = giftTags[currentGiftArea] || [];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className={SURVEY_CARD}>
        {/* Progress indicator */}
        <div className={`w-full ${SURVEY_PROGRESS}`}>
          <div className="bg-[#20c997] h-2 rounded-full transition-all" style={{ width: '100%' }}></div>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-2">Step 4 of 4</p>
        </div>

        {/* Category Header Card */}
        <div style={{ 
          backgroundColor: SURVEY_GREEN, 
          borderRadius: 12, 
          padding: 16, 
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            backgroundColor: 'white', 
            borderRadius: 8, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Heart size={20} color={SURVEY_GREEN} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-1">
              {currentGiftArea}
            </h1>
            <p className="text-sm text-white opacity-90">
              Select up to 2 tags that best describe your skills in this gifting
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {availableTags.map((tag) => {
            const isSelected = selectedTags.has(tag);
            const isDisabled = !isSelected && selectedTags.size >= 2;
            
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                disabled={isDisabled}
                className={`px-3 py-2 rounded-full border text-sm font-medium transition min-h-[36px] flex items-center justify-center ${
                  isSelected ? SELECTED_STYLE : UNSELECTED_STYLE
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
          Selected: {selectedTags.size}/2
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, gap: 16 }}>
          <button
            onClick={() => router.push('/survey/step3')}
            className="text-gray-600 hover:text-gray-800 transition flex items-center gap-2"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 16,
              cursor: 'pointer',
              padding: '12px 24px'
            }}
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={selectedTags.size === 0}
            className="transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              backgroundColor: selectedTags.size > 0 ? SURVEY_GREEN : '#9ca3af',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: 16,
              fontWeight: 600,
              cursor: selectedTags.size > 0 ? 'pointer' : 'not-allowed',
              minWidth: '120px',
              justifyContent: 'flex-end'
            }}
          >
            Complete Discovery
            <ArrowRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </main>
  );
}
