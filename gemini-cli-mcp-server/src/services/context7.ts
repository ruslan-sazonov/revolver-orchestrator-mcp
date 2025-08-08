const DEFAULT_URL = process.env.CONTEXT7_URL || 'https://mcp.context7.com/mcp';

type RpcRequest = { jsonrpc: '2.0'; id: string; method: string; params?: unknown };
type RpcError = { code: number; message: string };
type ToolContent = { type: 'text'; text: string };
type CallToolResult = { content: ToolContent[] };
type RpcResponse<T> = { jsonrpc: '2.0'; id: string; result?: T; error?: RpcError };

export class Context7Client {
  private url: string;

  constructor(url: string = DEFAULT_URL) {
    this.url = url;
  }

  private parsePossiblySSE<T = unknown>(raw: string): T {
    const trimmed = raw.trim();
    if (trimmed.startsWith('event:') || trimmed.includes('\ndata:')) {
      const dataLines = trimmed
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.replace(/^data:\s*/, ''));
      const last = dataLines[dataLines.length - 1];
      if (!last) throw new Error(`Failed to parse Context7 SSE response: ${raw}`);
      return JSON.parse(last) as T;
    }
    return JSON.parse(raw) as T;
  }

  async listTools(): Promise<any> {
    const body: RpcRequest = {
      jsonrpc: '2.0',
      id: String(Date.now()),
      method: 'tools/list'
    };

    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Context7 HTTP ${res.status}${text ? `: ${text}` : ''}`);
    }
    try {
      const parsed = this.parsePossiblySSE<RpcResponse<any>>(text);
      const data = parsed as RpcResponse<any>;
      if (data.error) throw new Error(data.error.message);
      return data.result;
    } catch (e) {
      throw new Error(`Failed to parse Context7 response: ${text}`);
    }
  }

  private async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    const body: RpcRequest = {
      jsonrpc: '2.0',
      id: String(Date.now()),
      method: 'tools/call',
      params: { name, arguments: args }
    };

    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify(body)
    });

    const raw = await res.text();
    if (!res.ok) {
      throw new Error(`Context7 HTTP ${res.status}${raw ? `: ${raw}` : ''}`);
    }

    let data: RpcResponse<CallToolResult>;
    try {
      data = this.parsePossiblySSE<RpcResponse<CallToolResult>>(raw);
    } catch {
      throw new Error(`Failed to parse Context7 response: ${raw}`);
    }
    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data.result?.content?.[0]?.text;
    if (!text) {
      throw new Error('Context7 returned empty content');
    }
    return text;
  }

  async resolveLibraryId(libraryName: string): Promise<string> {
    const text = await this.callTool('resolve-library-id', { libraryName });
    return text.trim();
  }

  async getLibraryDocs(context7CompatibleLibraryID: string, topic?: string, tokens?: number): Promise<string> {
    const args: Record<string, unknown> = { context7CompatibleLibraryID };
    if (topic) args.topic = topic;
    if (tokens) args.tokens = tokens;
    return await this.callTool('get-library-docs', args);
  }
}

export type LibrarySpec = { name: string; topic?: string; tokens?: number };

