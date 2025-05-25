// Types for options and storage
export interface Options {
  enabled: boolean;
  theme: string;
  openaiApiKey?: string;
  apiKey?: string; // Generic API key that can be used for any AI service
  aiService?: 'openai' | 'deepseek'; // Type of AI service to use
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
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  linkedin: string;
  github: string;
  portfolio: string;
  yearsOfExperience: string;
  education: string;
  skills: string;
  // Education details
  degree: string;
  discipline: string;
  school: string;
  educationStartYear: string;
  educationStartMonth: string;
  educationEndYear: string;
  educationEndMonth: string;
  // Personal details
  gender: string;
  // Self-identification
  hispanicLatino: string;
  veteranStatus: string;
  disabilityStatus: string;
  resumeData?: string; // Base64 encoded resume file
  resumeFileName?: string; // Original file name
  resumeFileType?: string; // MIME type of the resume
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

// Types for AI-assisted responses
export interface AIPrompt {
  question: string;
  context: string;
  response?: string;
}

export interface AIResponsesData {
  [questionId: string]: AIPrompt;
} 