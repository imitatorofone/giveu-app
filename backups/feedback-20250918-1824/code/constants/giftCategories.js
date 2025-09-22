import { 
  Wrench, Users, Brain, Heart, BookOpen, Palette, 
  Crown, Settings, Dumbbell, Compass 
} from 'lucide-react';

export const GIFT_CATEGORIES = {
  'hands-on-skills': {
    name: 'Hands-On Skills',
    icon: Wrench,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    tags: [
      'Carpentry', 'Repairs', 'Gardening', 'Sewing', 
      'Decorating', 'Setup/Tear Down', 'Cooking', 
      'Automotive', 'Painting'
    ]
  },
  'people-relationships': {
    name: 'People & Relationships',
    icon: Users,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    tags: [
      'Hospitality', 'Listening', 'Mentoring', 
      'Counseling', 'Welcoming', 'Hosting'
    ]
  },
  'problem-solving': {
    name: 'Problem-Solving & Organizing',
    icon: Brain,
    color: 'bg-green-100 text-green-800 border-green-200',
    tags: [
      'Planning', 'Budgeting', 'Logistics', 'Strategy', 
      'Administration', 'Research'
    ]
  },
  'care-comfort': {
    name: 'Care & Comfort',
    icon: Heart,
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    tags: [
      'Visiting the Sick', 'Meal Prep', 'Childcare', 
      'Encouragement', 'Prayer', 'Compassionate Care'
    ]
  },
  'learning-teaching': {
    name: 'Learning & Teaching',
    icon: BookOpen,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    tags: [
      'Tutoring', 'Bible Study Leading', 'Coaching', 
      'Skill Training', 'Public Speaking', 'Mentoring'
    ]
  },
  'creativity-expression': {
    name: 'Creativity & Expression',
    icon: Palette,
    color: 'bg-red-100 text-red-800 border-red-200',
    tags: [
      'Art', 'Music', 'Writing', 'Photography', 
      'Design', 'Storytelling'
    ]
  },
  'leadership-motivation': {
    name: 'Leadership & Motivation',
    icon: Crown,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    tags: [
      'Facilitating Groups', 'Casting Vision', 'Mentoring Teams', 
      'Event Leadership', 'Preaching', 'Strategic Planning'
    ]
  },
  'behind-scenes': {
    name: 'Behind-the-Scenes Support',
    icon: Settings,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    tags: [
      'Tech Support', 'AV/Production', 'Finance', 
      'Cleaning', 'Setup Crew', 'Admin Tasks'
    ]
  },
  'physical-active': {
    name: 'Physical & Active',
    icon: Dumbbell,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    tags: [
      'Sports Coaching', 'Outdoor Projects', 'Moving Help', 
      'Fitness Activities', 'Recreation Leading', 'Disaster Relief'
    ]
  },
  'pioneering-connecting': {
    name: 'Pioneering & Connecting',
    icon: Compass,
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    tags: [
      'Evangelism', 'Community Outreach', 'Starting Ministries', 
      'Networking', 'Fundraising', 'Advocacy'
    ]
  }
};

// Helper function to get color class for any tag
export const getTagColor = (tagName) => {
  for (const category of Object.values(GIFT_CATEGORIES)) {
    if (category.tags.includes(tagName)) {
      return category.color;
    }
  }
  return 'bg-gray-100 text-gray-800 border-gray-200'; // fallback
};

// Helper function to get all tags as flat array
export const getAllTags = () => {
  return Object.values(GIFT_CATEGORIES).flatMap(category => category.tags);
};
