import fs from 'fs';

const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const failing = features.filter(f => !f.passes);

console.log('=== REMAINING FAILING FEATURES ===\n');
failing.forEach((f, i) => {
  console.log(`${i+1}. [${f.category}] ${f.description}`);
  console.log(`   Dev done: ${f.is_dev_done} | QA passed: ${f.is_qa_passed}`);
  console.log(`   Retries: ${f.qa_retry_count || 0} | Failures: ${f.dev_failure_count || 0}\n`);
});

const byCategory = failing.reduce((acc, f) => {
  acc[f.category] = (acc[f.category] || 0) + 1;
  return acc;
}, {});

console.log('=== BY CATEGORY ===');
Object.entries(byCategory).forEach(([cat, count]) => console.log(`${cat}: ${count}`));
