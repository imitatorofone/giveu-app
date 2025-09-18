/**
 * Utility functions for matching needs with members based on gifts and availability
 */

export interface MemberProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  gift_selections: string[] | null;
  availability_level: string | null;
}

export interface NeedDetails {
  id: string;
  title: string;
  description: string;
  tags: string[];
  time_preference: string;
  urgency?: string;
  date_time?: string; // For specific date/time needs
  is_ongoing?: boolean;
  ongoing_schedule?: string; // weekly, monthly, quarterly
  ongoing_start_date?: string;
  ongoing_start_time?: string;
}

export interface MatchResult {
  member: MemberProfile;
  giftOverlapScore: number;
  availabilityScore: number;
  totalScore: number;
  matchingGifts: string[];
  availabilityMatch: boolean;
}

/**
 * Automatically detect time preference from a specific date/time string
 */
export function detectTimePreferenceFromDateTime(dateTimeString: string): string {
  try {
    const date = new Date(dateTimeString);
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Mornings';
    } else if (hour >= 12 && hour < 17) {
      return 'Afternoons';
    } else {
      return 'Nights';
    }
  } catch (error) {
    console.error('Error parsing date/time:', error);
    return 'Anytime';
  }
}

/**
 * Automatically detect time preference from ongoing schedule
 */
export function detectTimePreferenceFromOngoing(startTime: string): string {
  try {
    // Parse time in HH:MM format
    const [hours, minutes] = startTime.split(':').map(Number);
    
    if (hours >= 5 && hours < 12) {
      return 'Mornings';
    } else if (hours >= 12 && hours < 17) {
      return 'Afternoons';
    } else {
      return 'Nights';
    }
  } catch (error) {
    console.error('Error parsing ongoing time:', error);
    return 'Anytime';
  }
}

/**
 * Get the effective time preference for a need
 */
export function getEffectiveTimePreference(need: NeedDetails): string {
  // For "Needs Help Soon" - use the manually selected time preference
  if (need.urgency === 'asap') {
    return need.time_preference;
  }
  
  // For specific date/time - auto-detect from the datetime
  if (need.date_time) {
    return detectTimePreferenceFromDateTime(need.date_time);
  }
  
  // For ongoing needs - auto-detect from start time
  if (need.is_ongoing && need.ongoing_start_time) {
    return detectTimePreferenceFromOngoing(need.ongoing_start_time);
  }
  
  // For ongoing needs stored in description (fallback for existing data)
  if (need.description && need.description.includes('Ongoing Schedule:')) {
    const timeMatch = need.description.match(/at (\d{1,2}:\d{2})/);
    if (timeMatch) {
      return detectTimePreferenceFromOngoing(timeMatch[1]);
    }
  }
  
  // Fallback to manual preference
  return need.time_preference || 'Anytime';
}

/**
 * Calculate availability match score between a member and a need
 */
export function calculateAvailabilityScore(
  memberAvailability: string[], 
  needTimePreference: string
): number {
  if (memberAvailability.includes(needTimePreference)) {
    return 3; // Perfect match
  } else if (memberAvailability.includes('Anytime')) {
    return 2; // User is flexible
  } else if (needTimePreference === 'Anytime') {
    return 1; // Need is flexible, user has specific times
  }
  return 0; // No match
}

/**
 * Check if there's any availability match between member and need
 */
export function hasAvailabilityMatch(
  memberAvailability: string[], 
  needTimePreference: string
): boolean {
  return memberAvailability.includes(needTimePreference) || 
         memberAvailability.includes('Anytime') || 
         needTimePreference === 'Anytime';
}

/**
 * Calculate gift overlap between member gifts and need tags
 */
export function calculateGiftOverlap(
  memberGifts: string[], 
  needTags: string[]
): { overlap: number; matchingGifts: string[] } {
  const matchingGifts = memberGifts.filter(gift => 
    needTags.some(tag => 
      gift.toLowerCase().includes(tag.toLowerCase()) || 
      tag.toLowerCase().includes(gift.toLowerCase())
    )
  );
  
  return {
    overlap: matchingGifts.length,
    matchingGifts
  };
}

/**
 * Find and rank matches for a need based on gifts and availability
 */
export function findMatches(
  members: MemberProfile[], 
  need: NeedDetails,
  maxResults: number = 10
): MatchResult[] {
  const needTags = need.tags || [];
  const effectiveTimePreference = getEffectiveTimePreference(need);
  
  return members
    .map(member => {
      const memberGifts = member.gift_selections || [];
      const memberAvailability = member.availability_level ? 
        JSON.parse(member.availability_level) : [];
      
      // Calculate scores
      const { overlap: giftOverlap, matchingGifts } = calculateGiftOverlap(memberGifts, needTags);
      const availabilityScore = calculateAvailabilityScore(memberAvailability, effectiveTimePreference);
      const availabilityMatch = hasAvailabilityMatch(memberAvailability, effectiveTimePreference);
      
      // Combined score (gifts weighted more heavily)
      const totalScore = (giftOverlap * 2) + availabilityScore;
      
      return {
        member,
        giftOverlapScore: giftOverlap,
        availabilityScore,
        totalScore,
        matchingGifts,
        availabilityMatch
      };
    })
    .filter(match => match.giftOverlapScore > 0 && match.availabilityMatch)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, maxResults);
}

/**
 * Get time preference display text
 */
export function getTimePreferenceDisplay(timePreference: string): string {
  const timeMap: Record<string, string> = {
    'Mornings': '🌅 Mornings',
    'Afternoons': '☀️ Afternoons', 
    'Nights': '🌙 Nights',
    'Anytime': '🕐 Anytime'
  };
  
  return timeMap[timePreference] || timePreference;
}

/**
 * Get availability match quality description
 */
export function getAvailabilityMatchDescription(score: number): string {
  switch (score) {
    case 3: return 'Perfect time match';
    case 2: return 'Flexible availability';
    case 1: return 'Compatible timing';
    default: return 'No time match';
  }
}
