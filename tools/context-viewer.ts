import { globalContextStore } from '../shared-context/context-store.js';

async function viewContext(contextId: string) {
  const context = await globalContextStore.getContext(contextId);
  
  if (!context) {
    console.log(`Context ${contextId} not found`);
    return;
  }
  
  console.log('📊 Project Context Overview');
  console.log(`ID: ${context.id}`);
  console.log(`Project: ${context.projectName}`);
  console.log(`Phase: ${context.currentPhase}`);
  console.log(`Created: ${context.createdAt}`);
  console.log(`Updated: ${context.updatedAt}`);
  console.log();
  
  console.log('📋 Planning History:');
  context.planningHistory.forEach((plan, i) => {
    console.log(`  ${i + 1}. ${plan.timestamp} - ${plan.model}`);
    console.log(`     Steps: ${plan.output.plan.implementation_steps.length}`);
  });
  console.log();
  
  console.log('🚀 Execution History:');
  context.executionHistory.forEach((exec, i) => {
    console.log(`  ${i + 1}. ${exec.timestamp} - Success: ${exec.success_rate}%`);
    console.log(`     Files: ${exec.files_created.length} created, ${exec.files_modified.length} modified`);
    console.log(`     Issues: ${exec.issues.length}`);
  });
  console.log();
  
  console.log('💬 Feedback:');
  const unresolved = context.feedback.filter(f => !f.resolved);
  console.log(`  Total: ${context.feedback.length}, Unresolved: ${unresolved.length}`);
  unresolved.forEach(f => {
    console.log(`  - [${f.priority}] ${f.content}`);
  });
}

// Usage: node tools/context-viewer.js <contextId>
if (process.argv.length > 2) {
  viewContext(process.argv[2]);
}
