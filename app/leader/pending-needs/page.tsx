'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getCategoryByTag } from '@/lib/giftingStructure';
import toast from 'react-hot-toast';
import LeaderSubnav from '../../../components/leader/LeaderSubnav';

// Helper function to format giftings (array or string)
const formatGiftings = (giftings: string[] | string): string[] => {
  if (Array.isArray(giftings)) {
    return giftings;
  }
  if (typeof giftings === 'string') {
    return giftings.split(',').map(g => g.trim()).filter(Boolean);
  }
  return [];
};

type PendingNeed = {
  id: string;
  title: string;
  description: string;
  urgency: string;
  ongoing_start_date?: string;
  created_at: string;
  city?: string;
  location?: string;
  people_needed: number;
  giftings_needed: string[];
};

export default function PendingNeedsPage() {
  const [pendingNeeds, setPendingNeeds] = useState<PendingNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

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

      setUser(session.user);

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        router.push('/dashboard');
        return;
      }

      setProfile(profileData);

      // Check if user is a leader
      if (!profileData?.is_leader) {
        toast.error('Access denied. Leadership privileges required.');
        router.push('/dashboard');
        return;
      }

      // Load pending needs
      fetchPendingNeeds();

    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingNeeds = async () => {
    try {
      const { data, error } = await supabase
        .from('needs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingNeeds(data || []);
    } catch (error) {
      console.error('Error fetching pending needs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (needId: string) => {
    try {
      const { error } = await supabase
        .from('needs')
        .update({ status: 'active' })
        .eq('id', needId);

      if (error) throw error;
      
      // Refresh the list
      fetchPendingNeeds();
      toast.success('Need approved and published!');
    } catch (error) {
      console.error('Error approving need:', error);
      toast.error('Failed to approve need');
    }
  };

  const handleReject = async (needId: string) => {
    try {
      const { error } = await supabase
        .from('needs')
        .update({ status: 'rejected' })
        .eq('id', needId);

      if (error) throw error;
      
      // Refresh the list
      fetchPendingNeeds();
      toast.success('Need rejected');
    } catch (error) {
      console.error('Error rejecting need:', error);
      toast.error('Failed to reject need');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading pending needs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="p-6 space-y-4">
          {/* Leader sub-navigation */}
          <LeaderSubnav 
            active="pending-needs" 
            needsCount={pendingNeeds.length}
            className="mb-2"
          />
          
          <h1 className="text-xl font-bold">Pending Needs</h1>

        {/* Cards Grid - Exact copy of Ways to Serve layout */}
        {pendingNeeds.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending needs to review at this time.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {pendingNeeds.map((need) => (
              <div key={need.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border">
                
                {/* Card Content - Exact Ways to Serve structure */}
                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    {need.title}
                  </h3>

                  {/* Three Column Info Grid - Matches Ways to Serve exactly */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Date/Time Column */}
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 11-4 0 2 2 0 014 0zM6 7h12a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z"></path>
                        </svg>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div>{need.urgency === 'ongoing' ? 'Ongoing starting' : 'This Saturday'}</div>
                        <div>{need.urgency === 'ongoing' ? new Date(need.ongoing_start_date || need.created_at).toLocaleDateString() : '2-5pm'}</div>
                      </div>
                    </div>

                    {/* Location Column */}
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div>{need.city || need.location || 'Church'}</div>
                        <div>{need.city ? 'Location' : 'Kitchen'}</div>
                      </div>
                    </div>

                    {/* People Column */}
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div>0 committed</div>
                        <div>{need.people_needed}+ needed</div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {need.description.split('Ongoing Schedule:')[0].trim()}
                    </p>
                    {need.urgency === 'ongoing' && need.description.includes('Ongoing Schedule:') && (
                      <p className="text-xs text-blue-600 mt-2 italic">
                        Schedule: {need.description.split('Ongoing Schedule:')[1]?.replace('Starting ', '').trim()}
                      </p>
                    )}
                  </div>

                  {/* Skills Tags - Matches Ways to Serve styling */}
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {formatGiftings(need.giftings_needed).slice(0, 3).map((skill: string, index: number) => {
                        const category = getCategoryByTag(skill);
                        return (
                          <span 
                            key={index}
                            className="text-xs px-3 py-1 rounded-full border font-medium"
                            style={{
                              backgroundColor: category?.bgColor || '#f3f4f6',
                              color: category?.textColor || '#6b7280',
                              borderColor: category?.borderColor || '#d1d5db'
                            }}
                          >
                            {skill}
                          </span>
                        );
                      })}
                      {formatGiftings(need.giftings_needed).length > 3 && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full border border-gray-200">
                          +{formatGiftings(need.giftings_needed).length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Replaces "I Can Help" button */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleApprove(need.id)}
                      className="w-full bg-emerald-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-600 transition-colors text-center"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => handleReject(need.id)}
                      className="w-full border border-red-200 text-red-600 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors font-medium text-center"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
