'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser as supabase } from '../../../lib/supabaseBrowser';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

// Brand typography
const quicksandFont = 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif';
const merriweatherFont = 'Merriweather, Georgia, serif';

export default function LeaderToolsPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      setAllowed(data?.role === 'leader' || data?.role === 'admin');
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        fontFamily: merriweatherFont
      }}>
        <div style={{ color: '#6b7280', fontSize: '16px' }}>Loading...</div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#f9fafb'
      }}>
        <Header />
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#dc2626',
              marginBottom: '16px',
              fontFamily: quicksandFont
            }}>
              Not Authorized
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              fontFamily: merriweatherFont
            }}>
              You don't have permission to access Leadership Tools.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#f9fafb'
    }}>
      <Header />
      
      <main style={{ 
        flex: 1,
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '32px 24px',
        fontFamily: merriweatherFont
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700',
            marginBottom: '8px',
            color: '#1e293b',
            fontFamily: quicksandFont
          }}>
            Leadership Tools
          </h1>
          <p style={{ 
            color: '#64748b',
            fontSize: '16px',
            fontFamily: merriweatherFont
          }}>
            Manage your community's needs and members
          </p>
        </div>

        <div style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
        }}>
          {/* Pending Needs */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1e293b',
              fontFamily: quicksandFont
            }}>
              Pending Needs
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              marginBottom: '16px',
              lineHeight: '1.5',
              fontFamily: merriweatherFont
            }}>
              Review and approve community needs submitted by members.
            </p>
            <a
              href="/leader/pending-needs"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#20c997',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                fontFamily: quicksandFont,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1ba085';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#20c997';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Manage Needs
            </a>
          </div>

          {/* Members */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1e293b',
              fontFamily: quicksandFont
            }}>
              Members
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              marginBottom: '16px',
              lineHeight: '1.5',
              fontFamily: merriweatherFont
            }}>
              View and manage community members and their profiles.
            </p>
            <a
              href="/leader/members"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                fontFamily: quicksandFont,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4b5563';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6b7280';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Coming Soon
            </a>
          </div>

          {/* Invite Leaders */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1e293b',
              fontFamily: quicksandFont
            }}>
              Invite Leaders
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              marginBottom: '16px',
              lineHeight: '1.5',
              fontFamily: merriweatherFont
            }}>
              Invite new leaders to help manage your community.
            </p>
            <a
              href="/leader/invite"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                fontFamily: quicksandFont,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4b5563';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6b7280';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Coming Soon
            </a>
          </div>

          {/* Feedback */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1e293b',
              fontFamily: quicksandFont
            }}>
              Feedback
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              marginBottom: '16px',
              lineHeight: '1.5',
              fontFamily: merriweatherFont
            }}>
              Share feedback about the platform and your experience.
            </p>
            <a
              href="/feedback"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#20c997',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                fontFamily: quicksandFont,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1ba085';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#20c997';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Give Feedback
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
