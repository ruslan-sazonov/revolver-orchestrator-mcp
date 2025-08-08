#!/bin/bash

echo "📦 Installing all project dependencies..."

# Install Gemini CLI MCP server dependencies
echo "Installing Gemini CLI MCP server dependencies..."
cd gemini-cli-mcp-server
npm install
cd ..

echo "Building TypeScript projects..."
cd gemini-cli-mcp-server
npm run build
cd ..

echo "✅ All dependencies installed and built!"
