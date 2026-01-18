import fs from 'fs';
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const failing = features.filter(f => !f.passes);

console.log('=== ALL FAILING FEATURES ===\n');
failing.forEach((f, i) => {
  console.log(`${i + 1}. [${f.category}] ${f.description}`);
  console.log(`   is_dev_done: ${f.is_dev_done}, dev_failure_count: ${f.dev_failure_count || 0}`);
  console.log('');
});
