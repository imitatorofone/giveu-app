'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';
import Footer from '../../../components/Footer';
import NotificationDropdown from '../../../components/NotificationDropdown';
import { CheckCircle, ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { BRAND } from '../../../lib/brandConfig';
import { createNotification } from '@/lib/notificationHelper';

interface PendingNeed {
  id: string;
  title: string;
  description: string;
  urgency: string;
  ongoing_start_date?: string;
  created_at: string;
  location?: string;
  people_needed: number;
  giftings_needed: string[];
  created_by: string;
  created_by_email: string;
  creator?: {
    full_name: string;
    email: string;
  };
}

export default function PendingNeedsPage() {
  const router = useRouter();
  const [pendingNeeds, setPendingNeeds] = useState<PendingNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [userChurchCode, setUserChurchCode] = useState<string | null>(null);

  // Helper function for tag coloring (matching dashboard style)
  const getTagColor = (tag: string) => {
    // For pending needs, we'll use a neutral style since we don't have user gifts to match against
    return {
      isMatch: false,
      styles: {
        backgroundColor: '#F5F5F5',   // Light gray background
        color: '#757575',             // Medium gray text
        border: '1px solid #F5F5F5'   // Same color border
      }
    };
  };

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  // 🔥 CRITICAL FIX: Watch userChurchCode and fetch needs when it's available
  useEffect(() => {
    console.log('🔄 userChurchCode changed:', userChurchCode);
    if (userChurchCode) {
      console.log('📡 Fetching pending needs for church:', userChurchCode);
      fetchPendingNeeds();
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
        .select('*, church_code')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        router.push('/dashboard');
        return;
      }

      if (!profileData?.is_leader) {
        toast.error('Access denied. Leadership privileges required.');
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

  const fetchPendingNeeds = async () => {
    try {
      console.log('🔍 fetchPendingNeeds called with userChurchCode:', userChurchCode);
      
      // Don't fetch if we don't have church_code yet
      if (!userChurchCode) {
        console.log('❌ No userChurchCode, skipping fetch');
        return;
      }

      console.log('📊 Querying needs table with filters:');
      console.log('  - church_code:', userChurchCode);
      console.log('  - status: pending');

      const { data, error } = await supabase
        .from('needs')
        .select('*')
        .eq('church_code', userChurchCode) // 🔥 CRITICAL: Filter by church
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('📊 Query result:', { data, error });
      console.log('📊 Number of pending needs found:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📋 Pending needs details:', data.map(need => ({
          id: need.id,
          title: need.title,
          status: need.status,
          church_code: need.church_code,
          created_at: need.created_at,
          creator: need.creator
        })));
      }

      if (error) {
        console.error('❌ Query error:', error);
        throw error;
      }
      
      // Fetch creator names for each need
      if (data && data.length > 0) {
        console.log('👥 Fetching creator names for', data.length, 'needs');
        
        const needsWithCreators = await Promise.all(
          data.map(async (need) => {
            try {
              const { data: creatorData, error: creatorError } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', need.created_by)
                .single();
              
              if (creatorError) {
                console.warn('⚠️ Could not fetch creator for need', need.id, creatorError);
                return {
                  ...need,
                  creator: {
                    full_name: need.created_by_email?.split('@')[0] || 'Unknown User',
                    email: need.created_by_email
                  }
                };
              }
              
              return {
                ...need,
                creator: {
                  full_name: creatorData.full_name || creatorData.email?.split('@')[0] || 'Unknown User',
                  email: creatorData.email || need.created_by_email
                }
              };
            } catch (error) {
              console.warn('⚠️ Error fetching creator for need', need.id, error);
              return {
                ...need,
                creator: {
                  full_name: need.created_by_email?.split('@')[0] || 'Unknown User',
                  email: need.created_by_email
                }
              };
            }
          })
        );
        
        console.log('✅ Setting pendingNeeds state with', needsWithCreators.length, 'items');
        setPendingNeeds(needsWithCreators);
      } else {
        console.log('✅ Setting pendingNeeds state with 0 items');
        setPendingNeeds([]);
      }
    } catch (error) {
      console.error('❌ Error fetching pending needs:', error);
    }
  };

  const approveNeed = async (needId: string) => {
    setActingId(needId);
    try {
      // Verify need belongs to leader's church before approving
      const need = pendingNeeds.find(n => n.id === needId);
      if (!need) {
        toast.error('Need not found');
        setActingId(null);
        return;
      }

      const { error } = await supabase
        .from('needs')
        .update({ status: 'approved' })
        .eq('id', needId)
        .eq('church_code', userChurchCode); // 🔥 SECURITY: Only update if church matches

      if (error) throw error;

      // Send notification to the member who created the need
      if (need) {
        // Create notification for the member
        await createNotification({
          userId: need.created_by,
          eventType: 'need.approved',
          title: 'Need Approved',
          description: `Your need "${need.title}" has been approved and is now visible to the community.`,
          path: '/dashboard',
          needId: need.id,
          need_title: need.title
        });
      }

      // Remove from list
      setPendingNeeds(prev => prev.filter(n => n.id !== needId));
      toast.success('Need approved and published!');
    } catch (error) {
      console.error('Error approving need:', error);
      toast.error('Failed to approve need');
    } finally {
      setActingId(null);
    }
  };

  const rejectNeed = async (needId: string) => {
    setActingId(needId);
    try {
      // Verify need belongs to leader's church before rejecting
      const need = pendingNeeds.find(n => n.id === needId);
      if (!need) {
        toast.error('Need not found');
        setActingId(null);
        return;
      }

      const { error } = await supabase
        .from('needs')
        .update({ status: 'rejected' })
        .eq('id', needId)
        .eq('church_code', userChurchCode); // 🔥 SECURITY: Only update if church matches

      if (error) throw error;

      // Remove from list
      setPendingNeeds(prev => prev.filter(n => n.id !== needId));
      toast.success('Need declined');
    } catch (error) {
      console.error('Error declining need:', error);
      toast.error('Failed to decline need');
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: BRAND.colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: BRAND.fonts.body
      }}>
        <div style={{ 
          fontSize: '16px',
          color: BRAND.colors.textLight
        }}>
          Loading pending needs...
        </div>
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
          Pending Needs
        </h1>
        <p className="text-gray-600 text-base" style={{ fontFamily: BRAND.fonts.body }}>
          Review and approve community needs
        </p>
      </div>

      {/* Content */}
      {(() => {
        console.log('🎨 Rendering content - pendingNeeds.length:', pendingNeeds.length);
        console.log('🎨 pendingNeeds data:', pendingNeeds);
        console.log('🎨 userChurchCode:', userChurchCode);
        console.log('🎨 loading:', loading);
        return pendingNeeds.length === 0;
      })() ? (
        <div className="flex flex-col items-center justify-center px-4 pt-20">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: `${BRAND.colors.primary}1A` }}
          >
            <CheckCircle size={64} style={{ color: BRAND.colors.primary }} />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: BRAND.fonts.heading }}>
            All Caught Up!
          </h2>
          
          <p className="text-center text-gray-600 max-w-sm" style={{ fontFamily: BRAND.fonts.body }}>
            No pending needs to review right now. Great job keeping up with requests!
          </p>
        </div>
      ) : (
        <div className="px-4 pt-4">
          <div className="space-y-4">
            {pendingNeeds.map((need) => (
              <div 
                key={need.id} 
                className="bg-white rounded-xl border mb-4"
                style={{ 
                  borderColor: '#E0E0E0',
                  borderWidth: '1px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '280px',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Card Header */}
                <div style={{ padding: '20px 20px 0 20px' }}>
                  <h3 className="font-semibold text-lg mb-2" style={{ 
                    color: '#424242',
                    lineHeight: '1.3',
                    fontFamily: BRAND.fonts.heading,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textAlign: 'center'
                  }}>
                    {need.title}
                  </h3>
                  
                  {/* Metadata Row - Horizontal layout with icons */}
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                    fontSize: '14px',
                    color: BRAND.colors.textLight,
                    opacity: 0.7,
                    flexWrap: 'wrap'
                  }}>
                    {/* Date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={20} style={{ color: BRAND.colors.primary, flexShrink: 0 }} />
                      <span style={{ fontFamily: BRAND.fonts.body }}>
                        {new Date(need.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={20} style={{ color: BRAND.colors.primary, flexShrink: 0 }} />
                      <span style={{ 
                        fontFamily: BRAND.fonts.body,
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {need.location || 'Location TBD'}
                      </span>
                    </div>
                    
                    {/* People */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                      <Users size={20} style={{ color: BRAND.colors.primary, flexShrink: 0 }} />
                      <span style={{ fontFamily: BRAND.fonts.body }}>
                        {need.people_needed || 1}+ needed
                      </span>
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
                  <p className="line-clamp-3" style={{ 
                    color: '#424242',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    marginBottom: '16px',
                    fontFamily: BRAND.fonts.body
                  }}>
                    {need.description}
                  </p>

                  {/* Created by info */}
                  <div style={{ 
                    fontSize: '13px',
                    color: BRAND.colors.textLight,
                    marginBottom: '16px',
                    fontFamily: BRAND.fonts.body
                  }}>
                    Submitted by {need.creator?.full_name || need.created_by_email}
                  </div>

                  {/* Tags - Matching dashboard style */}
                  {need.giftings_needed && need.giftings_needed.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        flexWrap: 'wrap'
                      }}>
                        {need.giftings_needed.slice(0, 6).map((tag, idx) => {
                          const { styles } = getTagColor(tag);
                          
                          return (
                            <span
                              key={idx}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '16px',
                                fontSize: '12px',
                                fontWeight: '500',
                                fontFamily: BRAND.fonts.heading,
                                ...styles
                              }}
                            >
                              {tag}
                            </span>
                          );
                        })}
                        
                        {need.giftings_needed.length > 6 && (
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            fontFamily: BRAND.fonts.heading,
                            backgroundColor: '#F5F5F5',
                            color: '#757575',
                            border: '1px solid #F5F5F5'
                          }}>
                            +{need.giftings_needed.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer - Action Buttons */}
                <div style={{ 
                  padding: '20px',
                  borderTop: '1px solid #f1f5f9',
                  backgroundColor: '#fafbfc'
                }}>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => approveNeed(need.id)}
                      disabled={actingId === need.id}
                      className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors active:scale-95"
                      style={{ 
                        backgroundColor: BRAND.colors.primary,
                        minHeight: '48px',
                        flex: 1,
                        justifyContent: 'center',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontFamily: BRAND.fonts.heading,
                        fontSize: '16px',
                        border: `2px solid ${BRAND.colors.primary}`,
                        cursor: actingId === need.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        opacity: actingId === need.id ? 0.6 : 1
                      }}
                    >
                      {actingId === need.id ? 'Approving...' : 'Approve & Publish'}
                    </button>
                    
                    <button
                      onClick={() => rejectNeed(need.id)}
                      disabled={actingId === need.id}
                      className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors active:scale-95"
                      style={{ 
                        backgroundColor: 'white',
                        minHeight: '48px',
                        flex: 1,
                        justifyContent: 'center',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontFamily: BRAND.fonts.heading,
                        fontSize: '15px',
                        border: '2px solid #ef4444',
                        color: '#ef4444',
                        cursor: actingId === need.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        opacity: actingId === need.id ? 0.6 : 1
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
