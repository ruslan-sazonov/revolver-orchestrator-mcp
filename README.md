# AI Planning System with Gemini CLI Integration

A comprehensive AI planning system that integrates Google's Gemini CLI as a planning backend with Claude Code for implementation. Features automatic plan-then-execute workflows, persistent context management, and seamless MCP integration.

## Features

- 🤖 **Gemini 2.5 Pro Integration**: Uses Google's latest Gemini CLI for advanced planning
- 🔄 **Context Management**: Persistent context across planning and execution sessions  
- 🔁 **Plan-Then-Execute Workflow**: Automatic planning followed by step-by-step implementation
- 🛠️ **Claude Code Integration**: Seamless integration via Model Context Protocol (MCP)
- 📊 **Progress Monitoring**: Real-time monitoring of planning and execution progress
- 🎯 **Environment-Based Configuration**: No hardcoded defaults, fully configurable via `.env`

## Quick Start

### Prerequisites
- Node.js 18+
- Go 1.19+ (for Gemini CLI)
- Claude Code installed
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. **Clone and setup the system:**
   ```bash
   git clone <repository-url>
   cd ai-planning-system
   ./scripts/setup-gemini-cli.sh
   ```

2. **Create and configure environment file:**
   ```bash
   # Create .env file with your configuration
   cat > .env << EOF
   GEMINI_API_KEY=your-api-key-here
   GEMINI_MODEL=gemini-2.5-pro
   GEMINI_TEMPERATURE=0.3
   GEMINI_MAX_TOKENS=4000
   GEMINI_CLI_PATH=gemini
   EOF
   ```

3. **Install dependencies and build:**
   ```bash
   ./scripts/install-dependencies.sh
   ```

4. **Setup Claude integration:**
   ```bash
   ./scripts/setup-claude-integration.sh
   ```
   
   This script will:
   - Detect your Claude installation (command or alias)
   - Register the Gemini planning MCP server using `claude mcp add-json`
   - Fall back to direct config file method if needed
   - Build the MCP server with proper dependencies

5. **Test the system:**
   ```bash
   ./scripts/test-system.sh
   ```

## Usage

### Plan-Then-Execute Workflow (Recommended)

Use this pattern for automatic planning and implementation:

```bash
claude --message "
Build a React todo application with these requirements:
- Add, edit, delete todos
- Mark todos as complete
- Local storage persistence  
- Clean, modern UI

Workflow:
1. Create a project context for this task
2. Generate a detailed implementation plan using Gemini
3. Execute the plan step by step

Please follow this workflow automatically."
```

### Manual Step-by-Step Process

1. **Create a project context:**
   ```bash
   claude --message "Create a project context for a real-time chat application with React frontend and Node.js backend"
   ```

2. **Generate detailed plans:**
   ```bash
   claude --message "Use the Gemini MCP to generate a comprehensive implementation plan for the chat application context"
   ```

3. **Execute the plan:**
   ```bash
   claude --message "Now implement the plan step by step, creating all necessary files and components"
   ```

### Quick Examples

```bash
# Simple web app with automatic planning
claude --message "Build a React todo app with local storage. First create a project context, generate a plan with Gemini, then implement it."

# API development with planning
claude --message "Create a REST API for task management with JWT auth. Use the Gemini MCP to plan the architecture, then implement it step by step."

# Full-stack application  
claude --message "Build a real-time chat app with React frontend and Node.js backend. Plan with Gemini first, then execute the implementation."
```

## Architecture

```
┌─────────────────────┐    ┌─────────────────────┐
│    Claude Code      │    │   Gemini CLI        │
│   (Execution)       │────│   (Planning)        │
└─────────────────────┘    └─────────────────────┘
         │                           │
         └─────────┬─────────────────┘
                   │
   ┌─────────────────────────────────────┐
   │        MCP Integration              │
   │  - Context Management              │
   │  - Feedback Processing             │
   │  - Session Coordination            │
   └─────────────────────────────────────┘
```

## Configuration

### Environment Configuration
All configuration is done via the `.env` file (no hardcoded defaults):

```env
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-2.5-pro
GEMINI_TEMPERATURE=0.3
GEMINI_MAX_TOKENS=4000
GEMINI_CLI_PATH=gemini
```

### Available Models
- `gemini-2.5-pro` - Latest and most capable model (recommended)
- `gemini-pro` - General purpose, balanced performance
- `gemini-pro-vision` - Includes image understanding
- `gemini-1.5-pro` - Previous generation with enhanced capabilities
- `gemini-1.5-flash` - Faster responses

### Configuration Notes
- `GEMINI_API_KEY` is required - get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- `GEMINI_MODEL` determines which model to use for planning
- `GEMINI_TEMPERATURE` controls response creativity (0.1-0.9)
- Modern Gemini CLI may not use `GEMINI_TEMPERATURE` and `GEMINI_MAX_TOKENS` directly
- System relies entirely on environment variables for configuration

## Tools and Utilities

### Context Monitoring
```bash
# View specific context
node tools/context-viewer.js <context-id>

# Monitor all contexts
./tools/monitor-contexts.sh
```

### System Testing
```bash
# Test Gemini CLI connection
./scripts/test-system.sh

# Test MCP server
cd gemini-cli-mcp-server && npm test
```

