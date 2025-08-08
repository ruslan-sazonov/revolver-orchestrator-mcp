#!/bin/bash

echo "🧪 Testing AI Planning System..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Test Gemini CLI
echo "1. Testing Gemini CLI..."
if command -v gemini &> /dev/null; then
    echo "✅ Gemini CLI is installed"
    
    if [ -n "$GEMINI_API_KEY" ] && [ "$GEMINI_API_KEY" != "your-gemini-api-key-here" ]; then
        echo "Testing with API key..."
        GEMINI_API_KEY="$GEMINI_API_KEY" gemini --model "$GEMINI_MODEL" --prompt "Say 'Hello from Gemini CLI!' in JSON format"
        if [ $? -eq 0 ]; then
            echo "✅ Gemini CLI API test successful"
        else
            echo "❌ Gemini CLI API test failed"
        fi
    else
        echo "⚠️  No valid GEMINI_API_KEY found in environment"
    fi
else
    echo "❌ Gemini CLI not found in PATH"
    exit 1
fi

# Test MCP server
echo "2. Testing Gemini MCP server..."
if [ -f "gemini-cli-mcp-server/build/index.js" ]; then
    echo "✅ Gemini MCP server built"
else
    echo "🔨 Building Gemini MCP server..."
    cd gemini-cli-mcp-server && npm run build && cd ..
fi

echo "3. Testing Claude integration..."
echo "Run the following command to test with Claude:"
echo "claude --message 'Test the Gemini planning MCP by creating a simple project context'"

echo ""
echo "✅ System test complete!"
