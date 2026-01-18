import fs from 'fs';
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const failing = features.filter(f => !f.passes);
console.log('=== FAILING FEATURES SUMMARY ===');
console.log(`Total: ${features.length} | Passing: ${features.length - failing.length} | Failing: ${failing.length}`);

// Group by category
const byCategory = {};
failing.forEach(f => {
  if (!byCategory[f.category]) byCategory[f.category] = [];
  byCategory[f.category].push(f.description.substring(0, 80));
});

Object.entries(byCategory).forEach(([cat, items]) => {
  console.log(`\n${cat.toUpperCase()} (${items.length}):`);
  items.slice(0, 5).forEach(desc => console.log(`  - ${desc}`));
  if (items.length > 5) console.log(`  ... and ${items.length - 5} more`);
});
