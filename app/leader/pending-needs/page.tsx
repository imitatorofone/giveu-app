'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';
import Footer from '../../../components/Footer';
import NotificationDropdown from '../../../components/NotificationDropdown';
import { CheckCircle, ArrowLeft } from 'lucide-react';
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
}

export default function PendingNeedsPage() {
  const router = useRouter();
  const [pendingNeeds, setPendingNeeds] = useState<PendingNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [userChurchCode, setUserChurchCode] = useState<string | null>(null);

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

      // Store church code for filtering
      setUserChurchCode(profileData.church_code);

      // Load pending needs
      await fetchPendingNeeds();

    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingNeeds = async () => {
    try {
      // Don't fetch if we don't have church_code yet
      if (!userChurchCode) {
        console.log('Skipping fetch - no church_code yet');
        return;
      }

      const { data, error } = await supabase
        .from('needs')
        .select('*')
        .eq('church_code', userChurchCode) // 🔥 CRITICAL: Filter by church
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingNeeds(data || []);
    } catch (error) {
      console.error('Error fetching pending needs:', error);
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
      {pendingNeeds.length === 0 ? (
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
              <div key={need.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: BRAND.fonts.heading }}>
                  {need.title}
                </h3>
                
                <p className="text-gray-700 mb-3" style={{ fontFamily: BRAND.fonts.body, fontSize: '15px' }}>
                  {need.description}
                </p>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4" style={{ fontFamily: BRAND.fonts.body }}>
                  <span>By {need.created_by_email}</span>
                  <span>•</span>
                  <span>{new Date(need.created_at).toLocaleDateString()}</span>
                </div>
                
                {need.giftings_needed && need.giftings_needed.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {need.giftings_needed.slice(0, 5).map((skill, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 text-sm font-medium rounded-full"
                        style={{
                          backgroundColor: `${BRAND.colors.primary}20`,
                          color: BRAND.colors.primary,
                          fontFamily: BRAND.fonts.heading
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                    {need.giftings_needed.length > 5 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                        +{need.giftings_needed.length - 5}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => approveNeed(need.id)}
                    disabled={actingId === need.id}
                    className="flex-1 h-12 text-white rounded-lg font-medium transition-opacity disabled:opacity-50"
                    style={{
                      backgroundColor: BRAND.colors.primary,
                      fontFamily: BRAND.fonts.heading,
                      fontSize: '16px'
                    }}
                  >
                    {actingId === need.id ? 'Approving...' : 'Approve & Publish'}
                  </button>
                  <button
                    onClick={() => rejectNeed(need.id)}
                    disabled={actingId === need.id}
                    className="flex-1 h-12 border-2 border-red-500 text-red-500 rounded-lg font-medium transition-colors hover:bg-red-50 disabled:opacity-50"
                    style={{
                      fontFamily: BRAND.fonts.heading,
                      fontSize: '15px'
                    }}
                  >
                    Decline
                  </button>
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
