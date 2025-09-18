// app/test-basic/page.tsx
import { GiftTag, CategoryBadge } from '../../components/GiftingComponents'
import { getTagDisplayName } from '../../lib/giftingStructure'

export default function TestPage() {
  return (
    <div className="p-6">
      <h2>Gifting System Test</h2>
      
      {/* Test 1: Gift Tags */}
      <div className="mb-4">
        <h3>Gift Tags:</h3>
        <GiftTag tag="cooking" variant="border" />
        <GiftTag tag="music" isMatched={true} />
        <GiftTag tag="mentoring" variant="button" />
      </div>
      
      {/* Test 2: Category Badges */}
      <div className="mb-4">
        <h3>Category Badges:</h3>
        <CategoryBadge categoryId="hands-on-skills" showIcon={true} />
        <CategoryBadge categoryId="people-relationships" showIcon={true} />
      </div>
      
      {/* Test 3: Utility Function */}
      <div>
        <h3>Utility Test:</h3>
        <p>Cooking displays as: {getTagDisplayName('cooking')}</p>
      </div>
    </div>
  )
}
