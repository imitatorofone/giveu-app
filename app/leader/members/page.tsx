'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="p-6 space-y-4">
            
            {/* Page Header */}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Members (Your Church)</h1>

            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              {/* Role Filters */}
              <div className="flex gap-2">
                {['All Roles', 'Members', 'Leaders'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      roleFilter === role
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-gray-300"></div>

              {/* Status Filters */}
              <div className="flex gap-2">
                {['All Status', 'Pending', 'Active'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Members List */}
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
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <span className="text-emerald-600 font-semibold text-sm">
                                {getInitials(member.full_name || member.email || 'U')}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{member.full_name}</h3>
                              <p className="text-sm text-gray-600">Member</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                              PENDING
                            </span>
                            <button
                              onClick={() => approveMember(member.id)}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => denyMember(member.id)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                            >
                              Deny
                            </button>
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
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <span className="text-emerald-600 font-semibold text-sm">
                                {getInitials(member.full_name || member.email || 'U')}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{member.full_name}</h3>
                              <p className={`text-sm ${member.is_leader ? 'text-emerald-600' : 'text-gray-600'}`}>
                                {member.is_leader ? 'Leader' : 'Member'}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
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
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}