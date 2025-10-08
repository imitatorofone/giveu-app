# Knock Email Template Branding Updates

## Overview
The app has been rebranded from "Engage" to "giveU". All email templates in Knock need to be updated to reflect this new branding.

## Required Changes in Knock Dashboard

### 1. Workflow Templates
Update the following workflow templates in the Knock dashboard:

#### `volunteer.signed_up`
- **Subject Line**: Update from "New volunteer signed up for [need_title]" to "New volunteer signed up for [need_title] - giveU"
- **Body**: Replace all instances of "Engage" with "giveU"
- **Footer**: Update app name to "giveU"

#### `need_submitted`
- **Subject Line**: Update from "New need submitted: [need_title]" to "New need submitted: [need_title] - giveU"
- **Body**: Replace all instances of "Engage" with "giveU"
- **Footer**: Update app name to "giveU"

#### `need_matches_gifting`
- **Subject Line**: Update from "New opportunity matches your gifts!" to "New opportunity matches your gifts! - giveU"
- **Body**: Replace all instances of "Engage" with "giveU"
- **Footer**: Update app name to "giveU"

#### `need_approved`
- **Subject Line**: Update from "Your need was approved!" to "Your need was approved! - giveU"
- **Body**: Replace all instances of "Engage" with "giveU"
- **Footer**: Update app name to "giveU"

#### `need_fulfilled`
- **Subject Line**: Update from "Your need has enough volunteers!" to "Your need has enough volunteers! - giveU"
- **Body**: Replace all instances of "Engage" with "giveU"
- **Footer**: Update app name to "giveU"

#### `member_join_request`
- **Subject Line**: Update from "New member wants to join" to "New member wants to join - giveU"
- **Body**: Replace all instances of "Engage" with "giveU"
- **Footer**: Update app name to "giveU"

### 2. Brand Colors
Update email templates to use the new brand colors:
- **Primary Green**: `#20c997`
- **Primary Hover**: `#1ba87f`
- **Text**: `#1e293b`
- **Light Text**: `#64748b`
- **Background**: `#f9fafb`

### 3. Logo Updates
- Replace any "Engage" logo references with "giveU" logo
- Update logo alt text to "giveU - Where your gifts meet needs"
- Ensure logo is properly sized and positioned

### 4. Footer Updates
Update email footers to include:
```
giveU - Where your gifts meet needs
Connect with your church community and serve with purpose
```

### 5. Deep Links
Ensure all email deep links still work correctly:
- Dashboard links: `https://yourapp.com/dashboard?needId={{need_id}}`
- Profile links: `https://yourapp.com/profile`
- Commitments links: `https://yourapp.com/commitments`

## Implementation Steps

1. **Access Knock Dashboard**: Log into the Knock dashboard
2. **Navigate to Templates**: Go to the email template section
3. **Update Each Workflow**: Edit each workflow template listed above
4. **Test Templates**: Send test emails to verify changes
5. **Update Branding Settings**: Update any global branding settings
6. **Verify Deep Links**: Test that all deep links work correctly

## Notes

- All email templates should maintain the same functionality
- Only branding elements (name, colors, logo) need to be updated
- Deep link functionality should remain unchanged
- Email content and structure should remain the same
- Test thoroughly before deploying to production

## Priority

**HIGH** - These changes affect all email communications and should be updated immediately to maintain brand consistency across all touchpoints.
