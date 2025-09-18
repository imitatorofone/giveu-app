// components/GiftingComponents.tsx
// Complete React components that use the ENGAGE gifting structure

'use client'

import React from 'react'
import { 
  getTagClasses, 
  getCategoryClasses, 
  getTagDisplayName, 
  getCategoryByTag,
  GIFTING_CATEGORIES,
  getCategoriesArray 
} from '../lib/giftingStructure'

// 1. Individual Gift Tag Component
export function GiftTag({ 
  tag, 
  variant = 'default', 
  showRemove = false, 
  onRemove = () => {}, 
  isMatched = false,
  onClick = () => {} 
}) {
  const displayName = getTagDisplayName(tag)
  const classes = getTagClasses(tag, variant)
  const matchedClasses = isMatched ? 'ring-2 ring-green-500 ring-offset-1' : ''
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
        ${classes} ${matchedClasses}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {displayName}
      {isMatched && <span className="text-green-600">✓</span>}
      {showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tag)
          }}
          className="ml-1 text-current hover:text-red-600 transition-colors"
        >
          ×
        </button>
      )}
    </span>
  )
}

// 2. Category Badge Component
export function CategoryBadge({ 
  categoryId, 
  variant = 'default', 
  showIcon = true, 
  onClick = () => {},
  isActive = false 
}) {
  const category = GIFTING_CATEGORIES[categoryId]
  if (!category) return null
  
  const classes = getCategoryClasses(categoryId, variant)
  const activeClasses = isActive ? 'ring-2 ring-offset-1 ring-current' : ''
  
  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        ${classes} ${activeClasses}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {showIcon && <span>{category.icon}</span>}
      <span>{category.name}</span>
    </div>
  )
}

// 3. User Gifts Display Component
export function UserGiftsDisplay({ userTags = [], matchedTags = [] }: { userTags?: string[], matchedTags?: string[] }) {
  if (!userTags.length) {
    return (
      <div className="text-gray-500 text-sm italic">
        No gifts selected yet
      </div>
    )
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {userTags.map(tag => (
        <GiftTag 
          key={tag} 
          tag={tag} 
          isMatched={matchedTags.includes(tag)}
          variant="border"
        />
      ))}
    </div>
  )
}

// 4. Category Filter Chips Component
export function CategoryFilterChips({ 
  selectedCategories = [], 
  onCategoryToggle = () => {} 
}) {
  const categories = getCategoriesArray()
  
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(category => (
        <CategoryBadge
          key={category.id}
          categoryId={category.id}
          variant="button"
          isActive={selectedCategories.includes(category.id)}
          onClick={() => onCategoryToggle(category.id)}
        />
      ))}
    </div>
  )
}

