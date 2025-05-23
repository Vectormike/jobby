import { Options, UserProfile, JobFormData, RecentJobForms } from '../types';

/**
 * Saves user options to Chrome storage
 */
export function saveOptions(options: Options): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ options }, () => {
      console.log('Options saved:', options);
      resolve();
    });
  });
}

/**
 * Gets user options from Chrome storage
 */
export function getOptions(): Promise<Options> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('options', (data) => {
      const options = data.options || { enabled: true, theme: 'light' };
      resolve(options);
    });
  });
}

/**
 * Saves user profile to Chrome storage
 */
export function saveUserProfile(profile: UserProfile): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ userProfile: profile }, () => {
      console.log('Profile saved:', profile);
      resolve();
    });
  });
}

/**
 * Gets user profile from Chrome storage
 */
export function getUserProfile(): Promise<UserProfile> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('userProfile', (data) => {
      const profile = data.userProfile || { name: '', email: '' };
      resolve(profile);
    });
  });
}

/**
 * Saves job form data to local storage
 */
export function saveJobFormData(url: string, formFound: boolean): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get('recentJobForms', (data) => {
      const recentJobForms: RecentJobForms = data.recentJobForms || {};
      
      // Add or update the job form data
      recentJobForms[url] = {
        url,
        formFound,
        timestamp: Date.now()
      };
      
      // Clean up old entries (older than 1 day)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      for (const storedUrl in recentJobForms) {
        if (recentJobForms[storedUrl].timestamp && recentJobForms[storedUrl].timestamp < oneDayAgo) {
          delete recentJobForms[storedUrl];
        }
      }
      
      // Save updated data
      chrome.storage.local.set({ recentJobForms }, () => {
        console.log('Job form data saved for:', url);
        resolve();
      });
    });
  });
}

/**
 * Gets job form data for a specific URL
 */
export function getJobFormData(url: string): Promise<JobFormData | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get('recentJobForms', (data) => {
      const recentJobForms: RecentJobForms = data.recentJobForms || {};
      const formData = recentJobForms[url] || null;
      resolve(formData);
    });
  });
} 