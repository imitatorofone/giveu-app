'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser';
import { useRouter } from 'next/navigation';
import { Icon } from '../../icons/index';
import { ArrowLeft, MapPin, Users, Calendar, Clock, AlertCircle, CheckCircle, FileText, Plus, Sun, Cloud, Moon, Home, ArrowRight } from 'lucide-react';
import { createNotification } from '../../lib/notificationHelper';
import { BRAND } from '../../lib/brandConfig';

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

  const toggleExpanded = (giftingId: unknown) => {
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
      setShowSuccessModal(true);
      console.log('[ShareNeed] showSuccessModal state set');
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error submitting need: ${errorMessage}. Please try again.`);
    }
  };

  const renderStep = () => {
    const cardStyle = {
      backgroundColor: 'white',
      padding: '32px',
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
          <div style={cardStyle}>
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
          <div style={cardStyle}>
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
          <div style={cardStyle}>
            <h2 style={{ fontSize: 24, marginBottom: 'var(--space-2)', fontWeight: 'bold' }}>What skills are needed?</h2>
            <p style={{ color: '#666666', marginBottom: 'var(--space-6)' }}>
              Select the gift areas and specific skills that would be most helpful
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {primaryGiftings.map((gifting) => {
                const isExpanded = expandedGiftings.has(gifting.id);
                const hasSelectedSkills = gifting.skills.some(skill => formData.giftingsNeeded.includes(skill));
                
                return (
                  <div key={gifting.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <button
                      onClick={() => toggleExpanded(gifting.id)}
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: 'none',
                        backgroundColor: hasSelectedSkills ? '#f0fdfa' : 'white',
                        color: hasSelectedSkills ? '#2BB3A3' : '#333333',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: hasSelectedSkills ? 500 : 400
                      }}
                    >
                      <span>{gifting.name}</span>
                      <span style={{ fontSize: 18 }}>
                        {isExpanded ? '−' : '+'}
                      </span>
                    </button>
                    
                    {isExpanded && (
                      <div style={{ 
                        padding: '16px', 
                        backgroundColor: '#f9fafb',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                          gap: 8 
                        }}>
                          {gifting.skills.map((skill) => {
                            const isSelected = formData.giftingsNeeded.includes(skill);
                            return (
                              <button
                                key={skill}
                                onClick={() => toggleGifting(skill)}
                                style={{
                                  padding: '8px 12px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? '#3b82f6' : 'white',
                                  color: isSelected ? 'white' : '#333333',
                                  fontWeight: isSelected ? 500 : 400,
                                  textAlign: 'center',
                                  fontSize: 14
                                }}
                              >
                                {skill}
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

            <p style={{ textAlign: 'center', marginTop: 16, color: '#666666' }}>
              Selected: {formData.giftingsNeeded.length} skill{formData.giftingsNeeded.length !== 1 ? 's' : ''}
            </p>
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
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#FDFBF7',
        padding: 'var(--space-6)' 
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 'var(--space-8)' }}>
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <button 
              onClick={handlePrevious}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: 'var(--text-base)', 
                cursor: 'pointer',
                marginBottom: 'var(--space-4)',
                color: 'var(--gray-600)',
                transition: 'color 0.2s ease'
              }}
            >
              ← Back
            </button>
            <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-bold)' }}>Preview Your Need</h1>
            <p style={{ color: 'var(--gray-600)' }}>This is how it will appear on the Ways to Serve board</p>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            padding: 'var(--space-8)', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--gray-200)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: 'var(--space-8)'
          }}>
            {isHydrated && formData.urgency === 'asap' && (
              <div style={{ 
                backgroundColor: 'var(--error-light)', 
                color: 'var(--error)', 
                padding: 'var(--space-4)', 
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-6)',
                fontWeight: 'var(--font-semibold)'
              }}>
                Needs Help Soon ⏳
              </div>
            )}

            <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)', fontWeight: 'var(--font-bold)' }}>{formData.title}</h3>
            
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>Skills needed:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {formData.giftingsNeeded.map((gifting) => (
                  <span key={gifting} style={{ 
                    backgroundColor: 'var(--brand-primary-50)', 
                    color: 'var(--brand-primary-600)', 
                    padding: 'var(--space-1) var(--space-2)', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: 'var(--text-xs)' 
                  }}>
                    {gifting}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#f0fdfa', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid #2BB3A3' }}>
              <div style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Calendar size={16} strokeWidth={1.5} color="#2BB3A3" />
                <span style={{ color: '#333333' }}>{getTimeDisplay()}</span>
              </div>
              <div style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <MapPin size={16} strokeWidth={1.5} color="#2BB3A3" />
                <span style={{ color: '#333333' }}>{getLocationDisplay()}</span>
              </div>
              <div style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Users size={16} strokeWidth={1.5} color="#2BB3A3" />
                <span style={{ color: '#333333' }}>{formData.peopleNeeded} people needed</span>
              </div>
              {formData.notes && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <AlertCircle size={16} strokeWidth={1.5} color="#2BB3A3" />
                  <span style={{ color: '#333333' }}>{formData.notes}</span>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => {
              console.log('[ShareNeed] Button clicked');
              handleSubmit();
            }}
            style={{
              width: '100%',
              backgroundColor: '#2BB3A3',
              color: 'white',
              border: 'none',
              padding: '16px',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 'var(--space-4)'
            }}
          >
            Share This Need
          </button>
          <p style={{ textAlign: 'center', color: '#666666' }}>
            Your need will be reviewed by leaders before being shared
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#FDFBF7',
      padding: 20 
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 32 }}>
        {/* Removed duplicate progress bar and back button - now only in modal */}

        {renderStep()}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={currentStep === 0 ? () => router.push('/dashboard') : handlePrevious}
            style={{ 
              backgroundColor: '#f3f4f6', 
              border: '1px solid #d1d5db', 
              padding: '12px 20px', 
              borderRadius: 8, 
              cursor: 'pointer' 
            }}
          >
            ← {currentStep === 0 ? 'Back' : 'Previous'}
          </button>
          
          <button 
            onClick={handleNext}
            disabled={!canContinue()}
            style={{
              backgroundColor: canContinue() ? '#20c997' : '#e5e7eb',
              color: canContinue() ? 'white' : '#9ca3af',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 8,
              cursor: canContinue() ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              minHeight: '44px',
              fontFamily: BRAND.fonts.heading,
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (canContinue()) {
                e.currentTarget.style.backgroundColor = '#1ba87f';
              }
            }}
            onMouseLeave={(e) => {
              if (canContinue()) {
                e.currentTarget.style.backgroundColor = '#20c997';
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

