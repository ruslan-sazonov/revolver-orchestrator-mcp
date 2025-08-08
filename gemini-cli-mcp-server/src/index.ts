import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { GeminiPlanningService } from './services/gemini-planner.js';
import { GeminiConfig } from './gemini-cli-wrapper.js';
import { globalContextStore } from './shared-context/context-store.js';

const config: GeminiConfig = {
  model: process.env.GEMINI_MODEL!,
  apiKey: process.env.GEMINI_API_KEY,
  temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.3'),
  maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '4000'),
  cliPath: process.env.GEMINI_CLI_PATH || 'gemini',
  systemInstruction: process.env.GEMINI_SYSTEM_INSTRUCTION || `You are an expert software architect and planning AI specializing in creating comprehensive, actionable implementation plans.

Your expertise includes:
- Modern software architecture patterns
- Full-stack development best practices
- DevOps and deployment strategies
- Testing methodologies
- Security considerations
- Performance optimization
- User experience design

Always provide detailed, structured responses in JSON format with clear step-by-step implementation plans.`
};

const planningService = new GeminiPlanningService(config);

const server = new Server(
  {
    name: 'gemini-cli-planning-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'test_gemini_connection',
        description: 'Test connection to Gemini CLI',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'create_project_context',
        description: 'Create a new project planning context',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Name of the project' },
            requirements: { type: 'string', description: 'Project requirements' },
            constraints: { type: 'string', description: 'Any constraints' }
          },
          required: ['projectName', 'requirements']
        }
      },
      {
        name: 'generate_plan_with_gemini',
        description: 'Generate a detailed implementation plan using Gemini CLI',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: { type: 'string', description: 'Project context ID' }
          },
          required: ['contextId']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case 'test_gemini_connection': {
        const isConnected = await planningService.testConnection();
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: isConnected,
              message: isConnected ? 'Gemini CLI connection successful' : 'Gemini CLI connection failed',
              config: {
                model: config.model,
                cliPath: config.cliPath,
                hasApiKey: !!config.apiKey
              }
            }, null, 2)
          }]
        };
      }

      case 'create_project_context': {
        const { projectName, requirements, constraints } = request.params.arguments as any;
        const context = await globalContextStore.createContext(projectName, requirements, constraints);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              contextId: context.id,
              message: `Created project context: ${context.id}`,
              projectName: context.projectName
            }, null, 2)
          }]
        };
      }

      case 'generate_plan_with_gemini': {
        const { contextId } = request.params.arguments as any;
        const context = await globalContextStore.getContext(contextId);
        
        if (!context) {
          throw new Error(`Context ${contextId} not found`);
        }

        const planningSession = await planningService.generatePlan(
          contextId,
          context.requirements,
          context.constraints || '',
          context
        );

        await globalContextStore.addPlanningSession(contextId, planningSession);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              contextId,
              plan: planningSession.output.plan,
              reasoning: planningSession.output.reasoning,
              alternatives: planningSession.output.alternatives,
              risks: planningSession.output.risks,
              model: planningSession.model,
              message: 'Plan generated successfully with Gemini CLI'
            }, null, 2)
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }, null, 2)
      }],
      isError: true
    };
  }
});

async function main() {
  console.log('🚀 Starting Gemini CLI Planning MCP Server...');
  console.log(`Model: ${config.model}`);
  console.log(`CLI Path: ${config.cliPath}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('🎯 Gemini CLI Planning MCP Server running');
}

main().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});
