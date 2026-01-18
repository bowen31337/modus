import fs from 'fs';
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const failing = data.filter(f => !f.passes);
console.log('Total failing:', failing.length);
failing.slice(0, 20).forEach((f, i) => console.log(`${i+1}. ${f.description}`));
