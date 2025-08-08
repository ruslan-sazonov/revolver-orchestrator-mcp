# Plan-Then-Execute Workflow Examples

This document shows how to use the Gemini MCP integration with Claude Code to automatically plan and then execute development tasks.

## Basic Workflow Pattern

The typical workflow follows this pattern:

1. **Create Project Context** - Define the project requirements
2. **Generate Plan with Gemini** - Use Gemini 2.5 Pro to create a detailed implementation plan
3. **Execute Plan** - Claude Code implements the plan step by step

## Example Commands

### 1. Simple Web App Development

```bash
claude --message "
Please help me build a React todo application with the following requirements:
- Add, edit, delete todos
- Mark todos as complete
- Local storage persistence
- Clean, modern UI

First, create a project context for this todo app, then generate a detailed plan using Gemini, and finally implement the entire application following that plan.
"
```

### 2. API Development

```bash
claude --message "
I need to build a REST API for a task management system with these requirements:
- User authentication (JWT)
- CRUD operations for tasks
- Task categories and priorities
- SQLite database
- Express.js backend

Please create a project context, generate a comprehensive plan with Gemini, and then implement the complete API following the plan.
"
```

### 3. Full-Stack Application

```bash
claude --message "
Build a real-time chat application with:
- React frontend with real-time messaging
- Node.js/Express backend with WebSocket support
- User authentication and rooms
- Message history persistence
- Responsive design

Start by creating a project context, use Gemini to generate a detailed architecture plan, then implement the full application step by step.
"
```

## Step-by-Step Manual Process

If you want to control each step manually:

### Step 1: Create Project Context
```bash
claude --message "
Create a project context for a React todo application with local storage.
Requirements: Add/edit/delete todos, mark complete, clean UI.
"
```

### Step 2: Generate Plan
```bash
claude --message "
Use the Gemini planning MCP to generate a detailed implementation plan for the todo app context we just created.
"
```

### Step 3: Implement Plan
```bash
claude --message "
Now implement the plan step by step, creating all the necessary files and components for the todo application.
"
```

## Available MCP Tools

The system provides these MCP tools for planning workflows:

### `test_gemini_connection`
Tests connectivity to Gemini CLI.

**Usage:**
```bash
claude --message "Test the Gemini planning MCP connection"
```

### `create_project_context`
Creates a new project planning context.

**Parameters:**
- `projectName`: Name of the project
- `requirements`: Detailed project requirements
- `constraints`: Any constraints or limitations (optional)

**Usage:**
```bash
claude --message "Create a project context called 'E-commerce Site' with requirements for user authentication, product catalog, shopping cart, and payment processing"
```

### `generate_plan_with_gemini`
Generates a detailed implementation plan using Gemini CLI.

**Parameters:**
- `contextId`: The ID of the project context to plan for

**Usage:**
```bash
claude --message "Generate a plan with Gemini for the project context we just created"
```

## Advanced Workflow Integration

### Automated Planning Prompt Template

Use this template to trigger automatic plan-then-execute:

```
Please help me [TASK DESCRIPTION] with these requirements:
[LIST OF REQUIREMENTS]

Workflow:
1. Create a project context for this task
2. Generate a detailed implementation plan using Gemini
3. Execute the plan step by step, implementing all necessary code and files

Please follow this workflow automatically and provide updates at each stage.
```

### Example with Error Handling

```bash
claude --message "
Build a Python web scraper with these requirements:
- Scrape product data from e-commerce sites
- Handle rate limiting and errors
- Save to CSV and JSON formats
- Command-line interface

Workflow:
1. Create project context
2. Generate plan with Gemini (include error handling and best practices)
3. Implement with proper error handling and testing
4. Test the scraper with sample sites

If any step fails, use the context feedback to refine the approach.
"
```

## Best Practices

1. **Be Specific**: Provide detailed requirements in your initial message
2. **Include Constraints**: Mention any technology preferences or limitations  
3. **Request Planning First**: Always ask for planning before implementation
4. **Iterative Refinement**: Use feedback to improve plans
5. **Test Integration**: Verify the MCP connection before starting complex projects

## Troubleshooting

If the MCP integration isn't working:

1. Check MCP server status:
   ```bash
   ./scripts/test-system.sh
   ```

2. Verify Claude can see the MCP tools:
   ```bash
   claude --message "List available MCP tools"
   ```

3. Test connection:
   ```bash
   claude --message "Test the Gemini planning MCP connection"
   ```