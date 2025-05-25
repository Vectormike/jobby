import { UserProfile, JobBoardPattern } from '../types';
import { getUserProfile } from './storageService';

// Field mapping for common job application form fields
const FIELD_MAPPING = {
  name: ['name', 'fullName', 'full-name', 'full_name', 'firstName', 'first-name', 'first_name', 'lastName', 'last-name', 'last_name'],
  email: ['email', 'emailAddress', 'email-address', 'email_address'],
  phone: ['phone', 'phoneNumber', 'phone-number', 'phone_number', 'mobile', 'mobileNumber', 'mobile-number', 'mobile_number', 'cellPhone', 'cell-phone', 'cell_phone'],
  address: ['address', 'streetAddress', 'street-address', 'street_address', 'addressLine1', 'address-line-1', 'address_line_1'],
  city: ['city', 'cityName', 'city-name', 'city_name'],
  state: ['state', 'province', 'region'],
  zipCode: ['zipCode', 'zip-code', 'zip_code', 'postalCode', 'postal-code', 'postal_code'],
  linkedin: ['linkedin', 'linkedinUrl', 'linkedin-url', 'linkedin_url', 'linkedInProfile', 'linkedIn-profile', 'linkedIn_profile'],
  github: ['github', 'githubUrl', 'github-url', 'github_url', 'githubProfile', 'github-profile', 'github_profile'],
  portfolio: ['portfolio', 'portfolioUrl', 'portfolio-url', 'portfolio_url', 'website', 'personalWebsite', 'personal-website', 'personal_website'],
  yearsOfExperience: ['yearsOfExperience', 'years-of-experience', 'years_of_experience', 'experience', 'experienceYears', 'experience-years', 'experience_years'],
  education: ['education', 'educationBackground', 'education-background', 'education_background', 'degree', 'qualification'],
  skills: ['skills', 'skillSet', 'skill-set', 'skill_set', 'keySkills', 'key-skills', 'key_skills', 'technicalSkills', 'technical-skills', 'technical_skills']
};

// Resume field patterns
const RESUME_FIELD_PATTERNS = [
  'resume', 'cv', 'curriculum', 'vitae', 'upload', 'document', 
  'attachment', 'file', 'upload-resume', 'upload-cv', 'upload_resume', 'upload_cv'
];

/**
 * Autofills a job application form with user profile data
 */
export async function autofillForm(jobBoardPattern: JobBoardPattern): Promise<{ fieldsFilled: number }> {
  try {
    // Get user profile data
    const profile = await getUserProfile();
    
    // Find the form element
    const formElement = document.querySelector(jobBoardPattern.formSelector);
    if (!formElement) {
      console.log('Form element not found');
      return { fieldsFilled: 0 };
    }
    
    // Find and fill form fields
    let fieldsFilled = 0;
    
    // Process all input fields
    fieldsFilled += autofillInputFields(formElement, profile);
    
    // Process textarea fields (for multi-line inputs like education and skills)
    fieldsFilled += autofillTextareaFields(formElement, profile);
    
    // Process file inputs for resume
    if (profile.resumeData) {
      fieldsFilled += autofillResumeFields(formElement, profile);
    }
    
    console.log(`Autofilled ${fieldsFilled} fields`);
    return { fieldsFilled };
  } catch (error) {
    console.error('Error autofilling form:', error);
    return { fieldsFilled: 0 };
  }
}

/**
 * Autofill input fields in a form
 */
function autofillInputFields(formElement: Element, profile: UserProfile): number {
  let fieldsFilled = 0;
  
  // Find all input fields
  const inputFields = formElement.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"]');
  
  inputFields.forEach((field) => {
    const inputField = field as HTMLInputElement;
    
    // Check field attributes (name, id, placeholder, etc.) for matches
    const fieldName = inputField.name?.toLowerCase() || '';
    const fieldId = inputField.id?.toLowerCase() || '';
    const fieldPlaceholder = inputField.placeholder?.toLowerCase() || '';
    const fieldLabel = getFieldLabel(inputField)?.toLowerCase() || '';
    
    // Try to match field with profile data
    for (const [profileKey, possibleMatches] of Object.entries(FIELD_MAPPING)) {
      if (
        possibleMatches.some(match => 
          fieldName.includes(match.toLowerCase()) || 
          fieldId.includes(match.toLowerCase()) || 
          fieldPlaceholder.includes(match.toLowerCase()) ||
          fieldLabel.includes(match.toLowerCase())
        )
      ) {
        // Get the corresponding profile value
        const profileValue = profile[profileKey as keyof UserProfile];
        
        // Only fill if we have a value and the field is empty
        if (profileValue && !inputField.value) {
          inputField.value = profileValue;
          
          // Trigger input event to notify the form of the change
          const event = new Event('input', { bubbles: true });
          inputField.dispatchEvent(event);
          
          fieldsFilled++;
          console.log(`Filled field ${fieldName || fieldId} with ${profileKey}`);
        }
        
        // Break the loop once we've found a match
        break;
      }
    }
  });
  
  return fieldsFilled;
}

/**
 * Autofill textarea fields in a form
 */
