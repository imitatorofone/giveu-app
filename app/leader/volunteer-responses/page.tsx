'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser as supabase } from '../../../lib/supabaseBrowser';
import Footer from '../../../components/Footer';
import NotificationDropdown from '../../../components/NotificationDropdown';
import { 
  UserCheck, CheckCircle, ArrowLeft, Mail, Phone, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BRAND } from '../../../lib/brandConfig';

interface VolunteerResponse {
  id: string;
  need_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  cancelled_at?: string;
  need: {
    id: string;
    title: string;
    description: string;
  };
  volunteer: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    gift_selections: string[];
  };
}

export default function VolunteerResponsesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<VolunteerResponse[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'cancelled'>('all');
  const [tableError, setTableError] = useState<boolean>(false);
  const [userChurchCode, setUserChurchCode] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  // 🔥 CRITICAL FIX: Watch userChurchCode and fetch responses when it's available
  useEffect(() => {
    console.log('🔄 userChurchCode changed:', userChurchCode);
    if (userChurchCode) {
      console.log('📡 Fetching volunteer responses for church:', userChurchCode);
      loadVolunteerResponses();
    }
  }, [userChurchCode]);

  const checkAuthAndLoadData = async () => {
    try {
      // 🚀 PERFORMANCE: Check cache first
      const cachedChurchCode = sessionStorage.getItem('user_church_code');
      const cachedIsLeader = sessionStorage.getItem('user_is_leader');
      
      if (cachedChurchCode && cachedIsLeader === 'true') {
        console.log('🚀 Using cached church code:', cachedChurchCode);
        setUserChurchCode(cachedChurchCode);
        setLoading(false);
        return; // ✅ Skip profile query!
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth');
        return;
      }

      // Check if user is a leader
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, church_code')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('Profile error:', profileError);
        router.push('/dashboard');
        return;
      }

      const isLeader = profileData.role === 'leader' || profileData.role === 'admin';
      if (!isLeader) {
        router.push('/dashboard');
        return;
      }

      // Verify church_code exists
      if (!profileData?.church_code) {
        console.error('Leader has no church_code assigned');
        toast.error('Unable to load church information');
        return;
      }

      // 🚀 PERFORMANCE: Cache for future page loads
      sessionStorage.setItem('user_church_code', profileData.church_code);
      sessionStorage.setItem('user_is_leader', 'true');

      // Store church code for filtering
      console.log('📝 Setting userChurchCode from profile:', profileData.church_code);
      setUserChurchCode(profileData.church_code);

    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const loadVolunteerResponses = async () => {
    try {
      console.log('🔍 loadVolunteerResponses called with userChurchCode:', userChurchCode);
      
      // Don't fetch if we don't have church_code yet
      if (!userChurchCode) {
        console.log('❌ No userChurchCode, skipping fetch');
        return;
      }

      console.log('📊 Querying opportunity_responses table with filters:');
      console.log('  - church_code (via needs relationship):', userChurchCode);

      // Try to load from opportunity_responses table
      // Filter by needs that belong to this church
      const { data, error } = await supabase
        .from('opportunity_responses')
        .select(`
          *,
          need:needs!inner(id, title, description, church_code),
          volunteer:profiles(id, full_name, email, phone, gift_selections)
        `)
        .eq('need.church_code', userChurchCode) // 🔥 CRITICAL: Filter by church through needs relationship
        .order('created_at', { ascending: false });

      console.log('📊 Query result:', { data, error });
      console.log('📊 Number of volunteer responses found:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📋 Volunteer responses details:', data.map(response => ({
          id: response.id,
          need_id: response.need_id,
          user_id: response.user_id,
          status: response.status,
          created_at: response.created_at,
          need: response.need,
          volunteer: response.volunteer
        })));
      }

      if (error) {
        console.error('❌ Query error:', error);
        console.warn('Table might not exist or query failed:', error);
        setTableError(true);
        return;
      }

      console.log('✅ Setting responses state with', data?.length || 0, 'items');
      setResponses((data || []) as any);
    } catch (error) {
      console.error('❌ Error loading responses:', error);
      setTableError(true);
    }
  };

  function getInitials(name: string) {
    if (!name) return 'V';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  const filteredResponses = filter === 'all' 
    ? responses 
    : responses.filter(r => r.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading volunteer responses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: BRAND.colors.background }}>
      {/* Integrated Header with Back Button */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back button integrated on left */}
          <button 
            onClick={() => router.push('/leader/tools')}
            className="flex items-center gap-2 text-gray-700 transition-colors active:opacity-70"
            style={{ minWidth: '60px', minHeight: '44px' }}
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium" style={{ fontFamily: BRAND.fonts.heading }}>Tools</span>
          </button>
          
          {/* Centered logo */}
          <button
            onClick={() => router.push('/dashboard')}
            className="active:scale-95 transition-transform"
            style={{ 
              fontWeight: '700', 
              fontSize: '20px', 
              color: 'white',
              fontFamily: BRAND.fonts.heading,
              backgroundColor: BRAND.colors.primary,
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            giveU
          </button>
          
          {/* Notification bell on right */}
          <NotificationDropdown />
        </div>
      </header>

      {/* Page Title */}
      <div className="px-4 pt-6 pb-4 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: BRAND.fonts.heading }}>
          Volunteer Responses
        </h1>
        <p className="text-gray-600 text-base" style={{ fontFamily: BRAND.fonts.body }}>
          Monitor volunteer commitments. New volunteers are auto-accepted.
        </p>
      </div>

      {/* Filter Pills */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[
            { key: 'all', label: 'All Responses' },
            { key: 'pending', label: 'Pending' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'declined', label: 'Declined' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className="px-5 py-2 rounded-full whitespace-nowrap font-medium transition-colors active:scale-95"
              style={{
                backgroundColor: filter === filterOption.key ? BRAND.colors.primary : '#f3f4f6',
                color: filter === filterOption.key ? 'white' : '#374151',
                fontFamily: BRAND.fonts.heading,
                minHeight: '40px',
                fontSize: '14px'
              }}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Responses List */}
      <div className="px-4 pt-4">
        {(() => {
          console.log('🎨 Rendering responses - filteredResponses.length:', filteredResponses.length);
          console.log('🎨 responses data:', responses);
          console.log('🎨 userChurchCode:', userChurchCode);
          console.log('🎨 loading:', loading);
          console.log('🎨 tableError:', tableError);
          console.log('🎨 filter:', filter);
          return tableError;
        })() ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p style={{ 
              color: BRAND.colors.textLight, 
              fontFamily: BRAND.fonts.body 
            }}>
              Volunteer responses feature is not yet available. Table needs to be set up.
            </p>
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <UserCheck size={48} style={{ 
              color: BRAND.colors.primary,
              margin: '0 auto 16px'
            }} />
            <h3 className="text-xl font-semibold mb-2" style={{ 
              fontFamily: BRAND.fonts.heading,
              color: BRAND.colors.text
            }}>
              No Responses Yet
            </h3>
            <p style={{ 
              color: BRAND.colors.textLight,
              fontFamily: BRAND.fonts.body
            }}>
              When members respond to needs, you'll see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResponses.map((response) => {
              if (!response.volunteer || !response.need) {
                return null;
              }
              
              return (
                <div key={response.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                  {/* Person Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: BRAND.colors.primary }}
                    >
                      {getInitials(response.volunteer.full_name)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900" style={{ fontFamily: BRAND.fonts.heading }}>
                        {response.volunteer.full_name}
                      </h3>
                      <p className="text-sm text-gray-600" style={{ fontFamily: BRAND.fonts.body }}>
                        {response.status === 'cancelled' && response.cancelled_at
                          ? `Cancelled on ${formatDate(response.cancelled_at)}`
                          : `Responded ${formatDate(response.created_at)}`
                        }
                      </p>
                    </div>
                    
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full
                      ${response.status === 'accepted' ? 'bg-green-100' : 
                        response.status === 'pending' ? 'bg-yellow-100' : 
                        response.status === 'cancelled' ? 'bg-gray-100' :
                        'bg-red-100'
                      }`}
                    >
                      <CheckCircle size={16} style={{
                        color: response.status === 'accepted' ? '#16a34a' :
                               response.status === 'pending' ? '#ca8a04' :
                               response.status === 'cancelled' ? '#6b7280' :
                               '#dc2626'
                      }} />
                      <span className={`text-xs font-medium capitalize
                        ${response.status === 'accepted' ? 'text-green-800' :
                          response.status === 'pending' ? 'text-yellow-800' :
                          response.status === 'cancelled' ? 'text-gray-800' :
                          'text-red-800'
                        }`}
                        style={{ fontFamily: BRAND.fonts.heading }}
                      >
                        {response.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Need Title */}
                  <h4 className="font-semibold text-gray-900 mb-3" style={{ fontFamily: BRAND.fonts.heading }}>
                    {response.need.title}
                  </h4>
                  
                  {/* Contact Info */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: BRAND.fonts.heading }}>
                      Contact Information
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={16} className="flex-shrink-0" />
                        <span className="truncate" style={{ fontFamily: BRAND.fonts.body }}>
                          {response.volunteer.email}
                        </span>
                      </div>
                      {response.volunteer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={16} className="flex-shrink-0" />
                          <span style={{ fontFamily: BRAND.fonts.body }}>
                            {response.volunteer.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Matching Gifts */}
                  {response.volunteer.gift_selections && response.volunteer.gift_selections.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-gray-700" />
                        <span className="text-sm font-medium text-gray-700" style={{ fontFamily: BRAND.fonts.heading }}>
                          Matching Gifts
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {response.volunteer.gift_selections.slice(0, 3).map(gift => (
                          <span 
                            key={gift}
                            className="px-3 py-1 text-white rounded-full text-sm font-medium"
                            style={{ 
                              backgroundColor: BRAND.colors.primary,
                              fontFamily: BRAND.fonts.heading
                            }}
                          >
                            {gift}
                          </span>
                        ))}
                        {response.volunteer.gift_selections.length > 3 && (
                          <button 
                            className="text-sm font-medium"
                            style={{ 
                              color: BRAND.colors.primary,
                              fontFamily: BRAND.fonts.heading
                            }}
                          >
                            +{response.volunteer.gift_selections.length - 3} more
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
