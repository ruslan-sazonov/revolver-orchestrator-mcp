import { GeminiCLIWrapper, GeminiConfig } from '../gemini-cli-wrapper.js';
import { PlanningSession, DetailedPlan, PlanningContext, FeedbackItem } from '../shared-context/types.js';

export class GeminiPlanningService {
  private geminiCLI: GeminiCLIWrapper;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = config;
    this.geminiCLI = new GeminiCLIWrapper(this.config);
  }

  async generatePlan(
    contextId: string,
    requirements: string,
    constraints: string = '',
    context?: PlanningContext
  ): Promise<PlanningSession> {
    const prompt = this.buildPlanningPrompt(requirements, constraints, context);
    
    console.log('🤖 Generating plan with Gemini CLI...');
    const response = await this.geminiCLI.generatePlan(prompt);
    
    let planData: any;
    try {
      planData = JSON.parse(response);
    } catch (error) {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          planData = JSON.parse(jsonMatch[jsonMatch.length - 1]);
        } catch (e) {
          throw new Error(`Failed to parse Gemini response as JSON: ${response}`);
        }
      } else {
        throw new Error(`No valid JSON found in Gemini response: ${response}`);
      }
    }
    
    const plan = this.parsePlanResponse(planData);
    
    return {
      id: `gemini-plan-${Date.now()}`,
      timestamp: new Date(),
      model: this.config.model || 'gemini-pro',
      input: {
        requirements,
        constraints,
        previousFeedback: context?.feedback
          .filter((f: FeedbackItem) => !f.resolved && f.phase === 'planning')
          .map((f: FeedbackItem) => f.content)
      },
      output: {
        plan,
        reasoning: planData.reasoning || 'Plan generated using Gemini CLI',
        alternatives: planData.alternatives || [],
        risks: planData.risks || []
      }
    };
  }

  private buildPlanningPrompt(
    requirements: string, 
    constraints: string = '', 
    context?: PlanningContext
  ): string {
    let prompt = `Create a comprehensive software implementation plan for the following project.

PROJECT REQUIREMENTS:
${requirements}

${constraints ? `CONSTRAINTS:\n${constraints}\n` : ''}`;

    if (context && context.planningHistory.length > 0) {
      prompt += `\nPREVIOUS PLANNING ATTEMPTS:
${context.planningHistory.map((p: PlanningSession, i: number) => `
Attempt ${i + 1} (${p.model}):
Overview: ${p.output.plan.overview}
Steps: ${p.output.plan.implementation_steps.length}
Issues from feedback: ${context.feedback
  .filter((f: FeedbackItem) => f.phase === 'planning')
  .map((f: FeedbackItem) => f.content)
  .join(', ')}
`).join('\n')}`;
    }

    prompt += `

Please provide a detailed implementation plan in the following JSON format:

{
  "overview": "High-level project description and chosen approach",
  "architecture": [
    {
      "component": "component name",
      "purpose": "what this component does",
      "technologies": ["tech1", "tech2"],
      "interfaces": ["API endpoints", "data flows"],
      "dependencies": ["other components this depends on"]
    }
  ],
  "implementation_steps": [
    {
      "id": "step-1",
      "phase": "setup|foundation|core|features|integration|testing|deployment",
      "description": "Detailed description of what to implement",
      "files_to_create": ["src/components/App.js", "src/api/auth.js"],
      "files_to_modify": ["package.json", "README.md"],
      "dependencies": ["step-0"],
      "estimated_complexity": "low|medium|high",
      "estimated_time": "2 hours",
      "validation_criteria": ["tests pass", "feature works as expected"],
      "potential_issues": ["common problems that might arise"]
    }
  ],
  "file_structure": {
    "src/": {
      "components/": {},
      "services/": {},
      "utils/": {}
    },
    "tests/": {},
    "docs/": {}
  },
  "dependencies": [
    {
      "name": "react",
      "version": "^18.2.0",
      "purpose": "Frontend framework",
      "type": "runtime"
    }
  ],
  "testing_strategy": "Detailed testing approach",
  "deployment_notes": "How to deploy this application",
  "reasoning": "Why you chose this approach",
  "alternatives": ["Alternative approach 1", "Alternative approach 2"],
  "risks": [
    {
      "risk": "description of potential risk",
      "probability": "low|medium|high",
      "impact": "low|medium|high",
      "mitigation": "how to prevent or handle this risk"
    }
  ]
}

IMPORTANT: Respond ONLY with valid JSON. No markdown formatting.`;

    return prompt;
  }

  private parsePlanResponse(response: any): DetailedPlan {
    return {
      overview: response.overview || '',
      architecture: response.architecture || [],
      implementation_steps: response.implementation_steps || [],
      file_structure: response.file_structure || {},
      dependencies: response.dependencies || [],
      testing_strategy: response.testing_strategy || '',
      deployment_notes: response.deployment_notes || ''
    };
  }

  async testConnection(): Promise<boolean> {
    console.log('🧪 Testing Gemini CLI connection...');
    return await this.geminiCLI.testConnection();
  }
}
