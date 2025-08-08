#!/bin/bash

echo "🔍 MCP Server Debug Information"
echo "================================"
echo ""

# Check if Claude is available (handle aliases)
CLAUDE_CMD=""
if command -v claude &> /dev/null; then
    CLAUDE_CMD="claude"
elif [ -f "$HOME/.claude/local/claude" ]; then
    CLAUDE_CMD="$HOME/.claude/local/claude"
else
    echo "❌ Claude command not found"
    echo "Checked locations:"
    echo "  - claude in PATH"
    echo "  - $HOME/.claude/local/claude"
    exit 1
fi

echo "✅ Claude available at: $CLAUDE_CMD"

# Check MCP server list
echo "📋 MCP Server Status:"
claude mcp list
echo ""

# Check if config file exists
CLAUDE_CONFIG_FILE="$HOME/.config/claude/mcp_settings.json"
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "✅ MCP config file exists at: $CLAUDE_CONFIG_FILE"
    echo "📄 Config file contents:"
    cat "$CLAUDE_CONFIG_FILE"
    echo ""
else
    echo "❌ MCP config file not found at: $CLAUDE_CONFIG_FILE"
fi

# Check if MCP server build exists
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_SERVER_PATH="$PROJECT_DIR/gemini-cli-mcp-server/build/index.js"

if [ -f "$MCP_SERVER_PATH" ]; then
    echo "✅ MCP server build exists at: $MCP_SERVER_PATH"
else
    echo "❌ MCP server build not found at: $MCP_SERVER_PATH"
    echo "Run: cd $PROJECT_DIR/gemini-cli-mcp-server && npm run build"
fi

# Check environment variables
echo "🌍 Environment Variables:"
env | grep GEMINI || echo "No GEMINI environment variables found"
echo ""

# Test MCP server startup
echo "🧪 Testing MCP server startup..."
cd "$PROJECT_DIR"
if [ -f ".env" ]; then
    source .env
    echo "Environment loaded from .env file"
else
    echo "⚠️  No .env file found"
fi

# Try to start MCP server briefly
echo "Testing MCP server process..."
cd gemini-cli-mcp-server
GEMINI_API_KEY="$GEMINI_API_KEY" GEMINI_MODEL="$GEMINI_MODEL" node build/index.js &
SERVER_PID=$!
sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ MCP server starts successfully"
    kill $SERVER_PID
else
    echo "❌ MCP server failed to start"
fi

echo ""
echo "🔄 If MCP server is not showing in 'claude mcp list':"
echo "   1. Restart Claude completely"
echo "   2. Wait a few seconds after restart"
echo "   3. Run 'claude mcp list' again"