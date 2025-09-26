'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser as supabase } from '../../lib/supabaseBrowser';
import { Calendar, MapPin, Clock, Bell, List, Grid, Mail, X, Search, ArrowUpDown } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, isThisMonth, isFuture, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parse, addHours, isValid } from 'date-fns';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import toast from 'react-hot-toast';

// Helper function to format time with AM/PM
function formatTime(timeString: string): string {
  if (!timeString) return '';
  
  try {
    // Handle different time formats
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      const cleanMinutes = minutes.split('.')[0]; // Remove any decimal seconds
      return `${displayHour}:${cleanMinutes} ${ampm}`;
    }
    return timeString;
  } catch {
    return timeString;
  }
}

// Enhanced Google Calendar link generator with proper time zone and recurring event support
function generateCalendarLink(commitment: Commitment): string {
  const need = commitment.need;
  
  try {
    // Helper function to parse time strings (handles both 24-hour and 12-hour formats)
    const parseTimeString = (timeString: string): { hours: number; minutes: number } | null => {
      if (!timeString) return null;
      
      try {
        // Try 24-hour format first (HH:MM)
        if (timeString.includes(':') && !timeString.includes('AM') && !timeString.includes('PM')) {
          const [hours, minutes] = timeString.split(':');
          const hour = parseInt(hours);
          const minute = parseInt(minutes);
          if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return { hours: hour, minutes: minute };
          }
        }
        
        // Try 12-hour format (H:MM AM/PM)
        const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
        const match = timeString.match(timeRegex);
        if (match) {
          let hour = parseInt(match[1]);
          const minute = parseInt(match[2]);
          const ampm = match[3].toUpperCase();
          
          if (ampm === 'PM' && hour !== 12) hour += 12;
          if (ampm === 'AM' && hour === 12) hour = 0;
          
          if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return { hours: hour, minutes: minute };
          }
        }
        
        return null;
      } catch {
        return null;
      }
    };
    
    // Helper function to get day abbreviation for RRULE
    const getDayAbbreviation = (date: Date): string => {
      const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      return days[date.getDay()];
    };
    
    // Initialize event details
    let startDate: Date;
    let endDate: Date;
    let eventTitle = need.title || 'Untitled Commitment';
    let eventDescription = need.description || '';
    let eventLocation = need.city || '';
    let isRecurring = false;
    let recurrenceRule = '';
    
    // Determine start date and time based on commitment type
    if (need.specific_date && need.specific_date !== 'ASAP') {
      // Specific date commitment
      try {
        startDate = parseISO(need.specific_date);
        if (!isValid(startDate)) {
          throw new Error('Invalid date format');
        }
      } catch {
        // Fallback to tomorrow if date parsing fails
        startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
      }
      
      // Parse time if specified
      const parsedTime = parseTimeString(need.specific_time);
      if (parsedTime) {
        startDate.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
      } else {
        // Default to 6:00 PM if no valid time specified
        startDate.setHours(18, 0, 0, 0);
      }
      
      // Set end time (2 hours later by default)
      endDate = addHours(startDate, 2);
      
    } else if (need.urgency === 'ASAP') {
      // ASAP commitment - set for tomorrow at 6:00 PM
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(18, 0, 0, 0);
      endDate = addHours(startDate, 2);
      
      // Add note about ASAP nature
      eventDescription = `🚨 ASAP COMMITMENT - Please coordinate timing with organizer\n\n${eventDescription}`;
      
    } else if (need.urgency === 'ongoing') {
      // Ongoing commitment - set for next occurrence of the day from specific_date, or next Monday
      if (need.specific_date && need.specific_date !== 'ASAP') {
        try {
          const originalDate = parseISO(need.specific_date);
          if (isValid(originalDate)) {
            // Use the day of the week from the original date
            const targetDay = originalDate.getDay();
            startDate = new Date();
            const daysUntilTarget = (targetDay - startDate.getDay() + 7) % 7;
            startDate.setDate(startDate.getDate() + (daysUntilTarget || 7));
          } else {
            throw new Error('Invalid original date');
          }
        } catch {
          // Fallback to next Monday
          startDate = new Date();
          const daysUntilMonday = (1 - startDate.getDay() + 7) % 7;
          startDate.setDate(startDate.getDate() + (daysUntilMonday || 7));
        }
      } else {
        // No specific date, default to next Monday
        startDate = new Date();
        const daysUntilMonday = (1 - startDate.getDay() + 7) % 7;
        startDate.setDate(startDate.getDate() + (daysUntilMonday || 7));
      }
      
      // Parse time if specified, otherwise default to 6:00 PM
      const parsedTime = parseTimeString(need.specific_time);
      if (parsedTime) {
        startDate.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
      } else {
        startDate.setHours(18, 0, 0, 0);
      }
      
      endDate = addHours(startDate, 2);
      
      // Set up recurring event (weekly)
      isRecurring = true;
      const dayAbbr = getDayAbbreviation(startDate);
      recurrenceRule = `FREQ=WEEKLY;BYDAY=${dayAbbr}`;
      
      // Add note about ongoing nature
      eventDescription = `🔄 ONGOING COMMITMENT - Repeats weekly on ${format(startDate, 'EEEE')}s\n\n${eventDescription}`;
      
    } else {
      // Fallback case - set for tomorrow at 6:00 PM
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(18, 0, 0, 0);
      endDate = addHours(startDate, 2);
      
      eventDescription = `📅 COMMITMENT - Please coordinate timing with organizer\n\n${eventDescription}`;
    }
    
    // Format dates for Google Calendar (local time zone, no Z suffix)
    const formatGoogleDate = (date: Date) => {
      return format(date, "yyyyMMdd'T'HHmmss");
    };
    
    // Create URL parameters with proper encoding
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: eventTitle,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: eventDescription,
      location: eventLocation
    });
    
    // Add recurrence rule for ongoing commitments
    if (isRecurring && recurrenceRule) {
      params.append('recur', `RRULE:${recurrenceRule}`);
    }
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
    
  } catch (error) {
    console.error('Error generating calendar link:', error);
    
    // Fallback to basic calendar link with tomorrow at 6:00 PM
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 1);
    fallbackDate.setHours(18, 0, 0, 0);
    const endDate = addHours(fallbackDate, 2);
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: need.title || 'Commitment',
      dates: `${format(fallbackDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}`,
      details: need.description || 'Please coordinate timing with organizer',
      location: need.city || ''
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
}

