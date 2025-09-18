'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import {
  ArrowBigUp,
  MessageSquare,
  Filter,
  Lightbulb,
  Bug,
  Heart,
  HelpCircle,
  ChevronLeft,
  Plus,
  Send,
  X,
} from 'lucide-react';

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

export default function FeedbackListPage() {
  console.log('FEEDBACK PAGE RENDER @', new Date().toLocaleTimeString());
  
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
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  // NEW: which item I've voted for today (null = not yet)
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

  // File upload state
  const [files, setFiles] = useState<File[]>([]);
  const allowScreenshotUploads = true; // ✅ flip on

  // File management helpers
  function addFiles(newFiles: FileList | File[]) {
    const asArray = Array.from(newFiles);
    const filtered = asArray
      .filter(f => f.type.startsWith('image/'))
      .slice(0, 4); // cap to 4 images
    setFiles(prev => {
      const merged = [...prev, ...filtered].slice(0, 4);
      // de-dupe by name+size
      const map = new Map<string, File>();
      merged.forEach(f => map.set(`${f.name}-${f.size}`, f));
      return Array.from(map.values());
    });
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function randSuffix(len = 6) {
    return Math.random().toString(36).slice(2, 2 + len);
  }

  // Helper to get Chicago "today" date (YYYY-MM-DD)
  function todayChicago() {
    const fmt = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD
      timeZone: 'America/Chicago',
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    return fmt.format(new Date());
  }

  // ms until next midnight in America/Chicago
  function msUntilChicagoMidnight() {
    const d = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour12: false,
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(d);

    const get = (t:string) => Number(parts.find(p => p.type === t)?.value ?? '0');
    const h = get('hour'), m = get('minute'), s = get('second');
    const secsLeft = (24*60*60) - (h*60*60 + m*60 + s);
    return (secsLeft + 1) * 1000; // +1s buffer
  }

  const FORM_CATS = [
    { id: "idea", icon: Lightbulb, label: "Idea" },
    { id: "bug", icon: Bug, label: "Bug" },
    { id: "praise", icon: Heart, label: "Praise" },
    { id: "question", icon: HelpCircle, label: "Question" },
  ] as const;

  // auth + initial fetch
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      setUserId(uid);

      await Promise.all([fetchItems('all'), fetchMyVoteToday(uid)]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch on filter change
  useEffect(() => {
    fetchItems(cat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  // refetch when sort changes
  useEffect(() => {
    fetchItems(cat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // refresh votes at Chicago midnight
  useEffect(() => {
    if (!userId) return;
    
    // schedule a refresh at Chicago midnight
    const t = setTimeout(async () => {
      await fetchMyVoteToday(userId);
      // schedule the next day again
    }, msUntilChicagoMidnight());

    return () => clearTimeout(t);
  }, [userId]); // re-schedule if user changes

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

  // Fetch the single vote (if any) I cast today
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

    // If you already used today's vote, don't call the RPC again
    if (votedTodayId) {
      const votedTitle = items.find(x => x.id === votedTodayId)?.title ?? 'another item';
      toast("You've already used today's vote on \"" + cleanTitle(votedTitle) + "\". Try again tomorrow.", { icon: '🔁' });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('upvote_feedback_daily', { p_feedback_id: id });
      if (error) throw error;

      const didUpvote = data?.[0]?.did_upvote ?? false;
      const serverCount = data?.[0]?.votes_count ?? null;
      const votedId = data?.[0]?.voted_feedback_id ?? null;

      if (didUpvote) {
        // lock the day and reflect server count
        setVotedTodayId(id);
        if (serverCount !== null) {
          setItems(prev => prev.map(it => (it.id === id ? { ...it, votes_count: serverCount } : it)));
        } else {
          setItems(prev => prev.map(it => (it.id === id ? { ...it, votes_count: it.votes_count + 1 } : it)));
        }
        toast.success('Thanks for voting!');
      } else {
        // backend says you already used today's vote (edge cases)
        setVotedTodayId(votedId);
        const votedTitle = items.find(x => x.id === votedId)?.title ?? 'another item';
        if (serverCount !== null) {
          setItems(prev => prev.map(it => (it.id === id ? { ...it, votes_count: serverCount } : it)));
        }
        toast("You've already used today's vote on \"" + cleanTitle(votedTitle) + "\".", { icon: '🔁' });
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
      // fetch email for convenience
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

      // drop new item into list (respect current filter)
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

  const filteredCount = useMemo(() => items.length, [items]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pb-24">

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Sticky toolbar — light, compact, always reachable */}
        <div className="sticky top-16 z-20 mb-4">
          <div className="bg-white/85 backdrop-blur rounded-full px-3 py-2 shadow-sm ring-1 ring-gray-900/10 flex items-center gap-2">
            {/* Pills row */}
            <div className="px-0 py-0">
              <div className="flex flex-wrap items-center gap-2">
                {CATS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCat(c.id)}
                    className={`px-3 py-2 rounded-full border text-sm font-medium transition
                      ${cat === c.id
                        ? 'bg-[#20c997] text-white border-[#20c997] hover:opacity-90'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {c.label}
                  </button>
                ))}

                {/* Show only when a specific category is selected */}
                {cat !== 'all' && (
                  <button
                    onClick={() => setCat('all')}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                    aria-label="Clear category filter"
                    title="Clear filter"
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" className="text-gray-500">
                      <path fill="currentColor" d="M11.414 10l4.95-4.95a1 1 0 10-1.414-1.414L10 8.586 5.05 3.636A1 1 0 103.636 5.05L8.586 10l-4.95 4.95a1 1 0 101.414 1.414L10 11.414l4.95 4.95a1 1 0 001.414-1.414L11.414 10z"/>
                    </svg>
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Right cluster: sort + add */}
            <div className="ml-auto inline-flex items-center gap-2">
              <button
                onClick={() => setSort('top')}
                className={`px-3 py-2 rounded-full border text-sm font-medium transition
                  ${sort === 'top'
                    ? 'bg-[#20c997] text-white border-[#20c997] hover:opacity-90'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Top
              </button>
              <button
                onClick={() => setSort('new')}
                className={`px-3 py-2 rounded-full border text-sm font-medium transition
                  ${sort === 'new'
                    ? 'bg-[#20c997] text-white border-[#20c997] hover:opacity-90'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                New
              </button>

              {/* Add opens modal */}
              <button
                onClick={() => setIsAddOpen(true)}
                className="ml-1 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#20c997] text-white hover:opacity-90"
                aria-label="Give feedback"
              >
                <Plus size={16} />
                Give feedback
              </button>
            </div>
          </div>
        </div>


        {/* Card list — product-hunt vibe */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border p-6 text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-6 text-gray-500">
            No feedback yet. Be the first to share an idea!
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((it) => {
              const voted = votedTodayId === it.id;
              const dailyLocked = !!votedTodayId && !voted;
              const Icon = CAT_ICONS[it.category] ?? Lightbulb;

              return (
                <article
                  key={it.id}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 md:p-6 flex items-start gap-5"
                >
                  {/* Vote column (Product Hunt style) */}
                  <button
                    onClick={() => toggleVote(it.id)}
                    disabled={dailyLocked}
                    aria-pressed={voted}
                    aria-label={
                      voted
                        ? "You already voted today"
                        : dailyLocked
                          ? "You've used your daily vote"
                          : "Upvote"
                    }
                    title={
                      voted
                        ? "You can vote again tomorrow"
                        : dailyLocked
                          ? "You've used your daily vote"
                          : "Upvote"
                    }
                    className={`group flex flex-col items-center justify-center w-12 md:w-14 h-14 md:h-16
                                rounded-xl border text-sm font-semibold leading-none gap-1
                                transition-colors transition-transform duration-150
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#20c997]/50
                                ${voted
                                  ? 'bg-[#20c997]/15 border-[#20c997]/40 text-[#20c997]'
                                  : dailyLocked
                                    ? 'bg-white border-gray-200 text-gray-300 cursor-not-allowed'
                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:scale-[1.02]'}`}
                  >
                    <ArrowBigUp
                      size={18}
                      className={`${voted ? 'fill-[#20c997]' : !dailyLocked ? 'group-hover:translate-y-[-1px]' : ''} transition-transform`}
                    />
                    <span>{it.votes_count}</span>
                    {voted && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-[#20c997]">
                        • today
                      </span>
                    )}
                  </button>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Header row — bigger title + icon-only category bubble */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <h2 className="font-heading text-base md:text-lg font-bold tracking-tight text-gray-900 truncate">
                        {cleanTitle(it.title)}
                      </h2>
                      <span
                        className="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-full 
                                   bg-[#20c997] text-white shadow-md ring-2 ring-[#20c997]/35"
                        title={it.category}
                        aria-label={`Category: ${it.category}`}
                      >
                        <Icon size={16} />
                      </span>
                    </div>

                    <p className="mt-2 text-[13.5px] md:text-sm text-gray-700 clamp-3 font-heading">
                      {it.details}
                    </p>

                    <div className="mt-3 text-[11px] text-gray-400 font-heading">
                      <time dateTime={it.created_at} title={new Date(it.created_at).toLocaleString()}>
                        {timeAgo(it.created_at)}
                      </time>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

        {/* Add feedback — modal */}
        {isAddOpen && (
          <div className="fixed inset-0 z-40">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsAddOpen(false)} />

            {/* Dialog */}
            <div className="absolute inset-0 flex items-start justify-center pt-24 px-4">
              <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl">
                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <div className="flex items-center gap-2">
                    <Plus className="text-[#20c997]" size={18} />
                    <h3 className="font-heading text-lg font-bold tracking-tight text-gray-900">
                      Add feedback
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsAddOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal body (same fields/validation as before) */}
                <form onSubmit={handleCreate} className="p-5 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Short, clear summary"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#20c997] focus:border-[#20c997]"
                    />
                  </div>

                  {/* Category (icon + label pills) */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {FORM_CATS.map(({ id, icon: Ico, label }) => {
                        const active = form.category === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, category: id }))}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition
                              ${active
                                ? 'bg-[#20c997] border-[#20c997] text-white hover:opacity-90'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            aria-pressed={active}
                            aria-label={label}
                            title={label}
                          >
                            <Ico size={16} />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Details</label>
                    <textarea
                      rows={4}
                      value={form.details}
                      onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                      placeholder="What's the problem or idea? Any context helps."
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#20c997] focus:border-[#20c997] font-heading"
                    />
                    {allowScreenshotUploads ? (
                      <div className="mt-1 text-xs text-gray-400 font-heading">
                        Please be specific. Screenshots welcome.
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-gray-400 font-heading">
                        Please be specific.
                      </div>
                    )}
                  </div>

                  {/* Screenshots section */}
                  {allowScreenshotUploads && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Screenshots (optional)</label>

                      {/* Dropzone */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); }}
                        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                        className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600
                                   hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>Drag & drop images here, or select files</span>
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300
                                            text-gray-700 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => e.target.files && addFiles(e.target.files)}
                            />
                            Choose files
                          </label>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {files.map((f, i) => (
                            <div key={i} className="relative group">
                              <img
                                src={URL.createObjectURL(f)}
                                alt={f.name}
                                className="w-full h-24 object-cover rounded-md border"
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="absolute top-1 right-1 px-1.5 py-0.5 text-xs rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100"
                                title="Remove"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-400 font-heading">
                          Max 4 images. Large files may take longer to upload.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="pt-1 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddOpen(false)}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#20c997] text-white hover:opacity-90 disabled:opacity-60"
                    >
                      <Send size={16} />
                      {submitting ? 'Submitting…' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Footer */}
        <Footer />
      </div>
    </>
  );
}