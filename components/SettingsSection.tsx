'use client';

import SettingsItem from './SettingsItem';
import { SettingsItem as SettingsItemType } from '../lib/settingsConfig';

interface SettingsSectionProps {
  header?: string;
  items: SettingsItemType[];
  isLeader: boolean;
}

export default function SettingsSection({ header, items, isLeader }: SettingsSectionProps) {
  const visibleItems = items.filter(item => 
    !item.visible || item.visible({ isLeader })
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div>
      {header && (
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-4 pt-6 pb-2">
          {header}
        </div>
      )}
      <div className="bg-white">
        {visibleItems.map((item, index) => (
          <SettingsItem
            key={`${item.title}-${index}`}
            title={item.title}
            href={item.href}
            subtitle={item.subtitle}
            icon={item.icon}
            badge={item.badge}
            disabled={item.disabled}
          />
        ))}
      </div>
    </div>
  );
}
