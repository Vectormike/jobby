// Background script for the Chrome extension
import { Message } from './types';
import { saveJobFormData } from './services/storageService';

console.log('Background script loaded');

// Handle extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  // Initialize storage with default values
  chrome.storage.sync.set({ 
    options: {
      enabled: true,
      theme: 'light'
    }
  });
  
  // Initialize empty user profile
  chrome.storage.sync.set({
    userProfile: {
      name: '',
      email: ''
    }
  });
  
  // Initialize empty job forms collection
  chrome.storage.local.set({
    recentJobForms: {}
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('Message received in background:', message);
  
  if (message.action === 'getData') {
    // Example of fetching data from storage
    chrome.storage.sync.get('options', (data) => {
      sendResponse({ success: true, data: data.options });
    });
    return true; // Required for async sendResponse
  }
  
  // Handle job form detection
  if (message.action === 'jobFormFound' && sender.tab?.url) {
    const url = sender.tab.url;
    saveJobFormData(url, message.data.formFound)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error saving job form data:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
}); 