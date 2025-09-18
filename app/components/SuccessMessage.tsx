'use client';

import { CheckCircle, X } from 'lucide-react';

interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function SuccessMessage({ 
  message, 
  onDismiss, 
  className = '' 
}: SuccessMessageProps) {
  return (
    <div 
      className={`flex items-start gap-3 p-4 rounded-lg border ${className}`}
      style={{
        backgroundColor: '#f0fdfa',
        borderColor: '#20c997',
        borderWidth: '1px'
      }}
    >
      <CheckCircle 
        size={20} 
        color="#20c997"
        style={{ flexShrink: 0, marginTop: '2px' }}
      />
      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0,
          fontSize: 'var(--text-sm)',
          color: '#20c997',
          fontWeight: 'var(--font-medium)',
          lineHeight: 1.5
        }}>
          {message}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={16} color="#20c997" />
        </button>
      )}
    </div>
  );
}
