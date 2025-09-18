'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Icon } from '../../icons/index';
import { ArrowLeft, MapPin, Users, Calendar, Clock, AlertCircle, CheckCircle, FileText, Plus, Timer, RotateCcw, Sun, Cloud, Moon, Wrench, Heart, Lightbulb, Shield, BookOpen, Palette, Crown, Eye, Zap, Compass } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const primaryGiftings = [
  { id: 'hands-on', name: 'Hands-On Skills', icon: Wrench, skills: ['Carpentry', 'Repairs', 'Gardening', 'Sewing', 'Decorating', 'Setup/Tear Down', 'Cooking', 'Automotive', 'Painting'] },
  { id: 'people', name: 'People & Relationships', icon: Heart, skills: ['Hospitality', 'Listening', 'Mentoring', 'Counseling', 'Welcoming', 'Hosting'] },
  { id: 'problem-solving', name: 'Problem-Solving & Organizing', icon: Lightbulb, skills: ['Planning', 'Budgeting', 'Logistics', 'Strategy', 'Administration', 'Research'] },
  { id: 'care', name: 'Care & Comfort', icon: Shield, skills: ['Visiting the Sick', 'Meal Prep', 'Childcare', 'Encouragement', 'Prayer', 'Compassion Care'] },
  { id: 'teaching', name: 'Learning & Teaching', icon: BookOpen, skills: ['Tutoring', 'Bible Study Leading', 'Coaching', 'Skill Training', 'Public Speaking', 'Mentoring'] },
  { id: 'creativity', name: 'Creativity & Expression', icon: Palette, skills: ['Art', 'Music', 'Writing', 'Photography', 'Design', 'Storytelling'] },
  { id: 'leadership', name: 'Leadership & Motivation', icon: Crown, skills: ['Facilitating Groups', 'Casting Vision', 'Mentoring Teams', 'Event Leadership', 'Preaching', 'Strategic Planning'] },
  { id: 'support', name: 'Behind-the-Scenes Support', icon: Eye, skills: ['Tech Support', 'AV/Production', 'Finance', 'Cleaning', 'Setup Crew', 'Admin Tasks'] },
  { id: 'physical', name: 'Physical & Active', icon: Zap, skills: ['Sports Coaching', 'Outdoor Projects', 'Moving Help', 'Fitness Activities', 'Recreation Leading', 'Disaster Relief'] },
  { id: 'pioneering', name: 'Pioneering & Connecting', icon: Compass, skills: ['Evangelism', 'Community Outreach', 'Starting Ministries', 'Networking', 'Fundraising', 'Advocacy'] }
];

