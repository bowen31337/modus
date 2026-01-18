import fs from 'fs';
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const failing = data.filter(f => !f.passes && !f.is_dev_done);

// Group by category and show simple ones
const simple = failing.filter(f =>
  f.description.includes('XSS') ||
  f.description.includes('CSRF') ||
  f.description.includes('TypeScript') ||
  f.description.includes('Biome') ||
  f.description.includes('Build')
);

console.log('Simple features to check:');
simple.forEach((f, i) => {
  console.log(`${i+1}. ${f.description}`);
});
console.log(`\nTotal simple: ${simple.length}`);
