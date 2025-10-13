export const GIFTING_CATEGORIES = {
  'hands-on-skills': {
    id: 'hands-on-skills',
    name: 'Hands-On Skills',
    icon: '🔨',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    borderColor: '#bfdbfe',
    hoverBg: '#bfdbfe',
    tags: ['Carpentry', 'Repairs', 'Gardening', 'Sewing', 'Decorating', 'Setup/Tear Down', 'Cooking', 'Automotive', 'Painting']
  },
  'people-relationships': {
    id: 'people-relationships',
    name: 'People & Relationships',
    icon: '👥',
    bgColor: '#f3e8ff',
    textColor: '#6b21a8',
    borderColor: '#e9d5ff',
    hoverBg: '#e9d5ff',
    tags: ['Hospitality', 'Listening', 'Mentoring', 'Counseling', 'Welcoming', 'Hosting']
  },
  'problem-solving-organizing': {
    id: 'problem-solving-organizing',
    name: 'Problem-Solving & Organizing',
    icon: '🧩',
    bgColor: '#f3f4f6',
    textColor: '#1f2937',
    borderColor: '#d1d5db',
    hoverBg: '#d1d5db',
    tags: ['Planning', 'Budgeting', 'Logistics', 'Strategy', 'Administration', 'Research']
  },
  'care-comfort': {
    id: 'care-comfort',
    name: 'Care & Comfort',
    icon: '❤️',
    bgColor: '#fce7f3',
    textColor: '#be185d',
    borderColor: '#fbcfe8',
    hoverBg: '#fbcfe8',
    tags: ['Visiting the Sick', 'Meal Prep', 'Childcare', 'Encouragement', 'Prayer', 'Compassion Care']
  },
  'learning-teaching': {
    id: 'learning-teaching',
    name: 'Learning & Teaching',
    icon: '📚',
    bgColor: '#e0e7ff',
    textColor: '#3730a3',
    borderColor: '#c7d2fe',
    hoverBg: '#c7d2fe',
    tags: ['Tutoring', 'Bible Study Leading', 'Coaching', 'Skill Training', 'Public Speaking', 'Mentoring']
  },
  'creativity-expression': {
    id: 'creativity-expression',
    name: 'Creativity & Expression',
    icon: '🎨',
    bgColor: '#ffe4e6',
    textColor: '#9f1239',
    borderColor: '#fecdd3',
    hoverBg: '#fecdd3',
    tags: ['Art', 'Music', 'Writing', 'Photography', 'Design', 'Storytelling']
  },
  'leadership-motivation': {
    id: 'leadership-motivation',
    name: 'Leadership & Motivation',
    icon: '👑',
    bgColor: '#fef3c7',
    textColor: '#92400e',
    borderColor: '#fde68a',
    hoverBg: '#fde68a',
    tags: ['Facilitating Groups', 'Casting Vision', 'Mentoring Teams', 'Event Leadership', 'Preaching', 'Strategic Planning']
  },
  'behind-scenes-support': {
    id: 'behind-scenes-support',
    name: 'Behind-the-Scenes Support',
    icon: '⚙️',
    bgColor: '#f1f5f9',
    textColor: '#1e293b',
    borderColor: '#cbd5e1',
    hoverBg: '#cbd5e1',
    tags: ['Tech Support', 'AV/Production', 'Finance', 'Cleaning', 'Setup Crew', 'Admin Tasks']
  },
  'physical-active': {
    id: 'physical-active',
    name: 'Physical & Active',
    icon: '🏃',
    bgColor: '#dcfce7',
    textColor: '#166534',
    borderColor: '#bbf7d0',
    hoverBg: '#bbf7d0',
    tags: ['Sports Coaching', 'Outdoor Projects', 'Moving Help', 'Fitness Activities', 'Recreation Leading', 'Disaster Relief']
  },
  'pioneering-connecting': {
    id: 'pioneering-connecting',
    name: 'Pioneering & Connecting',
    icon: '🌟',
    bgColor: '#fed7aa',
    textColor: '#9a3412',
    borderColor: '#fdba74',
    hoverBg: '#fdba74',
    tags: ['Evangelism', 'Community Outreach', 'Starting Ministries', 'Networking', 'Fundraising', 'Advocacy']
  }
} as const;

// Type definitions
export type GiftingCategory = keyof typeof GIFTING_CATEGORIES;
export type GiftingTag = typeof GIFTING_CATEGORIES[GiftingCategory]['tags'][number];

// Helper functions
export const getGiftColor = (giftTag: string): string => {
  for (const category of Object.values(GIFTING_CATEGORIES)) {
    if ((category.tags as readonly string[]).includes(giftTag)) {
      return category.textColor;
    }
  }
  return '#1f2937'; // fallback
};

export const getAllGiftTags = (): string[] => {
  return Object.values(GIFTING_CATEGORIES).flatMap(category => category.tags);
};

// Helper function to get category info for a tag (for backward compatibility with existing code)
export const getCategoryForTag = (tag: string) => {
  for (const [categoryId, category] of Object.entries(GIFTING_CATEGORIES)) {
    if ((category.tags as readonly string[]).includes(tag)) {
      return {
        id: categoryId,
        name: category.name,
        color: category.textColor,
        bgColor: category.bgColor,
        borderColor: category.borderColor
      };
    }
  }
  return null;
};
