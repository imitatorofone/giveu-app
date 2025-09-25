'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import ServiceBoard from '../components/ServiceBoard';
import NotificationBell from '../components/NotificationBell';
import { ArrowLeft, Plus, Heart, Gift, Bell, LogOut } from 'lucide-react';

export default function CommunityBoard() {
  const [user, setUser] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const loadData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/');
        return;
      }
      setUser(authData.user);

      // Load active opportunities
      const { data: oppsData } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setOpportunities(oppsData || []);
      setLoading(false);
    };

    loadData();
  }, [router]);


  const handleHelp = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setShowConfirmDialog(true);
  };

  const confirmHelp = async () => {
    // In a real app, this would create a signup record
    // For now, just show confirmation
    setShowConfirmDialog(false);
    setSelectedOpportunity(null);
    alert('Thank you! Your offer to help has been sent to the ministry leader.');
  };

  const getGiftingColor = (gifting: string) => {
    const colors: { [key: string]: string } = {
      'Hands-On Skills': 'bg-orange-100 text-orange-800',
      'People & Relationships': 'bg-pink-100 text-pink-800',
      'Problem-Solving & Organizing': 'bg-blue-100 text-blue-800',
      'Care & Comfort': 'bg-green-100 text-green-800',
      'Learning & Teaching': 'bg-purple-100 text-purple-800',
      'Creativity & Expression': 'bg-yellow-100 text-yellow-800',
      'Leadership & Motivation': 'bg-indigo-100 text-indigo-800',
      'Behind-the-Scenes Support': 'bg-gray-100 text-gray-800',
      'Physical & Active': 'bg-red-100 text-red-800',
      'Pioneering & Connecting': 'bg-teal-100 text-teal-800'
    };
    return colors[gifting] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Flexible timing';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#FDFBF7',
      fontFamily: 'var(--font-family)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Consistent Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 24px', 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        {/* Left - Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img 
            src="/logo.svg" 
            alt="ENGAGE" 
            style={{ width: 32, height: 32 }}
          />
          <span style={{ 
            fontSize: 18, 
            fontWeight: 700, 
            fontFamily: 'var(--font-quicksand)',
            color: '#1f2937'
          }}>
            ENGAGE
          </span>
        </div>

        {/* Right - Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && (
            <NotificationBell userId={user.id} />
          )}
          
          <button 
            onClick={() => router.push('/share-need')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '10px 16px', 
              backgroundColor: '#20c997', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6, 
              fontSize: 14,
              fontFamily: 'var(--font-quicksand)',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            Share a Need
          </button>

          <button 
            onClick={signOut}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px', 
              backgroundColor: 'transparent', 
              border: 'none', 
              color: '#6b7280', 
              fontSize: 14,
              fontFamily: 'var(--font-quicksand)',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px' }}>
        {/* Page Title */}
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ margin: 0, fontSize: 28, color: '#1f2937', fontFamily: 'var(--font-quicksand)', fontWeight: 700 }}>Ways to Serve</h1>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontFamily: 'var(--font-merriweather)' }}>
            Discover opportunities to use your gifts
          </p>
        </div>

        {/* Service Board */}
        {user && (
          <ServiceBoard 
            userId={user.id} 
            orgId="default-org" // You'll need to get this from user's organization
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid var(--gray-200)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <button style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-1)',
            cursor: 'pointer',
            color: '#20c997',
            padding: 'var(--space-2)'
          }}>
            <Gift size={20} strokeWidth={1.5} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-quicksand)' }}>Ways to Serve</span>
          </button>
          <button 
            onClick={() => router.push('/share-need')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-1)',
              cursor: 'pointer',
              color: '#666666',
              padding: 'var(--space-2)',
              transition: 'color 0.2s ease'
            }}
          >
            <Plus size={20} strokeWidth={1.5} />
            <span style={{ fontSize: 'var(--text-xs)' }}>Share a Need</span>
          </button>
          <button 
            onClick={() => router.push('/profile')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-1)',
              cursor: 'pointer',
              color: '#666666',
              padding: 'var(--space-2)',
              transition: 'color 0.2s ease'
            }}
          >
            <Heart size={20} strokeWidth={1.5} />
            <span style={{ fontSize: 'var(--text-xs)' }}>Profile</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: 20
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            maxWidth: 400,
            width: '100%',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h3 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-quicksand)', color: '#333333' }}>
              Ready to Serve?
            </h3>
            <p style={{ margin: '0 0 var(--space-6)', color: '#666666', lineHeight: 1.5 }}>
              {selectedOpportunity && (
                <>
                  Your gifts align beautifully with this opportunity! Are you ready to serve as a{' '}
                  <span style={{ color: '#20c997', fontWeight: 600, fontFamily: 'var(--font-quicksand)' }}>
                    {selectedOpportunity.title}
                  </span>?
                </>
              )}
            </p>
            
            <div style={{ 
              backgroundColor: '#f0fdfa', 
              padding: 'var(--space-4)', 
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-6)',
              border: '1px solid #20c997'
            }}>
              <h4 style={{ margin: '0 0 var(--space-2)', fontWeight: 600, fontFamily: 'var(--font-quicksand)', color: '#333333' }}>What happens next:</h4>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#666666', fontSize: 'var(--text-sm)' }}>
                <li>Ministry leader will reach out within 24 hours</li>
                <li>You'll receive details and any training needed</li>
                <li>This becomes part of your service journey</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button 
                onClick={() => setShowConfirmDialog(false)}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--gray-100)',
                  border: '1px solid var(--gray-300)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  color: '#666666',
                  fontWeight: 600, fontFamily: 'var(--font-quicksand)',
                  transition: 'all 0.2s ease'
                }}
              >
                Not Now
              </button>
              <button 
                onClick={confirmHelp}
                style={{
                  flex: 1,
                  backgroundColor: '#20c997',
                  color: 'white',
                  border: 'none',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: 700, fontFamily: 'var(--font-quicksand)',
                  transition: 'background-color 0.2s ease'
                }}
              >
                Count Me In!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
