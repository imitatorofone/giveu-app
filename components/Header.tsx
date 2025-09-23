'use client';

import { Bell } from 'lucide-react';

// Brand typography
const quicksandFont = 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif';
const merriweatherFont = 'Merriweather, Georgia, serif';

export default function Header() {
  return (
    <header style={{ 
      backgroundColor: 'white', 
      borderBottom: '1px solid #e5e7eb',
      padding: '12px 24px',
      fontFamily: merriweatherFont
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ 
            fontWeight: '700', 
            fontSize: '18px', 
            color: 'white',
            fontFamily: quicksandFont,
            backgroundColor: '#20c997',
            padding: '4px 16px',
            borderRadius: '20px',
            display: 'inline-block'
          }}>giveU</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{ 
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}>
            <Bell size={20} color="#64748b" />
          </button>
          <button style={{ 
            color: '#6b7280',
            background: 'none',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
