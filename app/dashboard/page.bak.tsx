'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { FeedbackModal } from '../components/FeedbackModal';
import { FeedbackList } from '../components/FeedbackList';
import { FeedbackButton } from '../components/FeedbackButton';
import NotificationBell from '../components/NotificationBell';
import { Icon } from '../../icons/index';
import { 
  Home, 
  User, 
  Heart, 
  Calendar, 
  MessageCircle, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle,
  AlertCircle,
  BookOpen,
  Wrench,
  GraduationCap,
  Palette,
  Lightbulb,
  Shield,
  Activity,
  Target,
  Bell,
  LogOut,
  Brain,
  Crown,
  Settings,
  Dumbbell,
  Compass,
  AlertTriangle,
  Bug,
  ThumbsUp,
  MessageSquare,
  ChevronDown,
  Save,
  Sun,
  Moon,
  Sunrise,
  Timer
} from 'lucide-react';
import { GIFTING_CATEGORIES, TAG_DISPLAY_NAMES, getCategoryByTag, getTagDisplayName } from '../../lib/giftingStructure';
import { GiftTag } from '../../components/GiftingComponents';

// Types
interface Need {
  id: number;
  title: string;
  description: string;
  primaryGifting: string;
  giftingsNeeded: string[];
  peopleNeeded: number;
  location: string;
  timeframe: string;
  urgent: boolean;
}


// Helper function to safely get giftings from a need object
// Updated to handle both test and real data structures (including object arrays)
const getNeedGiftings = (need: any, isTestMode: boolean = false): string[] => {
  let giftings: string[] = [];
  
  if (isTestMode) {
    // Test mode uses simple string arrays with snake_case field name
    giftings = Array.isArray(need.giftings_needed) 
      ? need.giftings_needed 
      : need.giftings_needed?.split(', ') || [];
  } else {
    // Real data uses camelCase field name - giftingsNeeded
    if (Array.isArray(need.giftingsNeeded)) {
      console.log('🔍 DEBUG: Processing array of length:', need.giftingsNeeded.length);
      console.log('🔍 DEBUG: First item:', need.giftingsNeeded[0], 'Type:', typeof need.giftingsNeeded[0]);
      
      giftings = need.giftingsNeeded.map((item: any, index: number) => {
        // If it's already a string, return it
        if (typeof item === 'string') {
          console.log(`🔍 DEBUG: Item ${index} is string:`, item);
          return item;
        }
        
        // If it's an object, extract the relevant property
        console.log(`🔍 DEBUG: Item ${index} is object:`, item);
        console.log(`🔍 DEBUG: Object keys:`, Object.keys(item || {}));
        
        const extracted = item.name || item.tag || item.title || item.value || item.toString();
        console.log(`🔍 DEBUG: Extracted value:`, extracted);
        return extracted;
      }).filter(Boolean); // Remove any undefined/null values
    } else if (typeof need.giftingsNeeded === 'string') {
      giftings = need.giftingsNeeded.split(', ');
    }
  }
  
  console.log('🔍 Extracted giftings:', giftings, 'from:', isTestMode ? need.giftings_needed : need.giftingsNeeded);
  return giftings;
};

