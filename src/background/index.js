// Background script for AI-powered resume tailor
import { ChatOpenAI } from '@langchain/openai';
import { JobRequirementExtractor } from '../services/jobRequirementExtractor';
import { ResumeSkillMatcher } from '../services/resumeSkillMatcher';
import { ContentGenerator } from '../services/contentGenerator';
import { QualityEvaluator } from '../services/qualityEvaluator';
// Import PDF.js - this will be loaded via script tag in popup.html

// Initialize the background service
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI-Powered Resume Tailor extension installed');
  
  // Set default settings
  chrome.storage.local.set({
    autoExtract: true,
    saveHistory: true
  });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  // Make sure we handle errors properly
  try {
    if (message.action === 'tailorResume') {
      tailorResume(message.data)
        .then(result => {
          sendResponse(result);
        })
        .catch(error => {
          console.error('Error in tailorResume:', error);
          sendResponse({ success: false, error: error.message || 'Unknown error occurred' });
        });
      
      // Return true to indicate async response
      return true;
    }
    
    // Handle PDF parsing
    if (message.action === 'parsePDF') {
      parsePDF(message.data)
        .then(result => {
          sendResponse(result);
        })
        .catch(error => {
          console.error('Error parsing PDF:', error);
          sendResponse({ success: false, error: error.message || 'Failed to parse PDF' });
        });
      
      // Return true to indicate async response
      return true;
    }
    
    // Add a ping/pong mechanism to check if the background script is alive
    if (message.action === 'ping') {
      setTimeout(() => {
        sendResponse({ status: 'pong' });
      }, 100);
      return true;
    }
    
    // Check if this is a message we should handle
    if (message && message.action) {
      switch (message.action) {
        case 'parseResumeText':
          handleResumeTextParsing(message.data, sendResponse);
          return true; // Required to use sendResponse asynchronously
        
        // Add more message handlers as needed
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
    sendResponse({ success: false, error: error.message || 'Unknown error occurred' });
    return true;
  }
});

// Function to parse PDF files
async function parsePDF({ pdfBuffer }) {
  try {
    // Simple text extraction from PDF using browser APIs
    // This is a simplified version that works for basic text PDFs
    const text = await extractTextFromPDF(pdfBuffer);
    
    // Process with LLM if possible
    try {
      const structuredData = await parseResumeWithLLM(text);
      
      // Return both raw text and structured data
      return {
        success: true,
        text: text,
        structuredData: structuredData,
        info: {
          pages: 1,
          metadata: {}
        }
      };
    } catch (llmError) {
      console.warn('LLM parsing failed, returning only text content:', llmError);
      
      // If LLM fails, still return the text
      return {
        success: true,
        text: text,
        structuredData: null,
        error: llmError.message,
        info: {
          pages: 1,
          metadata: {}
        }
      };
    }
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF: ' + error.message);
  }
}

// Extract text from PDF using browser-compatible approach
async function extractTextFromPDF(arrayBuffer) {
  // Convert raw text (which might include PDF syntax) to something more readable
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(arrayBuffer);
  
  // Extract text content, which will be a simplistic approach
  // Remove PDF syntax markers and keep only visible text
  let extractedText = text
    .replace(/%PDF-.*?(\r?\n|\r)/g, '')  // Remove PDF header
    .replace(/endobj.*?(\r?\n|\r)/g, '\n')  // Remove PDF objects
    .replace(/stream.*?endstream/gs, '')  // Remove binary streams
    .replace(/[\x00-\x1F\x7F-\xFF]/g, ' ')  // Remove control and non-ASCII chars
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim();
  
  // If the above basic extraction doesn't yield good results,
  // we'll return a message prompting the user to try text input instead
  if (extractedText.length < 50 || extractedText.includes('/Type /Page')) {
    return "PDF text extraction was limited. For better results, please copy and paste the resume text manually.";
  }
  
  return extractedText;
}

/**
 * Uses OpenAI to parse resume text into structured data
 * @param {string} resumeText - The raw resume text to parse
 * @returns {Object} - Structured resume data
 */
