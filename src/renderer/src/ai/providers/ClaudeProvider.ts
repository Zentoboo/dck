import { AIProvider, EvaluationParams, AIEvaluation } from '../AIProvider';

const EVALUATION_PROMPT = `You are an expert educational evaluator. Evaluate the student's answer against the expected answer with detailed analysis.

**Question:**
{{QUESTION}}

**Expected Answer:**
{{EXPECTED_ANSWER}}

**Student's Answer:**
{{USER_ANSWER}}

**Keywords to Check (from expected answer, marked with **):**
{{KEYWORDS}}

Evaluate the answer on these five dimensions:

1. **Accuracy**
   - fully_correct: Answer is completely accurate
   - mostly_correct: Minor inaccuracies or imprecisions
   - partially_correct: Some correct elements, some wrong
   - incorrect_related: Wrong but shows understanding of related concepts
   - incorrect_misconception: Wrong with clear misconceptions
   - completely_incorrect: Completely wrong or off-topic

2. **Completeness**
   - complete: All key points covered thoroughly
   - missing_key_detail: Correct but missing important details
   - missing_examples: Correct but lacks supporting examples
   - missing_explanation: Correct but doesn't explain why/how

3. **Clarity**
   - clear: Well-phrased and easy to understand
   - unclear_wording: Correct but poorly worded
   - ambiguous: Meaning is unclear or vague
   - unfocused: Too verbose or rambling

4. **Reasoning Quality**
   - sound: Good reasoning and correct conclusion
   - good_reasoning_wrong_conclusion: Logic is sound but arrives at wrong answer
   - right_conclusion_wrong_reasoning: Correct answer but flawed reasoning
   - good_intuition_factual_mistake: Right idea but factual errors
   - confusing_concepts: Mixing up related but different concepts

5. **Structure**
   - appropriate: Well-structured and focused
   - too_short: Answer is too brief to properly address question
   - too_long: Overly detailed or unfocused
   - missed_main_point: Focused on wrong aspect of question
   - misinterpreted_question: Answered a different question

Also analyze:
- Which keywords (bold terms) are present/missing in student's answer
- Specific improvements that would strengthen the answer
- What the student did well

Suggest a rating (1-4) that maps to spaced repetition:
- 4 (Easy): Excellent answer, demonstrates full understanding
- 3 (Good): Solid answer with minor gaps
- 2 (Hard): Partially correct, needs significant review
- 1 (Again): Major gaps or misconceptions, needs complete re-study

CRITICAL: Respond with ONLY valid JSON, no markdown, no explanation, no backticks. Format:
{
  "suggestedRating": 1,
  "overallScore": 75,
  "accuracy": {
    "level": "mostly_correct",
    "explanation": "Student correctly identified the main concept but missed the chemical equation."
  },
  "completeness": {
    "level": "missing_key_detail",
    "missingPoints": ["Chemical equation CO2 + H2O → C6H12O6 + O2", "Role of chloroplasts"]
  },
  "clarity": {
    "level": "clear",
    "suggestion": null
  },
  "reasoning": {
    "level": "sound",
    "explanation": "Demonstrated good understanding of cause and effect"
  },
  "structure": {
    "level": "appropriate",
    "feedback": null
  },
  "keywordAnalysis": {
    "expectedKeywords": ["photosynthesis", "chloroplasts", "glucose"],
    "foundKeywords": ["photosynthesis"],
    "missingKeywords": ["chloroplasts", "glucose"],
    "keywordScore": 33
  },
  "improvements": [
    "Mention the specific organelle (chloroplasts) where this occurs",
    "Include the basic chemical equation",
    "Specify the end products (glucose and oxygen)"
  ],
  "strengths": [
    "Correctly identified sunlight as the energy source",
    "Clear explanation of the overall process"
  ]
}`;

export class ClaudeProvider implements AIProvider {
  name = 'Anthropic Claude';
  id = 'claude';
  requiresApiKey = true;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async evaluate(params: EvaluationParams): Promise<AIEvaluation> {
    const prompt = EVALUATION_PROMPT
      .replace('{{QUESTION}}', params.question)
      .replace('{{EXPECTED_ANSWER}}', params.expectedAnswer)
      .replace('{{USER_ANSWER}}', params.userAnswer)
      .replace('{{KEYWORDS}}', params.keywords.join(', '));

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      // Strip any markdown formatting that might have snuck in
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const evaluation = JSON.parse(cleanedContent);
      
      // Validate the response structure
      if (!this.isValidEvaluation(evaluation)) {
        throw new Error('Invalid evaluation response from Claude');
      }

      return evaluation;
    } catch (error) {
      console.error('Claude evaluation error:', error);
      throw new Error(`Failed to evaluate with Claude: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private isValidEvaluation(obj: any): obj is AIEvaluation {
    return (
      obj &&
      typeof obj.suggestedRating === 'number' &&
      obj.suggestedRating >= 1 &&
      obj.suggestedRating <= 4 &&
      typeof obj.overallScore === 'number' &&
      obj.accuracy &&
      obj.completeness &&
      obj.clarity &&
      obj.reasoning &&
      obj.structure &&
      obj.keywordAnalysis &&
      Array.isArray(obj.improvements) &&
      Array.isArray(obj.strengths)
    );
  }
}