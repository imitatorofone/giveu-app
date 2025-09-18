// lib/giftingStructure.js
// ENGAGE APP - Complete Gifting Structure with Color Codes

export const GIFTING_CATEGORIES = {
  'hands-on-skills': {
    id: 'hands-on-skills',
    name: 'Hands-On Skills',
    icon: '🔧',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-200',
    tags: [
      'carpentry',
      'repairs',
      'gardening',
      'sewing',
      'decorating',
      'setup-tear-down',
      'cooking',
      'automotive',
      'painting'
    ]
  },
  'people-relationships': {
    id: 'people-relationships',
    name: 'People & Relationships',
    icon: '👥',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
    hoverBg: 'hover:bg-purple-200',
    tags: [
      'hospitality',
      'listening',
      'mentoring',
      'counseling',
      'welcoming',
      'hosting'
    ]
  },
  'problem-solving-organizing': {
    id: 'problem-solving-organizing',
    name: 'Problem-Solving & Organizing',
    icon: '⚙️',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    hoverBg: 'hover:bg-gray-200',
    tags: [
      'planning',
      'budgeting',
      'logistics',
      'strategy',
      'administration',
      'research'
    ]
  },
  'care-comfort': {
    id: 'care-comfort',
    name: 'Care & Comfort',
    icon: '💝',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-800',
    borderColor: 'border-pink-200',
    hoverBg: 'hover:bg-pink-200',
    tags: [
      'visiting-sick',
      'meal-prep',
      'childcare',
      'encouragement',
      'prayer',
      'compassion-care'
    ]
  },
  'learning-teaching': {
    id: 'learning-teaching',
    name: 'Learning & Teaching',
    icon: '📚',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-200',
    hoverBg: 'hover:bg-indigo-200',
    tags: [
      'tutoring',
      'bible-study-leading',
      'coaching',
      'skill-training',
      'public-speaking',
      'skill-development'
    ]
  },
  'creativity-expression': {
    id: 'creativity-expression',
    name: 'Creativity & Expression',
    icon: '🎨',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-800',
    borderColor: 'border-rose-200',
    hoverBg: 'hover:bg-rose-200',
    tags: [
      'art',
      'music',
      'writing',
      'photography',
      'design',
      'storytelling'
    ]
  },
  'leadership-motivation': {
    id: 'leadership-motivation',
    name: 'Leadership & Motivation',
    icon: '🌟',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    hoverBg: 'hover:bg-amber-200',
    tags: [
      'facilitating-groups',
      'casting-vision',
      'mentoring-teams',
      'event-leadership',
      'preaching',
      'strategic-planning'
    ]
  },
  'behind-scenes-support': {
    id: 'behind-scenes-support',
    name: 'Behind-the-Scenes Support',
    icon: '⚡',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-800',
    borderColor: 'border-slate-200',
    hoverBg: 'hover:bg-slate-200',
    tags: [
      'tech-support',
      'av-production',
      'finance',
      'cleaning',
      'setup-crew',
      'admin-tasks'
    ]
  },
  'physical-active': {
    id: 'physical-active',
    name: 'Physical & Active',
    icon: '🏃',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    hoverBg: 'hover:bg-green-200',
    tags: [
      'sports-coaching',
      'outdoor-projects',
      'moving-help',
      'fitness-activities',
      'recreation-leading',
      'disaster-relief'
    ]
  },
  'pioneering-connecting': {
    id: 'pioneering-connecting',
    name: 'Pioneering & Connecting',
    icon: '🚀',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
    hoverBg: 'hover:bg-orange-200',
    tags: [
      'evangelism',
      'community-outreach',
      'starting-ministries',
      'networking',
      'fundraising',
      'advocacy'
    ]
  }
}

// Tag to human-readable display names
export const TAG_DISPLAY_NAMES = {
  // Hands-On Skills
  'carpentry': 'Carpentry',
  'repairs': 'Repairs',
  'gardening': 'Gardening',
  'sewing': 'Sewing',
  'decorating': 'Decorating',
  'setup-tear-down': 'Setup/Tear Down',
  'cooking': 'Cooking',
  'automotive': 'Automotive',
  'painting': 'Painting',
  
  // People & Relationships
  'hospitality': 'Hospitality',
  'listening': 'Listening',
  'mentoring': 'Mentoring',
  'counseling': 'Counseling',
  'welcoming': 'Welcoming',
  'hosting': 'Hosting',
  
  // Problem-Solving & Organizing
  'planning': 'Planning',
  'budgeting': 'Budgeting',
  'logistics': 'Logistics',
  'strategy': 'Strategy',
  'administration': 'Administration',
  'research': 'Research',
  
  // Care & Comfort
  'visiting-sick': 'Visiting the Sick',
  'meal-prep': 'Meal Prep',
  'childcare': 'Childcare',
  'encouragement': 'Encouragement',
  'prayer': 'Prayer',
  'compassion-care': 'Compassion Care',
  
  // Learning & Teaching
  'tutoring': 'Tutoring',
  'bible-study-leading': 'Bible Study Leading',
  'coaching': 'Coaching',
  'skill-training': 'Skill Training',
  'public-speaking': 'Public Speaking',
  'skill-development': 'Skill Development',
  
  // Creativity & Expression
  'art': 'Art',
  'music': 'Music',
  'writing': 'Writing',
  'photography': 'Photography',
  'design': 'Design',
  'storytelling': 'Storytelling',
  
  // Leadership & Motivation
  'facilitating-groups': 'Facilitating Groups',
  'casting-vision': 'Casting Vision',
  'mentoring-teams': 'Mentoring Teams',
  'event-leadership': 'Event Leadership',
  'preaching': 'Preaching',
  'strategic-planning': 'Strategic Planning',
  
  // Behind-the-Scenes Support
  'tech-support': 'Tech Support',
  'av-production': 'AV/Production',
  'finance': 'Finance',
  'cleaning': 'Cleaning',
  'setup-crew': 'Setup Crew',
  'admin-tasks': 'Admin Tasks',
  
  // Physical & Active
  'sports-coaching': 'Sports Coaching',
  'outdoor-projects': 'Outdoor Projects',
  'moving-help': 'Moving Help',
  'fitness-activities': 'Fitness Activities',
  'recreation-leading': 'Recreation Leading',
  'disaster-relief': 'Disaster Relief',
  
  // Pioneering & Connecting
  'evangelism': 'Evangelism',
  'community-outreach': 'Community Outreach',
  'starting-ministries': 'Starting Ministries',
  'networking': 'Networking',
  'fundraising': 'Fundraising',
  'advocacy': 'Advocacy'
}

