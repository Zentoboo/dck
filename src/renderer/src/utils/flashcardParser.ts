interface FlashcardQuestion {
  questionId: string;
  question: string;
  answer: string;
  sourceFile: string;
  lineNumber: number;
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
    
    // Check if this is a top-level bullet point (question) - NO leading spaces
    if (leadingSpaces === 0 && trimmedLine.match(/^-\s+(.+)/)) {
      // Save previous question if exists
      if (currentQuestion && currentAnswer.length > 0) {
        const answerText = currentAnswer.join('\n').trim();
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

      // Start new question
      const match = trimmedLine.match(/^-\s+(.+)/);
      currentQuestion = match ? match[1] : trimmedLine;
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
    const answerText = currentAnswer.join('\n').trim();
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