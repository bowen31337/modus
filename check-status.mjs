import fs from 'fs';

const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

const pending = data.filter(f => !f.passes && !f.is_dev_done);
console.log('Pending DEV features:', pending.length);

const qa = data.filter(f => f.is_dev_done && !f.passes);
console.log('Pending QA features:', qa.length);

const done = data.filter(f => f.passes);
console.log('Completed features:', done.length);
console.log(`Total progress: ${done.length}/${data.length} (${((done.length/data.length)*100).toFixed(1)}%)`);

console.log('\nFirst 15 pending DEV features:');
pending.slice(0, 15).forEach(f => console.log(`- ${f.description}`));

console.log('\nFirst 10 pending QA features:');
qa.slice(0, 10).forEach(f => console.log(`- ${f.description}`));
