// Test script to verify profiles table access
// Run this in browser console on the profile page

async function testProfilesAccess() {
  console.log('🧪 Testing profiles table access...');
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 Session:', session);
    
    if (!session?.user) {
      console.error('❌ No session found');
      return;
    }
    
    // Test SELECT (should work)
    console.log('📖 Testing SELECT...');
    const { data: selectData, error: selectError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', session.user.id)
      .maybeSingle();
    
    console.log('SELECT result:', { selectData, selectError });
    
    // Test INSERT (this was failing)
    console.log('➕ Testing INSERT...');
    const testProfile = {
      id: session.user.id,
      full_name: session.user.email?.split('@')[0] || 'Test User',
      email: session.user.email,
      city: 'Test City',
      phone: '+1234567890',
      age: '25',
      availability: ['morning'],
      gift_selections: ['test'],
      is_leader: false,
      church_code: 'TEST',
      role: 'member',
      approval_status: 'approved',
      notification_preferences: {
        volunteer_signed_up: true,
        need_submitted: true,
        need_matches_gifting: true,
        need_approved: true,
        need_fulfilled: true,
        member_join_request: true
      }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .upsert(testProfile)
      .select();
    
    console.log('INSERT result:', { insertData, insertError });
    
    if (insertError) {
      console.error('❌ INSERT failed:', insertError);
    } else {
      console.log('✅ INSERT successful!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testProfilesAccess();
