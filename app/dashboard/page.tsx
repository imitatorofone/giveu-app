'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar, Clock, MapPin, Users, User, Bell, 
  CalendarDays, Plus, UserCircle, MessageCircle, AlertCircle, Check, Wrench 
} from 'lucide-react';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser'; // Use browser client for session persistence
import { GIFT_CATEGORIES } from '../../constants/giftCategories.js';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import dynamic from 'next/dynamic';
import { createNotification } from '@/lib/notificationHelper';
import { BRAND } from '../../lib/brandConfig';

const NeedDetailModal = dynamic(
  () => import('../../components/NeedDetailModal'),
  { ssr: false }
);
import toast from 'react-hot-toast';


interface Opportunity {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  volunteers_count: number;
  needed: number;
  people_needed?: number;
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
  responses?: Array<{
    user_id: string;
    status: string;
  }>;
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

const getLocationLine1 = (address: string | null | undefined) => {
  if (!address) return 'Location TBD';
  
  const parts = address.split(',');
  if (parts.length > 1) {
    return parts[0].trim();
  }
  
  return address;
};

const getLocationLine2 = (address: string | null | undefined) => {
  if (!address) return '';
  
  const parts = address.split(',');
  if (parts.length > 1) {
    return parts.slice(1).join(',').trim();
  }
  
  return '';
};

export default function MemberDashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Best Match');
  const [userGifts, setUserGifts] = useState<string[]>([]);
  const [userCommitments, setUserCommitments] = useState<string[]>([]);
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deepLinkRetryCount, setDeepLinkRetryCount] = useState(0);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const router = useRouter();
  const searchParams = useSearchParams();

  // Helper function to sort skills with user matches first
  const sortSkillsByMatch = (tags: string[]): string[] => {
    const userMatches: string[] = [];
    const nonMatches: string[] = [];
    
    tags.forEach(tag => {
      const tagName = tag.replace(' ✓', '').toLowerCase();
      const isMatch = userGifts.some(gift => 
        gift.toLowerCase().includes(tagName) || tagName.includes(gift.toLowerCase())
      );
      
      if (isMatch) {
        userMatches.push(tag);
      } else {
        nonMatches.push(tag);
      }
    });
    
    return [...userMatches, ...nonMatches];
  };

  // Helper function to toggle skills expansion
  const toggleSkillsExpansion = (opportunityId: string) => {
    const newExpanded = new Set(expandedSkills);
    if (newExpanded.has(opportunityId)) {
      newExpanded.delete(opportunityId);
    } else {
      newExpanded.add(opportunityId);
    }
    setExpandedSkills(newExpanded);
  };

  // Helper function to sync volunteers_count with actual opportunity_responses
  const syncVolunteerCounts = async () => {
    try {
      console.log('🔄 Starting volunteer count sync...');
      const { data: needs } = await supabase
        .from('needs')
        .select('id')
        .in('status', ['active', 'approved']);
      
      if (!needs || needs.length === 0) {
        console.log('⚠️ No active needs found to sync');
        return;
      }

      for (const need of needs) {
        const { count } = await supabase
          .from('opportunity_responses')
          .select('*', { count: 'exact', head: true })
          .eq('need_id', need.id)
          .eq('status', 'accepted');
        
        await supabase
          .from('needs')
          .update({ volunteers_count: count || 0 })
          .eq('id', need.id);
        
        console.log(`✅ Synced need ${need.id}: ${count || 0} volunteers`);
      }
      
      console.log('✅ Volunteer count sync complete');
    } catch (error) {
      console.error('❌ Error syncing volunteer counts:', error);
    }
  };

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
          commitments(count),
          responses:opportunity_responses(user_id, status)
        `)
        .in('status', ['active', 'approved'])
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
              volunteers_count: need.volunteers_count || 0,
              needed: need.people_needed || 1,
              people_needed: need.people_needed || 1,
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
              ongoing_schedule: formatOngoingSchedule(need),
              responses: need.responses
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
    
    // Sync volunteer counts on initial load
    syncVolunteerCounts();
    
    fetchNeeds();
  }, []);

  // Profile completeness check - redirect incomplete users to onboarding
  useEffect(() => {
    async function checkProfileCompleteness() {
      // Only run if we have a user ID
      if (!currentUserId) return;
      
      console.log('[dashboard] 🔍 Checking profile completeness for user:', currentUserId);
      
      try {
        // Fetch complete profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('church_code, gift_selections, full_name')
          .eq('id', currentUserId)
          .single();

        if (error) {
          console.error('[dashboard] Error fetching profile for completeness check:', error);
          return;
        }

        // Check if profile is complete
        const hasChurchCode = profile?.church_code && profile.church_code.trim() !== '';
        const hasGifts = profile?.gift_selections && profile.gift_selections.length > 0;

        console.log('[dashboard] Profile completeness:', { 
          hasChurchCode, 
          hasGifts,
          church_code: profile?.church_code,
          gifts_count: profile?.gift_selections?.length,
          full_name: profile?.full_name
        });

        // Redirect to appropriate onboarding step
        if (!hasChurchCode) {
          console.log('[dashboard] Missing church_code, redirecting to /setup');
          router.push('/setup');
          return;
        }

        if (!hasGifts) {
          console.log('[dashboard] Missing gifts, redirecting to /survey');
          router.push('/survey');
          return;
        }

        console.log('[dashboard] ✅ Profile complete, allowing dashboard access');
      } catch (error) {
        console.error('[dashboard] Error in profile completeness check:', error);
      }
    }

    checkProfileCompleteness();
  }, [currentUserId, router]);

  // Handle deep-link modal opening
  useEffect(() => {
    const needId = searchParams.get('needId');
    console.log('[dashboard] Deep-link needId from URL:', needId);
    console.log('[dashboard] Opportunities loaded:', opportunities.length);
    console.log('[dashboard] Deep-link retry count:', deepLinkRetryCount);
    
    if (needId && opportunities.length > 0) {
      // Check if the need exists in loaded opportunities
      const needExists = opportunities.some(opp => opp.id === needId);
      
      if (needExists) {
        console.log('[dashboard] Opening modal for need:', needId);
        setSelectedNeedId(needId);
        setDeepLinkRetryCount(0); // Reset retry count on success
      } else {
        console.warn('[dashboard] Need not found in opportunities:', needId);
        console.log('[dashboard] Available need IDs:', opportunities.map(opp => opp.id));
        
        // Retry fetching needs if we haven't tried too many times
        if (deepLinkRetryCount < 2) {
          console.log('[dashboard] Retrying fetchNeeds for deep-link...');
          setDeepLinkRetryCount(prev => prev + 1);
          fetchNeeds();
        } else {
          console.error('[dashboard] Max retries reached for deep-link need:', needId);
        }
      }
    } else if (needId && opportunities.length === 0 && !loading) {
      console.log('[dashboard] NeedId found but opportunities not loaded yet, retrying...');
      if (deepLinkRetryCount < 2) {
        setDeepLinkRetryCount(prev => prev + 1);
        fetchNeeds();
      }
    }
  }, [searchParams, opportunities, loading, deepLinkRetryCount]); // Add dependencies

  /* Disabled for MVP - modal functionality
  const handleNeedClick = (needId: string) => {
    console.log('[dashboard] Need clicked with ID:', needId);
    setSelectedNeedId(needId);
    router.replace(`/dashboard?needId=${needId}`, { scroll: false });
  };

  const handleModalClose = () => {
    setSelectedNeedId(null);
    router.replace('/dashboard', { scroll: false });
  };
  */

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


  const staticOpportunities = [
    {
      id: '1',
      title: 'Community Meal Preparation',
      description: 'Help prepare meals for families in need during our monthly outreach event.',
      location: 'Church Kitchen',
      time: '2-5pm',
      date: 'This Saturday',
      volunteers_count: 1,
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
      volunteers_count: 0,
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
      volunteers_count: 1,
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
      volunteers_count: 0,
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
      volunteers_count: 0,
      needed: 3,
      categories: ['Pioneering', 'People'],
      tags: ['Evangelism ✓', 'Networking ✓']
    }
  ];


  // Helper function to parse people_needed field
  const parsePeopleNeeded = (peopleNeeded: any): number => {
    if (!peopleNeeded) return 1;
    // Remove "+" if present and convert to number
    return parseInt(peopleNeeded.toString().replace('+', '')) || 1;
  };

  // Filter out fully committed needs
  const availableOpportunities = opportunities.filter(need => {
    const needed = parsePeopleNeeded(need.people_needed);
    const committed = need.volunteers_count || 0;
    return committed < needed; // Only show if not fully committed
  });

  // Sort the opportunities based on selectedSort
  const sortedOpportunities = [...availableOpportunities].sort((a, b) => {
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
        const aNeeded = a.needed - a.volunteers_count;
        const bNeeded = b.needed - b.volunteers_count;
        return bNeeded - aNeeded;
      
      default:
        return 0;
    }
  });

  const handleICanHelp = async (needId: string) => {
    console.log('🔘 I Can Help clicked for need:', needId);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      toast.error('Please sign in to help');
      return;
    }

    console.log('✅ User session found:', session.user.id);

    // Check if already submitted a response
    const { data: existing, error: checkError } = await supabase
      .from('opportunity_responses')
      .select('id, status')
      .eq('need_id', needId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing commitment:', checkError);
      toast.error('Error checking your commitment status');
      return;
    }

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

    // Create opportunity response (auto-accepted)
    console.log('📝 Creating opportunity response for need:', needId, 'user:', session.user.id);
    
    console.log('🔍 [Debug] Attempting to insert opportunity response:', {
      need_id: needId,
      user_id: session.user.id,
      response_type: 'volunteer',
      status: 'accepted'
    });

    const { data, error } = await supabase
      .from('opportunity_responses')
      .insert({
        need_id: needId,
        user_id: session.user.id,
        response_type: 'volunteer',
        status: 'accepted'
      })
      .select();

    if (error) {
      console.error('❌ Opportunity response error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2)
      });
      
      // Try to get more info about the table
      console.log('🔍 Checking if opportunity_responses table exists...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('opportunity_responses')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('❌ Table check error:', tableError);
        toast.error('Database table not found. Please contact support.');
      } else {
        console.log('✅ Table exists, but insert failed');
        toast.error('Failed to submit volunteer response');
      }
    } else {
      console.log('✅ Successfully submitted volunteer response:', data);
      toast.success('You\'re signed up to help! Added to your commitments.');
      
      // Add the new response to state immediately for UI feedback
      setUserCommitments(prev => [...prev, needId]);
      
      // Get the current need to check volunteers_count
      const { data: currentNeed } = await supabase
        .from('needs')
        .select('volunteers_count')
        .eq('id', needId)
        .single();
      
      // Update volunteers_count in needs table
      console.log('📊 Updating volunteers_count...');
      const { error: updateError } = await supabase
        .from('needs')
        .update({ 
          volunteers_count: (currentNeed?.volunteers_count || 0) + 1 
        })
        .eq('id', needId);
      
      if (updateError) {
        console.error('❌ Error updating committed count:', updateError);
      } else {
        console.log('✅ Committed count updated successfully');
      }
      
      // Update volunteer count via RPC (backup method)
      console.log('📊 Updating volunteer count via RPC...');
      const { error: rpcError } = await supabase.rpc('increment_volunteer_count', { need_id: needId });
      
      if (rpcError) {
        console.error('❌ RPC error:', rpcError);
        // Don't show error to user, just log it
      }
      
      // Refresh the needs list to show updated volunteer counts
      console.log('🔄 Refreshing needs list...');
      fetchNeeds();

      // Check if need is now fulfilled and notify creator
      try {
        console.log('🎯 Checking if need is fulfilled...');
        
        // Get the need with current volunteer count and requirements
        const { data: needData, error: needError } = await supabase
          .from('needs')
          .select(`
            id,
            title,
            people_needed,
            created_by,
            commitments(count)
          `)
          .eq('id', needId)
          .single();

        if (needError) {
          console.error('❌ Error fetching need for fulfillment check:', needError);
          return;
        }

        if (needData && needData.created_by) {
          const volunteerCount = needData.commitments?.[0]?.count || 0;
          const peopleNeeded = needData.people_needed || 1;
          
          console.log(`🎯 Need fulfillment check: ${volunteerCount}/${peopleNeeded} volunteers`);
          
          // Check if need is fulfilled (has enough volunteers)
          if (volunteerCount >= peopleNeeded) {
            console.log('🎉 Need is fulfilled! Notifying creator...');
            
            // Create DIY notification for the need creator
            await createNotification({
              userId: needData.created_by,
              eventType: 'need.fulfilled',
              title: 'Your Need Has Enough Volunteers!',
              description: `${volunteerCount} people signed up for ${needData.title}`,
              path: '/commitments',
              needId: needData.id,
              need_title: needData.title
            });
            
            // Trigger Knock workflow for push notification
            try {
              await fetch('/api/knock/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  workflow: 'need_fulfilled',
                  userId: needData.created_by,
                  data: {
                    need_title: needData.title,
                    need_id: needData.id,
                    volunteer_count: volunteerCount
                  }
                })
              });
              console.log('✅ Knock workflow triggered for need_fulfilled to creator:', needData.created_by);
            } catch (knockError) {
              console.warn('Knock trigger failed for need_fulfilled:', knockError);
            }
          } else {
            console.log('📊 Need not yet fulfilled, no notification sent');
          }
        }
      } catch (fulfillmentError) {
        console.error('❌ Error checking need fulfillment:', fulfillmentError);
        // Don't fail the main flow if fulfillment check fails
      }

        // Create notifications for leaders and need creator
        console.log('🔔 Creating notifications...');
        
        try {
          // Fetch the need details
          const { data: needData, error: needError } = await supabase
            .from('needs')
            .select('id, title, description, church_code, created_by')
            .eq('id', needId)
            .single();

          if (needError) {
            console.error('❌ Error fetching need details:', needError);
          } else if (needData) {
            // Get user profile for volunteer name
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', session.user.id)
              .single();

            const volunteerName = userProfile?.full_name || 'A volunteer';

            // Track who we've notified to prevent duplicates
            const notifiedUsers = new Set<string>();

            // Notify leaders in the same church
            const { data: leaders } = await supabase
              .from('profiles')
              .select('id')
              .eq('church_code', needData.church_code)
              .eq('is_leader', true);

            console.log('🔔 Found leaders to notify:', leaders?.length);

            if (leaders && leaders.length > 0) {
              for (const leader of leaders) {
                if (!notifiedUsers.has(leader.id)) {
                  console.log('🔔 Notifying leader:', leader.id);
                  
                  // Create DIY notification
                  await createNotification({
                    userId: leader.id,
                    eventType: 'volunteer.signed_up',
                    title: needData.title,
                    description: `${volunteerName} signed up to help.`,
                    path: '/leader/volunteer-responses',
                    needId: needId,
                    need_title: needData.title,
                    volunteer_name: volunteerName,
                    volunteer_id: session.user.id
                  });
                  
                  // Trigger Knock workflow for push
                  try {
                    const knockResponse = await fetch('/api/knock/trigger', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        workflow: 'volunteer_signed_up',
                        userId: leader.id,
                        data: {
                          need_title: needData.title,
                          volunteer_name: volunteerName,
                          volunteer_id: session.user.id
                        }
                      })
                    });

                    if (knockResponse.ok) {
                      console.log('✅ Knock workflow triggered for leader:', leader.id);
                    }
                  } catch (knockError) {
                    console.warn('Knock trigger failed:', knockError);
                  }
                  
                  notifiedUsers.add(leader.id);
                } else {
                  console.log('🔔 Skipping duplicate notification for leader:', leader.id);
                }
              }
            }

            // Notify the need creator (if not already notified and not the volunteer)
            if (needData.created_by && 
                needData.created_by !== session.user.id && 
                !notifiedUsers.has(needData.created_by)) {
              console.log('🔔 Notifying need creator:', needData.created_by);
              
              // Create DIY notification
              await createNotification({
                userId: needData.created_by,
                eventType: 'volunteer.signed_up',
                title: needData.title,
                description: `${volunteerName} signed up to help.`,
                path: '/commitments',
                needId: needId,
                need_title: needData.title,
                volunteer_name: volunteerName,
                volunteer_id: session.user.id
              });
              
              // Trigger Knock workflow for push
              try {
                const knockResponse = await fetch('/api/knock/trigger', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    workflow: 'volunteer_signed_up',
                    userId: needData.created_by,
                    data: {
                      need_title: needData.title,
                      volunteer_name: volunteerName,
                      volunteer_id: session.user.id
                    }
                  })
                });

                if (knockResponse.ok) {
                  console.log('✅ Knock workflow triggered for need creator:', needData.created_by);
                }
              } catch (knockError) {
                console.warn('Knock trigger failed for need creator:', knockError);
              }
            }
          }
        } catch (notificationError) {
          console.error('❌ Error creating notifications:', notificationError);
          // Don't fail the main flow if notifications fail
        }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: BRAND.colors.background
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 32, 
            height: 32, 
            border: `2px solid ${BRAND.colors.primary}`,
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
      backgroundColor: BRAND.colors.background, 
      minHeight: '100vh', 
      paddingBottom: '80px',
      fontFamily: BRAND.fonts.body // Use brand body font
    }}>
      <Header />

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700',
            marginBottom: '8px',
            color: BRAND.colors.text,
            fontFamily: BRAND.fonts.heading // Use brand heading font
          }}>
            Ways to Serve
          </h1>
          <p style={{ 
            color: BRAND.colors.textLight,
            fontSize: '16px',
            fontFamily: BRAND.fonts.body // Use brand body font
          }}>Discover opportunities to use your gifts</p>
        </div>


        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ 
            color: BRAND.colors.textLight,
            fontFamily: BRAND.fonts.body,
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
                transition: 'all 0.2s ease'
              }}
              /* Disabled for MVP - modal functionality
              onClick={() => handleNeedClick(opportunity.id)}
              */
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Card Header */}
              <div style={{ padding: '16px 16px 0 16px' }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '700',
                  marginBottom: '12px',
                  color: BRAND.colors.text,
                  lineHeight: '1.3',
                  fontFamily: BRAND.fonts.heading,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textAlign: 'center'
                }}>
                  {opportunity.title}
                  {opportunity.urgency === 'asap' && (
                    <AlertCircle size={20} color={BRAND.colors.danger} />
                  )}
                </h3>
                
                {/* Metadata Row - 3 columns horizontal layout */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: BRAND.colors.textLight,
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
                      color: BRAND.colors.primary,
                      flexShrink: 0
                    }} />
                    <div style={{ fontSize: '12px', lineHeight: '1.2', textAlign: 'center' }}>
                      <div style={{ fontWeight: '500', color: BRAND.colors.text }}>{opportunity.date}</div>
                      {opportunity.time && (
                        <div style={{ 
                          color: BRAND.colors.textLight, 
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
                      color: BRAND.colors.primary,
                      flexShrink: 0
                    }} />
                    <div style={{ fontSize: '12px', lineHeight: '1.2', textAlign: 'center' }}>
                      <div style={{ fontWeight: '500', color: BRAND.colors.text }}>
                        {getLocationLine1(opportunity.location)}
                      </div>
                      <div style={{ color: BRAND.colors.textLight }}>
                        {getLocationLine2(opportunity.location)}
                      </div>
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
                      color: BRAND.colors.primary,
                      flexShrink: 0
                    }} />
                    <div style={{ fontSize: '12px', lineHeight: '1.3', textAlign: 'center' }}>
                      <div style={{ fontWeight: '500', color: BRAND.colors.text }}>
                        {(() => {
                          const peopleNeeded = opportunity.people_needed || 1;
                          const needsText = String(peopleNeeded);
                          return needsText.includes('+') ? `${needsText} needed` : `${needsText}+ needed`;
                        })()}
                      </div>
                      <div style={{ color: BRAND.colors.textLight, fontSize: '11px' }}>
                        {opportunity.volunteers_count || 0} committed
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ 
                padding: '0 16px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <p style={{ 
                  color: BRAND.colors.textLight,
                  fontSize: '14px',
                  lineHeight: '1.5',
                  marginBottom: '12px',
                  flex: 1,
                  fontFamily: BRAND.fonts.body
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
                        fontFamily: BRAND.fonts.heading 
                      }}>
                        Skills needed:
                      </span>
                    </div>
                  </div>
                )}

                {/* Tags - Dynamic color and checkmarks with Quicksand font */}
                {opportunity.tags && opportunity.tags.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      flexWrap: 'wrap'
                    }}>
                      {(() => {
                        const sortedSkills = sortSkillsByMatch(opportunity.tags);
                        const isExpanded = expandedSkills.has(opportunity.id);
                        const visibleSkills = isExpanded ? sortedSkills : sortedSkills.slice(0, 6);
                        const hasMoreSkills = sortedSkills.length > 6;
                        
                        return (
                          <>
                            {visibleSkills.map((tag) => {
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
                                    fontFamily: BRAND.fonts.heading,
                                    ...styles
                                  }}
                                >
                                  {tagName} {/* No checkmark, just clean tag name */}
                                </span>
                              );
                            })}
                            
                            {/* Show More/Less Button */}
                            {hasMoreSkills && (
                              <button
                                onClick={() => toggleSkillsExpansion(opportunity.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '16px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  fontFamily: BRAND.fonts.heading,
                                  backgroundColor: '#f3f4f6',
                                  color: BRAND.colors.text,
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = BRAND.colors.primary;
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                  e.currentTarget.style.color = BRAND.colors.text;
                                }}
                              >
                                {isExpanded ? 'Show Less' : `+${sortedSkills.length - 6} more`}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div style={{ 
                padding: '16px 16px',
                borderTop: '1px solid #f1f5f9',
                backgroundColor: '#fafbfc'
              }}>
                {(() => {
                  // Check if user has already signed up for this need
                  const isHelping = opportunity.responses?.some(r => r.user_id === currentUserId && r.status === 'accepted') || 
                                   userCommitments.includes(opportunity.id);
                  
                  return isHelping ? (
                    <button 
                      className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium"
                      style={{ 
                        backgroundColor: '#d1d5db',
                        color: '#6b7280',
                        minHeight: '44px',
                        cursor: 'not-allowed',
                        width: '100%',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontFamily: BRAND.fonts.heading,
                        fontSize: '15px',
                        border: '2px solid #d1d5db'
                      }}
                      disabled
                    >
                      <Check size={16} />
                      You're Helping
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleICanHelp(opportunity.id);
                      }}
                      className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors"
                      style={{ 
                        backgroundColor: BRAND.colors.primary,
                        minHeight: '44px',
                        width: '100%',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontFamily: BRAND.fonts.heading,
                        fontSize: '15px',
                        border: `2px solid ${BRAND.colors.primary}`,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = BRAND.colors.primary}
                    >
                      I Can Help
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

      {/* Disabled for MVP - modal functionality
      <NeedDetailModal 
        needId={selectedNeedId}
        onClose={handleModalClose}
        userId={currentUserId || undefined}
      />
      */}
    </div>
  );
}