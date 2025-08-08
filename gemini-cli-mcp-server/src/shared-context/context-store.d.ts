import { EventEmitter } from 'events';
import { PlanningContext, PlanningSession, ExecutionSession, FeedbackItem } from './types.js';
export declare class ContextStore extends EventEmitter {
    private contextsDir;
    private activeContexts;
    constructor(contextsDir?: string);
    private ensureContextsDir;
    createContext(projectName: string, requirements: string, constraints?: string): Promise<PlanningContext>;
    getContext(contextId: string): Promise<PlanningContext | null>;
    updateContext(contextId: string, updates: Partial<PlanningContext>): Promise<PlanningContext>;
    addPlanningSession(contextId: string, session: PlanningSession): Promise<void>;
    addExecutionSession(contextId: string, session: ExecutionSession): Promise<void>;
    addFeedback(contextId: string, feedback: FeedbackItem): Promise<void>;
    private saveContext;
}
export declare const globalContextStore: ContextStore;
