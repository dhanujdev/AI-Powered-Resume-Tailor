// Resume Skill Matcher Service
import { BaseChain } from 'langchain/chains';

export class ResumeSkillMatcher {
  constructor() {
    this.name = "match_resume_skills";
    this.description = "Matches resume skills with job requirements";
  }
  
  async _run(resume, jobRequirements) {
    try {
      console.log("Matching resume skills with job requirements");
      
      // In a real implementation, this would use LangChain to understand context
      const matches = this._matchSkills(resume, jobRequirements);
      
      return matches;
    } catch (error) {
      console.error("Error in ResumeSkillMatcher:", error);
      throw error;
    }
  }
  
  _matchSkills(resume, jobRequirements) {
    const matches = [];
    
    // This is a simplified version - real implementation would use AI
    jobRequirements.technicalSkills.forEach(skill => {
      const regex = new RegExp(skill, 'i');
      if (resume.match(regex)) {
        matches.push({
          skill,
          category: 'technical',
          action: 'enhance', // Skill exists but could be enhanced
          confidence: 0.8,
          found: true
        });
      } else {
        matches.push({
          skill,
          category: 'technical',
          action: 'add', // Skill doesn't exist and should be added if applicable
          confidence: 0.6,
          found: false
        });
      }
    });
    
    jobRequirements.softSkills.forEach(skill => {
      const regex = new RegExp(skill, 'i');
      if (resume.match(regex)) {
        matches.push({
          skill,
          category: 'soft',
          action: 'enhance',
          confidence: 0.7,
          found: true
        });
      } else {
        matches.push({
          skill,
          category: 'soft',
          action: 'add',
          confidence: 0.5,
          found: false
        });
      }
    });
    
    // Match experience
    jobRequirements.experience.forEach(exp => {
      // Try to extract years from requirement
      const yearMatch = exp.match(/(\d+)[+]?\s+years?/i);
      if (yearMatch) {
        const requiredYears = parseInt(yearMatch[1]);
        
        // Check if resume mentions years of experience
        const resumeExpMatch = resume.match(/(\d+)[+]?\s+years?\s+(?:of\s+)?experience/i);
        if (resumeExpMatch) {
          const resumeYears = parseInt(resumeExpMatch[1]);
          matches.push({
            requirement: exp,
            category: 'experience',
            action: resumeYears >= requiredYears ? 'highlight' : 'enhance',
            confidence: 0.7,
            found: true
          });
        } else {
          matches.push({
            requirement: exp,
            category: 'experience',
            action: 'add',
            confidence: 0.5,
            found: false
          });
        }
      }
    });
    
    // Match education
    jobRequirements.education.forEach(edu => {
      const regex = new RegExp(edu, 'i');
      if (resume.match(regex)) {
        matches.push({
          requirement: edu,
          category: 'education',
          action: 'highlight',
          confidence: 0.9,
          found: true
        });
      } else {
        matches.push({
          requirement: edu,
          category: 'education',
          action: 'consider',
          confidence: 0.4,
          found: false
        });
      }
    });
    
    return matches;
  }
} 