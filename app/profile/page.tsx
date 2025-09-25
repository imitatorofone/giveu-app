'use client';

import { useState, useEffect } from 'react';
import { 
  User, Mail, MapPin, Clock, Edit3, Save, X,
  Sun, Sunset, Moon, Calendar, Phone, Bell,
  LogOut,
  // Category Icons
  Wrench, Users, Brain, Heart, BookOpen, Palette, 
  Crown, Settings, Dumbbell, Compass
} from 'lucide-react';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser';
import { GIFT_CATEGORIES } from '../../constants/giftCategories.js';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import toast from "react-hot-toast";
import { useRouter } from 'next/navigation';

// Brand typography
const quicksandFont = 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif';
const merriweatherFont = 'Merriweather, Georgia, serif';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{
    full_name: string;
    email: string;
    city: string;
    phone: string;
    age: string;
    availability: string[];
    gift_selections: string[];
    is_leader: boolean;
  }>({
    full_name: '',
    email: '',
    city: '',
    phone: '',
    age: '',
    availability: [],
    gift_selections: [],
    is_leader: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Load user data on component mount
  useEffect(() => {
    async function loadProfile() {
      try {
        console.log('🔍 Starting profile load...');
        
        // Quick auth sanity check
        const s = await supabase.auth.getSession();
        console.log('🔐 Auth sanity check - User ID:', s.data.session?.user?.id);
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Profile session:', session);
        
        if (!session?.user) {
          console.log('No session found, redirecting to auth page');
          router.push('/auth');
          return;
        }

        setUser(session.user);
        console.log('👤 User set:', session.user.id);

        console.log('📊 Querying profiles table...');
        // Updated query to include new church-related columns
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, city, phone, age, availability, gift_selections, is_leader, church_code, role, approval_status')
          .eq('id', session.user.id)
          .maybeSingle();

        console.log('📊 Profile query result:', { 
          profile, 
          error, 
          userId: session.user.id,
          hasProfile: !!profile,
          hasError: !!error,
          errorType: error?.constructor?.name,
          errorMessage: error?.message,
          errorCode: error?.code,
          errorDetails: error?.details,
          errorHint: error?.hint
        });

        if (error) {
          console.error('❌ Error loading profile:', error);
          // Set default profile if there's an error
          setProfile({
            full_name: '',
            email: session.user.email || '',
            city: '',
            phone: '',
            age: '',
            availability: [],
            gift_selections: [],
            is_leader: false
          });
        } else if (profile) {
          console.log('✅ Profile loaded successfully:', profile);
          setProfile({
            full_name: profile.full_name || '',
            email: profile.email || session.user.email,
            city: profile.city || '',
            phone: profile.phone || '',
            age: profile.age || '',
            availability: profile.availability || [],
            gift_selections: profile.gift_selections || [],
            is_leader: profile.is_leader || false
          });
        } else {
          // No profile found, set defaults
          console.log('ℹ️ No profile found, setting defaults');
          setProfile({
            full_name: '',
            email: session.user.email || '',
            city: '',
            phone: '',
            age: '',
            availability: [],
            gift_selections: [],
            is_leader: false
          });
        }
        
        console.log('✅ Profile loading completed');
      } catch (catchError) {
        console.error('💥 Unexpected error in loadProfile:', catchError);
        // Set default profile on unexpected error
        setProfile({
          full_name: '',
          email: '',
          city: '',
          phone: '',
          age: '',
          availability: [],
          gift_selections: [],
          is_leader: false
        });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    const t = toast.loading("Saving profile…");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        toast.error('Please sign in to save', { id: t });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: profile.full_name,
          email: profile.email || session.user.email,
          city: profile.city,
          phone: profile.phone,
          age: profile.age,
          availability: profile.availability,
          gift_selections: profile.gift_selections,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Save error:', error);
        toast.error('Failed to save profile', { id: t });
      } else {
        toast.success('Profile saved!', { id: t });
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error?.message ? `Save failed: ${error.message}` : "Save failed", { id: t });
    } finally {
      setSaving(false);
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
        <div style={{ color: '#6b7280' }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div style={{ 
        backgroundColor: '#f9fafb', 
        minHeight: '100vh', 
        paddingBottom: '80px',
        fontFamily: merriweatherFont
      }}>

      {/* Profile Header with Edit Controls */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', fontFamily: quicksandFont }}>
              My Profile
            </h1>
            {!isEditing ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: '#20c997',
                    color: 'white',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: quicksandFont,
                    fontWeight: '500'
                  }}
                >
                  <Edit3 size={18} />
                  Edit Profile
                </button>
                
                <button
                  onClick={async () => {
                    console.log('[Profile] Sign out requested');
                    
                    if (confirm('Sign out? You\'ll need your email again to sign in.')) {
                      console.log('[Profile] User confirmed sign out');
                      const { error } = await supabase.auth.signOut();
                      
                      if (error) {
                        console.error('[Profile] Error signing out:', error);
                        toast.error('Error signing out');
                        return;
                      }
                      
                      console.log('[Profile] Sign out successful, redirecting');
                      router.push('/auth');
                    } else {
                      console.log('[Profile] User cancelled sign out');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    fontFamily: quicksandFont,
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <LogOut size={18} />
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: quicksandFont,
                    fontWeight: '500'
                  }}
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: '#20c997',
                    color: 'white',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: quicksandFont,
                    fontWeight: '500',
                    opacity: saving ? 0.5 : 1
                  }}
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Basic Information Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User style={{ color: '#20c997' }} size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', fontFamily: quicksandFont, margin: 0 }}>
                {profile.full_name || 'Your Name'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280' }}>
                <Mail size={16} />
                <span>{profile.email}</span>
              </div>
            </div>
          </div>

          {isEditing ? (
            <BasicInfoForm profile={profile} setProfile={setProfile} />
          ) : (
            <BasicInfoDisplay profile={profile} />
          )}
        </div>

        {/* Availability Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', fontFamily: 'Quicksand, sans-serif', marginBottom: '16px' }}>
            Availability
          </h3>
          <AvailabilitySection 
            availability={profile.availability}
            isEditing={isEditing}
            onChange={(newAvailability: string[]) => 
              setProfile(prev => ({ ...prev, availability: newAvailability }))
            }
          />
        </div>

        {/* Enhanced Interactive Gifts Section */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', fontFamily: 'Quicksand, sans-serif', marginBottom: '16px' }}>
            My Gifts & Skills
          </h3>
          
          <GiftSelectionSection
            selectedGifts={profile.gift_selections || []}
            isEditing={isEditing}
            onChange={(newGifts: string[]) => 
              setProfile(prev => ({ ...prev, gift_selections: newGifts }))
            }
          />
        </div>

        {/* Leadership Dashboard Access */}
        {profile.is_leader && (
          <div style={{ 
            backgroundColor: '#eff6ff', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
            border: '1px solid #bfdbfe', 
            padding: '24px', 
            marginBottom: '24px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#3b82f6', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Crown size={20} color="white" />
              </div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#1e40af', 
                fontFamily: quicksandFont, 
                margin: 0 
              }}>
                Leadership Dashboard
              </h3>
            </div>
            <p style={{ 
              color: '#1e40af', 
              fontSize: '14px', 
              marginBottom: '16px',
              fontFamily: quicksandFont
            }}>
              Access leadership tools to manage community needs and members.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => window.location.href = '/leader'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: quicksandFont,
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'}
              >
                <Crown size={16} />
                Leadership Overview
              </button>
              <button
                onClick={() => window.location.href = '/leader/pending-needs'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  color: '#1e40af',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: quicksandFont,
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6';
                  (e.target as HTMLButtonElement).style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#f8fafc';
                  (e.target as HTMLButtonElement).style.color = '#1e40af';
                }}
              >
                <Settings size={16} />
                Approve Pending Needs
              </button>
            </div>
          </div>
        )}
      </div>

        {/* Persistent Footer */}
        <Footer />
      </div>
    </>
  );
}

// Basic Info Form Component
function BasicInfoForm({ profile, setProfile }: { profile: any; setProfile: (profile: any) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Full Name
        </label>
        <input
          type="text"
          value={profile.full_name}
          onChange={(e) => setProfile((prev: any) => ({ ...prev, full_name: e.target.value }))}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontFamily: merriweatherFont,
            fontSize: '14px'
          }}
          placeholder="Enter your full name"
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          City
        </label>
        <input
          type="text"
          value={profile.city}
          onChange={(e) => setProfile((prev: any) => ({ ...prev, city: e.target.value }))}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontFamily: merriweatherFont,
            fontSize: '14px'
          }}
          placeholder="Your city"
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Phone
        </label>
        <input
          type="tel"
          value={profile.phone}
          onChange={(e) => setProfile((prev: any) => ({ ...prev, phone: e.target.value }))}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontFamily: merriweatherFont,
            fontSize: '14px'
          }}
          placeholder="Your phone number"
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Age
        </label>
        <input
          type="number"
          value={profile.age}
          onChange={(e) => setProfile((prev: any) => ({ ...prev, age: e.target.value }))}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontFamily: merriweatherFont,
            fontSize: '14px'
          }}
          placeholder="Your age"
        />
      </div>
    </div>
  );
}

