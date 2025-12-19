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

function getRatingText(rating: Rating): string {
  switch (rating) {
    case Rating.Again: return 'Again (1/4)';
    case Rating.Hard: return 'Hard (2/4)';
    case Rating.Good: return 'Good (3/4)';
    case Rating.Easy: return 'Easy (4/4)';
    default: return 'Unknown';
  }
}

// function getRatingLevel(rating: Rating): string {
//   switch (rating) {
//     case Rating.Again: return '1';
//     case Rating.Hard: return '2';
//     case Rating.Good: return '3';
//     case Rating.Easy: return '4';
//     default: return '0';
//   }
// }

export function generateSessionMarkdown(
  summary: SessionSummary,
  cards: SessionCardRecord[]
): string {
  const duration = Math.round((summary.endTime.getTime() - summary.startTime.getTime()) / 1000);
  const correctCount = summary.ratings.good + summary.ratings.easy;
  const incorrectCount = summary.ratings.again + summary.ratings.hard;
  const accuracy = summary.cardsReviewed > 0 
    ? Math.round((correctCount / summary.cardsReviewed) * 100) 
    : 0;
  
  // Header
  let md = `# Flashcard Review Session\n\n`;
  md += `**Date:** ${summary.startTime.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}\n\n`;
  
  // Session Summary
  md += `## Session Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Files Reviewed | ${summary.files.join(', ')} |\n`;
  md += `| Total Duration | ${duration}s |\n`;
  md += `| Cards Reviewed | ${summary.cardsReviewed} |\n`;
  md += `| Accuracy Rate | ${accuracy}% |\n`;
  md += `| Correct Responses | ${correctCount} |\n`;
  md += `| Incorrect Responses | ${incorrectCount} |\n\n`;
  
  // Performance Breakdown
  md += `### Performance Distribution\n\n`;
  md += `| Rating | Count | Percentage |\n`;
  md += `|--------|-------|------------|\n`;
  md += `| Again (1/4) | ${summary.ratings.again} | ${Math.round((summary.ratings.again / summary.cardsReviewed) * 100)}% |\n`;
  md += `| Hard (2/4) | ${summary.ratings.hard} | ${Math.round((summary.ratings.hard / summary.cardsReviewed) * 100)}% |\n`;
  md += `| Good (3/4) | ${summary.ratings.good} | ${Math.round((summary.ratings.good / summary.cardsReviewed) * 100)}% |\n`;
  md += `| Easy (4/4) | ${summary.ratings.easy} | ${Math.round((summary.ratings.easy / summary.cardsReviewed) * 100)}% |\n\n`;
  
  md += `---\n\n`;
  
  // Individual Card Reviews
  md += `## Detailed Card Reviews\n\n`;
  
  cards.forEach((card, index) => {
    md += `### Card ${index + 1}\n\n`;
    md += `**Source File:** \`${card.sourceFile}\`\n\n`;
    
    // Question
    md += `**Question:**\n`;
    md += `> ${card.question}\n\n`;
    
    // Your Answer
    md += `**Your Answer:**\n`;
    if (card.userAnswer && card.userAnswer.trim()) {
      md += `\`\`\`\n${card.userAnswer}\n\`\`\`\n\n`;
    } else {
      md += `> _(No answer provided)_\n\n`;
    }
    
    // AI Evaluation (if available)
    if (card.aiEvaluation) {
      const ai = card.aiEvaluation;
      md += `**AI Evaluation:**\n\n`;
      
      // Overall Metrics
      md += `- **Overall Score:** ${ai.overallScore}%\n`;
      md += `- **Suggested Rating:** ${getRatingText(ai.suggestedRating)}\n\n`;
      
      // Detailed Assessment
      md += `**Assessment Details:**\n\n`;
      md += `| Category | Level | Notes |\n`;
      md += `|----------|-------|-------|\n`;
      
      // Accuracy
      const accuracyLevel = ai.accuracy.level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      md += `| Accuracy | ${accuracyLevel} | ${ai.accuracy.explanation || '-'} |\n`;
      
      // Completeness
      const completenessLevel = ai.completeness.level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      let completenessNote = '-';
      if (ai.completeness.missingPoints && ai.completeness.missingPoints.length > 0) {
        completenessNote = ai.completeness.missingPoints.join('; ');
      }
      md += `| Completeness | ${completenessLevel} | ${completenessNote} |\n`;
      
      // Clarity
      const clarityLevel = ai.clarity.level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      md += `| Clarity | ${clarityLevel} | ${ai.clarity.suggestion || '-'} |\n`;
      
      // Reasoning
      const reasoningLevel = ai.reasoning.level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      md += `| Reasoning Quality | ${reasoningLevel} | ${ai.reasoning.explanation || '-'} |\n`;
      
      // Structure
      const structureLevel = ai.structure.level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      md += `| Answer Structure | ${structureLevel} | ${ai.structure.feedback || '-'} |\n\n`;
      
      // Keyword Analysis
      md += `**Keyword Analysis:** ${ai.keywordAnalysis.keywordScore}%\n\n`;
      if (ai.keywordAnalysis.foundKeywords.length > 0) {
        md += `- **Keywords Found:** ${ai.keywordAnalysis.foundKeywords.join(', ')}\n`;
      }
      if (ai.keywordAnalysis.missingKeywords.length > 0) {
        md += `- **Keywords Missing:** ${ai.keywordAnalysis.missingKeywords.join(', ')}\n`;
      }
      md += `\n`;
      
      // Improvements
      if (ai.improvements.length > 0) {
        md += `**Areas for Improvement:**\n`;
        ai.improvements.forEach(imp => {
          md += `- ${imp}\n`;
        });
        md += `\n`;
      }
      
      // Strengths
      if (ai.strengths.length > 0) {
        md += `**Identified Strengths:**\n`;
        ai.strengths.forEach(str => {
          md += `- ${str}\n`;
        });
        md += `\n`;
      }
    }
    
    // Expected Answer
    md += `**Expected Answer:**\n`;
    md += `\`\`\`\n${card.expectedAnswer}\n\`\`\`\n\n`;
    
    // Rating & Scheduling
    md += `**Review Outcome:**\n`;
    md += `- **Self-Rating:** ${getRatingText(card.rating)}\n`;
    md += `- **Spaced Repetition Interval:** ${card.oldInterval} days → ${card.newInterval} days\n\n`;
    
    md += `---\n\n`;
  });
  
  // Final Statistics
  md += `## Statistical Analysis\n\n`;
  
  md += `### Overall Performance Metrics\n`;
  md += `- Total Cards Reviewed: ${summary.cardsReviewed}\n`;
  md += `- Session Duration: ${duration} seconds (${Math.round(duration / summary.cardsReviewed)} seconds per card)\n`;
  md += `- Overall Accuracy: ${accuracy}%\n`;
  md += `- Correct Responses: ${correctCount}/${summary.cardsReviewed}\n`;
  md += `- Incorrect Responses: ${incorrectCount}/${summary.cardsReviewed}\n\n`;
  
  md += `### Rating Distribution Summary\n`;
  md += `- Again (1/4): ${summary.ratings.again} cards (${Math.round((summary.ratings.again / summary.cardsReviewed) * 100)}%)\n`;
  md += `- Hard (2/4): ${summary.ratings.hard} cards (${Math.round((summary.ratings.hard / summary.cardsReviewed) * 100)}%)\n`;
  md += `- Good (3/4): ${summary.ratings.good} cards (${Math.round((summary.ratings.good / summary.cardsReviewed) * 100)}%)\n`;
  md += `- Easy (4/4): ${summary.ratings.easy} cards (${Math.round((summary.ratings.easy / summary.cardsReviewed) * 100)}%)\n\n`;
  
  // Performance Assessment
  if (accuracy < 50) {
    md += `### Performance Assessment\n`;
    md += `Current accuracy is below 50%. Consider the following strategies:\n`;
    md += `- Review the source material in greater detail\n`;
    md += `- Break down complex concepts into smaller, more manageable flashcards\n`;
    md += `- Increase review frequency for difficult topics\n`;
    md += `- Ensure adequate understanding before proceeding to new material\n\n`;
  } else if (accuracy >= 50 && accuracy < 75) {
    md += `### Performance Assessment\n`;
    md += `Accuracy is satisfactory. Continue with regular review schedule and focus on cards rated as "Again" or "Hard" to improve retention.\n\n`;
  } else if (accuracy >= 75 && accuracy < 90) {
    md += `### Performance Assessment\n`;
    md += `Strong performance demonstrated. Material is being effectively retained. Continue current study approach.\n\n`;
  } else {
    md += `### Performance Assessment\n`;
    md += `Excellent mastery of material demonstrated. Consider advancing to more challenging topics or reducing review frequency for mastered cards.\n\n`;
  }
  
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