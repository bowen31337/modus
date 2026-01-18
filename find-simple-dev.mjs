import fs from 'fs';
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const devPending = features.filter(f => !f.passes && !f.is_dev_done);

console.log('=== SIMPLE DEV PENDING FEATURES ===');
const simple = devPending.filter(f =>
  f.description.includes('categor') ||
  f.description.includes('admin') ||
  f.description.includes('role') ||
  f.description.includes('performance') ||
  f.description.includes('security')
);

simple.slice(0, 10).forEach((f, i) => {
  console.log(`${i+1}. ${f.description}`);
  console.log(`   Category: ${f.category}`);
  console.log(`   Steps: ${f.steps.length}`);
  console.log('');
});
