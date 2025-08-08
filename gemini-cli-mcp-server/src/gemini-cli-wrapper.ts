import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export interface GeminiConfig {
  model: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  cliPath?: string;
}

export class GeminiCLIWrapper {
  private config: GeminiConfig;
  private tempDir: string;

  constructor(config: GeminiConfig) {
    this.config = config;
    this.tempDir = tmpdir();
  }

  async generatePlan(prompt: string): Promise<string> {
    try {
      // Use --prompt for all cases since --file is not supported
      const promptArg = `--prompt "${prompt.replace(/"/g, '\\"')}"`;

      const command = this.buildGeminiCommand(promptArg);
      console.log('Executing Gemini CLI:', command);

      // Set up environment variables for the CLI
      const env = {
        ...process.env,
        GEMINI_API_KEY: this.config.apiKey
      };

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10,
        timeout: 60000,
        env
      });

      if (stderr && stderr.trim()) {
        // Filter out deprecation warnings
        const filteredStderr = stderr
          .split('\n')
          .filter(line => !line.includes('DEP0040') && !line.includes('punycode'))
          .join('\n')
          .trim();
        
        if (filteredStderr) {
          console.warn('Gemini CLI stderr:', filteredStderr);
        }
      }

      // The modern Gemini CLI may wrap JSON responses in code blocks
      let response = stdout.trim();
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        response = jsonMatch[1];
      }

      return response;
    } catch (error) {
      console.error('Gemini CLI execution failed:', error);
      throw new Error(`Gemini CLI failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildGeminiCommand(promptArg: string, stream: boolean = false): string {
    const parts = [this.config.cliPath || 'gemini'];

    if (this.config.model) {
      parts.push(`--model "${this.config.model}"`);
    }

    // This CLI uses environment variables for API key and configuration
    // The modern Gemini CLI expects these to be set in environment
    parts.push(promptArg);

    return parts.join(' ');
  }

  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = "Say 'connection test successful' in JSON format.";
      const result = await this.generatePlan(testPrompt);
      return result.includes('connection test successful');
    } catch (error) {
      console.error('Gemini CLI connection test failed:', error);
      return false;
    }
  }
}
