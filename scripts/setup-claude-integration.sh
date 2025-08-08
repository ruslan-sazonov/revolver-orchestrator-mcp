#!/bin/bash

echo "🔗 Setting up Claude Code MCP Integration..."

# Check if Claude is installed (check multiple possible locations)
CLAUDE_CMD=""
if command -v claude &> /dev/null; then
    CLAUDE_CMD="claude"
elif [ -f "$HOME/.claude/local/claude" ]; then
    CLAUDE_CMD="$HOME/.claude/local/claude"
elif [ -f "/usr/local/bin/claude" ]; then
    CLAUDE_CMD="/usr/local/bin/claude"
else
    echo "❌ Claude is not installed."
    echo "Please install Claude first: https://claude.ai/code"
    echo "Expected locations:"
    echo "  - claude command in PATH" 
    echo "  - $HOME/.claude/local/claude"
    echo "  - /usr/local/bin/claude"
    exit 1
fi

echo "✅ Claude is installed at: $CLAUDE_CMD"

# Get absolute path to project
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Create MCP server configuration JSON
echo "📝 Registering Gemini planning MCP server with Claude..."

# Build the JSON configuration
MCP_JSON=$(cat << EOF
{
  "command": "node",
  "args": ["$PROJECT_DIR/gemini-cli-mcp-server/build/index.js"],
  "env": {
    "GEMINI_API_KEY": "$(grep GEMINI_API_KEY $PROJECT_DIR/.env | cut -d '=' -f2)",
    "GEMINI_MODEL": "$(grep GEMINI_MODEL $PROJECT_DIR/.env | cut -d '=' -f2)",
    "GEMINI_TEMPERATURE": "$(grep GEMINI_TEMPERATURE $PROJECT_DIR/.env | cut -d '=' -f2)",
    "GEMINI_MAX_TOKENS": "$(grep GEMINI_MAX_TOKENS $PROJECT_DIR/.env | cut -d '=' -f2)",
    "GEMINI_CLI_PATH": "$(grep GEMINI_CLI_PATH $PROJECT_DIR/.env | cut -d '=' -f2)"
  }
}
EOF
)

# Add the MCP server using claude mcp add-json with user scope for persistence
if $CLAUDE_CMD mcp add-json gemini-planning --scope=user "$MCP_JSON"; then
    echo "✅ Gemini planning MCP server registered successfully with user scope"
else
    echo "❌ Failed to register MCP server with user scope. Trying fallback methods..."
    
    # Try without scope (backward compatibility)
    if $CLAUDE_CMD mcp add-json gemini-planning "$MCP_JSON"; then
        echo "✅ Gemini planning MCP server registered successfully (legacy mode)"
    else
        echo "❌ Failed to register MCP server. Using direct config file approach..."
        
        # Fallback 1: Try ~/.claude.json (primary user config location)
        if [ ! -f "$HOME/.claude.json" ]; then
            echo '{"mcpServers": {}}' > "$HOME/.claude.json"
        fi
        
        # Update ~/.claude.json with MCP server
        jq --argjson server "$MCP_JSON" '.mcpServers["gemini-planning"] = $server' "$HOME/.claude.json" > "/tmp/claude_config.json" && mv "/tmp/claude_config.json" "$HOME/.claude.json"
        
        if [ $? -eq 0 ]; then
            echo "✅ MCP server added to ~/.claude.json"
        else
            # Fallback 2: ~/.config/claude approach
            CLAUDE_CONFIG_DIR="$HOME/.config/claude"
            mkdir -p "$CLAUDE_CONFIG_DIR"
            cat > "$CLAUDE_CONFIG_DIR/mcp_settings.json" << EOF
{
  "mcpServers": {
    "gemini-planning": $MCP_JSON
  }
}
EOF
            echo "✅ MCP settings created at: $CLAUDE_CONFIG_DIR/mcp_settings.json"
        fi
    fi
fi

# Ensure MCP server is built
echo "🔨 Building MCP server..."
cd "$PROJECT_DIR/gemini-cli-mcp-server" && npm run build

echo ""
echo "✅ Claude Code integration setup complete!"
echo ""
echo "🔄 IMPORTANT: Please restart Claude to load the new MCP server:"
echo "   • Close any running Claude sessions"
echo "   • Wait a few seconds"
echo "   • Start a new Claude session"
echo ""
echo "🧪 After restarting, verify the MCP server is loaded:"
echo "   claude mcp list"
echo ""
echo "🚀 Usage Examples:"
echo ""
echo "1. Plan and implement a simple project:"
echo '   claude --message "Plan and implement a React todo app with local storage"'
echo ""
echo "2. Plan a complex system:"
echo '   claude --message "Create a project context for a real-time chat app, generate a plan with Gemini, then implement it step by step"'
echo ""
echo "3. Test the MCP connection:"
echo '   claude --message "Test the Gemini planning MCP connection"'
echo ""
echo "📝 The following MCP tools will be available after restart:"
echo "   • test_gemini_connection - Test Gemini CLI connectivity"
echo "   • create_project_context - Create a planning context"
echo "   • generate_plan_with_gemini - Generate implementation plans"