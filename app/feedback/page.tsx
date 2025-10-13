'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import {
  ArrowBigUp,
  ArrowLeft,
  Lightbulb,
  Bug,
  Heart,
  HelpCircle,
  Plus,
  X,
  ChevronUp,
  Camera,
} from 'lucide-react';
import { BRAND } from '../../lib/brandConfig';

type Item = {
  id: string;
  user_id: string | null;
  email: string | null;
  title: string | null;
  details: string;
  category: 'idea' | 'bug' | 'praise' | 'question';
  created_at: string;
  votes_count: number;
};

const CATS = [
  { id: 'all', label: 'All' },
  { id: 'idea', label: 'Ideas' },
  { id: 'bug', label: 'Bugs' },
  { id: 'praise', label: 'Praise' },
  { id: 'question', label: 'Questions' },
] as const;

const CAT_ICONS: Record<string, any> = {
  idea: Lightbulb,
  bug: Bug,
  praise: Heart,
  question: HelpCircle,
};

const CAT_LABELS: Record<string, string> = {
  idea: 'Idea',
  bug: 'Bug',
  praise: 'Praise',
  question: 'Question',
};

export default function FeedbackListPage() {
  const router = useRouter();
  const [isLeader, setIsLeader] = useState(false);
  
  // Strip category prefixes like "Bug: " / "Idea: " from titles
  function cleanTitle(raw?: string | null) {
    if (!raw) return "(no title)";
    return raw.replace(/^\s*(idea|bug|praise|question)\s*:\s*/i, "").trim();
  }

  // "2h ago" style with sensible ranges
  function timeAgo(iso: string) {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const s = Math.max(1, Math.floor((now - then) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}w ago`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}mo ago`;
    const y = Math.floor(d / 365);
    return `${y}y ago`;
  }

  function todayChicago() {
    const now = new Date();
    const chi = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const [m, d, y] = chi.split('/');
    return `${y}-${m}-${d}`;
  }

  function msUntilChicagoMidnight() {
    const now = new Date();
    const chiNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const tomorrow = new Date(chiNow);
    tomorrow.setDate(chiNow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - chiNow.getTime();
  }

  function randSuffix() {
    return Math.random().toString(36).substring(2, 8);
  }
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [votedTodayId, setVotedTodayId] = useState<string | null>(null);
  const [cat, setCat] = useState<(typeof CATS)[number]['id']>('all');
  const [sort, setSort] = useState<'top' | 'new'>('top');
  
  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    details: "",
    category: "idea" as "idea" | "bug" | "praise" | "question",
  });
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        await fetchMyVotes(session.user.id);
        await fetchMyVoteToday(session.user.id);
        
        // Check if leader
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_leader')
          .eq('id', session.user.id)
          .single();
        setIsLeader(profile?.is_leader || false);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    fetchItems(cat);
  }, [cat, sort]);

  useEffect(() => {
    if (!userId) return;
    const t = setTimeout(async () => {
      setVotedTodayId(null);
      await fetchMyVoteToday(userId);
    }, msUntilChicagoMidnight());

    return () => clearTimeout(t);
  }, [userId]);

  async function fetchItems(category: (typeof CATS)[number]['id']) {
    try {
      let q = supabase.from('feedback_items_with_votes').select('*');
      if (category !== 'all') q = q.eq('category', category);

      if (sort === 'top') {
        q = q.order('votes_count', { ascending: false }).order('created_at', { ascending: false });
      } else {
        q = q.order('created_at', { ascending: false });
      }

      const { data, error } = await q;
      if (error) throw error;
      setItems((data ?? []) as Item[]);
    } catch (e: any) {
      console.error('fetchItems error →', JSON.stringify(e ?? {}, null, 2));
      toast.error(e?.message || 'Failed to load feedback');
    }
  }

  async function fetchMyVotes(uid: string | null) {
    if (!uid) return setMyVotes(new Set());
    const { data, error } = await supabase
      .from('feedback_votes')
      .select('feedback_id')
      .eq('user_id', uid);
    if (error) {
      console.warn('votes fetch error', error.message);
      return;
    }
    setMyVotes(new Set((data ?? []).map((r: any) => r.feedback_id as string)));
  }

  async function fetchMyVoteToday(uid: string | null) {
    if (!uid) return setVotedTodayId(null);
    const { data, error } = await supabase
      .from('feedback_votes')
      .select('feedback_id')
      .eq('user_id', uid)
      .eq('vote_day', todayChicago())
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('fetchMyVoteToday error →', error.message);
      return;
    }
    setVotedTodayId(data?.feedback_id ?? null);
  }

  async function toggleVote(id: string) {
    if (!userId) {
      toast.error('Please sign in to vote');
      return;
    }

    if (votedTodayId) {
      const votedTitle = items.find(x => x.id === votedTodayId)?.title ?? 'another item';
      toast("You have already used today's vote on \"" + cleanTitle(votedTitle) + "\". Try again tomorrow.", { icon: '🔁' });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('upvote_feedback_daily', { p_feedback_id: id });
      if (error) throw error;

      const didUpvote = data?.[0]?.did_upvote ?? false;
      const serverCount = data?.[0]?.votes_count ?? null;
      const votedId = data?.[0]?.voted_feedback_id ?? null;

      if (didUpvote) {
        setVotedTodayId(id);
        if (serverCount !== null) {
          setItems(prev => prev.map(it => (it.id === id ? { ...it, votes_count: serverCount } : it)));
        } else {
          setItems(prev => prev.map(it => (it.id === id ? { ...it, votes_count: it.votes_count + 1 } : it)));
        }
        toast.success('Thanks for voting!');
      } else {
        setVotedTodayId(votedId);
        const votedTitle = items.find(x => x.id === votedId)?.title ?? 'another item';
        if (serverCount !== null) {
          setItems(prev => prev.map(it => (it.id === id ? { ...it, votes_count: serverCount } : it)));
        }
        toast("You have already used today's vote on \"" + cleanTitle(votedTitle) + "\".", { icon: '🔁' });
      }
    } catch (e: any) {
      console.error('upvote error →', e?.message || e);
      toast.error(e?.message || 'Vote failed');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      toast.error("Please sign in to submit feedback.");
      return;
    }
    if (!form.title.trim() || form.title.trim().length < 3) {
      toast.error("Add a short title (3+ chars).");
      return;
    }
    if (!form.details.trim() || form.details.trim().length < 10) {
      toast.error("Tell us a bit more (10+ chars).");
      return;
    }

    setSubmitting(true);
    const t = toast.loading("Submitting…");

    try {
      const { data: u } = await supabase.auth.getUser();
      const email = u.user?.email ?? null;

      const { data, error } = await supabase
        .from("feedback_items")
        .insert([
          {
            user_id: userId,
            email,
            title: form.title.trim(),
            details: form.details.trim(),
            category: form.category,
          },
        ])
        .select("*")
        .single();

      if (error) throw error;

      // Upload screenshots (if any)
      if (files.length > 0) {
        const id = (data as Item).id;
        for (const file of files) {
          const path = `feedback/${id}/${Date.now()}-${randSuffix()}-${file.name}`;
          const { error: upErr } = await supabase
            .storage
            .from('feedback-attachments')
            .upload(path, file, { upsert: false });
          if (upErr) throw upErr;

          const { data: pub } = supabase
            .storage
            .from('feedback-attachments')
            .getPublicUrl(path);

          const publicUrl = pub?.publicUrl;
          if (publicUrl) {
            const { error: insErr } = await supabase
              .from('feedback_attachments')
              .insert([{ feedback_id: id, url: publicUrl }]);
            if (insErr) throw insErr;
          }
        }
      }

      const newItem = {
        ...(data as Item),
        votes_count: 0,
      };

      setItems((prev) => {
        if (cat === "all" || cat === newItem.category) {
          return [newItem, ...prev];
        }
        return prev;
      });

      setForm({ title: "", details: "", category: "idea" });
      setFiles([]);
      setIsAddOpen(false);
      toast.success("Thanks! Submitted.", { id: t });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Submit failed", { id: t });
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []).slice(0, 4);
    setFiles(selected);
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <>
      {/* Standard Header */}
      <Header />
      
      {/* Page Title Bar */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left - Back to Tools button for leaders */}
          <div style={{ width: '44px', display: 'flex', alignItems: 'center' }}>
            {isLeader && (
              <button
                onClick={() => router.push('/leader/tools')}
                className="p-2 active:bg-gray-100 rounded-full transition-colors"
                style={{ minWidth: '44px', minHeight: '44px' }}
                aria-label="Back to tools"
              >
                <ArrowLeft size={22} style={{ color: BRAND.colors.primary }} />
              </button>
            )}
          </div>
          
          {/* Centered title */}
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: BRAND.fonts.heading }}>
            Feedback
          </h1>
          
          {/* Right - Add feedback button */}
          <button 
            onClick={() => setIsAddOpen(true)}
            className="p-2 active:bg-gray-100 rounded-full transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Add feedback"
          >
            <Plus size={22} style={{ color: BRAND.colors.primary }} />
          </button>
        </div>
      </div>

      <div className="min-h-screen pb-24" style={{ backgroundColor: BRAND.colors.background }}>
        {/* Filter Pills - Centered */}
        <div className="bg-white px-4 py-2 border-b border-gray-200">
          <div className="flex gap-2 justify-center">
            {CATS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className="px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors active:scale-95"
                style={{
                  backgroundColor: cat === c.id ? BRAND.colors.primary : '#f3f4f6',
                  color: cat === c.id ? 'white' : '#374151',
                  fontFamily: BRAND.fonts.heading,
                  minHeight: '32px',
                  fontSize: '13px',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options - Below Filters */}
        <div className="bg-white px-4 py-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600" style={{ fontFamily: BRAND.fonts.body }}>Sort:</span>
            <button
              onClick={() => setSort('top')}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors active:scale-95"
              style={{
                backgroundColor: sort === 'top' ? BRAND.colors.primary : '#f3f4f6',
                color: sort === 'top' ? 'white' : '#374151',
                fontFamily: BRAND.fonts.heading,
                minHeight: '28px',
              }}
            >
              Top
            </button>
            <button
              onClick={() => setSort('new')}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors active:scale-95"
              style={{
                backgroundColor: sort === 'new' ? BRAND.colors.primary : '#f3f4f6',
                color: sort === 'new' ? 'white' : '#374151',
                fontFamily: BRAND.fonts.heading,
                minHeight: '28px',
              }}
            >
              New
            </button>
          </div>
        </div>

        {/* Feedback Cards - Mobile-Optimized */}
        <div className="px-4 pt-4">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-gray-500 text-center" style={{ fontFamily: BRAND.fonts.body }}>
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-gray-500 text-center" style={{ fontFamily: BRAND.fonts.body }}>
              No feedback yet. Be the first to share an idea!
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it) => {
                const voted = votedTodayId === it.id;
                const dailyLocked = !!votedTodayId && !voted;
                const Icon = CAT_ICONS[it.category] ?? Lightbulb;

                return (
                  <div 
                    key={it.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="flex gap-3">
                      {/* Upvote section - left side */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <button 
                          onClick={() => toggleVote(it.id)}
                          disabled={dailyLocked}
                          className="p-1 active:bg-gray-100 rounded transition-colors"
                          style={{
                            minWidth: '44px',
                            minHeight: '44px',
                            opacity: dailyLocked ? 0.4 : 1,
                            cursor: dailyLocked ? 'not-allowed' : 'pointer',
                          }}
                          aria-label="Upvote"
                        >
                          <ChevronUp 
                            size={20} 
                            style={{ 
                              color: voted ? BRAND.colors.primary : '#6b7280',
                              fill: voted ? BRAND.colors.primary : 'none'
                            }} 
                          />
                        </button>
                        <span 
                          className="text-sm font-semibold"
                          style={{ 
                            color: voted ? BRAND.colors.primary : '#111827',
                            fontFamily: BRAND.fonts.heading 
                          }}
                        >
                          {it.votes_count}
                        </span>
                      </div>
                      
                      {/* Content - right side */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1" style={{ fontFamily: BRAND.fonts.heading }}>
                          {cleanTitle(it.title)}
                        </h3>
                        <p 
                          className="text-sm text-gray-600 mb-2" 
                          style={{ 
                            fontFamily: BRAND.fonts.body,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {it.details}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500" style={{ fontFamily: BRAND.fonts.body }}>
                          <span className="px-2 py-1 rounded-full bg-gray-100 flex items-center gap-1">
                            <Icon size={12} />
                            {CAT_LABELS[it.category]}
                          </span>
                          <span>{timeAgo(it.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Feedback Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsAddOpen(false)} />

          {/* Dialog */}
          <div className="absolute inset-0 flex items-start justify-center pt-12 px-4 overflow-y-auto">
            <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-gray-200 my-8">
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: BRAND.fonts.heading }}>
                  Give Feedback
                </h2>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="p-2 active:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreate} className="p-5 space-y-4">
                {/* Category Buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2" style={{ fontFamily: BRAND.fonts.heading }}>
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, category: 'idea' }))}
                      className="h-12 flex items-center justify-center gap-2 rounded-lg border-2 font-medium transition-all active:scale-95"
                      style={{
                        borderColor: form.category === 'idea' ? BRAND.colors.primary : '#e5e7eb',
                        backgroundColor: form.category === 'idea' ? `${BRAND.colors.primary}0D` : 'white',
                        color: form.category === 'idea' ? BRAND.colors.primary : '#374151',
                        fontFamily: BRAND.fonts.heading,
                      }}
                    >
                      <Lightbulb size={20} />
                      <span>Idea</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, category: 'bug' }))}
                      className="h-12 flex items-center justify-center gap-2 rounded-lg border-2 font-medium transition-all active:scale-95"
                      style={{
                        borderColor: form.category === 'bug' ? BRAND.colors.primary : '#e5e7eb',
                        backgroundColor: form.category === 'bug' ? `${BRAND.colors.primary}0D` : 'white',
                        color: form.category === 'bug' ? BRAND.colors.primary : '#374151',
                        fontFamily: BRAND.fonts.heading,
                      }}
                    >
                      <Bug size={20} />
                      <span>Bug</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, category: 'praise' }))}
                      className="h-12 flex items-center justify-center gap-2 rounded-lg border-2 font-medium transition-all active:scale-95"
                      style={{
                        borderColor: form.category === 'praise' ? BRAND.colors.primary : '#e5e7eb',
                        backgroundColor: form.category === 'praise' ? `${BRAND.colors.primary}0D` : 'white',
                        color: form.category === 'praise' ? BRAND.colors.primary : '#374151',
                        fontFamily: BRAND.fonts.heading,
                      }}
                    >
                      <Heart size={20} />
                      <span>Praise</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, category: 'question' }))}
                      className="h-12 flex items-center justify-center gap-2 rounded-lg border-2 font-medium transition-all active:scale-95"
                      style={{
                        borderColor: form.category === 'question' ? BRAND.colors.primary : '#e5e7eb',
                        backgroundColor: form.category === 'question' ? `${BRAND.colors.primary}0D` : 'white',
                        color: form.category === 'question' ? BRAND.colors.primary : '#374151',
                        fontFamily: BRAND.fonts.heading,
                      }}
                    >
                      <HelpCircle size={20} />
                      <span>Question</span>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2" style={{ fontFamily: BRAND.fonts.heading }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Short, clear title"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    style={{
                      fontSize: '16px',
                      fontFamily: BRAND.fonts.body,
                      minHeight: '48px',
                    }}
                  />
                </div>

                {/* Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2" style={{ fontFamily: BRAND.fonts.heading }}>
                    Details
                  </label>
                  <textarea
                    value={form.details}
                    onChange={(e) => setForm(prev => ({ ...prev, details: e.target.value }))}
                    placeholder="Tell us more..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    style={{
                      fontSize: '16px',
                      fontFamily: BRAND.fonts.body,
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Screenshots */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2" style={{ fontFamily: BRAND.fonts.heading }}>
                    Screenshots (optional)
                  </label>
                  
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  
                  <label
                    htmlFor="screenshot-upload"
                    className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer active:border-gray-400 transition-colors"
                  >
                    <Camera size={32} className="text-gray-400 mb-1" />
                    <span className="text-sm text-gray-600" style={{ fontFamily: BRAND.fonts.body }}>Tap to add images</span>
                    <span className="text-xs text-gray-400" style={{ fontFamily: BRAND.fonts.body }}>Max 4 images</span>
                  </label>
                  
                  {/* Show selected images */}
                  {files.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {files.map((file, idx) => (
                        <div key={idx} className="relative">
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                            <Camera size={24} className="text-gray-400" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                          >
                            <X size={12} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 h-12 border border-gray-300 text-gray-700 rounded-lg font-medium active:bg-gray-50 transition-colors"
                    style={{ fontFamily: BRAND.fonts.heading }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!form.title || !form.category || submitting}
                    className="flex-1 h-12 text-white rounded-lg font-medium active:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: BRAND.colors.primary,
                      fontFamily: BRAND.fonts.heading 
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <Footer />
    </>
  );
}
