import { UserProfile, JobBoardPattern } from '../types';
import { getUserProfile } from './storageService';
import { generateAIResponse } from './aiService';

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
  education: ['education', 'educationBackground', 'education-background', 'education_background', 'qualification'],
  skills: ['skills', 'skillSet', 'skill-set', 'skill_set', 'keySkills', 'key-skills', 'key_skills', 'technicalSkills', 'technical-skills', 'technical_skills'],
  // Education details
  degree: ['degree', 'degreeType', 'degree-type', 'degree_type', 'educationLevel', 'education-level', 'education_level', 'qualification'],
  discipline: ['discipline', 'major', 'field', 'fieldOfStudy', 'field-of-study', 'field_of_study', 'studyField', 'study-field', 'study_field', 'concentration'],
  school: ['school', 'university', 'college', 'institution', 'educationInstitution', 'education-institution', 'education_institution', 'schoolName', 'school-name', 'school_name'],
  educationStartYear: ['educationStartYear', 'education-start-year', 'education_start_year', 'startYear', 'start-year', 'start_year', 'fromYear', 'from-year', 'from_year'],
  educationStartMonth: ['educationStartMonth', 'education-start-month', 'education_start_month', 'startMonth', 'start-month', 'start_month', 'fromMonth', 'from-month', 'from_month'],
  educationEndYear: ['educationEndYear', 'education-end-year', 'education_end_year', 'endYear', 'end-year', 'end_year', 'toYear', 'to-year', 'to_year', 'graduationYear', 'graduation-year', 'graduation_year'],
  educationEndMonth: ['educationEndMonth', 'education-end-month', 'education_end_month', 'endMonth', 'end-month', 'end_month', 'toMonth', 'to-month', 'to_month', 'graduationMonth', 'graduation-month', 'graduation_month'],
  // Personal details
  gender: ['gender', 'sex', 'genderIdentity', 'gender-identity', 'gender_identity'],
  // Self-identification
  hispanicLatino: ['hispanic', 'latino', 'hispanicLatino', 'hispanic-latino', 'hispanic_latino', 'ethnicity', 'hispanic-origin', 'hispanic_origin'],
  veteranStatus: ['veteran', 'veteranStatus', 'veteran-status', 'veteran_status', 'military', 'militaryService', 'military-service', 'military_service', 'armedForces', 'armed-forces', 'armed_forces'],
  disabilityStatus: ['disability', 'disabilityStatus', 'disability-status', 'disability_status', 'disabled', 'disabilities']
};

// Resume field patterns
const RESUME_FIELD_PATTERNS = [
  'resume', 'cv', 'curriculum', 'vitae', 'upload', 'document', 
  'attachment', 'file', 'upload-resume', 'upload-cv', 'upload_resume', 'upload_cv'
];

// Essay question patterns - these are common keywords found in essay question fields
const ESSAY_QUESTION_PATTERNS = [
  'why', 'explain', 'describe', 'tell us', 'share', 'provide', 'elaborate',
  'reason', 'experience', 'background', 'skills', 'fit', 'contribute', 'value',
  'strengths', 'weaknesses', 'achievements', 'goals', 'interest', 'passion'
];

/**
 * Autofills a job application form with user profile data
 */
export async function autofillForm(jobBoardPattern: JobBoardPattern): Promise<{ fieldsFilled: number; essaysDetected: number }> {
  try {
    // Get user profile data
    const profile = await getUserProfile();
    console.log('Profile data for autofill:', profile);
    
    // Find the form element
    const formElement = document.querySelector(jobBoardPattern.formSelector);
    if (!formElement) {
      console.error('Form element not found with selector:', jobBoardPattern.formSelector);
      
      // Try a more generic approach if the specific selector fails
      const allForms = document.querySelectorAll('form');
      if (allForms.length > 0) {
        console.log('Trying generic form selector instead');
        return autofillAllForms(profile);
      }
      
      return { fieldsFilled: 0, essaysDetected: 0 };
    }
    
    console.log('Found form element:', formElement);
    
    // Find and fill form fields
    let fieldsFilled = 0;
    
    // Process all input fields
    fieldsFilled += autofillInputFields(formElement, profile);
    
    // Process textarea fields (for multi-line inputs like education and skills)
    fieldsFilled += autofillTextareaFields(formElement, profile);
    
    // Process select fields (dropdown menus)
    fieldsFilled += autofillSelectFields(formElement, profile);
    
    // Process file inputs for resume
    if (profile.resumeData) {
      fieldsFilled += autofillResumeFields(formElement, profile);
    }
    
    // If we didn't fill anything, try a broader search
    if (fieldsFilled === 0) {
      console.log('No fields filled with specific selectors, trying broader approach');
      fieldsFilled += autofillAllFields(profile);
    }
    
    // Detect and fill essay questions with AI responses
    const essaysDetected = await detectAndFillEssayQuestions(formElement);
    
    console.log(`Autofilled ${fieldsFilled} fields and ${essaysDetected} essay questions`);
    return { fieldsFilled, essaysDetected };
  } catch (error) {
    console.error('Error autofilling form:', error);
    return { fieldsFilled: 0, essaysDetected: 0 };
  }
}

