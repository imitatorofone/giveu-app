'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { handleNeedApproval } from '../../lib/needApproval';
import { Gift, Users, AlertTriangle, Heart, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [pendingNeeds, setPendingNeeds] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/');
        return;
      }

      // Check if user is admin
      if (authData.user.email !== 'imitatorofone@gmail.com') {
        router.push('/dashboard');
        return;
      }

      setUser(authData.user);

      // Load members data
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      setMembers(profilesData || []);

      // Load pending needs
      const { data: needsData } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingNeeds(needsData || []);

      // Load pending members
      const { data: pendingData } = await supabase
        .from('org_members')
        .select(`
          *,
          profiles (full_name, email, gift_selections)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingMembers(pendingData || []);
      setLoading(false);
    };

    loadData();
  }, [router]);

  const approveNeed = async (needId: string) => {
    try {
      // Use the new matching system
      const result = await handleNeedApproval(needId, 'default-org');
      
      if (result.success) {
        // Remove from pending needs
        setPendingNeeds(prev => prev.filter(need => need.id !== needId));
        
        // Show success message with match count
        alert(`Need approved! ${result.matchCount} people were notified and can now see this opportunity.`);
      }
    } catch (error) {
      console.error('Error approving need:', error);
      alert('Failed to approve need. Please try again.');
    }
  };

  const declineNeed = async (needId: string) => {
    const { error } = await supabase
      .from('opportunities')
      .update({ status: 'declined' })
      .eq('id', needId);

    if (!error) {
      setPendingNeeds(prev => prev.filter(need => need.id !== needId));
      alert('Need declined');
    }
  };

  const approveMember = async (memberId: string) => {
    const { error } = await supabase
      .from('org_members')
      .update({ 
        status: 'approved', 
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', memberId);

    if (!error) {
      setPendingMembers(prev => prev.filter(member => member.id !== memberId));
      alert('Member approved!');
    }
  };

  const denyMember = async (memberId: string) => {
    const { error } = await supabase
      .from('org_members')
      .update({ 
        status: 'denied',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', memberId);

    if (!error) {
      setPendingMembers(prev => prev.filter(member => member.id !== memberId));
      alert('Member request denied');
    }
  };

  const filteredMembers = members.filter(member =>
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.gift_selections?.some((gift: string) =>
      gift.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  const sidebarStyle = {
    width: 250,
    backgroundColor: 'white',
    borderRight: '1px solid #e5e7eb',
    height: '100vh',
    position: 'fixed' as const,
    left: 0,
    top: 0,
    padding: 0
  };

  const mainContentStyle = {
    marginLeft: 250,
    minHeight: '100vh',
    backgroundColor: '#f9fafb'
  };

  const tabButtonStyle = (isActive: boolean) => ({
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    backgroundColor: isActive ? '#f0fdfa' : 'transparent',
    color: isActive ? '#2BB3A3' : '#6b7280',
    textAlign: 'left' as const,
    cursor: 'pointer',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 12
  });

  return (
    <div style={{ display: 'flex', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ padding: 24, borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              backgroundColor: '#2BB3A3', 
              borderRadius: 8, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              fontSize: 20
            }}>
              <Gift size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#1f2937', fontFamily: 'var(--font-quicksand)', fontWeight: 700 }}>Engage</h2>
              <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>Admin Dashboard</p>
            </div>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <button 
            style={tabButtonStyle(activeTab === 'members')}
            onClick={() => setActiveTab('members')}
          >
            <Users size={20} />
            Members
          </button>
          <button 
            style={tabButtonStyle(activeTab === 'pending')}
            onClick={() => setActiveTab('pending')}
          >
            <span style={{ fontSize: 20 }}>👤</span>
            Pending Members
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
            style={tabButtonStyle(activeTab === 'needs')}
            onClick={() => setActiveTab('needs')}
          >
            <AlertTriangle size={20} />
            Pending Needs
            {pendingNeeds.length > 0 && (
              <span style={{ 
                backgroundColor: '#FFD166', 
                color: 'white', 
                padding: '2px 6px', 
                borderRadius: 10, 
                fontSize: 12,
                marginLeft: 'auto'
              }}>
                {pendingNeeds.length}
              </span>
            )}
          </button>
          <button 
            style={tabButtonStyle(activeTab === 'analytics')}
            onClick={() => setActiveTab('analytics')}
          >
            <span style={{ fontSize: 20 }}>📊</span>
            Analytics
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={mainContentStyle}>
        {/* Header */}
        <div style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e5e7eb', 
          padding: 24 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 24, color: '#1f2937', fontFamily: 'var(--font-quicksand)', fontWeight: 700 }}>
                {activeTab === 'members' ? 'Giftings Inventory' : 
                 activeTab === 'pending' ? 'Pending Member Approvals' :
                 activeTab === 'needs' ? 'Pending Needs' : 
                 'Analytics'}
              </h1>
              <p style={{ margin: 0, color: '#6b7280' }}>
                {activeTab === 'members' 
                  ? 'Manage member giftings and opportunities' 
                  : activeTab === 'pending'
                  ? 'Review and approve new member requests'
                  : activeTab === 'needs'
                  ? 'Review and approve community needs'
                  : 'Track community engagement'
                }
              </p>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              style={{ 
                backgroundColor: '#f3f4f6', 
                border: '1px solid #d1d5db', 
                padding: '8px 16px', 
                borderRadius: 6, 
                cursor: 'pointer' 
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {/* Pending Alerts */}
          {(pendingMembers.length > 0 || pendingNeeds.length > 0) && (
            <div style={{ 
              backgroundColor: '#fff7ed', 
              border: '1px solid #FFD166', 
              borderRadius: 8, 
              padding: 16, 
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <AlertTriangle size={24} />
              <div>
                <h3 style={{ margin: '0 0 4px', color: '#FFD166', fontFamily: 'var(--font-quicksand)', fontWeight: 700 }}>Pending Review</h3>
                <p style={{ margin: '0 0 12px', color: '#FFD166' }}>
                  {pendingMembers.length} member requests and {pendingNeeds.length} community needs waiting for approval
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {pendingMembers.length > 0 && (
                    <button 
                      onClick={() => setActiveTab('pending')}
                      style={{ 
                        backgroundColor: '#FFD166', 
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
                  {pendingNeeds.length > 0 && (
                    <button 
                      onClick={() => setActiveTab('needs')}
                      style={{ 
                        backgroundColor: '#FFD166', 
                        color: 'white', 
                        border: 'none', 
                        padding: '6px 12px', 
                        borderRadius: 4, 
                        cursor: 'pointer' 
                      }}
                    >
                      Review Needs ({pendingNeeds.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Community Health Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 24, 
            marginBottom: 24 
          }}>
            <div style={{ 
              backgroundColor: 'white', 
              padding: 24, 
              borderRadius: 8, 
              border: '1px solid #e5e7eb' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  backgroundColor: '#dcfce7', 
                  borderRadius: 8, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Heart size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-quicksand)', fontWeight: 700 }}>Active Members</h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>Completed profiles</p>
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1f2937' }}>
                {members.length}
              </div>
            </div>

            <div style={{ 
              backgroundColor: 'white', 
              padding: 24, 
              borderRadius: 8, 
              border: '1px solid #e5e7eb' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  backgroundColor: '#fff7ed', 
                  borderRadius: 8, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <span style={{ fontSize: 20 }}>👤</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-quicksand)', fontWeight: 700 }}>Pending Members</h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>Awaiting approval</p>
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1f2937' }}>
                {pendingMembers.length}
              </div>
            </div>

            <div style={{ 
              backgroundColor: 'white', 
              padding: 24, 
              borderRadius: 8, 
              border: '1px solid #e5e7eb' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  backgroundColor: '#f0fdfa', 
                  borderRadius: 8, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <span style={{ fontSize: 20 }}>📋</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-quicksand)', fontWeight: 700 }}>Pending Needs</h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>Awaiting approval</p>
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1f2937' }}>
                {pendingNeeds.length}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'members' && (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: 8, 
              border: '1px solid #e5e7eb' 
            }}>
              <div style={{ padding: 24, borderBottom: '1px solid #e5e7eb' }}>
                <input
                  type="text"
                  placeholder="Search by name, location, or gifting..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: 12, 
                    border: '1px solid #d1d5db', 
                    borderRadius: 8,
                    fontSize: 16
                  }}
                />
              </div>

              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {filteredMembers.map((member) => (
                    <div key={member.id} style={{ 
                      border: '1px solid #e5e7eb', 
                      borderRadius: 8, 
                      padding: 16 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{member.full_name}</h3>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            {member.gift_selections?.map((gift: string) => (
                              <span key={gift} style={{ 
                                backgroundColor: '#f0fdfa', 
                                color: '#2BB3A3', 
                                padding: '4px 8px', 
                                borderRadius: 4, 
                                fontSize: 12 
                              }}>
                                {gift}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: 14, color: '#6b7280' }}>
                            <p style={{ margin: '2px 0' }}>📧 {member.email}</p>
                            <p style={{ margin: '2px 0' }}>📍 {member.city}</p>
                            <p style={{ margin: '2px 0' }}>🎯 {member.availability_level}</p>
                          </div>
                        </div>
                        <button style={{ 
                          backgroundColor: '#f3f4f6', 
                          border: '1px solid #d1d5db', 
                          padding: '6px 12px', 
                          borderRadius: 4, 
                          cursor: 'pointer' 
                        }}>
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pending' && (
            <div>
              <h3>Pending Member Approvals</h3>
              {pendingMembers.map(member => (
                <div key={member.id} style={{ border: '1px solid #e5e7eb', padding: 16, margin: '8px 0', borderRadius: 8 }}>
                  <h4>{member.profiles?.full_name || 'Name not provided'}</h4>
                  <p>Email: {member.profiles?.email}</p>
                  <p>Requested Role: {member.role}</p>
                  <p>Applied: {new Date(member.created_at).toLocaleDateString()}</p>
                  <div style={{ marginTop: 12 }}>
                    <button 
                      onClick={() => approveMember(member.id)}
                      style={{ backgroundColor: '#2BB3A3', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, marginRight: 8, cursor: 'pointer' }}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => denyMember(member.id)}
                      style={{ backgroundColor: '#FF6B6B', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'needs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {pendingNeeds.map((need) => (
                <div key={need.id} style={{ 
                  backgroundColor: 'white', 
                  borderRadius: 8, 
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden'
                }}>
                  {need.is_urgent && (
                    <div style={{ 
                      backgroundColor: '#fff5f5', 
                      borderLeft: '4px solid #FF6B6B', 
                      padding: 12, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8 
                    }}>
                      <AlertTriangle size={20} />
                      <span style={{ color: '#FF6B6B', fontWeight: 600 }}>Urgent Need</span>
                    </div>
                  )}

                  <div style={{ padding: 24 }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>{need.title}</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>
                      Submitted {new Date(need.created_at).toLocaleDateString()}
                    </p>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ marginBottom: 8 }}>
                        <Calendar size={16} className='mr-1' /> {need.date_time ? new Date(need.date_time).toLocaleString() : 'Flexible timing'}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Users size={16} className='mr-1' /> {need.people_needed} people needed
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        📍 {need.location}
                      </div>
                      <div>
                        🎯 Skills: {need.giftings_needed}
                      </div>
                    </div>

                    {need.description && (
                      <div style={{ 
                        backgroundColor: '#f9fafb', 
                        padding: 12, 
                        borderRadius: 6, 
                        marginBottom: 16 
                      }}>
                        <p style={{ margin: 0, fontSize: 14 }}>{need.description}</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => approveNeed(need.id)}
                        style={{ 
                          backgroundColor: '#2BB3A3', 
                          color: 'white', 
                          border: 'none', 
                          padding: '8px 16px', 
                          borderRadius: 6, 
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        ✅ Approve & Post
                      </button>
                      <button 
                        onClick={() => declineNeed(need.id)}
                        style={{ 
                          backgroundColor: '#FF6B6B', 
                          color: 'white', 
                          border: 'none', 
                          padding: '8px 16px', 
                          borderRadius: 6, 
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        ❌ Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {pendingNeeds.length === 0 && (
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: 48, 
                  borderRadius: 8, 
                  border: '1px solid #e5e7eb',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>All Caught Up!</h3>
                  <p style={{ margin: 0, color: '#6b7280' }}>No pending needs to review at the moment.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div style={{ 
              backgroundColor: 'white', 
              padding: 48, 
              borderRadius: 8, 
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Analytics Coming Soon</h3>
              <p style={{ margin: 0, color: '#6b7280' }}>
                Detailed analytics and reporting features will be available in a future update.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
