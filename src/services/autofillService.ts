import { UserProfile } from '../types';
import { detectJobApplicationForm, detectJobBoardSite, jobBoardPatterns, getCurrentJobBoardPattern } from './jobFormService';

/**
 * Autofills a job application form with user profile data
 * @param profile User profile data
 * @returns Whether any fields were filled
 */
export function autofillForm(profile: UserProfile): boolean {
  const jobForm = detectJobApplicationForm();
  if (!jobForm) {
    console.log('No job form found for autofill');
    return false;
  }
  
  let filledAny = false;
  
  // Check if we're on a known job board
  const currentSite = detectJobBoardSite();
  const pattern = getCurrentJobBoardPattern();
  
  if (currentSite && pattern && profile) {
    // Fill name fields
    if (profile.name) {
      // Check if we need to split the name (first name, last name)
      const nameParts = profile.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Try site-specific name fields first
      let nameFieldsFilled = false;
      
      // Try first name / last name fields
      const firstNameFields = document.querySelectorAll('input[name*="first"], input[id*="first"], input[placeholder*="first"]');
      const lastNameFields = document.querySelectorAll('input[name*="last"], input[id*="last"], input[placeholder*="last"]');
      
      if (firstNameFields.length > 0 && lastNameFields.length > 0) {
        (firstNameFields[0] as HTMLInputElement).value = firstName;
        (lastNameFields[0] as HTMLInputElement).value = lastName;
        nameFieldsFilled = true;
        filledAny = true;
      }
      
      // If no specific first/last name fields, try generic name fields
      if (!nameFieldsFilled) {
        for (const selector of pattern.nameFields) {
          const nameFields = jobForm.querySelectorAll(selector);
          if (nameFields.length > 0) {
            (nameFields[0] as HTMLInputElement).value = profile.name;
            nameFieldsFilled = true;
            filledAny = true;
            break;
          }
        }
      }
      
      // Generic fallback for name fields
      if (!nameFieldsFilled) {
        const genericNameFields = jobForm.querySelectorAll('input[name*="name"], input[id*="name"], input[placeholder*="name"]');
        if (genericNameFields.length > 0) {
          (genericNameFields[0] as HTMLInputElement).value = profile.name;
          filledAny = true;
        }
      }
    }
    
    // Fill email fields
    if (profile.email) {
      let emailFieldFilled = false;
      
      // Try site-specific email fields first
      for (const selector of pattern.emailFields) {
        const emailFields = jobForm.querySelectorAll(selector);
        if (emailFields.length > 0) {
          (emailFields[0] as HTMLInputElement).value = profile.email;
          emailFieldFilled = true;
          filledAny = true;
          break;
        }
      }
      
      // Generic fallback for email fields
      if (!emailFieldFilled) {
        const genericEmailFields = jobForm.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="email"]');
        if (genericEmailFields.length > 0) {
          (genericEmailFields[0] as HTMLInputElement).value = profile.email;
          filledAny = true;
        }
      }
    }
  } else {
    // Generic autofill for unknown sites
    if (profile.name) {
      const nameFields = document.querySelectorAll('input[name*="name"], input[id*="name"], input[placeholder*="name"]');
      if (nameFields.length > 0) {
        (nameFields[0] as HTMLInputElement).value = profile.name;
        filledAny = true;
      }
    }
    
    if (profile.email) {
      const emailFields = document.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="email"]');
      if (emailFields.length > 0) {
        (emailFields[0] as HTMLInputElement).value = profile.email;
        filledAny = true;
      }
    }
  }
  
  return filledAny;
} 