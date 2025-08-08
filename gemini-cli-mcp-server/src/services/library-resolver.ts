import { GeminiCLIWrapper, GeminiConfig } from '../gemini-cli-wrapper.js';
import { LibrarySpec } from './context7.js';

export class LibraryResolver {
  private gemini: GeminiCLIWrapper;

  constructor(config: GeminiConfig) {
    this.gemini = new GeminiCLIWrapper(config);
  }

  async resolveFromPrompt(prompt: string): Promise<LibrarySpec[]> {
    const extractionPrompt = this.buildExtractionPrompt(prompt);
    const raw = await this.gemini.generatePlan(extractionPrompt);
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      const match = raw.match(/```json\s*([\s\S]*?)\s*```/)
        || raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Failed to parse libraries from prompt');
      data = JSON.parse(match[match.length - 1]);
    }
    if (!Array.isArray(data)) throw new Error('Expected an array of libraries');
    return (data as any[])
      .map((x) => ({ name: String(x.name || '').trim(), topic: x.topic ? String(x.topic) : undefined, tokens: typeof x.tokens === 'number' ? x.tokens : undefined }))
      .filter((x) => x.name);
  }

  private buildExtractionPrompt(userPrompt: string): string {
    return `Extract a minimal list of libraries relevant to this task. Respond ONLY with a JSON array of objects using this schema:
[
  { "name": "string", "topic": "string?", "tokens":  number? }
]

Rules:
- name must be canonical and resolvable by developers, e.g. "react", "next.js", "supabase/supabase", "tanstack/query".
- Prefer npm names; if not applicable, use GitHub owner/repo form.
- Include topic only if the user intent suggests a focus (e.g. "auth", "routing", "storage").
- tokens is optional; include only when the task is complex and needs more context.

User prompt:
${userPrompt}`;
  }
}


