'use client';

import { MessageCircle } from 'lucide-react';

interface FeedbackButtonProps {
  onClick: () => void;
  className?: string;
}

export function FeedbackButton({ onClick, className = '' }: FeedbackButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-6)',
        width: 56,
        height: 56,
        borderRadius: '50%',
        backgroundColor: '#20c997',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(43, 179, 163, 0.3)',
        transition: 'all 0.2s ease',
        zIndex: 100
      }}
      className={className}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(43, 179, 163, 0.4)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(43, 179, 163, 0.3)';
      }}
      title="Share Feedback"
    >
      <MessageCircle size={24} color="white" strokeWidth={1.5} />
    </button>
  );
}
