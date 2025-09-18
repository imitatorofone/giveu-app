'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ClientOnly from '../_clientOnly';
import { Users, AlertTriangle, CheckCircle, Heart, Calendar, Clock, UserPlus, ClipboardList, BookOpen, Home, MessageCircle, CalendarDays, Mail, MapPin, User, Plus, Eye, Crown, Bell, LogOut } from 'lucide-react';
import { FeedbackModal } from '../components/FeedbackModal';
import { FeedbackList } from '../components/FeedbackList';
import { FeedbackButton } from '../components/FeedbackButton';
import NotificationBell from '../components/NotificationBell';

// PendingNeedsComponent - Enhanced Version
const PendingNeedsComponent = () => {
  const [pendingNeeds, setPendingNeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [actionedNeed, setActionedNeed] = useState<any>(null);

  useEffect(() => {
    fetchPendingNeeds();
  }, []);

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
      const need = pendingNeeds.find(n => n.id === needId);
      const { error } = await supabase
        .from('needs')
        .update({ status: 'approved' })
        .eq('id', needId);

      if (error) throw error;
      
      setActionedNeed(need);
      setShowApprovalModal(true);
      fetchPendingNeeds();
    } catch (error) {
      console.error('Error approving need:', error);
      alert('Error approving need. Please try again.');
    }
  };

  const handleReject = async (needId: string) => {
    try {
      const need = pendingNeeds.find(n => n.id === needId);
      const { error } = await supabase
        .from('needs')
        .update({ status: 'rejected' })
        .eq('id', needId);

      if (error) throw error;
      
      setActionedNeed(need);
      setShowRejectionModal(true);
      fetchPendingNeeds();
    } catch (error) {
      console.error('Error rejecting need:', error);
      alert('Error rejecting need. Please try again.');
    }
  };

  const formatGiftings = (giftingsNeeded: any) => {
    if (Array.isArray(giftingsNeeded)) {
      return giftingsNeeded;
    }
    if (typeof giftingsNeeded === 'string') {
      return giftingsNeeded.split(', ').filter(Boolean);
    }
    return [];
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          Loading pending needs...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#ffffff', minHeight: '500px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#1f2937', 
          margin: '0 0 8px 0' 
        }}>
          Pending Needs Review
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '0 0 16px 0',
          fontSize: '14px'
        }}>
          Review and approve community needs before they appear on Ways to Serve
        </p>
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280',
          margin: 0
        }}>
          {pendingNeeds.length} need{pendingNeeds.length !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {/* Cards Container */}
      {pendingNeeds.length === 0 ? (
        <div style={{ 
          backgroundColor: 'white',
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '48px', 
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ fontSize: '18px', color: '#1f2937', margin: '0 0 8px 0' }}>All caught up!</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>No pending needs to review at this time.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '20px',
          maxWidth: '1000px'
        }}>
          {pendingNeeds.map((need, index) => (
            <div 
              key={need.id} 
              style={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb', 
                borderRadius: '6px', 
                padding: '20px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                transition: 'box-shadow 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }}
            >
                {/* Title */}
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '500',
                  color: '#1f2937',
                  margin: '0 0 20px 0',
                  lineHeight: '1.4'
                }}>
                  {need.title}
                </h3>
                
                {/* Three Column Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: '16px', 
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  {/* Date Column */}
                  <div>
                    <div style={{ 
                      width: '28px', 
                      height: '28px', 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto 8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <Calendar size={14} style={{ color: '#6b7280' }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.3' }}>
                      <div>{need.urgency === 'ongoing' ? 'Ongoing starting' : 'This Saturday'}</div>
                      <div>{need.urgency === 'ongoing' ? '2025-10-05' : '2-5pm'}</div>
                    </div>
                  </div>

                  {/* Location Column */}
                  <div>
                    <div style={{ 
                      width: '28px', 
                      height: '28px', 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto 8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <MapPin size={14} style={{ color: '#6b7280' }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.3' }}>
                      <div>{need.city || need.location || 'Church'}</div>
                      <div>Location</div>
                    </div>
                  </div>

                  {/* People Column */}
                  <div>
                    <div style={{ 
                      width: '28px', 
                      height: '28px', 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto 8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <Users size={14} style={{ color: '#6b7280' }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.3' }}>
                      <div>0 committed</div>
                      <div>{need.people_needed}+ needed</div>
                    </div>
                  </div>
              </div>

                {/* Description */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#374151', 
                    lineHeight: '1.5',
                    margin: '0 0 8px 0'
                  }}>
                    {need.description ? need.description.split('Ongoing Schedule:')[0].trim() : 'No description available'}
                  </p>
                  {need.urgency === 'ongoing' && need.description && need.description.includes('Ongoing Schedule:') && (
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#2563eb', 
                      margin: 0,
                      fontStyle: 'italic'
                    }}>
                      Schedule: {need.description.split('Ongoing Schedule:')[1]?.replace('Starting ', '').trim()}
                    </p>
                  )}
                </div>

                {/* Skills Tags */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {formatGiftings(need.giftings_needed).slice(0, 3).map((skill, skillIndex) => (
                      <span 
                        key={skillIndex}
                        style={{
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          border: '1px solid #bbf7d0',
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                    {formatGiftings(need.giftings_needed).length > 3 && (
                      <span style={{
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        border: '1px solid #d1d5db',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px'
                      }}>
                        +{formatGiftings(need.giftings_needed).length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleApprove(need.id)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.backgroundColor = '#059669';
                      (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                      (e.target as HTMLElement).style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.backgroundColor = '#10b981';
                      (e.target as HTMLElement).style.transform = 'translateY(0)';
                      (e.target as HTMLElement).style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    ✓ Approve & Publish
                  </button>
                  <button
                    onClick={() => handleReject(need.id)}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: 'white',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.backgroundColor = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.backgroundColor = 'white';
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Approval Success Modal */}
      {showApprovalModal && actionedNeed && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#dcfce7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <svg width="32" height="32" fill="none" stroke="#16a34a" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0' }}>
                Need Approved Successfully!
              </h3>
              
              <p style={{ color: '#6b7280', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                <strong>"{actionedNeed.title}"</strong> has been approved and published to the Ways to Serve board. 
                Volunteers with matching skills have been notified.
              </p>
              
              <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '6px', margin: '0 0 24px 0' }}>
                <p style={{ fontSize: '14px', color: '#0369a1', margin: 0 }}>
                  <strong>Next steps:</strong> Volunteers will see this opportunity and can respond with "I Can Help". 
                  You'll receive notifications as people commit to serve.
                </p>
              </div>
              
              <button
                onClick={() => setShowApprovalModal(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Great! Continue Reviewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && actionedNeed && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#fef2f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <svg width="32" height="32" fill="none" stroke="#dc2626" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0' }}>
                Need Rejected
              </h3>
              
              <p style={{ color: '#6b7280', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                <strong>"{actionedNeed.title}"</strong> has been rejected and will not appear on the Ways to Serve board.
              </p>
              
              <button
                onClick={() => setShowRejectionModal(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Continue Reviewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Complete GIFTING_CATEGORIES constant
const GIFTING_CATEGORIES = {
  'Hands-On Skills': {
    color: '#1e40af',
    bgColor: '#dbeafe',
    borderColor: '#bfdbfe',
    tags: ['Carpentry', 'Repairs', 'Gardening', 'Sewing', 'Decorating', 'Setup/Tear Down', 'Cooking', 'Automotive', 'Painting', 'Maintenance', 'Construction', 'Landscaping', 'Cleaning', 'Organization']
  },
  'People & Relationships': {
    color: '#7c3aed',
    bgColor: '#e9d5ff',
    borderColor: '#c4b5fd',
    tags: ['Hospitality', 'Listening', 'Mentoring', 'Counseling', 'Welcoming', 'Hosting', 'Relationship Building', 'Conflict Resolution', 'Pastoral Care']
  },
  'Problem-Solving & Organizing': {
    color: '#374151',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
    tags: ['Planning', 'Budgeting', 'Logistics', 'Strategy', 'Administration', 'Research', 'Project Management', 'Systems Thinking', 'Analysis']
  },
  'Care & Comfort': {
    color: '#be185d',
    bgColor: '#fce7f3',
    borderColor: '#f9a8d4',
    tags: ['Visiting Sick', 'Meal Prep', 'Childcare', 'Encouragement', 'Prayer', 'Compassion Care', 'Elder Care', 'Grief Support', 'Healing Ministry']
  },
  'Learning & Teaching': {
    color: '#4338ca',
    bgColor: '#e0e7ff',
    borderColor: '#c7d2fe',
    tags: ['Tutoring', 'Bible Study Leading', 'Coaching', 'Skill Training', 'Public Speaking', 'Mentoring', 'Workshop Leading', 'Curriculum Development', 'Education']
  },
  'Creativity & Expression': {
    color: '#be123c',
    bgColor: '#ffe4e6',
    borderColor: '#fecaca',
    tags: ['Art', 'Music', 'Writing', 'Photography', 'Design', 'Storytelling', 'Drama', 'Dance', 'Creative Arts']
  },
  'Leadership & Motivation': {
    color: '#d97706',
    bgColor: '#fef3c7',
    borderColor: '#fed7aa',
    tags: ['Facilitating Groups', 'Casting Vision', 'Mentoring Teams', 'Event Leadership', 'Preaching', 'Strategic Planning', 'Team Building', 'Public Speaking', 'Motivation']
  },
  'Behind-the-Scenes Support': {
    color: '#475569',
    bgColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    tags: ['Tech Support', 'AV Production', 'Finance', 'Cleaning', 'Setup Crew', 'Admin Tasks', 'Data Entry', 'Communication', 'Operations']
  },
  'Physical & Active': {
    color: '#059669',
    bgColor: '#d1fae5',
    borderColor: '#a7f3d0',
    tags: ['Sports Coaching', 'Outdoor Projects', 'Moving Help', 'Fitness Activities', 'Recreation Leading', 'Disaster Relief', 'Security', 'Transportation', 'Physical Labor']
  },
  'Pioneering & Connecting': {
    color: '#ea580c',
    bgColor: '#fed7aa',
    borderColor: '#fdba74',
    tags: ['Evangelism', 'Community Outreach', 'Starting Ministries', 'Networking', 'Fundraising', 'Advocacy', 'Mission Work', 'Connecting People', 'Innovation']
  }
};

// Updated getCategoryForTag function to be more robust
const getCategoryForTag = (tag: string) => {
  if (!tag || typeof tag !== 'string') {
    return { name: 'Unknown', color: '#6b7280', bgColor: '#f3f4f6', borderColor: '#d1d5db' };
  }
  
  // Clean up the tag (trim whitespace, handle case variations)
  const cleanTag = tag.trim();
  
  for (const [categoryName, categoryInfo] of Object.entries(GIFTING_CATEGORIES)) {
    // Check for exact match first
    if (categoryInfo.tags.includes(cleanTag)) {
      return { name: categoryName, ...categoryInfo };
    }
    
    // Check for case-insensitive match
    const lowerTag = cleanTag.toLowerCase();
    const foundTag = categoryInfo.tags.find(t => t.toLowerCase() === lowerTag);
    if (foundTag) {
      return { name: categoryName, ...categoryInfo };
    }
  }
  
  // Default fallback
  return { name: 'Other', color: '#6b7280', bgColor: '#f3f4f6', borderColor: '#d1d5db' };
};

// Your types
type Member = {
  id: string;
  full_name: string | null;
  email: string | null;
  city: string | null;
  gift_selections: string[] | string | null;
  availability_level: string | null;
  age: number | null;
  phone: string | null;
  is_leader?: boolean;
};

// Safe MemberCard component
const SafeMemberCard = ({ user }: { user: Member | null }) => {
  if (!user) {
    return (
      <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 12, backgroundColor: 'white' }}>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>Loading member...</div>
                    </div>
    );
  }

  const giftSelections = Array.isArray(user.gift_selections) ? user.gift_selections : [];
  const initials = user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

  return (
    <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 12, backgroundColor: 'white' }}>
      {/* Avatar */}
                      <div style={{
        width: 60, 
        height: 60, 
                          borderRadius: '50%',
        backgroundColor: '#20c997', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
        fontSize: 24, 
        fontWeight: 'bold',
        marginBottom: 16
      }}>
        {initials}
                      </div>

      <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600 }}>{user?.full_name || 'Unknown Member'}</h3>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Mail size={14} style={{ color: '#6b7280' }} />
        <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>{user?.email || 'No email'}</p>
                            </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <MapPin size={14} style={{ color: '#6b7280' }} />
        <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>{user?.city || 'No location'}</p>
                          </div>

      {giftSelections.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {giftSelections.slice(0, 3).map((gift: string) => {
                              const categoryInfo = getCategoryForTag(gift);
                              return (
                                <span 
                                  key={gift}
                                  style={{ 
                                    backgroundColor: categoryInfo.bgColor,
                                    color: categoryInfo.color,
                                    border: `1px solid ${categoryInfo.borderColor}`,
                  padding: '4px 8px',
                  borderRadius: 16,
                  fontSize: 12,
                  marginRight: '8px',
                  marginBottom: '4px',
                  display: 'inline-block'
                }}
                                >
                                  {gift}
                                </span>
                              );
                            })}
                        </div>
                      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <CheckCircle size={14} style={{ color: '#20c997' }} />
                        <span style={{
          backgroundColor: '#dcfce7', 
          color: '#166534', 
          padding: '2px 8px', 
          borderRadius: 12, 
          fontSize: 12,
          fontWeight: 500
                        }}>
                          Active Member
                        </span>
                      </div>

      <button style={{ 
                        display: 'flex', 
        alignItems: 'center', 
        gap: 6, 
                            width: '100%',
                            padding: '10px 16px', 
        backgroundColor: '#f9fafb', 
        border: '1px solid #e5e7eb', 
                            borderRadius: 8, 
        color: '#6b7280', 
        fontSize: 14,
                            cursor: 'pointer',
        justifyContent: 'center'
      }}>
        <Eye size={16} />
                          View Profile
                        </button>
                      </div>
  );
};

export default function Page() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [needs, setNeeds] = useState<any[]>([]);
  const [recentResponses, setRecentResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Test connection function
  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count');
      console.log('DB connection test:', data, error);
    } catch (err) {
      console.error('DB connection error:', err);
    }
  };

  // Fetch profiles function
  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, city, gift_selections, availability_level, age, phone, is_leader');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
  };

  // Fetch recent volunteer responses
  const fetchRecentResponses = async () => {
    try {
      console.log('Fetching responses...')
      
      // First, get the responses without joins
      const { data: responses, error } = await supabase
        .from('opportunity_responses')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      console.log('Responses:', responses)
      
      if (error) {
        console.error('Query failed:', error.message)
        setRecentResponses([])
        return
      }
      
      // For now, just show the raw responses
      setRecentResponses(responses || [])
      
    } catch (error) {
      console.error('Error fetching responses:', error)
      setRecentResponses([])
    }
  };

  // Accept a volunteer response
  const acceptResponse = async (responseId: string) => {
    try {
      const { error } = await supabase
        .from('opportunity_responses')
        .update({ status: 'accepted' })
        .eq('id', responseId);

      if (error) throw error;
      
      // Refresh responses
      fetchRecentResponses();
      alert('Response accepted!');
    } catch (error) {
      console.error('Error accepting response:', error);
      alert('Error accepting response. Please try again.');
    }
  };

  // Decline a volunteer response
  const declineResponse = async (responseId: string) => {
    try {
      const { error } = await supabase
        .from('opportunity_responses')
        .update({ status: 'declined' })
        .eq('id', responseId);

      if (error) throw error;
      
      // Refresh responses
      fetchRecentResponses();
      alert('Response declined.');
    } catch (error) {
      console.error('Error declining response:', error);
      alert('Error declining response. Please try again.');
    }
  };

  // Your useEffect hooks
  useEffect(() => {
    console.log('Leader page mounting...');
    setIsClient(true);
    testConnection();
  }, []);

  useEffect(() => {
    if (!authLoading && user && profile && profile?.full_name === 'Harmony Mitchell') {
      fetchProfiles().then(data => {
        setMembers(data || []);
        setProfilesLoading(false);
      }).catch(error => {
        console.error('Error fetching profiles:', error);
        setMembers([]);
        setProfilesLoading(false);
      });
      
      // Fetch recent responses
      fetchRecentResponses();
    }
  }, [authLoading, user, profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
      return;
    }
  }, [authLoading, user]);

  // Debug logging
  console.log('🎯 Active tab:', activeTab);
  
  // Simple return statement
    return (
      <ClientOnly>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Single Clean Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 24px', 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          {/* Left - Logo only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img 
              src="/logo.svg" 
              alt="ENGAGE" 
              style={{ width: 32, height: 32 }}
            />
            <span style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              fontFamily: 'var(--font-quicksand)',
              color: '#1f2937'
            }}>
              ENGAGE
                          </span>
                        </div>

          {/* Right - Actions only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user && (
              <NotificationBell userId={user.id} />
            )}
            
            {/* Back to Home button for leaders */}
                            <button
              onClick={() => window.location.href = '/'}
                              style={{
                                padding: '8px 16px',
                backgroundColor: 'transparent', 
                border: '1px solid #d1d5db', 
                                borderRadius: 6,
                color: '#6b7280', 
                                fontSize: 14,
                fontFamily: 'var(--font-quicksand)',
                cursor: 'pointer'
                              }}
                            >
              ← Back to Home
                            </button>

                            <button
              onClick={() => supabase.auth.signOut()}
                              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px', 
                backgroundColor: 'transparent', 
                                border: 'none',
                color: '#6b7280', 
                                fontSize: 14,
                fontFamily: 'var(--font-quicksand)',
                cursor: 'pointer'
                              }}
                            >
              <LogOut size={16} />
              Sign out
                            </button>
                          </div>
                      </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flex: 1 }}>
          {/* Simple Sidebar */}
          <div style={{ width: 250, backgroundColor: '#f8f9fa', padding: 20, borderRight: '1px solid #e5e7eb', minHeight: 'calc(100vh - 60px)' }}>
          
          <div style={{ marginBottom: 10 }}>
                        <button 
              onClick={() => setActiveTab('overview')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                width: '100%', 
                padding: '12px 16px', 
                marginBottom: 4, 
                backgroundColor: activeTab === 'overview' ? '#e0f2fe' : 'transparent',
                color: activeTab === 'overview' ? '#0891b2' : '#6b7280',
                border: 'none',
                borderRadius: 6,
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <Home size={18} />
              Overview
                        </button>
            
                        <button 
              onClick={() => setActiveTab('members')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                width: '100%', 
                padding: '12px 16px', 
                marginBottom: 4, 
                backgroundColor: activeTab === 'members' ? '#e0f2fe' : 'transparent',
                color: activeTab === 'members' ? '#0891b2' : '#6b7280',
                border: 'none',
                borderRadius: 6,
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <Users size={18} />
              Members
                        </button>
            
                    <button 
              onClick={() => setActiveTab('needs')}
                      style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                width: '100%', 
                padding: '12px 16px', 
                marginBottom: 4, 
                backgroundColor: activeTab === 'needs' ? '#e0f2fe' : 'transparent',
                color: activeTab === 'needs' ? '#0891b2' : '#6b7280',
                        border: 'none',
                borderRadius: 6,
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <ClipboardList size={18} />
              Needs
                    </button>
            
                    <button 
              onClick={() => setActiveTab('pending')}
                      style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                width: '100%', 
                padding: '12px 16px', 
                marginBottom: 4, 
                backgroundColor: activeTab === 'pending' ? '#e0f2fe' : 'transparent',
                color: activeTab === 'pending' ? '#0891b2' : '#6b7280',
                        border: 'none',
                borderRadius: 6,
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <Clock size={18} />
              Pending
            </button>
            
            <button style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', marginBottom: 4, backgroundColor: 'transparent', color: '#6b7280', border: 'none', borderRadius: 6, textAlign: 'left', cursor: 'pointer' }}>
              <Heart size={18} />
              Opportunities
            </button>
            
            <button style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', marginBottom: 4, backgroundColor: 'transparent', color: '#6b7280', border: 'none', borderRadius: 6, textAlign: 'left', cursor: 'pointer' }}>
              <Calendar size={18} />
              Calendar
            </button>
            
            <button style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', marginBottom: 4, backgroundColor: 'transparent', color: '#6b7280', border: 'none', borderRadius: 6, textAlign: 'left', cursor: 'pointer' }}>
              <MessageCircle size={18} />
              Feedback
                    </button>
                  </div>
                </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: 20 }}>
            {activeTab === 'overview' && (
              <div>
                <div style={{ marginBottom: 30 }}>
                  <div style={{ marginBottom: 10 }}>
                    <h1 style={{ margin: 0, fontSize: 28, color: '#1f2937', fontFamily: 'var(--font-quicksand)', fontWeight: 700 }}>Leader Overview</h1>
                        </div>
                  <h2 style={{ margin: 0, fontSize: 18, color: '#6b7280', fontWeight: 'normal', fontFamily: 'var(--font-merriweather)' }}>Welcome back, Harmony Mitchell!</h2>
                      </div>

                {/* Move stat cards here - in main content area */}
                <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
                  <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: 'white', minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Users size={18} style={{ color: '#20c997' }} />
                      <h3 style={{ margin: 0, fontSize: 16, color: '#1f2937' }}>Active Members</h3>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#9ca3af' }}>Completed profiles</p>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1f2937' }}>3</div>
                </div>
                  
                  <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: 'white', minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Clock size={18} style={{ color: '#f59e0b' }} />
                      <h3 style={{ margin: 0, fontSize: 16, color: '#1f2937' }}>Pending Members</h3>
              </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#9ca3af' }}>Awaiting approval</p>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1f2937' }}>0</div>
                  </div>
                  
                  <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: 'white', minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <ClipboardList size={18} style={{ color: '#3b82f6' }} />
                      <h3 style={{ margin: 0, fontSize: 16, color: '#1f2937' }}>Pending Needs</h3>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#9ca3af' }}>Awaiting approval</p>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1f2937' }}>0</div>
                </div>
              </div>

                {/* Opportunities section */}
                <div>
                  <h2 style={{ marginBottom: 20, fontSize: 24 }}>Opportunities Matching Your Gifts</h2>
                <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: 'white', marginBottom: 20 }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>Community Meal Preparation</h3>
                  <p style={{ color: '#6b7280', marginBottom: 15 }}>Help prepare meals for families in need</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 15 }}>
                    <span style={{ padding: '4px 8px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: 16, fontSize: 12 }}>Hands-On Skills</span>
                    <span style={{ padding: '4px 8px', backgroundColor: '#e9d5ff', color: '#6b21a8', borderRadius: 16, fontSize: 12 }}>People & Relationships</span>
              </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                    <Calendar size={14} />
                    <span>This Saturday 2-5pm</span>
                    <span>•</span>
                    <MapPin size={14} />
                    <span>Church Kitchen</span>
                  </div>
                  <button style={{ backgroundColor: '#20c997', color: 'white', padding: '8px 16px', borderRadius: 6, border: 'none' }}>I Can Help</button>
                </div>
                
                <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <h3 style={{ margin: 0 }}>Youth Mentorship Program</h3>
                    <span style={{ padding: '2px 8px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: 12, fontSize: 11, fontWeight: 'bold' }}>Urgent</span>
                </div>
                  <p style={{ color: '#6b7280', marginBottom: 15 }}>Guide and encourage teenagers in their faith journey</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 15 }}>
                    <span style={{ padding: '4px 8px', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: 16, fontSize: 12 }}>Learning & Teaching</span>
                    <span style={{ padding: '4px 8px', backgroundColor: '#e9d5ff', color: '#6b21a8', borderRadius: 16, fontSize: 12 }}>People & Relationships</span>
              </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                    <Calendar size={14} />
                    <span>Ongoing - Weekly meetings</span>
                    <span>•</span>
                    <MapPin size={14} />
                    <span>Youth Center</span>
          </div>
                  <button style={{ backgroundColor: '#20c997', color: 'white', padding: '8px 16px', borderRadius: 6, border: 'none' }}>I Can Help</button>
        </div>
      </div>

              {/* Recent Volunteer Responses */}
              <div style={{ marginTop: 40 }}>
                <h2 style={{ marginBottom: 20, fontSize: 24 }}>Recent Volunteer Responses</h2>
                {recentResponses.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(() => {
                      // Group responses by need_id
                      const responsesByNeed = recentResponses.reduce((acc, r) => {
                        acc[r.need_id] = (acc[r.need_id] || 0) + 1;
                        return acc;
                      }, {});

                      // Get unique need_ids
                      const uniqueNeedIds = [...new Set(recentResponses.map(r => r.need_id))];

                      return uniqueNeedIds.map(needId => (
                        <div key={needId} style={{ 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px', 
                          padding: '16px', 
                          marginBottom: '12px',
                          backgroundColor: '#f8fafc'
                        }}>
                          <strong>Need ID {needId}</strong>
                          <div style={{ fontSize: '18px', color: '#10b981', fontWeight: 'bold' }}>
                            {responsesByNeed[needId]} volunteers committed
            </div>
                </div>
                      ));
                    })()}
                </div>
                ) : (
                      <div style={{
                    padding: 40, 
                    border: '1px solid #e5e7eb', 
                        borderRadius: 8,
                    backgroundColor: 'white',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    <CheckCircle size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
                    <p style={{ margin: 0, fontSize: 16 }}>No pending volunteer responses</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: 14 }}>When members click "I Can Help" on opportunities, their responses will appear here.</p>
                    </div>
                  )}
                      </div>
                    </div>
                  )}

          {activeTab === 'members' && (
                      <div>
              <div style={{ marginBottom: 30 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 28, color: '#1f2937', fontFamily: 'var(--font-quicksand)', fontWeight: 700 }}>Community Members</h1>
                    <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontFamily: 'var(--font-merriweather)' }}>Manage member profiles and giftings</p>
                        </div>
                      </div>
                    </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 24 }}>Community Members</h2>
                <button style={{ 
                        display: 'flex',
                        alignItems: 'center',
                  gap: 8, 
                  padding: '10px 16px', 
                  backgroundColor: '#20c997', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 6, 
                  fontSize: 14,
                  cursor: 'pointer'
                }}>
                  <Plus size={16} />
                  Add Members
                </button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: 12, top: 12, color: '#9ca3af' }} />
                  <input 
                    type="text"
                    placeholder="Search by name, location, or gifting..."
                          style={{ 
                      width: '100%', 
                      padding: '12px 12px 12px 40px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: 8, 
                      fontSize: 14,
                      outline: 'none'
                    }}
                  />
                  </div>
                </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                {members.map(member => (
                  <SafeMemberCard key={member.id} user={member} />
                ))}
                  </div>
                </div>
              )}

          {activeTab === 'pending' && (
            <PendingNeedsComponent />
          )}
              </div>
            </div>
          </div>
    </ClientOnly>
  );
} 