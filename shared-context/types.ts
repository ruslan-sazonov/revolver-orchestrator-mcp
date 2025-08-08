export interface PlanningContext {
  id: string;
  projectName: string;
  requirements: string;
  constraints?: string;
  currentPhase: 'planning' | 'executing' | 'reviewing' | 'complete';
  planningHistory: PlanningSession[];
  executionHistory: ExecutionSession[];
  feedback: FeedbackItem[];
  artifacts: CodeArtifact[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanningSession {
  id: string;
  timestamp: Date;
  model: string;
  input: {
    requirements: string;
    constraints: string;
    previousFeedback?: string[];
  };
  output: {
    plan: DetailedPlan;
    reasoning: string;
    alternatives: string[];
    risks: Risk[];
  };
  quality_score?: number;
}

export interface DetailedPlan {
  overview: string;
  architecture: ArchitecturalDecision[];
  implementation_steps: ImplementationStep[];
  file_structure: FileStructure;
  dependencies: Dependency[];
  testing_strategy: string;
  deployment_notes: string;
  data_models?: DataModel[];
  routes?: RouteSpec[];
  components?: ComponentSpec[];
  content_types?: ContentTypeSpec[];
}

export interface ImplementationStep {
  id: string;
  phase: string;
  description: string;
  files_to_create: string[];
  files_to_modify: string[];
  dependencies: string[];
  estimated_complexity: 'low' | 'medium' | 'high';
  validation_criteria: string[];
}

export interface ArchitecturalDecision {
  component: string;
  purpose: string;
  technologies: string[];
  interfaces: string[];
  dependencies: string[];
}

export interface FileStructure {
  [key: string]: any;
}

export interface DataModelField {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface DataModel {
  name: string;
  fields: DataModelField[];
}

export interface RouteSpecParam {
  name: string;
  type: string;
  required?: boolean;
}

export interface RouteSpec {
  path: string;
  method?: string;
  description?: string;
  params?: RouteSpecParam[];
}

export interface ComponentSpec {
  name: string;
  category?: string;
  responsibilities?: string[];
}

export interface ContentTypeSpecField {
  name: string;
  type: string;
  required?: boolean;
}

export interface ContentTypeSpec {
  name: string;
  fields: ContentTypeSpecField[];
}

export interface Dependency {
  name: string;
  version: string;
  purpose: string;
  type?: 'runtime' | 'dev' | 'peer';
}

export interface Risk {
  risk: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface ExecutionSession {
  id: string;
  timestamp: Date;
  plan_id: string;
  claude_code_output: string;
  files_created: string[];
  files_modified: string[];
  issues: Issue[];
  success_rate: number;
  completion_status: 'complete' | 'partial' | 'failed';
}

export interface Issue {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  file?: string;
  line?: number;
}

export interface FeedbackItem {
  id: string;
  source: 'claude' | 'planner' | 'user' | 'system';
  type: 'improvement' | 'issue' | 'suggestion' | 'validation';
  phase: 'planning' | 'execution';
  content: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  created_at: Date;
}

export interface CodeArtifact {
  id: string;
  name: string;
  content: string;
  type: 'file' | 'directory' | 'config';
  created_at: Date;
}
