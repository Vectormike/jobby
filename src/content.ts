// Content script that runs on web pages
import { Message, ResponseMessage, UserProfile } from './types';
import { detectJobApplicationForm, highlightJobForm } from './services/jobFormService';
import { autofillForm } from './services/autofillService';

console.log('Content script loaded');

/**
 * Analyze the current page content and look for job application forms
 */
function analyzePageContent(): void {
  const pageTitle = document.title;
  const headings = document.querySelectorAll('h1, h2');
  const links = document.querySelectorAll('a');
  
  const pageInfo = {
    title: pageTitle,
    headingCount: headings.length,
    linkCount: links.length,
    url: window.location.href
  };
  
  console.log('Page analysis:', pageInfo);
  
  // Check for job application forms
  const jobForm = detectJobApplicationForm();
  if (jobForm) {
    console.log('Found job application form:', jobForm);
    highlightJobForm(jobForm);
    
    // Send data to background script
    chrome.runtime.sendMessage({
      action: 'jobFormFound',
      data: {
        url: window.location.href,
        formFound: true
      }
    });
  }
  
  // Send data to background script
  chrome.runtime.sendMessage({
    action: 'pageAnalyzed',
    data: pageInfo
  });
}

/**
 * Autofill form using stored profile data
 */
async function autofillWithStoredProfile(): Promise<boolean> {
  try {
    // Get profile data from storage
    const profileData = await new Promise<UserProfile>((resolve) => {
      chrome.storage.sync.get('userProfile', (data) => {
        resolve(data.userProfile || { name: '', email: '' });
      });
    });
    
    // Use the autofill service with the stored profile
    return autofillForm(profileData);
  } catch (error) {
    console.error('Error autofilling with stored profile:', error);
    return false;
  }
}

// Run after page load
window.addEventListener('load', () => {
  setTimeout(analyzePageContent, 1000);
});

// Listen for messages from background script or popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse: (response: ResponseMessage) => void) => {
  // Analyze page content
  if (message.action === 'analyzeNow') {
    analyzePageContent();
    sendResponse({ success: true });
  }
  
  // Find job application form
  if (message.action === 'findJobForm') {
    const jobForm = detectJobApplicationForm();
    if (jobForm) {
      highlightJobForm(jobForm);
      sendResponse({ 
        success: true, 
        formFound: true 
      });
    } else {
      sendResponse({ 
        success: true, 
        formFound: false 
      });
    }
    return true;
  }
  
  // Autofill form with user profile data
  if (message.action === 'autofillForm') {
    // If profile is provided in the message, use it
    if (message.profile) {
      const profile = message.profile as UserProfile;
      const success = autofillForm(profile);
      sendResponse({ 
        success: true, 
        fieldsFilled: success 
      });
    } 
    // Otherwise use stored profile
    else {
      autofillWithStoredProfile().then(success => {
        sendResponse({ 
          success: true, 
          fieldsFilled: success 
        });
      }).catch(error => {
        console.error('Error in autofill:', error);
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      });
    }
    return true;
  }
  
  // Autofill with stored profile data
  if (message.action === 'autofillWithStoredProfile') {
    autofillWithStoredProfile().then(success => {
      sendResponse({ 
        success: true, 
        fieldsFilled: success 
      });
    }).catch(error => {
      console.error('Error in autofill:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    });
    return true;
  }
}); 