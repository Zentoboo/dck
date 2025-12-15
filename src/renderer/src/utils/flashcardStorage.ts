import { fsrs, Rating, Card, State } from 'ts-fsrs';

export interface FSRSData {
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: State;
  last_review: string;
  due: string;
}

export interface CardStats {
  totalReviews: number;
  correctStreak: number;
  createdAt: string;
}

export interface FlashcardData {
  questionId: string;
  question: string;
  fsrs: FSRSData;
  stats: CardStats;
}

export interface FlashcardFile {
  sourceFile: string;
  cards: FlashcardData[];
}

const f = fsrs();

export function createNewCard(questionId: string, question: string): FlashcardData {
  const now = new Date();
  const emptyCard: Card = {
    due: now,
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: State.New,
    last_review: now,
    learning_steps: 0
  };
  
  return {
    questionId,
    question,
    fsrs: {
      stability: emptyCard.stability,
      difficulty: emptyCard.difficulty,
      elapsed_days: emptyCard.elapsed_days,
      scheduled_days: emptyCard.scheduled_days,
      reps: emptyCard.reps,
      lapses: emptyCard.lapses,
      state: emptyCard.state,
      last_review: emptyCard.last_review?.toISOString() || now.toISOString(),
      due: emptyCard.due.toISOString()
    },
    stats: {
      totalReviews: 0,
      correctStreak: 0,
      createdAt: now.toISOString()
    }
  };
}

export function updateCardAfterReview(
  card: FlashcardData,
  rating: Rating
): FlashcardData {
  const now = new Date();
  
  const fsrsCard: Card = {
    stability: card.fsrs.stability,
    difficulty: card.fsrs.difficulty,
    elapsed_days: card.fsrs.elapsed_days,
    scheduled_days: card.fsrs.scheduled_days,
    reps: card.fsrs.reps,
    lapses: card.fsrs.lapses,
    state: card.fsrs.state,
    last_review: new Date(card.fsrs.last_review),
    due: new Date(card.fsrs.due),
    learning_steps: 0
  };

  console.log('BEFORE FSRS update:', {
    questionId: card.questionId,
    state: card.fsrs.state,
    reps: card.fsrs.reps,
    rating
  });

  const reviewResult = f.repeat(fsrsCard, now)[rating];
  
  console.log('AFTER FSRS update:', {
    questionId: card.questionId,
    newState: reviewResult.card.state,
    newReps: reviewResult.card.reps,
    newDue: reviewResult.card.due
  });
  
  const wasCorrect = rating === Rating.Good || rating === Rating.Easy;
  
  return {
    ...card,
    fsrs: {
      stability: reviewResult.card.stability,
      difficulty: reviewResult.card.difficulty,
      elapsed_days: reviewResult.card.elapsed_days,
      scheduled_days: reviewResult.card.scheduled_days,
      reps: reviewResult.card.reps,
      lapses: reviewResult.card.lapses,
      state: reviewResult.card.state,
      last_review: reviewResult.card.last_review?.toISOString() || now.toISOString(),
      due: reviewResult.card.due.toISOString()
    },
    stats: {
      totalReviews: card.stats.totalReviews + 1,
      correctStreak: wasCorrect ? card.stats.correctStreak + 1 : 0,
      createdAt: card.stats.createdAt
    }
  };
}

export function isDue(card: FlashcardData): boolean {
  const now = new Date();
  const dueDate = new Date(card.fsrs.due);
  return dueDate <= now;
}

export function isNew(card: FlashcardData): boolean {
  return card.fsrs.state === State.New;
}

export function getDaysUntilDue(card: FlashcardData): number {
  const now = new Date();
  const dueDate = new Date(card.fsrs.due);
  const diffMs = dueDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}