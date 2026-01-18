const fs = require('fs');
const features = JSON.parse(fs.readFileSync('./feature_list.json', 'utf8'));
const failing = features.filter(f => !f.passes);
console.log('Sample failing features:');
failing.slice(0, 10).forEach((f, i) => {
  console.log(`${i+1}. ${f.description}`);
  console.log(`   Category: ${f.category}`);
  console.log(`   Steps: ${f.steps ? f.steps.length : 0}`);
  console.log('');
});
