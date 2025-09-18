'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ClientOnly from '../_clientOnly';
import { Users, AlertTriangle, CheckCircle, Heart, Calendar, Clock, UserPlus, ClipboardList, BookOpen, Home, MessageCircle, CalendarDays, Mail, MapPin, User, Plus, Eye, Crown } from 'lucide-react';
import { FeedbackModal } from '../components/FeedbackModal';
import { FeedbackList } from '../components/FeedbackList';
import { FeedbackButton } from '../components/FeedbackButton';
// import { Icon } from '../../icons/index'; // Commented out - missing file

// Gifting Taxonomy with 10 Primary Categories and Color Coding
const GIFTING_CATEGORIES = {
  'Hands-On Skills': {
    color: '#1e40af', // blue-800
    bgColor: '#dbeafe', // blue-100
    borderColor: '#bfdbfe', // blue-200
    tags: [
      'Carpentry', 'Repairs', 'Gardening', 'Sewing', 'Decorating', 
      'Setup/Tear Down', 'Cooking', 'Automotive', 'Painting', 'Maintenance',
      'Construction', 'Landscaping', 'Cleaning', 'Organization'
    ]
  },
  'People & Relationships': {
    color: '#6b21a8', // purple-800
    bgColor: '#e9d5ff', // purple-100
    borderColor: '#d8b4fe', // purple-200
    tags: [
      'Mentoring', 'Counseling', 'Hospitality', 'Community Building', 'Networking',
      'Relationship Building', 'Support Groups', 'Family Ministry', 'Youth Work',
      'Elder Care', 'Disability Support', 'Immigration Support'
    ]
  },
  'Problem-Solving & Organizing': {
    color: '#374151', // gray-800
    bgColor: '#f3f4f6', // gray-100
    borderColor: '#e5e7eb', // gray-200
    tags: [
      'Problem Solving', 'Strategic Planning', 'Project Management', 'Event Planning',
      'Administration', 'Data Analysis', 'Research', 'Quality Control',
      'Process Improvement', 'Risk Management', 'Budget Planning'
    ]
  },
  'Care & Comfort': {
    color: '#be185d', // pink-800
    bgColor: '#fce7f3', // pink-100
    borderColor: '#fbcfe8', // pink-200
    tags: [
      'Caregiving', 'Comfort', 'Healing', 'Prayer Ministry', 'Grief Support',
      'Medical Support', 'Mental Health', 'Addiction Recovery', 'Crisis Support',
      'Hospital Visits', 'Meal Preparation', 'Transportation'
    ]
  },
  'Learning & Teaching': {
    color: '#3730a3', // indigo-800
    bgColor: '#e0e7ff', // indigo-100
    borderColor: '#c7d2fe', // indigo-200
    tags: [
      'Teaching', 'Tutoring', 'Bible Study Leading', 'Coaching', 'Skill Training', 
      'Public Speaking', 'Mentoring', 'Training', 'Education',
      'Curriculum Development', 'Workshop Leading', 'Academic Support'
    ]
  },
  'Creativity & Expression': {
    color: '#be123c', // rose-800
    bgColor: '#ffe4e6', // rose-100
    borderColor: '#fecdd3', // rose-200
    tags: [
      'Art', 'Music', 'Writing', 'Photography', 'Design', 'Storytelling',
      'Graphic Design', 'Video Production', 'Creative Writing', 'Drama',
      'Crafts', 'Interior Design', 'Web Design', 'Content Creation'
    ]
  },
  'Leadership & Motivation': {
    color: '#92400e', // amber-800
    bgColor: '#fef3c7', // amber-100
    borderColor: '#fde68a', // amber-200
    tags: [
      'Leadership', 'Facilitating Groups', 'Casting Vision', 'Mentoring Teams', 'Event Leadership',
      'Preaching', 'Strategic Planning', 'Team Building', 'Project Management',
      'Decision Making', 'Conflict Resolution', 'Motivation', 'Inspiration'
    ]
  },
  'Behind-the-Scenes Support': {
    color: '#334155', // slate-800
    bgColor: '#f1f5f9', // slate-100
    borderColor: '#e2e8f0', // slate-200
    tags: [
      'Administration', 'Technology', 'Finance', 'Legal', 'Communication',
      'Data Entry', 'Scheduling', 'Inventory', 'Maintenance', 'Security',
      'IT Support', 'Accounting', 'Human Resources'
    ]
  },
  'Physical & Active': {
    color: '#166534', // green-800
    bgColor: '#dcfce7', // green-100
    borderColor: '#bbf7d0', // green-200
    tags: [
      'Sports Coaching', 'Outdoor Projects', 'Moving Help', 'Fitness Activities',
      'Recreation Leading', 'Disaster Relief', 'Physical Labor', 'Athletics',
      'Adventure Activities', 'Health & Wellness', 'Exercise', 'Outdoor Recreation'
    ]
  },
  'Pioneering & Connecting': {
    color: '#c2410c', // orange-800
    bgColor: '#fed7aa', // orange-100
    borderColor: '#fdba74', // orange-200
    tags: [
      'Evangelism', 'Community Outreach', 'Starting Ministries', 'Networking',
      'Fundraising', 'Advocacy', 'Community Building', 'Social Media',
      'Public Relations', 'Event Planning', 'Volunteer Coordination', 'Partnerships'
    ]
  }
};

