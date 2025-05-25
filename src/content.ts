// Content script that runs in the context of web pages
import { Message, ResponseMessage } from './types';
import { detectJobApplicationForm, detectJobBoardSite, getCurrentJobBoardPattern } from './services/jobFormService';
import { autofillForm } from './services/autofillService';
import { saveJobFormData } from './services/storageService';

console.log('Job Board Assistant content script loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('Message received in content script:', message);
  
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
    const formElement = detectJobApplicationForm();
    const formFound = !!formElement;
    
    // Check if the form has resume upload fields
    const hasResumeField = formFound && checkForResumeFields(formElement);
    
    // Save result to storage
    if (formFound) {
      await saveJobFormData(window.location.href, true);
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
  
  for (const input of Array.from(fileInputs)) {
    const inputElement = input as HTMLInputElement;
    const name = inputElement.name?.toLowerCase() || '';
    const id = inputElement.id?.toLowerCase() || '';
    const accept = inputElement.accept?.toLowerCase() || '';
    
    // Check if this is likely a resume upload field
    if (
      name.includes('resume') || name.includes('cv') || 
      id.includes('resume') || id.includes('cv') ||
      accept.includes('pdf') || accept.includes('doc') ||
      inputElement.closest('label')?.textContent?.toLowerCase().includes('resume')
    ) {
      return true;
    }
  }
  
  return false;
}

// Handle autofill request
async function handleAutofill(sendResponse: (response: ResponseMessage) => void): Promise<void> {
  try {
    // Get the current job board pattern
    const jobBoardPattern = getCurrentJobBoardPattern();
    
    if (!jobBoardPattern) {
      sendResponse({
        success: false,
        error: 'No job board pattern found for this site'
      });
      return;
    }
    
    // Autofill the form
    const result = await autofillForm(jobBoardPattern);
    
    sendResponse({
      success: true,
      fieldsFilled: result.fieldsFilled
    });
  } catch (error) {
    console.error('Error autofilling form:', error);
    sendResponse({
      success: false,
      error: 'Error autofilling form'
    });
  }
}

// Check for job form on page load
async function checkForJobFormOnLoad(): Promise<void> {
  try {
    const formElement = detectJobApplicationForm();
    if (formElement) {
      await saveJobFormData(window.location.href, true);
    }
  } catch (error) {
    console.error('Error checking for job form on load:', error);
  }
}

// Run initial check when page is fully loaded
window.addEventListener('load', checkForJobFormOnLoad); 