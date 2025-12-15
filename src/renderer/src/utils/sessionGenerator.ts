import { Rating } from 'ts-fsrs';
import { AIEvaluation } from '../ai/AIProvider';

export interface SessionCardRecord {
  questionId: string;
  sourceFile: string;
  question: string;
  userAnswer: string;
  expectedAnswer: string;
  aiEvaluation?: AIEvaluation;
  rating: Rating;
  oldInterval: number;
  newInterval: number;
}

export interface SessionSummary {
  files: string[];
  startTime: Date;
  endTime: Date;
  cardsReviewed: number;
  ratings: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
}

function getRatingEmoji(rating: Rating): string {
  switch (rating) {
    case Rating.Again: return '[1]';
    case Rating.Hard: return '[2]';
    case Rating.Good: return '[3]';
    case Rating.Easy: return '[4]';
    default: return '?';
  }
}

function getRatingText(rating: Rating): string {
  switch (rating) {
    case Rating.Again: return 'Again (1/4)';
    case Rating.Hard: return 'Hard (2/4)';
    case Rating.Good: return 'Good (3/4)';
    case Rating.Easy: return 'Easy (4/4)';
    default: return 'Unknown';
  }
}

export function generateSessionMarkdown(
  summary: SessionSummary,
  cards: SessionCardRecord[]
): string {
  const duration = Math.round((summary.endTime.getTime() - summary.startTime.getTime()) / 1000);
  const correctCount = summary.ratings.good + summary.ratings.easy;
  const incorrectCount = summary.ratings.again + summary.ratings.hard;
  
  let md = `# Flashcard Session - ${summary.startTime.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}\n\n`;
  
  md += `**Files Reviewed:** ${summary.files.join(', ')}\n`;
  md += `**Duration:** ${duration}s\n`;
  md += `**Cards Reviewed:** ${summary.cardsReviewed}\n`;
  md += `**Performance:** ${correctCount} correct, ${incorrectCount} incorrect\n\n`;
  md += `---\n\n`;
  
  cards.forEach((card, index) => {
    md += `## Card ${index + 1} - ${card.sourceFile}\n`;
    md += `**Question:** ${card.question}\n\n`;
    
    md += `**Your Answer:**\n`;
    md += card.userAnswer ? card.userAnswer + '\n\n' : '_(No answer provided)_\n\n';
    
    // AI Evaluation (if available)
    if (card.aiEvaluation) {
      const ai = card.aiEvaluation;
      md += `**AI Evaluation:**\n\n`;
      md += `**Overall Score:** ${ai.overallScore}%\n`;
      md += `**Suggested Rating:** ${ai.suggestedRating}/4\n\n`;
      
      // Accuracy
      md += `**Accuracy:** ${ai.accuracy.level.replace(/_/g, ' ')}\n`;
      if (ai.accuracy.explanation) {
        md += `  ${ai.accuracy.explanation}\n`;
      }
      md += `\n`;
      
      // Completeness
      md += `**Completeness:** ${ai.completeness.level.replace(/_/g, ' ')}\n`;
      if (ai.completeness.missingPoints && ai.completeness.missingPoints.length > 0) {
        md += `  Missing points:\n`;
        ai.completeness.missingPoints.forEach(point => {
          md += `  - ${point}\n`;
        });
      }
      md += `\n`;
      
      // Clarity
      md += `**Clarity:** ${ai.clarity.level.replace(/_/g, ' ')}\n`;
      if (ai.clarity.suggestion) {
        md += `  ${ai.clarity.suggestion}\n`;
      }
      md += `\n`;
      
      // Reasoning
      md += `**Reasoning Quality:** ${ai.reasoning.level.replace(/_/g, ' ')}\n`;
      if (ai.reasoning.explanation) {
        md += `  ${ai.reasoning.explanation}\n`;
      }
      md += `\n`;
      
      // Structure
      md += `**Answer Structure:** ${ai.structure.level.replace(/_/g, ' ')}\n`;
      if (ai.structure.feedback) {
        md += `  ${ai.structure.feedback}\n`;
      }
      md += `\n`;
      
      // Keyword Analysis
      md += `**Keyword Analysis (${ai.keywordAnalysis.keywordScore}%):**\n`;
      if (ai.keywordAnalysis.foundKeywords.length > 0) {
        md += `  Found: ${ai.keywordAnalysis.foundKeywords.join(', ')}\n`;
      }
      if (ai.keywordAnalysis.missingKeywords.length > 0) {
        md += `  Missing: ${ai.keywordAnalysis.missingKeywords.join(', ')}\n`;
      }
      md += `\n`;
      
      // Improvements
      if (ai.improvements.length > 0) {
        md += `**Suggested Improvements:**\n`;
        ai.improvements.forEach(imp => {
          md += `- ${imp}\n`;
        });
        md += `\n`;
      }
      
      // Strengths
      if (ai.strengths.length > 0) {
        md += `**Strengths:**\n`;
        ai.strengths.forEach(str => {
          md += `- ${str}\n`;
        });
        md += `\n`;
      }
    }
    
    md += `**Expected Answer:**\n`;
    md += card.expectedAnswer + '\n\n';
    
    md += `**Self-Rating:** ${getRatingEmoji(card.rating)} ${getRatingText(card.rating)}\n`;
    md += `**FSRS Interval:** ${card.oldInterval} days → ${card.newInterval} days\n\n`;
    md += `---\n\n`;
  });
  
  md += `## Summary\n`;
  md += `- **Again (1):** ${summary.ratings.again} cards\n`;
  md += `- **Hard (2):** ${summary.ratings.hard} cards\n`;
  md += `- **Good (3):** ${summary.ratings.good} cards\n`;
  md += `- **Easy (4):** ${summary.ratings.easy} cards\n\n`;
  
  return md;
}

export function generateSessionFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `session.${year}-${month}-${day}-${hour}-${minute}.md`;
}