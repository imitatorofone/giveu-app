'use client';

import { useState, useEffect } from 'react';
import { 
  User, Mail, MapPin, Clock, Edit3, Save, X,
  Sun, Sunset, Moon, Calendar, Phone, Bell,
  LogOut, Camera, Edit2, Check, Cloud,
  // Category Icons
  Wrench, Users, Lightbulb, Heart, BookOpen, Palette, 
  Crown, Settings, Activity, Compass
} from 'lucide-react';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser';
import { GIFT_CATEGORIES } from '../../constants/giftCategories.js';
import { formatPhoneToE164, formatPhoneForDisplay } from '../../lib/phoneFormatter';
import { BRAND } from '../../lib/brandConfig';
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
    avatar_url?: string;
    notification_preferences: {
      volunteer_signed_up: boolean;
      need_submitted: boolean;
      need_matches_gifting: boolean;
      need_approved: boolean;
      need_fulfilled: boolean;
      member_join_request: boolean;
    };
  }>({
    full_name: '',
    email: '',
    city: '',
    phone: '',
    age: '',
    availability: [],
    gift_selections: [],
    is_leader: false,
    avatar_url: '',
    notification_preferences: {
      volunteer_signed_up: true,
      need_submitted: true,
      need_matches_gifting: true,
      need_approved: true,
      need_fulfilled: true,
      member_join_request: true
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
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
        // Updated query to include new church-related columns and notification preferences
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, city, phone, age, availability, gift_selections, is_leader, church_code, role, approval_status, notification_preferences, avatar_url')
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
            is_leader: false,
            notification_preferences: {
              volunteer_signed_up: true,
              need_submitted: true,
              need_matches_gifting: true,
              need_approved: true,
              need_fulfilled: true,
              member_join_request: true
            }
          });
        } else if (profile) {
          console.log('✅ Profile loaded successfully:', profile);
          
          // Default notification preferences (all ON)
          const defaultNotificationPrefs = {
            volunteer_signed_up: true,
            need_submitted: true,
            need_matches_gifting: true,
            need_approved: true,
            need_fulfilled: true,
            member_join_request: true
          };
          
          setProfile({
            full_name: profile.full_name || '',
            email: profile.email || session.user.email,
            city: profile.city || '',
            phone: profile.phone || '',
            age: profile.age || '',
            availability: profile.availability || [],
            gift_selections: profile.gift_selections || [],
            is_leader: profile.is_leader || false,
            avatar_url: profile.avatar_url || '',
            notification_preferences: profile.notification_preferences || defaultNotificationPrefs
          });
          
          setAvatarUrl(profile.avatar_url || '');
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
            is_leader: false,
            notification_preferences: {
              volunteer_signed_up: true,
              need_submitted: true,
              need_matches_gifting: true,
              need_approved: true,
              need_fulfilled: true,
              member_join_request: true
            }
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
          is_leader: false,
          notification_preferences: {
            volunteer_signed_up: true,
            need_submitted: true,
            need_matches_gifting: true,
            need_approved: true,
            need_fulfilled: true,
            member_join_request: true
          }
        });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setAvatarUrl(publicUrl);
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Profile picture updated!');

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const t = toast.loading("Saving profile…");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        toast.error('Please sign in to save', { id: t });
        return;
      }

      // Format phone number to E.164 format for Twilio compatibility
      const formattedPhone = formatPhoneToE164(profile.phone);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: profile.full_name,
          email: profile.email || session.user.email,
          city: profile.city,
          phone: formattedPhone,
          age: profile.age,
          availability: profile.availability,
          gift_selections: profile.gift_selections,
          notification_preferences: profile.notification_preferences,
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
      <Header 
        profileActions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg active:bg-gray-50 transition-colors"
                  style={{ 
                    minHeight: '48px', 
                    color: BRAND.colors.text, 
                    fontFamily: BRAND.fonts.heading,
                    fontSize: '15px'
                  }}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all ${!saving ? 'active:scale-95' : ''}`}
                  style={{ 
                    backgroundColor: BRAND.colors.primary,
                    minHeight: '48px',
                    fontFamily: BRAND.fonts.heading,
                    fontSize: '15px',
                    opacity: saving ? 0.5 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                  onTouchStart={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover;
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (!saving) {
                      setTimeout(() => {
                        e.currentTarget.style.backgroundColor = BRAND.colors.primary;
                      }, 150);
                    }
                  }}
                >
                  <Check size={16} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all active:scale-95"
                  style={{ 
                    backgroundColor: BRAND.colors.primary,
                    minHeight: '48px',
                    fontFamily: BRAND.fonts.heading,
                    fontSize: '15px'
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover;
                  }}
                  onTouchEnd={(e) => {
                    setTimeout(() => {
                      e.currentTarget.style.backgroundColor = BRAND.colors.primary;
                    }, 150);
                  }}
                >
                  <Edit2 size={16} />
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
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg active:bg-gray-50 transition-colors"
                  style={{ 
                    minHeight: '48px', 
                    color: '#6b7280', 
                    fontFamily: BRAND.fonts.heading,
                    fontSize: '15px'
                  }}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </>
            )}
          </div>
        }
      />
      <div style={{ 
        backgroundColor: '#f9fafb', 
        minHeight: '100vh', 
        paddingBottom: '80px',
        fontFamily: merriweatherFont
      }}>

      {/* Profile Content */}
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '16px' }}
      className="sm:p-6"
      >
        
        {/* Top Section - Avatar and Name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          {/* Avatar Display */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            {isEditing ? (
              <>
                {avatarUrl ? (
                  <img 
                    src={avatarUrl}
                    alt="Profile"
                    style={{
                      width: '128px',
                      height: '128px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid white',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                ) : (
                  <div 
                    style={{
                      width: '128px',
                      height: '128px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '48px',
                      fontWeight: 'bold',
                      fontFamily: BRAND.fonts.heading,
                      backgroundColor: BRAND.colors.primary,
                      border: '4px solid white',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                
                {/* Upload Button with tooltip */}
                <label 
                  htmlFor="avatar-upload"
                  className="group"
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    backgroundColor: 'white',
                    border: `2px solid ${BRAND.colors.primary}`,
                    borderRadius: '50%',
                    padding: '10px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                  }}
                  title="Change profile picture"
                  onMouseEnter={(e) => !uploading && (e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)')}
                  onMouseLeave={(e) => !uploading && (e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)')}
                >
                  <Camera size={18} style={{ color: BRAND.colors.primary }} />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </>
            ) : (
              <>
                {avatarUrl ? (
                  <img 
                    src={avatarUrl}
                    alt="Profile"
                    style={{
                      width: '128px',
                      height: '128px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid white',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                ) : (
                  <div 
                    style={{
                      width: '128px',
                      height: '128px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '48px',
                      fontWeight: 'bold',
                      fontFamily: BRAND.fonts.heading,
                      backgroundColor: BRAND.colors.primary,
                      border: '4px solid white',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </>
            )}
          </div>
          
          {uploading && (
            <p style={{ fontSize: '14px', marginBottom: '8px', color: BRAND.colors.primary }}>
              Uploading...
            </p>
          )}
          
          {/* Name - ONLY place name appears */}
          <h1 style={{ 
            fontSize: '28px',
            fontWeight: 'bold',
            fontFamily: BRAND.fonts.heading, 
            color: BRAND.colors.text,
            marginBottom: '4px'
          }}>
            {profile?.full_name || 'User'}
          </h1>
          
          {/* Email - Small and subtle */}
          <p style={{ fontSize: '14px', color: BRAND.colors.textLight }}>
            {profile?.email}
          </p>
        </div>
        
        {/* Profile Info Card - No avatar, no name, just details */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6" style={{ marginBottom: '24px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* City */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                flexShrink: 0, 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: '#f3f4f6', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <MapPin size={18} style={{ color: BRAND.colors.primary }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '2px' }}>City</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city"
                    style={{
                      fontSize: '16px',
                      width: '100%',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '12px 12px',
                      color: BRAND.colors.text,
                      fontFamily: BRAND.fonts.body,
                      minHeight: '48px'
                    }}
                  />
                ) : (
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: BRAND.colors.text,
                    fontFamily: BRAND.fonts.body
                  }}>
                    {profile?.city || 'Not set'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Age */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                flexShrink: 0, 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: '#f3f4f6', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <User size={18} style={{ color: BRAND.colors.primary }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '2px' }}>Age</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Age"
                    style={{
                      fontSize: '16px',
                      width: '100%',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '12px 12px',
                      color: BRAND.colors.text,
                      fontFamily: BRAND.fonts.body,
                      minHeight: '48px'
                    }}
                  />
                ) : (
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: BRAND.colors.text,
                    fontFamily: BRAND.fonts.body
                  }}>
                    {profile?.age ? `${profile.age} years` : 'Not set'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Phone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                flexShrink: 0, 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: '#f3f4f6', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Phone size={18} style={{ color: BRAND.colors.primary }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '2px' }}>Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                    style={{
                      fontSize: '16px',
                      width: '100%',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '12px 12px',
                      color: BRAND.colors.text,
                      fontFamily: BRAND.fonts.body,
                      minHeight: '48px'
                    }}
                  />
                ) : (
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: BRAND.colors.text,
                    fontFamily: BRAND.fonts.body
                  }}>
                    {profile?.phone || 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Availability Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 sm:p-6" style={{ marginBottom: '24px' }}>
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 sm:p-6" style={{ marginBottom: '24px' }}>
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

        {/* Notification Preferences Section - Only show in edit mode */}
        {isEditing && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 sm:p-6" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', fontFamily: 'Quicksand, sans-serif', marginBottom: '8px' }}>
              Notification Preferences
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', fontFamily: 'Quicksand, sans-serif' }}>
              Choose which notifications you'd like to receive
            </p>
            
            <NotificationPreferencesSection
              preferences={profile.notification_preferences}
              isLeader={profile.is_leader}
              onChange={(newPreferences) => 
                setProfile(prev => ({ ...prev, notification_preferences: newPreferences }))
              }
            />
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
        <label className="text-sm font-semibold mb-1" style={{ color: BRAND.colors.text, display: 'block' }}>
          Full Name
        </label>
        <input
          type="text"
          value={profile.full_name}
          onChange={(e) => setProfile((prev: any) => ({ ...prev, full_name: e.target.value }))}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontFamily: BRAND.fonts.body,
            fontSize: '16px',
            minHeight: '48px'
          }}
          placeholder="Enter your full name"
        />
      </div>
      <div>
        <label className="text-sm font-semibold mb-1" style={{ color: BRAND.colors.text, display: 'block' }}>
          City
        </label>
        <input
          type="text"
          value={profile.city}
          onChange={(e) => setProfile((prev: any) => ({ ...prev, city: e.target.value }))}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontFamily: BRAND.fonts.body,
            fontSize: '16px',
            minHeight: '48px'
          }}
          placeholder="Your city"
        />
      </div>
      <div>
        <label className="text-sm font-semibold mb-1" style={{ color: BRAND.colors.text, display: 'block' }}>
          Phone
        </label>
        <input
          type="tel"
          value={profile.phone}
          onChange={(e) => setProfile((prev: any) => ({ ...prev, phone: e.target.value }))}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontFamily: BRAND.fonts.body,
            fontSize: '16px',
            minHeight: '48px'
          }}
          placeholder="Your phone number"
        />
      </div>
      <div>
        <label className="text-sm font-semibold mb-1" style={{ color: BRAND.colors.text, display: 'block' }}>
          Age
        </label>
        <input
          type="number"
          value={profile.age}
          onChange={(e) => setProfile((prev: any) => ({ ...prev, age: e.target.value }))}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontFamily: BRAND.fonts.body,
            fontSize: '16px',
            minHeight: '48px'
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MapPin size={16} />
        <span className="text-base" style={{ color: BRAND.colors.textLight }}>{profile.city || 'City not set'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <User size={16} />
        <span className="text-base" style={{ color: BRAND.colors.textLight }}>{profile.age ? `${profile.age} years old` : 'Age not set'}</span>
      </div>
      {profile.phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={16} />
          <span className="text-base" style={{ color: BRAND.colors.textLight }}>{formatPhoneForDisplay(profile.phone)}</span>
        </div>
      )}
    </div>
  );
}

// Availability Section Component
function AvailabilitySection({ availability, isEditing, onChange }: { availability: string[]; isEditing: boolean; onChange: (availability: string[]) => void }) {
  const timeSlots = [
    { id: 'Morning', label: 'Morning', icon: Sun },
    { id: 'Afternoon', label: 'Afternoon', icon: Cloud },
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
            className={isSelected 
              ? 'text-white shadow-md active:scale-95' 
              : 'bg-white text-gray-700 border-2 border-gray-300 active:border-gray-400 active:shadow-sm'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: isSelected ? BRAND.colors.primary : undefined,
              cursor: isEditing ? 'pointer' : 'default',
              fontFamily: BRAND.fonts.heading,
              fontWeight: '500',
              fontSize: '15px',
              minHeight: '48px',
              transition: 'all 0.15s ease'
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
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(true);

  const categories = {
    'hands-on-skills': {
      name: 'Hands-On Skills',
      icon: Wrench,
      color: '#20c997',
      tags: ['Carpentry', 'Repairs', 'Gardening', 'Sewing', 'Cooking', 'Decorating', 'Setup/Tear Down', 'Automotive', 'Painting']
    },
    'people-relationships': {
      name: 'People & Relationships', 
      icon: Users,
      color: '#20c997',
      tags: ['Hospitality', 'Listening', 'Mentoring', 'Counseling', 'Welcoming', 'Hosting']
    },
    'problem-solving': {
      name: 'Problem-Solving & Organizing',
      icon: Lightbulb,
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
      tags: ['Art', 'Music', 'Writing', 'Photography', 'Design', 'Storytelling', 'Media Production']
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
      icon: Activity,
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
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: BRAND.colors.primary,
                  color: 'white',
                  textAlign: 'center',
                  display: 'inline-block',
                  fontFamily: BRAND.fonts.heading
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
        <div>
          {/* Collapsible Header */}
          <button
            onClick={() => setIsSectionCollapsed(!isSectionCollapsed)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: quicksandFont,
              marginBottom: isSectionCollapsed ? '0' : '16px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>
                Add Skills by Category
              </span>
              {selectedGifts.length > 0 && (
                <span style={{
                  fontSize: '12px',
                  backgroundColor: '#20c997',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}>
                  {selectedGifts.length} selected
                </span>
              )}
            </div>
            <div style={{ 
              transform: isSectionCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>

          {/* Collapsible Content */}
          <div style={{ 
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            maxHeight: isSectionCollapsed ? '0' : '1000px',
            opacity: isSectionCollapsed ? 0 : 1
          }}>
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
        </div>
      )}

      {/* Empty state for non-editing mode */}
      {!isEditing && selectedGifts.length === 0 && (
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No gifts selected yet. Click "Edit Profile" to add your skills.</p>
      )}
    </div>
  );
}

// Notification Preferences Section Component
type NotificationPreferences = {
  volunteer_signed_up: boolean;
  need_submitted: boolean;
  need_matches_gifting: boolean;
  need_approved: boolean;
  need_fulfilled: boolean;
  member_join_request: boolean;
};

function NotificationPreferencesSection({ 
  preferences, 
  isLeader,
  onChange 
}: { 
  preferences: NotificationPreferences;
  isLeader: boolean;
  onChange: (preferences: NotificationPreferences) => void;
}) {
  const allNotificationTypes = [
    {
      key: 'volunteer_signed_up' as const,
      label: 'Volunteer Signups',
      description: 'When someone signs up to help with a need you created',
      leaderOnly: false
    },
    {
      key: 'need_submitted' as const,
      label: 'New Needs Submitted',
      description: 'When members submit new needs for approval',
      leaderOnly: true
    },
    {
      key: 'need_matches_gifting' as const,
      label: 'Gift Matches',
      description: 'When new opportunities match your skills and gifts',
      leaderOnly: false
    },
    {
      key: 'need_approved' as const,
      label: 'Needs Approved',
      description: 'When your submitted needs are approved and go live',
      leaderOnly: false
    },
    {
      key: 'need_fulfilled' as const,
      label: 'Needs Fulfilled',
      description: 'When your needs have enough volunteers',
      leaderOnly: false
    },
    {
      key: 'member_join_request' as const,
      label: 'New Members Joined',
      description: 'When new members join your church community',
      leaderOnly: true
    }
  ];

  // Filter notification types based on user role
  const notificationTypes = allNotificationTypes.filter(type => 
    !type.leaderOnly || isLeader
  );

  const togglePreference = (key: keyof typeof preferences) => {
    onChange({
      ...preferences,
      [key]: !preferences[key]
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {notificationTypes.map((type) => (
        <div key={type.key} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#111827', 
              marginBottom: '4px',
              fontFamily: quicksandFont
            }}>
              {type.label}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              fontFamily: quicksandFont
            }}>
              {type.description}
            </div>
          </div>
          
          <button
            onClick={() => togglePreference(type.key)}
            style={{
              position: 'relative',
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: preferences[type.key] ? '#20c997' : '#d1d5db',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (!preferences[type.key]) {
                e.currentTarget.style.backgroundColor = '#9ca3af';
              }
            }}
            onMouseLeave={(e) => {
              if (!preferences[type.key]) {
                e.currentTarget.style.backgroundColor = '#d1d5db';
              }
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: preferences[type.key] ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'white',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
              }}
            />
          </button>
        </div>
      ))}
    </div>
  );
}