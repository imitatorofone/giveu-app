'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import { BRAND } from '@/lib/brandConfig';

export default function MembersPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
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
        .select('*, avatar_url')
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
        router.push('/dashboard');
        return;
      }

      // Load members data - filter by church_code if available
      console.log('[Members] Starting profiles query...');
      console.log('[Members] Leader profile data:', {
        id: profileData.id,
        church_code: profileData.church_code,
        role: profileData.role,
        is_leader: profileData.is_leader
      });
      
      let query = supabase.from('profiles').select('*');
      
      // If the leader has a church_code, filter by it
      if (profileData.church_code) {
        query = query.eq('church_code', profileData.church_code);
        console.log('[Members] Filtering by church_code:', profileData.church_code);
      } else {
        console.log('[Members] No church_code found for leader, showing all profiles');
      }
      
      console.log('[Members] Executing Supabase query...');
      const { data: profilesData, error: profilesError } = await query.order('full_name');

      console.log('[Members] Raw Supabase response:', { 
        data: profilesData, 
        error: profilesError,
        hasData: !!profilesData,
        dataLength: profilesData?.length || 0,
        hasError: !!profilesError
      });

      if (profilesError) {
        console.error('[Members] Supabase query error details:', {
          message: profilesError.message,
          details: profilesError.details,
          hint: profilesError.hint,
          code: profilesError.code
        });
      }

      console.log('[Members] Total profiles found:', profilesData?.length || 0);
      if (profilesData && profilesData.length > 0) {
        console.log('[Members] All profiles details:');
        profilesData.forEach((profile, index) => {
          console.log(`[Members] Profile ${index + 1}:`, {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            approval_status: profile.approval_status,
            is_leader: profile.is_leader,
            church_code: profile.church_code,
            role: profile.role
          });
        });
      } else {
        console.log('[Members] No profiles returned from query');
      }

      console.log('[Members] Setting members state with:', profilesData || []);
      setMembers(profilesData || []);

    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  console.log('[Members] Starting filtering process...');
  console.log('[Members] Input data:', {
    totalMembers: members.length,
    searchTerm,
    roleFilter,
    statusFilter
  });

  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchTerm || 
      member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'All Roles' || 
      (roleFilter === 'Leaders' && member.is_leader) ||
      (roleFilter === 'Members' && !member.is_leader);
    
    const matchesStatus = statusFilter === 'All Status' ||
      (statusFilter === 'Pending' && (member.approval_status === 'pending' || member.approval_status === null)) ||
      (statusFilter === 'Active' && (member.approval_status === 'approved' || member.approval_status === 'active'));
    
    const passes = matchesSearch && matchesRole && matchesStatus;
    
    console.log('[Members] Filtering member:', {
      name: member.full_name,
      id: member.id,
      searchTerm,
      roleFilter,
      statusFilter,
      memberRole: member.is_leader ? 'Leader' : 'Member',
      memberStatus: member.approval_status,
      matchesSearch,
      matchesRole,
      matchesStatus,
      passes
    });
    
    return passes;
  });

  console.log('[Members] Filtering results:', {
    totalMembers: members.length,
    filteredCount: filteredMembers.length,
    searchTerm,
    roleFilter,
    statusFilter
  });

  // Always separate into pending and active members
  const pendingMembers = filteredMembers.filter(m => m.approval_status === 'pending' || m.approval_status === null);
  const activeMembers = filteredMembers.filter(m => m.approval_status === 'approved' || m.approval_status === 'active');

  console.log('[Members] Final rendering data:', {
    statusFilter,
    filteredMembersCount: filteredMembers.length,
    pendingMembersCount: pendingMembers.length,
    activeMembersCount: activeMembers.length,
    willShowPendingSection: pendingMembers.length > 0,
    willShowActiveSection: activeMembers.length > 0
  });

  const approveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved' })
        .eq('id', memberId);

      if (!error) {
        setMembers(prev => prev.map(m => 
          m.id === memberId ? { ...m, approval_status: 'approved' } : m
        ));
      }
    } catch (error) {
      console.error('Error approving member:', error);
    }
  };

  const denyMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'denied' })
        .eq('id', memberId);

      if (!error) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
      }
    } catch (error) {
      console.error('Error denying member:', error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.colors.background }}>
      {/* Consistent Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back button on left */}
          <button 
            onClick={() => router.push('/leader/tools')}
            className="p-2 active:bg-gray-100 rounded-full transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Back to Tools"
          >
            <ArrowLeft size={22} style={{ color: '#374151' }} />
          </button>
          
          {/* Centered logo */}
          <span className="text-xl font-bold text-gray-900" style={{ fontFamily: BRAND.fonts.heading }}>
            giveU
          </span>
          
          {/* Empty right side for balance */}
          <div style={{ width: '44px' }}></div>
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
        <div className="relative">
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
      </div>

      {/* Role Filter Pills */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button
            onClick={() => setRoleFilter('All Roles')}
            className="px-5 py-2 rounded-full whitespace-nowrap font-medium transition-colors active:scale-95"
            style={{
              backgroundColor: roleFilter === 'All Roles' ? BRAND.colors.primary : '#f3f4f6',
              color: roleFilter === 'All Roles' ? 'white' : '#374151',
              fontFamily: BRAND.fonts.heading,
              minHeight: '40px',
              fontSize: '14px'
            }}
          >
            All Roles
          </button>
          <button
            onClick={() => setRoleFilter('Members')}
            className="px-5 py-2 rounded-full whitespace-nowrap font-medium transition-colors active:scale-95"
            style={{
              backgroundColor: roleFilter === 'Members' ? BRAND.colors.primary : '#f3f4f6',
              color: roleFilter === 'Members' ? 'white' : '#374151',
              fontFamily: BRAND.fonts.heading,
              minHeight: '40px',
              fontSize: '14px'
            }}
          >
            Members
          </button>
          <button
            onClick={() => setRoleFilter('Leaders')}
            className="px-5 py-2 rounded-full whitespace-nowrap font-medium transition-colors active:scale-95"
            style={{
              backgroundColor: roleFilter === 'Leaders' ? BRAND.colors.primary : '#f3f4f6',
              color: roleFilter === 'Leaders' ? 'white' : '#374151',
              fontFamily: BRAND.fonts.heading,
              minHeight: '40px',
              fontSize: '14px'
            }}
          >
            Leaders
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button
            onClick={() => setStatusFilter('All Status')}
            className="px-5 py-2 rounded-full whitespace-nowrap font-medium transition-colors active:scale-95"
            style={{
              backgroundColor: statusFilter === 'All Status' ? BRAND.colors.primary : '#f3f4f6',
              color: statusFilter === 'All Status' ? 'white' : '#374151',
              fontFamily: BRAND.fonts.heading,
              minHeight: '40px',
              fontSize: '14px'
            }}
          >
            All Status
          </button>
          <button
            onClick={() => setStatusFilter('Active')}
            className="px-5 py-2 rounded-full whitespace-nowrap font-medium transition-colors active:scale-95"
            style={{
              backgroundColor: statusFilter === 'Active' ? BRAND.colors.primary : '#f3f4f6',
              color: statusFilter === 'Active' ? 'white' : '#374151',
              fontFamily: BRAND.fonts.heading,
              minHeight: '40px',
              fontSize: '14px'
            }}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('Pending')}
            className="px-5 py-2 rounded-full whitespace-nowrap font-medium transition-colors active:scale-95"
            style={{
              backgroundColor: statusFilter === 'Pending' ? BRAND.colors.primary : '#f3f4f6',
              color: statusFilter === 'Pending' ? 'white' : '#374151',
              fontFamily: BRAND.fonts.heading,
              minHeight: '40px',
              fontSize: '14px'
            }}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Members List */}
      <main className="px-4 pt-4 pb-32">
        <div className="space-y-8">
              {/* Pending Members */}
              {pendingMembers.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Pending Members ({pendingMembers.length})
                  </h2>
                  <div className="space-y-3">
                    {pendingMembers.map((member) => (
                      <div key={member.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {member.avatar_url ? (
                              <img 
                                src={member.avatar_url}
                                alt={member.full_name || 'Profile'}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ 
                                  backgroundColor: BRAND.colors.primary,
                                  color: 'white'
                                }}
                              >
                                <span className="font-semibold text-sm" style={{ fontFamily: BRAND.fonts.heading }}>
                                  {getInitials(member.full_name || member.email || 'U')}
                                </span>
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900" style={{ fontFamily: BRAND.fonts.heading }}>
                                {member.full_name}
                              </h3>
                              <p className="text-gray-600" style={{ fontFamily: BRAND.fonts.body, fontSize: '14px' }}>Member</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center">
                            <span 
                              className="px-3 py-1 rounded-full font-medium text-center"
                              style={{ 
                                fontSize: '13px',
                                backgroundColor: `${BRAND.colors.primary}20`,
                                color: BRAND.colors.primary,
                                fontFamily: BRAND.fonts.heading
                              }}
                            >
                              PENDING
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => approveMember(member.id)}
                                className="flex-1 sm:flex-none px-4 py-2 text-white rounded-lg font-medium transition-all active:scale-95"
                                style={{ 
                                  backgroundColor: BRAND.colors.primary,
                                  fontFamily: BRAND.fonts.heading,
                                  fontSize: '15px',
                                  minHeight: '44px'
                                }}
                                onTouchStart={(e) => e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover}
                                onTouchEnd={(e) => {
                                  const target = e.currentTarget;
                                  setTimeout(() => {
                                    if (target && target.style) {
                                      target.style.backgroundColor = BRAND.colors.primary;
                                    }
                                  }, 150);
                                }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => denyMember(member.id)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium active:bg-gray-300 transition-all active:scale-95"
                                style={{ 
                                  fontFamily: BRAND.fonts.heading,
                                  fontSize: '15px',
                                  minHeight: '44px'
                                }}
                              >
                                Deny
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Members */}
              {activeMembers.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Active Members ({activeMembers.length})
                  </h2>
                  <div className="space-y-3">
                    {activeMembers.map((member) => (
                      <div key={member.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {member.avatar_url ? (
                              <img 
                                src={member.avatar_url}
                                alt={member.full_name || 'Profile'}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ 
                                  backgroundColor: BRAND.colors.primary,
                                  color: 'white'
                                }}
                              >
                                <span className="font-semibold text-sm" style={{ fontFamily: BRAND.fonts.heading }}>
                                  {getInitials(member.full_name || member.email || 'U')}
                                </span>
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900" style={{ fontFamily: BRAND.fonts.heading }}>
                                {member.full_name}
                              </h3>
                              <p 
                                className="text-sm"
                                style={{ 
                                  color: member.is_leader ? BRAND.colors.primary : BRAND.colors.textLight,
                                  fontFamily: BRAND.fonts.body
                                }}
                              >
                                {member.is_leader ? 'Leader' : 'Member'}
                              </p>
                            </div>
                          </div>
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${BRAND.colors.primary}20`,
                              color: BRAND.colors.primary,
                              fontFamily: BRAND.fonts.heading
                            }}
                          >
                            ACTIVE
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredMembers.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || roleFilter !== 'All Roles' || statusFilter !== 'All Status' 
                      ? 'No members found' 
                      : 'No members yet'
                    }
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || roleFilter !== 'All Roles' || statusFilter !== 'All Status'
                      ? 'Try adjusting your search or filter criteria' 
                      : 'Members will appear here once they join your church'
                    }
                  </p>
                </div>
              )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}