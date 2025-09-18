// lib/giftingSystem.js
import { supabase } from './supabaseClient' // Adjust path to your supabase client

// Enhanced matching function with city-based location matching
export async function findMatchedUsers(
  requiredTags, 
  opportunityLocation = null, // { city: "Minneapolis" }
  requiredAvailability = [], // ['mornings', 'afternoons', 'nights', 'anytime']
  maxDistance = 25 // Not used for city matching, but kept for future
) {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, giftings, availability, city')
      .not('giftings', 'is', null)
      
    if (error) throw error

    const matchedUsers = profiles.filter(profile => {
      // 1. Check gift matching
      const userTags = profile.giftings 
        ? Object.values(profile.giftings).flat().filter(tag => typeof tag === 'string')
        : []
      
      const hasMatchingGifts = requiredTags.some(requiredTag => 
        userTags.includes(requiredTag)
      )
      
      if (!hasMatchingGifts) return false

      // 2. Check availability matching 
      if (requiredAvailability.length > 0 && profile.availability) {
        const userAvailability = Array.isArray(profile.availability) 
          ? profile.availability 
          : []
        
        // If user selected "anytime", they match any requirement
        if (userAvailability.includes('anytime')) {
          return true // Continue to location check
        }
        
        // If opportunity is "anytime", any user availability works
        if (requiredAvailability.includes('anytime')) {
          return true // Continue to location check
        }
        
        // Check for specific time matches
        const hasMatchingAvailability = requiredAvailability.some(timeSlot =>
          userAvailability.includes(timeSlot)
        )
        
        if (!hasMatchingAvailability) return false
      }

      // 3. Check city matching (simple same-city check)
      if (opportunityLocation && opportunityLocation.city && profile.city) {
        const userCity = profile.city.toLowerCase().trim()
        const opportunityCity = opportunityLocation.city.toLowerCase().trim()
        
        // Exact city match required for now
        if (userCity !== opportunityCity) {
          return false
        }
      }

      return true
    })

    return matchedUsers

  } catch (error) {
    console.error('Error finding matched users:', error)
    return []
  }
}

// 2. Get matching score for a user and opportunity
export function calculateMatchScore(userTags, requiredTags) {
  if (!userTags.length || !requiredTags.length) return 0
  
  const matches = requiredTags.filter(tag => userTags.includes(tag))
  return (matches.length / requiredTags.length) * 100 // Return percentage
}

// 3. Convert user giftings to flat array (helper function)
export function getUserTagsFromProfile(profile) {
  if (!profile.giftings) return []
  
  return Object.values(profile.giftings)
    .flat()
    .filter(tag => typeof tag === 'string')
}

// 4. Test function to verify matching works
export async function testMatching() {
  console.log('Testing gift matching system...')
  
  // Test with sample data
  const testRequiredTags = ['cooking', 'setup-tear-down']
  const matchedUsers = await findMatchedUsers(testRequiredTags)
  
  console.log(`Found ${matchedUsers.length} users matching tags:`, testRequiredTags)
  matchedUsers.forEach(user => {
    const userTags = getUserTagsFromProfile(user)
    const score = calculateMatchScore(userTags, testRequiredTags)
    console.log(`- ${user.full_name}: ${score}% match (${userTags.join(', ')})`)
  })
  
  return matchedUsers
}

// Updated test function for city-based matching
export async function testCityMatching() {
  console.log('Testing city-based matching system...')
  
  const testOpportunity = {
    requiredTags: ['cooking', 'mentoring'], // Use tags you actually have
    location: { city: "Minneapolis" }, // Use your actual city
    availability: ['afternoons']
  }
  
  const matchedUsers = await findMatchedUsers(
    testOpportunity.requiredTags,
    testOpportunity.location,
    testOpportunity.availability
  )
  
  console.log(`Found ${matchedUsers.length} users in ${testOpportunity.location.city} for afternoon ${testOpportunity.requiredTags.join(' or ')} help:`)
  matchedUsers.forEach(user => {
    const userTags = getUserTagsFromProfile(user)
    console.log(`- ${user.full_name} (${user.city}): ${userTags.join(', ')} | Available: ${user.availability?.join(', ')}`)
  })
  
  return matchedUsers
}
