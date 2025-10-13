'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';
import Footer from '@/components/Footer';
import NotificationDropdown from '@/components/NotificationDropdown';
import { ArrowLeft } from 'lucide-react';
import { BRAND } from '@/lib/brandConfig';
import toast from 'react-hot-toast';

interface Member {
  id: string;
  full_name: string;
  email: string;
  role: string;
  approval_status: string;
  created_at: string;
  avatar_url?: string;
}

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [userChurchCode, setUserChurchCode] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    if (!loading && userChurchCode) {
      fetchMembers();
    }
  }, [roleFilter, statusFilter, userChurchCode]);

  const checkAuthAndLoadData = async () => {
    try {
      // 🚀 PERFORMANCE: Check cache first
      const cachedChurchCode = sessionStorage.getItem('user_church_code');
      const cachedIsLeader = sessionStorage.getItem('user_is_leader');
      
      if (cachedChurchCode && cachedIsLeader === 'true') {
        setUserChurchCode(cachedChurchCode);
        setLoading(false);
        return; // ✅ Skip profile query!
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth');
        return;
      }

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, avatar_url, church_code')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        router.push('/dashboard');
        return;
      }

      // Check if user is a leader
      if (!profileData?.is_leader) {
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
      setUserChurchCode(profileData.church_code);

    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      // Don't fetch if we don't have church_code yet
      if (!userChurchCode) {
        return;
      }

      let query = supabase
        .from('profiles')
        .select('*')
        .eq('church_code', userChurchCode); // 🔥 CRITICAL: Filter by church
      
      // Apply role filter
      if (roleFilter === 'Members') {
        query = query.eq('is_leader', false);
      } else if (roleFilter === 'Leaders') {
        query = query.eq('is_leader', true);
      }
      
      // Apply status filter
      if (statusFilter === 'Active') {
        query = query.eq('approval_status', 'approved');
      } else if (statusFilter === 'Pending') {
        query = query.eq('approval_status', 'pending');
      }
      
      const { data, error } = await query.order('full_name');

      if (error) throw error;
      
      let filteredData = data || [];
      
      // Apply search filter
      if (searchTerm) {
        filteredData = filteredData.filter(m => 
          m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setMembers(filteredData);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (!loading && userChurchCode) {
        fetchMembers();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  function getInitials(name: string) {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  const pendingMembers = members.filter(m => m.approval_status === 'pending');
  const activeMembers = members.filter(m => m.approval_status === 'approved');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading members...</div>
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
          Members
        </h1>
        <p className="text-gray-600 text-base" style={{ fontFamily: BRAND.fonts.body }}>
          View and manage your church family
        </p>
      </div>

      {/* Search Bar */}
      <div className="px-4 pt-4 pb-3 bg-white border-b border-gray-200">
              <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:outline-none"
          style={{
            fontFamily: BRAND.fonts.body,
            fontSize: '16px'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = BRAND.colors.primary}
          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
        />
      </div>

      {/* Role Filter Pills */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {['All Roles', 'Members', 'Leaders'].map((role) => (
              <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className="px-5 py-2 rounded-full whitespace-nowrap font-medium transition-colors active:scale-95"
              style={{
                backgroundColor: roleFilter === role ? BRAND.colors.primary : '#f3f4f6',
                color: roleFilter === role ? 'white' : '#374151',
                fontFamily: BRAND.fonts.heading,
                minHeight: '40px',
                fontSize: '14px'
              }}
            >
              {role}
              </button>
          ))}
          </div>
        </div>

      {/* Status Filter Pills */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {['All Status', 'Active', 'Pending'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="px-5 py-2 rounded-full whitespace-nowrap font-medium transition-colors active:scale-95"
              style={{
                backgroundColor: statusFilter === status ? BRAND.colors.primary : '#f3f4f6',
                color: statusFilter === status ? 'white' : '#374151',
                fontFamily: BRAND.fonts.heading,
                minHeight: '40px',
                fontSize: '14px'
              }}
            >
              {status}
            </button>
          ))}
            </div>
      </div>
      
      {/* Members List */}
      <div className="px-4 pt-4">
        {/* Pending Members Section */}
        {pendingMembers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: BRAND.fonts.heading }}>
              Pending Members ({pendingMembers.length})
            </h2>
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <img 
                        src={member.avatar_url}
                        alt={member.full_name || 'Profile'}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: BRAND.colors.primary }}
                      >
                        {getInitials(member.full_name || member.email || 'U')}
                </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900" style={{ fontFamily: BRAND.fonts.heading }}>
                        {member.full_name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-600" style={{ fontFamily: BRAND.fonts.body }}>
                        {member.role || 'Member'}
                      </p>
                      </div>
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${BRAND.colors.primary}20`,
                        color: BRAND.colors.primary,
                        fontFamily: BRAND.fonts.heading
                      }}
                    >
                      PENDING
                    </span>
                      </div>
                </div>
              ))}
                    </div>
              </div>
        )}

        {/* Active Members Section */}
        {activeMembers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: BRAND.fonts.heading }}>
              Active Members ({activeMembers.length})
            </h2>
            <div className="space-y-3">
              {activeMembers.map((member) => (
                <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <img 
                        src={member.avatar_url}
                        alt={member.full_name || 'Profile'}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: BRAND.colors.primary }}
                      >
                        {getInitials(member.full_name || member.email || 'U')}
            </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900" style={{ fontFamily: BRAND.fonts.heading }}>
                        {member.full_name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-600" style={{ fontFamily: BRAND.fonts.body }}>
                        {member.role || 'Member'}
                      </p>
                  </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      ACTIVE
                          </span>
                  </div>
                </div>
                        ))}
                      </div>
                    </div>
        )}

        {/* Empty State */}
        {members.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600" style={{ fontFamily: BRAND.fonts.body }}>
              {searchTerm || roleFilter !== 'All Roles' || statusFilter !== 'All Status'
                ? 'No members found matching your criteria' 
                : 'Members will appear here once they join your church'}
            </p>
              </div>
            )}
          </div>

      <Footer />
    </div>
  );
}