async function parseResumeWithLLM(resumeText) {
  // Check if API key is available
  const { openaiApiKey } = await chrome.storage.local.get('openaiApiKey');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not found. Please add it in the settings.');
  }
  
  try {
    const systemPrompt = `
      You are a professional resume parser. Extract structured information from the resume text provided.
      Return ONLY a JSON object with the following structure:
      {
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "phone number",
        "location": "City, State",
        "summary": "Professional summary",
        "skills": ["Skill 1", "Skill 2", ...],
        "experience": [
          {
            "title": "Job Title",
            "company": "Company Name",
            "date": "Start Date - End Date",
            "description": "Job description"
          },
          ...
        ],
        "education": [
          {
            "degree": "Degree Name",
            "school": "School Name",
            "date": "Graduation Date",
            "gpa": "GPA (if available)"
          },
          ...
        ]
      }
      
      If any field is not found in the resume, omit it from the JSON or use an empty array/string as appropriate.
      Do not include any explanatory text, just return the JSON object.
    `;
    
    const userPrompt = `Parse the following resume into structured data:\n\n${resumeText}`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    const content = result.choices[0].message.content;
    
    // Try to parse the JSON response
    try {
      // Remove any markdown code blocks if present
      const jsonContent = content.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Error parsing LLM response as JSON:', parseError);
      throw new Error('Failed to parse LLM response as structured data');
    }
  } catch (error) {
    console.error('Error in parseResumeWithLLM:', error);
    throw error;
  }
}

// Main function to tailor resume using AI
async function tailorResume({ resume, jobDescription }) {
  try {
    console.log('Starting resume tailoring process');
    
    // Get API key from storage
    const { apiKey } = await chrome.storage.local.get('apiKey');
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }
    
    // In a real implementation, this would use LangChain and OpenAI
    // For demo purposes, we'll simulate the AI processing with timeouts
    
    // 1. Extract job requirements
    console.log('Extracting job requirements...');
    const jobRequirements = await simulateAIProcessing(() => {
      // This would use the JobRequirementExtractor in a real implementation
      return extractJobRequirements(jobDescription);
    });
    
    // 2. Match resume skills with job requirements
    console.log('Matching resume skills with job requirements...');
    const skillMatches = await simulateAIProcessing(() => {
      // This would use the ResumeSkillMatcher in a real implementation
      return matchSkills(resume, jobRequirements);
    });
    
    // 3. Generate tailored content
    console.log('Generating tailored content...');
    const tailoredResume = await simulateAIProcessing(() => {
      // This would use the ContentGenerator in a real implementation
      return generateTailoredResume(resume, jobRequirements, skillMatches);
    });
    
    // 4. Evaluate quality
    console.log('Evaluating quality...');
    const qualityCheck = await simulateAIProcessing(() => {
      // This would use the QualityEvaluator in a real implementation
      return checkQuality(resume, tailoredResume);
    });
    
    if (!qualityCheck.passes) {
      throw new Error('Quality check failed: ' + qualityCheck.reason);
    }
    
    return {
      success: true,
      tailoredResume,
      stats: {
        skillMatches: skillMatches.length,
        addedSkills: skillMatches.filter(match => match.action === 'add').length,
        enhancedSkills: skillMatches.filter(match => match.action === 'enhance').length
      }
    };
  } catch (error) {
    console.error('Error in tailorResume:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to simulate AI processing with a delay
function simulateAIProcessing(processingFn) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(processingFn());
    }, 1000);
  });
}

