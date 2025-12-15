/**
 * Extracts keywords from expected answer.
 * Keywords are marked with **bold** syntax in markdown.
 * 
 * Example: "**Photosynthesis** is the process..."
 * Returns: ["Photosynthesis"]
 */
export function extractKeywords(text: string): string[] {
  const regex = /\*\*(.+?)\*\*/g;
  const keywords: string[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const keyword = match[1].trim();
    if (keyword) {
      keywords.push(keyword);
    }
  }
  
  return keywords;
}

/**
 * Check which keywords from expected list are present in user answer (case-insensitive)
 */
export function findMatchingKeywords(
  expectedKeywords: string[],
  userAnswer: string
): { found: string[]; missing: string[] } {
  const userAnswerLower = userAnswer.toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];
  
  expectedKeywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    if (userAnswerLower.includes(keywordLower)) {
      found.push(keyword);
    } else {
      missing.push(keyword);
    }
  });
  
  return { found, missing };
}