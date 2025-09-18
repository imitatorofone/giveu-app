'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface ServiceBoardProps {
  userId: string;
  orgId: string;
}

interface Need {
  id: string;
  title: string;
  description: string;
  urgency: string;
  people_required: number;
  event_date: string;
  tags: string[];
  signups?: Array<{ user_id: string }>;
}

export default function ServiceBoard({ userId, orgId }: ServiceBoardProps) {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [highlightedNeedId, setHighlightedNeedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Get highlighted need from URL params (from notification click)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const highlight = params.get('highlight');
      if (highlight) setHighlightedNeedId(highlight);
    }
    
    fetchMatchedNeeds();
  }, [userId, orgId]);
  
  const fetchMatchedNeeds = async () => {
    try {
      setLoading(true);
      
      // Get user's profile with gift selections
      const { data: profile } = await supabase
        .from('profiles')
        .select('gift_selections')
        .eq('id', userId)
        .single();
      
      const userGifts = profile?.gift_selections || [];
      
      if (userGifts.length === 0) {
        setNeeds([]);
        setLoading(false);
        return;
      }
      
      // Get all approved needs
      const { data: allNeeds } = await supabase
        .from('needs')
        .select('*, signups!left(user_id)')
        .eq('org_id', orgId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      if (!allNeeds) {
        setNeeds([]);
        setLoading(false);
        return;
      }
      
      // Filter needs that match user's gifts
      const matchedNeeds = allNeeds.filter(need => {
        const needTags = need.tags || [];
        return needTags.some((tag: string) =>
          userGifts.some((gift: string) =>
            gift.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(gift.toLowerCase())
          )
        );
      });
      
      setNeeds(matchedNeeds);
    } catch (error) {
      console.error('Error fetching matched needs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignUp = async (needId: string) => {
    try {
      const { error } = await supabase
        .from('signups')
        .insert({
          need_id: needId,
          user_id: userId,
          org_id: orgId,
          status: 'pending'
        });
      
      if (error) {
        console.error('Error signing up:', error);
        alert('Failed to sign up. Please try again.');
        return;
      }
      
      // Refresh the needs list
      fetchMatchedNeeds();
      alert('Successfully signed up!');
    } catch (error) {
      console.error('Error in handleSignUp:', error);
      alert('Failed to sign up. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: 'var(--muted-foreground)' }}>Loading opportunities...</p>
      </div>
    );
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ 
          fontSize: 24, 
          fontWeight: 'bold', 
          margin: '0 0 8px', 
          color: 'var(--foreground)' 
        }}>
          Your Service Board
        </h2>
        <p style={{ color: 'var(--muted-foreground)' }}>
          Opportunities that match your gifts and interests
        </p>
      </div>
      
      {needs.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 32, 
          color: 'var(--muted-foreground)' 
        }}>
          <p>No matching opportunities right now.</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>
            Check back later or update your gifts in your profile.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {needs.map((need) => (
            <NeedCard 
              key={need.id}
              need={need}
              userId={userId}
              isHighlighted={need.id === highlightedNeedId}
              onSignUp={() => handleSignUp(need.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NeedCard({ 
  need, 
  userId, 
  isHighlighted, 
  onSignUp 
}: { 
  need: Need; 
  userId: string;
  isHighlighted: boolean; 
  onSignUp: () => void; 
}) {
  const userSignedUp = need.signups?.some(s => s.user_id === userId);
  
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 24,
      backgroundColor: isHighlighted ? 'var(--muted)' : 'var(--card)',
      borderLeft: isHighlighted ? '4px solid var(--primary)' : '4px solid transparent',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.2s'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'start', 
        marginBottom: 12 
      }}>
        <h3 style={{ 
          fontSize: 18, 
          fontWeight: 600, 
          margin: 0, 
          color: 'var(--foreground)' 
        }}>
          {need.title}
        </h3>
        <span style={{
          padding: '4px 8px',
          fontSize: 12,
          borderRadius: 12,
          backgroundColor: need.urgency === 'urgent' ? '#fecaca' :
                          need.urgency === 'soon' ? '#fed7aa' :
                          '#bbf7d0',
          color: need.urgency === 'urgent' ? '#dc2626' :
                 need.urgency === 'soon' ? '#ea580c' :
                 '#16a34a'
        }}>
          {need.urgency}
        </span>
      </div>
      
      <p style={{ 
        color: 'var(--muted-foreground)', 
        margin: '0 0 16px', 
        lineHeight: 1.5 
      }}>
        {need.description}
      </p>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
          {need.people_required} people needed • {new Date(need.event_date).toLocaleDateString()}
        </div>
        
        <button 
          onClick={onSignUp}
          disabled={userSignedUp}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            border: 'none',
            cursor: userSignedUp ? 'not-allowed' : 'pointer',
            backgroundColor: userSignedUp ? 'var(--success)' : 'var(--primary)',
            color: userSignedUp ? 'var(--success-foreground)' : 'var(--primary-foreground)',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!userSignedUp) {
              e.currentTarget.style.backgroundColor = 'var(--primary)';
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (!userSignedUp) {
              e.currentTarget.style.backgroundColor = 'var(--primary)';
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {userSignedUp ? 'Signed Up!' : 'I Can Help'}
        </button>
      </div>
    </div>
  );
}
