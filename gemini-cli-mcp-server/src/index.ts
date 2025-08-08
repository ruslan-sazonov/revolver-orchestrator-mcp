import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { GeminiPlanningService } from './services/gemini-planner.js';
import { GeminiConfig } from './gemini-cli-wrapper.js';
import { globalContextStore } from './shared-context/context-store.js';
import { Context7Client, LibrarySpec } from './services/context7.js';
import { LibraryResolver } from './services/library-resolver.js';
import { renderPlanChecklist } from './services/plan-checklist.js';

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
const libraryResolver = new LibraryResolver(config);

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
        name: 'render_plan_checklist',
        description: 'Render the latest or specified plan from a context as a terminal-friendly checklist',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: { type: 'string', description: 'Project context ID' },
            planIndex: { type: 'number', description: 'Optional index of the plan in planning history; defaults to latest' }
          },
          required: ['contextId']
        }
      },
      {
        name: 'test_context7_connection',
        description: 'Test connection to Context7 MCP and list available tools',
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
        description: 'Fetch docs from Context7 and generate a detailed implementation plan using Gemini CLI',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: { type: 'string', description: 'Existing project context ID (optional if creating a new context)' },
            projectName: { type: 'string', description: 'Project name (required when creating a new context)' },
            requirements: { type: 'string', description: 'Project requirements (required when creating a new context)' },
            constraints: { type: 'string', description: 'Additional constraints or notes' },
            librariesPrompt: {
              type: 'string',
              description: 'Natural language description of libraries or stack to use; auto-resolves libraries when structured list is not provided'
            },
            libraries: {
              type: 'array',
              description: 'Libraries to fetch documentation for from Context7',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Library name, e.g., "next.js" or "supabase/supabase"' },
                  topic: { type: 'string', description: 'Optional topic focus, e.g., "routing", "auth"' },
                  tokens: { type: 'number', description: 'Optional max tokens for docs' }
                },
                required: ['name']
              }
            }
          }
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

      case 'test_context7_connection': {
        const ctx7 = new Context7Client(process.env.CONTEXT7_URL);
        try {
          const tools = await ctx7.listTools();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ success: true, url: process.env.CONTEXT7_URL || undefined, tools }, null, 2)
            }]
          };
        } catch (e) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }, null, 2)
            }],
            isError: true
          };
        }
      }

      case 'render_plan_checklist': {
        const { contextId, planIndex } = request.params.arguments as { contextId: string; planIndex?: number };
        const ctx = await globalContextStore.getContext(contextId);
        if (!ctx) throw new Error(`Context ${contextId} not found`);
        if (!ctx.planningHistory.length) throw new Error('No planning sessions found for this context');
        const idx = typeof planIndex === 'number' ? planIndex : ctx.planningHistory.length - 1;
        const session = ctx.planningHistory[idx];
        if (!session) throw new Error(`Planning session index ${idx} not found`);
        const text = renderPlanChecklist(session.output.plan);
        return { content: [{ type: 'text', text }] };
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
        const { contextId, projectName, requirements, constraints, libraries, librariesPrompt } = request.params.arguments as {
          contextId?: string;
          projectName?: string;
          requirements?: string;
          constraints?: string;
          libraries?: LibrarySpec[];
          librariesPrompt?: string;
        };

        let effectiveLibraries: LibrarySpec[] | undefined = Array.isArray(libraries) && libraries.length > 0 ? libraries : undefined;
        if (!effectiveLibraries && librariesPrompt && typeof librariesPrompt === 'string' && librariesPrompt.trim()) {
          effectiveLibraries = await libraryResolver.resolveFromPrompt(librariesPrompt);
        }
        if (!effectiveLibraries || effectiveLibraries.length === 0) {
          throw new Error('Provide either a non-empty libraries array or a librariesPrompt string to auto-resolve libraries');
        }

        const ctx7 = new Context7Client(process.env.CONTEXT7_URL);
        const docsChunks: string[] = [];
        for (const lib of effectiveLibraries) {
          const id = await ctx7.resolveLibraryId(lib.name);
          const docs = await ctx7.getLibraryDocs(id, lib.topic, lib.tokens);
          docsChunks.push(`Library: ${lib.name}${lib.topic ? ` (${lib.topic})` : ''}\n${docs}`);
        }
        const referenceDocs = docsChunks.join('\n\n');

        let effectiveContextId: string;
        let effectiveRequirements: string;
        let baseConstraints = '';
        let fullContext = null as any;

        if (contextId) {
          const existing = await globalContextStore.getContext(contextId);
          if (!existing) throw new Error(`Context ${contextId} not found`);
          effectiveContextId = contextId;
          effectiveRequirements = existing.requirements;
          baseConstraints = existing.constraints || '';
          fullContext = existing;
        } else {
          if (!projectName || !requirements) {
            throw new Error('When contextId is not provided, projectName and requirements are required');
          }
          const created = await globalContextStore.createContext(projectName, requirements, constraints || '');
          effectiveContextId = created.id;
          effectiveRequirements = created.requirements;
          baseConstraints = created.constraints || '';
          fullContext = created;
        }

        const injectedConstraints = [baseConstraints, constraints || '', `REFERENCE DOCS:\n${referenceDocs}`]
          .filter(Boolean)
          .join('\n\n');

        await globalContextStore.updateContext(effectiveContextId, { constraints: injectedConstraints });
        const refreshed = await globalContextStore.getContext(effectiveContextId);

        const planningSession = await planningService.generatePlan(
          effectiveContextId,
          effectiveRequirements,
          injectedConstraints,
          refreshed || fullContext
        );

        await globalContextStore.addPlanningSession(effectiveContextId, planningSession);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              contextId: effectiveContextId,
              plan: planningSession.output.plan,
              reasoning: planningSession.output.reasoning,
              alternatives: planningSession.output.alternatives,
              risks: planningSession.output.risks,
              model: planningSession.model,
              message: 'Plan generated successfully with Context7 docs and Gemini CLI'
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