// 5. Gift Selection Component (for surveys/profiles)
export function GiftSelectionGrid({ 
  selectedTags = [], 
  onTagToggle = () => {},
  maxSelections = null,
  groupByCategory = true 
}) {
  const categories = getCategoriesArray()
  
  if (!groupByCategory) {
    // Simple grid of all tags
    const allTags = categories.flatMap(cat => cat.tags)
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {allTags.map(tag => {
          const isSelected = selectedTags.includes(tag)
          const isDisabled = maxSelections && 
            selectedTags.length >= maxSelections && 
            !isSelected
            
          return (
            <button
              key={tag}
              onClick={() => !isDisabled && onTagToggle(tag)}
              disabled={isDisabled}
              className={`
                p-3 rounded-lg text-sm font-medium transition-all
                ${getTagClasses(tag, 'button')}
                ${isSelected ? 'ring-2 ring-offset-1 ring-current' : ''}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {getTagDisplayName(tag)}
            </button>
          )
        })}
      </div>
    )
  }
  
  // Grouped by category
  return (
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category.id} className="space-y-3">
          <CategoryBadge 
            categoryId={category.id} 
            showIcon={true}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-4">
            {category.tags.map(tag => {
              const isSelected = selectedTags.includes(tag)
              const isDisabled = maxSelections && 
                selectedTags.length >= maxSelections && 
                !isSelected
                
              return (
                <button
                  key={tag}
                  onClick={() => !isDisabled && onTagToggle(tag)}
                  disabled={isDisabled}
                  className={`
                    p-2 rounded-lg text-sm font-medium transition-all text-left
                    ${getTagClasses(tag, 'button')}
                    ${isSelected ? 'ring-2 ring-offset-1 ring-current' : ''}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {getTagDisplayName(tag)}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// 6. Opportunity Card with Matching Gifts
export function OpportunityCard({ 
  opportunity, 
  userTags = [], 
  onRespond = () => {} 
}) {
  const matchedTags = opportunity.required_tags?.filter(tag => 
    userTags.includes(tag)
  ) || []
  
  const hasMatches = matchedTags.length > 0
  
  return (
    <div className={`
      bg-white rounded-lg border p-6 transition-all
      ${hasMatches ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}
    `}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {opportunity.title}
        </h3>
        {opportunity.is_urgent && (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
            URGENT
          </span>
        )}
      </div>
      
      {/* Description */}
      <p className="text-gray-600 mb-4 line-clamp-2">
        {opportunity.description}
      </p>
      
      {/* Required Gifts */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">Gifts needed:</p>
        <div className="flex flex-wrap gap-1">
          {opportunity.required_tags?.map(tag => (
            <GiftTag 
              key={tag} 
              tag={tag} 
              isMatched={matchedTags.includes(tag)}
              variant="border"
            />
          ))}
        </div>
      </div>
      
      {/* Match Indicator */}
      {hasMatches && (
        <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-green-800 text-sm font-medium">
            ✓ This opportunity matches {matchedTags.length} of your gifts!
          </p>
        </div>
      )}
      
      {/* Action Button */}
      <button
        onClick={() => onRespond(opportunity.id)}
        className={`
          w-full py-2 px-4 rounded-lg font-medium transition-all
          ${hasMatches 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
      >
        ✓ I Can Help
      </button>
    </div>
  )
}

// 7. Skill Level Selector Component
export function SkillLevelSelector({ 
  tag, 
  currentLevel = 'beginner', 
  onLevelChange = () => {} 
}) {
  const levels = [
    { id: 'beginner', name: 'Beginner', desc: 'Willing to learn' },
    { id: 'experienced', name: 'Experienced', desc: 'Can work independently' },
    { id: 'can-lead', name: 'Can Lead', desc: 'Can teach others' }
  ]
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Skill level for {getTagDisplayName(tag)}:
      </label>
      <div className="grid grid-cols-3 gap-2">
        {levels.map(level => (
          <button
            key={level.id}
            onClick={() => onLevelChange(tag, level.id)}
            className={`
              p-2 rounded-lg text-xs transition-all border-2
              ${currentLevel === level.id 
                ? 'border-blue-500 bg-blue-50 text-blue-800' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="font-medium">{level.name}</div>
            <div className="text-gray-500">{level.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// 8. Complete Gift Profile Component
export function GiftProfileCard({ user, isEditable = false, onUpdate = () => {} }) {
  const userTags = user?.user_tags || []
  const skillLevels = user?.skill_levels || {}
  
  // Group tags by category for display
  const tagsByCategory = {}
  userTags.forEach(tag => {
    const category = getCategoryByTag(tag)
    if (category) {
      if (!tagsByCategory[category.id]) {
        tagsByCategory[category.id] = []
      }
      tagsByCategory[category.id].push(tag)
    }
  })
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Gifts</h3>
        {isEditable && (
          <button 
            onClick={() => onUpdate()}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit Gifts
          </button>
        )}
      </div>
      
      {Object.keys(tagsByCategory).length === 0 ? (
        <p className="text-gray-500 italic">No gifts selected yet</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(tagsByCategory).map(([categoryId, tags]) => {
            const category = GIFTING_CATEGORIES[categoryId]
            return (
              <div key={categoryId} className="space-y-2">
                <CategoryBadge categoryId={categoryId} showIcon={true} />
                <div className="pl-4 space-y-1">
                  {tags.map(tag => {
                    const level = skillLevels[tag] || 'beginner'
                    return (
                      <div key={tag} className="flex items-center justify-between">
                        <GiftTag tag={tag} variant="border" />
                        <span className="text-xs text-gray-500 capitalize">
                          {level.replace('-', ' ')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// 9. Notification Component for Gift Matches
export function GiftMatchNotification({ 
  opportunity, 
  matchedTags, 
  onRespond = () => {},
  onDismiss = () => {} 
}) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-green-600 text-xl">✨</span>
        </div>
        <div className="flex-1">
          <h4 className="text-green-800 font-medium">
            Your gifts are needed!
          </h4>
          <p className="text-green-700 text-sm mt-1">
            "{opportunity.title}" needs someone with your {' '}
            {matchedTags.map(tag => getTagDisplayName(tag)).join(', ')} skills.
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => onRespond('yes')}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700"
            >
              Yes, I can help
            </button>
            <button
              onClick={() => onRespond('no')}
              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm font-medium hover:bg-gray-400"
            >
              Not available
            </button>
            <button
              onClick={onDismiss}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 10. Simple Survey Component (for onboarding)
export function GiftingSurvey({ onComplete = () => {} }) {
  const [selectedTags, setSelectedTags] = React.useState([])
  const [skillLevels, setSkillLevels] = React.useState({})
  const [step, setStep] = React.useState(1)
  
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag))
      // Remove skill level when tag is deselected
      const newSkillLevels = { ...skillLevels }
      delete newSkillLevels[tag]
      setSkillLevels(newSkillLevels)
    } else if (selectedTags.length < 4) {
      setSelectedTags(prev => [...prev, tag])
      // Set default skill level
      setSkillLevels(prev => ({ ...prev, [tag]: 'beginner' }))
    }
  }
  
  const updateSkillLevel = (tag, level) => {
    setSkillLevels(prev => ({ ...prev, [tag]: level }))
  }
  
  const handleComplete = () => {
    onComplete({
      selectedTags,
      skillLevels
    })
  }
  
  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Select Your Gifts
          </h2>
          <p className="text-gray-600">
            Choose up to 4 ways you'd like to serve in our church community
          </p>
          <p className="text-sm text-gray-500">
            Selected: {selectedTags.length}/4
          </p>
        </div>
        
        <GiftSelectionGrid
          selectedTags={selectedTags}
          onTagToggle={toggleTag}
          maxSelections={4}
          groupByCategory={true}
        />
        
        {selectedTags.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => setStep(2)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Next: Set Skill Levels
            </button>
          </div>
        )}
      </div>
    )
  }
  
  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Set Your Skill Levels
          </h2>
          <p className="text-gray-600">
            Help us match you with the right opportunities
          </p>
        </div>
        
        <div className="space-y-6">
          {selectedTags.map(tag => (
            <SkillLevelSelector
              key={tag}
              tag={tag}
              currentLevel={skillLevels[tag] || 'beginner'}
              onLevelChange={updateSkillLevel}
            />
          ))}
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setStep(1)}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400"
          >
            Back
          </button>
          <button
            onClick={handleComplete}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
          >
            Complete Setup
          </button>
        </div>
      </div>
    )
  }
}

// 11. Usage Demo Component (for testing)
export function GiftingSystemDemo() {
  const [selectedTags, setSelectedTags] = React.useState(['cooking', 'music'])
  const [selectedCategories, setSelectedCategories] = React.useState(['hands-on-skills'])
  
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }
  
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-bold">ENGAGE Gifting System Demo</h2>
      
      {/* User Gifts Display */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Your Current Gifts</h3>
        <UserGiftsDisplay userTags={selectedTags} matchedTags={['cooking']} />
      </section>
      
      {/* Category Filters */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Filter by Category</h3>
        <CategoryFilterChips 
          selectedCategories={selectedCategories}
          onCategoryToggle={toggleCategory}
        />
      </section>
      
      {/* Gift Selection */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Select Your Gifts (max 4)</h3>
        <GiftSelectionGrid
          selectedTags={selectedTags}
          onTagToggle={toggleTag}
          maxSelections={4}
          groupByCategory={true}
        />
      </section>
    </div>
  )
}
