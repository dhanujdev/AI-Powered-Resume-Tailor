// Quality Evaluator Service
import { BaseChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';

export class QualityEvaluator {
  constructor() {
    this.name = "evaluate_quality";
    this.description = "Evaluates the quality of the tailored resume";
  }
  
  async _run(originalResume, tailoredResume, jobRequirements) {
    try {
      console.log("Evaluating quality of tailored resume");
      
      // In a real implementation, this would use OpenAI via LangChain
      const qualityCheck = this._evaluateQuality(originalResume, tailoredResume, jobRequirements);
      
      return qualityCheck;
    } catch (error) {
      console.error("Error in QualityEvaluator:", error);
      throw error;
    }
  }
  
  _evaluateQuality(originalResume, tailoredResume, jobRequirements) {
    // In a real implementation, this would check for:
    // 1. No fabricated experiences
    // 2. No contradictions with original resume
    // 3. Grammar and style consistency
    // 4. Keyword density and relevance
    
    // Simple checks for demo purposes
    const issues = [];
    
    // Check for excessive keyword stuffing
    const keywordStuffingIssue = this._checkKeywordStuffing(tailoredResume, jobRequirements);
    if (keywordStuffingIssue) {
      issues.push(keywordStuffingIssue);
    }
    
    // Check for fabricated experience
    const fabricationIssue = this._checkForFabrication(originalResume, tailoredResume);
    if (fabricationIssue) {
      issues.push(fabricationIssue);
    }
    
    // Check for grammar and style consistency
    const styleIssue = this._checkStyleConsistency(tailoredResume);
    if (styleIssue) {
      issues.push(styleIssue);
    }
    
    // Check for relevance to job
    const relevanceIssue = this._checkRelevance(tailoredResume, jobRequirements);
    if (relevanceIssue) {
      issues.push(relevanceIssue);
    }
    
    // Mock quality evaluation
    const passes = issues.length === 0;
    const reason = issues.join('; ');
    
    return { 
      passes, 
      reason,
      issues,
      score: issues.length === 0 ? 1.0 : (1.0 - 0.2 * issues.length)
    };
  }
  
  _checkKeywordStuffing(tailoredResume, jobRequirements) {
    // Simple check for repeated keywords
    const keywords = [
      ...jobRequirements.technicalSkills,
      ...jobRequirements.softSkills
    ];
    
    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = tailoredResume.match(regex);
      
      if (matches && matches.length > 3) {
        return `Excessive use of keyword "${keyword}" (${matches.length} times)`;
      }
    }
    
    return null;
  }
  
  _checkForFabrication(originalResume, tailoredResume) {
    // This is a very simplified check
    // In reality, this would use AI to detect fabricated experiences
    
    // Split into sentences for basic comparison
    const originalSentences = originalResume.split(/[.!?]+/).map(s => s.trim().toLowerCase());
    const tailoredSentences = tailoredResume.split(/[.!?]+/).map(s => s.trim().toLowerCase());
    
    // Check for new sentences that mention years of experience
    for (const sentence of tailoredSentences) {
      if (
        !originalSentences.some(orig => orig.includes(sentence)) &&
        sentence.match(/\d+ years? (?:of )?experience/i) &&
        sentence.length > 20 // Ignore short fragments
      ) {
        return `Potentially fabricated experience: "${sentence}"`;
      }
    }
    
    return null;
  }
  
  _checkStyleConsistency(tailoredResume) {
    // Simple check for mixed tenses in bullet points
    const bulletPoints = tailoredResume.match(/- .+/g) || [];
    
    let pastTenseCount = 0;
    let presentTenseCount = 0;
    
    // Count past vs present tense verbs in bullet points
    for (const bullet of bulletPoints) {
      if (
        bullet.match(/\b(developed|created|managed|led|designed|implemented)\b/i)
      ) {
        pastTenseCount++;
      }
      
      if (
        bullet.match(/\b(develop|create|manage|lead|design|implement)\b/i)
      ) {
        presentTenseCount++;
      }
    }
    
    // If significant mixed tenses, flag as issue
    if (pastTenseCount > 3 && presentTenseCount > 3) {
      return "Inconsistent verb tenses in resume (mixed past and present)";
    }
    
    return null;
  }
  
  _checkRelevance(tailoredResume, jobRequirements) {
    // Check if key job requirements are addressed
    const missingKeySkills = [];
    
    // Check for technical skills
    for (const skill of jobRequirements.technicalSkills) {
      if (!tailoredResume.match(new RegExp(skill, 'i'))) {
        missingKeySkills.push(skill);
      }
    }
    
    if (missingKeySkills.length > 0) {
      return `Resume missing key job requirements: ${missingKeySkills.join(', ')}`;
    }
    
    return null;
  }
} 