import fs from 'fs';
const features = JSON.parse(fs.readFileSync('./feature_list.json', 'utf8'));
const pendingQA = features.filter(f => f.is_dev_done && !f.passes);

console.log("=== PENDING QA FEATURES (56 total) ===\n");

console.log("Infrastructure/Backend:");
pendingQA.filter(f => f.description.includes("Real-time") || f.description.includes("RLS") || f.description.includes("Supabase"))
  .slice(0, 10)
  .forEach((f, i) => console.log(`${i+1}. ${f.description}`));

console.log("\nRole-Based Access Control:");
pendingQA.filter(f => f.description.includes("role") || f.description.includes("RBAC") || f.description.includes("Admin") || f.description.includes("Supervisor"))
  .slice(0, 10)
  .forEach((f, i) => console.log(`${i+1}. ${f.description}`));

console.log("\nAI & Features:");
pendingQA.filter(f => f.description.includes("AI") || f.description.includes("RAG") || f.description.includes("SLA"))
  .slice(0, 10)
  .forEach((f, i) => console.log(`${i+1}. ${f.description}`));

console.log("\nPerformance:");
pendingQA.filter(f => f.description.includes("performance") || f.description.includes("load") || f.description.includes("concurrent"))
  .slice(0, 10)
  .forEach((f, i) => console.log(`${i+1}. ${f.description}`));

console.log("\nUI/UX:");
pendingQA.filter(f => f.description.includes("Icons") || f.description.includes("Logo") || f.description.includes("Avatar") || f.description.includes("Timestamp"))
  .slice(0, 10)
  .forEach((f, i) => console.log(`${i+1}. ${f.description}`));