interface Commitment {
  id: string;
  status: string;
  created_at: string;
  need: {
    id: string;
    title: string;
    description: string;
    urgency: string;
    specific_date: string;
    specific_time: string;
    city: string;
    created_by_email: string;
  };
}

// Grouping function
function groupCommitmentsByTime(commitments: Commitment[]) {
  const today: Commitment[] = [];
  const tomorrow: Commitment[] = [];
  const thisWeek: Commitment[] = [];
  const ongoing: Commitment[] = [];
  const asap: Commitment[] = [];
  const other: Commitment[] = [];

  commitments.forEach(commitment => {
    const need = commitment.need;
    if (!need) return; // Skip if no need data
    
    if (need.urgency === 'asap') {
      asap.push(commitment);
    } else if (need.urgency === 'ongoing') {
      ongoing.push(commitment);
    } else if (need.specific_date) {
      const date = parseISO(need.specific_date);
      if (isToday(date)) {
        today.push(commitment);
      } else if (isTomorrow(date)) {
        tomorrow.push(commitment);
      } else if (isThisWeek(date)) {
        thisWeek.push(commitment);
      } else {
        // Date exists but not in today/tomorrow/this week
        other.push(commitment);
      }
    } else {
      // No specific date, not ASAP or ongoing
      other.push(commitment);
    }
  });

  console.log('📊 Grouped commitments:', { 
    today: today.length, 
    tomorrow: tomorrow.length, 
    thisWeek: thisWeek.length, 
    ongoing: ongoing.length, 
    asap: asap.length, 
    other: other.length 
  });
  
  return { today, tomorrow, thisWeek, ongoing, asap, other };
}