// Safe MemberCard component pattern for reference
const SafeMemberCard = ({ user }: { user: any }) => {
  // Early return if no user data
  if (!user) {
    return (
      <div style={{ 
        padding: 16, 
        border: '1px solid #e5e7eb', 
        borderRadius: 8,
        backgroundColor: 'white'
      }}>
        <div style={{ 
          color: '#6b7280',
          fontSize: '14px',
          animation: 'pulse 2s infinite'
        }}>
          Loading member...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 16, 
      border: '1px solid #e5e7eb', 
      borderRadius: 8,
      backgroundColor: 'white'
    }}>
      <h3>{user?.full_name || 'Unknown Member'}</h3>
      <p>{user?.email || 'No email'}</p>
      <p>{user?.city || 'No location'}</p>
      {/* Safe gifting tags rendering */}
      {user?.gift_selections && Array.isArray(user.gift_selections) && 
        user.gift_selections.map((gift: string) => {
          const categoryInfo = getCategoryForTag(gift);
          return (
            <span 
              key={gift} 
              style={{
                backgroundColor: categoryInfo.bgColor,
                color: categoryInfo.color,
                border: `1px solid ${categoryInfo.borderColor}`,
                padding: '4px 8px',
                borderRadius: 9999,
                fontSize: 12,
                marginRight: '4px',
                marginBottom: '4px'
              }}
            >
              {gift}
            </span>
          );
        })
      }
    </div>
  );
};

// Helper function to get category info for a tag
const getCategoryForTag = (tag: string) => {
  // Ensure consistent fallback for hydration
  if (!tag || typeof tag !== 'string') {
    return {
      name: 'Unknown',
      color: '#6b7280',
      bgColor: '#f3f4f6',
      borderColor: '#d1d5db'
    };
  }

  for (const [categoryName, categoryInfo] of Object.entries(GIFTING_CATEGORIES)) {
    if (categoryInfo.tags.includes(tag)) {
      return { name: categoryName, ...categoryInfo };
    }
  }
  
  // Consistent fallback for unknown tags
  return {
    name: 'Other',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db'
  };
};

// Helper function to parse and prioritize user giftings
const parseUserGiftings = (giftSelections: any): string[] => {
  if (!giftSelections) return [];
  
  // Handle if it's already an array (JSONB array from database)
  if (Array.isArray(giftSelections)) {
    return giftSelections.filter(tag => typeof tag === 'string' && tag.length > 0);
  }
  
  // Handle if it's a string (legacy format or JSON string)
  if (typeof giftSelections === 'string') {
    try {
      const parsed = JSON.parse(giftSelections);
      if (Array.isArray(parsed)) {
        return parsed.filter(tag => typeof tag === 'string' && tag.length > 0);
      }
      // If parsed but not array, treat as single string
      return typeof parsed === 'string' ? [parsed] : [];
    } catch (error) {
      // Handle comma-separated string format
      return giftSelections.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
  }
  
  // Handle other types (numbers, objects, etc.)
  return [];
};

type Member = {
  id: string;
  full_name: string | null;
  email: string | null;
  city: string | null;
  gift_selections: string[] | string | null; // Can be JSONB array or string
  availability_level: string | null;
  age: number | null;
  phone: string | null;
  is_leader?: boolean;
};

type Need = {
  id: string;
  title: string;
  description: string;
  giftings_needed: string;
  people_needed: number;
  location: string;
  urgency: string;
  time_preference: string;
  status: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  created_by_email?: string;
  is_urgent?: boolean;
  date_time?: string;
};

type PendingMember = {
  id: string;
  role: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    gift_selections: string[];
  };
};

type Opportunity = {
  id: number;
  title: string;
  description: string;
  giftingsNeeded: string[];
  timeframe: string;
  location: string;
  urgent: boolean;
  participants: number;
  maxParticipants: number;
};

type Commitment = {
  id: number;
  title: string;
  date: string;
  location: string;
};

