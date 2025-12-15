import React, { useState, useEffect } from 'react';
import FileSelector from './FileSelector';
import CardReview from './CardReview';
import SessionComplete from './SessionComplete';
import { parseMarkdownForFlashcards } from '../utils/flashcardParser';
import {
  FlashcardData,
  FlashcardFile,
  createNewCard,
  updateCardAfterReview,
  isDue,
  isNew,
  getDaysUntilDue
} from '../utils/flashcardStorage';
import { Rating } from 'ts-fsrs';
import {
  SessionCardRecord,
  SessionSummary,
  generateSessionMarkdown,
  generateSessionFilename
} from '../utils/sessionGenerator';
import { AIEvaluation } from '../ai/AIProvider';

interface FileWithStats {
  name: string;
  path: string;
  dueCount: number;
  newCount: number;
  totalCards: number;
}

interface FlashcardSessionProps {
  folderPath: string;
  files: { name: string; path: string }[];
  onClose: () => void;
}

interface ReviewCard {
  questionId: string;
  question: string;
  answer: string;
  sourceFile: string;
  cardData: FlashcardData;
}

type SessionState = 'selecting' | 'reviewing' | 'complete';

const FlashcardSession: React.FC<FlashcardSessionProps> = ({ folderPath, files, onClose }) => {
  const [sessionState, setSessionState] = useState<SessionState>('selecting');
  const [filesWithStats, setFilesWithStats] = useState<FileWithStats[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionRecords, setSessionRecords] = useState<SessionCardRecord[]>([]);
  const [sessionStart, setSessionStart] = useState<Date>(new Date());
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [totalCardsInSession, setTotalCardsInSession] = useState(0);
  const [undoStack, setUndoStack] = useState<{
    cardIndex: number;
    record: SessionCardRecord;
    oldCardData: FlashcardData;
  }[]>([]);

  useEffect(() => {
    console.log('FlashcardSession mounted, files:', files.length);
    loadFileStats();
  }, [files]);

  const loadFileStats = async () => {
    console.log('Loading file stats for', files.length, 'files');

    const statsPromises = files.map(async (file) => {
      const content = await window.api.readFile(file.path);
      const questions = parseMarkdownForFlashcards(content, file.name);
      console.log(`File ${file.name}: ${questions.length} questions found`);

      const flashcardFile = await window.api.readFlashcardFile(file.path);
      const existingCards = flashcardFile?.cards || [];

      let dueCount = 0;
      let newCount = 0;

      questions.forEach(q => {
        const existing = existingCards.find((c: FlashcardData) => c.questionId === q.questionId);
        if (existing) {
          if (isDue(existing)) dueCount++;
        } else {
          newCount++;
        }
      });

      return {
        name: file.name,
        path: file.path,
        dueCount,
        newCount,
        totalCards: questions.length
      };
    });

    const stats = await Promise.all(statsPromises);
    console.log('File stats loaded:', stats);
    setFilesWithStats(stats);
  };

  const handleStartSession = async (studyMode: boolean = false) => {
    const cardsToReview: ReviewCard[] = [];
    setIsStudyMode(studyMode);

    for (const filePath of Array.from(selectedFiles)) {
      const content = await window.api.readFile(filePath);
      const fileName = filePath.split('/').pop() || filePath;
      const questions = parseMarkdownForFlashcards(content, fileName);

      const flashcardFile: FlashcardFile | null = await window.api.readFlashcardFile(filePath);
      const existingCards = flashcardFile?.cards || [];

      questions.forEach(q => {
        let cardData = existingCards.find((c: FlashcardData) => c.questionId === q.questionId);

        if (!cardData) {
          cardData = createNewCard(q.questionId, q.question);
        }

        // In study mode, include ALL cards. Otherwise only due/new
        if (studyMode || isDue(cardData) || isNew(cardData)) {
          cardsToReview.push({
            questionId: q.questionId,
            question: q.question,
            answer: q.answer,
            sourceFile: fileName,
            cardData
          });
        }
      });
    }

    // Shuffle cards
    const shuffled = cardsToReview.sort(() => Math.random() - 0.5);
    setReviewCards(shuffled);
    setTotalCardsInSession(shuffled.length);
    setSessionStart(new Date());
    setSessionState('reviewing');
  };

  const handleCardReview = async (userAnswer: string, rating: Rating, aiEvaluation?: AIEvaluation) => {
    const currentCard = reviewCards[currentCardIndex];
    const oldCardData = { ...currentCard.cardData }; // Save for undo
    const oldInterval = getDaysUntilDue(currentCard.cardData);
    const updatedCard = updateCardAfterReview(currentCard.cardData, rating);
    const newInterval = getDaysUntilDue(updatedCard);

    // Save updated card data
    const filePath = Array.from(selectedFiles).find(f =>
      f.endsWith(currentCard.sourceFile)
    );

    if (filePath) {
      const flashcardFile: FlashcardFile | null = await window.api.readFlashcardFile(filePath);
      const cards = flashcardFile?.cards || [];

      const cardIndex = cards.findIndex((c: FlashcardData) => c.questionId === currentCard.questionId);
      if (cardIndex >= 0) {
        cards[cardIndex] = updatedCard;
      } else {
        cards.push(updatedCard);
      }

      console.log('Saving card to file:', {
        filePath,
        questionId: currentCard.questionId,
        newState: updatedCard.fsrs.state,
        totalCards: cards.length
      });

      await window.api.writeFlashcardFile(filePath, {
        sourceFile: currentCard.sourceFile,
        cards
      });

      console.log('Card saved successfully');
    }

    // Create session record for this card
    const sessionRecord: SessionCardRecord = {
      questionId: currentCard.questionId,
      sourceFile: currentCard.sourceFile,
      question: currentCard.question,
      userAnswer,
      expectedAnswer: currentCard.answer,
      aiEvaluation,
      rating,
      oldInterval,
      newInterval
    };

    // Add to undo stack (save old data)
    setUndoStack(prev => [...prev, {
      cardIndex: currentCardIndex,
      record: sessionRecord,
      oldCardData
    }]);

    // Add record to session
    setSessionRecords(prev => [...prev, sessionRecord]);

    // Move to next card or complete
    if (currentCardIndex < reviewCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // All cards done - complete session
      await completeSessionWithRecords([...sessionRecords, sessionRecord]);
    }
  };

  const handleSkip = () => {
    console.log('Skipping card at index:', currentCardIndex);

    // Get current card
    const currentCard = reviewCards[currentCardIndex];

    // Remove current card and add it to the end
    const newReviewCards = [
      ...reviewCards.slice(0, currentCardIndex),
      ...reviewCards.slice(currentCardIndex + 1),
      currentCard
    ];

    setReviewCards(newReviewCards);

    console.log('Card moved to end. New deck size:', newReviewCards.length);

    // Stay at same index (which now shows the next card)
    // If we're at the last card, this will wrap to showing the skipped card again
    // which is correct behavior
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;

    // Pop last action from undo stack
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    // Remove last record from session
    setSessionRecords(prev => prev.slice(0, -1));

    // Restore old card data to file
    const filePath = Array.from(selectedFiles).find(f =>
      f.endsWith(lastAction.record.sourceFile)
    );

    if (filePath) {
      const flashcardFile: FlashcardFile | null = await window.api.readFlashcardFile(filePath);
      const cards = flashcardFile?.cards || [];

      const cardIndex = cards.findIndex((c: FlashcardData) => c.questionId === lastAction.record.questionId);
      if (cardIndex >= 0) {
        cards[cardIndex] = lastAction.oldCardData;

        await window.api.writeFlashcardFile(filePath, {
          sourceFile: lastAction.record.sourceFile,
          cards
        });

        console.log('Undo: Restored old card data');
      }
    }

    // Update review cards array with old data
    const updatedReviewCards = [...reviewCards];
    const reviewCardIndex = updatedReviewCards.findIndex(
      c => c.questionId === lastAction.record.questionId
    );
    if (reviewCardIndex >= 0) {
      updatedReviewCards[reviewCardIndex].cardData = lastAction.oldCardData;
      setReviewCards(updatedReviewCards);
    }

    // Go back to previous card
    setCurrentCardIndex(lastAction.cardIndex);
  };

  const completeSessionWithRecords = async (records: SessionCardRecord[]) => {
    const sessionEnd = new Date();

    const ratings = {
      again: records.filter(r => r.rating === Rating.Again).length,
      hard: records.filter(r => r.rating === Rating.Hard).length,
      good: records.filter(r => r.rating === Rating.Good).length,
      easy: records.filter(r => r.rating === Rating.Easy).length
    };

    const summary: SessionSummary = {
      files: Array.from(selectedFiles).map(f => f.split('/').pop() || f),
      startTime: sessionStart,
      endTime: sessionEnd,
      cardsReviewed: records.length,
      ratings
    };

    const markdown = generateSessionMarkdown(summary, records);
    const filename = generateSessionFilename();

    await window.api.saveSession(folderPath, filename, markdown);

    setSessionRecords(records);
    setSessionState('complete');
  };

  const getRatingSummary = () => {
    return {
      again: sessionRecords.filter(r => r.rating === Rating.Again).length,
      hard: sessionRecords.filter(r => r.rating === Rating.Hard).length,
      good: sessionRecords.filter(r => r.rating === Rating.Good).length,
      easy: sessionRecords.filter(r => r.rating === Rating.Easy).length
    };
  };

  if (sessionState === 'selecting') {
    return (
      <FileSelector
        files={filesWithStats}
        selectedFiles={selectedFiles}
        onToggleFile={(path) => {
          const newSelected = new Set(selectedFiles);
          if (newSelected.has(path)) {
            newSelected.delete(path);
          } else {
            newSelected.add(path);
          }
          setSelectedFiles(newSelected);
        }}
        onSetFiles={(paths) => {
          setSelectedFiles(new Set(paths));
        }}
        onStart={handleStartSession}
        onCancel={onClose}
      />
    );
  }

  if (sessionState === 'reviewing' && reviewCards.length > 0) {
    return (
      <CardReview
        card={reviewCards[currentCardIndex]}
        cardNumber={sessionRecords.length + 1}
        totalCards={totalCardsInSession}
        isStudyMode={isStudyMode}
        onReview={handleCardReview}
        onSkip={handleSkip}
        onUndo={handleUndo}
        canUndo={undoStack.length > 0}
      />
    );
  }

  if (sessionState === 'complete') {
    const ratings = getRatingSummary();
    return (
      <SessionComplete
        cardsReviewed={sessionRecords.length}
        duration={Math.round((new Date().getTime() - sessionStart.getTime()) / 60000)}
        ratings={ratings}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="flashcard-session">
      <p>Loading...</p>
    </div>
  );
};

export default FlashcardSession;