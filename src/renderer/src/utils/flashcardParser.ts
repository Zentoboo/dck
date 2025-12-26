interface FlashcardQuestion {
  questionId: string;
  question: string;
  answer: string;
  sourceFile: string;
  lineNumber: number;
}

/**
 * Normalize indentation by removing common leading whitespace
 */
function normalizeIndentation(lines: string[]): string {
  if (lines.length === 0) return '';
  
  // Find minimum indentation (excluding empty lines)
  const minIndent = lines
    .filter(line => line.trim().length > 0)
    .reduce((min, line) => {
      const match = line.match(/^(\s*)/);
      const indent = match ? match[1].length : 0;
      return Math.min(min, indent);
    }, Infinity);
  
  // If no valid indentation found, return as-is
  if (minIndent === Infinity) {
    return lines.join('\n').trim();
  }
  
  // Remove the common indentation from all lines
  const normalized = lines
    .map(line => line.slice(minIndent))
    .join('\n')
    .trim();
  
  return normalized;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function generateQuestionId(question: string, sourceFile: string): string {
  // Always use just the filename, not the full path
  const fileName = sourceFile.split('/').pop()?.split('\\').pop() || sourceFile;
  const content = question.trim().substring(0, 100) + fileName;
  return 'q_' + simpleHash(content);
}

export function parseMarkdownForFlashcards(
  markdown: string,
  sourceFile: string
): FlashcardQuestion[] {
  const lines = markdown.split('\n');
  const questions: FlashcardQuestion[] = [];
  
  let currentQuestion: string | null = null;
  let currentAnswer: string[] = [];
  let questionLineNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
    
    // Check if this is a top-level bullet point or numbered item (question) - NO leading spaces
    // Supports: -, *, +, 1., 2., 3., etc.
    if (leadingSpaces === 0 && trimmedLine.match(/^([-*+]|\d+\.)\s+(.+)/)) {
      // Save previous question if exists
      if (currentQuestion && currentAnswer.length > 0) {
        const answerText = normalizeIndentation(currentAnswer);
        if (answerText) {
          questions.push({
            questionId: generateQuestionId(currentQuestion, sourceFile),
            question: currentQuestion,
            answer: answerText,
            sourceFile,
            lineNumber: questionLineNumber
          });
        }
      }

      // Start new question - extract text after bullet/number
      const match = trimmedLine.match(/^([-*+]|\d+\.)\s+(.+)/);
      currentQuestion = match ? match[2] : trimmedLine;  // match[2] because we have 2 capture groups
      currentAnswer = [];
      questionLineNumber = i + 1;
    }
    // Check if this is an indented line (answer)
    else if (currentQuestion && line.trim()) {
      // Only include lines that are indented (leadingSpaces > 0)
      if (leadingSpaces > 0) {
        currentAnswer.push(line);
      }
    }
  }

  // Don't forget the last question
  if (currentQuestion && currentAnswer.length > 0) {
    const answerText = normalizeIndentation(currentAnswer);
    if (answerText) {
      questions.push({
        questionId: generateQuestionId(currentQuestion, sourceFile),
        question: currentQuestion,
        answer: answerText,
        sourceFile,
        lineNumber: questionLineNumber
      });
    }
  }

  return questions;
}