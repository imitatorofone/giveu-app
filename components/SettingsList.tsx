'use client';

import SettingsSection from './SettingsSection';
import { settingsSections } from '../lib/settingsConfig';

interface SettingsListProps {
  isLeader: boolean;
}

export default function SettingsList({ isLeader }: SettingsListProps) {
  return (
    <div className="max-w-md mx-auto">
      {settingsSections.map((section, index) => (
        <SettingsSection
          key={section.header || `section-${index}`}
          header={section.header}
          items={section.items}
          isLeader={isLeader}
        />
      ))}
    </div>
  );
}
