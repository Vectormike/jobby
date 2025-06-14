import { AIPrompt } from '../types';
import { saveAIResponse } from './storageService';

// Model configuration
const MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
const API_URL = 'https://api-inference.huggingface.co/models/' + MODEL;

// Resume data
let resumeData: string | null = null;

/**
 * Get the current model
 */
export function getModel(): string {
  return MODEL;
}

/**
 * Set the resume data
 */
export function setResumeData(resume: string): void {
  resumeData = resume;
}

/**
 * Get the resume data
 */
export function getResumeData(): string | null {
  return resumeData;
}

/**
 * Check if resume has been uploaded
 */
export function hasResume(): boolean {
  return resumeData !== null;
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
    if (!hasResume()) {
      throw new Error('Please upload your resume first before generating responses');
    }

    console.log('Generating AI response for question:', question);
    
    // Create a system prompt that includes the user's profile, context, and resume
    const systemPrompt = `
      You are an assistant helping a job applicant answer application questions.
      Based on the applicant's resume, profile, and the job context, generate a professional,
      concise, and personalized response that highlights relevant skills and experience.
      Keep responses truthful and authentic to the applicant's background.
      Use specific examples and achievements from the resume when relevant.
      
      Job context: ${context}
      
      Applicant profile:
      - Name: ${userProfile.name}
      - Experience: ${userProfile.yearsOfExperience}
      - Education: ${userProfile.degree} in ${userProfile.discipline} from ${userProfile.school}
      - Skills: ${userProfile.skills}
      
      Resume content:
      ${resumeData}
    `;

    // Make the API call to Hugging Face
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
      },
      body: JSON.stringify({
        inputs: `${systemPrompt}\n\nQuestion: ${question}`
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedResponse = Array.isArray(data) ? data[0]?.generated_text?.trim() : '';

    if (!generatedResponse) {
      throw new Error('No response generated from the model');
    }
    
    // Create a unique ID for this question
    const questionId = createQuestionId(question);
    
    // Save the response to storage
    await saveAIResponse(questionId, {
      question,
      context,
      response: generatedResponse
    });
    
    return generatedResponse;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return `Sorry, I was unable to generate a response. Please try again. ${error}`;
  }
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