// NeedCard Component
const NeedCard = ({ need, userGifts = [], onCanHelp, user, profile }: { need: Need; userGifts?: string[]; onCanHelp?: (needId: string) => void; user?: any; profile?: any }) => {
  const [responseCount, setResponseCount] = useState(0)

  // Profile gift extraction function for NeedCard
  const getUserGifts = (profile: any): string[] => {
    let allGifts: string[] = [];
    
    // Extract from gift_selections array
    if (Array.isArray(profile?.gift_selections)) {
      allGifts = [...allGifts, ...profile.gift_selections];
    }
    
    // Extract from giftings object (flatten all category arrays)
    if (profile?.giftings && typeof profile.giftings === 'object') {
      Object.values(profile.giftings).forEach(categoryArray => {
        if (Array.isArray(categoryArray)) {
          allGifts = [...allGifts, ...categoryArray];
        }
      });
    }
    
    return allGifts;
  };

  useEffect(() => {
    const fetchCount = async () => {
      const { data } = await supabase
        .from('opportunity_responses')
        .select('id')
        .eq('need_id', need.id.toString())
      
      setResponseCount(data?.length || 0)
    }
    
    fetchCount()
  }, [need.id])
  const getGiftingIcon = (gifting: string) => {
    const iconMap = {
      'hands-on-skills': <Wrench size={14} />,
      'people-relationships': <Users size={14} />,
      'problem-solving-organizing': <Brain size={14} />,
      'care-comfort': <Heart size={14} />,
      'learning-teaching': <BookOpen size={14} />,
      'creativity-expression': <Palette size={14} />,
      'leadership-motivation': <Crown size={14} />,
      'behind-scenes-support': <Settings size={14} />,
      'physical-active': <Dumbbell size={14} />,
      'pioneering-connecting': <Compass size={14} />
    };
    return (iconMap as any)[gifting] || <Wrench size={14} />;
  };

  const getGiftingColor = (gifting: string) => {
    const category = GIFTING_CATEGORIES[gifting as keyof typeof GIFTING_CATEGORIES];
    if (!category) return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    
    // Convert Tailwind classes to hex colors
    const colorMap: { [key: string]: string } = {
      'bg-blue-100': '#dbeafe', 'text-blue-800': '#1e40af', 'border-blue-200': '#bfdbfe',
      'bg-purple-100': '#e9d5ff', 'text-purple-800': '#6b21a8', 'border-purple-200': '#d8b4fe',
      'bg-gray-100': '#f3f4f6', 'text-gray-800': '#374151', 'border-gray-200': '#e5e7eb',
      'bg-pink-100': '#fce7f3', 'text-pink-800': '#be185d', 'border-pink-200': '#fbcfe8',
      'bg-indigo-100': '#e0e7ff', 'text-indigo-800': '#3730a3', 'border-indigo-200': '#c7d2fe',
      'bg-rose-100': '#ffe4e6', 'text-rose-800': '#be123c', 'border-rose-200': '#fecdd3',
      'bg-amber-100': '#fef3c7', 'text-amber-800': '#92400e', 'border-amber-200': '#fde68a',
      'bg-slate-100': '#f1f5f9', 'text-slate-800': '#334155', 'border-slate-200': '#e2e8f0',
      'bg-green-100': '#dcfce7', 'text-green-800': '#166534', 'border-green-200': '#bbf7d0',
      'bg-orange-100': '#fed7aa', 'text-orange-800': '#c2410c', 'border-orange-200': '#fdba74'
    };
    
    return {
      bg: colorMap[category.bgColor] || '#f3f4f6',
      text: colorMap[category.textColor] || '#374151',
      border: colorMap[category.borderColor] || '#e5e7eb'
    };
  };

  const primaryColor = getGiftingColor(need.primaryGifting);

  const getCategoryClass = (gifting: string) => {
    const categoryMap: { [key: string]: string } = {
      'hands-on-skills': 'category-hands-on',
      'people-relationships': 'category-people',
      'problem-solving-organizing': 'category-organizing',
      'care-comfort': 'category-care',
      'learning-teaching': 'category-teaching',
      'creativity-expression': 'category-creative',
      'leadership-motivation': 'category-leadership',
      'behind-scenes-support': 'category-support',
      'physical-active': 'category-physical',
      'pioneering-connecting': 'category-pioneering'
    };
    return categoryMap[gifting] || 'category-hands-on';
  };

  // Helper function to format time properly
  const formatTime = (timeString: string) => {
    if (!timeString) return 'Time TBD';
    
    try {
      // Handle different time formats
      let time;
      if (timeString.includes(':')) {
        // Format: "11:00:00" or "11:00"
        const [hours, minutes] = timeString.split(':');
        time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        time = new Date(timeString);
      }
      
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString; // Return original if formatting fails
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date TBD';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to get proper date/time display
  const getDateTimeDisplay = (need: any) => {
    if (need.urgency === 'ongoing') {
      const startDate = need.ongoing_start_date ? formatDate(need.ongoing_start_date) : 'Ongoing starting';
      const startTime = need.ongoing_start_time ? formatTime(need.ongoing_start_time) : '';
      
      return {
        timeLabel: startDate,
        timeValue: startTime || need.ongoing_schedule || 'Schedule TBD'
      };
    } else if (need.urgency === 'asap') {
      return {
        timeLabel: 'ASAP',
        timeValue: need.time_preference || 'Time TBD'
      };
    } else {
      const eventDate = need.specific_date ? formatDate(need.specific_date) : 'As needed';
      const eventTime = need.specific_time ? formatTime(need.specific_time) : 'Time TBD';
      
      return {
        timeLabel: eventDate,
        timeValue: eventTime
      };
    }
  };

  return (
    <div className="opportunity-card" style={{ position: 'relative' }}>
      {/* Urgent Badge - Top Right */}
      {need.urgent && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          padding: '4px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontFamily: 'var(--font-quicksand)'
        }}>
          <AlertTriangle size={12} />
          URGENT
        </div>
      )}

      {/* Card Header */}
      <div className="card-header">
        {/* Title */}
        <h3 className="card-title">
          {need.title}
        </h3>
      </div>

      {/* Logistics */}
      <div className="card-logistics">
        <div className="logistic-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Calendar size={18} className="icon" />
          <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
            {(() => {
              const dateTime = getDateTimeDisplay(need);
              return (
                <>
                  <div>{dateTime.timeLabel}</div>
                  <div>{dateTime.timeValue}</div>
                </>
              );
            })()}
          </div>
        </div>
        <div className="logistic-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MapPin size={18} className="icon" />
          <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
            <div>{(need as any).city || (need as any).location || 'Location TBD'}</div>
          </div>
        </div>
        <div className="logistic-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Users size={18} className="icon" />
          <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
            <div>{responseCount} committed</div>
            <div>{Math.max(0, (need.people_needed || need.peopleNeeded || 0) - responseCount)}+ needed</div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body">
        {/* Description - JavaScript will add read more button */}
        <p className="card-description">
          {need.description}
        </p>

        {/* Tags - Always visible */}
        <div className="card-tags">
          {getNeedGiftings(need, false).map((gift: string) => {
            const userGifts = getUserGifts(profile);
            const isMatched = userGifts.some(userGift =>
              userGift.toLowerCase().includes(gift.toLowerCase()) ||
              gift.toLowerCase().includes(userGift.toLowerCase())
            );
            const category = getCategoryByTag(gift);
            return (
              <span 
                key={gift} 
                className={`tag ${isMatched ? 'matching' : ''}`}
                style={{
                  backgroundColor: isMatched ? '#dcfce7' : (category?.bgColor || '#f3f4f6'),
                  color: isMatched ? '#166534' : (category?.textColor || '#6b7280'),
                  borderColor: isMatched ? '#bbf7d0' : (category?.borderColor || '#d1d5db'),
                  border: '1px solid',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isMatched && (
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {getTagDisplayName(gift)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Card Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', marginTop: '16px' }}>
        <button 
          onClick={async () => {
            try {
              console.log('Need object:', need) // See the full need structure
              console.log('Need ID:', need.id)
              console.log('Need ID type:', typeof need.id)
              
              if (!user?.id) {
                alert('User not logged in properly')
                return
              }
              
              const { data, error } = await supabase
                .from('opportunity_responses')
                .insert({
                  need_id: need.id.toString(), // Convert to string
                  user_id: user.id,
                  response_type: 'interested'
                })
                .select()

              console.log('Supabase response:', { data, error })
              
              if (error) {
                console.error('Supabase error details:', error)
                alert(`Database error: ${error.message}`)
                return
              }
              
              alert('Response submitted successfully!')
              
              // Refresh the response count
              const { data: newData } = await supabase
                .from('opportunity_responses')
                .select('id')
                .eq('need_id', need.id.toString())
              
              setResponseCount(newData?.length || 0)
              
            } catch (error) {
              console.error('Full error details:', error)
              alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          I Can Help
        </button>
      </div>
    </div>
  );
};

// Tab Components
const HomeTab = () => {
  const { profile, user } = useAuth();
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all']);
  const [sortBy, setSortBy] = useState<string>('best-match');

  // Fixed profile gift extraction function - moved inside component scope
  const getUserGifts = (profile: any): string[] => {
    let allGifts: string[] = [];
    
    // Extract from gift_selections array
    if (Array.isArray(profile?.gift_selections)) {
      allGifts = [...allGifts, ...profile.gift_selections];
    }
    
    // Extract from giftings object (flatten all category arrays)
    if (profile?.giftings && typeof profile.giftings === 'object') {
      Object.values(profile.giftings).forEach(categoryArray => {
        if (Array.isArray(categoryArray)) {
          allGifts = [...allGifts, ...categoryArray];
        }
      });
    }
    
    console.log('🔍 Combined user gifts:', allGifts);
    return allGifts;
  };

  
  // Multi-select category toggle function
  const handleCategoryToggle = (category: string) => {
    setSelectedFilters(prev => {
      if (category === 'all') {
        // If "All" is clicked, clear all other selections
        return ['all'];
      }
      
      // Remove "all" if any specific category is selected
      let newFilters = prev.filter(f => f !== 'all');
      
      if (newFilters.includes(category)) {
        // Remove category if already selected
        newFilters = newFilters.filter(f => f !== category);
        
        // If no categories left, default to "all"
        if (newFilters.length === 0) {
          newFilters = ['all'];
        }
      } else {
        // Add category to selection
        newFilters = [...newFilters, category];
      }
      
      return newFilters;
    });
  };

  // Handle "I Can Help" button click
  const handleCanHelp = async (needId: string) => {
    if (!user?.id) {
      alert('Please log in to volunteer for opportunities.');
      return;
    }

    try {
      const { error } = await supabase
        .from('opportunity_responses')
        .insert({
          need_id: needId,
          user_id: user.id,
          response_type: 'interested'
        });

      if (error) throw error;
      
      // Show success message
      alert('Response submitted! Leadership will be notified.');
      
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Error submitting response. Please try again.');
    }
  };
  
  // Get user's selected gifts for matching
  const userGifts = getUserGifts(profile);
  
  const emptyMatchedTags: string[] = [];
  
  // Convert old tag format to new format
  const convertToNewTagFormat = (oldTags: string[]) => {
    const tagMap: { [key: string]: string } = {
      'Cooking': 'cooking',
      'Music': 'music', 
      'Mentoring': 'mentoring',
      'Carpentry': 'carpentry',
      'Hospitality': 'hospitality',
      'Listening': 'listening',
      'Counseling': 'counseling',
      'Welcoming': 'welcoming',
      'Hosting': 'hosting',
      'Planning': 'planning',
      'Budgeting': 'budgeting',
      'Logistics': 'logistics',
      'Strategy': 'strategy',
      'Administration': 'administration',
      'Research': 'research',
      'Visiting the Sick': 'visiting-sick',
      'Meal Prep': 'meal-prep',
      'Childcare': 'childcare',
      'Encouragement': 'encouragement',
      'Prayer': 'prayer',
      'Compassion Care': 'compassion-care',
      'Tutoring': 'tutoring',
      'Bible Study Leading': 'bible-study-leading',
      'Coaching': 'coaching',
      'Skill Training': 'skill-training',
      'Public Speaking': 'public-speaking',
      'Skill Development': 'skill-development',
      'Art': 'art',
      'Writing': 'writing',
      'Photography': 'photography',
      'Design': 'design',
      'Storytelling': 'storytelling',
      'Facilitating Groups': 'facilitating-groups',
      'Casting Vision': 'casting-vision',
      'Mentoring Teams': 'mentoring-teams',
      'Event Leadership': 'event-leadership',
      'Preaching': 'preaching',
      'Strategic Planning': 'strategic-planning',
      'Tech Support': 'tech-support',
      'AV/Production': 'av-production',
      'Finance': 'finance',
      'Cleaning': 'cleaning',
      'Setup Crew': 'setup-crew',
      'Admin Tasks': 'admin-tasks',
      'Sports Coaching': 'sports-coaching',
      'Outdoor Projects': 'outdoor-projects',
      'Moving Help': 'moving-help',
      'Fitness Activities': 'fitness-activities',
      'Recreation Leading': 'recreation-leading',
      'Disaster Relief': 'disaster-relief',
      'Evangelism': 'evangelism',
      'Community Outreach': 'community-outreach',
      'Starting Ministries': 'starting-ministries',
      'Networking': 'networking',
      'Fundraising': 'fundraising',
      'Advocacy': 'advocacy',
      'Repairs': 'repairs',
      'Gardening': 'gardening',
      'Sewing': 'sewing',
      'Decorating': 'decorating',
      'Setup/Tear Down': 'setup-tear-down',
      'Automotive': 'automotive',
      'Painting': 'painting'
    }
    
    return oldTags.map(tag => tagMap[tag] || tag.toLowerCase().replace(/\s+/g, '-'))
  }
  
  // Memoized conversion of user gifts to new format
  const convertedUserGifts = useMemo(() => {
    return convertToNewTagFormat(userGifts);
  }, [userGifts]);
  
  // Debug logging
  console.log('Profile object:', profile);
  console.log('Profile.giftings:', profile?.giftings);
  console.log('Profile.gift_selections:', profile?.gift_selections);
  console.log('Profile.primary_gift_area:', profile?.primary_gift_area);
  console.log('Original userGifts:', userGifts);
  console.log('Converted userGifts:', convertedUserGifts);
  
  // Real needs data from database
  const [needs, setNeeds] = useState<any[]>([]);
  const [needsLoading, setNeedsLoading] = useState(true);

  // Fetch approved needs from database
  useEffect(() => {
    const fetchNeeds = async () => {
      try {
        console.log('🔍 DEBUG: Starting database fetch...');
        console.log('🔍 DEBUG: Supabase client:', supabase);
        
        // Test basic Supabase connection first
        console.log('🔍 DEBUG: Testing Supabase connection...');
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        console.log('🔍 DEBUG: Connection test - data:', testData);
        console.log('🔍 DEBUG: Connection test - error:', testError);
        
        if (testError) {
          console.error('🔍 DEBUG: Supabase connection failed:', testError);
        } else {
          console.log('🔍 DEBUG: Supabase connection successful');
        }
        
        const { data, error } = await supabase
          .from('needs')
          .select('*')
          .eq('status', 'approved')  // Only show approved needs
          .order('created_at', { ascending: false });

        console.log('🔍 DEBUG: Database response - data:', data);
        console.log('🔍 DEBUG: Database response - error:', error);
        console.log('🔍 DEBUG: Error details:', JSON.stringify(error, null, 2));

        if (error) {
          console.error('🔍 DEBUG: Database error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        
        console.log('🔍 DEBUG: Raw database data:', data);
        console.log('🔍 DEBUG: Data length:', data?.length || 0);
        
        // Transform database data to match expected format
        const transformedNeeds = (data || []).map(need => {
          console.log('🔍 DEBUG: Transforming need:', need.title);
          console.log('🔍 DEBUG: Raw giftings_needed:', need.giftings_needed, 'Type:', typeof need.giftings_needed);
          
          const transformed = {
            id: need.id,
            title: need.title,
            description: need.description,
            primaryGifting: need.primary_gifting || 'hands-on-skills',
            giftingsNeeded: Array.isArray(need.giftings_needed) ? need.giftings_needed : 
                           typeof need.giftings_needed === 'string' ? need.giftings_needed.split(', ') : [],
            peopleNeeded: need.people_needed || 1,
            people_needed: need.people_needed, // Keep original field name too
            location: need.city || need.location || 'TBD',
            city: need.city,
            location: need.location,
            specific_date: need.specific_date,
            specific_time: need.specific_time,
            ongoing_start_date: need.ongoing_start_date,
            ongoing_start_time: need.ongoing_start_time,
            urgency: need.urgency,
            time_preference: need.time_preference,
            urgent: need.urgency === 'urgent'
          };
          
          console.log('🔍 DEBUG: Transformed giftingsNeeded:', transformed.giftingsNeeded);
          return transformed;
        });
        
        console.log('🔍 DEBUG: Transformed needs:', transformedNeeds);
        setNeeds(transformedNeeds);
      } catch (error) {
        console.error('🔍 DEBUG: Error fetching needs:', error);
        console.error('🔍 DEBUG: Error type:', typeof error);
        console.error('🔍 DEBUG: Error keys:', Object.keys(error || {}));
        console.error('🔍 DEBUG: Full error object:', JSON.stringify(error, null, 2));
        
        // Fallback to sample data if database fails
        console.log('🔍 DEBUG: Using fallback sample data');
        setNeeds([
          {
            id: 1,
            title: "Community Meal Preparation",
            description: "Help prepare meals for families in need during our monthly outreach event. We'll be cooking, packaging, and organizing food for distribution to local families.",
            primaryGifting: "hands-on-skills",
            giftingsNeeded: ["cooking", "setup-tear-down"],
            peopleNeeded: 6,
            location: "Church Kitchen",
            timeframe: "This Saturday, 2-5pm",
            urgent: false
          }
        ]);
      } finally {
        setNeedsLoading(false);
      }
    };

    fetchNeeds();
  }, []);



  // Enhanced getCategoryForTag function with comprehensive debugging
  const getCategoryForTag = (tag: string) => {
    if (!tag || typeof tag !== 'string') {
      return { name: 'NOT FOUND', color: '#6b7280', bgColor: '#f3f4f6', borderColor: '#d1d5db' };
    }
    
    const cleanTag = tag.trim();
    
    for (const [categoryName, categoryInfo] of Object.entries(GIFTING_CATEGORIES)) {
      // Check exact match
      if (categoryInfo.tags.includes(cleanTag)) {
        return { ...categoryInfo, name: categoryInfo.name };
      }
      
      // Check case-insensitive match
      const foundTag = categoryInfo.tags.find(t => t.toLowerCase() === cleanTag.toLowerCase());
      if (foundTag) {
        return { ...categoryInfo, name: categoryInfo.name };
      }
      
      // Check for common variations (spaces to hyphens, etc.)
      const normalizedTag = cleanTag.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const foundNormalizedTag = categoryInfo.tags.find(t => t === normalizedTag);
      if (foundNormalizedTag) {
        return { ...categoryInfo, name: categoryInfo.name };
      }
    }
    
    return { name: 'NOT FOUND', id: 'not-found', color: '#6b7280', bgColor: '#f3f4f6', borderColor: '#d1d5db' };
  };



  // Get current needs
  const currentNeeds = needs;

  // Multi-select filtering logic
  const filteredNeeds = useMemo(() => {
    if (selectedFilters.includes('all')) {
      return currentNeeds;
    }
    
    const filtered = currentNeeds.filter(need => {
      // Use the improved helper function to get giftings
      const needTags = getNeedGiftings(need, false);
      
      // Check if need matches ANY of the selected categories
      const hasMatchingTag = selectedFilters.some(selectedCategory => {
        return needTags.some(tag => {
          const categoryForTag = getCategoryForTag(tag);
          return categoryForTag?.name === selectedCategory || categoryForTag?.id === selectedCategory;
        });
      });
      
      return hasMatchingTag;
    });
    
    return filtered;
  }, [currentNeeds, selectedFilters]);



  // Memoized sorting logic to prevent expensive operations on every render
  const sortedNeeds = useMemo(() => {
    return [...filteredNeeds].sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          return (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0);
        case 'date':
          return 0; // Would sort by date if available
        case 'best-match':
          // Safe access to giftingsNeeded using helper function
          const aGiftings = getNeedGiftings(a, false);
          const bGiftings = getNeedGiftings(b, false);
          const userGifts = getUserGifts(profile);
          const aMatches = aGiftings.filter((gift: string) => 
            userGifts.some(userGift =>
              userGift.toLowerCase().includes(gift.toLowerCase()) ||
              gift.toLowerCase().includes(userGift.toLowerCase())
            )
          ).length;
          const bMatches = bGiftings.filter((gift: string) => 
            userGifts.some(userGift =>
              userGift.toLowerCase().includes(gift.toLowerCase()) ||
              gift.toLowerCase().includes(userGift.toLowerCase())
            )
          ).length;
          return bMatches - aMatches;
        case 'most-needed':
          return (b.peopleNeeded || 0) - (a.peopleNeeded || 0);
        default:
          return 0;
      }
    });
  }, [filteredNeeds, sortBy, convertedUserGifts]);

  // Debug function to check if need matches profile
  // Fixed matching count calculation
  const matchingCount = useMemo(() => {
    if (!profile || !sortedNeeds || sortedNeeds.length === 0) return 0;
    
    const userGifts = getUserGifts(profile);
    return sortedNeeds.filter(need => {
      const needGiftings = getNeedGiftings(need, false);
      return needGiftings.some(needGift =>
        userGifts.some(userGift =>
          userGift.toLowerCase().includes(needGift.toLowerCase()) ||
          needGift.toLowerCase().includes(userGift.toLowerCase())
        )
      );
    }).length;
  }, [sortedNeeds, profile]);

    return (
    <>
      {/* CSS Variables and Styles */}
      <style jsx global>{`
        :root {
          --brand: #20c997;
          --brand-600: #059669;
          --ink-900: #1e293b;
          --ink-700: #334155;
          --ink-600: #475569;
          --ink-500: #64748b;
          --ink-400: #94a3b8;
          --bg: #f8fafc;
          --card: #fff;
          --stroke: #e2e8f0;
          --stroke-2: #f1f5f9;
          --gray-50: #f9fafb;
          --gray-100: #f3f4f6;
          --gray-200: #e5e7eb;
          --red-50: #fef2f2;
          --red-600: #dc2626;
          --green-50: #f0fdf4;
          --green-600: #16a34a;
        }
        
        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px;
          padding-bottom: calc(96px + env(safe-area-inset-bottom));
        }
        
        .page-header {
          margin-bottom: 32px;
        }
        
        .page-title {
          font-size: 28px;
          font-family: var(--font-quicksand);
          font-weight: 600;
          color: var(--ink-900);
          margin-bottom: 8px;
        }
        
        .page-subtitle {
          font-size: 16px;
          color: var(--ink-500);
          font-family: var(--font-merriweather);
          margin: 0;
        }
        
        .your-gifts-section {
          background: var(--gray-50);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid var(--stroke);
        }
        
        .your-gifts-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--ink-900);
          font-family: var(--font-quicksand);
          margin-bottom: 12px;
        }
        
        .your-gifts-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .your-gift-tag {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-quicksand);
          border: 1px solid;
        }
        
        .filter-section {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          margin-bottom: 24px;
          padding: 20px;
          background: var(--card);
          border-radius: 12px;
          border: 1px solid var(--stroke);
        }
        
        .filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          flex: 1;
        }
        
        .filter-chip {
          padding: 8px 16px;
          border: 1px solid var(--stroke);
          border-radius: 20px;
          background: var(--card);
          color: var(--ink-600);
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-quicksand);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .filter-chip:hover {
          border-color: var(--brand);
          color: var(--brand);
        }
        
        .filter-chip.active {
          background: var(--brand);
          color: white;
          border-color: var(--brand);
        }
        
        .sort-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .sort-label {
          font-size: 14px;
          color: var(--ink-600);
          font-family: var(--font-quicksand);
          font-weight: 500;
        }
        
        .sort-select {
          padding: 8px 12px;
          border: 1px solid var(--stroke);
          border-radius: 8px;
          background: var(--card);
          color: var(--ink-700);
          font-size: 14px;
          font-family: var(--font-quicksand);
          cursor: pointer;
        }
        
        .clear-button {
          padding: 8px 16px;
          border: 1px solid var(--stroke);
          border-radius: 8px;
          background: var(--card);
          color: var(--ink-600);
          font-size: 14px;
          font-family: var(--font-quicksand);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .clear-button:hover {
          background: var(--gray-50);
        }
        
        .results-summary {
          font-size: 14px;
          color: var(--ink-500);
          font-family: var(--font-merriweather);
          margin-bottom: 20px;
        }
        
        .opportunities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        
        .opportunity-card {
          background: var(--card);
          border-radius: 14px;
          border: 1px solid var(--stroke);
          overflow: hidden;
          transition: 0.2s;
          display: flex;
          flex-direction: column;
          min-height: 280px;
        }
        
        .opportunity-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
        }
        
        .card-header {
          padding: 20px 20px 16px;
          position: relative;
        }
        
        .urgent-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: var(--red-50);
          color: var(--red-600);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          font-family: var(--font-quicksand);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .card-category {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          font-family: var(--font-quicksand);
          margin-bottom: 12px;
        }
        
        .card-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--ink-900);
          margin: 0;
          font-family: var(--font-quicksand);
          line-height: 1.3;
          letter-spacing: -0.02em;
        }
        
        .card-logistics {
          background: var(--gray-50);
          padding: 16px 20px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          border-top: 1px solid var(--stroke-2);
          border-bottom: 1px solid var(--stroke-2);
        }
        
        .logistic-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ink-600);
          font-size: 13px;
          font-family: var(--font-merriweather);
        }
        
        .logistic-item .icon {
          color: var(--ink-400);
          flex-shrink: 0;
        }
        
        .card-body {
          padding: 16px 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .card-description {
          color: var(--ink-500);
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 12px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-family: var(--font-merriweather);
          flex: 1;
        }
        
        .card-description.expanded {
          -webkit-line-clamp: unset;
        }
        
        .read-more {
          background: none;
          border: 0;
          padding: 0;
          font: inherit;
          color: var(--brand);
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-quicksand);
          font-size: 13px;
        }
        
        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: auto;
        }
        
        .tag {
          padding: 6px 14px;
          background: #eef2f7;
          border-radius: 20px;
          font-size: 13px;
          color: var(--ink-600);
          font-weight: 600;
          font-family: var(--font-quicksand);
          border: 1px solid #d1d5db;
        }
        
        .tag.matching {
          background: var(--green-50);
          color: var(--green-600);
          border-color: var(--green-600);
        }
        
        .card-footer {
          padding: 16px 20px;
          background: var(--gray-50);
          border-top: 1px solid var(--stroke-2);
        }
        
        .help-button {
          width: 100%;
          padding: 14px;
          background: var(--brand);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-quicksand);
          box-shadow: 0 2px 4px rgba(32, 201, 151, 0.2);
        }
        
        .help-button:hover {
          background: var(--brand-600);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(32, 201, 151, 0.3);
        }
        
        .help-button:focus {
          outline: 2px solid var(--brand);
          outline-offset: 2px;
        }
        
        /* Category Colors */
        .category-hands-on { background: #dbeafe; color: #1d4ed8; }
        .category-people { background: #e9d5ff; color: #7c3aed; }
        .category-organizing { background: #f3f4f6; color: #374151; }
        .category-care { background: #fce7f3; color: #be185d; }
        .category-teaching { background: #e0e7ff; color: #3730a3; }
        .category-creative { background: #ffe4e6; color: #be123c; }
        .category-leadership { background: #fef3c7; color: #92400e; }
        .category-support { background: #f1f5f9; color: #334155; }
        .category-physical { background: #dcfce7; color: #166534; }
        .category-pioneering { background: #fed7aa; color: #c2410c; }
        
        @media (max-width: 768px) {
          .opportunities-grid {
            grid-template-columns: 1fr;
          }
          
          .main-content {
            padding: 24px 16px calc(96px + env(safe-area-inset-bottom)) 16px;
          }
          
          .filter-section {
            flex-direction: column;
            align-items: stretch;
          }
          
          .card-logistics {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>

      {/* JavaScript for inline read more functionality */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.opportunity-card').forEach(card => {
              const desc = card.querySelector('.card-description');
              if (!desc) return;
              
              const existingBtn = card.querySelector('.read-more');
              const btn = existingBtn || (() => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'read-more';
                b.textContent = 'Read more';
                desc.after(b);
                return b;
              })();
              
              btn.addEventListener('click', () => {
                const expanded = desc.classList.toggle('expanded');
                btn.textContent = expanded ? 'Show less' : 'Read more';
              });
            });
          });
        `
      }} />

      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Ways to Serve</h1>
          <p className="page-subtitle">Discover opportunities to use your gifts</p>
        </div>

        {/* Your Gifts Section - Removed to keep dashboard clean */}
        {/* 
        The important matching functionality is preserved:
        - Opportunity cards show matching gifts with green highlighting ✓
        - Gift tags use consistent category-specific colors ✓
        - Matching system foundation ready for notifications ✓
        */}


        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-chips">
          <button 
              className={`filter-chip ${selectedFilters.includes('all') ? 'active' : ''}`}
              onClick={() => handleCategoryToggle('all')}
            >
              All
          </button>
          
            {Object.values(GIFTING_CATEGORIES).map(category => {
              const isActive = selectedFilters.includes(category.id);
              return (
                <button 
                  key={category.id}
                  className={`filter-chip ${isActive ? 'active' : ''}`}
                  onClick={() => handleCategoryToggle(category.id)}
                  style={{
                    backgroundColor: isActive ? '#10b981' : 'white',
                    color: isActive ? 'white' : '#6b7280',
                    border: `1px solid ${isActive ? '#10b981' : '#d1d5db'}`,
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {category.name.split(' ')[0]}
                </button>
              );
            })}
        </div>
          
          <div className="sort-section">
            <span className="sort-label">Sort:</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="best-match">Best Match</option>
              <option value="urgency">Urgency</option>
              <option value="date">Date</option>
              <option value="most-needed">Most Needed</option>
            </select>
      </div>
          
          {!selectedFilters.includes('all') && (
          <button 
              className="clear-button"
              onClick={() => setSelectedFilters(['all'])}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                marginLeft: '8px'
              }}
            >
              Clear Filters
          </button>
          )}
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          {selectedFilters.includes('all') 
            ? `${sortedNeeds.length} opportunities • ${matchingCount} match your gifts`
            : `${sortedNeeds.length} opportunities in ${selectedFilters.length} categor${selectedFilters.length > 1 ? 'ies' : 'y'} • ${matchingCount} match your gifts`
          }
        </div>


        {/* Opportunities Grid */}
        {needsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 16, color: '#6b7280' }}>Loading opportunities...</div>
          </div>
        ) : (
          <div className="opportunities-grid">
            {sortedNeeds.map(need => (
              <NeedCard 
                key={need.id} 
                need={need} 
                userGifts={convertedUserGifts} 
                onCanHelp={handleCanHelp}
                user={user}
                profile={profile}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const CommitmentsTab = () => (
  <div style={{ padding: '20px' }}>
    <h1 style={{ fontSize: 32, fontFamily: 'var(--font-quicksand)', fontWeight: 700, marginBottom: 8 }}>
      My Commitments
    </h1>
    <p style={{ color: '#6b7280', fontFamily: 'var(--font-merriweather)', marginBottom: 30 }}>
      Track your active service commitments
    </p>
    
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <p style={{ color: '#6b7280', fontFamily: 'var(--font-merriweather)' }}>
        No active commitments at this time.
      </p>
        </div>
      </div>
    );

const ProfileTab = () => {
  const [selectedGiftings, setSelectedGiftings] = useState<{[key: string]: string[]}>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { user, profile } = useAuth();
  
  // Basic profile state
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [availability, setAvailability] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile?.giftings) {
      setSelectedGiftings(profile.giftings);
    }
    
    // Load basic profile data
    if (profile) {
      setFullName(profile.full_name || '');
      setAge(profile.age?.toString() || '');
      setCity(profile.city || '');
      setPhone(profile.phone || '');
      setAvailability(profile.availability || []);
      setProfilePhoto(profile.profile_photo || null);
    }
  }, [profile]);

  const toggleGifting = (category: string, tag: string) => {
    setSelectedGiftings(prev => {
      const currentTags = prev[category] || [];
      const newTags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag];
      
      return {
        ...prev,
        [category]: newTags
      };
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const toggleAvailability = (timeSlot: string) => {
    setAvailability(prev => 
      prev.includes(timeSlot) 
        ? prev.filter(slot => slot !== timeSlot)
        : [...prev, timeSlot]
    );
  };


  const getSelectedCount = () => {
    return Object.values(selectedGiftings).reduce((total, tags) => total + tags.length, 0);
  };

  const getGiftingIcon = (categoryId: string, color?: string) => {
    const iconMap = {
      'hands-on-skills': <Wrench size={20} color={color} />,
      'people-relationships': <Users size={20} color={color} />,
      'problem-solving-organizing': <Brain size={20} color={color} />,
      'care-comfort': <Heart size={20} color={color} />,
      'learning-teaching': <BookOpen size={20} color={color} />,
      'creativity-expression': <Palette size={20} color={color} />,
      'leadership-motivation': <Crown size={20} color={color} />,
      'behind-scenes-support': <Settings size={20} color={color} />,
      'physical-active': <Dumbbell size={20} color={color} />,
      'pioneering-connecting': <Compass size={20} color={color} />
    };
    return (iconMap as any)[categoryId] || <Wrench size={20} color={color} />;
  };

  const renderSkillBubbles = () => {
    const allSelectedTags = Object.entries(selectedGiftings).flatMap(([categoryId, tags]) => 
      tags.map(tag => ({ 
        category: categoryId, 
        tag, 
        categoryData: GIFTING_CATEGORIES[categoryId as keyof typeof GIFTING_CATEGORIES] 
      }))
    );

    // Debug: Always show the section, even if empty
    return (
      <div style={{ marginTop: 16 }}>
        <label style={{ 
          display: 'block', 
          fontSize: 14, 
          fontWeight: 500, 
          color: '#374151', 
          fontFamily: 'var(--font-quicksand)',
          marginBottom: 8 
        }}>
          Selected Skills ({allSelectedTags.length})
        </label>
        {allSelectedTags.length === 0 ? (
          <p style={{ 
            color: '#6b7280', 
            fontSize: 12, 
            fontFamily: 'var(--font-merriweather)',
            fontStyle: 'italic'
          }}>
            No skills selected yet. Choose skills below to see them here.
          </p>
        ) : (
      <div style={{ 
        display: 'flex',
            flexWrap: 'wrap', 
            gap: 8 
          }}>
          {allSelectedTags.map(({ category, tag, categoryData }) => {
            if (!categoryData) return null;
            
            // Convert Tailwind classes to hex colors
            const colorMap: { [key: string]: string } = {
              'bg-blue-100': '#dbeafe', 'text-blue-800': '#1e40af', 'border-blue-200': '#bfdbfe',
              'bg-purple-100': '#e9d5ff', 'text-purple-800': '#6b21a8', 'border-purple-200': '#d8b4fe',
              'bg-gray-100': '#f3f4f6', 'text-gray-800': '#374151', 'border-gray-200': '#e5e7eb',
              'bg-pink-100': '#fce7f3', 'text-pink-800': '#be185d', 'border-pink-200': '#fbcfe8',
              'bg-indigo-100': '#e0e7ff', 'text-indigo-800': '#3730a3', 'border-indigo-200': '#c7d2fe',
              'bg-rose-100': '#ffe4e6', 'text-rose-800': '#be123c', 'border-rose-200': '#fecdd3',
              'bg-amber-100': '#fef3c7', 'text-amber-800': '#92400e', 'border-amber-200': '#fde68a',
              'bg-slate-100': '#f1f5f9', 'text-slate-800': '#334155', 'border-slate-200': '#e2e8f0',
              'bg-green-100': '#dcfce7', 'text-green-800': '#166534', 'border-green-200': '#bbf7d0',
              'bg-orange-100': '#fed7aa', 'text-orange-800': '#c2410c', 'border-orange-200': '#fdba74'
            };
            
            return (
              <span
                key={`${category}-${tag}`}
          style={{
                  padding: '4px 8px',
                  backgroundColor: colorMap[categoryData.bgColor] || '#f3f4f6',
                  color: colorMap[categoryData.textColor] || '#374151',
                  borderRadius: 12,
                  fontSize: 12,
                  fontFamily: 'var(--font-quicksand)',
                  fontWeight: 500,
                  border: `1px solid ${colorMap[categoryData.borderColor] || '#d1d5db'}`
                }}
              >
                {getTagDisplayName(tag)}
              </span>
            );
          })}
          </div>
        )}
      </div>
    );
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setMessage('Error uploading photo. Please try again.');
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setProfilePhoto(data.publicUrl);
      setMessage('Photo uploaded successfully!');
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error uploading photo. Please try again.');
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          age: age ? parseInt(age) : null,
          city: city,
          phone: phone,
          availability: availability,
          profile_photo: profilePhoto,
          giftings: selectedGiftings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving profile:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        setMessage('Error saving profile. Please try again.');
      } else {
        setMessage('Profile saved successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error saving profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: 32, fontFamily: 'var(--font-quicksand)', fontWeight: 700, marginBottom: 8 }}>
        My Profile
      </h1>
      <p style={{ color: '#6b7280', fontFamily: 'var(--font-merriweather)', marginBottom: 30 }}>
        Manage your profile information and spiritual gifts
      </p>

      {/* Basic Profile Information */}
    <div style={{ 
        backgroundColor: 'white', 
        padding: 24, 
        borderRadius: 12, 
        border: '1px solid #e5e7eb',
        marginBottom: 24
      }}>
        <h2 style={{ 
          fontSize: 20, 
          fontWeight: 600, 
          color: '#1f2937', 
          fontFamily: 'var(--font-quicksand)',
          marginBottom: 20
        }}>
          Basic Information
        </h2>

        {/* Profile Photo */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 14, 
            fontWeight: 500, 
            color: '#374151', 
            fontFamily: 'var(--font-quicksand)',
            marginBottom: 8 
          }}>
            Profile Photo
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
        display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '2px solid #e5e7eb'
            }}>
              {photoPreview || profilePhoto ? (
                <img 
                  src={photoPreview || profilePhoto || ''} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={32} color="#9ca3af" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ fontSize: 14, fontFamily: 'var(--font-quicksand)' }}
            />
          </div>
        </div>

        {/* Name and Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 14, 
              fontWeight: 500, 
              color: '#374151', 
              fontFamily: 'var(--font-quicksand)',
              marginBottom: 8 
            }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
          style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
                fontFamily: 'var(--font-quicksand)'
              }}
            />
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 14, 
            fontWeight: 500,
              color: '#374151', 
              fontFamily: 'var(--font-quicksand)',
              marginBottom: 8 
            }}>
              Email (Read Only)
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
            fontSize: 14,
                fontFamily: 'var(--font-quicksand)',
                backgroundColor: '#f9fafb',
                color: '#6b7280'
              }}
            />
          </div>
      </div>

        {/* Age, City, Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 14, 
              fontWeight: 500, 
              color: '#374151', 
              fontFamily: 'var(--font-quicksand)',
              marginBottom: 8 
            }}>
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'var(--font-quicksand)'
              }}
            />
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 14, 
              fontWeight: 500, 
              color: '#374151', 
              fontFamily: 'var(--font-quicksand)',
              marginBottom: 8 
            }}>
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'var(--font-quicksand)'
              }}
            />
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 14, 
              fontWeight: 500, 
              color: '#374151', 
              fontFamily: 'var(--font-quicksand)',
              marginBottom: 8 
            }}>
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'var(--font-quicksand)'
              }}
            />
          </div>
        </div>

        {/* Availability Times */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 14, 
            fontWeight: 500, 
            color: '#374151', 
            fontFamily: 'var(--font-quicksand)',
            marginBottom: 8 
          }}>
            Available Times
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { key: 'mornings', label: 'Mornings', icon: Sunrise },
              { key: 'afternoons', label: 'Afternoons', icon: Sun },
              { key: 'nights', label: 'Nights', icon: Moon },
              { key: 'anytime', label: 'Anytime', icon: Timer }
            ].map(({ key, label, icon: IconComponent }) => (
              <button
                key={key}
                onClick={() => toggleAvailability(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  border: availability.includes(key) ? '2px solid #20c997' : '1px solid #d1d5db',
                  borderRadius: 6,
                  backgroundColor: availability.includes(key) ? '#f0fdfa' : 'white',
                  color: availability.includes(key) ? '#20c997' : '#374151',
                  fontSize: 14,
                  fontFamily: 'var(--font-quicksand)',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <IconComponent size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Skill Bubbles */}
        {renderSkillBubbles()}

      </div>

      {/* Gifting Selection Section */}
                    <div style={{ 
        backgroundColor: 'white', 
        padding: 24, 
                        borderRadius: 12,
        border: '1px solid #e5e7eb',
        marginBottom: 24
      }}>
        <h2 style={{ 
                        fontSize: 20,
          fontWeight: 600, 
          color: '#1f2937', 
          fontFamily: 'var(--font-quicksand)',
          marginBottom: 8
        }}>
          My Giftings
        </h2>
        <p style={{ color: '#6b7280', fontFamily: 'var(--font-merriweather)', marginBottom: 20 }}>
          Select your spiritual gifts and skills to help match you with opportunities
        </p>

        {/* Selection Summary */}
                        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: 16, 
          borderRadius: 8, 
          border: '1px solid #e2e8f0',
          marginBottom: 20,
                          display: 'flex', 
                          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-quicksand)' }}>
              Selected: {getSelectedCount()} skills
                            </span>
          </div>
                        </div>
                        
      {/* Gifting Categories */}
      <div style={{ display: 'grid', gap: 16 }}>
        {Object.values(GIFTING_CATEGORIES).map((category) => {
          const isExpanded = expandedCategory === category.id;
          const selectedTags = selectedGiftings[category.id] || [];
          const hasSelections = selectedTags.length > 0;

          // Convert Tailwind classes to hex colors
          const colorMap: { [key: string]: string } = {
            'bg-blue-100': '#dbeafe', 'text-blue-800': '#1e40af', 'border-blue-200': '#bfdbfe',
            'bg-purple-100': '#e9d5ff', 'text-purple-800': '#6b21a8', 'border-purple-200': '#d8b4fe',
            'bg-gray-100': '#f3f4f6', 'text-gray-800': '#374151', 'border-gray-200': '#e5e7eb',
            'bg-pink-100': '#fce7f3', 'text-pink-800': '#be185d', 'border-pink-200': '#fbcfe8',
            'bg-indigo-100': '#e0e7ff', 'text-indigo-800': '#3730a3', 'border-indigo-200': '#c7d2fe',
            'bg-rose-100': '#ffe4e6', 'text-rose-800': '#be123c', 'border-rose-200': '#fecdd3',
            'bg-amber-100': '#fef3c7', 'text-amber-800': '#92400e', 'border-amber-200': '#fde68a',
            'bg-slate-100': '#f1f5f9', 'text-slate-800': '#334155', 'border-slate-200': '#e2e8f0',
            'bg-green-100': '#dcfce7', 'text-green-800': '#166534', 'border-green-200': '#bbf7d0',
            'bg-orange-100': '#fed7aa', 'text-orange-800': '#c2410c', 'border-orange-200': '#fdba74'
          };

          return (
            <div
              key={category.id}
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                border: hasSelections ? `2px solid ${colorMap[category.textColor]}` : '1px solid #e5e7eb',
                overflow: 'hidden'
              }}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                style={{
                  width: '100%',
                          display: 'flex', 
                          alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  backgroundColor: hasSelections ? colorMap[category.bgColor] : 'white',
                        border: 'none',
                        cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: colorMap[category.bgColor],
                        display: 'flex',
                        alignItems: 'center',
                    justifyContent: 'center'
                      }}>
                    {getGiftingIcon(category.id, colorMap[category.textColor])}
                    </div>
                  <div style={{ textAlign: 'left' }}>
              <h3 style={{ 
                      margin: 0,
                      fontSize: 16,
                fontWeight: 600, 
                      color: hasSelections ? colorMap[category.textColor] : '#1f2937',
                      fontFamily: 'var(--font-quicksand)'
                    }}>
                      {category.name}
              </h3>
              <p style={{ 
                      margin: 0,
                      fontSize: 12,
                      color: '#6b7280',
                      fontFamily: 'var(--font-merriweather)'
                    }}>
                      {selectedTags.length > 0 ? `${selectedTags.length} selected` : 'Click to select skills'}
              </p>
            </div>
          </div>
                <ChevronDown 
                  size={20} 
                  color={hasSelections ? colorMap[category.textColor] : '#6b7280'}
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </button>

              {/* Tags Dropdown */}
              {isExpanded && (
          <div style={{ 
                  padding: '0 20px 20px',
                  borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 8, 
                    marginTop: 16
                  }}>
                    {category.tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
              <button 
                          key={tag}
                          onClick={() => toggleGifting(category.id, tag)}
                style={{ 
                            padding: '8px 12px',
                            border: isSelected ? `2px solid ${colorMap[category.textColor]}` : '1px solid #d1d5db',
                            borderRadius: 6,
                            backgroundColor: isSelected ? colorMap[category.bgColor] : 'white',
                            color: isSelected ? colorMap[category.textColor] : '#374151',
                            fontSize: 12,
                            fontFamily: 'var(--font-quicksand)',
                  fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left'
                          }}
                        >
                          {getTagDisplayName(tag)}
              </button>
                      );
                    })}
                          </div>
                          </div>
              )}
                        </div>
          );
        })}
            </div>
            
      {/* Save Profile Button */}
            <div style={{ 
              display: 'flex', 
        justifyContent: 'center', 
        marginTop: 24 
      }}>
        <button
          onClick={saveProfile}
          disabled={isLoading}
          style={{
                display: 'flex', 
                alignItems: 'center', 
            gap: 8,
            padding: '12px 24px',
            backgroundColor: isLoading ? '#9ca3af' : '#20c997',
                color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontFamily: 'var(--font-quicksand)',
                  fontWeight: 600, 
            cursor: isLoading ? 'not-allowed' : 'pointer',
            minWidth: 140
          }}
        >
          <Save size={18} />
          {isLoading ? 'Saving...' : 'Save Profile'}
                      </button>
            </div>

      {/* Message */}
      {message && (
            <div style={{ 
          marginTop: 12,
          padding: '8px 12px',
          backgroundColor: message.includes('Error') ? '#fef2f2' : '#f0fdf4',
          color: message.includes('Error') ? '#dc2626' : '#16a34a',
          borderRadius: 6,
          fontSize: 14,
          fontFamily: 'var(--font-quicksand)',
              textAlign: 'center'
            }}>
          {message}
          </div>
        )}

      {/* Help Text */}
          <div style={{ 
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 8,
        marginTop: 24,
        border: '1px solid #e2e8f0'
      }}>
              <p style={{ 
                margin: 0, 
                fontSize: 14, 
          color: '#64748b',
          fontFamily: 'var(--font-merriweather)',
          lineHeight: 1.5 
              }}>
          💡 <strong>Tip:</strong> Select the skills and gifts that best describe you. 
          This helps us match you with opportunities that align with your strengths and interests.
              </p>
            </div>
          </div>
    </div>
  );
};

const FeedbackTab = () => {
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState<'general' | 'bug_report' | 'feature_request' | 'improvement'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      // Simulate feedback submission
      const newFeedback = {
        id: Date.now().toString(),
        type,
        message: feedback,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      setSubmittedFeedback(prev => [newFeedback, ...prev]);
      setFeedback('');
      
      // Here you would typically send the feedback to your backend
      console.log('Feedback submitted:', { type, feedback: newFeedback });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report':
        return <Bug size={16} color="#ef4444" />;
      case 'feature_request':
        return <Lightbulb size={16} color="#3b82f6" />;
      case 'improvement':
        return <ThumbsUp size={16} color="#f59e0b" />;
      default:
        return <MessageSquare size={16} color="#20c997" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#20c997" />;
      case 'in_progress':
        return <Clock size={16} color="#FFD166" />;
      default:
        return <Clock size={16} color="#666666" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bug_report':
        return 'Bug Report';
      case 'feature_request':
        return 'Feature Request';
      case 'improvement':
        return 'Improvement';
      default:
        return 'General';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: 32, fontFamily: 'var(--font-quicksand)', fontWeight: 700, marginBottom: 8 }}>
        Feedback
      </h1>
      <p style={{ color: '#6b7280', fontFamily: 'var(--font-merriweather)', marginBottom: 30 }}>
        Share feedback or view community updates
      </p>

      {/* Feedback Form */}
      <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 16px', color: '#1f2937', fontFamily: 'var(--font-quicksand)', fontWeight: 600 }}>Share Your Feedback</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 500, color: '#374151', fontFamily: 'var(--font-quicksand)' }}>Type of Feedback</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <button 
                type="button"
                onClick={() => setType('general')}
                  style={{
                          display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                          gap: 8, 
                  padding: '16px 12px',
                  border: type === 'general' ? '2px solid #20c997' : '1px solid #d1d5db',
                    borderRadius: 8,
                  backgroundColor: type === 'general' ? '#f0fdf4' : 'white',
                    cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-quicksand)'
                }}
              >
                <MessageSquare size={24} color={type === 'general' ? '#20c997' : '#6b7280'} />
                <span style={{ fontSize: 12, fontWeight: 600, color: type === 'general' ? '#20c997' : '#374151' }}>
                  General
                            </span>
              </button>
                        
              <button
                type="button"
                onClick={() => setType('bug_report')}
                style={{
                    display: 'flex',
                  flexDirection: 'column',
                    alignItems: 'center',
                  gap: 8,
                  padding: '16px 12px',
                  border: type === 'bug_report' ? '2px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: 8,
                  backgroundColor: type === 'bug_report' ? '#fef2f2' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-quicksand)'
                }}
              >
                <Bug size={24} color={type === 'bug_report' ? '#ef4444' : '#6b7280'} />
                <span style={{ fontSize: 12, fontWeight: 600, color: type === 'bug_report' ? '#ef4444' : '#374151' }}>
                  Bug Report
                </span>
                </button>
            
                <button 
                type="button"
                onClick={() => setType('feature_request')}
                  style={{
              display: 'flex', 
                  flexDirection: 'column',
                alignItems: 'center', 
                  gap: 8,
                  padding: '16px 12px',
                  border: type === 'feature_request' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                    borderRadius: 8,
                  backgroundColor: type === 'feature_request' ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-quicksand)'
                }}
              >
                <Lightbulb size={24} color={type === 'feature_request' ? '#3b82f6' : '#6b7280'} />
                <span style={{ fontSize: 12, fontWeight: 600, color: type === 'feature_request' ? '#3b82f6' : '#374151' }}>
                  Feature Request
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType('improvement')}
                style={{
                    display: 'flex',
                  flexDirection: 'column',
                    alignItems: 'center',
                  gap: 8,
                  padding: '16px 12px',
                  border: type === 'improvement' ? '2px solid #f59e0b' : '1px solid #d1d5db',
                  borderRadius: 8,
                  backgroundColor: type === 'improvement' ? '#fffbeb' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-quicksand)'
                }}
              >
                <ThumbsUp size={24} color={type === 'improvement' ? '#f59e0b' : '#6b7280'} />
                <span style={{ fontSize: 12, fontWeight: 600, color: type === 'improvement' ? '#f59e0b' : '#374151' }}>
                  Improvement
                      </span>
                </button>
              </div>
            </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151', fontFamily: 'var(--font-quicksand)' }}>Your Message</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what's on your mind..."
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14, 
                fontFamily: 'var(--font-merriweather)',
                resize: 'vertical'
              }}
            />
                    </div>
                    
                <button 
            type="submit"
            disabled={!feedback.trim() || isSubmitting}
                  style={{
              padding: '10px 20px',
              backgroundColor: feedback.trim() && !isSubmitting ? '#20c997' : '#9ca3af',
                    color: 'white',
                    border: 'none',
              borderRadius: 6,
                    fontSize: 14,
              fontFamily: 'var(--font-quicksand)',
                        fontWeight: 600, 
              cursor: feedback.trim() && !isSubmitting ? 'pointer' : 'not-allowed'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
        </form>
            </div>
            
      {/* Feedback History */}
      {submittedFeedback.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: '0 0 16px', color: '#1f2937', fontFamily: 'var(--font-quicksand)', fontWeight: 600 }}>Your Feedback</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {submittedFeedback.map((item) => (
              <div
                key={item.id}
                  style={{
                  padding: 16,
                      border: '1px solid #e5e7eb',
                    borderRadius: 8,
                  backgroundColor: '#f9fafb'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {getTypeIcon(item.type)}
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-quicksand)' }}>
                    {getTypeLabel(item.type)}
                          </span>
                  <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'var(--font-merriweather)' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {getStatusIcon(item.status)}
                    <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'var(--font-merriweather)' }}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
              </div>
            </div>
                <p style={{ margin: 0, fontSize: 14, color: '#374151', fontFamily: 'var(--font-merriweather)' }}>
                  {item.message}
                </p>
                    </div>
                        ))}
                      </div>
              </div>
            )}

      {/* Empty State */}
      {submittedFeedback.length === 0 && (
        <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <MessageCircle size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
          <p style={{ color: '#6b7280', fontFamily: 'var(--font-merriweather)', margin: 0 }}>
            No feedback submitted yet. Share your thoughts above!
          </p>
          </div>
        )}
    </div>
  );
};

