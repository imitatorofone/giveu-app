import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findMatches, getEffectiveTimePreference, type MemberProfile, type NeedDetails } from '../../../../../lib/matchingUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await request.json();
    const { id: needId } = await params;

    // 1. Get the need details
    const { data: need, error: needError } = await supabase
      .from('needs')
      .select('*')
      .eq('id', needId)
      .eq('org_id', orgId)
      .single();
    
    if (needError || !need) {
      return NextResponse.json({ error: 'Need not found' }, { status: 404 });
    }
    
    // 2. Update need status to approved
    const { error: updateError } = await supabase
      .from('needs')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', needId);
    
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update need' }, { status: 500 });
    }
    
    // 3. Find matching users based on gift tags and availability
    const { data: matchedUsers, error: matchError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        gift_selections,
        availability_level
      `)
      .not('gift_selections', 'is', null)
      .not('gift_selections', 'eq', '[]')
      .not('availability_level', 'is', null)
      .not('availability_level', 'eq', '[]');
    
    if (matchError) {
      return NextResponse.json({ error: 'Failed to find matches' }, { status: 500 });
    }
    
    // 4. Use utility function to find and rank matches
    const needDetails: NeedDetails = {
      id: need.id,
      title: need.title,
      description: need.description,
      tags: need.tags || [],
      time_preference: need.time_preference || 'Anytime',
      urgency: need.urgency,
      date_time: need.date_time,
      is_ongoing: need.is_ongoing || false,
      ongoing_schedule: need.ongoing_schedule || null,
      ongoing_start_date: need.ongoing_start_date || null,
      ongoing_start_time: need.ongoing_start_time || null
    };
    
    const memberProfiles: MemberProfile[] = matchedUsers.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      gift_selections: user.gift_selections,
      availability_level: user.availability_level
    }));
    
    const rankedMatches = findMatches(memberProfiles, needDetails, 10);
    
    // 5. Create notifications for matched users
    const notifications = rankedMatches.map(match => ({
      org_id: orgId,
      user_id: match.member.id,
      type: 'need_match',
      title: 'New serving opportunity!',
      message: `There's a new "${need.title}" opportunity that matches your gifts and availability.`,
      payload: {
        need_id: needId,
        need_title: need.title,
        need_description: need.description,
        match_tags: match.matchingGifts.join(', '),
        time_preference: need.time_preference,
        availability_score: match.availabilityScore,
        urgency: need.urgency || 'normal'
      },
      created_at: new Date().toISOString()
    }));
    
    // 6. Insert notifications (if we have a notifications table)
    // For now, we'll just return the matches
    // In a full implementation, you'd insert these into a notifications table
    
    const effectiveTimePreference = getEffectiveTimePreference(needDetails);
    
    return NextResponse.json({
      success: true,
      matchCount: rankedMatches.length,
      needTitle: need.title,
      needTimePreference: effectiveTimePreference,
      needUrgency: need.urgency,
      matches: rankedMatches.map(match => ({
        id: match.member.id,
        name: match.member.full_name,
        email: match.member.email,
        matchingGifts: match.matchingGifts,
        giftOverlapScore: match.giftOverlapScore,
        availabilityScore: match.availabilityScore,
        totalScore: match.totalScore,
        availabilityMatch: match.availabilityMatch
      }))
    });
    
  } catch (error) {
    console.error('Error in matching system:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
