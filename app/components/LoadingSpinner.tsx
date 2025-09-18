'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-2 border-gray-200 border-t-[#20c997] rounded-full animate-spin`}
        style={{
          animation: 'spin 1s linear infinite'
        }}
      />
      {text && (
        <span style={{
          fontSize: 'var(--text-sm)',
          color: '#666666',
          fontWeight: 'var(--font-medium)'
        }}>
          {text}
        </span>
      )}
    </div>
  );
}
