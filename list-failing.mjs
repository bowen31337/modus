import fs from 'fs';
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const failing = data.filter(f => !f.passes && !f.is_dev_done);
console.log('All failing features:\n');
failing.forEach((f, i) => {
  console.log(`${i+1}. ${f.description}`);
});
