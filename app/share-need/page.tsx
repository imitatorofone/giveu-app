'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser';
import { useRouter } from 'next/navigation';
import { Icon } from '../../icons/index';
import { ArrowLeft, MapPin, Users, Calendar, Clock, AlertCircle, CheckCircle, FileText, Plus, Sun, Cloud, Moon, Home, ArrowRight, ChevronDown } from 'lucide-react';
import { createNotification } from '../../lib/notificationHelper';
import { BRAND } from '../../lib/brandConfig';
import { GIFT_CATEGORIES } from '../../lib/giftsConfig';
import toast from 'react-hot-toast';

const primaryGiftings = [
  { id: 'hands-on', name: 'Hands-On Skills', skills: ['Carpentry', 'Repairs', 'Gardening', 'Sewing', 'Cooking', 'Decorating', 'Setup/Tear-down'] },
  { id: 'people', name: 'People & Relationships', skills: ['Hospitality', 'Listening', 'Mentoring', 'Counseling', 'Welcoming', 'Hosting'] },
  { id: 'problem-solving', name: 'Problem-Solving & Organizing', skills: ['Planning', 'Budgeting', 'Logistics', 'Strategy', 'Administration', 'Research'] },
  { id: 'care', name: 'Care & Comfort', skills: ['Visiting the Sick', 'Meal Prep', 'Childcare', 'Encouragement', 'Prayer', 'Compassion Care'] },
  { id: 'teaching', name: 'Learning & Teaching', skills: ['Tutoring', 'Bible Study Leading', 'Skill Training', 'Coaching', 'Public Speaking'] },
  { id: 'creativity', name: 'Creativity & Expression', skills: ['Art', 'Music', 'Writing', 'Photography', 'Design', 'Storytelling', 'Media Production'] },
  { id: 'leadership', name: 'Leadership & Motivation', skills: ['Facilitating Groups', 'Casting Vision', 'Mentoring Teams', 'Event Leadership', 'Preaching'] },
  { id: 'support', name: 'Behind-the-Scenes Support', skills: ['Tech Support', 'AV/Production', 'Finance', 'Cleaning', 'Setup Crew', 'Admin Tasks'] },
  { id: 'physical', name: 'Physical & Active', skills: ['Sports Coaching', 'Outdoor Projects', 'Moving Help', 'Event Setup', 'Fitness Activities'] },
  { id: 'pioneering', name: 'Pioneering & Connecting', skills: ['Evangelism', 'Community Outreach', 'Starting Ministries', 'Networking', 'Fundraising'] }
];

