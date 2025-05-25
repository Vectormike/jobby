// Content script that runs in the context of web pages
import { Message, ResponseMessage } from './types';
import { detectJobApplicationForm, detectJobBoardSite, getCurrentJobBoardPattern } from './services/jobFormService';
import { autofillForm } from './services/autofillService';
import { saveJobFormData, getOptions } from './services/storageService';
import { setAPIKey } from './services/aiService';

console.log('Job Board Assistant content script loaded');

// Enable debug mode for more verbose logging
const DEBUG_MODE = true;

function debugLog(...args: any[]): void {
  if (DEBUG_MODE) {
    console.log('[Job Board Assistant]', ...args);
  }
}

// Initialize the content script
async function initialize(): Promise<void> {
  try {
    // Load options
    const options = await getOptions();
    
    // Set API key if available
    if (options.apiKey) {
      setAPIKey(options.apiKey);
      debugLog('API key loaded from options');
    } else if (options.openaiApiKey) {
      // For backward compatibility
      setAPIKey(options.openaiApiKey);
      debugLog('API key loaded from legacy options field');
    } else {
      debugLog('No API key found in options');
    }
    
    // Check for job form on page load
    checkForJobFormOnLoad();
  } catch (error) {
    console.error('Error initializing content script:', error);
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  debugLog('Message received in content script:', message);
  
  if (message.action === 'findJobForm') {
    handleFindJobForm(sendResponse);
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'autofillWithStoredProfile') {
    handleAutofill(sendResponse);
    return true; // Keep the message channel open for async response
  }
});

// Check if the current page has a job application form
async function handleFindJobForm(sendResponse: (response: ResponseMessage) => void): Promise<void> {
  try {
    debugLog('Looking for job application form...');
    const formElement = detectJobApplicationForm();
    const formFound = !!formElement;
    
    debugLog('Form found:', formFound);
    if (formFound) {
      debugLog('Form element:', formElement);
    }
    
    // Check if the form has resume upload fields
    const hasResumeField = formFound && checkForResumeFields(formElement);
    debugLog('Has resume field:', hasResumeField);
    
    // Save result to storage
    if (formFound) {
      await saveJobFormData(window.location.href, true);
      debugLog('Job form data saved');
    }
    
    sendResponse({
      success: true,
      formFound,
      hasResumeField
    });
  } catch (error) {
    console.error('Error finding job form:', error);
    sendResponse({
      success: false,
      error: 'Error finding job form'
    });
  }
}

// Check if the form has resume upload fields
function checkForResumeFields(formElement: Element): boolean {
  const fileInputs = formElement.querySelectorAll('input[type="file"]');
  debugLog(`Found ${fileInputs.length} file inputs in form`);
  
  for (const input of Array.from(fileInputs)) {
    const inputElement = input as HTMLInputElement;
    const name = inputElement.name?.toLowerCase() || '';
    const id = inputElement.id?.toLowerCase() || '';
    const accept = inputElement.accept?.toLowerCase() || '';
    
    debugLog(`File input: name=${name}, id=${id}, accept=${accept}`);
    
    // Check if this is likely a resume upload field
    if (
      name.includes('resume') || name.includes('cv') || 
      id.includes('resume') || id.includes('cv') ||
      accept.includes('pdf') || accept.includes('doc') ||
      inputElement.closest('label')?.textContent?.toLowerCase().includes('resume')
    ) {
      debugLog('Resume field found');
      return true;
    }
  }
  
  debugLog('No resume fields found');
  return false;
}

// Handle autofill request
async function handleAutofill(sendResponse: (response: ResponseMessage) => void): Promise<void> {
  try {
    debugLog('Handling autofill request');
    
    // First try to get the current job board pattern
    let jobBoardPattern = getCurrentJobBoardPattern();
    
    if (jobBoardPattern) {
      debugLog('Using job board pattern for', window.location.hostname);
    } else {
      debugLog('No specific job board pattern found, creating a generic one');
      
      // If no pattern was found, create a generic pattern using the detected form
      const formElement = detectJobApplicationForm();
      
      if (!formElement) {
        debugLog('No job application form found on this page');
        sendResponse({
          success: false,
          error: 'No job application form found on this page'
        });
        return;
      }
      
      // Create a generic pattern for the detected form
      jobBoardPattern = {
        formSelector: getUniqueSelector(formElement),
        nameFields: ['input[name*="name"]', 'input[id*="name"]', 'input[placeholder*="name"]'],
        emailFields: ['input[type="email"]', 'input[name*="email"]', 'input[id*="email"]']
      };
      
      debugLog('Created generic pattern for detected form:', jobBoardPattern);
    }
    
    // Autofill the form
    debugLog('Attempting to autofill the form...');
    const result = await autofillForm(jobBoardPattern);
    debugLog('Autofill result:', result);
    
    sendResponse({
      success: true,
      fieldsFilled: result.fieldsFilled,
      essaysDetected: result.essaysDetected
    });
  } catch (error) {
    console.error('Error autofilling form:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Error autofilling form'
    });
  }
}

// Generate a unique CSS selector for an element
function getUniqueSelector(element: Element): string {
  // Try to use ID if available
  if (element.id) {
    return `#${element.id}`;
  }
  
  // Try to use a unique class
  if (element.classList.length > 0) {
    return `.${Array.from(element.classList).join('.')}`;
  }
  
  // Use the tag name and position
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'form') {
    const forms = document.querySelectorAll('form');
    const formIndex = Array.from(forms).indexOf(element as HTMLFormElement);
    return `form:nth-of-type(${formIndex + 1})`;
  }
  
  // Fallback to a very generic selector
  return tagName;
}

// Check for job form on page load
async function checkForJobFormOnLoad(): Promise<void> {
  try {
    debugLog('Checking for job form on page load');
    const formElement = detectJobApplicationForm();
    if (formElement) {
      debugLog('Job form found on page load');
      await saveJobFormData(window.location.href, true);
    } else {
      debugLog('No job form found on page load');
    }
  } catch (error) {
    console.error('Error checking for job form on load:', error);
  }
}

// Run initialization when script is loaded
initialize(); 