function autofillTextareaFields(formElement: Element, profile: UserProfile): number {
  let fieldsFilled = 0;
  
  // Find all textarea fields
  const textareaFields = formElement.querySelectorAll('textarea');
  
  textareaFields.forEach((field) => {
    const textareaField = field as HTMLTextAreaElement;
    
    // Check field attributes (name, id, placeholder, etc.) for matches
    const fieldName = textareaField.name?.toLowerCase() || '';
    const fieldId = textareaField.id?.toLowerCase() || '';
    const fieldPlaceholder = textareaField.placeholder?.toLowerCase() || '';
    const fieldLabel = getFieldLabel(textareaField)?.toLowerCase() || '';
    
    // Try to match field with profile data
    for (const [profileKey, possibleMatches] of Object.entries(FIELD_MAPPING)) {
      if (
        possibleMatches.some(match => 
          fieldName.includes(match.toLowerCase()) || 
          fieldId.includes(match.toLowerCase()) || 
          fieldPlaceholder.includes(match.toLowerCase()) ||
          fieldLabel.includes(match.toLowerCase())
        )
      ) {
        // Get the corresponding profile value
        const profileValue = profile[profileKey as keyof UserProfile];
        
        // Only fill if we have a value and the field is empty
        if (profileValue && !textareaField.value) {
          textareaField.value = profileValue;
          
          // Trigger input event to notify the form of the change
          const event = new Event('input', { bubbles: true });
          textareaField.dispatchEvent(event);
          
          fieldsFilled++;
          console.log(`Filled textarea ${fieldName || fieldId} with ${profileKey}`);
        }
        
        // Break the loop once we've found a match
        break;
      }
    }
  });
  
  return fieldsFilled;
}

/**
 * Autofill resume file inputs
 */
function autofillResumeFields(formElement: Element, profile: UserProfile): number {
  let fieldsFilled = 0;
  
  if (!profile.resumeData || !profile.resumeFileName || !profile.resumeFileType) {
    return fieldsFilled;
  }
  
  // Find all file input fields
  const fileInputs = formElement.querySelectorAll('input[type="file"]');
  
  fileInputs.forEach((field) => {
    const fileInput = field as HTMLInputElement;
    
    // Check if this is likely a resume upload field
    const fieldName = fileInput.name?.toLowerCase() || '';
    const fieldId = fileInput.id?.toLowerCase() || '';
    const fieldAccept = fileInput.accept?.toLowerCase() || '';
    const fieldLabel = getFieldLabel(fileInput)?.toLowerCase() || '';
    
    const isResumeField = RESUME_FIELD_PATTERNS.some(pattern => 
      fieldName.includes(pattern) || 
      fieldId.includes(pattern) || 
      fieldLabel.includes(pattern)
    );
    
    // At this point we know resumeFileType is defined because of the guard at the start of the function
    const fileType = profile.resumeFileType as string;
    const fileExtension = fileType.split('/')[1] || '';
    
    const acceptsFileType = fieldAccept === '' || 
                           fieldAccept.includes('*') || 
                           fieldAccept.includes(fileExtension) ||
                           fieldAccept.includes(fileType);
    
    if (isResumeField && acceptsFileType) {
      try {
        // We know these are defined due to the guard at the start of the function
        const resumeData = profile.resumeData as string;
        const resumeFileName = profile.resumeFileName as string;
        
        // Create a File object from the base64 data
        const fileData = dataURLtoBlob(resumeData);
        const file = new File([fileData], resumeFileName, { type: fileType });
        
        // Create a DataTransfer to set the file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
        
        fieldsFilled++;
        console.log(`Filled resume field ${fieldName || fieldId}`);
        
        // Attempt to find and click the upload button if present
        tryClickUploadButton(fileInput);
      } catch (error) {
        console.error('Error setting resume file:', error);
      }
    }
  });
  
  return fieldsFilled;
}

/**
 * Convert data URL to Blob
 */
function dataURLtoBlob(dataURL: string): Blob {
  // Split the data URL to get the data part
  const parts = dataURL.split(',');
  const contentType = parts[0].match(/:(.*?);/)?.[1] || '';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Try to find and click an upload button near the file input
 */
function tryClickUploadButton(fileInput: HTMLInputElement): void {
  // Look for nearby buttons that might be upload buttons
  const parentForm = fileInput.closest('form');
  if (!parentForm) return;
  
  // Look for buttons near the file input
  const uploadButtonPatterns = ['upload', 'submit', 'send', 'attach'];
  
  // Try to find buttons in the same container as the file input
  let container = fileInput.parentElement;
  while (container && container !== parentForm) {
    const buttons = container.querySelectorAll('button, input[type="button"], input[type="submit"]');
    
    for (const button of Array.from(buttons)) {
      const buttonText = button.textContent?.toLowerCase() || '';
      const buttonValue = (button as HTMLInputElement).value?.toLowerCase() || '';
      
      if (uploadButtonPatterns.some(pattern => buttonText.includes(pattern) || buttonValue.includes(pattern))) {
        // Don't actually click, as this might submit the form prematurely
        console.log('Found upload button, but not clicking automatically');
        return;
      }
    }
    
    container = container.parentElement;
  }
}

/**
 * Get the label text for a form field
 */
function getFieldLabel(field: HTMLElement): string | null {
  // Try to find label by for attribute
  if (field.id) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label) {
      return label.textContent?.trim() || null;
    }
  }
  
  // Try to find label as parent
  let parent = field.parentElement;
  while (parent) {
    if (parent.tagName === 'LABEL') {
      return parent.textContent?.trim() || null;
    }
    
    // Look for a label within the parent
    const labels = parent.querySelectorAll('label');
    if (labels.length === 1) {
      return labels[0].textContent?.trim() || null;
    }
    
    parent = parent.parentElement;
  }
  
  return null;
} 