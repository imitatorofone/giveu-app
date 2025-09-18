# Engage App Icon Style Guide

## 🎯 Design Principles

- **Consistency**: All icons use the same stroke width (1.5px) and visual weight
- **Professional**: Clean, outline-style icons that feel modern and trustworthy
- **Accessible**: Proper color contrast and sizing for all users
- **Semantic**: Icons that clearly represent their function or category

## 📐 Technical Specifications

### Sizes

- **sm**: 16px (for inline text, small buttons)
- **md**: 20px (default navigation, cards)
- **lg**: 24px (headers, primary actions)
- **xl**: 32px (hero sections, empty states)

### Stroke Width

- **Standard**: 1.5px for all icons
- **Consistency**: Never mix different stroke widths in the same interface

### Colors

Icons inherit color from their parent container using `stroke-current` class.

## 🎨 Color System for Categories

### Giftings Categories

```typescript
'hands-on-skills': 'text-blue-600 bg-blue-50 border-blue-200'
'people-relationships': 'text-pink-600 bg-pink-50 border-pink-200'
'problem-solving-organizing': 'text-amber-600 bg-amber-50 border-amber-200'
'care-comfort': 'text-green-600 bg-green-50 border-green-200'
'learning-teaching': 'text-indigo-600 bg-indigo-50 border-indigo-200'
'creativity-expression': 'text-purple-600 bg-purple-50 border-purple-200'
'leadership-motivation': 'text-orange-600 bg-orange-50 border-orange-200'
'behind-scenes-support': 'text-teal-600 bg-teal-50 border-teal-200'
'physical-active': 'text-red-600 bg-red-50 border-red-200'
'pioneering-connecting': 'text-cyan-600 bg-cyan-50 border-cyan-200'
```

### Status Colors

```typescript
urgent: 'text-red-700 bg-red-100'
soon: 'text-orange-700 bg-orange-100'
flexible: 'text-green-700 bg-green-100'
completed: 'text-green-700 bg-green-100'
in_progress: 'text-blue-700 bg-blue-100'
planned: 'text-purple-700 bg-purple-100'
```

## 🔧 Implementation Guidelines

### DO ✅

- Use the centralized `Icon` component for all icons
- Use semantic icon names that describe function
- Maintain consistent sizing within interface sections
- Use color to convey meaning (status, categories)
- Group related icons with consistent styling

### DON'T ❌

- Mix different icon libraries (stick to Lucide)
- Use different stroke weights
- Use emojis for functional elements
- Make icons too small (minimum 16px)
- Use color alone to convey information (include labels)

## 📱 Responsive Considerations

### Mobile (< 768px)

- Use **md (20px)** icons in navigation
- **sm (16px)** for secondary actions
- Increase touch targets around clickable icons

### Desktop (≥ 768px)

- Use **lg (24px)** for primary actions and headers
- **md (20px)** for navigation and card elements
- **sm (16px)** for inline text and secondary elements

## 🚀 Quick Implementation Steps

### 1. Install Dependencies

```bash
npm install lucide-react
```

### 2. Set up the Icon System

Create `/icons/index.ts` with the provided icon system code.

### 3. Replace Existing Icons

Search your codebase for:

- Emoji usage (🎯, 💡, ❤️, etc.)
- Inconsistent icon libraries
- Hardcoded SVGs

Replace with:

```typescript
import { Icon, GiftingCategory, StatusBadge } from '@/icons'

// Instead of 🎯
<Icon name="target" size="md" className="text-blue-600" />

// Instead of mixed styling
<GiftingCategory category="people-relationships" selected={true} />
```

### 4. Update Component Patterns

#### Navigation Items

```typescript
const navItems = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'service-board', label: 'Service Board', icon: 'service-board' },
  // etc.
]

return navItems.map(item => (
  <NavItem key={item.id}>
    <Icon name={item.icon} size="md" />
    {item.label}
  </NavItem>
))
```

#### Status Indicators

```typescript
// Instead of text-only status
<StatusBadge status={need.urgency} size="sm" />

// Instead of emoji priorities  
<PriorityBadge priority="high" showIcon={true} />
```

#### Cards & Lists