export default function Page() {
  const { user, profile, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'needs' | 'pending' | 'opportunities' | 'calendar' | 'feedback'>('overview');
  const [needsFilter, setNeedsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Check if Supabase connection is working
  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count');
      console.log('DB connection:', data, error);
    } catch (err) {
      console.error('DB error:', err);
    }
  };

  // Mock data for opportunities and commitments
  const opportunities: Opportunity[] = [
    {
      id: 1,
      title: "Community Meal Preparation",
      description: "Help prepare meals for families in need",
      giftingsNeeded: ["Hands-On Skills", "People & Relationships"],
      timeframe: "This Saturday 2-5pm",
      location: "Church Kitchen",
      urgent: false,
      participants: 8,
      maxParticipants: 12
    },
    {
      id: 2,
      title: "Youth Mentorship Program", 
      description: "Guide and encourage teenagers in their faith journey",
      giftingsNeeded: ["Learning & Teaching", "People & Relationships"],
      timeframe: "Ongoing - Weekly meetings",
      location: "Youth Center",
      urgent: true,
      participants: 3,
      maxParticipants: 6
    }
  ];

  const upcomingCommitments: Commitment[] = [
    { id: 1, title: "Meal delivery", date: "Tuesday 5pm", location: "Downtown area" },
    { id: 2, title: "Youth group assistance", date: "Wednesday 7pm", location: "Youth Center" }
  ];

  // Set client state to prevent hydration mismatch
  useEffect(() => {
    console.log('Leader page mounting...');
    setIsClient(true);
    // Test Supabase connection
    testConnection();
  }, []);

  // Clean data fetching pattern
  useEffect(() => {
    if (!authLoading && user && profile && profile?.full_name === 'Harmony Mitchell') {
      fetchProfiles().then(data => {
        setMembers(data || []);
        setProfilesLoading(false);
      }).catch(error => {
        console.error('Error fetching profiles:', error);
        setMembers([]);
        setProfilesLoading(false);
      });
    }
  }, [authLoading, user, profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      setMsg('Please sign in on Home first.');
      setLoading(false);
      return;
    }

    if (!authLoading && user && profile) {
      // Check if user is a leader (Harmony Mitchell)
      if (profile?.full_name !== 'Harmony Mitchell') {
        router.push('/dashboard');
        return;
      }

      // Load all data
      loadAllData();
      setLoading(false);
    }
  }, [authLoading, user, profile]);

  // Clean data fetching function
  const fetchProfiles = async (): Promise<Member[]> => {
    try {
      // Get current user's org_id first
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        console.warn('No current user found');
        return [];
      }
      
      // Get user's organization
      const { data: orgMember, error: orgError } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', currentUser.id)
        .single();
      
      if (orgError) {
        console.error('Supabase org_members query error:', orgError);
        setMsg(`Organization error: ${orgError.message}`);
        return [];
      }
      
      if (!orgMember) {
        console.warn('No organization found for user:', currentUser.id);
        setMsg('No organization found. Please contact an administrator.');
        return [];
      }
      
      // Load members from the same organization
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, city, gift_selections, availability_level, age, phone, is_leader')
        .eq('org_id', orgMember.org_id)
        .order('full_name', { ascending: true });
      
      if (pErr) { 
        console.error('Supabase profiles query error:', pErr);
        setMsg(`Load error: ${pErr.message}`); 
        return [];
      }
      
      // Add safety check for empty results
      const safeProfiles = profs || [];
      console.log('Real users from database:', safeProfiles);
      console.log('Number of profiles found:', safeProfiles.length);
      
      // Add sample gifting data for real users if they don't have any
      const membersWithGiftings = safeProfiles.map(member => {
        // If user doesn't have gift_selections, add sample data based on their name
        if (!member.gift_selections || (Array.isArray(member.gift_selections) && member.gift_selections.length === 0)) {
          let sampleGiftings = [];
          
          if (member.full_name?.includes('Brighton')) {
            sampleGiftings = ['Repairs', 'Gardening', 'Planning'];
          } else if (member.full_name?.includes('Harmony')) {
            sampleGiftings = ['Mentoring', 'Hosting', 'Encouragement'];
          } else if (member.full_name?.includes('New London')) {
            sampleGiftings = ['Music', 'Photography', 'Community Outreach'];
          } else if (member.full_name?.includes('Tester')) {
            sampleGiftings = ['Tech Support', 'Research', 'Administration'];
          } else {
            // Default sample giftings for any other users
            sampleGiftings = ['Teaching', 'Leadership', 'Organization'];
          }
          
          return {
            ...member,
            gift_selections: sampleGiftings // Store as array for JSONB
          };
        }
        return member;
      });
      
      // Add some test members with sample gift data
      const testMembers = [
        {
          id: 'test-1',
          full_name: 'Brighton Smith',
          email: 'brighton@example.com',
          city: 'Springfield',
          gift_selections: ['Teaching', 'Organization', 'Strategic Planning'], // Array format
          availability_level: ['Weekends', 'Evenings'],
          age: 28,
          phone: '555-0123',
          is_leader: false
        },
        {
          id: 'test-2',
          full_name: 'Harmony Mitchell',
          email: 'harmony@example.com',
          city: 'Springfield',
          gift_selections: ['Organization', 'Mentoring', 'Public Speaking', 'Strategic Planning'], // Array format
          availability_level: ['Weekdays', 'Mornings'],
          age: 35,
          phone: '555-0456',
          is_leader: true
        }
      ];
      
      const allMembers = [...membersWithGiftings, ...testMembers];
      console.log('All members with giftings:', allMembers);
      console.log('Total members to set:', allMembers.length);
      
      return allMembers;
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setMsg(`Error loading data: ${error}`);
      return [];
    }
  };

  const loadAllData = async () => {
    setProfilesLoading(true);
    
    try {
      const profilesData = await fetchProfiles();
      setMembers(profilesData || []);

      // Load needs (for MVP, we'll show empty array)
      setNeeds([]);

      // Load pending members (for MVP, we'll show empty array)
      setPendingMembers([]);
    } catch (error) {
      console.error('Error in loadAllData:', error);
      setMembers([]);
    } finally {
      setProfilesLoading(false);
    }
  };

  const approveNeed = async (needId: string) => {
    try {
      setMsg(`Need ${needId} approved! (This would trigger matching notifications)`);
      await loadAllData();
    } catch (error) {
      setMsg(`Error approving need: ${error}`);
    }
  };

  const rejectNeed = async (needId: string) => {
    try {
      setMsg(`Need ${needId} rejected.`);
      await loadAllData();
    } catch (error) {
      setMsg(`Error rejecting need: ${error}`);
    }
  };

  const approveMember = async (memberId: string) => {
    try {
      setMsg(`Member ${memberId} approved!`);
      await loadAllData();
    } catch (error) {
      setMsg(`Error approving member: ${error}`);
    }
  };

  const denyMember = async (memberId: string) => {
    try {
      setMsg(`Member ${memberId} denied.`);
      await loadAllData();
    } catch (error) {
      setMsg(`Error denying member: ${error}`);
    }
  };

  const filteredMembers = (members || []).filter(member => {
    // Safety check for member object
    if (!member) return false;
    
    // Text search
    const matchesSearch = !searchTerm || (
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(member.gift_selections) 
        ? member.gift_selections.some(gift => gift.toLowerCase().includes(searchTerm.toLowerCase()))
        : member.gift_selections?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // Tag filter
    const matchesTag = !selectedTag || (() => {
      if (Array.isArray(member.gift_selections)) {
        return member.gift_selections.includes(selectedTag);
      }
      const userGiftings = parseUserGiftings(member.gift_selections);
      return userGiftings.includes(selectedTag);
    })();
    
    return matchesSearch && matchesTag;
  });

  // Clean loading state pattern
  if (loading || profilesLoading) {
    console.log('Loading state:', { loading, profilesLoading, user: !!user, profile: !!profile });
    return (
      <ClientOnly>
        <div style={{ 
          padding: 40, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh'
        }}>
          <div style={{
            fontSize: '18px',
            color: '#6b7280',
            marginBottom: '16px'
          }}>
            {loading ? 'Loading dashboard...' : 'Loading members...'}
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #2dd4bf',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </ClientOnly>
    );
  }

  const sidebarStyle = {
    width: 250,
    backgroundColor: 'white',
    borderRight: '1px solid var(--gray-200)',
    height: '100vh',
    position: 'fixed' as const,
    left: 0,
    top: 0,
    padding: 0,
    boxShadow: 'var(--shadow-sm)'
  };

  const mainContentStyle = {
    marginLeft: 250,
    minHeight: '100vh',
    backgroundColor: '#FDFBF7'
  };

  const tabButtonStyle = (isActive: boolean) => ({
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    border: 'none',
    backgroundColor: isActive ? '#f0fdfa' : 'transparent',
    color: isActive ? '#2BB3A3' : 'var(--gray-600)',
    textAlign: 'left' as const,
    cursor: 'pointer',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    position: 'relative' as const,
    transition: 'all 0.2s ease',
    fontWeight: isActive ? 'var(--font-medium)' : 'var(--font-normal)'
  });

  console.log('Rendering leader page:', { user: !!user, profile: !!profile, loading, profilesLoading });
  
  return (
    <ClientOnly>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .members-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .members-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1025px) {
          .members-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', fontFamily: 'sans-serif' }}>
        {/* Sidebar */}
        <div style={sidebarStyle}>
          <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                backgroundColor: 'var(--brand-warm-600)', 
                borderRadius: 'var(--radius-md)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                fontSize: 'var(--text-xl)'
              }}>
                <Crown size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 'var(--text-xl)', color: 'var(--gray-900)' }}>Engage</h2>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>Leader Dashboard</p>
              </div>
            </div>
          </div>

          <div style={{ padding: 'var(--space-4)' }}>
            <button 
              style={tabButtonStyle(activeTab === 'overview')}
              onClick={() => setActiveTab('overview')}
            >
              <Home size={20} />
              Overview
            </button>
            <button 
              style={tabButtonStyle(activeTab === 'members')}
              onClick={() => setActiveTab('members')}
            >
              <Users size={20} />
              Members
            </button>
            <button 
              style={tabButtonStyle(activeTab === 'needs')}
              onClick={() => setActiveTab('needs')}
            >
              <ClipboardList size={20} />
              Needs
              {needs.filter(n => n.status === 'pending').length > 0 && (
                <span style={{ 
                  backgroundColor: '#FFD166', 
                  color: 'white', 
                  padding: '2px 6px', 
                  borderRadius: 10, 
                  fontSize: 12,
                  marginLeft: 'auto'
                }}>
                  {needs.filter(n => n.status === 'pending').length}
                </span>
              )}
            </button>
            <button 
              style={tabButtonStyle(activeTab === 'pending')}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={20} />
              Pending
              {pendingMembers.length > 0 && (
                <span style={{ 
                  backgroundColor: '#FFD166', 
                  color: 'white', 
                  padding: '2px 6px', 
                  borderRadius: 10, 
                  fontSize: 12,
                  marginLeft: 'auto'
                }}>
                  {pendingMembers.length}
                </span>
              )}
            </button>
            <button 
              style={tabButtonStyle(activeTab === 'opportunities')}
              onClick={() => setActiveTab('opportunities')}
            >
              <Heart size={20} />
              Opportunities
            </button>
            <button 
              style={tabButtonStyle(activeTab === 'calendar')}
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar size={20} />
              Calendar
            </button>
            <button 
              style={tabButtonStyle(activeTab === 'feedback')}
              onClick={() => setActiveTab('feedback')}
            >
              <MessageCircle size={20} />
              Feedback
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={mainContentStyle}>
          {/* Header */}
          <div style={{ 
            backgroundColor: 'white', 
            borderBottom: '1px solid var(--gray-200)', 
            padding: 'var(--space-6)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-2xl)', color: 'var(--gray-900)' }}>
                  {                   activeTab === 'overview' ? 'Leader Overview' : 
                   activeTab === 'members' ? 'Community Members' :
                   activeTab === 'needs' ? 'Needs Management' :
                   activeTab === 'pending' ? 'Pending Approvals' :
                   activeTab === 'opportunities' ? 'Service Opportunities' :
                   activeTab === 'calendar' ? 'My Calendar' :
                   'Community Feedback'}
                </h1>
                <p style={{ margin: 0, color: 'var(--gray-600)' }}>
                  {                   activeTab === 'overview' ? 'Welcome back, ' + ((profile as any)?.full_name || 'Leader') + '!' :
                   activeTab === 'members' ? 'Manage member profiles and giftings' :
                   activeTab === 'needs' ? 'Review and approve community needs' :
                   activeTab === 'pending' ? 'Review pending member and need approvals' :
                   activeTab === 'opportunities' ? 'View and manage service opportunities' :
                   activeTab === 'calendar' ? 'Your upcoming commitments and schedule' :
                   'View and manage community feedback'}
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                style={{ 
                  backgroundColor: '#f3f4f6', 
                  border: '1px solid var(--gray-300)', 
                  padding: '8px 16px', 
                  borderRadius: 6, 
                  cursor: 'pointer' 
                }}
              >
                ← Back to Home
              </button>
            </div>
          </div>

          <div style={{ padding: 'var(--space-6)' }}>
            {msg && (
              <div style={{ 
                padding: 'var(--space-4)', 
                backgroundColor: msg.includes('Error') ? 'var(--error-light)' : 'var(--info-light)',
                border: `1px solid ${msg.includes('Error') ? 'var(--error)' : 'var(--info)'}`,
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-6)',
                color: msg.includes('Error') ? 'var(--error)' : 'var(--info)'
              }}>
                {msg}
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* Community Health Stats */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: 'var(--space-6)', 
                  marginBottom: 'var(--space-6)' 
                }}>
                  <div style={{ 
                    backgroundColor: 'white', 
                    padding: 'var(--space-6)', 
                    borderRadius: 'var(--radius-lg)', 
                    border: '1px solid var(--gray-200)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        backgroundColor: 'transparent', 
                        borderRadius: 8, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Users size={20} color="#2dd4bf" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 18 }}>Active Members</h3>
                        <p style={{ margin: 0, fontSize: 14, color: '#666666' }}>Completed profiles</p>
                      </div>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#333333' }}>
                      {members.length}
                    </div>
                  </div>

                  <div style={{ 
                    backgroundColor: 'white', 
                    padding: 24, 
                    borderRadius: 8, 
                    border: '1px solid var(--gray-200)' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        backgroundColor: 'transparent', 
                        borderRadius: 8, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Clock size={20} color="#2dd4bf" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 18 }}>Pending Members</h3>
                        <p style={{ margin: 0, fontSize: 14, color: '#666666' }}>Awaiting approval</p>
                      </div>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#333333' }}>
                      {pendingMembers.length}
                    </div>
                  </div>

                  <div style={{ 
                    backgroundColor: 'white', 
                    padding: 24, 
                    borderRadius: 8, 
                    border: '1px solid var(--gray-200)' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        backgroundColor: 'transparent', 
                        borderRadius: 8, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <ClipboardList size={20} color="#2dd4bf" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 18 }}>Pending Needs</h3>
                        <p style={{ margin: 0, fontSize: 14, color: '#666666' }}>Awaiting approval</p>
                      </div>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#333333' }}>
                      {needs.filter(n => n.status === 'pending').length}
                    </div>
                  </div>
                </div>

                {/* Pending Alerts */}
                {(pendingMembers.length > 0 || needs.filter(n => n.status === 'pending').length > 0) && (
                  <div style={{ 
                    backgroundColor: '#fff7ed', 
                    border: '1px solid var(--brand-warm-600)', 
                    borderRadius: 8, 
                    padding: 16, 
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)'
                  }}>
                    <AlertTriangle size={24} />
                    <div>
                      <h3 style={{ margin: '0 0 4px', color: '#FFD166' }}>Pending Review</h3>
                      <p style={{ margin: '0 0 12px', color: '#FFD166' }}>
                        {pendingMembers.length} member requests and {needs.filter(n => n.status === 'pending').length} community needs waiting for approval
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {pendingMembers.length > 0 && (
                          <button 
                            onClick={() => setActiveTab('pending')}
                            style={{ 
                              backgroundColor: '#2dd4bf', 
                              color: 'white', 
                              border: 'none', 
                              padding: '6px 12px', 
                              borderRadius: 4, 
                              cursor: 'pointer' 
                            }}
                          >
                            Review Members ({pendingMembers.length})
                          </button>
                        )}
                        {needs.filter(n => n.status === 'pending').length > 0 && (
                          <button 
                            onClick={() => setActiveTab('needs')}
                            style={{ 
                              backgroundColor: '#2dd4bf', 
                              color: 'white', 
                              border: 'none', 
                              padding: '6px 12px', 
                              borderRadius: 4, 
                              cursor: 'pointer' 
                            }}
                          >
                            Review Needs ({needs.filter(n => n.status === 'pending').length})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Matching Opportunities */}
                <div style={{ 
                  backgroundColor: '#f8fafc', 
                  padding: 24, 
                  borderRadius: 12, 
                  border: '1px solid var(--gray-200)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ 
                    margin: '0 0 24px', 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    color: '#1f2937',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '12px'
                  }}>Opportunities Matching Your Gifts</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {opportunities.map(opp => (
                      <div key={opp.id} style={{ 
                        border: '1px solid var(--gray-200)', 
                        borderRadius: 12, 
                        padding: 20,
                        backgroundColor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s ease',
                        marginBottom: '8px',
                        cursor: 'pointer'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                          <h4 style={{ margin: 0, fontWeight: 500 }}>{opp.title}</h4>
                          {opp.urgent && (
                            <span style={{ 
                              backgroundColor: '#fef2f2', 
                              color: '#dc2626', 
                              padding: '4px 8px', 
                              borderRadius: 6, 
                              fontSize: 12,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: '1px solid #fecaca'
                            }}>
                              <AlertTriangle size={12} />
                              Urgent
                            </span>
                          )}
                        </div>
                        <p style={{ color: '#666666', fontSize: 14, margin: '0 0 12px' }}>{opp.description}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                          {opp.giftingsNeeded.map(gift => (
                            <span key={gift} style={{ 
                              backgroundColor: '#f0fdfa', 
                              color: 'var(--brand-primary-600)', 
                              padding: '4px 8px', 
                              borderRadius: 4, 
                              fontSize: 12 
                            }}>
                              {gift}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 14, color: '#666666' }}>
                            <CalendarDays size={16} /> {opp.timeframe} • <MapPin size={16} /> {opp.location}
                          </div>
                          <button style={{ 
                            backgroundColor: '#2dd4bf', 
                            color: 'white', 
                            border: 'none', 
                            padding: '8px 16px', 
                            borderRadius: 6, 
                            cursor: 'pointer',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <CheckCircle size={16} />
                            I Can Help
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Our Motivation */}
                <div style={{ 
                  backgroundColor: '#fff7ed', 
                  border: '1px solid var(--brand-warm-600)',
                  padding: 24, 
                  borderRadius: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--space-3)' }}>
                    <BookOpen size={24} />
                    <div>
                      <h3 style={{ margin: '0 0 8px', color: '#374151' }}>Our Motivation</h3>
                      <p style={{ color: '#374151', fontStyle: 'italic', margin: '0 0 8px' }}>
                        "Each of you should use whatever gift you have to serve others, as faithful stewards of God's grace."
                      </p>
                      <p style={{ color: '#374151', fontSize: 14, margin: 0 }}>- 1 Peter 4:10</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div style={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: 12, 
                padding: 24,
                minHeight: '100vh'
              }}>
                {/* Header with Search and Add Button */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 16,
                  marginBottom: 24
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16
                  }}>
                    <div>
                      <h2 style={{ 
                        margin: '0 0 8px', 
                        fontSize: '24px', 
                        fontWeight: '600', 
                        color: '#1f2937' 
                      }}>
                        Community Members
                      </h2>
                      {isClient && selectedTag && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8,
                          marginTop: 4
                        }} suppressHydrationWarning={true}>
                          <span style={{ 
                            fontSize: '14px', 
                            color: '#6b7280' 
                          }}>
                            Filtered by:
                          </span>
                          <span style={{
                            backgroundColor: getCategoryForTag(selectedTag)?.bgColor || '#f3f4f6',
                            color: getCategoryForTag(selectedTag)?.color || '#6b7280',
                            border: `1px solid ${getCategoryForTag(selectedTag)?.borderColor || '#e5e7eb'}`,
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: '12px',
                            fontWeight: '500'
                          }} suppressHydrationWarning={true}>
                            {selectedTag}
                          </span>
                          <button
                            onClick={() => setSelectedTag(null)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#6b7280',
                              cursor: 'pointer',
                              padding: '2px',
                              borderRadius: 4,
                              fontSize: '14px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    <button style={{
                      backgroundColor: '#2dd4bf',
                      color: 'white',
                      border: 'none',
                      padding: '12px 20px',
                borderRadius: 8, 
                      cursor: 'pointer',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease'
                    }}>
                      <Plus size={16} />
                      Add Members
                    </button>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search by name, location, or gifting..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      width: '100%', 
                        padding: '12px 16px 12px 40px', 
                        border: '1px solid #e5e7eb', 
                      borderRadius: 8,
                        fontSize: 16,
                        backgroundColor: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }}>
                      <User size={16} />
                    </div>
                  </div>
                </div>

                {/* Members Grid */}
                <div className="members-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: 20
                }}>
                  {filteredMembers && filteredMembers.length > 0 && 
                    filteredMembers.map((member) => member && (
                      <div key={member.id} style={{ 
                        backgroundColor: 'white',
                        borderRadius: 12, 
                        padding: 20,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}>
                      {/* Profile Photo */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: 16
                      }}>
                        <div style={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          backgroundColor: '#2dd4bf',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '32px',
                          fontWeight: '600',
                          boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)'
                        }}>
                          {member?.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
                        </div>
                      </div>

                      {/* Name */}
                      <h3 style={{ 
                        margin: '0 0 12px', 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: '#1f2937',
                        textAlign: 'center'
                      }}>
                        {member.full_name || 'Unknown Member'}
                      </h3>

                      {/* Contact Info */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 8, 
                        marginBottom: 16 
                      }}>
                        {member?.email && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8,
                            fontSize: '14px',
                            color: '#6b7280'
                          }}>
                            <Mail size={14} />
                                    <span style={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap' 
                            }}>
                              {member.email}
                                    </span>
                            </div>
                        )}
                        
                        {member?.city && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8,
                            fontSize: '14px',
                            color: '#6b7280'
                          }}>
                            <MapPin size={14} />
                            <span>{member.city}</span>
                            </div>
                        )}
                          </div>

                      {/* Gifting Tags */}
                      {isClient && member?.gift_selections && Array.isArray(member.gift_selections) && member.gift_selections.length > 0 && (
                        <div style={{ marginBottom: 16 }} suppressHydrationWarning={true}>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            justifyContent: 'center'
                          }}>
                            {member.gift_selections.slice(0, 4).map((gift: string) => {
                              const categoryInfo = getCategoryForTag(gift);
                              
                              return (
                                <span 
                                  key={gift}
                                  onClick={() => setSelectedTag(selectedTag === gift ? null : gift)}
                                  style={{ 
                                    backgroundColor: categoryInfo.bgColor,
                                    color: categoryInfo.color,
                                    border: `1px solid ${categoryInfo.borderColor}`,
                                    padding: '4px 8px', // px-2 py-1 equivalent
                                    borderRadius: 9999, // rounded-full
                                    fontSize: 12, // text-xs
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    lineHeight: '1.2',
                                    marginRight: '4px', // mr-1
                                    marginBottom: '4px', // mb-1
                                    opacity: selectedTag && selectedTag !== gift ? 0.5 : 1,
                                    transform: selectedTag === gift ? 'scale(1.05)' : 'scale(1)',
                                    boxShadow: selectedTag === gift ? `0 2px 4px ${categoryInfo.color}20` : 'none'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!selectedTag || selectedTag === gift) {
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                      e.currentTarget.style.boxShadow = `0 2px 4px ${categoryInfo.color}20`;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (selectedTag !== gift) {
                                      e.currentTarget.style.transform = 'scale(1)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }
                                  }}
                                  suppressHydrationWarning={true}
                                >
                                  {gift}
                                </span>
                              );
                            })}
                            {member.gift_selections.length > 4 && (
                              <span 
                                style={{ 
                            backgroundColor: '#f3f4f6', 
                                  color: '#6b7280', 
                                  padding: '4px 8px', 
                                  borderRadius: 6, 
                                  fontSize: 11,
                                  fontWeight: '500',
                                  lineHeight: '1.2'
                                }}
                                suppressHydrationWarning={true}
                              >
                                +{member.gift_selections.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        marginBottom: 16 
                      }}>
                        <span style={{
                          backgroundColor: '#d1fae5',
                          color: '#065f46',
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          Active Member
                        </span>
                      </div>

                      {/* View Profile Button */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        marginTop: 16 
                      }}>
                        <button 
                          onClick={() => {
                            setSelectedMember(member);
                            setShowMemberProfile(true);
                          }}
                          style={{ 
                            width: '100%',
                            backgroundColor: '#f8fafc', 
                            border: '1px solid #e5e7eb', 
                            padding: '10px 16px', 
                            borderRadius: 8, 
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Eye size={14} />
                          View Profile
                        </button>
                      </div>
                    </div>
                    ))
                  )}

                {/* Empty State */}
                {(!filteredMembers || filteredMembers.length === 0) && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 60, 
                    backgroundColor: 'white', 
                    borderRadius: 12,
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      color: '#9ca3af'
                    }}>
                      <Users size={32} />
                  </div>
                    <h3 style={{ color: '#374151', marginBottom: 8, fontSize: '18px' }}>No members found</h3>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                      {searchTerm ? 'Try adjusting your search terms' : 'Start by adding community members'}
                    </p>
                </div>
                )}
                </div>
              </div>
            )}

            {/* Needs Tab */}
            {activeTab === 'needs' && (
              <>
                <p style={{ color: '#666', marginBottom: 24 }}>
                  Review and approve needs submitted by community members
                </p>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setNeedsFilter(filterType)}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 6,
                        backgroundColor: needsFilter === filterType ? '#FFD166' : 'white',
                        color: needsFilter === filterType ? 'white' : '#374151',
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {filterType}
                    </button>
                  ))}
                </div>

                {/* Needs List */}
                {needs.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 40, 
                    backgroundColor: '#f9fafb', 
                    borderRadius: 8,
                    border: '1px solid var(--gray-200)'
                  }}>
                    <h3 style={{ color: '#666666', marginBottom: 8 }}>No needs found</h3>
                    <p style={{ color: '#9ca3af', margin: 0 }}>
                      {needsFilter === 'pending' 
                        ? 'No pending needs to review. Check the browser console for submitted needs.'
                        : `No ${needsFilter} needs found.`
                      }
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {needs.map((need) => (
                      <div key={need.id} style={{
                        border: '1px solid var(--gray-200)',
                        borderRadius: 8,
                        padding: 20,
                        backgroundColor: 'white'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
                              {need.title}
                            </h3>
                            <p style={{ margin: '0 0 8px', color: '#666666', fontSize: 14 }}>
                              By: {need.created_by_name || 'Unknown'} ({need.created_by_email || 'No email'})
                            </p>
                            <p style={{ margin: '0 0 8px', color: '#666666', fontSize: 14 }}>
                              Submitted: {new Date(need.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 500,
                            backgroundColor: need.status === 'pending' ? '#fef3c7' : 
                                           need.status === 'approved' ? '#d1fae5' : '#fff5f5',
                            color: need.status === 'pending' ? '#FFD166' : 
                                   need.status === 'approved' ? '#065f46' : '#FF6B6B'
                          }}>
                            {need.status.toUpperCase()}
                          </div>
                        </div>

                        <p style={{ margin: '0 0 12px', lineHeight: 1.5 }}>
                          {need.description}
                        </p>

                        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, color: '#666666' }}>
                            <strong>Gifts needed:</strong> {need.giftings_needed}
                          </span>
                          <span style={{ fontSize: 14, color: '#666666' }}>
                            <strong>People needed:</strong> {need.people_needed}
                          </span>
                          <span style={{ fontSize: 14, color: '#666666' }}>
                            <strong>Location:</strong> {need.location}
                          </span>
                          <span style={{ fontSize: 14, color: '#666666' }}>
                            <strong>Urgency:</strong> {need.urgency}
                          </span>
                        </div>

                        {need.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => approveNeed(need.id)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: 500
                              }}
                            >
                              <CheckCircle size={16} style={{ marginRight: '4px' }} /> Approve
                            </button>
                            <button
                              onClick={() => rejectNeed(need.id)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#2BB3A3',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: 500
                              }}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Instructions for MVP */}
                <div style={{ 
                  marginTop: 40, 
                  padding: 20, 
                  backgroundColor: '#f0f9ff', 
                  border: '1px solid var(--info-light)',
                  borderRadius: 8
                }}>
                  <h3 style={{ margin: '0 0 12px', color: '#0369a1' }}>MVP Instructions</h3>
                  <p style={{ margin: '0 0 8px', color: '#0369a1' }}>
                    Since the needs table doesn't exist yet, submitted needs are logged to the browser console.
                  </p>
                  <p style={{ margin: '0 0 8px', color: '#0369a1' }}>
                    To view submitted needs:
                  </p>
                  <ol style={{ margin: '0 0 8px', color: '#0369a1', paddingLeft: 20 }}>
                    <li>Open browser developer tools (F12)</li>
                    <li>Go to the Console tab</li>
                    <li>Look for "Need submission data" logs</li>
                  </ol>
                  <p style={{ margin: 0, color: '#0369a1' }}>
                    Once the needs table is created, this page will automatically display all submitted needs.
                  </p>
                </div>
              </>
            )}

            {/* Pending Tab */}
            {activeTab === 'pending' && (
              <div>
                <h3>Pending Member Approvals</h3>
                {pendingMembers.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 40, 
                    backgroundColor: '#f9fafb', 
                    borderRadius: 8,
                    border: '1px solid var(--gray-200)'
                  }}>
                    <h3 style={{ color: '#666666', marginBottom: 8 }}>No pending members</h3>
                    <p style={{ color: '#9ca3af', margin: 0 }}>
                      No member requests awaiting approval at this time.
                    </p>
                  </div>
                ) : (
                  pendingMembers.map(member => (
                    <div key={member.id} style={{ border: '1px solid var(--gray-200)', padding: 16, margin: '8px 0', borderRadius: 8 }}>
                      <h4>{member.profiles?.full_name || 'Name not provided'}</h4>
                      <p>Email: {member.profiles?.email}</p>
                      <p>Requested Role: {member.role}</p>
                      <p>Applied: {new Date(member.created_at).toLocaleDateString()}</p>
                      <div style={{ marginTop: 12 }}>
                        <button 
                          onClick={() => approveMember(member.id)}
                          style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, marginRight: 8, cursor: 'pointer' }}
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => denyMember(member.id)}
                          style={{ backgroundColor: '#2BB3A3', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Opportunities Tab */}
            {activeTab === 'opportunities' && (
              <div style={{ 
                backgroundColor: 'white', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid var(--gray-200)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ margin: 0, flex: 1 }}>All Service Opportunities</h2>
                  <div style={{ display: 'flex', gap: 16, marginLeft: 40 }}>
                    <button 
                      onClick={() => window.location.href = '/opportunities'}
                      style={{
                        backgroundColor: '#FFD166',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 500,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      View All Opportunities
                    </button>
                    <button 
                      onClick={() => window.location.href = '/share-need'}
                      style={{
                        backgroundColor: '#2BB3A3',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 500,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Share a New Need
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {opportunities.map(opp => (
                    <div key={opp.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 8, 
                      padding: 20
                    }}>
                      <h3 style={{ margin: '0 0 8px' }}>{opp.title}</h3>
                      <p style={{ color: '#666666', margin: '0 0 12px' }}>{opp.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 14, color: '#666666' }}>
                          <Users size={16} style={{ marginRight: '4px' }} /> {opp.participants}/{opp.maxParticipants} signed up
                        </div>
                        <button style={{ 
                          backgroundColor: '#FFD166', 
                          color: 'white', 
                          border: 'none', 
                          padding: '10px 20px', 
                          borderRadius: 6, 
                          cursor: 'pointer',
                          fontWeight: 500
                        }}>
                          Join This Opportunity
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div style={{ 
                backgroundColor: 'white', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid var(--gray-200)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ margin: '0 0 20px' }}>Upcoming Commitments</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {upcomingCommitments.map(commitment => (
                    <div key={commitment.id} style={{ 
                      backgroundColor: '#f0fdfa', 
                      padding: 16, 
                      borderRadius: 8 
                    }}>
                      <h4 style={{ margin: '0 0 4px', color: 'var(--brand-primary-600)' }}>{commitment.title}</h4>
                      <p style={{ margin: '0 0 4px', fontSize: 14, color: 'var(--brand-primary-600)' }}>
                        ⏰ {commitment.date}
                      </p>
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--brand-primary-600)' }}>
                        📍 {commitment.location}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div style={{ 
                backgroundColor: 'white', 
                padding: 48, 
                borderRadius: 8, 
                border: '1px solid var(--gray-200)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>📊</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Analytics Coming Soon</h3>
                <p style={{ margin: 0, color: '#666666' }}>
                  Detailed analytics and reporting features will be available in a future update.
                </p>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div style={{ 
                backgroundColor: 'white', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid var(--gray-200)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ margin: 0 }}>Community Feedback</h2>
                  <button 
                    onClick={() => setShowFeedbackModal(true)}
                    style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    + Submit Feedback
                  </button>
                </div>
            <FeedbackList />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      {/* Floating Feedback Button */}
      <FeedbackButton onClick={() => setShowFeedbackModal(true)} />

      {/* Member Profile Modal */}
      {showMemberProfile && selectedMember && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: 24,
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                Member Profile
              </h2>
              <button
                onClick={() => {
                  setShowMemberProfile(false);
                  setSelectedMember(null);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 6,
                  color: '#6b7280',
                  fontSize: '20px'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: 24 }}>
              {/* Profile Header */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: 32
              }}>
                <div style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  backgroundColor: '#2dd4bf',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '48px',
                  fontWeight: '600',
                  marginBottom: 16,
                  boxShadow: '0 8px 25px rgba(45, 212, 191, 0.3)'
                }}>
                  {selectedMember.full_name ? selectedMember.full_name.charAt(0).toUpperCase() : '?'}
                </div>
                <h3 style={{
                  margin: '0 0 8px',
                  fontSize: '28px',
                  fontWeight: '600',
                  color: '#1f2937',
                  textAlign: 'center'
                }}>
                  {selectedMember.full_name || 'Unknown Member'}
                </h3>
                <div style={{
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Active Member
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{
                  margin: '0 0 16px',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: 8
                }}>
                  Contact Information
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedMember.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: '#f0fdfa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2dd4bf'
                      }}>
                        <Mail size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: 2 }}>Email</div>
                        <div style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>
                          {selectedMember.email}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedMember.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: '#f0fdfa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2dd4bf'
                      }}>
                        <User size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: 2 }}>Phone</div>
                        <div style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>
                          {selectedMember.phone}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMember.city && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: '#f0fdfa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2dd4bf'
                      }}>
                        <MapPin size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: 2 }}>Location</div>
                        <div style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>
                          {selectedMember.city}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMember.age && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: '#f0fdfa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2dd4bf'
                      }}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: 2 }}>Age</div>
                        <div style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>
                          {selectedMember.age} years old
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Gifts & Skills */}
              {isClient && selectedMember.gift_selections && Array.isArray(selectedMember.gift_selections) && selectedMember.gift_selections.length > 0 && (
                <div style={{ marginBottom: 32 }} suppressHydrationWarning={true}>
                  <h4 style={{
                    margin: '0 0 16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: 8
                  }}>
                    Gifts & Skills
                  </h4>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 12 
                  }}>
                    {selectedMember.gift_selections.map((gift: string) => {
                      const categoryInfo = getCategoryForTag(gift);
                      
                      return (
                        <span 
                          key={gift} 
                          style={{ 
                            backgroundColor: categoryInfo.bgColor,
                            color: categoryInfo.color,
                            border: `1px solid ${categoryInfo.borderColor}`,
                            padding: '6px 12px', 
                            borderRadius: 9999, // rounded-full
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            marginRight: '8px',
                            marginBottom: '8px'
                          }}
                          suppressHydrationWarning={true}
                        >
                          {gift}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Availability */}
              {selectedMember.availability_level && (
                <div style={{ marginBottom: 32 }}>
                  <h4 style={{
                    margin: '0 0 16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: 8
                  }}>
                    Availability
                  </h4>
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '16px', color: '#1f2937' }}>
                      {(() => {
                        try {
                          const availability = JSON.parse(selectedMember.availability_level);
                          return Array.isArray(availability) ? availability.join(', ') : selectedMember.availability_level;
                        } catch (error) {
                          return selectedMember.availability_level;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                marginTop: 32
              }}>
                <button style={{
                  backgroundColor: '#2dd4bf',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Mail size={16} />
                  Send Message
                </button>
                <button style={{
                  backgroundColor: '#f8fafc',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  padding: '12px 24px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <User size={16} />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </ClientOnly>
  );
}