import { JobBoardPatterns, JobBoardPattern } from '../types';

// Known job board patterns
export const jobBoardPatterns: JobBoardPatterns = {
  'linkedin.com': { 
    formSelector: '.jobs-easy-apply-content',
    nameFields: ['input[name*="firstName"]', 'input[name*="lastName"]'],
    emailFields: ['input[name*="email"]']
  },
  'indeed.com': { 
    formSelector: '#ia-container form, .ia-JobApplication',
    nameFields: ['input[name*="name"]', 'input[id*="name"]'],
    emailFields: ['input[name*="email"]', 'input[type="email"]']
  },
  'glassdoor.com': { 
    formSelector: '.application-form',
    nameFields: ['input[name*="first"]', 'input[name*="last"]'],
    emailFields: ['input[name*="email"]']
  },
  'monster.com': {
    formSelector: '.job-apply-form',
    nameFields: ['input[name*="name"]'],
    emailFields: ['input[name*="email"]']
  },
  'ziprecruiter.com': {
    formSelector: '#job_application_form',
    nameFields: ['input[name*="name"]'],
    emailFields: ['input[name*="email"]']
  }
};

/**
 * Detects which job board site the user is currently on
 * @returns The detected job board site key or undefined if not found
 */
export function detectJobBoardSite(): string | undefined {
  return Object.keys(jobBoardPatterns).find(site => 
    window.location.hostname.includes(site)
  );
}

/**
 * Get the job board pattern for the current site
 * @returns The job board pattern for the current site or undefined if not found
 */
export function getCurrentJobBoardPattern(): JobBoardPattern | undefined {
  const currentSite = detectJobBoardSite();
  return currentSite ? jobBoardPatterns[currentSite] : undefined;
}

/**
 * Detects job application forms on the current page
 * @returns The detected form element or null if not found
 */
export function detectJobApplicationForm(): HTMLFormElement | HTMLElement | null {
  // Check if we're on a known job board
  const currentSite = detectJobBoardSite();
  
  if (currentSite) {
    const pattern = jobBoardPatterns[currentSite];
    const specificForm = document.querySelector(pattern.formSelector);
    if (specificForm) {
      console.log(`Detected job form on ${currentSite} using specific selector`);
      return specificForm as HTMLElement;
    }
  }
  
  // Generic detection for unknown sites
  const allForms = Array.from(document.querySelectorAll('form'));
  
  // Check for forms with file inputs (resume upload)
  const formsWithFileUpload = allForms.filter(form => 
    form.querySelector('input[type="file"]')
  );
  
  if (formsWithFileUpload.length === 1) {
    console.log('Detected job form with file upload');
    return formsWithFileUpload[0];
  }
  
  // Look for forms with common job application keywords
  const jobKeywords = ['apply', 'application', 'resume', 'cv', 'cover letter', 'job'];
  
  for (const form of allForms) {
    const formText = form.innerText.toLowerCase();
    const hasJobKeyword = jobKeywords.some(keyword => formText.includes(keyword));
    
    // Check for name and email fields
    const hasNameField = !!form.querySelector('input[name*="name"], input[placeholder*="name"]');
    const hasEmailField = !!form.querySelector('input[type="email"], input[name*="email"]');
    
    if ((hasNameField && hasEmailField) || hasJobKeyword) {
      console.log('Detected potential job application form');
      return form;
    }
  }
  
  // If no form is found but we're on a job site, look for application containers
  if (currentSite || window.location.href.includes('job') || window.location.href.includes('career')) {
    const applicationContainers = document.querySelectorAll('.application, .apply, [id*="apply"], [class*="apply"]');
    if (applicationContainers.length > 0) {
      console.log('Detected application container');
      return applicationContainers[0] as HTMLElement;
    }
  }
  
  return null;
}

/**
 * Highlights a form element to make it visible to the user
 */
export function highlightJobForm(element: HTMLElement | Element): void {
  // Create a highlight effect
  const htmlElement = element as HTMLElement;
  const originalBorder = htmlElement.style.border;
  const originalBackground = htmlElement.style.backgroundColor;
  
  htmlElement.style.border = '2px solid #4285f4';
  htmlElement.style.backgroundColor = 'rgba(66, 133, 244, 0.1)';
  htmlElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Remove highlight after a few seconds
  setTimeout(() => {
    htmlElement.style.border = originalBorder;
    htmlElement.style.backgroundColor = originalBackground;
  }, 3000);
} 