// AI Provider interface for plug-and-play system

export interface EvaluationParams {
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  keywords: string[];
}

export type AccuracyLevel = 
  | 'fully_correct'
  | 'mostly_correct'
  | 'partially_correct'
  | 'incorrect_related'
  | 'incorrect_misconception'
  | 'completely_incorrect';

export type CompletenessLevel = 
  | 'complete'
  | 'missing_key_detail'
  | 'missing_examples'
  | 'missing_explanation';

export type ClarityLevel = 
  | 'clear'
  | 'unclear_wording'
  | 'ambiguous'
  | 'unfocused';

export type ReasoningLevel = 
  | 'sound'
  | 'good_reasoning_wrong_conclusion'
  | 'right_conclusion_wrong_reasoning'
  | 'good_intuition_factual_mistake'
  | 'confusing_concepts';

export type StructureLevel = 
  | 'appropriate'
  | 'too_short'
  | 'too_long'
  | 'missed_main_point'
  | 'misinterpreted_question';

export interface AIEvaluation {
  // Overall
  suggestedRating: 1 | 2 | 3 | 4;
  overallScore: number; // 0-100
  
  // Detailed breakdown
  accuracy: {
    level: AccuracyLevel;
    explanation: string;
  };
  
  completeness: {
    level: CompletenessLevel;
    missingPoints?: string[];
  };
  
  clarity: {
    level: ClarityLevel;
    suggestion?: string;
  };
  
  reasoning: {
    level: ReasoningLevel;
    explanation?: string;
  };
  
  structure: {
    level: StructureLevel;
    feedback?: string;
  };
  
  // Keyword analysis
  keywordAnalysis: {
    expectedKeywords: string[];
    foundKeywords: string[];
    missingKeywords: string[];
    keywordScore: number;
  };
  
  // Actionable feedback
  improvements: string[];
  strengths: string[];
}

export interface AIProvider {
  name: string;
  id: string;
  requiresApiKey: boolean;
  evaluate(params: EvaluationParams): Promise<AIEvaluation>;
}

export interface AIProviderConfig {
  providerId: string;
  apiKey?: string;
  endpoint?: string; // For custom providers
  enabled: boolean;
}