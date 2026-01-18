const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const failing = data.filter(f => !f.passes);
console.log('Total failing:', failing.length);
console.log('');
// Group by category
const byCategory = {};
for (const f of failing) {
  const cat = f.category || 'unknown';
  if (!byCategory[cat]) byCategory[cat] = [];
  byCategory[cat].push(f);
}
for (const [cat, items] of Object.entries(byCategory)) {
  console.log(cat + ':', items.length);
}
