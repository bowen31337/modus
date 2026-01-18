const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const failing = data.filter(f => !f.passes);
console.log('Failing features:');
failing.forEach((f, i) => {
  console.log(`${i + 1}. ${f.description}`);
  console.log(`   Category: ${f.category}`);
  console.log('');
});
