import { AIProvider, EvaluationParams, AIEvaluation } from './AIProvider';
import { ClaudeProvider } from './providers/ClaudeProvider';
import { GrokProvider } from './providers/GrokProvider';
import { AIConfigManager } from './AIConfigManager';
import { extractKeywords } from '../utils/keywordExtractor';

export class AIEvaluator {
  private provider: AIProvider | null = null;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider(): void {
    const config = AIConfigManager.getConfig();
    
    if (!config || !config.enabled || !config.apiKey) {
      this.provider = null;
      return;
    }

    // Initialize provider based on config
    switch (config.providerId) {
      case 'claude':
        this.provider = new ClaudeProvider(config.apiKey);
        break;
      case 'grok':
        this.provider = new GrokProvider(config.apiKey);
        break;
      // Add more providers here:
      // case 'openai':
      //   this.provider = new OpenAIProvider(config.apiKey);
      //   break;
      default:
        console.warn('Unknown provider:', config.providerId);
        this.provider = null;
    }
  }

  /**
   * Check if AI evaluation is available
   */
  isAvailable(): boolean {
    return this.provider !== null && AIConfigManager.isConfigured();
  }

  /**
   * Evaluate a flashcard answer
   */
  async evaluate(
    question: string,
    expectedAnswer: string,
    userAnswer: string
  ): Promise<AIEvaluation> {
    if (!this.provider) {
      throw new Error('AI provider not configured. Please set up your API key in settings.');
    }

    // Extract keywords from expected answer
    const keywords = extractKeywords(expectedAnswer);

    const params: EvaluationParams = {
      question,
      expectedAnswer,
      userAnswer,
      keywords
    };

    try {
      const evaluation = await this.provider.evaluate(params);
      console.log('AI Evaluation:', evaluation);
      return evaluation;
    } catch (error) {
      console.error('Evaluation failed:', error);
      throw error;
    }
  }

  /**
   * Reinitialize provider (call after config changes)
   */
  reload(): void {
    this.initializeProvider();
  }

  /**
   * Get current provider name
   */
  getProviderName(): string {
    return this.provider?.name || 'None';
  }
}

// Singleton instance
let evaluatorInstance: AIEvaluator | null = null;

export function getAIEvaluator(): AIEvaluator {
  if (!evaluatorInstance) {
    evaluatorInstance = new AIEvaluator();
  }
  return evaluatorInstance;
}

export function reloadAIEvaluator(): void {
  if (evaluatorInstance) {
    evaluatorInstance.reload();
  }
}