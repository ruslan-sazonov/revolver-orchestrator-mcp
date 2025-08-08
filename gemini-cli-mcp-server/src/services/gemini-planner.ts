import { GeminiCLIWrapper, GeminiConfig } from '../gemini-cli-wrapper.js';
import { PlanningSession, DetailedPlan, PlanningContext, FeedbackItem } from '../shared-context/types.js';
import { NpmVersionResolver } from './npm-version-resolver.js';

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
    if (Array.isArray(plan.dependencies) && plan.dependencies.length > 0) {
      const resolver = new NpmVersionResolver();
      plan.dependencies = await resolver.resolveLatestVersions(plan.dependencies);
    }
    
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
    let prompt = `Create a concrete, highly technical implementation plan for the following project.

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

Respond ONLY with valid JSON. No markdown. Use this exact schema and fill all fields with concrete, implementation-ready details:

{
  "overview": "Short project description and chosen approach",
  "architecture": [
    { "component": "string", "purpose": "string", "technologies": ["string"], "interfaces": ["string"], "dependencies": ["string"] }
  ],
  "file_structure": {
    "src": {
      "components": {},
      "sections": {},
      "layouts": {},
      "pages": {},
      "content": {},
      "styles": {},
      "utils": {}
    },
    "tests": {}
  },
  "data_models": [
    { "name": "string", "fields": [ { "name": "string", "type": "string", "required": true } ] }
  ],
  "routes": [
    { "path": "string", "method": "GET|POST|PUT|DELETE|PATCH|ANY", "description": "string", "params": [ { "name": "string", "type": "string", "required": true } ] }
  ],
  "components": [
    { "name": "string", "category": "ui|layout|section|feature|form|nav|data", "responsibilities": ["string"] }
  ],
  "content_types": [
    { "name": "string", "fields": [ { "name": "string", "type": "string", "required": true } ] }
  ],
  "implementation_steps": [
    { "id": "string", "phase": "setup|foundation|core|features|integration|testing|deployment", "description": "string", "files_to_create": ["string"], "files_to_modify": ["string"], "dependencies": ["string"], "estimated_complexity": "low|medium|high", "estimated_time": "string", "validation_criteria": ["string"], "potential_issues": ["string"] }
  ],
  "dependencies": [ { "name": "string", "version": "string", "purpose": "string", "type": "runtime|dev|peer" } ],
  "testing_strategy": "string",
  "deployment_notes": "string",
  "reasoning": "string",
  "alternatives": ["string"],
  "risks": [ { "risk": "string", "probability": "low|medium|high", "impact": "low|medium|high", "mitigation": "string" } ]
}`;

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
      deployment_notes: response.deployment_notes || '',
      data_models: response.data_models || [],
      routes: response.routes || [],
      components: response.components || [],
      content_types: response.content_types || []
    };
  }

  async testConnection(): Promise<boolean> {
    console.log('🧪 Testing Gemini CLI connection...');
    return await this.geminiCLI.testConnection();
  }
}
