const fs = require('fs');
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Show pending dev features
const pendingDev = features.filter(f => !f.is_dev_done && !f.passes);
console.log('=== PENDING DEV FEATURES (First 30) ===');
pendingDev.slice(0, 30).forEach((f, i) => {
  console.log(`${i+1}. [${f.id || 'N/A'}] ${f.description}`);
  console.log(`   Category: ${f.category}, Priority: ${f.priority || 'N/A'}`);
});

console.log(`\nTotal pending dev: ${pendingDev.length}`);
