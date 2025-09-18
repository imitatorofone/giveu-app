'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchUnreadCount,
  markAllRead,
  fetchNotifications,
  type NotificationRow,
} from "../../lib/notifications";
import { supabaseBrowser as supabase } from "../../lib/supabaseBrowser";

console.log("[Bell] FILE LOADED"); // should print on every render if this file is actually used

export default function NotificationBell() {
  console.log("[Bell] RENDER"); // should print each render

  const [count, setCount] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);

  // log once on mount
  useEffect(() => {
    console.log("[Bell] MOUNTED");
  }, []);

  // 1) initial unread count
  useEffect(() => {
    (async () => {
      const c = await fetchUnreadCount().catch((e) => {
        console.error("[Bell] fetchUnreadCount error:", e);
        return 0;
      });
      console.log("[Bell] initial unread count:", c);
      setCount(c);
    })();
  }, []);

  // 2) subscribe to INSERTs for current user
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("[Bell] getUser error:", error);
      console.log("[Bell] getUser data:", data);
      const userId = data.user?.id;
      console.log("[Bell] current userId:", userId);
      if (!userId) return;

      channel = supabase
        .channel("realtime:notifications-bell")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("[Bell] INSERT payload received:", payload);
            const n = payload.new as NotificationRow;
            setCount((c) => c + 1);
            setItems((prev) => [n, ...prev]);
          }
        )
        .subscribe((status) => {
          console.log("[Bell] subscribe status:", status);
        });
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function onOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      const data = await fetchNotifications(20).catch((e) => {
        console.error("[Bell] fetchNotifications error:", e);
        return [] as NotificationRow[];
      });
      setItems(data);
      const unread = data.filter((n) => !n.read_at).length;
      console.log("[Bell] fallback recount on open ->", unread);
      setCount(unread);
    }
  }

  async function onMarkAll() {
    await markAllRead().catch((e) => console.error("[Bell] markAllRead error:", e));
    setCount(0);
    setItems((prev) =>
      prev.map((i) => ({ ...i, read_at: new Date().toISOString() }))
    );
  }

  // DEBUG helper to verify supabase auth in the browser instance
  async function checkUserNow() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("[Bell] checkUserNow error:", error);
      alert("getUser error. See console.");
      return;
    }
    alert(`User ID: ${data.user?.id ?? "(none)"}\nEmail: ${data.user?.email ?? "(unknown)"}`);
  }

  return (
    <div className="relative">
      <button
        onClick={onOpen}
        className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border"
        aria-label="Notifications"
      >
        <span>🔔</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 text-xs px-2 py-0.5 rounded-full bg-red-600 text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-lg border bg-white shadow">
          <div className="flex items-center justify-between p-2 border-b">
            <strong>Notifications</strong>
            <div className="flex gap-2">
              <button onClick={checkUserNow} className="text-xs underline">Check user</button>
              <button onClick={onMarkAll} className="text-xs underline">Mark all read</button>
            </div>
          </div>
          <ul className="divide-y">
            {items.length === 0 ? (
              <li className="p-3 text-sm text-gray-500">No notifications</li>
            ) : (
              items.map((n) => {
                const desc = n.body ?? n.message ?? "";
                const isUnread = !n.read_at;
                return (
                  <li key={n.id} className={`p-3 ${isUnread ? "bg-gray-50" : ""}`}>
                    <div className="text-sm font-medium">{n.title}</div>
                    {desc && <div className="text-sm text-gray-600">{desc}</div>}
                    {n.route && (
                      <Link href={n.route} className="text-sm text-blue-600 underline">
                        Open
                      </Link>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}