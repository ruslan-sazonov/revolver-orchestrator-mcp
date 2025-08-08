import { GeminiCLIWrapper } from '../build/gemini-cli-wrapper.js';

async function testConnection() {
  console.log('🧪 Testing Gemini CLI connection...');
  
  const config = {
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.3,
    maxTokens: 1000,
    cliPath: process.env.GEMINI_CLI_PATH || 'gemini'
  };
  
  const wrapper = new GeminiCLIWrapper(config);
  
  try {
    const isConnected = await wrapper.testConnection();
    
    if (isConnected) {
      console.log('✅ Connection successful!');
    } else {
      console.log('❌ Connection failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