// Calendar view component
function CalendarView({ commitments, currentMonth, onMonthChange }: { 
  commitments: Commitment[], 
  currentMonth: Date, 
  onMonthChange: (date: Date) => void 
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get commitments for a specific date
  const getCommitmentsForDate = (date: Date) => {
    return commitments.filter(commitment => {
      if (!commitment.need.specific_date) return false;
      return isSameDay(parseISO(commitment.need.specific_date), date);
    });
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 font-quicksand max-w-[350px] mx-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 font-quicksand">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="w-8 h-8 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            aria-label="Previous month"
          >
            <span className="text-sm font-medium">←</span>
          </button>
          <button
            onClick={() => onMonthChange(new Date())}
            className="px-2 py-1 text-xs bg-[#20c997] text-white rounded-lg hover:bg-[#1bb085] transition-colors font-quicksand"
          >
            Today
          </button>
          <button
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="w-8 h-8 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            aria-label="Next month"
          >
            <span className="text-sm font-medium">→</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid - Day Headers */}
      <div className="grid grid-cols-7 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={`day-${index}`} className="text-center text-xs text-gray-600 font-semibold font-quicksand py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Days */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map(day => {
          const dayCommitments = getCommitmentsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toISOString()}
              className={`w-10 h-10 flex flex-col items-center justify-center relative rounded-lg ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'bg-[#20c997] text-white' : ''} ${
                isCurrentMonth && !isToday ? 'hover:bg-gray-50' : ''
              } transition-colors cursor-pointer`}
              onClick={() => {
                if (dayCommitments.length > 0) {
                  window.open(generateCalendarLink(dayCommitments[0]), '_blank');
                  toast.success('Opening Google Calendar...');
                }
              }}
            >
              {/* Day Number */}
              <div className={`text-sm font-semibold font-quicksand ${
                isCurrentMonth ? (isToday ? 'text-white' : 'text-gray-900') : 'text-gray-400'
              }`}>
                {format(day, 'd')}
              </div>
              
              {/* Commitment Indicators */}
              {dayCommitments.length > 0 && (
                <div className="absolute bottom-1">
                  {dayCommitments.length === 1 ? (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isToday ? 'bg-white' : 'bg-[#20c997]'
                      }`}
                      title={`${dayCommitments[0].need.title} - Click to add to calendar`}
                    />
                  ) : (
                    <div
                      className={`w-1.5 h-1.5 rounded-full relative ${
                        isToday ? 'bg-white' : 'bg-[#20c997]'
                      }`}
                      title={`${dayCommitments.length} commitments: ${dayCommitments.map(c => c.need.title).join(', ')} - Click to add to calendar`}
                    >
                      {/* Show count for multiple commitments */}
                      <span className={`absolute -top-1 -right-1 text-xs rounded-full w-3 h-3 flex items-center justify-center font-quicksand text-[10px] ${
                        isToday ? 'bg-white text-[#20c997]' : 'bg-[#20c997] text-white'
                      }`}>
                        {dayCommitments.length}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Enhanced commitment card component
function CommitmentCard({ commitment, onCantMakeIt }: { 
  commitment: Commitment, 
  onCantMakeIt: (id: string) => void 
}) {
  const need = commitment.need;


  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-gray-900 flex-1 pr-4">
          {need.title || 'Untitled Need'}
        </h3>
        
        {/* Action Buttons - Compact in top right */}
        <div className="flex gap-2">
          <a
            href={generateCalendarLink(commitment)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 bg-[#20c997] text-white rounded-lg text-sm font-medium hover:bg-[#1bb085] transition-colors"
            title="Add to Google Calendar"
            onClick={() => toast.success('Opening Google Calendar...')}
          >
            <Calendar className="w-4 h-4" />
            <span>Add to Calendar</span>
          </a>
          <button
            onClick={() => onCantMakeIt(commitment.id)}
            className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            title="Cancel this commitment"
          >
            <X className="w-4 h-4" />
            <span>Can't Make It</span>
          </button>
        </div>
      </div>
      
      <p className="text-gray-600 mb-4">
        {need.description || 'No description available'}
      </p>
      
      <div className="space-y-3">
        {/* Date and Time Info */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {need.urgency === 'asap' 
                ? 'As Soon As Possible' 
                : need.urgency === 'ongoing'
                ? 'Ongoing'
                : need.specific_date
                ? format(parseISO(need.specific_date), 'MMM d, yyyy')
                : 'Flexible'
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{need.city || 'Location not specified'}</span>
          </div>
          {need.specific_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatTime(need.specific_time)}</span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        {need.created_by_email && (
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Contact:</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <a
                href={`mailto:${need.created_by_email}`}
                className="flex items-center gap-2 text-[#20c997] hover:text-[#1bb085]"
              >
                <Mail className="w-4 h-4" />
                <span>Email Organizer</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Commitment section component
function CommitmentSection({ title, commitments, onCantMakeIt }: { 
  title: string, 
  commitments: Commitment[],
  onCantMakeIt: (id: string) => void 
}) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">
        {commitments.map((commitment) => (
          <CommitmentCard
            key={commitment.id}
            commitment={commitment}
            onCantMakeIt={onCantMakeIt}
          />
        ))}
      </div>
    </div>
  );
}

export default function CommitmentsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'urgency' | 'location'>('urgency');

  useEffect(() => {
    async function fetchCommitments() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      try {
        // First, fetch opportunity_responses
        console.log('🔍 [Fetch Debug] Fetching commitments for user:', session.user.id);
        
        const { data: responses, error: responsesError } = await supabase
          .from('opportunity_responses')
          .select('id, status, created_at, need_id, user_id')
          .eq('user_id', session.user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        console.log('🔍 [Fetch Debug] Raw responses query result:', {
          responses,
          responsesError,
          count: responses?.length || 0,
          statuses: responses?.map(r => r.status) || []
        });

        if (responsesError) {
          console.error('❌ [Fetch Debug] Error fetching responses:', responsesError);
          toast.error('Failed to load commitments');
          setLoading(false);
          return;
        }

        if (!responses || responses.length === 0) {
          console.log('🔍 [Fetch Debug] No accepted commitments found');
          setCommitments([]);
          setLoading(false);
          return;
        }

        // Extract unique need_ids and filter for valid UUIDs
        const needIds = responses
          .map(r => r.need_id)
          .filter(id => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

        console.log('📋 Valid need IDs:', needIds);

        // Fetch needs data if we have valid IDs
        let needsData: any[] = [];
        if (needIds.length > 0) {
          console.log('📋 Fetching needs for IDs:', needIds);
          
          try {
            // First, let's check what columns exist in the needs table
            console.log('📋 Testing needs table access...');
            const { data: testNeed, error: testError } = await supabase
              .from('needs')
              .select('*')
              .limit(1);

            if (testError) {
              console.error('Error testing needs table:', testError);
              console.error('Test error type:', typeof testError);
              console.error('Test error keys:', Object.keys(testError));
              console.error('Test error stringified:', JSON.stringify(testError, null, 2));
            } else {
              console.log('📋 Needs table accessible, structure:', testNeed && testNeed.length > 0 ? Object.keys(testNeed[0]) : 'No data');
            }

            // Try a simple query first
            console.log('📋 Trying simple needs query...');
            const { data: simpleNeeds, error: simpleError } = await supabase
              .from('needs')
              .select('id, title, created_by_email')
              .limit(5);

            if (simpleError) {
              console.error('Simple needs query error:', simpleError);
              console.error('Simple error type:', typeof simpleError);
              console.error('Simple error keys:', Object.keys(simpleError));
              console.error('Simple error stringified:', JSON.stringify(simpleError, null, 2));
            } else {
              console.log('📋 Simple needs query successful:', simpleNeeds);
            }

            // Now try the full query with actual existing columns
            console.log('📋 Trying full needs query...');
            const { data: needs, error: needsError } = await supabase
              .from('needs')
              .select('id, title, description, urgency, specific_date, specific_time, city, created_by_email')
              .in('id', needIds);

            if (needsError) {
              console.error('Error fetching needs:', needsError);
              console.error('Error type:', typeof needsError);
              console.error('Error keys:', Object.keys(needsError || {}));
              console.error('Error stringified:', JSON.stringify(needsError, null, 2));
              console.error('Error message:', needsError?.message);
              console.error('Error code:', needsError?.code);
              console.error('Error details:', needsError?.details);
              console.error('Error hint:', needsError?.hint);
              
              // Try to continue with empty data instead of failing completely
              console.log('📋 Continuing with empty needs data due to error');
              needsData = [];
            } else {
              console.log('📋 Fetched needs data successfully:', needs);
              needsData = needs || [];
            }
          } catch (catchError) {
            console.error('📋 Catch block error:', catchError);
            console.error('Catch error type:', typeof catchError);
            console.error('Catch error keys:', Object.keys(catchError || {}));
            console.error('Catch error stringified:', JSON.stringify(catchError, null, 2));
            needsData = [];
          }
        }

        // Combine the data
        const combinedData = responses.map(response => {
          const need = needsData.find(n => n.id === response.need_id);
          return {
            id: response.id,
            status: response.status,
            created_at: response.created_at,
            need: need || {
              id: response.need_id,
              title: `Commitment #${response.id.slice(0, 8)}`,
              description: 'Need details unavailable - this may be due to database access restrictions',
              urgency: 'unknown',
              specific_date: null,
              specific_time: null,
              city: 'Location not specified',
              created_by_email: null
            }
          };
        });

        console.log('📋 Combined commitments data:', combinedData.length, combinedData);
        setCommitments(combinedData);
        
        // Show a helpful message if we couldn't load need details
        if (responses.length > 0 && needsData.length === 0) {
          toast.error('Commitments loaded but need details unavailable. This may be due to database access restrictions.');
        }
      } catch (error) {
        console.error('Error in fetchCommitments:', error);
        toast.error('Failed to load commitments');
      } finally {
        setLoading(false);
      }
    }

    fetchCommitments();
    
    // Debug: Test database schema
    testDatabaseSchema();
  }, []);

  // Test function to verify database schema
  const testDatabaseSchema = async () => {
    try {
      console.log('🧪 [Schema Test] Testing database schema...');
      
      // Test 1: Check if cancelled_at column exists
      const { data: testData, error: testError } = await supabase
        .from('opportunity_responses')
        .select('id, status, cancelled_at')
        .limit(1);
      
      console.log('🧪 [Schema Test] Column test result:', {
        testData,
        testError,
        hasCancelledAt: testData?.[0] ? 'cancelled_at' in testData[0] : 'no data'
      });

      // Test 2: Check all statuses in the table
      const { data: statusData, error: statusError } = await supabase
        .from('opportunity_responses')
        .select('id, status, cancelled_at')
        .order('created_at', { ascending: false });
      
      console.log('🧪 [Schema Test] All statuses in table:', {
        statusData: statusData?.map(r => ({ id: r.id, status: r.status, cancelled_at: r.cancelled_at })),
        statusError,
        uniqueStatuses: [...new Set(statusData?.map(r => r.status) || [])]
      });

    } catch (error) {
      console.error('🧪 [Schema Test] Error:', error);
    }
  };

  // Handle "Can't Make It" functionality
  const handleCantMakeIt = async (commitmentId: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you can\'t make this commitment? This will notify the organizer and remove it from your commitments.'
    );
    
    if (!confirmed) return;
    
    const t = toast.loading('Updating commitment...');
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('❌ [Cancellation Debug] No active session');
        toast.error('Please log in to cancel commitments', { id: t });
        return;
      }

      // Find the commitment to get current status
      const currentCommitment = commitments.find(c => c.id === commitmentId);
      console.log('🔍 [Cancellation Debug] Before update:', {
        commitmentId,
        currentStatus: currentCommitment?.status,
        commitmentExists: !!currentCommitment,
        totalCommitments: commitments.length,
        currentUserId: session.user.id
      });

      const updateData = { 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      };
      
      console.log('🔍 [Cancellation Debug] Update data:', updateData);
      console.log('🔍 [Cancellation Debug] WHERE clause:', { id: commitmentId });

      // First, let's check if the record exists before updating
      console.log('🔍 [Cancellation Debug] Checking if record exists...');
      const { data: existingRecord, error: checkError } = await supabase
        .from('opportunity_responses')
        .select('id, status, user_id')
        .eq('id', commitmentId)
        .single();

      console.log('🔍 [Cancellation Debug] Record existence check:', {
        existingRecord,
        checkError,
        recordExists: !!existingRecord,
        currentUserId: session.user.id
      });

      if (checkError) {
        console.error('❌ [Cancellation Debug] Record not found or access denied:', checkError);
        toast.error(`Record not found: ${checkError.message}`, { id: t });
        return;
      }

      if (!existingRecord) {
        console.error('❌ [Cancellation Debug] No record found with ID:', commitmentId);
        toast.error('Commitment not found', { id: t });
        return;
      }

      // Now attempt the update
      const { data, error } = await supabase
        .from('opportunity_responses')
        .update(updateData)
        .eq('id', commitmentId)
        .select();

      console.log('🔍 [Cancellation Debug] Supabase response:', {
        data,
        error,
        dataLength: data?.length,
        errorType: typeof error,
        errorKeys: error ? Object.keys(error) : null
      });

      if (error) {
        console.error('❌ [Cancellation Debug] Database error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
        toast.error(`Failed to cancel commitment: ${error.message}`, { id: t });
        return;
      }

      if (!data || data.length === 0) {
        console.error('❌ [Cancellation Debug] No data returned from update');
        toast.error('Failed to cancel commitment: No record updated', { id: t });
        return;
      }

      console.log('✅ [Cancellation Debug] Update successful:', data[0]);

      // Update local state
      setCommitments(prev => {
        const filtered = prev.filter(commitment => commitment.id !== commitmentId);
        console.log('🔍 [Cancellation Debug] Local state update:', {
          beforeCount: prev.length,
          afterCount: filtered.length,
          removedId: commitmentId
        });
        return filtered;
      });
      
      toast.success('Commitment cancelled successfully', { id: t });
    } catch (error) {
      console.error('❌ [Cancellation Debug] Catch block error:', error);
      toast.error('Failed to cancel commitment', { id: t });
    }
  };

  // Enhanced filtering and sorting logic
  const filteredAndSortedCommitments = (() => {
    // First apply search filter (title and city only)
    const searchFiltered = commitments.filter(commitment => {
      if (searchTerm === '') return true;
      const need = commitment.need;
      return need.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             need.city.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Then apply time-based filter
    const timeFiltered = searchFiltered.filter(commitment => {
      const need = commitment.need;
      
      if (activeFilter === 'All') return true;
      
      if (activeFilter === 'This Week') {
        // Show commitments this week OR ongoing commitments
        return (need.specific_date && isThisWeek(parseISO(need.specific_date))) || 
               need.urgency === 'ongoing';
      }
      
      if (activeFilter === 'This Month') {
        // Show commitments this month OR ongoing commitments
        return (need.specific_date && isThisMonth(parseISO(need.specific_date))) || 
               need.urgency === 'ongoing';
      }
      
      if (activeFilter === 'Upcoming') {
        // Show future dates OR ASAP commitments
        return (need.specific_date && isFuture(parseISO(need.specific_date))) || 
               need.urgency === 'asap';
      }
      
      if (activeFilter === 'Ongoing') {
        return need.urgency === 'ongoing';
      }
      
      return true;
    });

    // Finally apply sorting
    return timeFiltered.sort((a, b) => {
      const needA = a.need;
      const needB = b.need;
      
      if (sortBy === 'urgency') {
        // ASAP → specific dates (soonest first) → ongoing
        if (needA.urgency === 'asap' && needB.urgency !== 'asap') return -1;
        if (needB.urgency === 'asap' && needA.urgency !== 'asap') return 1;
        
        if (needA.urgency === 'ongoing' && needB.urgency !== 'ongoing') return 1;
        if (needB.urgency === 'ongoing' && needA.urgency !== 'ongoing') return -1;
        
        // Both have specific dates, sort by date
        if (needA.specific_date && needB.specific_date) {
          return parseISO(needA.specific_date).getTime() - parseISO(needB.specific_date).getTime();
        }
        
        return 0;
      }
      
      if (sortBy === 'date') {
        // Sort by date (soonest first)
        if (needA.specific_date && needB.specific_date) {
          return parseISO(needA.specific_date).getTime() - parseISO(needB.specific_date).getTime();
        }
        if (needA.specific_date && !needB.specific_date) return -1;
        if (!needA.specific_date && needB.specific_date) return 1;
        return 0;
      }
      
      if (sortBy === 'location') {
        // Sort by city alphabetically
        return needA.city.localeCompare(needB.city);
      }
      
      return 0;
    });
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">Loading your commitments...</div>
        <Footer />
      </div>
    );
  }

  // Helper functions for empty states
  const getEmptyStateTitle = () => {
    if (searchTerm) return 'No commitments found';
    if (activeFilter === 'This Week') return 'No commitments this week';
    if (activeFilter === 'This Month') return 'No commitments this month';
    if (activeFilter === 'Upcoming') return 'No upcoming commitments';
    if (activeFilter === 'Ongoing') return 'No ongoing commitments';
    return 'No commitments yet';
  };

  const getEmptyStateMessage = () => {
    if (searchTerm) return `No commitments match "${searchTerm}". Try adjusting your search terms or filters.`;
    if (activeFilter !== 'All') return `You don't have any ${activeFilter.toLowerCase()} commitments right now.`;
    return 'When you sign up to help with needs, they\'ll appear here.';
  };

  // Enhanced grouping function that works with filtered data
  const renderGroupedCommitments = (commitments: Commitment[]) => {
    const grouped = groupCommitmentsByTime(commitments);
    
    return (
      <>
        {/* Today Section */}
        {grouped.today.length > 0 && (
          <CommitmentSection 
            title="Today" 
            commitments={grouped.today} 
            onCantMakeIt={handleCantMakeIt}
          />
        )}
        
        {/* Tomorrow Section */}
        {grouped.tomorrow.length > 0 && (
          <CommitmentSection 
            title="Tomorrow" 
            commitments={grouped.tomorrow} 
            onCantMakeIt={handleCantMakeIt}
          />
        )}
        
        {/* This Week Section */}
        {grouped.thisWeek.length > 0 && (
          <CommitmentSection 
            title="This Week" 
            commitments={grouped.thisWeek} 
            onCantMakeIt={handleCantMakeIt}
          />
        )}
        
        {/* Ongoing Section */}
        {grouped.ongoing.length > 0 && (
          <CommitmentSection 
            title="Ongoing" 
            commitments={grouped.ongoing} 
            onCantMakeIt={handleCantMakeIt}
          />
        )}
        
        {/* ASAP Section */}
        {grouped.asap.length > 0 && (
          <CommitmentSection 
            title="Urgent" 
            commitments={grouped.asap} 
            onCantMakeIt={handleCantMakeIt}
          />
        )}
        
        {/* Other Section */}
        {grouped.other.length > 0 && (
          <CommitmentSection 
            title="Other" 
            commitments={grouped.other} 
            onCantMakeIt={handleCantMakeIt}
          />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Page title section - match dashboard style */}
      <div className="bg-white px-6 pt-6 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Commitments</h1>
            <p className="text-gray-600">Track your volunteering commitments and schedule</p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-[#20c997] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#20c997] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              Calendar
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20c997] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Filter tabs and sort options */}
      <div className="bg-white px-6 pb-6 border-b border-gray-100">
        <div className="flex flex-col gap-4">
          {/* Filter buttons */}
          <div className="flex gap-2 overflow-x-auto">
            <button 
              onClick={() => setActiveFilter('All')}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap ${
                activeFilter === 'All' 
                  ? 'bg-[#20c997] text-white' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveFilter('This Week')}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap ${
                activeFilter === 'This Week' 
                  ? 'bg-[#20c997] text-white' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              This Week
            </button>
            <button 
              onClick={() => setActiveFilter('This Month')}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap ${
                activeFilter === 'This Month' 
                  ? 'bg-[#20c997] text-white' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              This Month
            </button>
            <button 
              onClick={() => setActiveFilter('Upcoming')}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap ${
                activeFilter === 'Upcoming' 
                  ? 'bg-[#20c997] text-white' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Upcoming
            </button>
            <button 
              onClick={() => setActiveFilter('Ongoing')}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap ${
                activeFilter === 'Ongoing' 
                  ? 'bg-[#20c997] text-white' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Ongoing
            </button>
          </div>

          {/* Sort options */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'urgency' | 'location')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#20c997] focus:border-transparent"
            >
              <option value="urgency">Urgency</option>
              <option value="date">Date</option>
              <option value="location">Location</option>
            </select>
          </div>
        </div>
      </div>

      {/* Commitments count - match dashboard pattern */}
      <div className="px-6 py-4">
        <p className="text-sm text-gray-600">
          {filteredAndSortedCommitments.length} commitments
          {searchTerm && ` matching "${searchTerm}"`}
          {activeFilter !== 'All' && ` in ${activeFilter.toLowerCase()}`}
        </p>
      </div>

      {/* Content area */}
      <div className="px-6 pb-20">
        {filteredAndSortedCommitments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {getEmptyStateTitle()}
            </h3>
            <p className="text-gray-500">
              {getEmptyStateMessage()}
            </p>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView
            commitments={filteredAndSortedCommitments}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        ) : (
          renderGroupedCommitments(filteredAndSortedCommitments)
        )}
      </div>
      <Footer />
    </div>
  );
}
