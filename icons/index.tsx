// icons/index.tsx - Centralized icon system
import React from 'react'
import {
  // Navigation & Core
  Home,
  Calendar,
  Users,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  
  // Giftings Categories (matching your Figma design)
  Wrench, // Hands-On Skills
  Heart, // People & Relationships  
  Lightbulb, // Problem-Solving & Organizing
  Shield, // Care & Comfort
  BookOpen, // Learning & Teaching
  Palette, // Creativity & Expression
  Crown, // Leadership & Motivation
  Eye, // Behind-the-Scenes Support
  Zap, // Physical & Active
  Compass, // Pioneering & Connecting
  
  // Service Board
  MapPin,
  Clock,
  Users2,
  CheckCircle,
  AlertCircle,
  
  // Admin & Management
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  
  // Feedback & Communication
  MessageSquare,
  MessageCircle,
  ThumbsUp,
  Flag,
  Send,
  
  // Status & Actions
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  
  // Data & Analytics
  BarChart3,
  TrendingUp,
  Target,
  PieChart,
} from 'lucide-react'

// Icon configuration for consistency
export const ICON_CONFIG = {
  size: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
  strokeWidth: 1.5, // Consistent stroke width
  className: 'stroke-current', // Inherit color from parent
}

// Giftings icon mapping (matching your Figma categories)
export const GIFTING_ICONS = {
  'hands-on-skills': {
    icon: Wrench,
    color: 'text-brand-primary-600',
    bgColor: 'bg-brand-primary-50',
    borderColor: 'border-brand-primary-200',
    description: 'building, fixing, crafting'
  },
  'people-relationships': {
    icon: Heart,
    color: 'text-brand-warm-600',
    bgColor: 'bg-brand-warm-50',
    borderColor: 'border-brand-warm-200',
    description: 'connecting, encouraging, caring for others'
  },
  'problem-solving-organizing': {
    icon: Lightbulb,
    color: 'text-warning',
    bgColor: 'bg-warning-light',
    borderColor: 'border-warning/20',
    description: 'planning, strategizing, making things work'
  },
  'care-comfort': {
    icon: Shield,
    color: 'text-brand-secondary-600',
    bgColor: 'bg-brand-secondary-50',
    borderColor: 'border-brand-secondary-200',
    description: 'helping others feel better, providing support'
  },
  'learning-teaching': {
    icon: BookOpen,
    color: 'text-brand-primary-600',
    bgColor: 'bg-brand-primary-50',
    borderColor: 'border-brand-primary-200',
    description: 'sharing knowledge, helping others grow'
  },
  'creativity-expression': {
    icon: Palette,
    color: 'text-brand-warm-600',
    bgColor: 'bg-brand-warm-50',
    borderColor: 'border-brand-warm-200',
    description: 'art, music, writing, design'
  },
  'leadership-motivation': {
    icon: Crown,
    color: 'text-warning',
    bgColor: 'bg-warning-light',
    borderColor: 'border-warning/20',
    description: 'guiding others, inspiring action'
  },
  'behind-scenes-support': {
    icon: Eye,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    description: 'making things happen quietly'
  },
  'physical-active': {
    icon: Zap,
    color: 'text-error',
    bgColor: 'bg-error-light',
    borderColor: 'border-error/20',
    description: 'using body and energy to serve'
  },
  'pioneering-connecting': {
    icon: Compass,
    color: 'text-brand-secondary-600',
    bgColor: 'bg-brand-secondary-50',
    borderColor: 'border-brand-secondary-200',
    description: 'starting new things, bringing people together'
  },
}

// Feedback type icons
export const FEEDBACK_ICONS = {
  feature_request: {
    icon: Lightbulb,
    color: 'text-brand-primary-600',
    bgColor: 'bg-brand-primary-50'
  },
  bug_report: {
    icon: AlertTriangle,
    color: 'text-error',
    bgColor: 'bg-error-light'
  },
  improvement: {
    icon: TrendingUp,
    color: 'text-brand-warm-600',
    bgColor: 'bg-brand-warm-50'
  },
  general: {
    icon: MessageCircle,
    color: 'text-brand-secondary-600',
    bgColor: 'bg-brand-secondary-50'
  }
}

// Navigation icons
export const NAV_ICONS: { [key: string]: any } = {
  home: Home,
  'service-board': Calendar,
  profile: Users,
  admin: Settings,
  feedback: MessageSquare,
  notifications: Bell,
  heart: Heart,
  calendar: Calendar,
  crown: Crown,
  'map-pin': MapPin,
  'users': Users2,
}

// Reusable Icon Component
interface IconProps {
  name: keyof typeof NAV_ICONS | any
  size?: keyof typeof ICON_CONFIG.size | number
  className?: string
  strokeWidth?: number
}