/**
 * Try to autofill all forms on the page
 */
function autofillAllForms(profile: UserProfile): { fieldsFilled: number; essaysDetected: number } {
  let fieldsFilled = 0;
  let essaysDetected = 0;
  
  // Find all forms
  const allForms = document.querySelectorAll('form');
  console.log(`Found ${allForms.length} forms on the page`);
  
  allForms.forEach(async (form, index) => {
    console.log(`Processing form #${index + 1}`);
    
    // Process all input fields
    fieldsFilled += autofillInputFields(form, profile);
    
    // Process textarea fields
    fieldsFilled += autofillTextareaFields(form, profile);
    
    // Process select fields
    fieldsFilled += autofillSelectFields(form, profile);
    
    // Process file inputs for resume
    if (profile.resumeData) {
      fieldsFilled += autofillResumeFields(form, profile);
    }
    
    // Detect and fill essay questions
    const essays = await detectAndFillEssayQuestions(form);
    essaysDetected += essays;
  });
  
  return { fieldsFilled, essaysDetected };
}

/**
 * Try to autofill all input fields on the page, not limited to forms
 */
function autofillAllFields(profile: UserProfile): number {
  let fieldsFilled = 0;
  
  // Find all input fields
  const allInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"]');
  const allTextareas = document.querySelectorAll('textarea');
  const allSelects = document.querySelectorAll('select');
  
  console.log(`Found ${allInputs.length} inputs, ${allTextareas.length} textareas, and ${allSelects.length} selects on the page`);
  
  // Process all input fields
  allInputs.forEach(input => {
    const inputField = input as HTMLInputElement;
    fieldsFilled += tryAutofillField(inputField, profile) ? 1 : 0;
  });
  
  // Process all textareas
  allTextareas.forEach(textarea => {
    const textareaField = textarea as HTMLTextAreaElement;
    fieldsFilled += tryAutofillField(textareaField, profile) ? 1 : 0;
  });
  
  // Process all selects
  allSelects.forEach(select => {
    const selectField = select as HTMLSelectElement;
    fieldsFilled += tryAutofillSelectField(selectField, profile) ? 1 : 0;
  });
  
  return fieldsFilled;
}

/**
 * Autofill input fields in a form
 */
function autofillInputFields(formElement: Element, profile: UserProfile): number {
  let fieldsFilled = 0;
  
  // Find all input fields
  const inputFields = formElement.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"]');
  console.log(`Found ${inputFields.length} input fields`);
  
  inputFields.forEach((field) => {
    const inputField = field as HTMLInputElement;
    fieldsFilled += tryAutofillField(inputField, profile) ? 1 : 0;
  });
  
  return fieldsFilled;
}

/**
 * Try to autofill a single field
 */
