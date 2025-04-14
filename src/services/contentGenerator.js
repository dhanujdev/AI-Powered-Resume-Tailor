// Content Generator Service
import { BaseChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';

export class ContentGenerator {
  constructor() {
    this.name = "generate_tailored_content";
    this.description = "Generates tailored content for resume";
  }
  
  async _run(resume, jobRequirements, skillMatches) {
    try {
      console.log("Generating tailored content");
      
      // In a real implementation, this would use OpenAI via LangChain
      const tailoredResume = this._generateContent(resume, jobRequirements, skillMatches);
      
      return tailoredResume;
    } catch (error) {
      console.error("Error in ContentGenerator:", error);
      throw error;
    }
  }
  
  _generateContent(resume, jobRequirements, skillMatches) {
    // This is a very simplified version - real implementation would use AI
    let tailoredResume = resume;
    
    // Enhance existing skills by adding keywords
    skillMatches.forEach(match => {
      if (match.action === 'enhance' && match.found) {
        // Find places where skill is mentioned and enhance description
        const regex = new RegExp(`(.*${match.skill}.*)`, 'i');
        tailoredResume = tailoredResume.replace(regex, '$1 (Expert level)');
      }
    });
    
    // Add section for skills that are missing but relevant
    const skillsToAdd = skillMatches
      .filter(match => match.action === 'add' && !match.found && match.confidence > 0.5)
      .map(match => match.skill || match.requirement);
    
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
    const summary = this._generateSummary(jobRequirements);
    if (!tailoredResume.match(/summary:|profile:|objective:/i)) {
      tailoredResume = `${summary}\n\n${tailoredResume}`;
    }
    
    // Add job-specific keywords throughout
    const keywords = this._extractKeywords(jobRequirements);
    tailoredResume = this._insertKeywords(tailoredResume, keywords);
    
    return tailoredResume;
  }
  
  _generateSummary(jobRequirements) {
    const techSkills = jobRequirements.technicalSkills.join(', ');
    const softSkills = jobRequirements.softSkills.join(', ');
    
    const techSkillsText = techSkills.length > 0 
      ? `expertise in ${techSkills}` 
      : 'strong technical background';
      
    const softSkillsText = softSkills.length > 0
      ? `Strong ${softSkills} skills`
      : 'Strong interpersonal skills';
    
    return `Professional Summary:
Experienced professional with ${techSkillsText}. ${softSkillsText} with a proven track record of delivering high-quality results. Seeking to leverage skills and experience to drive success in new challenges.`;
  }
  
  _extractKeywords(jobRequirements) {
    const keywords = [
      ...jobRequirements.technicalSkills,
      ...jobRequirements.softSkills
    ];
    
    // Add some industry terms based on tech skills
    if (jobRequirements.technicalSkills.includes('JavaScript')) {
      keywords.push('ES6', 'frontend development', 'web applications');
    }
    
    if (jobRequirements.technicalSkills.includes('Python')) {
      keywords.push('data analysis', 'automation', 'scripting');
    }
    
    return keywords;
  }
  
  _insertKeywords(text, keywords) {
    // This is a very simplified version
    // In reality, this would use AI to naturally insert keywords
    let result = text;
    
    // For this simple demo, we'll just look for places to insert a few keywords
    // at most once per keyword to avoid overstuffing
    const usedKeywords = new Set();
    
    keywords.forEach(keyword => {
      if (usedKeywords.has(keyword) || result.match(new RegExp(keyword, 'i'))) {
        return;
      }
      
      // Look for relevant sections to insert keyword
      const experienceMatch = result.match(/(experience:.*?)(\n\n|\n[A-Z])/is);
      if (experienceMatch) {
        const insertPoint = experienceMatch.index + experienceMatch[1].length;
        result = result.substring(0, insertPoint) + 
                 `\n- Utilized ${keyword} to improve project outcomes` + 
                 result.substring(insertPoint);
        usedKeywords.add(keyword);
      }
    });
    
    return result;
  }
} 