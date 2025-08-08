import { DetailedPlan, ImplementationStep } from '../shared-context/types.js';

function groupStepsByPhase(steps: ImplementationStep[]): Record<string, ImplementationStep[]> {
  return steps.reduce((acc, s) => {
    const key = s.phase || 'unspecified';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, ImplementationStep[]>);
}

function renderChecklistItem(title: string): string {
  return `- [ ] ${title}`;
}

function renderList(items: string[], indent: number = 0): string {
  const pad = '  '.repeat(indent);
  return items.map(i => `${pad}- ${i}`).join('\n');
}

function renderFileTree(structure: any, prefix: string = ''): string[] {
  const lines: string[] = [];
  if (!structure || typeof structure !== 'object') return lines;
  for (const key of Object.keys(structure)) {
    const full = prefix ? `${prefix}/${key}` : key;
    lines.push(full.endsWith('/') ? full : `${full}`);
    const child = structure[key];
    if (child && typeof child === 'object') {
      const childLines = renderFileTree(child, full);
      lines.push(...childLines);
    }
  }
  return lines;
}

export function renderPlanChecklist(plan: DetailedPlan): string {
  const out: string[] = [];
  if (plan.overview) {
    out.push(`Overview: ${plan.overview}`);
    out.push('');
  }

  if (plan.dependencies && plan.dependencies.length) {
    out.push('Dependencies:');
    out.push(renderList(plan.dependencies.map(d => `${d.name}${d.version ? `@${d.version}` : ''} — ${d.purpose}`), 1));
    out.push('');
  }

  if (plan.file_structure && Object.keys(plan.file_structure).length) {
    const files = renderFileTree(plan.file_structure);
    if (files.length) {
      out.push('File Structure:');
      out.push(renderList(files, 1));
      out.push('');
    }
  }

  if ((plan as any).data_models && (plan as any).data_models.length) {
    const models = (plan as any).data_models as Array<{ name: string; fields: Array<{ name: string; type: string }> }>;
    out.push('Data Models:');
    out.push(renderList(models.map(m => `${m.name} (${m.fields.map(f => `${f.name}:${f.type}`).join(', ')})`), 1));
    out.push('');
  }

  if ((plan as any).routes && (plan as any).routes.length) {
    const routes = (plan as any).routes as Array<{ path: string; method?: string; description?: string }>;
    out.push('Routes:');
    out.push(renderList(routes.map(r => `${r.method || 'ANY'} ${r.path}${r.description ? ` — ${r.description}` : ''}`), 1));
    out.push('');
  }

  if ((plan as any).components && (plan as any).components.length) {
    const comps = (plan as any).components as Array<{ name: string; category?: string }>;
    out.push('Components:');
    out.push(renderList(comps.map(c => `${c.name}${c.category ? ` [${c.category}]` : ''}`), 1));
    out.push('');
  }

  if (plan.implementation_steps && plan.implementation_steps.length) {
    out.push('Implementation Steps:');
    const grouped = groupStepsByPhase(plan.implementation_steps);
    for (const phase of Object.keys(grouped)) {
      out.push(`  ${phase}:`);
      for (const step of grouped[phase]) {
        out.push(`  ${renderChecklistItem(`${step.id} ${step.description}`)}`);
        if (step.files_to_create?.length) out.push(renderList(step.files_to_create.map(f => `create ${f}`), 2));
        if (step.files_to_modify?.length) out.push(renderList(step.files_to_modify.map(f => `modify ${f}`), 2));
      }
    }
    out.push('');
  }

  if (plan.testing_strategy) {
    out.push('Testing Strategy:');
    out.push(`  - ${plan.testing_strategy}`);
    out.push('');
  }

  if (plan.deployment_notes) {
    out.push('Deployment Notes:');
    out.push(`  - ${plan.deployment_notes}`);
    out.push('');
  }

  return out.join('\n');
}


