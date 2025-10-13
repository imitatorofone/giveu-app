import { 
  Wrench, Users, Lightbulb, Heart, BookOpen, 
  Palette, Target, Settings, Activity, Compass 
} from 'lucide-react';

export interface GiftCategory {
  name: string;
  icon: any;
  tags: string[];
}

export const GIFT_CATEGORIES: GiftCategory[] = [
  {
    name: 'Hands-On Skills',
    icon: Wrench,
    tags: ['Carpentry', 'Repairs', 'Gardening', 'Sewing', 'Cooking', 'Decorating', 'Setup/Tear Down', 'Automotive', 'Painting']
  },
  {
    name: 'People & Relationships',
    icon: Users,
    tags: ['Hospitality', 'Listening', 'Mentoring', 'Counseling', 'Welcoming', 'Hosting']
  },
  {
    name: 'Problem-Solving & Organizing',
    icon: Lightbulb,
    tags: ['Planning', 'Budgeting', 'Logistics', 'Strategy', 'Administration', 'Research']
  },
  {
    name: 'Care & Comfort',
    icon: Heart,
    tags: ['Visiting the Sick', 'Meal Prep', 'Childcare', 'Encouragement', 'Prayer', 'Compassionate Care']
  },
  {
    name: 'Learning & Teaching',
    icon: BookOpen,
    tags: ['Tutoring', 'Bible Study Leading', 'Coaching', 'Skill Training', 'Public Speaking', 'Mentoring']
  },
  {
    name: 'Creativity & Expression',
    icon: Palette,
    tags: ['Art', 'Music', 'Writing', 'Photography', 'Design', 'Storytelling', 'Media Production']
  },
  {
    name: 'Leadership & Motivation',
    icon: Target,
    tags: ['Facilitating Groups', 'Casting Vision', 'Mentoring Teams', 'Event Leadership', 'Preaching', 'Strategic Planning']
  },
  {
    name: 'Behind-the-Scenes Support',
    icon: Settings,
    tags: ['Tech Support', 'AV/Production', 'Finance', 'Cleaning', 'Setup Crew', 'Admin Tasks']
  },
  {
    name: 'Physical & Active',
    icon: Activity,
    tags: ['Sports Coaching', 'Outdoor Projects', 'Moving Help', 'Fitness Activities', 'Recreation Leading', 'Disaster Relief']
  },
  {
    name: 'Pioneering & Connecting',
    icon: Compass,
    tags: ['Evangelism', 'Community Outreach', 'Starting Ministries', 'Networking', 'Fundraising', 'Advocacy']
  }
];

// Helper to get all tags as flat array
export const ALL_GIFT_TAGS = GIFT_CATEGORIES.flatMap(cat => cat.tags);

// Helper to get category for a specific tag
export const getCategoryForTag = (tag: string): GiftCategory | undefined => {
  return GIFT_CATEGORIES.find(cat => cat.tags.includes(tag));
};

