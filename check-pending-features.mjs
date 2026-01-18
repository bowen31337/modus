import fs from 'fs';

const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Find features that need DEV work
const pendingDev = data.filter(f => !f.passes && !f.is_dev_done);

// Group by category for better organization
const categories = {};
pendingDev.forEach(f => {
  if (!categories[f.category]) {
    categories[f.category] = [];
  }
  categories[f.category].push(f);
});

console.log('=== PENDING DEV FEATURES BY CATEGORY ===\n');

Object.keys(categories).sort().forEach(category => {
  console.log(`\n${category.toUpperCase()} (${categories[category].length} features):`);
  console.log('='.repeat(80));
  categories[category].slice(0, 10).forEach(f => {
    console.log(`  - ${f.description.substring(0, 100)}${f.description.length > 100 ? '...' : ''}`);
  });
});

// Find features that are dev-done but need QA
const pendingQA = data.filter(f => f.is_dev_done && !f.passes);
console.log('\n\n=== PENDING QA FEATURES (Need Verification) ===\n');
console.log(`Total: ${pendingQA.length} features\n`);

pendingQA.slice(0, 20).forEach(f => {
  console.log(`  - ${f.description.substring(0, 100)}${f.description.length > 100 ? '...' : ''}`);
});
