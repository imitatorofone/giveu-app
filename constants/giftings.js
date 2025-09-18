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
};

// Helper functions
export const getGiftColor = (giftTag) => {
  for (const category of Object.values(GIFTING_CATEGORIES)) {
    if (category.tags.includes(giftTag)) {
      return category.color;
    }
  }
  return 'bg-gray-100 text-gray-800'; // fallback
};

export const getAllGiftTags = () => {
  return Object.values(GIFTING_CATEGORIES).flatMap(category => category.tags);
};