// Basic Info Display Component
function BasicInfoDisplay({ profile }: { profile: any }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MapPin size={16} />
        <span>{profile.city || 'City not set'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <User size={16} />
        <span>{profile.age ? `${profile.age} years old` : 'Age not set'}</span>
      </div>
      {profile.phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={16} />
          <span>{profile.phone}</span>
        </div>
      )}
    </div>
  );
}

// Availability Section Component
function AvailabilitySection({ availability, isEditing, onChange }: { availability: string[]; isEditing: boolean; onChange: (availability: string[]) => void }) {
  const timeSlots = [
    { id: 'Morning', label: 'Morning', icon: Sun },
    { id: 'Afternoon', label: 'Afternoon', icon: Sunset },
    { id: 'Evening', label: 'Evening', icon: Moon },
    { id: 'Weekends', label: 'Weekends', icon: Calendar }
  ];

  const toggleAvailability = (slotId: string) => {
    if (!isEditing) return;
    
    const newAvailability = availability.includes(slotId)
      ? availability.filter((id: string) => id !== slotId)
      : [...availability, slotId];
    
    onChange(newAvailability);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      {timeSlots.map((slot) => {
        const Icon = slot.icon;
        const isSelected = availability.includes(slot.id);
        
        return (
          <button
            key={slot.id}
            onClick={() => toggleAvailability(slot.id)}
            disabled={!isEditing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${isSelected ? '#20c997' : '#d1d5db'}`,
              backgroundColor: isSelected ? '#20c997' : '#f9fafb',
              color: isSelected ? 'white' : '#6b7280',
              cursor: isEditing ? 'pointer' : 'default',
              fontFamily: quicksandFont,
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            <Icon size={18} />
            <span>{slot.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Enhanced Gift Selection with Skill Bubbles
function GiftSelectionSection({ selectedGifts, isEditing, onChange }: { selectedGifts: string[]; isEditing: boolean; onChange: (gifts: string[]) => void }) {
  const [expandedCategories, setExpandedCategories] = useState({});

  const categories = {
    'hands-on-skills': {
      name: 'Hands-On Skills',
      icon: Wrench,
      color: '#20c997',
      tags: ['Carpentry', 'Repairs', 'Gardening', 'Sewing', 'Decorating', 'Setup/Tear Down', 'Cooking', 'Automotive', 'Painting']
    },
    'people-relationships': {
      name: 'People & Relationships', 
      icon: Users,
      color: '#20c997',
      tags: ['Hospitality', 'Listening', 'Mentoring', 'Counseling', 'Welcoming', 'Hosting']
    },
    'problem-solving': {
      name: 'Problem-Solving & Organizing',
      icon: Brain,
      color: '#20c997', 
      tags: ['Planning', 'Budgeting', 'Logistics', 'Strategy', 'Administration', 'Research']
    },
    'care-comfort': {
      name: 'Care & Comfort',
      icon: Heart,
      color: '#20c997',
      tags: ['Visiting the Sick', 'Meal Prep', 'Childcare', 'Encouragement', 'Prayer', 'Compassionate Care']
    },
    'learning-teaching': {
      name: 'Learning & Teaching',
      icon: BookOpen,
      color: '#20c997',
      tags: ['Tutoring', 'Bible Study Leading', 'Coaching', 'Skill Training', 'Public Speaking', 'Mentoring']
    },
    'creativity-expression': {
      name: 'Creativity & Expression',
      icon: Palette,
      color: '#20c997',
      tags: ['Art', 'Music', 'Writing', 'Photography', 'Design', 'Storytelling']
    },
    'leadership-motivation': {
      name: 'Leadership & Motivation',
      icon: Crown,
      color: '#20c997',
      tags: ['Facilitating Groups', 'Casting Vision', 'Mentoring Teams', 'Event Leadership', 'Preaching', 'Strategic Planning']
    },
    'behind-scenes': {
      name: 'Behind-the-Scenes Support',
      icon: Settings,
      color: '#20c997',
      tags: ['Tech Support', 'AV/Production', 'Finance', 'Cleaning', 'Setup Crew', 'Admin Tasks']
    },
    'physical-active': {
      name: 'Physical & Active',
      icon: Dumbbell,
      color: '#20c997',
      tags: ['Sports Coaching', 'Outdoor Projects', 'Moving Help', 'Fitness Activities', 'Recreation Leading', 'Disaster Relief']
    },
    'pioneering-connecting': {
      name: 'Pioneering & Connecting',
      icon: Compass,
      color: '#20c997',
      tags: ['Evangelism', 'Community Outreach', 'Starting Ministries', 'Networking', 'Fundraising', 'Advocacy']
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !(prev as any)[categoryId]
    }));
  };

  const toggleGift = (giftTag: string) => {
    if (!isEditing) return;
    
    const newGifts = selectedGifts.includes(giftTag)
      ? selectedGifts.filter((tag: string) => tag !== giftTag)
      : [...selectedGifts, giftTag];
    
    onChange(newGifts);
  };

  return (
    <div>
      {/* Skill Bubbles Display - Always show if gifts selected */}
      {selectedGifts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px', fontFamily: 'Quicksand, sans-serif' }}>Selected Skills</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {selectedGifts.map((gift: string) => (
              <span
                key={gift}
                style={{
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontFamily: quicksandFont,
                  fontWeight: '500',
                  border: '1px solid #20c997',
                  backgroundColor: '#20c997',
                  color: 'white',
                  textAlign: 'center',
                  display: 'inline-block'
                }}
              >
                {gift}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Selection - Only show in edit mode */}
      {isEditing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px', fontFamily: 'Quicksand, sans-serif' }}>
            Add Skills by Category
          </h4>
          
          {Object.entries(categories).map(([categoryId, category]) => {
            const isExpanded = (expandedCategories as any)[categoryId];
            const selectedInCategory = category.tags.filter(tag => selectedGifts.includes(tag));

            return (
              <div key={categoryId} style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(categoryId)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    textAlign: 'left',
                    backgroundColor: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: quicksandFont
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <category.icon style={{ color: '#20c997' }} size={20} />
                    <span style={{ fontWeight: '500', color: '#111827' }}>{category.name}</span>
                    {selectedInCategory.length > 0 && (
                      <span style={{
                        fontSize: '12px',
                        backgroundColor: '#20c997',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '600'
                      }}>
                        {selectedInCategory.length}
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                {/* Category Tags */}
                {isExpanded && (
                  <div style={{ padding: '16px', paddingTop: 0, borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                      {category.tags.map((tag) => {
                        const isSelected = selectedGifts.includes(tag);
                        
                        return (
                          <button
                            key={tag}
                            onClick={() => toggleGift(tag)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '9999px',
                              border: `1px solid ${isSelected ? '#20c997' : '#d1d5db'}`,
                              backgroundColor: isSelected ? '#20c997' : 'white',
                              color: isSelected ? 'white' : '#374151',
                              fontSize: '12px',
                              fontFamily: quicksandFont,
                              fontWeight: '500',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state for non-editing mode */}
      {!isEditing && selectedGifts.length === 0 && (
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No gifts selected yet. Click "Edit Profile" to add your skills.</p>
      )}
    </div>
  );
}