import { supabaseBrowser as supabase } from "./supabaseBrowser";

export type NotificationRow = {
  id: string;
  org_id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string | null;
  body?: string | null;
  route?: string | null;
  metadata?: Record<string, any> | null;
  priority?: number | null;
  read_at?: string | null;
  created_at: string;
};

export async function fetchUnreadCount() {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function fetchNotifications(limit = 20) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

export async function markAllRead() {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) throw error;
}

export async function markRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
