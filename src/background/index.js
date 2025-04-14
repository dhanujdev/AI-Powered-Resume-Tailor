// Background script for AI-powered resume tailor
import { ChatOpenAI } from '@langchain/openai';
import { JobRequirementExtractor } from '../services/jobRequirementExtractor';
import { ResumeSkillMatcher } from '../services/resumeSkillMatcher';
import { ContentGenerator } from '../services/contentGenerator';
import { QualityEvaluator } from '../services/qualityEvaluator';

// Initialize the background service
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI-Powered Resume Tailor extension installed');
  
  // Set default settings
  chrome.storage.local.set({
    autoExtract: true,
    saveHistory: true,
    serverUrl: 'http://localhost:3000' // Default server URL
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
async function parsePDF({ pdfData, fileName }) {
  try {
    console.log('Received PDF data of length:', pdfData?.length);
    
    // Verify we have the PDF data in array format
    if (!pdfData || !Array.isArray(pdfData)) {
      throw new Error('Invalid PDF data: Expected array of bytes');
    }
    
    // Retrieve the server URL from storage, with a default fallback
    const { serverUrl = 'http://localhost:3000' } = await chrome.storage.local.get('serverUrl');
    
    // Send the PDF data to our backend server for processing
    const apiUrl = `${serverUrl}/api/parse-pdf`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        pdfData,
        fileName 
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error processing PDF');
    }
    
    const result = await response.json();
    console.log('Server processed PDF successfully');
    
    return result;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF: ' + error.message);
  }
}

/**
 * Handles parsing resume text into structured data using the backend server
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
    
    // Retrieve the server URL from storage, with a default fallback
    const { serverUrl = 'http://localhost:3000' } = await chrome.storage.local.get('serverUrl');
    
    // Send resume text to backend server for processing
    const apiUrl = `${serverUrl}/api/parse-resume-text`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resumeText })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error processing resume text');
    }
    
    const result = await response.json();
    console.log('Server processed resume text successfully');
    
    // Send back the structured data
    sendResponse({
      success: true,
      structuredData: result.structuredData
    });
    
  } catch (error) {
    console.error('Error parsing resume text:', error);
    sendResponse({ 
      success: false, 
      error: error.message || 'Failed to parse resume text'
    });
  }
}

// Main function to tailor resume using AI
async function tailorResume({ resume, structuredData, jobDescription }) {
  try {
    console.log('Starting resume tailoring process');
    
    // Get API key from storage
    const { apiKey } = await chrome.storage.local.get('apiKey');
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }
    
    // Log if we have structured data available
    const hasStructuredData = structuredData !== null && structuredData !== undefined;
    console.log(`Tailoring with ${hasStructuredData ? 'structured' : 'raw text'} resume data`);
    
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
      // Use structured data if available for better matching
      if (hasStructuredData) {
        return matchSkillsStructured(structuredData, jobRequirements);
      } else {
        // Fall back to text-based matching
        return matchSkills(resume, jobRequirements);
      }
    });
    
    // 3. Generate tailored content
    console.log('Generating tailored content...');
    const tailoredResume = await simulateAIProcessing(() => {
      // Use structured data if available for better tailoring
      if (hasStructuredData) {
        return generateTailoredResumeStructured(structuredData, resume, jobRequirements, skillMatches);
      } else {
        // Fall back to text-based tailoring
        return generateTailoredResume(resume, jobRequirements, skillMatches);
      }
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

// New function for structured data skill matching
function matchSkillsStructured(structuredData, jobRequirements) {
  const matches = [];
  
  // Extract skills from structured data
  const resumeSkills = structuredData.skills || [];
  const resumeSkillsLower = resumeSkills.map(skill => skill.toLowerCase());
  
  // This is a more advanced version that uses the structured data
  jobRequirements.technicalSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    const hasSkill = resumeSkillsLower.some(resumeSkill => 
      resumeSkill.includes(skillLower) || skillLower.includes(resumeSkill)
    );
    
    if (hasSkill) {
      matches.push({
        skill,
        action: 'enhance', // Skill exists but could be enhanced
        confidence: 0.9 // Higher confidence with structured data
      });
    } else {
      matches.push({
        skill,
        action: 'add', // Skill doesn't exist and should be added if applicable
        confidence: 0.7
      });
    }
  });
  
  // Match soft skills
  jobRequirements.softSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    const hasSkill = resumeSkillsLower.some(resumeSkill => 
      resumeSkill.includes(skillLower) || skillLower.includes(resumeSkill)
    );
    
    if (hasSkill) {
      matches.push({
        skill,
        action: 'enhance',
        confidence: 0.85
      });
    } else {
      matches.push({
        skill,
        action: 'add',
        confidence: 0.6
      });
    }
  });
  
  return matches;
}

// New function for structured resume tailoring
function generateTailoredResumeStructured(structuredData, originalResume, jobRequirements, skillMatches) {
  // In a real implementation, this would use AI to intelligently rebuild the resume
  // For demo purposes, we'll do some simple enhancements
  
  // Start with a generated summary based on job requirements and structured data
  let tailoredResume = generateStructuredSummary(structuredData, jobRequirements);
  
  // Add skills section with enhancements
  tailoredResume += '\n\nSKILLS\n';
  
  // First add existing skills with enhancements
  const existingSkills = structuredData.skills || [];
  existingSkills.forEach(skill => {
    // Check if this skill matches a job requirement
    const match = skillMatches.find(m => 
      m.skill.toLowerCase() === skill.toLowerCase() || 
      skill.toLowerCase().includes(m.skill.toLowerCase())
    );
    
    if (match && match.action === 'enhance') {
      tailoredResume += `• ${skill} (Expert level)\n`;
    } else {
      tailoredResume += `• ${skill}\n`;
    }
  });
  
  // Then add missing skills that should be added
  const skillsToAdd = skillMatches
    .filter(match => match.action === 'add' && match.confidence > 0.65)
    .map(match => match.skill);
  
  if (skillsToAdd.length > 0) {
    tailoredResume += '\nAdditional Relevant Skills:\n';
    skillsToAdd.forEach(skill => {
      tailoredResume += `• ${skill} (Working knowledge)\n`;
    });
  }
  
  // Add experience section
  if (structuredData.experience && structuredData.experience.length > 0) {
    tailoredResume += '\n\nEXPERIENCE\n';
    
    structuredData.experience.forEach(exp => {
      tailoredResume += `${exp.title} at ${exp.company} | ${exp.date}\n`;
      
      // Add the original description, with some keywords emphasized
      let description = exp.description;
      
      // Emphasize relevant skills in the description
      jobRequirements.technicalSkills.concat(jobRequirements.softSkills).forEach(skill => {
        const regex = new RegExp(`(${skill})`, 'gi');
        description = description.replace(regex, '$1 (relevant skill)');
      });
      
      tailoredResume += `${description}\n\n`;
    });
  }
  
  // Add education section
  if (structuredData.education && structuredData.education.length > 0) {
    tailoredResume += '\nEDUCATION\n';
    
    structuredData.education.forEach(edu => {
      tailoredResume += `${edu.degree} - ${edu.school} | ${edu.date}\n`;
      if (edu.gpa) {
        tailoredResume += `GPA: ${edu.gpa}\n`;
      }
      tailoredResume += '\n';
    });
  }
  
  return tailoredResume;
}

// Generate a tailored summary from structured data
function generateStructuredSummary(structuredData, jobRequirements) {
  const name = structuredData.name || 'Professional';
  const techSkills = jobRequirements.technicalSkills.join(', ');
  const softSkills = jobRequirements.softSkills.join(', ');
  
  // Extract years of experience from structured data if available
  let yearsOfExperience = 'Experienced';
  if (structuredData.experience && structuredData.experience.length > 0) {
    // Simple calculation - in a real implementation this would be more sophisticated
    yearsOfExperience = `${structuredData.experience.length}+ years of experience`;
  }
  
  return `${name}
${structuredData.email || ''} | ${structuredData.phone || ''} | ${structuredData.location || ''}

PROFESSIONAL SUMMARY
${yearsOfExperience} professional with expertise in ${techSkills}. Strong ${softSkills} skills with a proven track record of delivering high-quality results. ${structuredData.summary || ''}`;
} 