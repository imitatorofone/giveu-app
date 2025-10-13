/**
 * Formats phone numbers to E.164 format for Twilio SMS compatibility
 * E.164 format: +[country code][number] (e.g., +15551234567)
 */

export function formatPhoneToE164(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it's 10 digits (US number without country code), add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it's 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it already starts with +, return as is (but clean up)
  if (phone.startsWith('+')) {
    return `+${digits}`;
  }
  
  // Default: assume US number (add +1 if less than 10 digits)
  if (digits.length < 10) {
    return ''; // Invalid number
  }
  
  return `+1${digits}`;
}

/**
 * Formats phone number for display (human-readable format)
 * E.164 format: +15551234567 → (555) 123-4567
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it's 11 digits starting with 1, remove the 1
  if (digits.length === 11 && digits.startsWith('1')) {
    const withoutCountryCode = digits.slice(1);
    return `(${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
  }
  
  // If it's 10 digits, format normally
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Return as-is if can't format
  return phone;
}