## Project Structure

```
ai-planning-system/
├── gemini-cli-mcp-server/     # Gemini CLI MCP wrapper
│   ├── src/
│   │   ├── services/          # Planning services  
│   │   ├── gemini-cli-wrapper.ts  # Gemini CLI integration
│   │   └── index.ts          # MCP server entry point
│   ├── tsconfig.json         # TypeScript configuration
│   └── package.json
├── shared-context/            # Context management
│   ├── types.ts              # TypeScript definitions
│   └── context-store.ts      # Context storage
├── contexts/                 # Stored project contexts
├── examples/                 # Usage examples and workflows
│   └── plan-then-execute-workflow.md
├── tools/                    # Utility tools
├── scripts/                  # Setup and utility scripts
│   ├── setup-gemini-cli.sh   # Gemini CLI installation
│   ├── setup-claude-integration.sh  # Claude Code setup
│   ├── install-dependencies.sh  # Dependency installation
│   └── test-system.sh        # System testing
├── .env                      # Environment configuration
├── CLAUDE.md                 # Claude Code integration guide
└── README.md
```

## API Reference

### MCP Tools

#### `create_project_context`
Creates a new planning context for a project.

**Parameters:**
- `projectName`: Name of the project
- `requirements`: Project requirements and specifications
- `constraints`: Any constraints or limitations

#### `generate_plan_with_gemini`
Generates a detailed implementation plan using Gemini CLI.

**Parameters:**
- `contextId`: Project context ID

#### `test_gemini_connection`
Tests the connection to Gemini CLI.

## Examples

### Web Application Development
```javascript
// Context creation and planning
const context = await createProjectContext(
  "E-commerce Platform",
  "React frontend, Node.js API, PostgreSQL database, user authentication, product catalog, shopping cart"
);

const plan = await generatePlanWithGemini(context.id);
// Plan includes: architecture, implementation steps, file structure, dependencies
```

### API Development
```javascript
const apiContext = await createProjectContext(
  "Task Management API",
  "RESTful API with authentication, CRUD operations, real-time updates via WebSocket"
);

const apiPlan = await generatePlanWithGemini(apiContext.id);
// Detailed API design with endpoints, models, middleware, testing strategy
```

## Troubleshooting

### Common Issues

1. **Gemini CLI not found:**
   ```bash
   # Add Go bin to PATH
   export PATH=$PATH:$(go env GOPATH)/bin
   # Or reinstall Gemini CLI
   go install github.com/google-gemini/gemini-cli/cmd/gemini@latest
   ```

2. **API key issues:**
   ```bash
   # Test with correct modern CLI syntax
   GEMINI_API_KEY="your-key" gemini --model gemini-2.5-pro --prompt "Say hello"
   ```

3. **MCP server build errors:**
   ```bash
   cd gemini-cli-mcp-server
   npm install
   npm run build
   ```

4. **MCP server not showing up after setup:**
   ```bash
   # MCP servers require Claude to be restarted to load
   # 1. Close all Claude sessions
   # 2. Wait a few seconds
   # 3. Start a new Claude session
   # 4. Check MCP server status
   claude mcp list
   ```

5. **Claude integration issues:**
   ```bash
   # Re-run the setup script
   ./scripts/setup-claude-integration.sh
   # Restart Claude after setup
   # Test MCP connection
   claude --message "Test the Gemini planning MCP connection"
   ```

6. **Environment variable issues:**
   ```bash
   # Verify .env file exists and has correct values
   cat .env
   # Test system end-to-end
   ./scripts/test-system.sh
   ```

### Performance Tips

1. **For faster responses:**
   - Use `gemini-1.5-flash` model in `.env`
   - Provide more focused requirements
   - Break large projects into smaller contexts

2. **For better plan quality:**
   - Use `gemini-2.5-pro` model (recommended)
   - Provide detailed requirements and constraints
   - Include specific technology preferences

### Debug Commands

```bash
# Test Gemini CLI directly
GEMINI_API_KEY="your-key" gemini --model gemini-2.5-pro --prompt "Test message"

# Check MCP server logs
cd gemini-cli-mcp-server && node build/index.js

# Verify all environment variables are set
env | grep GEMINI
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Additional Resources

- **CLAUDE.md** - Detailed guide for Claude Code integration
- **examples/plan-then-execute-workflow.md** - Comprehensive workflow examples
- **scripts/setup-claude-integration.sh** - Automated setup script

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review examples in `examples/plan-then-execute-workflow.md`
3. Test system health: `./scripts/test-system.sh`
4. Check MCP server status: `claude mcp list`
5. Test MCP integration: `claude --message "Test the Gemini planning MCP connection"`
6. Check environment variables: `env | grep GEMINI`
7. Open an issue with detailed error information and logs

### Getting Help

- **Setup Issues**: Run `./scripts/setup-claude-integration.sh` again
- **Planning Issues**: Check Gemini CLI works: `GEMINI_API_KEY="your-key" gemini --model gemini-2.5-pro --prompt "Hello"`
- **MCP Issues**: Verify `~/.config/claude/mcp_settings.json` exists and has correct paths
- **Build Issues**: Run `cd gemini-cli-mcp-server && npm install && npm run build`

---

Built with ❤️ for the AI development community
