'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser as supabase } from '../../../lib/supabaseBrowser';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { 
  UserCheck, Clock, CheckCircle, XCircle, Filter, 
  Calendar, MapPin, Users, Mail, Phone, Wrench 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Brand typography
const quicksandFont = 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif';

interface VolunteerResponse {
  id: string;
  need_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  need: {
    id: string;
    title: string;
    description: string;
    start_at: string;
    end_at: string;
    address: string;
    city: string;
    state: string;
    giftings_needed: string[];
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [actingId, setActingId] = useState<string | null>(null);
  const [tableError, setTableError] = useState<boolean>(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
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

      // Load volunteer responses
      await loadVolunteerResponses();

    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const loadVolunteerResponses = async () => {
    try {
      console.log('[VolunteerResponses] Loading volunteer responses...');
      
      // First, let's test if the table exists with a simple query
      console.log('[VolunteerResponses] Testing table existence...');
      const { data: testData, error: testError } = await supabase
        .from('opportunity_responses')
        .select('id')
        .limit(1);
      
      console.log('[VolunteerResponses] Test query result:', { testData, testError });
      
      if (testError) {
        console.error('[VolunteerResponses] Table test failed:', testError);
        if (testError.code === '42P01') {
          toast.error('Database table not found. Please run the SQL setup script first.');
          setTableError(true);
          return;
        }
      }
      
      console.log('[VolunteerResponses] Table exists, proceeding with simplified query...');
      
      // First, get the opportunity responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('opportunity_responses')
        .select('id, need_id, user_id, status, created_at')
        .order('created_at', { ascending: false });

      if (responsesError) {
        console.error('[VolunteerResponses] Error loading responses:', responsesError);
        toast.error(`Failed to load volunteer responses: ${responsesError.message}`);
        return;
      }

      console.log('[VolunteerResponses] Loaded responses:', responsesData?.length || 0);

      if (!responsesData || responsesData.length === 0) {
        setResponses([]);
        return;
      }

      // Get unique need IDs and user IDs, filtering out invalid UUIDs
      const validNeedIds = responsesData
        .map(r => r.need_id)
        .filter(id => {
          // Check if it's a valid UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(id);
        });
      
      const needIds = [...new Set(validNeedIds)];
      const userIds = [...new Set(responsesData.map(r => r.user_id))];

      console.log('[VolunteerResponses] Valid need IDs:', needIds);
      console.log('[VolunteerResponses] Invalid need IDs filtered out:', responsesData.map(r => r.need_id).filter(id => !needIds.includes(id)));
      console.log('[VolunteerResponses] Fetching profiles for IDs:', userIds);

      let needsData = [];
      let allNeedsData = [];

      // Only fetch needs if we have valid UUIDs
      if (needIds.length > 0) {
        // Fetch needs data - let's first check what columns exist
        console.log('[VolunteerResponses] Checking needs table structure...');
        const { data: needsDataResult, error: needsError } = await supabase
          .from('needs')
          .select('*')
          .in('id', needIds)
          .limit(1);

        if (needsError) {
          console.error('[VolunteerResponses] Error loading needs:', needsError);
          toast.error(`Failed to load needs data: ${needsError.message}`);
          return;
        }

        console.log('[VolunteerResponses] Needs table structure:', needsDataResult?.[0] ? Object.keys(needsDataResult[0]) : 'No data');
        
        // Now fetch all needs with the correct columns
        const { data: allNeedsDataResult, error: allNeedsError } = await supabase
          .from('needs')
          .select('*')
          .in('id', needIds);

        if (allNeedsError) {
          console.error('[VolunteerResponses] Error loading all needs:', allNeedsError);
          toast.error(`Failed to load needs data: ${allNeedsError.message}`);
          return;
        }

        needsData = needsDataResult || [];
        allNeedsData = allNeedsDataResult || [];
      } else {
        console.log('[VolunteerResponses] No valid need IDs found, skipping needs fetch');
      }

      // Fetch profiles data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, gift_selections')
        .in('id', userIds);

      if (profilesError) {
        console.error('[VolunteerResponses] Error loading profiles:', profilesError);
        toast.error(`Failed to load volunteer profiles: ${profilesError.message}`);
        return;
      }

      // Combine the data
      const combinedData = responsesData.map(response => {
        const need = allNeedsData?.find(n => n.id === response.need_id);
        const volunteer = profilesData?.find(p => p.id === response.user_id);
        
        return {
          ...response,
          need: need || { id: response.need_id, title: 'Unknown Need', description: '', start_at: '', end_at: '', address: '', city: '', state: '', giftings_needed: [] },
          volunteer: volunteer || { id: response.user_id, full_name: 'Unknown Volunteer', email: '', phone: '', gift_selections: [] }
        };
      });

      console.log('[VolunteerResponses] Combined data:', combinedData.length);
      setResponses(combinedData);

    } catch (error) {
      console.error('[VolunteerResponses] Error:', error);
      toast.error('Failed to load volunteer responses');
    }
  };

  const handleAccept = async (responseId: string) => {
    console.log('[VolunteerResponses] Accepting response:', responseId);
    setActingId(responseId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('[VolunteerResponses] Session user ID:', session?.user?.id);
      console.log('[VolunteerResponses] Update data:', {
        status: 'accepted'
      });
      
      const { data, error } = await supabase
        .from('opportunity_responses')
        .update({ 
          status: 'accepted'
        })
        .eq('id', responseId)
        .select();

      if (error) {
        console.error('[VolunteerResponses] Error accepting response:', error);
        console.error('[VolunteerResponses] Error type:', typeof error);
        console.error('[VolunteerResponses] Error keys:', Object.keys(error));
        console.error('[VolunteerResponses] Error stringified:', JSON.stringify(error, null, 2));
        
        const errorMessage = error?.message || 'Unknown error occurred';
        const errorCode = error?.code || 'UNKNOWN';
        
        console.error('[VolunteerResponses] Parsed accept error:', {
          message: errorMessage,
          code: errorCode,
          details: error?.details,
          hint: error?.hint
        });
        
        toast.error(`Failed to accept volunteer response: ${errorMessage}`);
        return;
      }

      console.log('[VolunteerResponses] Accept successful, updated data:', data);
      toast.success('Volunteer response accepted');
      await loadVolunteerResponses(); // Refresh data

    } catch (error) {
      console.error('[VolunteerResponses] Error:', error);
      toast.error('Failed to accept volunteer response');
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (responseId: string) => {
    console.log('[VolunteerResponses] Declining response:', responseId);
    setActingId(responseId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase
        .from('opportunity_responses')
        .update({ 
          status: 'declined'
        })
        .eq('id', responseId)
        .select();

      if (error) {
        console.error('[VolunteerResponses] Error declining response:', error);
        console.error('[VolunteerResponses] Error type:', typeof error);
        console.error('[VolunteerResponses] Error keys:', Object.keys(error));
        console.error('[VolunteerResponses] Error stringified:', JSON.stringify(error, null, 2));
        
        const errorMessage = error?.message || 'Unknown error occurred';
        const errorCode = error?.code || 'UNKNOWN';
        
        console.error('[VolunteerResponses] Parsed decline error:', {
          message: errorMessage,
          code: errorCode,
          details: error?.details,
          hint: error?.hint
        });
        
        toast.error(`Failed to decline volunteer response: ${errorMessage}`);
        return;
      }

      console.log('[VolunteerResponses] Decline successful, updated data:', data);
      toast.success('Volunteer response declined');
      await loadVolunteerResponses(); // Refresh data

    } catch (error) {
      console.error('[VolunteerResponses] Error:', error);
      toast.error('Failed to decline volunteer response');
    } finally {
      setActingId(null);
    }
  };

  const getMatchingGifts = (volunteerGifts: string[], needGifts: string[]) => {
    return volunteerGifts.filter(gift => needGifts.includes(gift));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredResponses = responses.filter(response => {
    if (filter === 'all') return true;
    return response.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'declined': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="text-lg">Loading volunteer responses...</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Volunteer Responses</h1>
              <p className="text-gray-600">Review and approve volunteer commitments to community needs.</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All Responses' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'accepted', label: 'Accepted' },
                  { key: 'declined', label: 'Declined' }
                ].map((filterOption) => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key as any)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filter === filterOption.key
                        ? 'bg-[#20c997] text-white'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Setup Message */}
            {tableError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-600 text-sm">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      Database Setup Required
                    </h3>
                    <p className="text-yellow-700 mb-4">
                      The volunteer responses feature requires a database table to be created first.
                    </p>
                    <div className="bg-yellow-100 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">To set up the database:</h4>
                      <ol className="list-decimal list-inside text-yellow-700 space-y-1 text-sm">
                        <li>Go to your Supabase dashboard</li>
                        <li>Open the SQL Editor</li>
                        <li>Run the script: <code className="bg-yellow-200 px-1 rounded">supabase/policies/opportunity_responses_table.sql</code></li>
                        <li>Refresh this page</li>
                      </ol>
                    </div>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                    >
                      Refresh Page
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Responses List */}
            <div className="space-y-4">
              {filteredResponses.length === 0 && !tableError ? (
                <div className="text-center py-12">
                  <UserCheck className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {filter === 'all' ? 'No volunteer responses yet' : `No ${filter} responses`}
                  </h3>
                  <p className="text-gray-600">
                    {filter === 'all' 
                      ? 'Volunteer responses will appear here when members commit to helping with needs.'
                      : `No responses with ${filter} status found.`
                    }
                  </p>
                </div>
              ) : (
                filteredResponses.map((response) => {
                  const matchingGifts = getMatchingGifts(
                    response.volunteer.gift_selections || [],
                    response.need.giftings_needed || []
                  );

                  return (
                    <div key={response.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#20c997] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {response.volunteer.full_name?.charAt(0) || 'V'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {response.volunteer.full_name || 'Volunteer'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Responded {formatDate(response.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(response.status)}`}>
                            {getStatusIcon(response.status)}
                            {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Need Details */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">{response.need.title}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          {response.need.start_at && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(response.need.start_at)} at {formatTime(response.need.start_at)}</span>
                            </div>
                          )}
                          {(response.need.address || response.need.city) && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{response.need.address || response.need.city}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Volunteer Contact Info */}
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-gray-900 mb-2">Contact Information</h5>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {response.volunteer.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <a href={`mailto:${response.volunteer.email}`} className="hover:text-[#20c997]">
                                {response.volunteer.email}
                              </a>
                            </div>
                          )}
                          {response.volunteer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <a href={`tel:${response.volunteer.phone}`} className="hover:text-[#20c997]">
                                {response.volunteer.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gift Matching */}
                      {matchingGifts.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Matching Gifts
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {matchingGifts.map((gift) => (
                              <span 
                                key={gift} 
                                className="px-3 py-1 bg-[#20c997] text-white rounded-full text-xs font-medium"
                              >
                                {gift}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* All Volunteer Gifts */}
                      {response.volunteer.gift_selections && response.volunteer.gift_selections.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-gray-900 mb-2">All Gifts</h5>
                          <div className="flex flex-wrap gap-2">
                            {response.volunteer.gift_selections.map((gift) => (
                              <span 
                                key={gift} 
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  matchingGifts.includes(gift)
                                    ? 'bg-[#20c997] text-white'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {gift}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {response.status === 'pending' && (
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleAccept(response.id)}
                            disabled={actingId === response.id}
                            className="flex-1 px-4 py-2 bg-[#20c997] text-white rounded-lg text-sm font-medium hover:bg-[#1ba085] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actingId === response.id ? 'Accepting...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleDecline(response.id)}
                            disabled={actingId === response.id}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actingId === response.id ? 'Declining...' : 'Decline'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
