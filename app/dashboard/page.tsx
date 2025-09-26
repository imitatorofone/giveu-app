'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar, Clock, MapPin, Users, User, Bell, 
  Heart, CalendarDays, Plus, UserCircle, MessageCircle, AlertCircle, Check, Wrench 
} from 'lucide-react';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser'; // Use browser client for session persistence
import { GIFT_CATEGORIES } from '../../constants/giftCategories.js';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import dynamic from 'next/dynamic';

const NeedDetailModal = dynamic(
  () => import('../../components/NeedDetailModal'),
  { ssr: false }
);
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
  urgency?: string;
  specific_date?: string;
  specific_time?: string;
  ongoing_start_date?: string;
  ongoing_start_time?: string;
  recurring_pattern?: string;
  time_preference?: string;
  ongoing_schedule?: string;
}

// Helper functions for date/time formatting
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return dateString;
  }
};

const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  try {
    // Handle both 24hr and 12hr formats
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      // Remove seconds if present and format minutes properly
      const cleanMinutes = minutes.split('.')[0]; // Remove any decimal seconds
      return `${displayHour}:${cleanMinutes} ${ampm}`;
    }
    return timeString;
  } catch {
    return timeString;
  }
};

const formatDateDisplay = (need: any): { date: string; time: string } => {
  if (need.urgency === 'asap') {
    const timePreference = need.time_preference || 'Urgent';
    return { date: 'As Soon As Possible', time: timePreference };
  } else if (need.urgency === 'ongoing') {
    // For ongoing needs, show the recurring pattern
    if (need.recurring_pattern) {
      const pattern = need.recurring_pattern.charAt(0).toUpperCase() + need.recurring_pattern.slice(1);
      return { date: `Ongoing - ${pattern}`, time: '' };
    }
    return { date: 'Ongoing', time: '' };
  } else if (need.urgency === 'specific' && need.specific_date) {
    const dateStr = formatDate(need.specific_date);
    const timeStr = need.specific_time ? formatTime(need.specific_time) : '';
    return { date: dateStr, time: timeStr };
  } else {
    // For flexible needs, show timeframe preference if available
    const fallbackDate = need.specific_date || need.event_date || need.ongoing_start_date || 'Flexible';
    const timePreference = need.time_preference || 'Any time';
    return { date: fallbackDate, time: timePreference };
  }
};

const formatOngoingSchedule = (need: any): string => {
  if (need.urgency !== 'ongoing') return '';
  
  const parts = [];
  
  if (need.ongoing_start_date) {
    parts.push(`Starts ${formatDate(need.ongoing_start_date)}`);
  }
  
  if (need.ongoing_start_time) {
    parts.push(`at ${formatTime(need.ongoing_start_time)}`);
  }
  
  if (need.recurring_pattern) {
    const pattern = need.recurring_pattern.charAt(0).toUpperCase() + need.recurring_pattern.slice(1);
    parts.push(`(${pattern})`);
  }
  
  return parts.join(' ');
};

