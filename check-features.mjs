import fs from 'fs';
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Find features that need work
const pending = features.filter((f) => !f.is_dev_done);
console.log('=== PENDING FEATURES ===');
console.log(`Total: ${pending.length}`);
console.log();

// Group by category
const byCategory = {};
pending.forEach((f) => {
  if (!byCategory[f.category]) byCategory[f.category] = [];
  byCategory[f.category].push(f);
});

Object.entries(byCategory).forEach(([cat, feats]) => {
  console.log(`\n${cat.toUpperCase()} (${feats.length}):`);
  feats.slice(0, 5).forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.description.substring(0, 80)}`);
  });
  if (feats.length > 5) {
    console.log(`  ... and ${feats.length - 5} more`);
  }
});
