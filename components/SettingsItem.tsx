'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SettingsItemProps {
  title: string;
  href?: string;
  subtitle?: string;
  icon: React.ElementType;
  badge?: { text: string; tone?: 'new' | 'soon' };
  disabled?: boolean;
  onClick?: () => void;
}

export default function SettingsItem({
  title,
  href,
  subtitle,
  icon: Icon,
  badge,
  disabled = false,
  onClick
}: SettingsItemProps) {
  const badgeClasses = {
    new: 'bg-green-100 text-green-700',
    soon: 'bg-gray-100 text-gray-600'
  };

  const itemClasses = `
    flex items-center gap-3 px-4 py-3 
    ${disabled 
      ? 'opacity-60 cursor-not-allowed' 
      : 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer'
    }
    transition-colors duration-150
    group
  `;

  const content = (
    <>
      {/* Icon */}
      <div className="shrink-0">
        <Icon 
          size={20} 
          className={disabled ? 'text-gray-400' : 'text-gray-600'} 
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-gray-900 truncate">
            {title}
          </span>
          {badge && (
            <span className={`
              px-2 py-0.5 text-[11px] font-medium rounded-full
              ${badgeClasses[badge.tone || 'soon']}
            `}>
              {badge.text}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Chevron */}
      {!disabled && (
        <ChevronRight 
          size={16} 
          className="ml-auto opacity-60 group-hover:opacity-100 transition-opacity" 
          aria-hidden="true"
        />
      )}
    </>
  );

  if (disabled || !href) {
    return (
      <div className={itemClasses} role="button" tabIndex={-1}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={itemClasses} onClick={onClick}>
      {content}
    </Link>
  );
}
