import { AIPrompt } from '../types';
import { saveAIResponse } from './storageService';

// API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-3.5-turbo'; // Default OpenAI model

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat'; // Use the appropriate DeepSeek model

// Service type
type AIService = 'openai' | 'deepseek';

// This API key should be stored securely and not in the code
// Initial value will be loaded from environment variables or storage
let API_KEY = '';
let AI_SERVICE: AIService = 'openai'; // Default to OpenAI

// Try to load API keys from environment if available (for development)
if (process.env.OPENAI_API_KEY) {
  API_KEY = process.env.OPENAI_API_KEY;
  AI_SERVICE = 'openai';
  console.log('OpenAI API key loaded from environment');
} else if (process.env.DEEPSEEK_API_KEY) {
  API_KEY = process.env.DEEPSEEK_API_KEY;
  AI_SERVICE = 'deepseek';
  console.log('DeepSeek API key loaded from environment');
}

/**
 * Set the API key
 */
export function setAPIKey(apiKey: string): void {
  API_KEY = apiKey;
}

/**
 * Get the API key
 */
export function getAPIKey(): string {
  return API_KEY;
}

/**
 * Set the AI service to use
 */
export function setAIService(service: AIService): void {
  AI_SERVICE = service;
}

/**
 * Get the current AI service
 */
export function getAIService(): AIService {
  return AI_SERVICE;
}

/**
 * Generate an AI-assisted response for a job application question
 */
export async function generateAIResponse(
  question: string, 
  context: string,
  userProfile: any
): Promise<string> {
  try {
    console.log('Generating AI response for question:', question);
    
    // Create a system prompt that includes the user's profile and context
    const systemPrompt = `
      You are an assistant helping a job applicant answer application questions.
      Based on the applicant's profile and the job context, generate a professional,
      concise, and personalized response that highlights relevant skills and experience.
      Keep responses truthful and authentic to the applicant's background.
      
      Job context: ${context}
      
      Applicant profile:
      - Name: ${userProfile.name}
      - Experience: ${userProfile.yearsOfExperience}
      - Education: ${userProfile.degree} in ${userProfile.discipline} from ${userProfile.school}
      - Skills: ${userProfile.skills}
    `;
    
    let response;
    
    // Choose which service to use
    if (API_KEY) {
      if (AI_SERVICE === 'openai') {
        response = await callOpenAIAPI(systemPrompt, question);
      } else if (AI_SERVICE === 'deepseek') {
        response = await callDeepSeekAPI(systemPrompt, question);
      }
    }
    
    // If no response was generated (no API key or service error), use mock responses
    if (!response) {
      console.log('No valid AI service configuration or error occurred, using mock responses');
      response = await mockAICall(systemPrompt, question);
    }
    
    // Create a unique ID for this question
    const questionId = createQuestionId(question);
    
    // Save the response to storage
    await saveAIResponse(questionId, {
      question,
      context,
      response
    });
    
    return response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return `Sorry, I was unable to generate a response. Please try again. ${error}`;
  }
}

/**
 * Call the OpenAI API to generate a response
 */
async function callOpenAIAPI(systemPrompt: string, question: string): Promise<string> {
  try {
    if (!API_KEY) {
      throw new Error('OpenAI API key not set');
    }
    
    const requestBody = {
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: question
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    };
    
    // Set a timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the response text
      const responseText = data.choices?.[0]?.message?.content?.trim() || '';
      
      if (!responseText) {
        throw new Error('Empty response from OpenAI API');
      }
      
      return responseText;
    } catch (error) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (err) {
    const error = err as Error;
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Call the DeepSeek API to generate a response
 */
async function callDeepSeekAPI(systemPrompt: string, question: string): Promise<string> {
  try {
    if (!API_KEY) {
      throw new Error('DeepSeek API key not set');
    }
    
    const requestBody = {
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: question
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    };
    
    // Set a timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the response text
      const responseText = data.choices?.[0]?.message?.content?.trim() || '';
      
      if (!responseText) {
        throw new Error('Empty response from DeepSeek API');
      }
      
      return responseText;
    } catch (error) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (err) {
    const error = err as Error;
    console.error('Error calling DeepSeek API:', error);
    throw error;
  }
}

/**
 * Mock function that simulates an AI API call
 * In a production environment, this would be replaced with a real API call
 */
async function mockAICall(systemPrompt: string, question: string): Promise<string> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a mock response based on the question type
  if (question.toLowerCase().includes('why are you a good fit')) {
    return `I believe I am a strong fit for this position because my background combines relevant technical skills with practical experience in the field. My education in computer science has provided me with a solid foundation in key technologies mentioned in the job description, and my previous roles have allowed me to apply these skills in real-world scenarios. I'm particularly drawn to this opportunity because it aligns with my career goals of working in a collaborative environment where I can contribute to innovative projects while continuing to grow professionally.`;
  }
  
  if (question.toLowerCase().includes('experience')) {
    return `Throughout my career, I've had the opportunity to work on a variety of projects that have strengthened my technical abilities and problem-solving skills. In my most recent role, I was responsible for developing and maintaining web applications that served thousands of users daily. This experience taught me how to write efficient, scalable code and how to collaborate effectively with cross-functional teams. I've consistently received positive feedback for my ability to communicate complex technical concepts clearly and to meet deadlines even under pressure.`;
  }
  
  // Generic response for other questions
  return `Based on my background and the requirements for this position, I believe I can make valuable contributions to your team. My combination of technical skills, education, and practical experience has prepared me well for this role. I'm excited about the opportunity to bring my expertise to your organization and to continue developing my professional capabilities in this dynamic field.`;
}

/**
 * Create a unique ID for a question to use as a storage key
 */
function createQuestionId(question: string): string {
  // Simplify the question and create a key
  return 'q_' + question
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 30);
} 