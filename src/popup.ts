// Popup script that runs when the extension icon is clicked
import { Options, StorageData, UserProfile } from './types';
import { saveOptions, getOptions, saveUserProfile, getUserProfile, getJobFormData, getAllAIResponses } from './services/storageService';
import { generateAIResponse, setAPIKey, getAPIKey, setAIService, getAIService } from './services/aiService';

console.log('Popup script loaded');

// Function to initialize the popup UI
async function initPopup(): Promise<void> {
  const analyzeButton = document.getElementById('analyzeButton') as HTMLButtonElement;
  const toggleSwitch = document.getElementById('toggleEnabled') as HTMLInputElement;
  const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
  const statusElement = document.getElementById('status') as HTMLDivElement;
  
  // AI service elements
  const aiServiceSelect = document.getElementById('aiServiceSelect') as HTMLSelectElement;
  const openaiOptions = document.getElementById('openaiOptions') as HTMLDivElement;
  const openaiApiKeyInput = document.getElementById('openaiApiKey') as HTMLInputElement;
  const saveApiKeyButton = document.getElementById('saveApiKey') as HTMLButtonElement;
  const deepseekOptions = document.getElementById('deepseekOptions') as HTMLDivElement;
  const deepseekApiKeyInput = document.getElementById('deepseekApiKey') as HTMLInputElement;
  const saveDeepseekApiKeyButton = document.getElementById('saveDeepseekApiKey') as HTMLButtonElement;
  
  if (analyzeButton && toggleSwitch && themeSelect && 
      aiServiceSelect && openaiOptions && openaiApiKeyInput && saveApiKeyButton &&
      deepseekOptions && deepseekApiKeyInput && saveDeepseekApiKeyButton) {
    try {
      // Load saved options
      const options = await getOptions();
      
      // Update UI with saved options
      toggleSwitch.checked = options.enabled;
      themeSelect.value = options.theme;
      
      // Set AI service
      aiServiceSelect.value = options.aiService || 'openai';
      toggleAIServiceOptions(aiServiceSelect.value);
      
      // Set API key if available
      if (options.apiKey) {
        if (options.aiService === 'openai') {
          openaiApiKeyInput.value = '••••••••••••••••••••••••••';
        } else if (options.aiService === 'deepseek') {
          deepseekApiKeyInput.value = '••••••••••••••••••••••••••';
        }
        setAPIKey(options.apiKey);
      } else if (options.openaiApiKey) {
        // For backward compatibility
        openaiApiKeyInput.value = '••••••••••••••••••••••••••';
        setAPIKey(options.openaiApiKey);
      }
      
      // Configure AI service
      setAIService(options.aiService || 'openai');
      
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
    
    // Toggle between AI service options
    aiServiceSelect.addEventListener('change', () => {
      toggleAIServiceOptions(aiServiceSelect.value);
      saveOptionsHandler();
    });
    
    // Save OpenAI API key when clicked
    saveApiKeyButton.addEventListener('click', async () => {
      const apiKey = openaiApiKeyInput.value.trim();
      
      if (apiKey === '••••••••••••••••••••••••••') {
        // User didn't change the masked key, so keep the existing one
        statusElement.textContent = 'API key unchanged.';
        return;
      }
      
      if (!apiKey) {
        statusElement.textContent = 'Please enter an API key.';
        return;
      }
      
      try {
        // Get current options
        const options = await getOptions();
        
        // Update with new API key
        options.apiKey = apiKey;
        options.aiService = 'openai';
        // Remove old key format for consistency
        delete options.openaiApiKey;
        
        // Save to storage
        await saveOptions(options);
        
        // Update the service
        setAPIKey(apiKey);
        setAIService('openai');
        
        // Mask the input for security
        openaiApiKeyInput.value = '••••••••••••••••••••••••••';
        
        statusElement.textContent = 'OpenAI API key saved successfully!';
        setTimeout(() => {
          statusElement.textContent = '';
        }, 2000);
      } catch (error) {
        console.error('Error saving API key:', error);
        statusElement.textContent = 'Error saving API key.';
      }
    });
    
    // Save DeepSeek API key when clicked
    saveDeepseekApiKeyButton.addEventListener('click', async () => {
      const apiKey = deepseekApiKeyInput.value.trim();
      
      if (apiKey === '••••••••••••••••••••••••••') {
        // User didn't change the masked key, so keep the existing one
        statusElement.textContent = 'API key unchanged.';
        return;
      }
      
      if (!apiKey) {
        statusElement.textContent = 'Please enter an API key.';
        return;
      }
      
      try {
        // Get current options
        const options = await getOptions();
        
        // Update with new API key
        options.apiKey = apiKey;
        options.aiService = 'deepseek';
        
        // Save to storage
        await saveOptions(options);
        
        // Update the service
        setAPIKey(apiKey);
        setAIService('deepseek');
        
        // Mask the input for security
        deepseekApiKeyInput.value = '••••••••••••••••••••••••••';
        
        statusElement.textContent = 'DeepSeek API key saved successfully!';
        setTimeout(() => {
          statusElement.textContent = '';
        }, 2000);
      } catch (error) {
        console.error('Error saving API key:', error);
        statusElement.textContent = 'Error saving API key.';
      }
    });
    
    // Save options when changed
    toggleSwitch.addEventListener('change', saveOptionsHandler);
    themeSelect.addEventListener('change', saveOptionsHandler);
    
    // Check if we have recent job form data
    await checkForRecentJobForm();
  }
}

// Toggle between AI service options based on selection
function toggleAIServiceOptions(service: string): void {
  const openaiOptions = document.getElementById('openaiOptions');
  const deepseekOptions = document.getElementById('deepseekOptions');
  
  if (openaiOptions && deepseekOptions) {
    if (service === 'openai') {
      openaiOptions.style.display = 'block';
      deepseekOptions.style.display = 'none';
    } else if (service === 'deepseek') {
      openaiOptions.style.display = 'none';
      deepseekOptions.style.display = 'block';
    }
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
  
  // Education details
  setInputValue('profileDegree', profile.degree);
  setInputValue('profileDiscipline', profile.discipline);
  setInputValue('profileSchool', profile.school);
  setInputValue('profileEducationStartMonth', profile.educationStartMonth);
  setInputValue('profileEducationStartYear', profile.educationStartYear);
  setInputValue('profileEducationEndMonth', profile.educationEndMonth);
  setInputValue('profileEducationEndYear', profile.educationEndYear);
  setInputValue('profileEducation', profile.education);
  
  // Skills
  setInputValue('profileSkills', profile.skills);
  
  // Personal details
  setInputValue('profileGender', profile.gender);
  
  // Self-identification
  setInputValue('profileHispanicLatino', profile.hispanicLatino);
  setInputValue('profileVeteranStatus', profile.veteranStatus);
  setInputValue('profileDisabilityStatus', profile.disabilityStatus);
  
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
    
    // Education details
    degree: getInputValue('profileDegree'),
    discipline: getInputValue('profileDiscipline'),
    school: getInputValue('profileSchool'),
    educationStartMonth: getInputValue('profileEducationStartMonth'),
    educationStartYear: getInputValue('profileEducationStartYear'),
    educationEndMonth: getInputValue('profileEducationEndMonth'),
    educationEndYear: getInputValue('profileEducationEndYear'),
    education: getInputValue('profileEducation'),
    
    // Skills
    skills: getInputValue('profileSkills'),
    
    // Personal details
    gender: getInputValue('profileGender'),
    
    // Self-identification
    hispanicLatino: getInputValue('profileHispanicLatino'),
    veteranStatus: getInputValue('profileVeteranStatus'),
    disabilityStatus: getInputValue('profileDisabilityStatus')
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
      // Update status first to show we're working
      statusElement.textContent = 'Attempting to autofill form...';
      
      // Send autofill message to content script
      chrome.tabs.sendMessage(tabId, { 
        action: 'autofillWithStoredProfile'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          statusElement.textContent = 'Error: Could not communicate with the page. Try refreshing.';
          return;
        }
        
        if (response && response.success) {
          const fieldsFilled = response.fieldsFilled || 0;
          const essaysDetected = response.essaysDetected || 0;
          
          if (fieldsFilled > 0 || essaysDetected > 0) {
            let statusMessage = `Form autofilled! (${fieldsFilled} fields filled`;
            
            if (essaysDetected > 0) {
              statusMessage += `, ${essaysDetected} essay ${essaysDetected === 1 ? 'question' : 'questions'} answered with AI`;
            }
            
            statusMessage += ')';
            statusElement.textContent = statusMessage;
          } else {
            statusElement.textContent = 'Could not autofill any fields. The form structure may not be recognized.';
            
            // Suggest a solution
            setTimeout(() => {
              statusElement.textContent = 'Try clicking "Find Job Application Form" button again or refresh the page.';
            }, 3000);
          }
        } else {
          let errorMessage = 'Error autofilling form.';
          if (response && response.error) {
            errorMessage += ` ${response.error}`;
          }
          statusElement.textContent = errorMessage;
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
  const aiServiceSelect = document.getElementById('aiServiceSelect') as HTMLSelectElement;
  
  // Get current options to preserve API key
  const currentOptions = await getOptions();
  
  const options: Options = {
    enabled: toggleSwitch.checked,
    theme: themeSelect.value,
    apiKey: currentOptions.apiKey, // Preserve existing API key
    aiService: aiServiceSelect.value as 'openai' | 'deepseek' // Cast to the correct type
  };
  
  try {
    // Save to Chrome storage
    await saveOptions(options);
    
    // Update AI service
    setAIService(options.aiService || 'openai');
    
    // Apply theme immediately
    document.body.setAttribute('data-theme', options.theme);
    
    // Show saved message
    const statusElement = document.getElementById('status') as HTMLDivElement;
    if (statusElement) {
      statusElement.textContent = 'Options saved!';
      
      // Add note about mock responses if no API key
      if (!currentOptions.apiKey) {
        setTimeout(() => {
          statusElement.textContent = 'No API key set. Mock responses will be used.';
        }, 1500);
      } else {
        setTimeout(() => {
          statusElement.textContent = '';
        }, 1500);
      }
    }
  } catch (error) {
    console.error('Error saving options:', error);
  }
}

// Function to initialize the AI assistant
async function initAIAssistant(): Promise<void> {
  const generateButton = document.getElementById('generateAIResponse') as HTMLButtonElement;
  const questionInput = document.getElementById('aiQuestion') as HTMLTextAreaElement;
  const contextInput = document.getElementById('aiContext') as HTMLTextAreaElement;
  const responseContainer = document.getElementById('aiResponseContainer') as HTMLDivElement;
  const responseTextarea = document.getElementById('aiResponse') as HTMLTextAreaElement;
  const copyButton = document.getElementById('copyAIResponse') as HTMLButtonElement;
  const historyContainer = document.getElementById('aiResponseHistory') as HTMLDivElement;
  const responseList = document.getElementById('aiResponseList') as HTMLDivElement;
  
  if (generateButton && questionInput && responseContainer && responseTextarea && copyButton) {
    // Load previous responses
    await loadPreviousResponses(responseList, historyContainer);
    
    // Set up the generate button
    generateButton.addEventListener('click', async () => {
      const question = questionInput.value.trim();
      if (!question) {
        return;
      }
      
      // Show loading state
      generateButton.disabled = true;
      generateButton.innerHTML = '<span class="loading-spinner"></span> Generating...';
      
      try {
        // Get user profile for context
        const profile = await getUserProfile();
        
        // Generate the response
        const response = await generateAIResponse(
          question,
          contextInput.value.trim(),
          profile
        );
        
        // Display the response
        responseTextarea.value = response;
        responseContainer.style.display = 'block';
        
        // Refresh the response history
        await loadPreviousResponses(responseList, historyContainer);
      } catch (error) {
        console.error('Error generating response:', error);
      } finally {
        // Reset button state
        generateButton.disabled = false;
        generateButton.textContent = 'Generate Response';
      }
    });
    
    // Set up copy button
    copyButton.addEventListener('click', () => {
      responseTextarea.select();
      document.execCommand('copy');
      
      // Show copied message
      const originalText = copyButton.textContent;
      copyButton.textContent = 'Copied!';
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 1500);
    });
  }
}

// Load previous AI responses
async function loadPreviousResponses(
  responseList: HTMLElement, 
  historyContainer: HTMLElement
): Promise<void> {
  try {
    const responses = await getAllAIResponses();
    const responseKeys = Object.keys(responses);
    
    if (responseKeys.length > 0) {
      // Clear previous list
      responseList.innerHTML = '';
      historyContainer.style.display = 'block';
      
      // Create response items (limit to 5 most recent)
      const recentKeys = responseKeys.slice(-5);
      recentKeys.forEach(key => {
        const prompt = responses[key];
        const item = document.createElement('div');
        item.className = 'ai-response-item';
        
        const question = document.createElement('div');
        question.className = 'ai-response-question';
        question.textContent = prompt.question;
        
        const responseText = document.createElement('div');
        responseText.className = 'ai-response-text';
        responseText.textContent = prompt.response || '';
        
        const buttons = document.createElement('div');
        buttons.className = 'ai-action-buttons';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'ai-action-button';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(prompt.response || '');
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
          }, 1500);
        });
        
        buttons.appendChild(copyBtn);
        item.appendChild(question);
        item.appendChild(responseText);
        item.appendChild(buttons);
        responseList.appendChild(item);
      });
    } else {
      historyContainer.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading previous responses:', error);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await initPopup();
  await initAIAssistant();
}); 