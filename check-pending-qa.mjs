const fs = require('fs');
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const pendingQA = features.filter(f => f.is_dev_done && !f.passes);

console.log('Features Dev Complete but Awaiting QA:', pendingQA.length);
console.log('\nTop 15 Pending QA Features:');
pendingQA.slice(0, 15).forEach((f, i) => {
  console.log(`${i+1}. ${f.feature_id}: ${f.title}`);
  console.log(`   Status: ${f.is_dev_done ? 'Dev Done' : 'Pending Dev'} | Passes: ${f.passes}`);
});
