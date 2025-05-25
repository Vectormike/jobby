import { Options, StorageData, UserProfile, JobFormData, RecentJobForms } from '../types';

const STORAGE_KEYS = {
  OPTIONS: 'options',
  USER_PROFILE: 'userProfile',
  JOB_FORMS: 'jobForms'
};

// Default options
const DEFAULT_OPTIONS: Options = {
  enabled: true,
  theme: 'light'
};

// Default empty user profile
const DEFAULT_USER_PROFILE: UserProfile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  linkedin: '',
  github: '',
  portfolio: '',
  yearsOfExperience: '',
  education: '',
  skills: '',
  resumeData: undefined,
  resumeFileName: undefined,
  resumeFileType: undefined
};

/**
 * Saves user options to Chrome storage
 */
export async function saveOptions(options: Options): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEYS.OPTIONS]: options }, () => {
      console.log('Options saved:', options);
      resolve();
    });
  });
}

/**
 * Gets user options from Chrome storage
 */
export async function getOptions(): Promise<Options> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.OPTIONS], (result) => {
      const options = result[STORAGE_KEYS.OPTIONS] as Options || DEFAULT_OPTIONS;
      console.log('Options loaded:', options);
      resolve(options);
    });
  });
}

/**
 * Saves user profile to Chrome storage
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEYS.USER_PROFILE]: profile }, () => {
      console.log('User profile saved:', profile);
      resolve();
    });
  });
}

/**
 * Gets user profile from Chrome storage
 */
export async function getUserProfile(): Promise<UserProfile> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.USER_PROFILE], (result) => {
      const profile = result[STORAGE_KEYS.USER_PROFILE] as UserProfile || DEFAULT_USER_PROFILE;
      console.log('User profile loaded:', profile);
      resolve(profile);
    });
  });
}

/**
 * Saves job form data to Chrome storage
 */
export async function saveJobFormData(url: string, formFound: boolean): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.JOB_FORMS], (result) => {
      const jobForms = result[STORAGE_KEYS.JOB_FORMS] as RecentJobForms || {};
      
      // Update with new data
      jobForms[url] = {
        url,
        formFound,
        timestamp: Date.now()
      };
      
      // Save back to storage
      chrome.storage.local.set({ [STORAGE_KEYS.JOB_FORMS]: jobForms }, () => {
        console.log('Job form data saved for:', url);
        resolve();
      });
    });
  });
}

/**
 * Gets job form data for a specific URL
 */
export async function getJobFormData(url: string): Promise<JobFormData | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.JOB_FORMS], (result) => {
      const jobForms = result[STORAGE_KEYS.JOB_FORMS] as RecentJobForms || {};
      const data = jobForms[url] || null;
      console.log('Job form data loaded for:', url, data);
      resolve(data);
    });
  });
}

/**
 * Cleans up old job form data (older than 1 hour)
 */
export async function cleanupOldJobFormData(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.JOB_FORMS], (result) => {
      const jobForms = result[STORAGE_KEYS.JOB_FORMS] as RecentJobForms || {};
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      // Filter out old entries
      const updatedForms: RecentJobForms = {};
      Object.keys(jobForms).forEach((url) => {
        if (jobForms[url].timestamp && jobForms[url].timestamp > oneHourAgo) {
          updatedForms[url] = jobForms[url];
        }
      });
      
      // Save back to storage
      chrome.storage.local.set({ [STORAGE_KEYS.JOB_FORMS]: updatedForms }, () => {
        console.log('Old job form data cleaned up');
        resolve();
      });
    });
  });
} 