// Skill levels
export const SKILL_LEVELS = {
  'beginner': {
    id: 'beginner',
    name: 'Beginner',
    description: 'Willing to learn and help',
    value: 1
  },
  'experienced': {
    id: 'experienced',
    name: 'Experienced',
    description: 'Can work independently',
    value: 2
  },
  'can-lead': {
    id: 'can-lead',
    name: 'Can Lead',
    description: 'Can lead and train others',
    value: 3
  }
}

// Utility Functions
export function getCategoryByTag(tag) {
  for (const [categoryId, category] of Object.entries(GIFTING_CATEGORIES)) {
    if (category.tags.includes(tag)) {
      return category
    }
  }
  return null
}

export function getCategoryById(categoryId) {
  return GIFTING_CATEGORIES[categoryId] || null
}

export function getTagDisplayName(tag) {
  return TAG_DISPLAY_NAMES[tag] || tag
}

export function getAllTags() {
  return Object.values(GIFTING_CATEGORIES)
    .flatMap(category => category.tags)
}

export function getTagsByCategory(categoryId) {
  const category = GIFTING_CATEGORIES[categoryId]
  return category ? category.tags : []
}

export function getCategoriesArray() {
  return Object.values(GIFTING_CATEGORIES)
}

export function getTagsWithCategories() {
  const result = []
  Object.values(GIFTING_CATEGORIES).forEach(category => {
    category.tags.forEach(tag => {
      result.push({
        tag,
        displayName: TAG_DISPLAY_NAMES[tag],
        category: category
      })
    })
  })
  return result
}

// React Component Helper Functions
export function getTagClasses(tag, variant = 'default') {
  const category = getCategoryByTag(tag)
  if (!category) return 'bg-gray-100 text-gray-800'
  
  const baseClasses = `${category.bgColor} ${category.textColor}`
  
  switch (variant) {
    case 'border':
      return `${baseClasses} ${category.borderColor} border`
    case 'hover':
      return `${baseClasses} ${category.hoverBg} transition-colors`
    case 'button':
      return `${baseClasses} ${category.borderColor} ${category.hoverBg} border transition-colors cursor-pointer`
    default:
      return baseClasses
  }
}

export function getCategoryClasses(categoryId, variant = 'default') {
  const category = GIFTING_CATEGORIES[categoryId]
  if (!category) return 'bg-gray-100 text-gray-800'
  
  const baseClasses = `${category.bgColor} ${category.textColor}`
  
  switch (variant) {
    case 'border':
      return `${baseClasses} ${category.borderColor} border`
    case 'hover':
      return `${baseClasses} ${category.hoverBg} transition-colors`
    case 'button':
      return `${baseClasses} ${category.borderColor} ${category.hoverBg} border transition-colors cursor-pointer`
    default:
      return baseClasses
  }
}

// Validation Functions
export function isValidTag(tag) {
  return getAllTags().includes(tag)
}

export function isValidCategory(categoryId) {
  return Object.keys(GIFTING_CATEGORIES).includes(categoryId)
}

export function isValidSkillLevel(skillLevel) {
  return Object.keys(SKILL_LEVELS).includes(skillLevel)
}

// Database Preparation Functions
export function prepareCategoriesForDatabase() {
  return Object.entries(GIFTING_CATEGORIES).map(([id, category]) => ({
    id,
    name: category.name,
    icon: category.icon,
    bg_color: category.bgColor,
    text_color: category.textColor,
    border_color: category.borderColor,
    hover_bg: category.hoverBg,
    tags: category.tags
  }))
}

export function prepareTagsForDatabase() {
  return Object.entries(TAG_DISPLAY_NAMES).map(([tag, displayName]) => {
    const category = getCategoryByTag(tag)
    return {
      tag,
      display_name: displayName,
      category_id: category?.id || null
    }
  })
}

// Export default for easy importing
export default {
  GIFTING_CATEGORIES,
  TAG_DISPLAY_NAMES,
  SKILL_LEVELS,
  getCategoryByTag,
  getCategoryById,
  getTagDisplayName,
  getAllTags,
  getTagsByCategory,
  getCategoriesArray,
  getTagsWithCategories,
  getTagClasses,
  getCategoryClasses,
  isValidTag,
  isValidCategory,
  isValidSkillLevel,
  prepareCategoriesForDatabase,
  prepareTagsForDatabase
}
