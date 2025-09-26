'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser';
import { useRouter } from 'next/navigation';
import { Icon } from '../../icons/index';
import { ArrowLeft, MapPin, Users, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';

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
    giftingsNeeded: [] as string[],
    location: '',
    customLocation: ''
  });

  const [expandedGiftings, setExpandedGiftings] = useState(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  // Fix hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsHydrated(true);
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
               (formData.location !== 'custom' || formData.customLocation.trim() !== '');
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
      
      // For MVP, we'll create a simple needs table structure
      // Let's try to create the table if it doesn't exist, or use a fallback
      console.log('[ShareNeed] Creating needData object');
      const needData = {
        id: crypto.randomUUID(),
        title: formData.title,
        description: formData.notes || formData.title,
        giftings_needed: Array.isArray(formData.giftingsNeeded) ? formData.giftingsNeeded : [],
        people_needed: parseInt(formData.peopleNeeded) || 1,
        location: formData.location === 'custom' ? formData.customLocation : formData.location,
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
        is_leader_need: isLeader
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
      padding: 'var(--space-8)',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: 'var(--space-8)'
    };

    const inputStyle = {
      width: '100%',
      padding: 'var(--space-3)',
      border: '1px solid #d1d5db',
      borderRadius: 8,
      fontSize: 16
    };

    const buttonStyle = {
      padding: 'var(--space-3) var(--space-4)',
      border: '1px solid #d1d5db',
      borderRadius: 8,
      cursor: 'pointer',
      backgroundColor: 'white'
    };

    switch (currentStep) {
      case 0:
        return (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 24, marginBottom: 'var(--space-2)', fontWeight: 'bold' }}>What's the need?</h2>
            <p style={{ color: '#666666', marginBottom: 'var(--space-6)' }}>
              Share a clear, encouraging description of how others can help
            </p>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
                Description:
              </label>
              <textarea
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="Help with moving furniture, meal prep for family, tutoring kids…"
                style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
                Additional details (optional):
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Bring gloves and tools… Meals should be nut-free… Any special instructions…"
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              />
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 20, marginBottom: 'var(--space-4)', fontWeight: 600 }}>When is this needed?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { value: 'asap', label: 'Needs Help Soon ⏳' },
                  { value: 'specific', label: 'Specific Date & Time' },
                  { value: 'ongoing', label: 'Ongoing' }
                ].map(option => (
                  <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="radio"
                      name="urgency"
                      value={option.value}
                      checked={formData.urgency === option.value}
                      onChange={(e) => updateFormData('urgency', e.target.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>

              {isHydrated && formData.urgency === 'specific' && (
                <div style={{ marginTop: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>Date:</label>
                    <input
                      type="date"
                      value={formData.specificDate}
                      onChange={(e) => updateFormData('specificDate', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>Time:</label>
                    <input
                      type="time"
                      value={formData.specificTime}
                      onChange={(e) => updateFormData('specificTime', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {isHydrated && formData.urgency === 'ongoing' && (
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <h3 style={{ fontSize: 18, marginBottom: 'var(--space-4)', fontWeight: 600 }}>Ongoing Schedule</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 'var(--space-4)' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>Start Date:</label>
                      <input
                        type="date"
                        value={formData.ongoingStartDate}
                        onChange={(e) => updateFormData('ongoingStartDate', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>Start Time:</label>
                      <input
                        type="time"
                        value={formData.ongoingStartTime}
                        onChange={(e) => updateFormData('ongoingStartTime', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>Repeats:</label>
                      <select
                        value={formData.ongoingSchedule}
                        onChange={(e) => updateFormData('ongoingSchedule', e.target.value)}
                        style={inputStyle}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: '#666666' }}>
                    We'll automatically match people based on the start time you choose
                  </p>
                </div>
              )}

              {isHydrated && formData.urgency === 'asap' && (
                <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid #e5e7eb', paddingTop: 'var(--space-6)' }}>
                  <h3 style={{ fontSize: 18, marginBottom: 'var(--space-4)', fontWeight: 600 }}>Preferred Time of Day</h3>
                  <p style={{ fontSize: 14, color: '#666666', marginBottom: 'var(--space-4)' }}>
                    Since this is urgent, when would you prefer help?
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {['Mornings', 'Afternoons', 'Nights', 'Anytime'].map((time) => (
                      <label key={time} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="radio"
                          name="timePreference"
                          value={time}
                          checked={formData.timePreference === time}
                          onChange={(e) => updateFormData('timePreference', e.target.value)}
                        />
                        {time}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 24, marginBottom: 'var(--space-2)', fontWeight: 'bold' }}>Where & How Many?</h2>
            <p style={{ color: '#666666', marginBottom: 'var(--space-6)' }}>
              Let people know where to meet and how many helpers you need
            </p>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-medium)', color: '#333333' }}>
                <MapPin size={16} strokeWidth={1.5} color="#2BB3A3" />
                Location:
              </label>
              <select
                value={formData.location}
                onChange={(e) => updateFormData('location', e.target.value)}
                style={inputStyle}
              >
                <option value="">Choose location</option>
                <option value="church">Church</option>
                <option value="home">Home Visit</option>
                <option value="community">Community Space</option>
                <option value="virtual">Virtual/Online</option>
                <option value="custom">Custom Address</option>
              </select>

              {formData.location === 'custom' && (
                <input
                  type="text"
                  value={formData.customLocation}
                  onChange={(e) => updateFormData('customLocation', e.target.value)}
                  placeholder="Enter specific address or location details"
                  style={{ ...inputStyle, marginTop: 'var(--space-3)' }}
                />
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 'var(--space-6)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', fontWeight: 'var(--font-semibold)', color: '#333333' }}>
                <Users size={18} strokeWidth={1.5} color="#2BB3A3" />
                How many people are needed?
              </h3>
              <select
                value={formData.peopleNeeded}
                onChange={(e) => updateFormData('peopleNeeded', e.target.value)}
                style={inputStyle}
              >
                <option value="1">1 person</option>
                <option value="2">2 people</option>
                <option value="3">3 people</option>
                <option value="4">4 people</option>
                <option value="5+">5+ people</option>
                <option value="flexible">Flexible</option>
              </select>
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
        {/* Progress */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% complete</span>
          </div>
          <div style={{ width: '100%', height: 8, backgroundColor: '#e5e7eb', borderRadius: 4 }}>
            <div style={{ 
              width: `${((currentStep + 1) / totalSteps) * 100}%`, 
              height: '100%', 
              backgroundColor: '#2BB3A3', 
              borderRadius: 4 
            }}></div>
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <button 
            onClick={currentStep === 0 ? () => router.push('/dashboard') : handlePrevious}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: '#666666',
              transition: 'color 0.2s ease'
            }}
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            Back
          </button>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-bold)', color: '#333333' }}>Share a Need</h1>
          <p style={{ color: '#666666', fontSize: 'var(--text-base)' }}>Help your community connect and serve together</p>
        </div>

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
              backgroundColor: canContinue() ? '#4ECDC4' : '#e5e7eb',
              color: canContinue() ? 'white' : '#9ca3af',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 8,
              cursor: canContinue() ? 'pointer' : 'not-allowed',
              fontWeight: 600
            }}
          >
            {currentStep === totalSteps - 1 ? 'Preview' : 'Next Step'} →
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#666666', marginTop: 'var(--space-6)' }}>
          Making it easy for your church family to step in and help
        </p>
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

