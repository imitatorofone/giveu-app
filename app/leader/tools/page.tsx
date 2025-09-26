'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser as supabase } from '../../../lib/supabaseBrowser';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Inbox, Users, UserPlus, MessageSquare, ChevronRight } from 'lucide-react';

// Brand typography
const quicksandFont = 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif';
const merriweatherFont = 'Merriweather, Georgia, serif';

// Toast hook
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 1800);
    return () => clearTimeout(id);
  }, [msg]);
  return {
    Toast: () =>
      msg ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-16 mx-auto w-fit max-w-[90%] rounded-full bg-gray-900/90 px-4 py-2 text-sm text-white shadow-lg"
        >
          {msg}
        </div>
      ) : null,
    show: (m: string) => {
      console.info(m);
      setMsg(m);
    },
  };
}

// Role detection helper (simplified for current schema)
function isLeader(profile: any): boolean {
  if (!profile) return false;
  
  const norm = (v?: string) => (v ?? '').toLowerCase().trim();
  
  // Check single role field (only field available in current schema)
  return norm(profile.role) === 'leader' || norm(profile.role) === 'admin';
}

// Row component for the list items
function Row({ 
  icon: Icon, 
  title, 
  subtitle, 
  badge, 
  href, 
  onClick, 
  ariaLabel 
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge?: { text: string; color: 'green' | 'gray' };
  href?: string;
  onClick?: () => void;
  ariaLabel: string;
}) {
  const badgeClasses = {
    green: 'bg-emerald-100 text-emerald-700',
    gray: 'bg-[#20c997] text-white'
  };

  const content = (
    <>
      {/* Icon */}
      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#20c997] text-white ring-1 ring-[#20c997]/20">
        <Icon size={20} />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="text-base font-semibold text-gray-900">{title}</div>
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-3">
        {badge && (
          <span className={`text-xs px-2.5 py-1 rounded-full ${badgeClasses[badge.color]}`}>
            {badge.text}
          </span>
        )}
        <ChevronRight size={16} className="text-gray-300" aria-hidden="true" />
      </div>
    </>
  );

  const rowClasses = `
    flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm 
    ${href || onClick ? 'active:scale-[0.99] transition cursor-pointer hover:shadow-md' : 'cursor-not-allowed'}
  `;

  if (href) {
    return (
      <a href={href} className={rowClasses} aria-label={ariaLabel}>
        {content}
      </a>
    );
  }

  return (
    <div 
      className={rowClasses}
      role="button"
      tabIndex={onClick ? 0 : -1}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={ariaLabel}
    >
      {content}
    </div>
  );
}

// Skeleton row for loading state
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
      {/* Icon skeleton */}
      <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" />
      
      {/* Content skeleton */}
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
      </div>
      
      {/* Right section skeleton */}
      <div className="ml-auto flex items-center gap-3">
        <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function LeaderToolsPage() {
  const router = useRouter();
  const { Toast, show } = useToast();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes.user?.id;
        if (!userId) {
          setAllowed(false);
          setLoading(false);
          return;
        }

        // Fetch profile data (only role field exists in current schema)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        const userIsLeader = isLeader(profile);
        setAllowed(userIsLeader);

        // Only fetch pending count if user is a leader
        if (userIsLeader) {
          const { count, error } = await supabase
            .from('needs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending');

          if (error) {
            console.error('Error fetching pending count:', error);
            setPendingCount(0);
          } else {
            setPendingCount(count || 0);
          }
        }
      } catch (error) {
        console.error('Error in leader tools setup:', error);
        setAllowed(false);
        setPendingCount(0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Redirect non-leaders in useEffect to avoid setState during render
  useEffect(() => {
    if (!loading && allowed === false) {
      router.replace('/dashboard');
    }
  }, [loading, allowed, router]);

  // Don't render content for non-leaders (redirect will happen in useEffect)
  if (!loading && allowed === false) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        
        <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-6">
          {/* Page title skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-80 animate-pulse" />
          </div>

          {/* Skeleton rows */}
          <div className="space-y-4">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Leadership Tools</h1>
          <p className="text-gray-600">Manage your community's needs and members.</p>
        </div>

        {/* List of tools */}
        <div className="space-y-4">
          {/* Pending Needs */}
          <Row
            icon={Inbox}
            title="Pending Needs"
            subtitle="Review and approve community needs."
            badge={pendingCount > 0 ? { text: `${pendingCount} pending`, color: 'green' } : undefined}
            href="/leader/pending-needs"
            ariaLabel="Open Pending Needs"
          />

          {/* Members */}
          <Row
            icon={Users}
            title="Members"
            subtitle="View and manage your community."
            href="/leader/members"
            ariaLabel="Open Members"
          />

          {/* Invite Leaders */}
          <Row
            icon={UserPlus}
            title="Invite Leaders"
            subtitle="Add leaders to help manage your community."
            badge={{ text: 'Coming Soon', color: 'gray' }}
            onClick={() => show('Invite Leaders is coming soon.')}
            ariaLabel="Invite Leaders (Coming Soon)"
          />

          {/* Feedback */}
          <Row
            icon={MessageSquare}
            title="Feedback"
            subtitle="Help us improve giveU."
            href="/feedback"
            ariaLabel="Open Feedback"
          />
        </div>
      </main>

      <Footer />
      <Toast />
    </div>
  );
}