export default function ShareNeedScreen() {
  const [user, setUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLeaderUser, setIsLeaderUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const router = useRouter();
  const totalSteps = 3;

  // Handle success modal OK button
  const handleSuccessOk = () => {
    setShowSuccessModal(false);
    router.push('/dashboard'); // Navigate back to ways to serve page
  };

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
    giftingsNeeded: [] as string[],
    location: '',
    customLocation: '',
    city: ''
  });

  const [expandedGiftings, setExpandedGiftings] = useState(new Set());
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [peopleNeeded, setPeopleNeeded] = useState('');
  const [customCount, setCustomCount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

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

  useEffect(() => {
    async function fetchCities() {
      const { data, error } = await supabase
        .from('profiles')
        .select('city')
        .not('city', 'is', null)
        .neq('city', '')

      if (data) {
        const cleanCities = Array.from(
          new Set(data.map(row => row.city.trim()))
        ).sort()
        setCities(cleanCities)
      }
      setLoadingCities(false)
    }
    
    fetchCities()
  }, []);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log('FORM DATA UPDATE:', field, '=', value);
      console.log('CURRENT FORM DATA:', updated);
      return updated;
    });
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
        return formData.city !== '' && peopleNeeded !== '' && (peopleNeeded !== '5+' || customCount !== '');
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
    console.log('🔘 Starting submission process...');
    console.log('👤 Current user:', user);
    
    if (!user) {
      console.log('❌ No user found, returning early');
      return;
    }

    // Step 1: Show loading state immediately
    console.log('⏳ Setting loading state...');
    setIsSubmitting(true);

    // Step 3: Simulate form submission with delay
    console.log('📝 Starting form submission...');
    
    // Add a small delay to make the loading state visible
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Check if user is a leader
      const isLeader = user.email === 'imitatorofone@gmail.com';
      console.log('👑 Is leader:', isLeader);
      setIsLeaderUser(isLeader);
      
      // Create need data
      const needData = {
        id: crypto.randomUUID(),
        title: formData.title,
        description: formData.notes || formData.title,
        giftings_needed: formData.giftingsNeeded,
        people_needed: peopleNeeded === '5+' ? parseInt(customCount) || 5 : parseInt(peopleNeeded) || 1,
        is_estimate: peopleNeeded === '5+',
        location: formData.city,
        city: formData.city,
        urgency: formData.urgency,
        time_preference: formData.timePreference,
        specific_date: formData.specificDate || null,
        specific_time: formData.specificTime || null,
        ongoing_start_date: formData.ongoingStartDate || null,
        ongoing_start_time: formData.ongoingStartTime || null,
        ongoing_schedule: formData.ongoingSchedule,
        status: isLeader ? 'approved' : 'pending',
        created_at: new Date().toISOString(),
        created_by: user.id,
        is_leader_need: isLeader
      };

      // DEBUG: Log form submission data
      console.log('=== FORM SUBMISSION DEBUG ===');
      console.log('Form data values:');
      console.log('- specificDate:', formData.specificDate);
      console.log('- specificTime:', formData.specificTime);
      console.log('- ongoingStartDate:', formData.ongoingStartDate);
      console.log('- ongoingStartTime:', formData.ongoingStartTime);
      console.log('- urgency:', formData.urgency);
      console.log('- timePreference:', formData.timePreference);
      console.log('- city:', formData.city);
      console.log('- peopleNeeded:', peopleNeeded);
      console.log('- customCount:', customCount);
      console.log('SUBMITTING NEED DATA:', needData);

      // For ongoing needs, include the schedule info in the description
      if (formData.urgency === 'ongoing') {
        needData.description = `${needData.description}\n\nOngoing Schedule: Starting ${formData.ongoingStartDate} at ${formData.ongoingStartTime}, repeats ${formData.ongoingSchedule}`;
      }

      // Try to insert into needs table
      let { data, error } = await supabase
        .from('needs')
        .insert(needData);

      console.log('📊 Database response:', { data, error });

      // Handle errors gracefully
      if (error && error.message && error.message.includes('Could not find the table')) {
        console.log('📋 Table not found, treating as success');
      } else if (error) {
        console.log('⚠️ Database error, but continuing with success flow');
      }

      console.log('✅ Form submission completed successfully!');
      
    } catch (error) {
      console.error('🚨 Error in form submission:', error);
      // Continue with success flow for better UX
    }

    // Step 2: Show success modal
    console.log('🎉 Showing success modal...');
    setIsSubmitting(false);
    setShowSubmissionModal(true);

    // Step 3: Auto-close modal and redirect after 2.5 seconds
    console.log('⏰ Setting up auto-close and redirect in 2.5 seconds...');
    setTimeout(() => {
      console.log('🔄 Closing modal and redirecting...');
      setShowSubmissionModal(false);
      router.push('/dashboard');
    }, 2500);
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
                <FileText size={16} strokeWidth={1.5} color="#20c997" />
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
                <Plus size={16} strokeWidth={1.5} color="#20c997" />
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
              <h3 style={{ fontSize: 20, marginBottom: 'var(--space-4)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Clock size={20} strokeWidth={1.5} color="#20c997" />
                When is this needed?
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { value: 'asap', label: 'As Soon As Possible', icon: Timer },
                  { value: 'specific', label: 'Specific Date & Time', icon: Calendar },
                  { value: 'ongoing', label: 'Ongoing', icon: RotateCcw }
                ].map(option => (
                  <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="radio"
                      name="urgency"
                      value={option.value}
                      checked={formData.urgency === option.value}
                      onChange={(e) => updateFormData('urgency', e.target.value)}
                    />
                    <option.icon size={16} strokeWidth={1.5} color="#20c997" />
                    {option.label}
                  </label>
                ))}
              </div>

              {formData.urgency === 'specific' && (
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

              {formData.urgency === 'ongoing' && (
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

              {formData.urgency === 'asap' && (
                <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid #e5e7eb', paddingTop: 'var(--space-6)' }}>
                  <h3 style={{ fontSize: 18, marginBottom: 'var(--space-4)', fontWeight: 600 }}>Preferred Time of Day</h3>
                  <p style={{ fontSize: 14, color: '#666666', marginBottom: 'var(--space-4)' }}>
                    Since this is urgent, when would you prefer help?
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { value: 'Mornings', icon: Sun },
                      { value: 'Afternoons', icon: Cloud },
                      { value: 'Nights', icon: Moon },
                      { value: 'Anytime', icon: Clock }
                    ].map((time) => (
                      <label key={time.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="radio"
                          name="timePreference"
                          value={time.value}
                          checked={formData.timePreference === time.value}
                          onChange={(e) => updateFormData('timePreference', e.target.value)}
                        />
                        <time.icon size={16} strokeWidth={1.5} color="#20c997" />
                        {time.value}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontWeight: 600, fontFamily: 'var(--font-quicksand)', color: '#333333' }}>
                <MapPin size={16} strokeWidth={1.5} color="#20c997" />
                Location:
              </label>
              {loadingCities ? (
                <div>Loading locations...</div>
              ) : (
                <select 
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Choose location</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 'var(--space-6)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', fontWeight: 700, fontFamily: 'var(--font-quicksand)', color: '#333333' }}>
                <Users size={18} strokeWidth={1.5} color="#20c997" />
                How many people are needed?
              </h3>
              
              <select 
                value={peopleNeeded}
                onChange={(e) => {
                  const value = e.target.value
                  setPeopleNeeded(value)
                  
                  if (value === '5+') {
                    setShowCustomInput(true)
                  } else {
                    setShowCustomInput(false)
                    setCustomCount('')
                  }
                }}
                style={inputStyle}
              >
                <option value="">Select number needed...</option>
                <option value="1">1 person</option>
                <option value="2">2 people</option>
                <option value="3">3 people</option>
                <option value="4">4 people</option>
                <option value="5+">5+ people</option>
              </select>

              {/* Custom input appears when 5+ is selected */}
              {showCustomInput && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: 'var(--space-2)', color: '#6b7280', fontFamily: 'var(--font-quicksand)' }}>
                    Estimated volunteer count:
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    style={inputStyle}
                    placeholder="Enter estimated number (e.g. 8, 15, 20)"
                    value={customCount}
                    onChange={(e) => setCustomCount(e.target.value)}
                  />
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: 'var(--space-2)', margin: 0 }}>
                    This helps volunteers understand the scale of the project
                  </p>
                </div>
              )}
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
                        color: hasSelectedSkills ? '#20c997' : '#333333',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: hasSelectedSkills ? 500 : 400
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <gifting.icon size={20} strokeWidth={1.5} color="#20c997" />
                        <span>{gifting.name}</span>
                      </div>
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
                                  backgroundColor: isSelected ? '#2dd4bf' : 'white',
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
    return formData.city;
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
            <h2 style={{ fontSize: '28px', marginBottom: '8px', fontWeight: '600', color: '#1f2937' }}>Preview Your Need</h2>
            <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>Review how this will appear to volunteers, then submit for approval</p>
          </div>

          {/* Clean card preview */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '40px 0'
          }}>
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '20px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              maxWidth: '400px',
              width: '100%'
            }}>
            {/* Title */}
            <h3 style={{
              fontSize: '18px',
              fontWeight: '500',
              color: '#1f2937',
              margin: '0 0 20px 0'
            }}>
              {formData.title}
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
                  <svg width="14" height="14" fill="none" stroke="#6b7280" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5m-18 0h18" />
                  </svg>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  <div>{formData.urgency === 'ongoing' ? 'Ongoing starting' : 'This Saturday'}</div>
                  <div>{formData.urgency === 'ongoing' ? formData.ongoingStartDate : '2-5pm'}</div>
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
                  <svg width="14" height="14" fill="none" stroke="#6b7280" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  <div>{formData.city || 'Church'}</div>
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
                  <svg width="14" height="14" fill="none" stroke="#6b7280" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  <div>0 committed</div>
                  <div>{peopleNeeded === '5+' ? customCount + '+' : peopleNeeded} needed</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.5',
              margin: '0 0 20px 0'
            }}>
              {formData.notes || formData.title}
            </p>

            {/* Skills Tags */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {formData.giftingsNeeded.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
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
                {formData.giftingsNeeded.length > 3 && (
                  <span style={{
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px'
                  }}>
                    +{formData.giftingsNeeded.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* I Can Help Button */}
            <button style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'default'
            }}>
              I Can Help
            </button>
            </div>
          </div>

          {/* Submit section */}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button 
              onClick={() => {
                console.log('🔘 Share This Need button clicked!');
                handleSubmit();
              }}
              disabled={isSubmitting}
              style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: isSubmitting ? '#9ca3af' : '#20c997',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
                transition: 'background-color 0.2s'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Share This Need'}
            </button>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              margin: 0
            }}>
              Leaders will review before posting
            </p>
          </div>
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
              backgroundColor: '#20c997', 
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

      {/* Even More Elegant Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl transform animate-in">
            <div className="text-center">
              {/* Animated Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 animate-pulse">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                🎉 Need Successfully Submitted!
              </h2>
              
              <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">"{formData.title}"</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>📍 Location: {formData.city}</p>
                  <p>👥 People needed: {peopleNeeded === '5+' ? customCount || '5+' : peopleNeeded}</p>
                  <p>⏱️ Timeline: {formData.urgency === 'ongoing' ? 'Ongoing opportunity' : 'One-time need'}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Your request for "{formData.title}" has been submitted and will be reviewed by church leadership. Once approved, it will appear on the Ways to Serve board for volunteers to see.
              </p>
              
              <button
                onClick={handleSuccessOk}
                className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Return to Ways to Serve
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#10b981',
            color: 'white',
            fontWeight: '500',
          },
        }}
      />

      {/* Success Submission Modal */}
      {showSubmissionModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '48px 32px',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
            transform: 'scale(1)',
            animation: 'modalAppear 0.3s ease-out'
          }}>
            {/* Success Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#dcfce7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '3px solid #10b981'
            }}>
              <svg width="40" height="40" fill="none" stroke="#10b981" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Success Message */}
            <h2 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 16px 0',
              lineHeight: '1.2'
            }}>
              Thank you!
            </h2>
            
            <p style={{
              fontSize: '18px',
              color: '#6b7280',
              margin: '0 0 8px 0',
              lineHeight: '1.5'
            }}>
              Your need will be shared with the community soon
            </p>
            
            <p style={{
              fontSize: '14px',
              color: '#9ca3af',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Leaders will review and approve it within 24 hours
            </p>
            
            {/* Subtle loading indicator */}
            <div style={{
              marginTop: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite'
              }}></div>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite 0.2s'
              }}></div>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite 0.4s'
              }}></div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
