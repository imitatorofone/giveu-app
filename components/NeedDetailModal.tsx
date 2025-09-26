'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Clock, User, Mail, Heart, Wrench, Check } from 'lucide-react';
import { supabaseBrowser as supabase } from '../lib/supabaseBrowser';
import toast from 'react-hot-toast';

// Brand typography (matching dashboard)
const quicksandFont = 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif';
const merriweatherFont = 'Merriweather, Georgia, serif';

interface NeedDetailModalProps {
  needId: string | null;
  onClose: () => void;
  userId?: string;
}

interface Need {
  id: string;
  title: string;
  description: string;
  location: string | null;
  geographic_location: string | null;
  city: string | null;
  state: string | null;
  urgency: string;
  people_needed: number;
  specific_date: string | null;
  specific_time: string | null;
  ongoing_start_date: string | null;
  ongoing_start_time: string | null;
  recurring_pattern: string | null;
  time_preference: string | null;
  giftings_needed: string[];
  created_at: string;
}


export default function NeedDetailModal({ needId, onClose, userId }: NeedDetailModalProps) {
  const [need, setNeed] = useState<Need | null>(null);
  const [helperCount, setHelperCount] = useState(0);
  const [isCommitted, setIsCommitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (needId) {
      console.log('[need-detail] open', { needId });
      fetchNeedDetails();
    }
  }, [needId, userId]);

  const fetchNeedDetails = async () => {
    if (!needId) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log('[need-detail] Fetching need with ID:', needId);
      
      // First try to fetch the need with minimal fields to see if it exists
      const { data: needData, error: needError } = await supabase
        .from('needs')
        .select('*')
        .eq('id', needId)
        .single();

      console.log('[need-detail] Query result:', { needData, needError });

      if (needError) {
        console.error('[need-detail] Error fetching need:', needError);
        console.error('[need-detail] Error details:', {
          message: needError.message,
          details: needError.details,
          hint: needError.hint,
          code: needError.code
        });
        console.error('[need-detail] Full error object:', JSON.stringify(needError, null, 2));
        setError('Can\'t load this need.');
        return;
      }

      if (!needData) {
        console.error('[need-detail] No need data returned for ID:', needId);
        setError('Need not found.');
        return;
      }

      // Check if the need is active
      if (needData.status !== 'active') {
        console.warn('[need-detail] Need is not active:', needData.status);
        setError('This need is no longer active.');
        return;
      }

      setNeed(needData);

      // Fetch committed users - first get commitments, then profiles
      const { data: commitmentsData, error: countError } = await supabase
        .from('commitments')
        .select('user_id')
        .eq('need_id', needId)
        .eq('status', 'confirmed');

      if (countError) {
        console.error('[need-detail] Error fetching commitments:', countError);
        console.error('[need-detail] Error details:', {
          message: countError.message,
          details: countError.details,
          hint: countError.hint,
          code: countError.code
        });
        setHelperCount(0);
      } else {
      console.log('[need-detail] Commitments data:', commitmentsData);
      console.log('[need-detail] Commitments count:', commitmentsData?.length || 0);
      
        // Simple helper count from commitments (already filtered for confirmed status)
        setHelperCount(commitmentsData?.length || 0);
      }

      // Check if current user is committed (if userId provided)
      if (userId) {
        console.log('[need-detail] Checking commitment for userId:', userId);
        const { data: commitment, error: commitmentError } = await supabase
          .from('commitments')
          .select('id')
          .eq('need_id', needId)
          .eq('user_id', userId)
          .eq('status', 'confirmed')
          .maybeSingle();

        console.log('[need-detail] Commitment check result:', { commitment, commitmentError });
        if (!commitmentError) {
          setIsCommitted(!!commitment);
        }
      } else {
        console.log('[need-detail] No userId provided, skipping commitment check');
      }
    } catch (err) {
      console.error('[need-detail] Unexpected error:', err);
      setError('Can\'t load this need.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!needId || !userId || actionLoading) return;

    console.log('[need-detail] help click', { needId, userId, isCommitted });
    setActionLoading(true);

    try {
      if (isCommitted) {
        // Remove commitment
        const { error } = await supabase
          .from('commitments')
          .delete()
          .eq('need_id', needId)
          .eq('user_id', userId);

        if (error) {
          console.error('[need-detail] Error removing commitment:', error);
          toast.error('Failed to update commitment');
          return;
        }

        setIsCommitted(false);
        setHelperCount(prev => Math.max(0, prev - 1));
        toast.success('You\'re no longer helping with this need');
      } else {
        // Add commitment
        const { error } = await supabase
          .from('commitments')
          .insert({
            need_id: needId,
            user_id: userId,
            status: 'confirmed'
          })
          .select();

        if (error) {
          console.error('[need-detail] Error adding commitment:', error);
          toast.error('Failed to commit to help');
          return;
        }

        setIsCommitted(true);
        setHelperCount(prev => prev + 1);
        toast.success('Thank you for helping!');
      }
    } catch (err) {
      console.error('[need-detail] Unexpected error in handleCommit:', err);
      toast.error('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    try {
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const cleanMinutes = minutes.split('.')[0];
        return `${displayHour}:${cleanMinutes} ${ampm}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  const formatDateDisplay = (need: Need) => {
    if (need.urgency === 'asap') {
      const timePreference = need.time_preference || 'Urgent';
      return { date: 'As Soon As Possible', time: timePreference };
    } else if (need.urgency === 'ongoing') {
      if (need.recurring_pattern) {
        const pattern = need.recurring_pattern.charAt(0).toUpperCase() + need.recurring_pattern.slice(1);
        return { date: `Ongoing - ${pattern}`, time: '' };
      }
      return { date: 'Ongoing', time: '' };
    } else if (need.urgency === 'specific' && need.specific_date) {
      const dateStr = formatDate(need.specific_date);
      const timeStr = need.specific_time ? formatTime(need.specific_time) : '';
      return { date: dateStr, time: timeStr };
    } else {
      const fallbackDate = need.specific_date || need.ongoing_start_date || 'Flexible';
      const timePreference = need.time_preference || 'Any time';
      return { date: fallbackDate, time: timePreference };
    }
  };

  const getGoogleMapsUrl = (location: string | null, geographic_location: string | null, city: string | null, state: string | null) => {
    if (!location && !geographic_location && !city) return null;
    // Remove duplicates and filter out empty values
    const addressParts = [location, geographic_location, city, state].filter(Boolean);
    const uniqueParts = [...new Set(addressParts)]; // Remove duplicates
    const address = uniqueParts.join(', ');
    return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  };

  if (!needId) return null;

  return (
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
      zIndex: 50,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '512px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ flex: 1, marginRight: '16px' }}>
            {loading ? (
              <div style={{ height: '24px', backgroundColor: '#f3f4f6', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
            ) : (
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
                margin: 0,
                fontFamily: quicksandFont,
                lineHeight: '1.2'
              }}>
                {need?.title || 'Loading...'}
              </h2>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '6px',
                color: '#6b7280',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ height: '20px', backgroundColor: '#f3f4f6', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
              <div style={{ height: '60px', backgroundColor: '#f3f4f6', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
              <div style={{ height: '20px', backgroundColor: '#f3f4f6', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>{error}</p>
              <button
                onClick={fetchNeedDetails}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#20c997',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Retry
              </button>
            </div>
          ) : need ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Date/Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="#6b7280" />
                <span style={{ color: '#374151', fontSize: '14px' }}>
                  {(() => {
                    const dateTimeDisplay = formatDateDisplay(need);
                    return dateTimeDisplay.time ? `${dateTimeDisplay.date} at ${dateTimeDisplay.time}` : dateTimeDisplay.date;
                  })()}
                </span>
              </div>

              {/* Location */}
              {(need.location || need.geographic_location || need.city) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} color="#6b7280" />
                  <a
                    href={getGoogleMapsUrl(need.location, need.geographic_location, need.city, need.state) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#374151',
                      fontSize: '14px',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    {(() => {
                      const addressParts = [need.location, need.geographic_location, need.city, need.state].filter(Boolean);
                      const uniqueParts = [...new Set(addressParts)]; // Remove duplicates
                      return uniqueParts.join(', ');
                    })()}
                  </a>
                </div>
              )}

              {/* Description */}
              <div>
                <p style={{
                  color: '#374151',
                  lineHeight: '1.6',
                  margin: 0,
                  fontSize: '14px',
                  fontFamily: merriweatherFont
                }}>
                  {need.description}
                </p>
              </div>

              {/* Skills/Gifts Needed */}
              {need.giftings_needed && need.giftings_needed.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wrench size={16} color="#6b7280" />
                    <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', fontFamily: quicksandFont }}>
                      Skills needed:
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {need.giftings_needed.map((gift, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#20c997',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          fontFamily: quicksandFont
                        }}
                      >
                        {gift}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Helper Count Section */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  fontFamily: quicksandFont
                }}>
                  {helperCount === 0 ? 'No helpers yet.' : `${helperCount} helper${helperCount > 1 ? 's' : ''} committed.`}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && !error && need && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '12px'
          }}>
            {userId ? (
              <button
                onClick={handleCommit}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  backgroundColor: isCommitted ? '#20c997' : '#20c997',
                  color: isCommitted ? 'white' : 'white',
                  border: isCommitted ? '2px solid #20c997' : 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  fontFamily: quicksandFont,
                  cursor: actionLoading ? 'not-allowed' : (isCommitted ? 'pointer' : 'pointer'),
                  transition: 'all 0.2s ease',
                  opacity: actionLoading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!actionLoading) {
                    e.currentTarget.style.backgroundColor = '#1ba085';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!actionLoading) {
                    e.currentTarget.style.backgroundColor = '#20c997';
                  }
                }}
              >
                {actionLoading ? (
                  'Loading...'
                ) : isCommitted ? (
                  <>
                    You're helping
                    <Check size={18} />
                  </>
                ) : (
                  <>
                    <Heart size={18} />
                    I Can Help
                  </>
                )}
              </button>
            ) : (
              <div style={{
                flex: 1,
                padding: '12px 20px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <Heart size={18} />
                Sign in to help with this need
              </div>
            )}

            {isCommitted && (
              <button
                onClick={handleCommit}
                disabled={actionLoading}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: actionLoading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!actionLoading) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!actionLoading) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
              >
                I'm no longer helping
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
