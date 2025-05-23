// Popup script that runs when the extension icon is clicked
import { Options, StorageData, UserProfile } from './types';
import { saveOptions, getOptions, saveUserProfile, getUserProfile, getJobFormData } from './services/storageService';

console.log('Popup script loaded');

// Function to initialize the popup UI
async function initPopup(): Promise<void> {
  const analyzeButton = document.getElementById('analyzeButton') as HTMLButtonElement;
  const toggleSwitch = document.getElementById('toggleEnabled') as HTMLInputElement;
  const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
  const statusElement = document.getElementById('status') as HTMLDivElement;
  
  if (analyzeButton && toggleSwitch && themeSelect) {
    try {
      // Load saved options
      const options = await getOptions();
      
      // Update UI with saved options
      toggleSwitch.checked = options.enabled;
      themeSelect.value = options.theme;
      
      // Apply theme
      document.body.setAttribute('data-theme', options.theme);
    } catch (error) {
      console.error('Error loading options:', error);
    }
    
    // Set up event listeners
    analyzeButton.addEventListener('click', async () => {
      statusElement.textContent = 'Looking for job application form...';
      
      // Get the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          const tabId = tabs[0].id;
          // Send message to content script
          chrome.tabs.sendMessage(tabId, { action: 'findJobForm' }, (response) => {
            if (response && response.success) {
              if (response.formFound) {
                statusElement.textContent = 'Job application form found!';
                
                // Show profile management UI
                showProfileManager();
                
                // Add autofill button
                addAutofillButton(tabId, statusElement);
              } else {
                statusElement.textContent = 'No job application form detected on this page.';
              }
            } else {
              statusElement.textContent = 'Error analyzing page.';
            }
          });
        }
      });
    });
    
    // Save options when changed
    toggleSwitch.addEventListener('change', saveOptionsHandler);
    themeSelect.addEventListener('change', saveOptionsHandler);
    
    // Check if we have recent job form data
    await checkForRecentJobForm();
  }
}

// Show profile management UI
async function showProfileManager(): Promise<void> {
  const profileContainer = document.getElementById('autofillContainer');
  if (profileContainer) {
    profileContainer.style.display = 'block';
    
    try {
      // Load user profile data if available
      const profile = await getUserProfile();
      
      // Update UI with profile data if available
      const nameInput = document.getElementById('profileName') as HTMLInputElement;
      const emailInput = document.getElementById('profileEmail') as HTMLInputElement;
      
      if (nameInput && profile.name) {
        nameInput.value = profile.name;
      }
      
      if (emailInput && profile.email) {
        emailInput.value = profile.email;
      }
      
      // Set up save profile button
      const saveProfileButton = document.getElementById('saveProfileButton');
      if (saveProfileButton) {
        saveProfileButton.addEventListener('click', async () => {
          const nameInput = document.getElementById('profileName') as HTMLInputElement;
          const emailInput = document.getElementById('profileEmail') as HTMLInputElement;
          
          // Save profile data
          const profile: UserProfile = {
            name: nameInput.value,
            email: emailInput.value
          };
          
          try {
            await saveUserProfile(profile);
            
            const statusElement = document.getElementById('status') as HTMLDivElement;
            if (statusElement) {
              statusElement.textContent = 'Profile saved!';
              setTimeout(() => {
                statusElement.textContent = '';
              }, 1500);
            }
          } catch (error) {
            console.error('Error saving profile:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }
}

// Add autofill button functionality
function addAutofillButton(tabId: number, statusElement: HTMLElement): void {
  const autofillButton = document.getElementById('autofillButton');
  if (autofillButton) {
    autofillButton.addEventListener('click', () => {
      // Send autofill message to content script
      chrome.tabs.sendMessage(tabId, { 
        action: 'autofillWithStoredProfile'
      }, (response) => {
        if (response && response.success) {
          if (response.fieldsFilled) {
            statusElement.textContent = 'Form autofilled!';
          } else {
            statusElement.textContent = 'No fields could be autofilled.';
          }
        } else {
          statusElement.textContent = 'Error autofilling form.';
        }
      });
    });
  }
}

// Check if we recently found a job form on this page
async function checkForRecentJobForm(): Promise<void> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.url) {
        const currentUrl = tabs[0].url;
        
        try {
          const formData = await getJobFormData(currentUrl);
          
          if (formData && formData.formFound && tabs[0]?.id) {
            const statusElement = document.getElementById('status') as HTMLDivElement;
            statusElement.textContent = 'Job application form detected on this page.';
            await showProfileManager();
            
            const tabId = tabs[0].id;
            addAutofillButton(tabId, statusElement);
          }
        } catch (error) {
          console.error('Error checking for job form:', error);
        }
        
        resolve();
      }
    });
  });
}

// Handler for saving options
async function saveOptionsHandler(): Promise<void> {
  const toggleSwitch = document.getElementById('toggleEnabled') as HTMLInputElement;
  const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
  
  const options: Options = {
    enabled: toggleSwitch.checked,
    theme: themeSelect.value
  };
  
  try {
    // Save to Chrome storage
    await saveOptions(options);
    
    // Apply theme immediately
    document.body.setAttribute('data-theme', options.theme);
    
    // Show saved message
    const statusElement = document.getElementById('status') as HTMLDivElement;
    if (statusElement) {
      statusElement.textContent = 'Options saved!';
      setTimeout(() => {
        statusElement.textContent = '';
      }, 1500);
    }
  } catch (error) {
    console.error('Error saving options:', error);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initPopup); 