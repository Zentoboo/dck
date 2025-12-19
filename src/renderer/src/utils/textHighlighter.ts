/**
 * Utility to highlight keywords in user answers for AI feedback
 */

export interface HighlightSegment {
  text: string;
  highlight: 'correct' | 'none';
}

/**
 * Highlight found keywords in the user's answer
 * Returns segments with highlight information
 */
export function highlightKeywordsInText(
  text: string,
  foundKeywords: string[],
): HighlightSegment[] {
  if (foundKeywords.length === 0) {
    return [{ text, highlight: 'none' }];
  }

  const segments: HighlightSegment[] = [];
  // let remainingText = text;
  // let searchStart = 0;

  // Sort keywords by length (longest first) to match longer phrases first
  const sortedKeywords = [...foundKeywords].sort((a, b) => b.length - a.length);

  // Create a map to track which parts of the text have been matched
  const matches: Array<{ start: number; end: number; keyword: string }> = [];

  // Find all keyword matches
  sortedKeywords.forEach(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    const lowerText = text.toLowerCase();
    let index = lowerText.indexOf(lowerKeyword);

    while (index !== -1) {
      const end = index + keyword.length;
      
      // Check if this position overlaps with existing matches
      const overlaps = matches.some(m => 
        (index >= m.start && index < m.end) || 
        (end > m.start && end <= m.end) ||
        (index <= m.start && end >= m.end)
      );

      if (!overlaps) {
        matches.push({ start: index, end, keyword });
      }

      // Find next occurrence
      index = lowerText.indexOf(lowerKeyword, index + 1);
    }
  });

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Build segments
  let currentPos = 0;
  
  matches.forEach(match => {
    // Add text before the match (if any)
    if (match.start > currentPos) {
      segments.push({
        text: text.substring(currentPos, match.start),
        highlight: 'none'
      });
    }

    // Add the matched keyword
    segments.push({
      text: text.substring(match.start, match.end),
      highlight: 'correct'
    });

    currentPos = match.end;
  });

  // Add remaining text (if any)
  if (currentPos < text.length) {
    segments.push({
      text: text.substring(currentPos),
      highlight: 'none'
    });
  }

  return segments;
}

/**
 * Simple function to check if text contains keyword (case-insensitive)
 */
export function textContainsKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword.toLowerCase());
}