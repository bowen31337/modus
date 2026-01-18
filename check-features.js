const fs = require('fs');
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Show QA pending features
const pendingQA = features.filter(f => f.is_dev_done && !f.is_qa_passed);
console.log('=== PENDING QA FEATURES ===');
pendingQA.forEach((f, i) => {
  console.log(`${i+1}. [${f.id || 'N/A'}] ${f.description}`);
  console.log(`   dev_done: ${f.is_dev_done}, qa_passed: ${f.is_qa_passed}, passes: ${f.passes}`);
});

// Show passing features count
const passing = features.filter(f => f.passes);
console.log(`\n=== SUMMARY ===`);
console.log(`Total features: ${features.length}`);
console.log(`Passing: ${passing.length}`);
console.log(`Pending dev: ${features.filter(f => !f.is_dev_done && !f.passes).length}`);
console.log(`Dev complete, pending QA: ${pendingQA.length}`);
