'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser as supabase } from '../lib/supabaseBrowser';
import { MessageCircle } from 'lucide-react';

type Props = { 
  className?: string;
  pathname?: string;
};

export default function LeadershipTools({ className, pathname }: Props) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    (async () => {
      // get authed user
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) {
        if (!ignore) { setRole(null); setLoading(false); }
        return;
      }

      // read role from profiles
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!ignore) {
        setRole(data?.role ?? null);
        setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, []);

  const isLeader = role === 'leader' || role === 'admin';

  // Show loading state or nothing for non-leaders
  if (loading) return null;
  if (!isLeader) return null;

  return (
    <button 
      onClick={() => window.location.href = '/leader/tools'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 4px',
        background: 'none',
        border: 'none',
        color: pathname === '/leader/tools' ? '#20c997' : '#9ca3af',
        cursor: 'pointer',
        flex: 1
      }}
    >
      <MessageCircle size={24} />
      <span style={{ 
        fontSize: '12px', 
        marginTop: '4px', 
        fontFamily: 'Quicksand, sans-serif',
        fontWeight: '600'
      }}>
        Leadership Tools
      </span>
    </button>
  );
}
