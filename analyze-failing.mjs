import fs from 'fs';
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const failing = data.filter(f => !f.passes && !f.is_dev_done);

console.log('=== FAILING FEATURES ANALYSIS ===\n');
console.log('Total failing:', failing.length, '\n');

// Group by category
const groups = {};
failing.forEach(f => {
  const cat = f.category || 'other';
  if (!groups[cat]) groups[cat] = [];
  groups[cat].push(f);
});

Object.keys(groups).sort().forEach(cat => {
  console.log(`${cat.toUpperCase()} (${groups[cat].length}):`);
  groups[cat].slice(0, 5).forEach((f, i) => {
    console.log(`  ${i+1}. ${f.description.substring(0, 70)}...`);
  });
  if (groups[cat].length > 5) {
    console.log(`  ... and ${groups[cat].length - 5} more`);
  }
  console.log('');
});
