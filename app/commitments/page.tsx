'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Calendar, MapPin, Users, Clock, Bell } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import PageHeader from '../../components/PageHeader';
import Footer from '../../components/Footer';

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
  };
}

// Grouping function
function groupCommitmentsByTime(commitments: Commitment[]) {
  const today = [];
  const tomorrow = [];
  const thisWeek = [];
  const ongoing = [];
  const asap = [];
  const other = [];

  commitments.forEach(commitment => {
    if (commitment.need.urgency === 'asap') {
      asap.push(commitment);
    } else if (commitment.need.urgency === 'ongoing') {
      ongoing.push(commitment);
    } else if (commitment.need.specific_date) {
      const date = parseISO(commitment.need.specific_date);
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

// Commitment section component
function CommitmentSection({ title, commitments }: { title: string; commitments: Commitment[] }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">
        {commitments.map((commitment) => (
          <div key={commitment.id} className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              {commitment.need.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {commitment.need.description}
            </p>
            
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {commitment.need.urgency === 'asap' 
                    ? 'As Soon As Possible' 
                    : commitment.need.urgency === 'ongoing'
                    ? 'Ongoing'
                    : commitment.need.specific_date
                    ? format(parseISO(commitment.need.specific_date), 'MMM d, yyyy')
                    : 'Flexible'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{commitment.need.city}</span>
              </div>
              {commitment.need.specific_time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(commitment.need.specific_time)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CommitmentsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    async function fetchCommitments() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('commitments')
        .select(`
          id,
          status,
          created_at,
          need:needs (
            id,
            title,
            description,
            urgency,
            specific_date,
            specific_time,
            city
          )
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

      if (data) {
        console.log('📋 Loaded commitments:', data.length, data);
        setCommitments(data);
      }
      setLoading(false);
    }

    fetchCommitments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top header - match dashboard exactly */}
        <div className="bg-white border-b border-gray-100">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="bg-[#20c997] text-white px-4 py-2 rounded-lg font-semibold">
                giveU
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-800">
                Sign out
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">Loading your commitments...</div>
        <Footer />
      </div>
    );
  }

  const grouped = groupCommitmentsByTime(commitments);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top header - match dashboard exactly */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#20c997] text-white px-4 py-2 rounded-lg font-semibold">
              giveU
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button className="text-sm text-gray-600 hover:text-gray-800">
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Page title section - match dashboard style */}
      <div className="bg-white px-6 pt-6 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Commitments</h1>
        <p className="text-gray-600">Track your volunteering commitments and schedule</p>
      </div>

      {/* Filter tabs - similar to dashboard categories */}
      <div className="bg-white px-6 pb-6 border-b border-gray-100">
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
      </div>

      {/* Commitments count - match dashboard pattern */}
      <div className="px-6 py-4">
        <p className="text-sm text-gray-600">
          {commitments.length} commitments
        </p>
      </div>

      {/* Content area */}
      <div className="px-6 pb-20">
        {commitments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No commitments yet</h3>
            <p className="text-gray-500">When you sign up to help with needs, they'll appear here.</p>
          </div>
        ) : (
          <>
            {/* Today Section */}
            {grouped.today.length > 0 && (
              <CommitmentSection title="Today" commitments={grouped.today} />
            )}
            
            {/* Tomorrow Section */}
            {grouped.tomorrow.length > 0 && (
              <CommitmentSection title="Tomorrow" commitments={grouped.tomorrow} />
            )}
            
            {/* This Week Section */}
            {grouped.thisWeek.length > 0 && (
              <CommitmentSection title="This Week" commitments={grouped.thisWeek} />
            )}
            
            {/* Ongoing Section */}
            {grouped.ongoing.length > 0 && (
              <CommitmentSection title="Ongoing" commitments={grouped.ongoing} />
            )}
            
            {/* ASAP Section */}
            {grouped.asap.length > 0 && (
              <CommitmentSection title="Urgent" commitments={grouped.asap} />
            )}
            
            {/* Other Section */}
            {grouped.other.length > 0 && (
              <CommitmentSection title="Other" commitments={grouped.other} />
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
