'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface LeaderSubnavProps {
  className?: string;
  active?: string;
  needsCount?: number;
  membersCount?: number;
}

export default function LeaderSubnav({ className = '' }: LeaderSubnavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/leader/pending-needs', label: 'Pending Needs', path: '/leader/pending-needs' },
    { href: '/leader/members', label: 'Members', path: '/leader/members' },
  ];

  return (
    <nav className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
