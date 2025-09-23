'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Users, User, Bell, 
  Heart, CalendarDays, Plus, UserCircle, MessageCircle 
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient'; // Use your shared client
import { GIFT_CATEGORIES } from '../../constants/giftCategories.js';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import toast from 'react-hot-toast';

// Brand typography
const quicksandFont = 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif';
const merriweatherFont = 'Merriweather, Georgia, serif';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  committed: number;
  needed: number;
  categories: string[];
  tags: string[];
}

export default function MemberDashboard() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Best Match');
  const [userGifts, setUserGifts] = useState<string[]>([]);

  // Helper function for dynamic tag coloring
  const getTagColor = (tag: string) => {
    const tagName = tag.replace(' ✓', ''); // Remove checkmark for comparison
    const isMatch = userGifts.some(gift => 
      gift.toLowerCase().includes(tagName.toLowerCase()) ||
      tagName.toLowerCase().includes(gift.toLowerCase())
    );

    return {
      isMatch,
      styles: isMatch ? {
        backgroundColor: '#20c997', // Solid brand green background
        color: 'white',             // White text (like "All" button)
        border: '1px solid #20c997' // Same color border
      } : {
        backgroundColor: '#f8fafc',   // Light grey background
        color: '#64748b',             // Grey text
        border: '1px solid #cbd5e1'   // Grey border
      }
    };
  };

  const fetchNeeds = async () => {
    try {
      console.log('Fetching real needs from database...');
      
      const { data, error } = await supabase
        .from('needs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.log('Database error:', error);
        setOpportunities([]);
      } else {
        console.log('Found needs:', data?.length || 0);
        
        if (data && data.length > 0) {
          const transformedOpportunities: Opportunity[] = data.map((need: any) => ({
            id: need.id,
            title: need.title || `Need in ${need.location || 'Community'}`,
            description: need.description || 'Community assistance needed.',
            location: need.location || need.geographic_location || need.city || 'Location TBD',
            date: need.specific_date || need.event_date || need.ongoing_start_date || 'Flexible',
            time: need.specific_time || need.ongoing_start_time || need.time_preference || 'Flexible',
            committed: need.current_responses || 0,
            needed: need.people_needed || 1,
            categories: need.giftings_needed && need.giftings_needed.length > 0 ? need.giftings_needed : ['Care'],
            tags: need.giftings_needed && need.giftings_needed.length > 0 
              ? need.giftings_needed.map((gift: string) => `${gift} ✓`) 
              : ['Care ✓']
          }));
          
          console.log('Transformed opportunities:', transformedOpportunities);
          setOpportunities(transformedOpportunities);
        } else {
          setOpportunities([]);
        }
      }
    } catch (err) {
      console.log('Connection error:', err);
      setOpportunities([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNeeds();
  }, []);

  // Add this useEffect to fetch real user gifts
  useEffect(() => {
    async function fetchUserGifts() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('gift_selections')
          .eq('id', user.id)
          .single();

        if (profile?.gift_selections) {
          setUserGifts(profile.gift_selections);
          console.log('User gifts loaded for filtering:', profile.gift_selections);
        }
      } catch (error) {
        console.error('Error fetching user gifts:', error);
      }
    }

    fetchUserGifts();
  }, []);

  const categories = [
    'All', 'Hands-On', 'People', 'Problem-Solving', 'Care', 
    'Learning', 'Creativity', 'Leadership', 'Behind-the-Scenes', 'Physical', 'Pioneering'
  ];

  const staticOpportunities = [
    {
      id: '1',
      title: 'Community Meal Preparation',
      description: 'Help prepare meals for families in need during our monthly outreach event.',
      location: 'Church Kitchen',
      time: '2-5pm',
      date: 'This Saturday',
      committed: 1,
      needed: 5,
      categories: ['Hands-On', 'Care'],
      tags: ['Cooking ✓', 'Setup/Tear Down ✓']
    },
    {
      id: '2',
      title: 'Garden Care',
      description: 'Maintain garden beds around the church property. Help keep our grounds beautiful.',
      location: 'Church Grounds',
      time: '9am-12pm',
      date: 'This Saturday',
      committed: 0,
      needed: 4,
      categories: ['Hands-On', 'Physical'],
      tags: ['Gardening ✓', 'Physical ✓']
    },
    {
      id: '3',
      title: 'Event Planning',
      description: 'Help organize church events and activities throughout the year.',
      location: 'Church Office',
      time: '6-8pm',
      date: 'Thursday',
      committed: 1,
      needed: 2,
      categories: ['Leadership', 'Behind-the-Scenes'],
      tags: ['Planning ✓', 'Logistics ✓']
    },
    {
      id: '4',
      title: 'Food Bank Sorting',
      description: 'Sort and organize donations at our local food bank.',
      location: 'Food Bank',
      time: '10am-1pm',
      date: 'Next Saturday',
      committed: 0,
      needed: 6,
      categories: ['Care', 'Behind-the-Scenes'],
      tags: ['Administration ✓', 'Organization ✓']
    },
    {
      id: '5',
      title: 'Community Outreach Launch',
      description: 'Help start a new ministry reaching families in the Riverside neighborhood.',
      location: 'Various Locations',
      time: '7-9pm',
      date: 'Next Tuesday',
      committed: 0,
      needed: 3,
      categories: ['Pioneering', 'People'],
      tags: ['Evangelism ✓', 'Networking ✓']
    }
  ];

  const filteredOpportunities = opportunities.filter(opp => 
    activeFilter === 'All' || opp.categories.some(cat => cat === activeFilter)
  );

  const handleICanHelp = async (needId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      toast.error('Please sign in to help');
      return;
    }

    // Check if already committed
    const { data: existing } = await supabase
      .from('commitments')
      .select('id')
      .eq('need_id', needId)
      .eq('user_id', session.user.id)
      .single();

    if (existing) {
      toast('You already signed up for this!');
      return;
    }

    // Create commitment
    const { error } = await supabase
      .from('commitments')
      .insert({
        need_id: needId,
        user_id: session.user.id,
        status: 'confirmed'
      });

    if (error) {
      console.error('Commitment error:', error);
      toast.error('Failed to sign up');
    } else {
      toast.success('You\'re signed up to help!');
      
      // Update volunteer count
      await supabase.rpc('increment_volunteer_count', { need_id: needId });
      
      // Refresh the needs list
      fetchNeeds();
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 32, 
            height: 32, 
            border: '2px solid #10b981',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: 8, color: '#6b7280' }}>Loading opportunities...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#f9fafb', 
      minHeight: '100vh', 
      paddingBottom: '80px',
      fontFamily: merriweatherFont // Default to body font
    }}>
      <Header />

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700',
            marginBottom: '8px',
            color: '#1e293b',
            fontFamily: quicksandFont // Quicksand for headings
          }}>
            Ways to Serve
          </h1>
          <p style={{ 
            color: '#64748b',
            fontSize: '16px',
            fontFamily: merriweatherFont // Merriweather for body text
          }}>Discover opportunities to use your gifts</p>
        </div>

        {/* Filter Buttons */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px', 
          marginBottom: '24px'
        }}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'Quicksand, sans-serif', // Add Quicksand font
                border: activeFilter === category ? 'none' : '1px solid #d1d5db',
                backgroundColor: activeFilter === category ? '#20c997' : 'white',
                color: activeFilter === category ? 'white' : '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (activeFilter !== category) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseOut={(e) => {
                if (activeFilter !== category) {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'white';
                }
              }}
            >
              {category}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ 
            color: '#64748b',
            fontFamily: 'Merriweather, serif',
            fontSize: '14px'
          }}>
            {filteredOpportunities.length} opportunities • {filteredOpportunities.filter(opp => 
              opp.tags.some(tag => {
                const tagName = tag.replace(' ✓', '');
                return userGifts.some(gift => 
                  gift.toLowerCase().includes(tagName.toLowerCase()) ||
                  tagName.toLowerCase().includes(gift.toLowerCase())
                );
              })
            ).length} match your gifts
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '14px', 
              color: '#64748b',
              fontFamily: 'Quicksand, sans-serif',
              fontWeight: '500'
            }}>
              Sort:
            </span>
            
            {/* Custom Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  fontFamily: 'Quicksand, sans-serif',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer',
                  minWidth: '120px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {selectedSort}
                <span style={{ marginLeft: '8px' }}>▼</span>
              </button>
              
              {sortOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  marginTop: '4px',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                  {['Best Match', 'Newest', 'Date', 'Most Needed'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedSort(option);
                        setSortOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.backgroundColor = '#20c997';
                        (e.target as HTMLButtonElement).style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                        (e.target as HTMLButtonElement).style.color = '#374151';
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {filteredOpportunities.map((opportunity) => (
            <div key={opportunity.id} style={{ 
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '280px' // Consistent card height
            }}>
              {/* Card Header */}
              <div style={{ padding: '20px 20px 0 20px' }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '700', // Changed from '600' to '700' for bold
                  marginBottom: '16px',
                  color: '#1e293b',
                  lineHeight: '1.3',
                  fontFamily: quicksandFont
                }}>
                  {opportunity.title}
                </h3>
                
                {/* Metadata Row - 3 columns horizontal layout */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: '#64748b',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '12px'
                }}>
                  {/* Column 1 - Date */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <Calendar size={16} style={{ marginBottom: '4px', color: '#64748b' }} />
                    <div style={{ fontSize: '12px', textAlign: 'center', lineHeight: '1.2' }}>
                      {opportunity.date}
                    </div>
                  </div>
                  
                  {/* Column 2 - Location */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <MapPin size={16} style={{ marginBottom: '4px', color: '#64748b' }} />
                    <div style={{ fontSize: '12px', textAlign: 'center', lineHeight: '1.2' }}>
                      {opportunity.location}
                    </div>
                  </div>
                  
                  {/* Column 3 - People */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <Users size={16} style={{ marginBottom: '4px', color: '#64748b' }} />
                    <div style={{ fontSize: '12px', textAlign: 'center', lineHeight: '1.2' }}>
                      {opportunity.committed} committed<br/>{opportunity.needed}+ needed
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ 
                padding: '0 20px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <p style={{ 
                  color: '#475569',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  marginBottom: '16px',
                  flex: 1,
                  fontFamily: merriweatherFont
                }}>
                  {opportunity.description}
                </p>

                {/* Tags - Dynamic color and checkmarks with Quicksand font */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  {opportunity.tags.map((tag) => {
                    const tagName = tag.replace(' ✓', ''); // Clean tag name
                    const { isMatch, styles } = getTagColor(tag);
                    
                    return (
                      <span
                        key={tag}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '500',
                          fontFamily: 'Quicksand, sans-serif',
                          ...styles
                        }}
                      >
                        {tagName} {/* No checkmark, just clean tag name */}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Card Footer */}
              <div style={{ 
                padding: '16px 20px',
                borderTop: '1px solid #f1f5f9',
                backgroundColor: '#fafbfc'
              }}>
                <button 
                  onClick={() => handleICanHelp(opportunity.id)}
                  style={{ 
                    width: '100%',
                    backgroundColor: '#20c997',
                    color: 'white',
                    padding: '12px 0',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '15px',
                    transition: 'all 0.2s'
                  }}
                >
                  I Can Help
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Persistent Footer */}
      <Footer />
    </div>
  );
}