// Mock implementation of job requirement extraction
function extractJobRequirements(jobDescription) {
  // In real implementation, this would use NLP to extract structured requirements
  const requirements = {
    technicalSkills: [],
    softSkills: [],
    experience: [],
    education: []
  };
  
  // Very basic keyword extraction - this would be much more sophisticated with AI
  if (jobDescription.match(/javascript|js|frontend|front-end/i)) {
    requirements.technicalSkills.push('JavaScript');
  }
  
  if (jobDescription.match(/react|reactjs|react\.js/i)) {
    requirements.technicalSkills.push('React');
  }
  
  if (jobDescription.match(/node|nodejs|node\.js|backend|back-end/i)) {
    requirements.technicalSkills.push('Node.js');
  }
  
  if (jobDescription.match(/python/i)) {
    requirements.technicalSkills.push('Python');
  }
  
  if (jobDescription.match(/team|collaborate|collaboration/i)) {
    requirements.softSkills.push('Team Collaboration');
  }
  
  if (jobDescription.match(/communicate|communication/i)) {
    requirements.softSkills.push('Communication');
  }
  
  if (jobDescription.match(/problem.solv/i)) {
    requirements.softSkills.push('Problem Solving');
  }
  
  // Extract experience requirements
  const expMatch = jobDescription.match(/(\d+)[+]?\s+years?\s+(?:of\s+)?experience/i);
  if (expMatch) {
    requirements.experience.push(`${expMatch[1]}+ years of experience`);
  }
  
  // Extract education requirements
  if (jobDescription.match(/bachelor'?s|bachelor|bs|ba/i)) {
    requirements.education.push("Bachelor's Degree");
  }
  
  if (jobDescription.match(/master'?s|master|ms|ma/i)) {
    requirements.education.push("Master's Degree");
  }
  
  return requirements;
}

// Mock implementation of skill matching
function matchSkills(resume, jobRequirements) {
  const matches = [];
  
  // This is a very simplified version - real implementation would use AI to understand context
  jobRequirements.technicalSkills.forEach(skill => {
    const regex = new RegExp(skill, 'i');
    if (resume.match(regex)) {
      matches.push({
        skill,
        action: 'enhance', // Skill exists but could be enhanced
        confidence: 0.8
      });
    } else {
      matches.push({
        skill,
        action: 'add', // Skill doesn't exist and should be added if applicable
        confidence: 0.6
      });
    }
  });
  
  jobRequirements.softSkills.forEach(skill => {
    const regex = new RegExp(skill, 'i');
    if (resume.match(regex)) {
      matches.push({
        skill,
        action: 'enhance',
        confidence: 0.7
      });
    } else {
      matches.push({
        skill,
        action: 'add',
        confidence: 0.5
      });
    }
  });
  
  return matches;
}

// Mock implementation of tailored resume generation
function generateTailoredResume(resume, jobRequirements, skillMatches) {
  // This is a very simplified version - real implementation would use AI to rewrite sections
  let tailoredResume = resume;
  
  // Simulate enhancing existing skills by adding keywords
  skillMatches.forEach(match => {
    if (match.action === 'enhance') {
      // Find places where skill is mentioned and enhance description
      const regex = new RegExp(`(.*${match.skill}.*)`, 'i');
      tailoredResume = tailoredResume.replace(regex, '$1 (Expert level)');
    }
  });
  
  // Add section for skills that are missing but relevant
  const skillsToAdd = skillMatches
    .filter(match => match.action === 'add')
    .map(match => match.skill);
  
  if (skillsToAdd.length > 0) {
    const additionalSkillsSection = `
      
Additional Skills:
${skillsToAdd.map(skill => `- ${skill} (Working knowledge)`).join('\n')}
    `;
    
    // Try to add after a "Skills" section if it exists
    if (tailoredResume.match(/skills:/i)) {
      tailoredResume = tailoredResume.replace(
        /skills:(.*?)(\n\n|\n[A-Z])/i,
        `Skills:$1${additionalSkillsSection}$2`
      );
    } else {
      // Otherwise add at the end
      tailoredResume += additionalSkillsSection;
    }
  }
  
  // Add tailored summary at the top
  const summary = generateSummary(jobRequirements);
  if (!tailoredResume.match(/summary:|profile:|objective:/i)) {
    tailoredResume = `${summary}\n\n${tailoredResume}`;
  }
  
  return tailoredResume;
}

// Generate a tailored summary
function generateSummary(jobRequirements) {
  const techSkills = jobRequirements.technicalSkills.join(', ');
  const softSkills = jobRequirements.softSkills.join(', ');
  
  return `Professional Summary:
Experienced professional with expertise in ${techSkills}. Strong ${softSkills} skills with a proven track record of delivering high-quality results.`;
}

// Mock implementation of quality checking
function checkQuality(originalResume, tailoredResume) {
  // In a real implementation, this would check for:
  // 1. No fabricated experiences
  // 2. No contradictions with original resume
  // 3. Grammar and style consistency
  
  const passes = true;
  const reason = '';
  
  return { passes, reason };
}

/**
 * Handles parsing resume text into structured data using the OpenAI API
 * @param {Object} data - Contains the resume text
 * @param {Function} sendResponse - Function to send response back to caller
 */
async function handleResumeTextParsing(data, sendResponse) {
  try {
    const { resumeText } = data;
    
    if (!resumeText || typeof resumeText !== 'string') {
      sendResponse({ success: false, error: 'Invalid resume text provided' });
      return;
    }
    
    // Use OpenAI API to parse the resume text
    const structuredData = await parseResumeWithLLM(resumeText);
    
    // Send back both the raw text and structured data
    sendResponse({
      success: true,
      structuredData: structuredData
    });
    
  } catch (error) {
    console.error('Error parsing resume text:', error);
    sendResponse({ 
      success: false, 
      error: error.message || 'Failed to parse resume text'
    });
  }
}

// Also update the PDF parser to use LLM parsing for structured data
async function handleParsePDF(data, sendResponse) {
  try {
    // ... existing code ...
    
    // After getting the text from PDF, also parse it with LLM
    let structuredData = null;
    try {
      structuredData = await parseResumeWithLLM(text);
    } catch (parseError) {
      console.warn('Error parsing PDF with LLM:', parseError);
      // Continue even if LLM parsing fails
    }
    
    sendResponse({
      success: true,
      text: text,
      structuredData: structuredData
    });
    
    // ... existing code ...
  } catch (error) {
    // ... existing error handling ...
  }
} 