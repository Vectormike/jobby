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
                showProfileManager(response.hasResumeField);
                
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
async function showProfileManager(hasResumeField: boolean = false): Promise<void> {
  const profileContainer = document.getElementById('autofillContainer');
  if (profileContainer) {
    profileContainer.style.display = 'block';
    
    // Show or hide resume section based on whether the form has resume fields
    const resumeSection = document.querySelector('.section-title:last-of-type') as HTMLElement;
    const resumeGroup = document.querySelector('.form-group:last-of-type') as HTMLElement;
    const resumePreview = document.getElementById('resumePreview') as HTMLElement;
    
    if (resumeSection && resumeGroup && resumePreview) {
      if (hasResumeField) {
        resumeSection.style.display = 'block';
        resumeGroup.style.display = 'block';
        resumePreview.style.display = 'block';
      } else {
        resumeSection.style.display = 'none';
        resumeGroup.style.display = 'none';
        resumePreview.style.display = 'none';
      }
    }
    
    try {
      // Load user profile data if available
      const profile = await getUserProfile();
      
      // Update UI with profile data if available
      updateProfileForm(profile);
      
      // Set up resume file input
      setupResumeUpload();
      
      // Set up save profile button
      const saveProfileButton = document.getElementById('saveProfileButton');
      if (saveProfileButton) {
        saveProfileButton.addEventListener('click', async () => {
          // Collect profile data from form
          const profile = await collectProfileData();
          
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

// Update profile form with saved data
function updateProfileForm(profile: UserProfile): void {
  // Personal information
  setInputValue('profileName', profile.name);
  setInputValue('profileEmail', profile.email);
  setInputValue('profilePhone', profile.phone);
  
  // Address
  setInputValue('profileAddress', profile.address);
  setInputValue('profileCity', profile.city);
  setInputValue('profileState', profile.state);
  setInputValue('profileZipCode', profile.zipCode);
  
  // Professional information
  setInputValue('profileLinkedin', profile.linkedin);
  setInputValue('profileGithub', profile.github);
  setInputValue('profilePortfolio', profile.portfolio);
  setInputValue('profileYearsOfExperience', profile.yearsOfExperience);
  setInputValue('profileEducation', profile.education);
  setInputValue('profileSkills', profile.skills);
  
  // Resume information
  if (profile.resumeFileName) {
    const resumeFileName = document.getElementById('resumeFileName');
    const resumeFileInfo = document.getElementById('resumeFileInfo');
    
    if (resumeFileName) {
      resumeFileName.textContent = profile.resumeFileName;
    }
    
    if (resumeFileInfo && profile.resumeFileType) {
      resumeFileInfo.textContent = `Type: ${profile.resumeFileType}`;
    }
  }
}

// Set up resume upload functionality
function setupResumeUpload(): void {
  const resumeInput = document.getElementById('profileResume') as HTMLInputElement;
  const resumeFileName = document.getElementById('resumeFileName');
  const resumeFileInfo = document.getElementById('resumeFileInfo');
  
  if (resumeInput && resumeFileName && resumeFileInfo) {
    resumeInput.addEventListener('change', (event) => {
      const files = (event.target as HTMLInputElement).files;
      
      if (files && files.length > 0) {
        const file = files[0];
        resumeFileName.textContent = file.name;
        resumeFileInfo.textContent = `Type: ${file.type}, Size: ${formatFileSize(file.size)}`;
      } else {
        resumeFileName.textContent = 'No file selected';
        resumeFileInfo.textContent = '';
      }
    });
  }
}

// Format file size to human-readable format
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + ' bytes';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  } else {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

// Helper to set input value if element exists
function setInputValue(id: string, value: string): void {
  const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
  if (element && value) {
    element.value = value;
  }
}

// Collect profile data from form
async function collectProfileData(): Promise<UserProfile> {
  const profile: UserProfile = {
    // Personal information
    name: getInputValue('profileName'),
    email: getInputValue('profileEmail'),
    phone: getInputValue('profilePhone'),
    
    // Address
    address: getInputValue('profileAddress'),
    city: getInputValue('profileCity'),
    state: getInputValue('profileState'),
    zipCode: getInputValue('profileZipCode'),
    
    // Professional information
    linkedin: getInputValue('profileLinkedin'),
    github: getInputValue('profileGithub'),
    portfolio: getInputValue('profilePortfolio'),
    yearsOfExperience: getInputValue('profileYearsOfExperience'),
    education: getInputValue('profileEducation'),
    skills: getInputValue('profileSkills')
  };
  
  // Handle resume file
  const resumeInput = document.getElementById('profileResume') as HTMLInputElement;
  if (resumeInput && resumeInput.files && resumeInput.files.length > 0) {
    const file = resumeInput.files[0];
    
    try {
      // Read file as base64
      const base64Data = await readFileAsBase64(file);
      
      profile.resumeData = base64Data;
      profile.resumeFileName = file.name;
      profile.resumeFileType = file.type;
    } catch (error) {
      console.error('Error reading resume file:', error);
    }
  }
  
  return profile;
}

// Read file as base64
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    
    reader.onerror = () => {
      reject(reader.error);
    };
    
    reader.readAsDataURL(file);
  });
}

// Helper to get input value
function getInputValue(id: string): string {
  const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
  return element ? element.value : '';
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
            
            const tabId = tabs[0].id;
            
            // Check if the form has resume fields
            chrome.tabs.sendMessage(tabId, { action: 'findJobForm' }, async (response) => {
              if (response && response.success) {
                await showProfileManager(response.hasResumeField);
                addAutofillButton(tabId, statusElement);
              } else {
                await showProfileManager(false);
                addAutofillButton(tabId, statusElement);
              }
            });
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