```typescript
<div className="flex items-center gap-3">
  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
    <Icon name="calendar" size="md" className="text-blue-600" />
  </div>
  <div>
    <h3>Event Title</h3>
    <p>Event details</p>
  </div>
</div>
```

## 🎯 Specific Replacements for Your App

### Replace These Emojis:

```typescript
// Current → New
'🔧' → <Icon name="wrench" className="text-blue-600" />
'❤️' → <Icon name="heart" className="text-pink-600" />
'💡' → <Icon name="lightbulb" className="text-amber-600" />
'🛡️' → <Icon name="shield" className="text-green-600" />
'📚' → <Icon name="book-open" className="text-indigo-600" />
'🎨' → <Icon name="palette" className="text-purple-600" />
'👑' → <Icon name="crown" className="text-orange-600" />
'👁️' → <Icon name="eye" className="text-teal-600" />
'⚡' → <Icon name="zap" className="text-red-600" />
'🧭' → <Icon name="compass" className="text-cyan-600" />
```

### Update Form Elements:

```typescript
// Feedback types
<div className="grid grid-cols-2 gap-3">
  {Object.entries(FEEDBACK_ICONS).map(([type, config]) => (
    <FeedbackTypeButton 
      key={type}
      type={type}
      icon={config.icon}
      selected={selectedType === type}
    />
  ))}
</div>
```

### Enhance Buttons:

```typescript
// Primary actions
<button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
  <Icon name="plus" size="sm" />
  Create Need
</button>

// Secondary actions  
<button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
  <Icon name="edit" size="sm" />
  Edit
</button>
```

## 📊 Before & After Examples

### Before (Inconsistent)

```typescript
// Mixed emoji and text
<span>🔧 Hands-On Skills</span>
<span>Status: Urgent</span>
<button>+ Add</button>
```

### After (Consistent)

```typescript
// Unified icon system
<GiftingCategory category="hands-on-skills" selected={true} />
<StatusBadge status="urgent" size="sm" />
<button className="flex items-center gap-2">
  <Icon name="plus" size="sm" />
  Add Need
</button>
```

## 🔍 Testing Checklist

### Visual Consistency

- [ ] All icons use 1.5px stroke width
- [ ] Icon sizes are consistent within sections
- [ ] Colors follow the defined system
- [ ] No emojis in functional elements

### Accessibility

- [ ] Icons have proper contrast ratios
- [ ] Interactive icons have adequate touch targets (44px minimum)
- [ ] Icons are accompanied by text labels
- [ ] Screen readers can understand icon meanings

### Performance

- [ ] Icons are tree-shaken (only imported icons are bundled)
- [ ] No duplicate icon imports
- [ ] SVG icons load quickly

## 🎨 Advanced Customization

### Custom Icon Variants

```typescript
// Create variations for special cases
export function NavigationIcon({ name, active = false }: {
  name: keyof typeof NAV_ICONS
  active?: boolean
}) {
  return (
    <Icon 
      name={name} 
      size="md"
      className={active ? 'text-blue-600' : 'text-gray-600'}
    />
  )
}
```

### Icon with Badge

```typescript
export function IconWithBadge({ 
  icon, 
  count, 
  size = 'md' 
}: {
  icon: any
  count?: number
  size?: string
}) {
  return (
    <div className="relative">
      <Icon name={icon} size={size} />
      {count && count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  )
}
```

### Animated Icons

```typescript
export function LoadingIcon() {
  return (
    <Icon 
      name="loader" 
      size="md" 
      className="animate-spin text-blue-600" 
    />
  )
}
```

## 📚 Component Reference

### Core Components

- **`Icon`**: Base icon component with size and styling props
- **`GiftingCategory`**: Pre-styled spiritual gift category selector
- **`StatusBadge`**: Status indicator with icon and color coding
- **`PriorityBadge`**: Priority level indicator for admin features

### Icon Mappings

- **`GIFTING_ICONS`**: All 10 spiritual gift categories with colors
- **`FEEDBACK_ICONS`**: Feedback type icons and styling
- **`NAV_ICONS`**: Navigation icon mappings

### Configuration

- **`ICON_CONFIG`**: Standard sizes, stroke width, and base classes
- **Color system**: Consistent color palette for all categories and statuses

---

*This style guide ensures your Engage app maintains visual consistency and professional appearance across all interfaces.*