export default function MemberDashboard() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Best Match');
  const [userGifts, setUserGifts] = useState<string[]>([]);
  const [userCommitments, setUserCommitments] = useState<string[]>([]);
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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
        .select(`
          *,
          commitments(count)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.log('Database error:', error);
        setOpportunities([]);
      } else {
        console.log('Found needs:', data?.length || 0);
        console.log('Sample need with commitments:', data?.[0]);
        
        if (data && data.length > 0) {
          const transformedOpportunities: Opportunity[] = data.map((need: any) => {
            // Clean up description by removing appended schedule information
            let cleanDescription = need.description || 'Community assistance needed.';
            if (cleanDescription.includes('Ongoing Schedule:')) {
              cleanDescription = cleanDescription.split('Ongoing Schedule:')[0].trim();
            }
            
            const dateTimeDisplay = formatDateDisplay(need);
            
            return {
              id: need.id,
              title: need.title || `Need in ${need.location || 'Community'}`,
              description: cleanDescription,
              location: need.location || need.geographic_location || need.city || 'Location TBD',
              date: dateTimeDisplay.date,
              time: dateTimeDisplay.time,
              committed: need.commitments?.[0]?.count || 0,
              needed: need.people_needed || 1,
              categories: need.giftings_needed && need.giftings_needed.length > 0 ? need.giftings_needed : ['Care'],
              tags: need.giftings_needed && need.giftings_needed.length > 0 
                ? need.giftings_needed.map((gift: string) => `${gift} ✓`) 
                : ['Care ✓'],
              urgency: need.urgency,
              specific_date: need.specific_date,
              specific_time: need.specific_time,
              ongoing_start_date: need.ongoing_start_date,
              ongoing_start_time: need.ongoing_start_time,
              recurring_pattern: need.recurring_pattern,
              time_preference: need.time_preference,
              ongoing_schedule: formatOngoingSchedule(need)
            };
          });
          
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
    // Quick auth sanity check
    async function checkAuth() {
      console.log('🔐 Dashboard auth check starting...');
      
      // Debug: Check localStorage for session data
      const sessionStorage = localStorage.getItem('sb-rydvyhzbudmtldmfelby-auth-token');
      console.log('🔐 Dashboard localStorage session:', sessionStorage ? 'EXISTS' : 'MISSING');
      console.log('🔐 Dashboard localStorage content:', sessionStorage);
      
      // Add a small delay to ensure session is fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try getUser() instead of getSession()
      const userResult = await supabase.auth.getUser();
      console.log('🔐 Dashboard auth getUser result:', {
        hasUser: !!userResult.data.user,
        userId: userResult.data.user?.id,
        userEmail: userResult.data.user?.email,
        error: userResult.error?.message
      });
      
      // Also try getSession() for comparison
      const s = await supabase.auth.getSession();
      console.log('🔐 Dashboard auth getSession result:', {
        hasSession: !!s.data.session,
        hasUser: !!s.data.session?.user,
        userId: s.data.session?.user?.id,
        userEmail: s.data.session?.user?.email,
        error: s.error?.message
      });
      
      if (userResult.data.user?.id) {
        console.log('🔐 Dashboard setting currentUserId to:', userResult.data.user.id);
        setCurrentUserId(userResult.data.user.id);
      } else if (s.data.session?.user?.id) {
        console.log('🔐 Dashboard setting currentUserId from session to:', s.data.session.user.id);     
        setCurrentUserId(s.data.session.user.id);
      } else {
        console.log('🔐 Dashboard no valid user found, redirecting to auth');
        router.push('/auth');
        return;
      }
      
      // Additional debugging for modal
      console.log('🔐 Dashboard currentUserId state will be:', userResult.data.user?.id || s.data.session?.user?.id);
    }
    checkAuth();
    
    fetchNeeds();
  }, []);

  // Handle deep-link modal opening
  useEffect(() => {
    const needId = searchParams.get('needId');
    console.log('[dashboard] Deep-link needId from URL:', needId);
    if (needId) {
      setSelectedNeedId(needId);
    }
  }, [searchParams]);

  const handleNeedClick = (needId: string) => {
    console.log('[dashboard] Need clicked with ID:', needId);
    setSelectedNeedId(needId);
    router.replace(`/dashboard?needId=${needId}`, { scroll: false });
  };

  const handleModalClose = () => {
    setSelectedNeedId(null);
    router.replace('/dashboard', { scroll: false });
  };

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-sort-dropdown]')) {
          setSortOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortOpen]);

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

  // Fetch user commitments when component loads
  useEffect(() => {
    async function fetchUserCommitments() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: commitments } = await supabase
          .from('opportunity_responses')
          .select('need_id, status')
          .eq('user_id', session.user.id)
          .in('status', ['pending', 'accepted']);

        if (commitments) {
          setUserCommitments(commitments.map(c => c.need_id));
          console.log('User commitments loaded:', commitments.map(c => c.need_id));
        }
      } catch (error) {
        console.error('Error fetching user commitments:', error);
      }
    }

    fetchUserCommitments();
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

  // Sort the filtered opportunities based on selectedSort
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    switch (selectedSort) {
      case 'Best Match':
        // Sort by gift matching - opportunities with more matching tags first
        const aMatches = a.tags.filter(tag => {
          const tagName = tag.replace(' ✓', '');
          return userGifts.some(gift => 
            gift.toLowerCase().includes(tagName.toLowerCase()) ||
            tagName.toLowerCase().includes(gift.toLowerCase())
          );
        }).length;
        const bMatches = b.tags.filter(tag => {
          const tagName = tag.replace(' ✓', '');
          return userGifts.some(gift => 
            gift.toLowerCase().includes(tagName.toLowerCase()) ||
            tagName.toLowerCase().includes(gift.toLowerCase())
          );
        }).length;
        return bMatches - aMatches;
      
      case 'Newest':
        // Sort by creation date (assuming newer needs have higher IDs or we can add created_at)
        return parseInt(b.id) - parseInt(a.id);
      
      case 'Date':
        // Sort by urgency and date
        const urgencyOrder = { 'asap': 0, 'specific': 1, 'ongoing': 2 };
        const aUrgency = urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 3;
        const bUrgency = urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 3;
        
        if (aUrgency !== bUrgency) {
          return aUrgency - bUrgency;
        }
        
        // If same urgency, sort by date (specific dates first, then ongoing, then flexible)
        if (a.urgency === 'specific' && b.urgency === 'specific') {
          const aDate = new Date(a.specific_date || '');
          const bDate = new Date(b.specific_date || '');
          return aDate.getTime() - bDate.getTime();
        }
        
        return 0;
      
      case 'Most Needed':
        // Sort by how many more people are needed
        const aNeeded = a.needed - a.committed;
        const bNeeded = b.needed - b.committed;
        return bNeeded - aNeeded;
      
      default:
        return 0;
    }
  });

  // Create notifications for leaders when someone signs up to help
  const createNotificationForLeaders = async (needId: string, volunteerId: string) => {
    try {
      console.log('🔔 Creating notifications for leaders...');
      
      // First check if notifications table exists by trying a simple query
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.log('ℹ️ Notifications table not found, skipping notification creation:', tableCheckError.message);
        return;
      }
      
      // Get the need details
      console.log('🔍 Fetching need details for ID:', needId);
      const { data: need, error: needError } = await supabase
        .from('needs')
        .select('title, church_code')
        .eq('id', needId)
        .single();

      console.log('🔍 Need query result:', { need, needError });

      if (needError || !need) {
        console.error('❌ Error fetching need details:', {
          needError,
          needErrorType: typeof needError,
          needErrorKeys: Object.keys(needError || {}),
          needErrorString: JSON.stringify(needError, null, 2),
          needErrorMessage: needError?.message,
          needErrorCode: needError?.code,
          needErrorDetails: needError?.details,
          needErrorHint: needError?.hint,
          need,
          needId
        });
        return;
      }

      // Get volunteer details
      console.log('🔍 Fetching volunteer details for ID:', volunteerId);
      const { data: volunteer, error: volunteerError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', volunteerId)
        .single();

      console.log('🔍 Volunteer query result:', { volunteer, volunteerError });

      if (volunteerError || !volunteer) {
        console.error('❌ Error fetching volunteer details:', {
          volunteerError,
          volunteerErrorType: typeof volunteerError,
          volunteerErrorKeys: Object.keys(volunteerError || {}),
          volunteerErrorString: JSON.stringify(volunteerError, null, 2),
          volunteerErrorMessage: volunteerError?.message,
          volunteerErrorCode: volunteerError?.code,
          volunteer,
          volunteerId
        });
        return;
      }

      // Get all leaders in the same organization
      console.log('🔍 Fetching leaders for church_code:', need.church_code);
      const { data: leaders, error: leadersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_leader', true)
        .eq('church_code', need.church_code);

      console.log('🔍 Leaders query result:', { leaders, leadersError });

      if (leadersError || !leaders || leaders.length === 0) {
        console.log('ℹ️ No leaders found for organization:', {
          churchCode: need.church_code,
          leadersError,
          leadersCount: leaders?.length || 0
        });
        return;
      }

      // Create notifications for each leader
      const notifications = leaders.map(leader => ({
        user_id: leader.id,
        title: 'New Volunteer Signup',
        message: `${volunteer.full_name || 'Someone'} signed up to help with "${need.title}"`,
        related_need_id: needId,
        related_response_id: null, // We'll update this after getting the response ID
        is_read: false
      }));

      const { data: insertedNotifications, error: insertError } = await supabase
        .from('notifications')
        .insert(notifications)
        .select('id');

      if (insertError) {
        console.error('❌ Error creating notifications:', insertError);
        return;
      }

      console.log('✅ Created notifications for', leaders.length, 'leaders');
      
      // Update notifications with the response ID
      const { data: response, error: responseError } = await supabase
        .from('opportunity_responses')
        .select('id')
        .eq('need_id', needId)
        .eq('user_id', volunteerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (response && !responseError) {
        await supabase
          .from('notifications')
          .update({ related_response_id: response.id })
          .in('id', insertedNotifications.map(n => n.id));
      }

    } catch (error) {
      console.error('❌ Error in createNotificationForLeaders:', error);
    }
  };

  const handleICanHelp = async (needId: string) => {
    try {
      console.log('🔘 I Can Help clicked for need:', needId);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error('Please sign in to help');
        return;
      }

      console.log('✅ User session found:', session.user.id);
      console.log('🔍 Starting duplicate check...');

      // Check if already submitted a response
      const { data: existing, error: checkError } = await supabase
        .from('opportunity_responses')
        .select('id, status')
        .eq('need_id', needId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking existing commitment:', checkError);
        toast.error('Error checking your commitment status');
        return;
      }
      
      console.log('✅ Duplicate check passed, no existing response found');
      console.log('🔍 Checking if existing response found...', { existing });

      if (existing) {
        if (existing.status === 'pending') {
          toast('Your volunteer response is pending leader approval!', {
            icon: '⏳',
            style: {
              background: '#f59e0b',
              color: 'white',
            },
          });
        } else if (existing.status === 'accepted') {
          toast('You\'re already signed up to help with this need!', {
            icon: '✅',
            style: {
              background: '#10b981',
              color: 'white',
            },
          });
        } else if (existing.status === 'declined') {
          toast('Your volunteer response was declined. Please contact a leader if you have questions.', {
            icon: '❌',
            style: {
              background: '#ef4444',
              color: 'white',
            },
          });
        }
        return;
      }

      console.log('🔍 No existing response found, proceeding to create new response...');

      // Create opportunity response (auto-accepted)
      console.log('📝 Creating opportunity response for need:', needId, 'user:', session.user.id);
      console.log('🔍 Attempting database insert...');
      
      const { error } = await supabase
        .from('opportunity_responses')
        .insert({
          need_id: needId,
          user_id: session.user.id,
          response_type: 'volunteer',
          status: 'accepted'
        });

      if (error) {
        console.error('❌ Opportunity response error:', error);
        toast.error('Failed to submit volunteer response');
        return;
      } else {
        console.log('✅ Database insert successful');
        console.log('✅ Successfully submitted volunteer response');
        console.log('🔍 Showing success toast...');
        toast.success('You\'re signed up to help! Added to your commitments.');
        console.log('✅ Toast notification shown');
        
        // Add the new response to state immediately for UI feedback
        setUserCommitments(prev => [...prev, needId]);
        
        // TEMPORARILY DISABLED: Create notification for leaders (non-blocking)
        // TODO: Re-enable notifications after core functionality is stable
        /*
        try {
          await createNotificationForLeaders(needId, session.user.id);
        } catch (notificationError) {
          console.error('❌ Notification creation failed, but volunteer signup succeeded:', notificationError);
          // Don't break the main flow - notification is optional
        }
        */
        console.log('✅ Volunteer signup completed successfully (notifications temporarily disabled)');
        console.log('🔍 Process complete - all steps finished successfully');
        
        // Update volunteer count via RPC
        console.log('📊 Updating volunteer count...');
        const { error: rpcError } = await supabase.rpc('increment_volunteer_count', { need_id: needId });
        
        if (rpcError) {
          console.error('❌ RPC error:', rpcError);
          // Don't show error to user, just log it
        }
        
        // Refresh the needs list to show updated volunteer counts
        console.log('🔄 Refreshing needs list...');
        fetchNeeds();
    } catch (error) {
      console.error('❌ CRITICAL ERROR in handleICanHelp:', error);
      console.error('❌ Error details:', {
        error,
        errorType: typeof error,
        errorKeys: Object.keys(error || {}),
        errorString: JSON.stringify(error, null, 2),
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        needId
      });
      toast.error('An unexpected error occurred. Please try again.');
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
            {sortedOpportunities.length} opportunities • {sortedOpportunities.filter(opp => 
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
            <div style={{ position: 'relative' }} data-sort-dropdown>
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
          {sortedOpportunities.map((opportunity) => (
            <div 
              key={opportunity.id} 
              style={{ 
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '280px', // Consistent card height
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleNeedClick(opportunity.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Card Header */}
              <div style={{ padding: '20px 20px 0 20px' }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '700', // Changed from '600' to '700' for bold
                  marginBottom: '16px',
                  color: '#1e293b',
                  lineHeight: '1.3',
                  fontFamily: quicksandFont,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {opportunity.title}
                  {opportunity.urgency === 'asap' && (
                    <AlertCircle size={20} color="#dc2626" />
                  )}
                </h3>
                
                {/* Metadata Row - 3 columns horizontal layout */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: '#64748b',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '12px',
                  minHeight: '44px'
                }}>
                  {/* Column 1 - Date */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    flex: 1,
                    minHeight: '44px'
                  }}>
                    <Calendar size={16} style={{ 
                      marginBottom: '4px', 
                      color: '#64748b',
                      flexShrink: 0
                    }} />
                    <div style={{ fontSize: '12px', lineHeight: '1.2', textAlign: 'center' }}>
                      <div>{opportunity.date}</div>
                      {opportunity.time && (
                        <div style={{ 
                          color: '#9ca3af', 
                          fontSize: '11px', 
                          marginTop: '2px',
                          fontWeight: '400'
                        }}>
                          {opportunity.time}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Column 2 - Location */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    flex: 1,
                    minHeight: '44px'
                  }}>
                    <MapPin size={16} style={{ 
                      marginBottom: '4px', 
                      color: '#64748b',
                      flexShrink: 0
                    }} />
                    <div style={{ fontSize: '12px', lineHeight: '1.2', textAlign: 'center' }}>
                      {opportunity.location}
                    </div>
                  </div>
                  
                  {/* Column 3 - People */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    flex: 1,
                    minHeight: '44px'
                  }}>
                    <Users size={16} style={{ 
                      marginBottom: '4px', 
                      color: '#64748b',
                      flexShrink: 0
                    }} />
                    <div style={{ fontSize: '12px', lineHeight: '1.2', textAlign: 'center' }}>
                      <div>{opportunity.committed} committed</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px' }}>
                        {opportunity.needed}+ needed
                      </div>
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


                {/* Skills Section - Matching modal style */}
                {opportunity.tags && opportunity.tags.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Wrench size={16} color="#6b7280" />
                      <span style={{ 
                        color: '#6b7280', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        fontFamily: quicksandFont 
                      }}>
                        Skills needed:
                      </span>
                    </div>
                  </div>
                )}

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
                          fontFamily: quicksandFont,
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
                {(() => {
                  const isCommitted = userCommitments.includes(opportunity.id);
                  return (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isCommitted) {
                          handleICanHelp(opportunity.id);
                        }
                      }}
                      disabled={isCommitted}
                      style={{ 
                        width: '100%',
                        backgroundColor: isCommitted ? 'white' : '#20c997',
                        color: isCommitted ? '#20c997' : 'white',
                        padding: '12px 0',
                        borderRadius: '8px',
                        border: '2px solid #20c997',
                        fontWeight: '600',
                        fontFamily: quicksandFont,
                        cursor: isCommitted ? 'default' : 'pointer',
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {isCommitted ? (
                        <>
                          You're Helping
                          <Check size={16} />
                        </>
                      ) : (
                        'I Can Help'
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Persistent Footer */}
      <Footer />

      {/* Need Detail Modal */}
      <NeedDetailModal 
        needId={selectedNeedId}
        onClose={handleModalClose}
        userId={currentUserId || undefined}
      />
    </div>
  );
}