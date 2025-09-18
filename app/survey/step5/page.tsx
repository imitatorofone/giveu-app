'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SurveyStep5() {
  const [ratings, setRatings] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [userTags, setUserTags] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/');
        return;
      }
      setUser(data.user);

      // Get all the tags the user selected in previous steps
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      console.log('Profile query result:', { profile, profileError });

      if (profile) {
        // Collect all selected tags from all gift areas
        const allTags: string[] = [];
        
        // Debug: log the entire profile to see what we have
        console.log('Full profile:', profile);
        
        // Check each possible column for tags
        Object.keys(profile).forEach(key => {
          if (key.endsWith('_tags') && profile[key] && Array.isArray(profile[key])) {
            console.log(`Found tags in ${key}:`, profile[key]);
            allTags.push(...profile[key]);
          }
        });

        console.log('All collected tags:', allTags);
        setUserTags(allTags);
      } else {
        console.error('No profile found - user may not have completed previous steps');
        router.push('/survey/step2');
      }
    };
    getUser();
  }, []);

  const setRating = (tag: string, level: string) => {
    setRatings((prev: any) => ({
      ...prev,
      [tag]: level
    }));
  };

  const getRatingColor = (level: string) => {
    switch(level) {
      case 'learning': return '#ef4444'; // red
      case 'helping': return '#f59e0b'; // yellow/orange
      case 'leading': return '#10b981'; // green
      default: return '#d1d5db'; // gray
    }
  };

  const handleNext = async () => {
    if (!user) return;

    // Save the ratings
    await supabase
      .from('profiles')
      .update({
        skill_ratings: ratings
      })
      .eq('id', user.id);

    router.push('/survey/availability'); // Changed from /survey/complete
  };

  const allRated = userTags.length > 0 && userTags.every(tag => ratings[tag]);

  if (!user) return <div>Loading...</div>;

  return (
    <main style={{ maxWidth: 520, margin: '40px auto', fontFamily: 'sans-serif' }}>
      {/* Progress indicator */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Question 4 of 6</div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>67% complete</div>
        <div style={{ width: '100%', height: 4, backgroundColor: '#eee', borderRadius: 2 }}>
          <div style={{ width: '67%', height: '100%', backgroundColor: '#4ECDC4', borderRadius: 2 }}></div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #eee', 
        borderRadius: 12, 
        padding: 32,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
            Learning 🔴 / Helping 🟡 / Leading 🟢
          </h1>
          <p style={{ color: '#666' }}>
            There are no wrong answers. This just helps leaders see how you'd like to use your gifts right now.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {userTags.map((tag) => (
            <div key={tag} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <span style={{ fontWeight: 500 }}>{tag}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setRating(tag, 'learning')}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: ratings[tag] === 'learning' ? '3px solid #ef4444' : '2px solid #d1d5db',
                    backgroundColor: '#ef4444',
                    cursor: 'pointer'
                  }}
                />
                <button
                  onClick={() => setRating(tag, 'helping')}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: ratings[tag] === 'helping' ? '3px solid #f59e0b' : '2px solid #d1d5db',
                    backgroundColor: '#f59e0b',
                    cursor: 'pointer'
                  }}
                />
                <button
                  onClick={() => setRating(tag, 'leading')}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: ratings[tag] === 'leading' ? '3px solid #10b981' : '2px solid #d1d5db',
                    backgroundColor: '#10b981',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
        <button
          onClick={() => router.push('/survey/step4')}
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
          disabled={!allRated}
          style={{
            backgroundColor: allRated ? '#4ECDC4' : '#ccc',
            color: 'white',
            padding: '16px 32px',
            borderRadius: 8,
            border: 'none',
            fontSize: 16,
            fontWeight: 500,
            cursor: allRated ? 'pointer' : 'not-allowed'
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
