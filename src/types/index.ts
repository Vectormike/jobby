// Types for options and storage
export interface Options {
  enabled: boolean;
  theme: string;
}

export interface StorageData {
  options: Options;
}

// Types for job board detection
export interface JobBoardPattern {
  formSelector: string;
  nameFields: string[];
  emailFields: string[];
}

export interface JobBoardPatterns {
  [key: string]: JobBoardPattern;
}

// Types for user profile
export interface UserProfile {
  name: string;
  email: string;
}

// Types for job form data
export interface JobFormData {
  url: string;
  formFound: boolean;
  timestamp?: number;
}

export interface RecentJobForms {
  [url: string]: JobFormData;
}

// Message types
export interface Message {
  action: string;
  [key: string]: any;
}

export interface ResponseMessage {
  success: boolean;
  [key: string]: any;
} 