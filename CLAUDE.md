# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI Planning System that integrates Google's Gemini CLI as a planning backend with Claude Code for implementation. The system uses MCP (Model Context Protocol) to enable seamless communication between Claude and the Gemini planning engine.

## Architecture

The project consists of three main components:

1. **Gemini CLI MCP Server** (`gemini-cli-mcp-server/`): TypeScript-based MCP server that wraps the Gemini CLI for planning operations
2. **Shared Context** (`shared-context/`): TypeScript types and context management for persistent state across planning sessions
3. **Configuration & Scripts** (`config/`, `scripts/`): Setup scripts and MCP configuration for Claude integration

### Key Files

- `gemini-cli-mcp-server/src/index.ts`: Main MCP server implementation with tool handlers
- `gemini-cli-mcp-server/src/services/gemini-planner.ts`: Core planning service that interfaces with Gemini CLI
- `shared-context/types.ts`: TypeScript definitions for planning contexts, sessions, and artifacts
- `config/claude-mcp-settings.json`: MCP configuration template for Claude Code integration

## Common Development Commands

### Initial Setup
```bash
# Install Gemini CLI and dependencies
./scripts/setup-gemini-cli.sh

# Install Node.js dependencies only
./scripts/install-dependencies.sh

# Test entire system
./scripts/test-system.sh
```

### Development Workflow
```bash
# Build the MCP server
cd gemini-cli-mcp-server && npm run build

# Watch mode for development
cd gemini-cli-mcp-server && npm run dev

# Test Gemini CLI connection
cd gemini-cli-mcp-server && npm test
```

### TypeScript Configuration Notes
The project uses a custom TypeScript configuration that includes shared-context files from the parent directory. The `tsconfig.json` in `gemini-cli-mcp-server/` has:
- `rootDir: ".."` to include parent directory files
- Path mapping for `shared-context/*` imports
- Import paths use `shared-context/types` format without file extensions

### Environment Configuration
The system requires a `.env` file with:
- `GEMINI_API_KEY`: API key from Google AI Studio (required)
- `GEMINI_MODEL`: Model to use (e.g., gemini-2.5-pro, gemini-pro)
- `GEMINI_TEMPERATURE`: Temperature setting (default: 0.3) - Note: modern CLI may not use this
- `GEMINI_MAX_TOKENS`: Max tokens (default: 4000) - Note: modern CLI may not use this
- `GEMINI_CLI_PATH`: Path to Gemini CLI binary (default: gemini)

### Gemini CLI Integration Notes
The system uses Google's modern Gemini CLI which:
- Expects API key via `GEMINI_API_KEY` environment variable
- Supports `--model` and `--prompt` flags
- Returns JSON responses wrapped in code blocks
- May show deprecation warnings that are filtered out
- Configuration relies entirely on environment variables, no hardcoded defaults

## MCP Integration

The system provides three MCP tools for Claude Code:

1. **test_gemini_connection**: Tests connectivity to Gemini CLI
2. **create_project_context**: Creates a new planning context with project requirements
3. **generate_plan_with_gemini**: Generates detailed implementation plans using Gemini CLI

### Setting Up Claude Code Integration

1. **Install and configure the MCP server:**
```bash
./scripts/setup-claude-integration.sh
```

2. **Test the integration:**
```bash
claude --message "Test the Gemini planning MCP connection"
```

### Plan-Then-Execute Workflow

For automatic planning and execution, use this pattern:

```bash
claude --message "
Please help me build a [PROJECT TYPE] with these requirements:
[LIST REQUIREMENTS]

Workflow:
1. Create a project context for this task
2. Generate a detailed implementation plan using Gemini
3. Execute the plan step by step

Please follow this workflow automatically."
```

### Example Usage

```bash
# Simple todo app with automatic planning
claude --message "Build a React todo app with local storage. First create a project context, generate a plan with Gemini, then implement it."

# API development with planning
claude --message "Create a REST API for task management with JWT auth. Use the Gemini MCP to plan the architecture, then implement it step by step."
```

See `examples/plan-then-execute-workflow.md` for more detailed examples.

## Context Management

The system maintains persistent contexts in the `contexts/` directory. Each context includes:
- Project requirements and constraints
- Planning history with multiple sessions
- Execution feedback and artifacts
- Risk assessments and alternatives

Context data is managed through the shared context store at `shared-context/context-store.ts`.

## Testing Strategy

- Unit tests: Test Gemini CLI connectivity and response parsing
- Integration tests: Test MCP tool functionality
- System tests: End-to-end workflow testing via `test-system.sh`

## Prerequisites

- Node.js 18+
- Go 1.19+ (for Gemini CLI installation)
- Valid Gemini API key
- Claude Code installed with MCP support