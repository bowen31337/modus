import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./feature_list.json', 'utf8'));
const failing = data.filter(f => !f.passes);
console.log('Failing features:');
failing.forEach(f => console.log('  -', f.description));
console.log('\nTotal:', failing.length);
