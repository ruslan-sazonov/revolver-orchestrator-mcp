import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
export class ContextStore extends EventEmitter {
    contextsDir;
    activeContexts = new Map();
    constructor(contextsDir = './contexts') {
        super();
        this.contextsDir = contextsDir;
        this.ensureContextsDir();
    }
    async ensureContextsDir() {
        try {
            await fs.mkdir(this.contextsDir, { recursive: true });
        }
        catch (error) {
            // Directory already exists
        }
    }
    async createContext(projectName, requirements, constraints) {
        const id = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        const context = {
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
    async getContext(contextId) {
        if (this.activeContexts.has(contextId)) {
            return this.activeContexts.get(contextId);
        }
        try {
            const contextPath = path.join(this.contextsDir, `${contextId}.json`);
            const data = await fs.readFile(contextPath, 'utf-8');
            const context = JSON.parse(data);
            this.activeContexts.set(contextId, context);
            return context;
        }
        catch (error) {
            return null;
        }
    }
    async updateContext(contextId, updates) {
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
    async addPlanningSession(contextId, session) {
        const context = await this.getContext(contextId);
        if (!context)
            throw new Error(`Context ${contextId} not found`);
        context.planningHistory.push(session);
        await this.updateContext(contextId, {
            planningHistory: context.planningHistory,
            currentPhase: 'executing'
        });
    }
    async addExecutionSession(contextId, session) {
        const context = await this.getContext(contextId);
        if (!context)
            throw new Error(`Context ${contextId} not found`);
        context.executionHistory.push(session);
        await this.updateContext(contextId, {
            executionHistory: context.executionHistory,
            currentPhase: session.success_rate > 0.8 ? 'complete' : 'reviewing'
        });
    }
    async addFeedback(contextId, feedback) {
        const context = await this.getContext(contextId);
        if (!context)
            throw new Error(`Context ${contextId} not found`);
        context.feedback.push(feedback);
        await this.updateContext(contextId, { feedback: context.feedback });
    }
    async saveContext(context) {
        const contextPath = path.join(this.contextsDir, `${context.id}.json`);
        await fs.writeFile(contextPath, JSON.stringify(context, null, 2));
    }
}
export const globalContextStore = new ContextStore();
