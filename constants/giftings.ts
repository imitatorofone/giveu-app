export const GIFTING_CATEGORIES = {
  'Hands-On Skills': {
    color: 'bg-blue-100 text-blue-800',
    tags: ['Carpentry', 'Repairs', 'Gardening', 'Sewing', 'Decorating', 'Setup/Tear Down', 'Cooking', 'Automotive', 'Painting']
  },
  'People & Relationships': {
    color: 'bg-purple-100 text-purple-800',
    tags: ['Hospitality', 'Listening', 'Mentoring', 'Counseling', 'Welcoming', 'Hosting']
  },
  'Problem-Solving & Organizing': {
    color: 'bg-gray-100 text-gray-800',
    tags: ['Planning', 'Budgeting', 'Logistics', 'Strategy', 'Administration', 'Research']
  },
  'Care & Comfort': {
    color: 'bg-pink-100 text-pink-800',
    tags: ['Visiting the Sick', 'Meal Prep', 'Childcare', 'Encouragement', 'Prayer', 'Compassion Care']
  },
  'Learning & Teaching': {
    color: 'bg-indigo-100 text-indigo-800',
    tags: ['Tutoring', 'Bible Study Leading', 'Coaching', 'Skill Training', 'Public Speaking', 'Mentoring']
  },
  'Creativity & Expression': {
    color: 'bg-rose-100 text-rose-800',
    tags: ['Art', 'Music', 'Writing', 'Photography', 'Design', 'Storytelling']
  },
  'Leadership & Motivation': {
    color: 'bg-amber-100 text-amber-800',
    tags: ['Facilitating Groups', 'Casting Vision', 'Mentoring Teams', 'Event Leadership', 'Preaching', 'Strategic Planning']
  },
  'Behind-the-Scenes Support': {
    color: 'bg-slate-100 text-slate-800',
    tags: ['Tech Support', 'AV/Production', 'Finance', 'Cleaning', 'Setup Crew', 'Admin Tasks']
  },
  'Physical & Active': {
    color: 'bg-green-100 text-green-800',
    tags: ['Sports Coaching', 'Outdoor Projects', 'Moving Help', 'Fitness Activities', 'Recreation Leading', 'Disaster Relief']
  },
  'Pioneering & Connecting': {
    color: 'bg-orange-100 text-orange-800',
    tags: ['Evangelism', 'Community Outreach', 'Starting Ministries', 'Networking', 'Fundraising', 'Advocacy']
  }
} as const;

// Type definitions
export type GiftingCategory = keyof typeof GIFTING_CATEGORIES;
export type GiftingTag = typeof GIFTING_CATEGORIES[GiftingCategory]['tags'][number];

// Helper functions
export const getGiftColor = (giftTag: string): string => {
  for (const category of Object.values(GIFTING_CATEGORIES)) {
    if (category.tags.includes(giftTag as GiftingTag)) {
      return category.color;
    }
  }
  return 'bg-gray-100 text-gray-800'; // fallback
};

export const getAllGiftTags = (): string[] => {
  return Object.values(GIFTING_CATEGORIES).flatMap(category => category.tags);
};

// Helper function to get category info for a tag (for backward compatibility with existing code)
export const getCategoryForTag = (tag: string) => {
  for (const [categoryName, category] of Object.entries(GIFTING_CATEGORIES)) {
    if (category.tags.includes(tag as GiftingTag)) {
      // Convert Tailwind classes to inline styles for compatibility
      const colorMap: { [key: string]: { color: string; bgColor: string; borderColor: string } } = {
        'bg-blue-100 text-blue-800': { color: '#1e40af', bgColor: '#dbeafe', borderColor: '#bfdbfe' },
        'bg-purple-100 text-purple-800': { color: '#6b21a8', bgColor: '#f3e8ff', borderColor: '#e9d5ff' },
        'bg-gray-100 text-gray-800': { color: '#1f2937', bgColor: '#f3f4f6', borderColor: '#d1d5db' },
        'bg-pink-100 text-pink-800': { color: '#be185d', bgColor: '#fce7f3', borderColor: '#fbcfe8' },
        'bg-indigo-100 text-indigo-800': { color: '#3730a3', bgColor: '#e0e7ff', borderColor: '#c7d2fe' },
        'bg-rose-100 text-rose-800': { color: '#9f1239', bgColor: '#ffe4e6', borderColor: '#fecdd3' },
        'bg-amber-100 text-amber-800': { color: '#92400e', bgColor: '#fef3c7', borderColor: '#fde68a' },
        'bg-slate-100 text-slate-800': { color: '#1e293b', bgColor: '#f1f5f9', borderColor: '#cbd5e1' },
        'bg-green-100 text-green-800': { color: '#166534', bgColor: '#dcfce7', borderColor: '#bbf7d0' },
        'bg-orange-100 text-orange-800': { color: '#9a3412', bgColor: '#fed7aa', borderColor: '#fdba74' }
      };
      
      return {
        name: categoryName,
        ...colorMap[category.color]
      };
    }
  }
  return null;
};
