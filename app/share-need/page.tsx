'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Session } from '@supabase/supabase-js';
import { Icon } from '../../icons/index';
import { ArrowLeft, MapPin, Users, Calendar, Clock, AlertCircle, CheckCircle, FileText, Plus, Timer, RotateCcw, Sun, Cloud, Moon, Wrench, Heart, Lightbulb, Shield, BookOpen, Palette, Crown, Eye, Zap, Compass, X, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../../components/Footer';

const brand = '#20c997';


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
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLeaderUser, setIsLeaderUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [canContinueState, setCanContinueState] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isModal = searchParams?.get('modal') === '1';
  const totalSteps = 3;


  // Handle success modal OK button
  const handleSuccessOk = () => {
    setShowSuccessModal(false);
    // Clear saved form data when navigating away
    if (typeof window !== 'undefined') {
      localStorage.removeItem('share-need-form-data');
    }
    router.push('/dashboard'); // Navigate back to ways to serve page
  };

  // Initialize form data with persistence across HMR
  const getInitialFormData = () => {
    const defaultData = {
      title: '',
      description: '',
      urgency: 'specific' as const,
      specificDate: '',
      specificTime: '',
      timePreference: '', // Only used for "Needs Help Soon"
      ongoingStartDate: '',
      ongoingStartTime: '',
      ongoingSchedule: 'weekly' as const, // weekly, monthly, quarterly
      notes: '',
      giftingsNeeded: [] as string[],
      location: '',
      customLocation: '',
      city: ''
    };

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('share-need-form-data');
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          // Ensure description field exists (for backward compatibility)
          return { ...defaultData, ...parsedData, description: parsedData.description || '' };
        } catch (e) {
          console.log('Failed to parse saved form data, using defaults');
        }
      }
    }
    return defaultData;
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const isUpdatingRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const notesInputRef = useRef<HTMLTextAreaElement>(null);

  // Diagnostic: Track component re-renders
  useEffect(() => {
    console.log('🔄 COMPONENT RE-RENDERED');
  });

  const [expandedGiftings, setExpandedGiftings] = useState(new Set());
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [peopleNeeded, setPeopleNeeded] = useState('');
  const [customCount, setCustomCount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Auth is now handled safely by useSupabaseSession hook
  // No more blocking auth checks that cause AuthSessionMissingError

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

  const updateFormData = useCallback((field: string, value: string) => {
    console.log('🔄 UPDATE FORM DATA:', field, '=', value);
    setFormData((prev: any) => {
      // Only update if the value actually changed
      if (prev[field as keyof typeof prev] === value) {
        console.log('⚠️ Value unchanged, skipping update');
        return prev;
      }
      const updated = { ...prev, [field]: value };
      console.log('✅ FORM DATA UPDATED:', updated);
      return updated;
    });
  }, []);

  const toggleGifting = (gifting: string) => {
    setFormData((prev: any) => ({
      ...prev,
      giftingsNeeded: prev.giftingsNeeded.includes(gifting)
        ? prev.giftingsNeeded.filter((g: any) => g !== gifting)
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
        const basicValid = formData.title?.trim().length >= 5 && (formData.description || '').trim().length >= 20 && formData.urgency !== '';
        const specificValid = formData.urgency !== 'specific' || (formData.specificDate && formData.specificTime);
        const ongoingValid = formData.urgency !== 'ongoing' || (formData.ongoingStartDate && formData.ongoingStartTime);
        const asapValid = formData.urgency !== 'asap' || formData.timePreference !== '';
        return basicValid && specificValid && ongoingValid && asapValid;
      case 1: 
        return formData.city !== '' && peopleNeeded !== '' && (peopleNeeded !== '10+' || customCount !== '');
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
    console.log('🔘 Share This Need button clicked!');
    console.log('🔘 Starting submission process...');
    
    // Get fresh session directly from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('👤 Current session:', session);
    
    if (!session) {
      toast.error('Please sign in to submit a need');
      router.push('/dashboard');
      return;
    }

    setIsSubmitting(true);
    console.log('📤 Submitting need with data:', formData);

    try {
      const { data, error } = await supabase
        .from('needs')
        .insert([{
          title: formData.title,
          description: formData.description || formData.notes || formData.title,
          urgency: formData.urgency,
          city: formData.city,
          giftings_needed: formData.giftingsNeeded || [],
          created_by: session.user.id,
          status: 'pending'
        }])
        .select();

      console.log('✅ Insert response:', { data, error });

      if (error) throw error;

      // Clear saved form data on successful submission
      if (typeof window !== 'undefined') {
        localStorage.removeItem('share-need-form-data');
      }

      toast.success('Need submitted for leadership review!');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('❌ Submit error:', err);
      toast.error(`Failed to submit: ${err.message}`);
    } finally {
      setIsSubmitting(false);
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
                <FileText size={16} strokeWidth={1.5} color="#20c997" />
                Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                ref={titleInputRef}
                type="text"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (isUpdatingRef.current) {
                    return;
                  }
                  const value = e.target.value;
                  const cursorPos = e.target.selectionStart; // Save cursor position BEFORE state update
                  
                  console.log('📝 DIRECT TITLE UPDATE:', value);
                  isUpdatingRef.current = true;
                  setFormData((prev: any) => {
                    isUpdatingRef.current = false;
                    return { ...prev, title: value };
                  });
                  
                  // Restore cursor position after React re-renders
                  setTimeout(() => {
                    if (titleInputRef.current && cursorPos !== null) {
                      titleInputRef.current.setSelectionRange(cursorPos, cursorPos);
                    }
                  }, 0);
                }}
                placeholder="Help with moving furniture, meal prep for family, tutoring kids…"
                style={{ ...inputStyle, padding: '16px 20px' }}
              />
              </div>

              <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
                <Plus size={16} strokeWidth={1.5} color="#20c997" />
                Description <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                A short, clear summary of what's needed
              </p>
              <textarea
                ref={descriptionInputRef}
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  if (isUpdatingRef.current) {
                    return;
                  }
                  const value = e.target.value;
                  const cursorPos = e.target.selectionStart; // Save cursor position BEFORE state update
                  
                  console.log('📝 DIRECT DESCRIPTION UPDATE:', value);
                  isUpdatingRef.current = true;
                  setFormData((prev: any) => {
                    isUpdatingRef.current = false;
                    return { ...prev, description: value };
                  });
                  
                  // Restore cursor position after React re-renders
                  setTimeout(() => {
                    if (descriptionInputRef.current && cursorPos !== null) {
                      descriptionInputRef.current.setSelectionRange(cursorPos, cursorPos);
                    }
                  }, 0);
                }}
                placeholder="Help load, transport, and distribute groceries at mobile food pantry locations throughout the city."
                style={{ ...inputStyle, minHeight: 140, resize: 'vertical', padding: '16px 20px' }}
                rows={7}
              />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 'var(--space-6)', marginTop: '24px' }}>
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
                <div style={{ marginTop: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px', color: '#374151' }}>Date</label>
                    <input
                      type="date"
                      value={formData.specificDate}
                      onChange={(e) => updateFormData('specificDate', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px', color: '#374151' }}>Time</label>
                    <input
                      type="time"
                      value={formData.specificTime}
                      onChange={(e) => updateFormData('specificTime', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
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

              <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', fontWeight: 700, fontFamily: 'var(--font-quicksand)', color: '#333333' }}>
                <Users size={18} strokeWidth={1.5} color="#20c997" />
                How many people are needed?
              </h3>
              
              <select 
                value={peopleNeeded}
                onChange={(e) => {
                  const value = e.target.value
                  setPeopleNeeded(value)
                  
                  if (value === '10+') {
                    setShowCustomInput(true)
                  } else {
                    setShowCustomInput(false)
                    setCustomCount('')
                  }
                }}
                style={inputStyle}
              >
                <option value="">Select number of helpers</option>
                <option value="1-2">1-2 people</option>
                <option value="3-5">3-5 people</option>
                <option value="6-10">6-10 people</option>
                <option value="10+">10+ people</option>
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
                const selectedInCategory = gifting.skills.filter(skill => formData.giftingsNeeded.includes(skill));
                
                return (
                  <div key={gifting.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <button
                      onClick={() => toggleExpanded(gifting.id)}
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: 'none',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'white'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <gifting.icon size={20} strokeWidth={1.5} color="#20c997" />
                        <span style={{ fontWeight: 500, color: '#111827' }}>{gifting.name}</span>
                        
                        {/* Skill counter badge */}
                        {selectedInCategory.length > 0 && (
                          <span style={{
                            fontSize: '12px',
                            backgroundColor: '#20c997',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 500
                          }}>
                            {selectedInCategory.length}
                          </span>
                        )}
                      </div>
                      
                      {/* Chevron icon */}
                      <div style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}>
                        <ChevronDown size={20} color="#9ca3af" />
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div style={{ 
                        padding: '16px', 
                        paddingTop: 0,
                        borderTop: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(3, 1fr)', 
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
                                  border: '1px solid',
                                  borderRadius: '9999px', // rounded-full
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? '#20c997' : 'white',
                                  color: isSelected ? 'white' : '#374151',
                                  fontWeight: 500,
                                  textAlign: 'center',
                                  fontSize: '14px',
                                  borderColor: isSelected ? '#20c997' : '#d1d5db',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    (e.target as HTMLElement).style.backgroundColor = '#f9fafb';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    (e.target as HTMLElement).style.backgroundColor = 'white';
                                  }
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

            {/* Selected Skills Display */}
            {formData.giftingsNeeded.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#333333' }}>
                  Selected Skills ({formData.giftingsNeeded.length}):
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {formData.giftingsNeeded.map((skill: any) => (
                    <span key={skill} style={{
                      padding: '8px 12px',
                      borderRadius: '9999px', // rounded-full
                      fontSize: '14px',
                      fontWeight: 500,
                      backgroundColor: '#20c997',
                      color: 'white',
                      border: '1px solid #20c997',
                      textAlign: 'center'
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
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


  // Save form data to localStorage to persist across HMR
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('share-need-form-data', JSON.stringify(formData));
    }
  }, [formData]);

  // Update canContinue state to prevent hydration mismatch
  useEffect(() => {
    setCanContinueState(canContinue());
  }, [formData, currentStep, peopleNeeded, customCount]);



  if (showPreview) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#FDFBF7',
        padding: '24px 16px' 
      }}>
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <button 
              onClick={handlePrevious}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '14px', 
                cursor: 'pointer',
                marginBottom: '8px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.2s ease'
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h2 style={{ fontSize: '24px', marginBottom: '4px', fontWeight: 'bold', color: '#111827' }}>Preview Your Need</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Review how this will appear to volunteers, then submit for approval</p>
          </div>

          {/* Need Card - matches Dashboard style exactly */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '16px'
            }}>
              {formData.title}
            </h3>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} />
                <span>{formData.urgency === 'asap' ? 'As Soon As Possible' : formData.urgency === 'ongoing' ? 'Ongoing' : `${formData.specificDate} ${formData.specificTime}`}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} />
                <span>{formData.city || 'Location'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} />
                <span>{peopleNeeded === '10+' ? customCount + '+' : peopleNeeded} needed</span>
              </div>
            </div>

            <p style={{
              color: '#374151',
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              {formData.description || formData.notes || formData.title}
            </p>

            {/* Skills - solid green with white text */}
            {formData.giftingsNeeded && formData.giftingsNeeded.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {formData.giftingsNeeded.map((skill: any) => (
                  <span
                    key={skill}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: '#20c997',
                      color: 'white'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons - outside the card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => {
                console.log('🔘 Share This Need button clicked!');
                handleSubmit();
              }}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: isSubmitting ? '#9ca3af' : '#20c997',
                color: 'white',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Share This Need'}
            </button>
            <p style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              margin: 0,
              textAlign: 'center'
            }}>
              Leaders will review before posting
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 👇 Put this just above your `return ( ... )`
  const wizardContent = (
    <>
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
          disabled={!canContinueState}
          style={{ 
            backgroundColor: canContinueState ? '#20c997' : '#d1d5db', 
            color: 'white', 
            border: 'none', 
            padding: '16px 24px', 
            borderRadius: 8, 
            cursor: canContinueState ? 'pointer' : 'not-allowed', 
            fontWeight: 600, 
            fontSize: '16px', 
            boxShadow: canContinueState ? '0 2px 4px rgba(32, 201, 151, 0.2)' : 'none'
          }}
        >
          {currentStep === totalSteps - 1 ? 'Preview' : 'Next Step'} →
        </button>
      </div>

      <p style={{ textAlign: 'center', color: '#666666', marginTop: 'var(--space-12)' }}>
        Making it easy for your church family to step in and help
      </p>

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
                <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Your need will be reviewed by church leadership</li>
                  <li>• Once approved, it will appear on the Ways to Serve board</li>
                  <li>• Volunteers can then sign up to help</li>
                  <li>• You'll be notified when someone commits to help</li>
                </ul>
              </div>
              
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
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#d1fae5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto'
            }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '16px'
            }}>
              Need Submitted Successfully!
            </h2>
            
            <p style={{
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Your request for "{formData.title}" has been submitted and will be reviewed by church leadership. Once approved, it will appear on the Ways to Serve board for volunteers to see.
            </p>
            
            <button
              onClick={handleSuccessOk}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Return to Ways to Serve
            </button>
          </div>
        </div>
      )}
    </>
  );

  return isModal ? (
    // ===== MODAL PRESENTATION =====
    <div className="fixed inset-0 z-50 flex items-stretch justify-center" role="dialog" aria-modal="true">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={() => router.back()} />

      {/* sheet */}
      <div className="relative z-10 w-full h-full sm:h-[92vh] sm:mt-6 sm:mb-6 sm:max-w-3xl sm:rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* modal header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b">
          <div className="px-4 h-14 flex items-center justify-between">
            <h1 className="text-base font-semibold text-gray-900">Share a Need</h1>
            <button onClick={() => router.back()} aria-label="Close" className="p-2 rounded-md hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* modal content */}
        <main className="px-4 sm:px-6 py-6 overflow-y-auto h-[calc(100%-3.5rem)]">
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {wizardContent}
          </div>
        </main>
      </div>
    </div>
  ) : (
    // ===== FULL PAGE PRESENTATION =====
    <div className="min-h-screen bg-[#FAFAF7] pb-24">
      {/* your existing page header, if any */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Share a Need</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {wizardContent}
        </div>
      </main>

      <Footer />
    </div>
  );
}