export default function MemberDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const router = useRouter();

  // Check if user is a leader (Harmony Mitchell)
  useEffect(() => {
    if (!authLoading && user && profile) {
      // Check if user is a leader (Harmony Mitchell)
      if (profile?.full_name === 'Harmony Mitchell') {
        router.push('/leader');
        return;
      }
    }
  }, [authLoading, user, profile, router]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        console.log('MemberDashboard: Loading timeout reached');
        setLoadingTimeout(true);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timer);
  }, [authLoading]);

  // Reset timeout when loading changes
  useEffect(() => {
    if (!authLoading) {
      setLoadingTimeout(false);
    }
  }, [authLoading]);
  
  // Add this early return after all hooks
  if (authLoading || !user || !profile) {
    return (
      <div style={{ padding: 20 }}>
        <div>Loading dashboard...</div>
                      </div>
    );
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (authLoading && !loadingTimeout) {
    return (
                      <div style={{ 
        padding: 'var(--space-10)', 
        textAlign: 'center',
        minHeight: '100vh',
                        display: 'flex', 
                        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-4)'
      }}>
        <div>Loading...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Please wait while we load your dashboard
                        </div>
                        </div>
    );
  }

  if (loadingTimeout) {
    return (
                  <div style={{ 
        padding: 'var(--space-10)', 
        textAlign: 'center',
        minHeight: '100vh',
                    display: 'flex', 
              alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-4)'
      }}>
        <div>Loading timeout</div>
                <button 
          onClick={() => window.location.reload()}
                  style={{
            background: '#20c997',
                      color: 'white',
                    border: 'none',
                      padding: 'var(--space-3) var(--space-5)',
                      borderRadius: 8,
              cursor: 'pointer'
            }}
          >
          Retry
                </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        padding: 'var(--space-10)', 
        textAlign: 'center',
        minHeight: '100vh',
                      display: 'flex',
                      alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-4)'
      }}>
        <div>Not authenticated</div>
                <button 
          onClick={() => router.push('/')}
                  style={{
            background: '#20c997',
            color: 'white',
            border: 'none',
                    padding: 'var(--space-3) var(--space-5)',
                    borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Go to Login
                    </button>
                  </div>
    );
  }

  if (!profile && user) {
    console.log('User exists but no profile found, showing dashboard with warning');
    // We'll show the dashboard but with a profile completion notice
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Consistent Header */}
                  <div style={{ 
                    display: 'flex', 
        justifyContent: 'space-between',
                    alignItems: 'center', 
        padding: '12px 24px', 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.svg" alt="ENGAGE" style={{ width: 32, height: 32 }} />
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-quicksand)' }}>ENGAGE</span>
                    </div>
                  
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && (
            <NotificationBell userId={user.id} />
          )}
          
        <button 
          onClick={() => router.push('/share-need')}
          style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', 
              backgroundColor: '#20c997', color: 'white', border: 'none', borderRadius: 6, 
              fontSize: 14, fontFamily: 'var(--font-quicksand)', cursor: 'pointer'
            }}
          >
            <Plus size={16} />
          Share a Need
        </button>
            <button 
            onClick={signOut}
              style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', 
              backgroundColor: 'transparent', border: 'none', color: '#6b7280', 
              fontSize: 14, fontFamily: 'var(--font-quicksand)', cursor: 'pointer'
            }}
          >
            <LogOut size={16} />
            Sign out
                    </button>
                    </div>
                  </div>

      {/* Main Content Area */}
      <div style={{ paddingBottom: '80px', minHeight: 'calc(100vh - 60px)' }}>
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'commitments' && <CommitmentsTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'feedback' && <FeedbackTab />}
                </div>

      {/* Bottom Tab Navigation */}
          <div style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
              display: 'flex', 
        justifyContent: 'space-around',
              alignItems: 'center', 
        padding: '12px 0',
        zIndex: 10
      }}>
              <button 
          onClick={() => setActiveTab('home')}
                style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
            color: activeTab === 'home' ? '#20c997' : '#6b7280'
          }}
        >
          <Heart size={20} />
          <span style={{ fontSize: 12, fontFamily: 'var(--font-quicksand)' }}>Ways to Serve</span>
        </button>

        <button 
          onClick={() => setActiveTab('commitments')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
            color: activeTab === 'commitments' ? '#20c997' : '#6b7280'
          }}
        >
          <Calendar size={20} />
          <span style={{ fontSize: 12, fontFamily: 'var(--font-quicksand)' }}>Commitments</span>
        </button>

        {/* Center Plus Button */}
        <button 
          onClick={() => router.push('/share-need')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: '50%',
            backgroundColor: '#20c997', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(32, 201, 151, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#20c997';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Plus size={24} color="white" />
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
            color: activeTab === 'profile' ? '#20c997' : '#6b7280'
          }}
        >
          <User size={20} />
          <span style={{ fontSize: 12, fontFamily: 'var(--font-quicksand)' }}>Profile</span>
        </button>

        <button 
          onClick={() => setActiveTab('feedback')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
            color: activeTab === 'feedback' ? '#20c997' : '#6b7280'
          }}
        >
          <MessageCircle size={20} />
          <span style={{ fontSize: 12, fontFamily: 'var(--font-quicksand)' }}>Feedback</span>
              </button>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      {/* Floating Feedback Button */}
      <FeedbackButton onClick={() => setShowFeedbackModal(true)} />
    </div>
  );
}