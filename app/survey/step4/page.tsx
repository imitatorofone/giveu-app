'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

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
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/');
        return;
      }
      setUser(data.user);

      // Get user's profile to see their selected gift areas
      const { data: profile } = await supabase
        .from('profiles')
        .select('gift_selections')
        .eq('id', data.user.id)
        .single();

      if (profile && profile.gift_selections && profile.gift_selections.length > 1) {
        setCurrentGiftArea(profile.gift_selections[1]); // Second selected gift area
        setUserProfile(profile);
      } else {
        // No second gift area, go to step 5
        console.log('No second gift area found, going to step 5');
        router.push('/survey/step5');
      }
    };
    getUser();
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
    if (!user || selectedTags.size === 0) return;

    const selectedTagsArray = Array.from(selectedTags);
    
    // Create proper column name mapping
    const columnMapping: { [key: string]: string } = {
      'Hands-On Skills': 'hands_on_skills_tags',
      'People & Relationships': 'people_relationships_tags',
      'Problem-Solving & Organizing': 'problem_solving_organizing_tags',
      'Care & Comfort': 'care_comfort_tags',
      'Learning & Teaching': 'learning_teaching_tags',
      'Creativity & Expression': 'creativity_expression_tags',
      'Leadership & Motivation': 'leadership_motivation_tags',
      'Behind-the-Scenes Support': 'behind_scenes_support_tags',
      'Physical & Active': 'physical_active_tags',
      'Pioneering & Connecting': 'pioneering_connecting_tags'
    };

    const columnName = columnMapping[currentGiftArea];
    
    console.log('Gift area:', currentGiftArea);
    console.log('Column name:', columnName);
    console.log('Saving tags:', selectedTagsArray);

    if (columnName) {
      await supabase
        .from('profiles')
        .update({
          [columnName]: selectedTagsArray
        })
        .eq('id', user.id);
    }

    router.push('/survey/step5'); // Changed from /survey/complete
  };

  if (!user || !currentGiftArea) return <div>Loading...</div>;

  const availableTags = giftTags[currentGiftArea] || [];

  return (
    <main style={{ maxWidth: 520, margin: '40px auto', fontFamily: 'sans-serif' }}>
      {/* Progress indicator */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Question 3 of 6</div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>50% complete</div>
        <div style={{ width: '100%', height: 4, backgroundColor: '#eee', borderRadius: 2 }}>
          <div style={{ width: '50%', height: '100%', backgroundColor: '#4ECDC4', borderRadius: 2 }}></div>
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
          {currentGiftArea}
        </h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Select up to 2 tags that best describe your skills in this gifting
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {availableTags.map((tag) => {
            const isSelected = selectedTags.has(tag);
            const isDisabled = !isSelected && selectedTags.size >= 2;
            
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                disabled={isDisabled}
                style={{
                  padding: '12px 16px',
                  border: isSelected ? '2px solid #4ECDC4' : '1px solid #ddd',
                  borderRadius: 8,
                  backgroundColor: isSelected ? '#f0fffe' : 'white',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1,
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: isSelected ? 500 : 400
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
          Selected: {selectedTags.size}/2
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
        <button
          onClick={() => router.push('/survey/step3')}
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
          disabled={selectedTags.size === 0}
          style={{
            backgroundColor: selectedTags.size > 0 ? '#4ECDC4' : '#ccc',
            color: 'white',
            padding: '16px 32px',
            borderRadius: 8,
            border: 'none',
            fontSize: 16,
            fontWeight: 500,
            cursor: selectedTags.size > 0 ? 'pointer' : 'not-allowed'
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