export default function ShareNeedScreen() {
  const [user, setUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLeaderUser, setIsLeaderUser] = useState(false);
  const router = useRouter();
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    title: '',
    urgency: 'specific',
    specificDate: '',
    specificTime: '',
    timePreference: '', // Only used for "Needs Help Soon"
    ongoingStartDate: '',
    ongoingStartTime: '',
    ongoingSchedule: 'weekly', // weekly, monthly, quarterly
    notes: '',
    peopleNeeded: '1',
    customPeopleCount: '', // For 5+ people custom number
    giftingsNeeded: [] as string[],
    location: '',
    customLocation: ''
  });

  const [expandedGiftings, setExpandedGiftings] = useState(new Set());
  const [isHydrated, setIsHydrated] = useState(false);
  const [churchName, setChurchName] = useState('');
  const [churchAddress, setChurchAddress] = useState('');
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fix hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch church address for user
  useEffect(() => {
    async function fetchChurchInfo() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('church_code')
            .eq('id', user.id)
            .single();
          
          if (profile?.church_code) {
            const { data: church } = await supabase
              .from('churches')
              .select('name, address, city, state, zip')
              .eq('code', profile.church_code)
              .single();
            
            if (church) {
              setChurchName(church.name);
              setChurchAddress(`${church.address}, ${church.city}, ${church.state} ${church.zip}`);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching church info:', err);
      }
    }
    fetchChurchInfo();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error);
          return;
        }
        if (!data?.user) {
          router.push('/');
          return;
        }
        if (isMounted) {
          console.log('[ShareNeed] User loaded:', data.user);
          setUser(data.user);
        }
      } catch (err) {
        console.error('Error in getUser:', err);
      }
    };
    getUser();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGifting = (gifting: string) => {
    setFormData(prev => ({
      ...prev,
      giftingsNeeded: prev.giftingsNeeded.includes(gifting)
        ? prev.giftingsNeeded.filter(g => g !== gifting)
        : [...prev.giftingsNeeded, gifting]
    }));
  };

  const toggleExpanded = (giftingId: string) => {
    setExpandedGiftings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(giftingId)) {
        newSet.delete(giftingId);
      } else {
        newSet.add(giftingId);
      }
      return newSet;
    });
  };

  const canContinue = () => {
    switch (currentStep) {
      case 0: 
        const basicValid = formData.title.trim() !== '' && formData.urgency !== '';
        const specificValid = formData.urgency !== 'specific' || (formData.specificDate && formData.specificTime);
        const ongoingValid = formData.urgency !== 'ongoing' || (formData.ongoingStartDate && formData.ongoingStartTime);
        const asapValid = formData.urgency !== 'asap' || formData.timePreference !== '';
        return basicValid && specificValid && ongoingValid && asapValid;
      case 1: 
        return formData.location !== '' && formData.peopleNeeded !== '' &&
               (formData.location !== 'custom' || formData.customLocation.trim() !== '') &&
               (formData.peopleNeeded !== '5+' || formData.customPeopleCount.trim() !== '');
      case 2: 
        return formData.giftingsNeeded.length > 0;
      default: 
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowPreview(true);
    }
  };

  const handlePrevious = () => {
    if (showPreview) {
      setShowPreview(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formatDate = (urgency: string, specificDate: string, ongoingStartDate: string) => {
    if (urgency === 'asap') return 'As Soon As Possible';
    if (urgency === 'ongoing') return ongoingStartDate ? new Date(ongoingStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ongoing';
    if (!specificDate) return 'Date TBD';
    
    const d = new Date(specificDate);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getLocationLine1 = (address: string | null) => {
    if (!address) return 'Location TBD';
    
    const parts = address.split(',');
    if (parts.length > 1) {
      return parts[0].trim();
    }
    
    return address;
  };

  const getLocationLine2 = (address: string | null) => {
    if (!address) return '';
    
    const parts = address.split(',');
    if (parts.length > 1) {
      return parts.slice(1).join(',').trim();
    }
    
    return '';
  };

  const handleSubmit = async () => {
    console.log('[ShareNeed] handleSubmit called');
    console.log('[ShareNeed] user:', user);
    
    if (!user) {
      console.log('[ShareNeed] No user found, returning early');
      return;
    }

    try {
      console.log('[ShareNeed] Starting submission process');
      
      // Check if user is a leader
      const isLeader = user.email === 'imitatorofone@gmail.com';
      console.log('[ShareNeed] isLeader:', isLeader);
      setIsLeaderUser(isLeader);

      // Get user's church_code for the need
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('church_code')
        .eq('id', user.id)
        .single();
      
      console.log('[ShareNeed] User profile church_code:', userProfile?.church_code);
      
      // For MVP, we'll create a simple needs table structure
      // Let's try to create the table if it doesn't exist, or use a fallback
      console.log('[ShareNeed] Creating needData object');
      const needData = {
        id: crypto.randomUUID(),
        title: formData.title,
        description: formData.notes || formData.title,
        giftings_needed: Array.isArray(formData.giftingsNeeded) ? formData.giftingsNeeded : [],
        people_needed: formData.peopleNeeded === '5+' && formData.customPeopleCount 
          ? parseInt(formData.customPeopleCount) 
          : parseInt(formData.peopleNeeded) || 1,
        location: formData.location === 'custom' ? formData.customLocation : churchAddress,
        location_type: formData.location,
        address: formData.location === 'custom' ? formData.customLocation : churchAddress,
        urgency: formData.urgency,
        time_preference: formData.timePreference || null,
        specific_date: formData.specificDate || null,
        specific_time: formData.specificTime || null,
        ongoing_start_date: formData.ongoingStartDate || null,
        ongoing_start_time: formData.ongoingStartTime || null,
        ongoing_schedule: formData.ongoingSchedule,
        status: isLeader ? 'approved' : 'pending', // Auto-approve for leaders
        created_at: new Date().toISOString(),
        created_by: user.id,
        created_by_email: user.email,
        is_leader_need: isLeader,
        church_code: userProfile?.church_code || null // ← ADD THIS LINE
      };

      console.log('[ShareNeed] Final status being set:', isLeader ? 'approved' : 'pending');
      console.log('[ShareNeed] Complete needData:', needData);

      // For ongoing needs, include the schedule info in the description
      if (formData.urgency === 'ongoing') {
        needData.description = `${needData.description}\n\nOngoing Schedule: Starting ${formData.ongoingStartDate} at ${formData.ongoingStartTime}, repeats ${formData.ongoingSchedule}`;
      }

      // console.log('Submitting need data:', needData);
      // console.log('User ID:', user.id);

      // Try to insert into needs table first
      console.log('[ShareNeed] Attempting Supabase insert');
      let { data: insertData, error } = await supabase
        .from('needs')
        .insert(needData)
        .select();
      
      console.log('[ShareNeed] Supabase insert result:', { data: insertData, error });
      if (insertData && insertData.length > 0) {
        console.log('[ShareNeed] Inserted need details:', insertData[0]);
        
        // Send notifications to leaders if this is a new need submission
        if (insertData[0] && !error) {
          console.log('[ShareNeed] Need created, sending notifications to leaders...');
          
          // Get user profile to get full_name for notification
          const { data: userProfileForNotification } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          if (userProfile?.church_code) {
            // Get all leaders in the church
            const { data: leaders } = await supabase.from('profiles').select('id').eq('church_code', (insertData[0].church_code ?? userProfile?.church_code ?? null)).eq('is_leader', true);
            console.log('[ShareNeed] Recipients query result:', leaders);

            // Send notification to each leader
            if (leaders && leaders.length > 0) {
              const memberName = userProfileForNotification?.full_name || 'A member';
              
              for (const leader of leaders) {
                // Create DIY notification
                await createNotification({
                  userId: leader.id,
                  eventType: 'need.submitted',
                  title: insertData[0].title,
                  description: `New need submitted by ${memberName}`,
                  path: '/leader/pending-needs',
                  needId: insertData[0].id,
                  need_title: insertData[0].title
                });
                
                // Trigger Knock workflow for push notification
                try {
                  await fetch('/api/knock/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      workflow: 'need_submitted',
                      userId: leader.id,
                      data: {
                        member_name: memberName,
                        need_title: insertData[0].title,
                        need_id: insertData[0].id
                      }
                    })
                  });
                  console.log('✅ Knock workflow triggered for need_submitted to leader:', leader.id);
                } catch (error) {
                  console.warn('Knock trigger failed for need_submitted:', error);
                }
              }
              console.log(`[ShareNeed] Sent notifications to ${leaders.length} leaders`);
            }
            
            // After notifying leaders, check for gift matches
            console.log('[ShareNeed] Checking for gift matches...');

            // Get all members in the church (not just leaders)
            const { data: members } = await supabase
              .from('profiles')
              .select('id, full_name, gift_selections, phone, email')
              .eq('church_code', userProfile?.church_code)
              .not('gift_selections', 'is', null);

            if (members && members.length > 0 && insertData[0].giftings_needed) {
              const needGiftings = insertData[0].giftings_needed;
              
              for (const member of members) {
                // Skip the person who created the need
                if (member.id === user.id) continue;
                
                // Check if member's gifts match any needed giftings
                const matchingGifts = member.gift_selections.filter((gift: string) =>
                  needGiftings.some((neededGift: string) =>
                    gift.toLowerCase().includes(neededGift.toLowerCase()) ||
                    neededGift.toLowerCase().includes(gift.toLowerCase())
                  )
                );
                
                if (matchingGifts.length > 0) {
                  console.log(`[ShareNeed] Gift match found for member ${member.id}:`, matchingGifts);
                  
                  // Create DIY in-app notification first
                  await createNotification({
                    userId: member.id,
                    eventType: 'need.matches_gifting',
                    title: 'New Opportunity Matches Your Gifts!',
                    description: `${insertData[0].title} needs your ${matchingGifts.join(', ')}`,
                    path: '/dashboard',
                    needId: insertData[0].id,
                    need_title: insertData[0].title
                  });
                  
                  // Then trigger Knock workflow for gift match
                  try {
                    await fetch('/api/knock/trigger', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        workflow: 'need_matches_gifting',
                        userId: member.id,
                        data: {
                          need_title: insertData[0].title,
                          need_id: insertData[0].id,
                          matching_gifts: matchingGifts.join(', ')
                        },
                        recipient: {
                          phone_number: member.phone,
                          email: member.email
                        }
                      })
                    });
                    console.log('✅ Knock workflow triggered for need_matches_gifting:', member.id, 'with phone:', member.phone, 'and email:', member.email);
                  } catch (error) {
                    console.warn('Knock trigger failed for gift match:', error);
                  }
                }
              }
            }
          }
        }
      }

      // If needs table doesn't exist, fall back to a simple approach
      if (error && error.message && error.message.includes('Could not find the table')) {
        // console.log('Needs table not found, using simple fallback approach');
        
        // For MVP, we'll just show success and log the need data
        // In a real implementation, you'd create the needs table or use a different storage method
        // console.log('Need submission data (would be stored in needs table):', needData);
        if (isLeader) {
          // console.log('LEADER NEED: This need was auto-approved due to leader status');
        }
        
        // For now, we'll just proceed as if it was successful
        // The need data is logged to console for leaders to see
      } else if (error) {
        console.error('Error submitting need:', error);
        throw new Error(`Failed to submit need: ${error.message || 'Unknown error'}`);
      }

      // Show custom success modal
      console.log('[ShareNeed] Submission successful, showing success modal');
      console.log('[ShareNeed] Setting showSuccessModal to true');
      
      // Show toast notification
      toast.success('Need submitted successfully! 🎉', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: BRAND.colors.primary,
          color: 'white',
          fontFamily: BRAND.fonts.heading,
          fontSize: '16px',
          fontWeight: '600',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        },
        icon: '✓'
      });
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error submitting need: ${errorMessage}. Please try again.`);
    }
  };

  const renderStep = () => {
    const cardStyle = {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      maxWidth: '680px',
      margin: '0 auto',
      border: '1px solid #f3f4f6'
    };

    const inputStyle = {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '16px',
      minHeight: '44px',
      fontFamily: BRAND.fonts.body,
      transition: 'border-color 0.2s, box-shadow 0.2s'
    };

    const labelStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
      fontWeight: '600',
      fontSize: '14px',
      color: BRAND.colors.text,
      fontFamily: BRAND.fonts.heading
    };

    switch (currentStep) {
      case 0:
        return (
          <div style={cardStyle} className="sm:p-8">
            {/* Progress Bar */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: BRAND.colors.textLight, fontFamily: BRAND.fonts.body }}>
                  Step 1 of 3
                </span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: BRAND.colors.textLight, fontFamily: BRAND.fonts.body }}>
                  33% complete
                </span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '8px' }}>
                <div style={{ 
                  width: '33%', 
                  backgroundColor: '#20c997', 
                  height: '8px', 
                  borderRadius: '9999px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            <h2 style={{ fontSize: '28px', marginBottom: '8px', fontWeight: 'bold', color: BRAND.colors.text, fontFamily: BRAND.fonts.heading }}>
              Share a Need
            </h2>
            <p style={{ color: BRAND.colors.textLight, marginBottom: '32px', fontSize: '16px', fontFamily: BRAND.fonts.body }}>
              Making it easy for your church family to step in and help
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Description Field */}
              <div>
                <label style={labelStyle}>
                  <FileText size={18} color='#20c997' />
                  <span>Description</span>
              </label>
              <textarea
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="Help with moving furniture, meal prep for family, tutoring kids…"
                  style={{ 
                    ...inputStyle, 
                    minHeight: '120px', 
                    resize: 'vertical'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#20c997';
                    e.currentTarget.style.boxShadow = `0 0 0 3px #20c99720`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
              />
            </div>

              {/* Additional Details Field */}
              <div>
                <label style={labelStyle}>
                  <Plus size={18} color='#20c997' />
                  <span>Additional details (optional)</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Bring gloves and tools… Meals should be nut-free… Any special instructions…"
                  style={{ 
                    ...inputStyle, 
                    minHeight: '80px', 
                    resize: 'vertical'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#20c997';
                    e.currentTarget.style.boxShadow = `0 0 0 3px #20c99720`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
              />
            </div>

              {/* When is this needed? */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                <div style={labelStyle}>
                  <Clock size={18} color='#20c997' />
                  <span>When is this needed?</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  {/* Needs Help Soon */}
                  <label 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => updateFormData('urgency', 'asap')}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${formData.urgency === 'asap' ? '#20c997' : '#d1d5db'}`,
                      backgroundColor: formData.urgency === 'asap' ? '#20c997' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}>
                      {formData.urgency === 'asap' && (
                        <div style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: 'white',
                          borderRadius: '50%'
                        }} />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="urgency"
                      value="asap"
                      checked={formData.urgency === 'asap'}
                      onChange={(e) => updateFormData('urgency', e.target.value)}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                    <span style={{ color: BRAND.colors.text, fontSize: '16px', fontFamily: BRAND.fonts.body }}>
                      Needs Help Soon
                    </span>
                  </label>

                  {/* Specific Date & Time */}
                  <label 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => updateFormData('urgency', 'specific')}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${formData.urgency === 'specific' ? '#20c997' : '#d1d5db'}`,
                      backgroundColor: formData.urgency === 'specific' ? '#20c997' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}>
              {formData.urgency === 'specific' && (
                        <div style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: 'white',
                          borderRadius: '50%'
                        }} />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="urgency"
                      value="specific"
                      checked={formData.urgency === 'specific'}
                      onChange={(e) => updateFormData('urgency', e.target.value)}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                    <span style={{ color: BRAND.colors.text, fontSize: '16px', fontFamily: BRAND.fonts.body }}>
                      Specific Date & Time
                    </span>
                  </label>

                  {/* Ongoing */}
                  <label 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => updateFormData('urgency', 'ongoing')}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${formData.urgency === 'ongoing' ? '#20c997' : '#d1d5db'}`,
                      backgroundColor: formData.urgency === 'ongoing' ? '#20c997' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}>
                      {formData.urgency === 'ongoing' && (
                        <div style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: 'white',
                          borderRadius: '50%'
                        }} />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="urgency"
                      value="ongoing"
                      checked={formData.urgency === 'ongoing'}
                      onChange={(e) => updateFormData('urgency', e.target.value)}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                    <span style={{ color: BRAND.colors.text, fontSize: '16px', fontFamily: BRAND.fonts.body }}>
                      Ongoing
                    </span>
                  </label>
                </div>

              {isHydrated && formData.urgency === 'specific' && (
                <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: '8px' }}>
                      <Calendar size={16} color='#20c997' />
                      <span>Date</span>
                    </label>
                    <input
                      type="date"
                      value={formData.specificDate}
                      onChange={(e) => updateFormData('specificDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = BRAND.colors.primary;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND.colors.primary}20`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: '8px' }}>
                      <Clock size={16} color='#20c997' />
                      <span>Time</span>
                    </label>
                    <input
                      type="time"
                      value={formData.specificTime}
                      onChange={(e) => updateFormData('specificTime', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = BRAND.colors.primary;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND.colors.primary}20`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {isHydrated && formData.urgency === 'ongoing' && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '600', color: BRAND.colors.text, fontFamily: BRAND.fonts.heading }}>
                    Ongoing Schedule
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ ...labelStyle, marginBottom: '8px' }}>
                        <Calendar size={16} color='#20c997' />
                        <span>Start Date</span>
                      </label>
                      <input
                        type="date"
                        value={formData.ongoingStartDate}
                        onChange={(e) => updateFormData('ongoingStartDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        style={inputStyle}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = BRAND.colors.primary;
                          e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND.colors.primary}20`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, marginBottom: '8px' }}>
                        <Clock size={16} color='#20c997' />
                        <span>Start Time</span>
                      </label>
                      <input
                        type="time"
                        value={formData.ongoingStartTime}
                        onChange={(e) => updateFormData('ongoingStartTime', e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = BRAND.colors.primary;
                          e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND.colors.primary}20`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, marginBottom: '8px' }}>
                        <span>Repeats</span>
                      </label>
                      <select
                        value={formData.ongoingSchedule}
                        onChange={(e) => updateFormData('ongoingSchedule', e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = BRAND.colors.primary;
                          e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND.colors.primary}20`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: BRAND.colors.textLight, fontFamily: BRAND.fonts.body }}>
                    We'll automatically match people based on the start time you choose
                  </p>
                </div>
              )}

              {isHydrated && formData.urgency === 'asap' && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: '600', color: BRAND.colors.text, fontFamily: BRAND.fonts.heading }}>
                    Preferred Time of Day
                  </h4>
                  <p style={{ fontSize: '14px', color: BRAND.colors.textLight, marginBottom: '16px', fontFamily: BRAND.fonts.body }}>
                    Since this is urgent, when would you prefer help?
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {/* Morning */}
                    <button
                      type="button"
                      onClick={() => updateFormData('timePreference', 'Mornings')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        minHeight: '44px',
                        backgroundColor: formData.timePreference === 'Mornings' ? '#20c997' : '#f3f4f6',
                        color: formData.timePreference === 'Mornings' ? 'white' : '#374151',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: BRAND.fonts.heading
                      }}
                      onMouseEnter={(e) => {
                        if (formData.timePreference !== 'Mornings') {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.timePreference !== 'Mornings') {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                      }}
                    >
                      <Sun size={18} />
                      Morning
                    </button>

                    {/* Afternoon */}
                    <button
                      type="button"
                      onClick={() => updateFormData('timePreference', 'Afternoons')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        minHeight: '44px',
                        backgroundColor: formData.timePreference === 'Afternoons' ? '#20c997' : '#f3f4f6',
                        color: formData.timePreference === 'Afternoons' ? 'white' : '#374151',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: BRAND.fonts.heading
                      }}
                      onMouseEnter={(e) => {
                        if (formData.timePreference !== 'Afternoons') {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.timePreference !== 'Afternoons') {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                      }}
                    >
                      <Cloud size={18} />
                      Afternoon
                    </button>

                    {/* Evening */}
                    <button
                      type="button"
                      onClick={() => updateFormData('timePreference', 'Nights')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        minHeight: '44px',
                        backgroundColor: formData.timePreference === 'Nights' ? '#20c997' : '#f3f4f6',
                        color: formData.timePreference === 'Nights' ? 'white' : '#374151',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: BRAND.fonts.heading
                      }}
                      onMouseEnter={(e) => {
                        if (formData.timePreference !== 'Nights') {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.timePreference !== 'Nights') {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                      }}
                    >
                      <Moon size={18} />
                      Evening
                    </button>

                    {/* Anytime */}
                    <button
                      type="button"
                      onClick={() => updateFormData('timePreference', 'Anytime')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        minHeight: '44px',
                        backgroundColor: formData.timePreference === 'Anytime' ? '#20c997' : '#f3f4f6',
                        color: formData.timePreference === 'Anytime' ? 'white' : '#374151',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: BRAND.fonts.heading
                      }}
                      onMouseEnter={(e) => {
                        if (formData.timePreference !== 'Anytime') {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.timePreference !== 'Anytime') {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                      }}
                    >
                      <Calendar size={18} />
                      Anytime
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div style={cardStyle} className="sm:p-8">
            {/* Progress Bar */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: BRAND.colors.textLight, fontFamily: BRAND.fonts.body }}>
                  Step 2 of 3
                </span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: BRAND.colors.textLight, fontFamily: BRAND.fonts.body }}>
                  67% complete
                </span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '8px' }}>
                <div style={{ 
                  width: '67%', 
                  backgroundColor: '#20c997', 
                  height: '8px', 
                  borderRadius: '9999px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            <h2 style={{ fontSize: '28px', marginBottom: '8px', fontWeight: 'bold', color: BRAND.colors.text, fontFamily: BRAND.fonts.heading }}>
              Where & How Many?
            </h2>
            <p style={{ color: BRAND.colors.textLight, marginBottom: '32px', fontSize: '16px', fontFamily: BRAND.fonts.body }}>
              Let people know where to meet and how many helpers you need
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Location Section */}
              <div>
                <label style={labelStyle}>
                  <MapPin size={18} color='#20c997' />
                  <span>Location</span>
              </label>
              <select
                value={formData.location}
                onChange={(e) => updateFormData('location', e.target.value)}
                style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#20c997';
                    e.currentTarget.style.boxShadow = `0 0 0 3px #20c99720`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
              >
                <option value="">Choose location</option>
                <option value="church">Church</option>
                <option value="custom">Custom Address</option>
              </select>

                {/* Show church address when church selected */}
                {formData.location === 'church' && churchAddress && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginTop: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <Home size={18} color='#20c997' style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: BRAND.colors.text, fontFamily: BRAND.fonts.heading }}>
                        {churchName}
                      </p>
                      <p style={{ fontSize: '14px', color: BRAND.colors.textLight, fontFamily: BRAND.fonts.body }}>
                        {churchAddress}
                      </p>
                    </div>
                  </div>
                )}

                {/* Show address input if custom selected */}
              {formData.location === 'custom' && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: BRAND.colors.text, fontFamily: BRAND.fonts.heading }}>
                      Street Address
                    </label>
                <input
                  type="text"
                  value={formData.customLocation}
                  onChange={(e) => updateFormData('customLocation', e.target.value)}
                      placeholder="123 Main St, City, State ZIP"
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#20c997';
                        e.currentTarget.style.boxShadow = `0 0 0 3px #20c99720`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
              )}
            </div>

              {/* People Needed Section */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                <label style={labelStyle}>
                  <Users size={18} color='#20c997' />
                  <span>How many people are needed?</span>
                </label>
              <select
                value={formData.peopleNeeded}
                  onChange={(e) => {
                    updateFormData('peopleNeeded', e.target.value);
                    if (e.target.value !== '5+') {
                      updateFormData('customPeopleCount', '');
                    }
                  }}
                style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#20c997';
                    e.currentTarget.style.boxShadow = `0 0 0 3px #20c99720`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select number needed</option>
                <option value="1">1 person</option>
                <option value="2">2 people</option>
                <option value="3">3 people</option>
                <option value="4">4 people</option>
                  <option value="5">5 people</option>
                  <option value="5+">5+ people (specify below)</option>
              </select>

                {/* Show custom number input when 5+ selected */}
                {formData.peopleNeeded === '5+' && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: BRAND.colors.text, fontFamily: BRAND.fonts.heading }}>
                      Exact number needed
                    </label>
                    <input
                      type="number"
                      min="6"
                      value={formData.customPeopleCount || ''}
                      onChange={(e) => updateFormData('customPeopleCount', e.target.value)}
                      placeholder="Enter number (6 or more)"
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#20c997';
                        e.currentTarget.style.boxShadow = `0 0 0 3px #20c99720`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={cardStyle} className="sm:p-8">
            {/* Progress Bar */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: BRAND.colors.textLight, fontFamily: BRAND.fonts.body }}>
                  Step 3 of 3
                </span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: BRAND.colors.textLight, fontFamily: BRAND.fonts.body }}>
                  100% complete
                </span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '8px' }}>
                <div style={{ 
                  width: '100%', 
                  backgroundColor: '#20c997', 
                  height: '8px', 
                  borderRadius: '9999px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            <h2 style={{ fontSize: '28px', marginBottom: '8px', fontWeight: 'bold', color: BRAND.colors.text, fontFamily: BRAND.fonts.heading }}>
              What skills are needed?
            </h2>
            <p style={{ color: BRAND.colors.textLight, marginBottom: '24px', fontSize: '16px', fontFamily: BRAND.fonts.body }}>
              Select the gift areas and specific skills that would be most helpful
            </p>

            {/* Search Skills */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search for a skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  paddingLeft: '40px',
                  paddingRight: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '16px',
                  fontFamily: BRAND.fonts.body,
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = BRAND.colors.primary}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
              <Plus 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }} 
              />
            </div>

            {/* Selected Skills Section */}
            {formData.giftingsNeeded.length > 0 && (
              <div style={{ 
                marginBottom: '16px', 
                padding: '16px', 
                backgroundColor: `${BRAND.colors.primary}0D`, 
                borderRadius: '12px', 
                border: `1px solid ${BRAND.colors.primary}33`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: BRAND.colors.text, fontFamily: BRAND.fonts.heading }}>
                    Selected: {formData.giftingsNeeded.length} skills
                  </span>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, giftingsNeeded: [] }))}
                    style={{
                      fontSize: '13px',
                      color: '#ef4444',
                      fontWeight: '500',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontFamily: BRAND.fonts.heading
                    }}
                  >
                    Clear all
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {formData.giftingsNeeded.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleGifting(skill)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: BRAND.colors.primary,
                        color: 'white',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: '500',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: BRAND.fonts.heading
                      }}
                    >
                      <span>{skill}</span>
                      <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gift Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {GIFT_CATEGORIES.filter(category => {
                // Filter categories based on search
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return category.name.toLowerCase().includes(query) || 
                       category.tags.some(tag => tag.toLowerCase().includes(query));
              }).map((category) => {
                const IconComponent = category.icon;
                const isExpanded = expandedGiftings.has(category.name);
                const selectedInCategory = category.tags.filter(tag => formData.giftingsNeeded.includes(tag)).length;
                
                return (
                  <div key={category.name} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Category Header */}
                    <button
                      onClick={() => toggleExpanded(category.name)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        backgroundColor: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <IconComponent size={20} color='#20c997' />
                        <span style={{ fontWeight: '600', color: BRAND.colors.text, fontFamily: BRAND.fonts.heading }}>
                          {category.name}
                      </span>
                        {selectedInCategory > 0 && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: 'white',
                            backgroundColor: '#20c997'
                          }}>
                            {selectedInCategory}
                          </span>
                        )}
                      </div>
                      <ChevronDown 
                        size={20} 
                        color='#9ca3af'
                        style={{
                          transition: 'transform 0.2s',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}
                      />
                    </button>
                    
                    {/* Category Tags */}
                    {isExpanded && (
                      <div style={{ 
                        padding: '16px', 
                        backgroundColor: '#f9fafb',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <div style={{ 
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          {category.tags.filter(tag => {
                            // Filter tags based on search
                            if (!searchQuery) return true;
                            return tag.toLowerCase().includes(searchQuery.toLowerCase());
                          }).map((tag) => {
                            const isSelected = formData.giftingsNeeded.includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() => toggleGifting(tag)}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '9999px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  minHeight: '36px',
                                  border: isSelected ? 'none' : '1px solid #e5e7eb',
                                  backgroundColor: isSelected ? '#20c997' : 'white',
                                  color: isSelected ? 'white' : '#4b5563',
                                  transition: 'all 0.2s',
                                  fontFamily: BRAND.fonts.heading
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                  }
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

            {/* Selected Count */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: BRAND.colors.textLight, fontFamily: BRAND.fonts.body }}>
                Selected: <span style={{ fontWeight: '600', color: BRAND.colors.text }}>
                  {formData.giftingsNeeded.length} skill{formData.giftingsNeeded.length !== 1 ? 's' : ''}
                </span>
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getLocationDisplay = () => {
    if (formData.location === 'custom') return formData.customLocation;
    return formData.location.charAt(0).toUpperCase() + formData.location.slice(1);
  };

  const getTimeDisplay = () => {
    if (formData.urgency === 'asap') return `ASAP / Urgent (${formData.timePreference})`;
    if (formData.urgency === 'ongoing') {
      return `Ongoing starting ${formData.ongoingStartDate} at ${formData.ongoingStartTime} (${formData.ongoingSchedule})`;
    }
    if (formData.specificDate && formData.specificTime) {
      return `${formData.specificDate} at ${formData.specificTime}`;
    }
    return 'Specific date/time';
  };

  if (!user) return <div>Loading...</div>;

  if (showPreview) {
    const displayPeopleNeeded = formData.peopleNeeded === '5+' && formData.customPeopleCount 
      ? formData.customPeopleCount 
      : formData.peopleNeeded;
    
    const displayLocation = formData.location === 'custom' ? formData.customLocation : churchAddress;

    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#FDFBF7',
        padding: '24px' 
      }}>
        <div style={{ maxWidth: '32rem', margin: '0 auto', paddingTop: '32px' }}>
          {/* Title */}
          <h2 style={{ fontSize: '28px', marginBottom: '8px', fontWeight: 'bold', color: BRAND.colors.text, fontFamily: BRAND.fonts.heading }}>
            Preview Your Need
          </h2>
          <p style={{ color: BRAND.colors.textLight, marginBottom: '32px', fontSize: '14px', fontFamily: BRAND.fonts.body }}>
            This is how your need will appear to members on the dashboard
          </p>

          {/* Need Card Preview - EXACT DASHBOARD MATCH */}
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            padding: '24px',
            marginBottom: '32px',
            maxWidth: '28rem',
            margin: '0 auto 32px'
          }}>
            {/* Title */}
            <h3 style={{ 
              fontSize: '20px', 
              marginBottom: '12px', 
              fontWeight: '600',
              color: BRAND.colors.text,
              fontFamily: BRAND.fonts.heading,
              lineHeight: '1.4',
              textAlign: 'center'
            }}>
              {formData.title || 'Need Title'}
            </h3>

            {/* Description */}
            {formData.notes && (
              <p style={{ 
                fontSize: '15px', 
                marginBottom: '16px',
                color: '#424242',
                fontFamily: BRAND.fonts.body,
                lineHeight: '1.5'
              }}>
                {formData.notes}
              </p>
            )}

            {/* Metadata Row - Icons ABOVE text */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px', 
              marginBottom: '16px',
              paddingBottom: '16px',
              borderBottom: '1px solid #f3f4f6'
            }}>
              {/* Date */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Calendar size={20} color={BRAND.colors.primary} style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '12px', fontWeight: '500', color: BRAND.colors.text, display: 'block' }}>
                  {formatDate(formData.urgency, formData.specificDate, formData.ongoingStartDate)}
                  </span>
                <span style={{ fontSize: '12px', color: BRAND.colors.textLight, display: 'block' }}>
                  {formatTime(formData.specificTime || formData.ongoingStartTime) || 'Time TBD'}
                </span>
              </div>

              {/* Location */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <MapPin size={20} color={BRAND.colors.primary} style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '12px', fontWeight: '500', color: BRAND.colors.text, display: 'block' }}>
                  {getLocationLine1(displayLocation)}
                </span>
                <span style={{ fontSize: '12px', color: BRAND.colors.textLight, display: 'block' }}>
                  {getLocationLine2(displayLocation)}
                </span>
            </div>

              {/* People Needed */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Users size={20} color={BRAND.colors.primary} style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '12px', fontWeight: '500', color: BRAND.colors.text, display: 'block' }}>
                  {displayPeopleNeeded}+ needed
                </span>
                <span style={{ fontSize: '12px', color: BRAND.colors.textLight, display: 'block' }}>
                  0 committed
                </span>
              </div>
              </div>

            {/* Skills Needed */}
            {formData.giftingsNeeded && formData.giftingsNeeded.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(() => {
                    const visibleSkills = showAllSkills ? formData.giftingsNeeded : formData.giftingsNeeded.slice(0, 6);
                    const hasMoreSkills = formData.giftingsNeeded.length > 6;
                    
                    return (
                      <>
                        {visibleSkills.map((gift: string) => (
                          <span
                            key={gift}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '16px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: BRAND.colors.primary,
                              fontFamily: BRAND.fonts.heading
                            }}
                          >
                            {gift}
                          </span>
                        ))}
                        
                        {/* Show More/Less Button */}
                        {hasMoreSkills && (
                          <button
                            onClick={() => setShowAllSkills(!showAllSkills)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '16px',
                              fontSize: '12px',
                              fontWeight: '500',
                              fontFamily: BRAND.fonts.heading,
                              backgroundColor: '#f3f4f6',
                              color: BRAND.colors.text,
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = BRAND.colors.primary;
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6';
                              e.currentTarget.style.color = BRAND.colors.text;
                            }}
                          >
                            {showAllSkills ? 'Show Less' : `+${formData.giftingsNeeded.length - 6} more`}
                          </button>
                        )}
                      </>
                    );
                  })()}
            </div>
          </div>
            )}

            {/* I Can Help Button (Preview - Disabled) */}
          <button 
              disabled
            style={{
              width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
              color: 'white',
                backgroundColor: BRAND.colors.primary,
              border: 'none',
                minHeight: '44px',
                opacity: 0.75,
                cursor: 'not-allowed',
                fontFamily: BRAND.fonts.heading
              }}
            >
              I Can Help
          </button>
        </div>

          {/* Action Buttons - Side by side */}
    <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            maxWidth: '28rem',
            margin: '0 auto'
          }}>
          <button 
              onClick={handlePrevious}
            style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: BRAND.colors.text,
              cursor: 'pointer',
                minHeight: '44px',
                fontWeight: '500',
                fontFamily: BRAND.fonts.heading,
                transition: 'background-color 0.2s',
                flex: 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <ArrowLeft size={16} />
              Edit Need
            </button>
            
            <button
              onClick={() => {
                console.log('[ShareNeed] Post button clicked');
                handleSubmit();
              }}
              style={{
              display: 'flex',
              alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                color: 'white',
                backgroundColor: BRAND.colors.primary,
                border: 'none',
                cursor: 'pointer',
                minHeight: '44px',
                fontFamily: BRAND.fonts.heading,
                transition: 'background-color 0.2s',
                flex: 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = BRAND.colors.primary}
            >
              <CheckCircle size={16} />
              Post Need
          </button>
        </div>
        </div>
      </div>
    );
  }

  const handleClose = () => {
    if (confirm('Are you sure? Your progress will be lost.')) {
      router.push('/dashboard');
    }
  };

  const getProgress = () => {
    if (showPreview) return 100;
    return ((currentStep + 1) / totalSteps) * 100;
  };

  const getStepText = () => {
    if (showPreview) return 'Preview';
    return `Step ${currentStep + 1} of ${totalSteps}`;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#FDFBF7',
      paddingBottom: '80px'
    }}>
      {/* Consistent Header with Close & Progress */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Close button on left */}
          <button 
            onClick={handleClose}
            className="p-2 active:bg-gray-100 rounded-full transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Close"
          >
            <ArrowLeft size={22} style={{ color: '#374151' }} />
          </button>
          
          {/* Title centered */}
          <h1 className="text-lg font-semibold text-gray-900" style={{ fontFamily: BRAND.fonts.heading }}>
            Share a Need
          </h1>
          
          {/* Empty right side for balance */}
          <div style={{ width: '44px' }}></div>
        </div>
        
        {/* Progress bar below header */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600" style={{ fontFamily: BRAND.fonts.body }}>
              {getStepText()}
            </span>
            <span className="text-sm font-medium" style={{ color: BRAND.colors.primary, fontFamily: BRAND.fonts.heading }}>
              {Math.round(getProgress())}% complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${getProgress()}%`,
                backgroundColor: BRAND.colors.primary
              }}
            />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}
      className="sm:p-6"
      >
        {renderStep()}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={currentStep === 0 ? () => router.push('/dashboard') : handlePrevious}
            className="active:scale-95"
            style={{ 
              backgroundColor: '#f3f4f6', 
              border: '1px solid #d1d5db', 
              padding: '14px 24px', 
              borderRadius: 8, 
              cursor: 'pointer',
              minHeight: '48px',
              fontSize: '15px',
              fontFamily: BRAND.fonts.heading,
              fontWeight: '500',
              transition: 'all 0.15s ease'
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onTouchEnd={(e) => {
              const target = e.currentTarget;
              setTimeout(() => {
                if (target && target.style) {
                  target.style.backgroundColor = '#f3f4f6';
                }
              }, 150);
            }}
          >
            ← {currentStep === 0 ? 'Back' : 'Previous'}
          </button>
          
          <button 
            onClick={handleNext}
            disabled={!canContinue()}
            className={canContinue() ? 'active:scale-95' : ''}
            style={{
              backgroundColor: canContinue() ? BRAND.colors.primary : '#e5e7eb',
              color: canContinue() ? 'white' : '#9ca3af',
              border: 'none',
              padding: '14px 24px',
              borderRadius: 8,
              cursor: canContinue() ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              minHeight: '48px',
              fontSize: '16px',
              fontFamily: BRAND.fonts.heading,
              transition: 'all 0.15s ease'
            }}
            onTouchStart={(e) => {
              if (canContinue()) {
                e.currentTarget.style.backgroundColor = BRAND.colors.primaryHover;
                e.currentTarget.style.transform = 'scale(0.98)';
              }
            }}
            onTouchEnd={(e) => {
              if (canContinue()) {
                const target = e.currentTarget;
                setTimeout(() => {
                  if (target && target.style) {
                    target.style.backgroundColor = BRAND.colors.primary;
                    target.style.transform = 'scale(1)';
                  }
                }, 150);
              }
            }}
          >
            {currentStep === totalSteps - 1 ? 'Preview' : 'Next Step'} →
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 40,
            maxWidth: 500,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Success Icon */}
            <div style={{
              width: 80,
              height: 80,
              backgroundColor: '#2BB3A3',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-6)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <CheckCircle size={40} color="white" strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-bold)',
              color: '#333333',
              margin: '0 0 var(--space-4)',
              fontFamily: 'var(--font-family)'
            }}>
              Need Shared Successfully!
            </h2>

            {/* Message */}
            <p style={{
              fontSize: 'var(--text-base)',
              color: '#666666',
              margin: '0 0 var(--space-8)',
              lineHeight: 1.5
            }}>
              {isLeaderUser ? (
                <>
                  Your need has been <strong>automatically approved</strong> and is now live! 
                  Community members with matching gifts and availability will be notified.
                </>
              ) : (
                <>
                  Your need has been submitted and will be reviewed by our leadership team. 
                  We'll notify you once it's approved and ready to share with the community.
                </>
              )}
            </p>

            {/* Action Button */}
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/dashboard');
              }}
              style={{
                backgroundColor: '#2BB3A3',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-6)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-semibold)',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                minWidth: 120
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#259a8a'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2BB3A3'}
            >
              Return to Dashboard
            </button>

            {/* Footer */}
            <p style={{
              fontSize: 14,
              color: '#9ca3af',
              margin: '24px 0 0',
              fontStyle: 'italic'
            }}>
              Thank you for helping activate gifts in our community
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

