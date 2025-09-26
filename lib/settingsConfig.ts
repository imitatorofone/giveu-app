import { 
  User, 
  Bell, 
  Lock, 
  Settings, 
  MessageSquare, 
  HelpCircle, 
  FileText 
} from 'lucide-react';

export type SettingsItem = {
  title: string;
  href?: string;         // omit when disabled
  subtitle?: string;
  icon: React.ElementType;
  badge?: { text: string; tone?: 'new' | 'soon' };
  disabled?: boolean;
  visible?: (ctx: { isLeader: boolean }) => boolean; // gate by role
};

export type SettingsSection = {
  header?: string;
  items: SettingsItem[];
};

export const settingsSections: SettingsSection[] = [
  {
    header: 'PREFERENCES',
    items: [
      {
        title: 'Account',
        href: '/profile',
        icon: User,
        subtitle: 'Manage your profile and preferences'
      },
      {
        title: 'Notifications',
        icon: Bell,
        disabled: true,
        badge: { text: 'Coming Soon', tone: 'soon' }
      },
      {
        title: 'Privacy',
        icon: Lock,
        disabled: true,
        badge: { text: 'Coming Soon', tone: 'soon' }
      }
    ]
  },
  {
    header: 'COMMUNITY',
    items: [
      {
        title: 'Leadership Tools',
        href: '/leader/tools',
        icon: Settings,
        subtitle: 'Manage community needs and members',
        visible: (ctx) => ctx.isLeader
      },
      {
        title: 'Feedback',
        href: '/feedback',
        icon: MessageSquare,
        subtitle: 'Share your thoughts and suggestions'
      }
    ]
  },
  {
    header: 'SUPPORT',
    items: [
      {
        title: 'Get help',
        icon: HelpCircle,
        disabled: true,
        badge: { text: 'Coming Soon', tone: 'soon' }
      },
      {
        title: 'Tax Documents',
        icon: FileText,
        disabled: true,
        badge: { text: 'Coming Soon', tone: 'soon' }
      }
    ]
  }
];