function tryAutofillField(field: HTMLInputElement | HTMLTextAreaElement, profile: UserProfile): boolean {
  // Check field attributes (name, id, placeholder, etc.) for matches
  const fieldName = field.name?.toLowerCase() || '';
  const fieldId = field.id?.toLowerCase() || '';
  const fieldPlaceholder = field.placeholder?.toLowerCase() || '';
  const fieldLabel = getFieldLabel(field)?.toLowerCase() || '';
  const fieldAriaLabel = field.getAttribute('aria-label')?.toLowerCase() || '';
  
  console.log(`Checking field: name=${fieldName}, id=${fieldId}, placeholder=${fieldPlaceholder}`);
  
  // Try to match field with profile data
  for (const [profileKey, possibleMatches] of Object.entries(FIELD_MAPPING)) {
    if (
      possibleMatches.some(match => 
        fieldName.includes(match.toLowerCase()) || 
        fieldId.includes(match.toLowerCase()) || 
        fieldPlaceholder.includes(match.toLowerCase()) ||
        fieldLabel.includes(match.toLowerCase()) ||
        fieldAriaLabel.includes(match.toLowerCase())
      )
    ) {
      // Get the corresponding profile value
      const profileValue = profile[profileKey as keyof UserProfile];
      
      // Only fill if we have a value and the field is empty or we're overwriting
      if (profileValue && !field.value) {
        field.value = profileValue;
        
        // Trigger input event to notify the form of the change
        const inputEvent = new Event('input', { bubbles: true });
        field.dispatchEvent(inputEvent);
        
        // Also trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        field.dispatchEvent(changeEvent);
        
        console.log(`Filled field ${fieldName || fieldId} with ${profileKey}: ${profileValue}`);
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Autofill textarea fields in a form
 */
function autofillTextareaFields(formElement: Element, profile: UserProfile): number {
  let fieldsFilled = 0;
  
  // Find all textarea fields
  const textareaFields = formElement.querySelectorAll('textarea');
  console.log(`Found ${textareaFields.length} textarea fields`);
  
  textareaFields.forEach((field) => {
    const textareaField = field as HTMLTextAreaElement;
    fieldsFilled += tryAutofillField(textareaField, profile) ? 1 : 0;
  });
  
  return fieldsFilled;
}

/**
 * Autofill select fields in a form
 */
function autofillSelectFields(formElement: Element, profile: UserProfile): number {
  let fieldsFilled = 0;
  
  // Find all select fields
  const selectFields = formElement.querySelectorAll('select');
  console.log(`Found ${selectFields.length} select fields`);
  
  selectFields.forEach((field) => {
    const selectField = field as HTMLSelectElement;
    fieldsFilled += tryAutofillSelectField(selectField, profile) ? 1 : 0;
  });
  
  return fieldsFilled;
}

/**
 * Try to autofill a select field
 */
function tryAutofillSelectField(field: HTMLSelectElement, profile: UserProfile): boolean {
  // Check field attributes (name, id, etc.) for matches
  const fieldName = field.name?.toLowerCase() || '';
  const fieldId = field.id?.toLowerCase() || '';
  const fieldLabel = getFieldLabel(field)?.toLowerCase() || '';
  const fieldAriaLabel = field.getAttribute('aria-label')?.toLowerCase() || '';
  
  console.log(`Checking select field: name=${fieldName}, id=${fieldId}`);
  
  // Try to match field with profile data
  for (const [profileKey, possibleMatches] of Object.entries(FIELD_MAPPING)) {
    if (
      possibleMatches.some(match => 
        fieldName.includes(match.toLowerCase()) || 
        fieldId.includes(match.toLowerCase()) || 
        fieldLabel.includes(match.toLowerCase()) ||
        fieldAriaLabel.includes(match.toLowerCase())
      )
    ) {
      // Get the corresponding profile value
      const profileValue = profile[profileKey as keyof UserProfile];
      
      // Only proceed if we have a value
      if (!profileValue) continue;
      
      // Try to find a matching option
      const options = Array.from(field.options);
      const matchingOption = options.find(option => 
        option.text.toLowerCase().includes(profileValue.toLowerCase()) || 
        option.value.toLowerCase().includes(profileValue.toLowerCase())
      );
      
      if (matchingOption) {
        field.value = matchingOption.value;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        field.dispatchEvent(event);
        
        console.log(`Filled select ${fieldName || fieldId} with ${profileKey}: ${matchingOption.value}`);
        return true;
      }
    }
  }
  
  return false;
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
  console.log(`Found ${fileInputs.length} file input fields`);
  
  fileInputs.forEach((field) => {
    const fileInput = field as HTMLInputElement;
    
    // Check if this is likely a resume upload field
    const fieldName = fileInput.name?.toLowerCase() || '';
    const fieldId = fileInput.id?.toLowerCase() || '';
    const fieldAccept = fileInput.accept?.toLowerCase() || '';
    const fieldLabel = getFieldLabel(fileInput)?.toLowerCase() || '';
    const fieldAriaLabel = fileInput.getAttribute('aria-label')?.toLowerCase() || '';
    
    console.log(`Checking file field: name=${fieldName}, id=${fieldId}, accept=${fieldAccept}`);
    
    const isResumeField = RESUME_FIELD_PATTERNS.some(pattern => 
      fieldName.includes(pattern) || 
      fieldId.includes(pattern) || 
      fieldLabel.includes(pattern) ||
      fieldAriaLabel.includes(pattern)
    );
    
    // If no specific resume fields found, try any file input as a fallback
    const useAsGenericFileUpload = fileInputs.length === 1;
    
    // At this point we know resumeFileType is defined because of the guard at the start of the function
    const fileType = profile.resumeFileType as string;
    const fileExtension = fileType.split('/')[1] || '';
    
    const acceptsFileType = fieldAccept === '' || 
                           fieldAccept.includes('*') || 
                           fieldAccept.includes(fileExtension) ||
                           fieldAccept.includes(fileType);
    
    if ((isResumeField || useAsGenericFileUpload) && acceptsFileType) {
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
function getFieldLabel(field: HTMLElement): string {
  // Try to find label by for attribute
  if (field.id) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label && label instanceof HTMLElement) {
      return label.textContent?.trim() || '';
    }
  }
  
  // Try to find label as parent
  let parent = field.parentElement;
  while (parent) {
    if (parent.tagName === 'LABEL') {
      return parent.textContent?.trim() || '';
    }
    
    // Look for a label within the parent
    const labels = parent.querySelectorAll('label');
    if (labels.length === 1 && labels[0] instanceof HTMLElement) {
      return labels[0].textContent?.trim() || '';
    }
    
    parent = parent.parentElement;
  }
  
  return '';
}

/**
 * Detects essay questions in a form and returns them with their associated input fields
 */
export async function detectAndFillEssayQuestions(formElement: Element): Promise<number> {
  console.log('Detecting essay questions in form');
  let filledCount = 0;
  
  // Look for textareas with labels that might be essay questions
  const textareas = formElement.querySelectorAll('textarea');
  console.log(`Found ${textareas.length} textarea fields to check for essay questions`);
  
  for (const textarea of Array.from(textareas)) {
    const textareaElement = textarea as HTMLTextAreaElement;
    
    // Skip if already filled
    if (textareaElement.value) {
      console.log('Skipping already filled textarea');
      continue;
    }
    
    // Get the label or placeholder text that might contain the question
    const labelText = getFieldLabel(textareaElement);
    const placeholderText = textareaElement.placeholder || '';
    const ariaLabel = textareaElement.getAttribute('aria-label') || '';
    
    // Combine possible sources of question text
    const possibleQuestionText = `${labelText} ${placeholderText} ${ariaLabel}`.toLowerCase();
    
    // Check if this contains question patterns
    const isLikelyQuestion = ESSAY_QUESTION_PATTERNS.some(pattern => 
      possibleQuestionText.includes(pattern)
    );
    
    // Additional check: typically essay questions have larger textareas
    const isLargeTextarea = textareaElement.rows > 2 || textareaElement.cols > 40;
    
    if ((isLikelyQuestion || isLargeTextarea) && possibleQuestionText.length > 10) {
      console.log('Detected potential essay question:', possibleQuestionText);
      
      try {
        // Extract a cleaner version of the question
        const questionText = labelText || placeholderText || ariaLabel || 'General application question';
        
        // Get page context (such as job title and description if available)
        const pageContext = extractPageContext();
        
        // Get user profile
        const userProfile = await getUserProfile();
        
        // Generate AI response
        const response = await generateAIResponse(questionText, pageContext, userProfile);
        
        // Fill the textarea with the response
        textareaElement.value = response;
        
        // Dispatch events to notify the form
        textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
        textareaElement.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('Filled essay question with AI response');
        filledCount++;
      } catch (error) {
        console.error('Error generating AI response for essay question:', error);
      }
    }
  }
  
  return filledCount;
}

/**
 * Extract context from the current page that might be relevant for generating responses
 */
function extractPageContext(): string {
  let context = '';
  
  try {
    // Try to extract job title
    const possibleTitleElements = document.querySelectorAll('h1, h2, .job-title, [class*="title"], [class*="position"]');
    for (const element of Array.from(possibleTitleElements)) {
      if (element instanceof HTMLElement) {
        const text = element.textContent?.trim();
        if (text && text.length > 5 && text.length < 100) {
          context += `Job Title: ${text}\n\n`;
          break;
        }
      }
    }
    
    // Try to extract job description
    const possibleDescElements = document.querySelectorAll('.job-description, [class*="description"], [class*="details"], [class*="about"]');
    for (const element of Array.from(possibleDescElements)) {
      if (element instanceof HTMLElement) {
        const text = element.textContent?.trim();
        if (text && text.length > 100) {
          context += `Job Description: ${text.substring(0, 500)}...\n\n`;
          break;
        }
      }
    }
    
    // Try to extract company name
    const possibleCompanyElements = document.querySelectorAll('.company-name, [class*="company"], [class*="organization"], [class*="employer"]');
    for (const element of Array.from(possibleCompanyElements)) {
      if (element instanceof HTMLElement) {
        const text = element.textContent?.trim();
        if (text && text.length > 2 && text.length < 50) {
          context += `Company: ${text}\n\n`;
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error extracting page context:', error);
  }
  
  return context || 'No additional context available from the page.';
} 