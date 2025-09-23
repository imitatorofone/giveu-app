'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { 
  Crown, 
  Users, 
  ClipboardList, 
  CheckCircle, 
  XCircle, 
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  Bell,
  LogOut,
  Eye,
  Settings
} from 'lucide-react';
import Footer from '../../components/Footer';
import toast from 'react-hot-toast';

// Brand typography
const quicksandFont = 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif';
const merriweatherFont = 'Merriweather, Georgia, serif';

interface PendingNeed {
  id: string;
  title: string;
  description: string;
  location: string;
  urgency: string;
  specific_date?: string;
  specific_time?: string;
  people_needed: number;
  giftings_needed: string[];
  created_at: string;
  user_id: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  city: string;
  gift_selections: string[];
  availability: string[];
  is_leader: boolean;
}

export default function LeaderPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pendingNeeds, setPendingNeeds] = useState<PendingNeed[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'needs' | 'users'>('overview');
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

      // Load data
      await Promise.all([
        fetchPendingNeeds(),
        fetchUsers()
      ]);

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
      toast.error('Failed to load pending needs');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleApproveNeed = async (needId: string) => {
    try {
      const { error } = await supabase
        .from('needs')
        .update({ status: 'active' })
        .eq('id', needId);

      if (error) throw error;
      
      toast.success('Need approved and published!');
      fetchPendingNeeds();
    } catch (error) {
      console.error('Error approving need:', error);
      toast.error('Failed to approve need');
    }
  };

  const handleRejectNeed = async (needId: string) => {
    try {
      const { error } = await supabase
        .from('needs')
        .update({ status: 'rejected' })
        .eq('id', needId);

      if (error) throw error;
      
      toast.success('Need rejected');
      fetchPendingNeeds();
    } catch (error) {
      console.error('Error rejecting need:', error);
      toast.error('Failed to reject need');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f9fafb', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ color: '#6b7280', fontFamily: quicksandFont }}>
          Loading leadership dashboard...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#f9fafb', 
      minHeight: '100vh', 
      paddingBottom: '80px',
      fontFamily: merriweatherFont
    }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#20c997] text-white px-4 py-2 rounded-lg font-semibold">
              giveU
            </div>
            <div className="flex items-center gap-2">
              <Crown size={20} color="#3b82f6" />
              <span className="text-lg font-semibold text-gray-900">Leadership Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <Eye size={20} />
            </button>
            <button 
              onClick={() => router.push('/profile')}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/');
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div className="bg-white px-6 pt-6 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leadership Dashboard</h1>
        <p className="text-gray-600">Manage community needs and members</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white px-6 pb-6 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'bg-[#20c997] text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('needs')}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
              activeTab === 'needs'
                ? 'bg-[#20c997] text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending Needs ({pendingNeeds.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
              activeTab === 'users'
                ? 'bg-[#20c997] text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Community Members ({users.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardList size={24} color="#3b82f6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{pendingNeeds.length}</p>
                    <p className="text-sm text-gray-600">Pending Needs</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users size={24} color="#20c997" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                    <p className="text-sm text-gray-600">Community Members</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Crown size={24} color="#8b5cf6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.is_leader).length}</p>
                    <p className="text-sm text-gray-600">Leaders</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {pendingNeeds.length > 0 ? (
                <div className="space-y-3">
                  {pendingNeeds.slice(0, 3).map((need) => (
                    <div key={need.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <ClipboardList size={16} color="#6b7280" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{need.title}</p>
                        <p className="text-sm text-gray-600">Submitted {formatDate(need.created_at)}</p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'needs' && (
          <div className="space-y-4">
            {pendingNeeds.length === 0 ? (
              <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
                <ClipboardList size={48} color="#d1d5db" className="mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Needs</h3>
                <p className="text-gray-500">All needs have been reviewed and processed.</p>
              </div>
            ) : (
              pendingNeeds.map((need) => (
                <div key={need.id} className="bg-white rounded-xl border shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{need.title}</h3>
                      <p className="text-gray-600 mb-3">{need.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>{need.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>{need.people_needed} people needed</span>
                        </div>
                        {need.specific_date && (
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{formatDate(need.specific_date)}</span>
                          </div>
                        )}
                        {need.specific_time && (
                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>{formatTime(need.specific_time)}</span>
                          </div>
                        )}
                      </div>

                      {need.giftings_needed && need.giftings_needed.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {need.giftings_needed.map((gift, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-[#20c997] text-white text-sm rounded-full"
                            >
                              {gift}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveNeed(need.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#20c997] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      <CheckCircle size={16} />
                      Approve & Post
                    </button>
                    <button
                      onClick={() => handleRejectNeed(need.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#20c997] rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {user.full_name || 'Unnamed User'}
                        {user.is_leader && (
                          <Crown size={16} color="#3b82f6" className="inline ml-2" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.city && (
                        <p className="text-sm text-gray-500">{user.city}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {user.gift_selections && user.gift_selections.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-end mb-2">
                        {user.gift_selections.slice(0, 3).map((gift, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {gift}
                          </span>
                        ))}
                        {user.gift_selections.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            +{user.gift_selections.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.is_leader 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.is_leader ? 'Leader' : 'Member'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}