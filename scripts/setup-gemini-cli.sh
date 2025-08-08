#!/bin/bash

echo "🔧 Setting up Gemini CLI Integration..."

# Check prerequisites
if ! command -v go &> /dev/null; then
    echo "❌ Go is required but not installed."
    echo "Please install Go from: https://golang.org/doc/install"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

# Install Gemini CLI
echo "📦 Installing Gemini CLI..."
go install github.com/google-gemini/gemini-cli/cmd/gemini@latest

# Add Go bin to PATH if not already there
if [[ ":$PATH:" != *":$(go env GOPATH)/bin:"* ]]; then
    echo "Adding Go bin to PATH..."
    echo "export PATH=\$PATH:$(go env GOPATH)/bin" >> ~/.bashrc
    export PATH=$PATH:$(go env GOPATH)/bin
fi

# Verify installation
if command -v gemini &> /dev/null; then
    echo "✅ Gemini CLI installed successfully"
    gemini --version
else
    echo "❌ Gemini CLI installation failed"
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing MCP server dependencies..."
cd gemini-cli-mcp-server
npm install
npm run build
cd ..

echo "✅ Gemini CLI integration setup complete!"
echo ""
echo "Next steps:"
echo "1. Get a Gemini API key from: https://makersuite.google.com/app/apikey"
echo "2. Add your API key to .env file"
echo "3. Test the setup: ./scripts/test-system.sh"
