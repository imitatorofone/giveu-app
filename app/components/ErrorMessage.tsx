'use client';

import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
  className?: string;
}

export function ErrorMessage({ 
  message, 
  onDismiss, 
  type = 'error', 
  className = '' 
}: ErrorMessageProps) {
  const typeStyles = {
    error: {
      bg: '#fff5f5',
      border: '#FF6B6B',
      text: '#FF6B6B',
      icon: AlertCircle
    },
    warning: {
      bg: '#fff7ed',
      border: '#FFD166',
      text: '#FFD166',
      icon: AlertCircle
    },
    info: {
      bg: '#f0fdfa',
      border: '#20c997',
      text: '#20c997',
      icon: AlertCircle
    }
  };

  const style = typeStyles[type];
  const IconComponent = style.icon;

  return (
    <div 
      className={`flex items-start gap-3 p-4 rounded-lg border ${className}`}
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        borderWidth: '1px'
      }}
    >
      <IconComponent 
        size={20} 
        color={style.text}
        style={{ flexShrink: 0, marginTop: '2px' }}
      />
      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0,
          fontSize: 'var(--text-sm)',
          color: style.text,
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
          <X size={16} color={style.text} />
        </button>
      )}
    </div>
  );
}
