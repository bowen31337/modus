const fs = require('fs');
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Group by status
const groups = {
  'passing': [],
  'failing': [],
  'pending_dev': [],
  'pending_qa': []
};

for (const f of features) {
  if (f.passes) {
    groups.passing.push(f);
  } else if (f.is_dev_done && !f.is_qa_passed) {
    groups.pending_qa.push(f);
  } else if (!f.is_dev_done) {
    groups.pending_dev.push(f);
  } else {
    groups.failing.push(f);
  }
}

console.log('=== Feature Status Summary ===');
console.log('Total:', features.length);
console.log('Passing:', groups.passing.length);
console.log('Pending Dev:', groups.pending_dev.length);
console.log('Pending QA:', groups.pending_qa.length);
console.log('Failing (dev done, qa failed):', groups.failing.length);

console.log('\n=== Pending Dev Features (count: ' + groups.pending_dev.length + ') ===');
for (const f of groups.pending_dev) {
  const name = f.name || f.description || 'Unnamed feature';
  console.log('- ' + f.id + ': ' + name.substring(0, 60));
}

console.log('\n=== Pending QA Features (count: ' + groups.pending_qa.length + ') ===');
for (const f of groups.pending_qa) {
  const name = f.name || f.description || 'Unnamed feature';
  console.log('- ' + f.id + ': ' + name.substring(0, 60));
}