export function Icon({ name, size = 'md', className = '', strokeWidth }: IconProps) {
  const IconComponent = typeof name === 'string' ? NAV_ICONS[name] : name
  const iconSize = typeof size === 'string' ? ICON_CONFIG.size[size] : size
  
  if (!IconComponent) return null
  
  return (
    <IconComponent
      size={iconSize}
      strokeWidth={strokeWidth || ICON_CONFIG.strokeWidth}
      className={`${ICON_CONFIG.className} ${className}`}
    />
  )
}

// Gifting Category Component
interface GiftingCategoryProps {
  category: keyof typeof GIFTING_ICONS
  selected?: boolean
  onClick?: () => void
  showDescription?: boolean
}

export function GiftingCategory({ 
  category, 
  selected = false, 
  onClick, 
  showDescription = true 
}: GiftingCategoryProps) {
  const config = GIFTING_ICONS[category]
  if (!config) return null
  
  const { icon: IconComponent, color, bgColor, borderColor, description } = config
  
  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
        ${selected 
          ? 'border-[#20c997] bg-[#20c997]' 
          : 'border-gray-300 hover:border-[#20c997] bg-white'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${selected ? 'bg-white' : 'bg-gray-50'}
        `}>
          <IconComponent 
            size={ICON_CONFIG.size.md}
            strokeWidth={ICON_CONFIG.strokeWidth}
            className={selected ? 'text-[#20c997]' : 'text-[#20c997]'}
          />
        </div>
        
        <div className="flex-1">
          <h3 className={`font-medium text-sm ${selected ? 'text-white' : 'text-gray-900'}`}>
            {category.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' & ')}
          </h3>
          {showDescription && (
            <p className={`text-xs mt-1 ${selected ? 'text-white opacity-90' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Status Badge Component
interface StatusBadgeProps {
  status: 'urgent' | 'soon' | 'flexible' | 'completed' | 'in_progress' | 'planned'
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const configs = {
    urgent: { 
      icon: AlertCircle, 
      color: 'text-error', 
      bgColor: 'bg-error-light',
      label: 'Urgent'
    },
    soon: { 
      icon: Clock, 
      color: 'text-warning', 
      bgColor: 'bg-warning-light',
      label: 'Soon'
    },
    flexible: { 
      icon: Calendar, 
      color: 'text-brand-secondary-600', 
      bgColor: 'bg-brand-secondary-50',
      label: 'Flexible'
    },
    completed: { 
      icon: CheckCircle, 
      color: 'text-brand-secondary-600', 
      bgColor: 'bg-brand-secondary-50',
      label: 'Completed'
    },
    in_progress: { 
      icon: Zap, 
      color: 'text-brand-primary-600', 
      bgColor: 'bg-brand-primary-50',
      label: 'In Progress'
    },
    planned: { 
      icon: Target, 
      color: 'text-gray-600', 
      bgColor: 'bg-gray-100',
      label: 'Planned'
    }
  }
  
  const config = configs[status]
  const iconSize = size === 'sm' ? 14 : 16
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5'
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 ${padding} rounded-full font-medium
      ${config.color} ${config.bgColor} ${textSize}
    `}>
      <config.icon size={iconSize} strokeWidth={1.5} />
      {config.label}
    </span>
  )
}

// Priority Badge Component
interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical'
  showIcon?: boolean
}

export function PriorityBadge({ priority, showIcon = true }: PriorityBadgeProps) {
  const configs = {
    low: { 
      icon: TrendingUp, 
      color: 'text-brand-secondary-600', 
      bgColor: 'bg-brand-secondary-50' 
    },
    medium: { 
      icon: BarChart3, 
      color: 'text-warning', 
      bgColor: 'bg-warning-light' 
    },
    high: { 
      icon: AlertTriangle, 
      color: 'text-brand-warm-600', 
      bgColor: 'bg-brand-warm-50' 
    },
    critical: { 
      icon: AlertCircle, 
      color: 'text-error', 
      bgColor: 'bg-error-light' 
    }
  }
  
  const config = configs[priority]
  
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
      ${config.color} ${config.bgColor}
    `}>
      {showIcon && <config.icon size={12} strokeWidth={1.5} />}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}

// Example usage in components
export const IconExamples = {
  // Navigation
  NavigationIcon: () => <Icon name="home" size="md" />,
  
  // Giftings Selection
  GiftingGrid: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.keys(GIFTING_ICONS).map((category) => (
        <GiftingCategory
          key={category}
          category={category as keyof typeof GIFTING_ICONS}
          selected={category === 'people-relationships'}
        />
      ))}
    </div>
  ),
  
  // Status indicators
  StatusExamples: () => (
    <div className="flex gap-2 flex-wrap">
      <StatusBadge status="urgent" />
      <StatusBadge status="soon" />
      <StatusBadge status="flexible" />
      <PriorityBadge priority="high" />
    </div>
  )
}
