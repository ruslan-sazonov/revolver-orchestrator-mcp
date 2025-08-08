import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { PlanningContext, PlanningSession, ExecutionSession, FeedbackItem } from './types.js';

export class ContextStore extends EventEmitter {
  private contextsDir: string;
  private activeContexts: Map<string, PlanningContext> = new Map();

  constructor(contextsDir: string = './contexts') {
    super();
    this.contextsDir = contextsDir;
    this.ensureContextsDir();
  }

  private async ensureContextsDir() {
    try {
      await fs.mkdir(this.contextsDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async createContext(
    projectName: string, 
    requirements: string, 
    constraints?: string
  ): Promise<PlanningContext> {
    const id = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const context: PlanningContext = {
      id,
      projectName,
      requirements,
      constraints,
      currentPhase: 'planning',
      planningHistory: [],
      executionHistory: [],
      feedback: [],
      artifacts: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveContext(context);
    this.activeContexts.set(id, context);
    this.emit('contextCreated', context);
    
    return context;
  }

  async getContext(contextId: string): Promise<PlanningContext | null> {
    if (this.activeContexts.has(contextId)) {
      return this.activeContexts.get(contextId)!;
    }

    try {
      const contextPath = path.join(this.contextsDir, `${contextId}.json`);
      const data = await fs.readFile(contextPath, 'utf-8');
      const context = JSON.parse(data);
      this.activeContexts.set(contextId, context);
      return context;
    } catch (error) {
      return null;
    }
  }

  async updateContext(contextId: string, updates: Partial<PlanningContext>): Promise<PlanningContext> {
    const context = await this.getContext(contextId);
    if (!context) {
      throw new Error(`Context ${contextId} not found`);
    }

    const updatedContext = {
      ...context,
      ...updates,
      updatedAt: new Date()
    };

    await this.saveContext(updatedContext);
    this.activeContexts.set(contextId, updatedContext);
    this.emit('contextUpdated', { contextId, updates, fullContext: updatedContext });
    
    return updatedContext;
  }

  async addPlanningSession(contextId: string, session: PlanningSession): Promise<void> {
    const context = await this.getContext(contextId);
    if (!context) throw new Error(`Context ${contextId} not found`);

    context.planningHistory.push(session);
    await this.updateContext(contextId, { 
      planningHistory: context.planningHistory,
      currentPhase: 'executing'
    });
  }

  async addExecutionSession(contextId: string, session: ExecutionSession): Promise<void> {
    const context = await this.getContext(contextId);
    if (!context) throw new Error(`Context ${contextId} not found`);

    context.executionHistory.push(session);
    await this.updateContext(contextId, { 
      executionHistory: context.executionHistory,
      currentPhase: session.success_rate > 0.8 ? 'complete' : 'reviewing'
    });
  }

  async addFeedback(contextId: string, feedback: FeedbackItem): Promise<void> {
    const context = await this.getContext(contextId);
    if (!context) throw new Error(`Context ${contextId} not found`);

    context.feedback.push(feedback);
    await this.updateContext(contextId, { feedback: context.feedback });
  }

  private async saveContext(context: PlanningContext): Promise<void> {
    const contextPath = path.join(this.contextsDir, `${context.id}.json`);
    await fs.writeFile(contextPath, JSON.stringify(context, null, 2));
  }
}

export const globalContextStore = new ContextStore();
