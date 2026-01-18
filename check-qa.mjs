import fs from 'fs';

const f = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const pending = f.filter(x => x.is_dev_done && !x.passes);

console.log('Dev Complete but QA Failing:', pending.length);
pending.slice(0, 15).forEach((x, i) => {
  console.log(`${i+1}. ${x.feature_id || 'N/A'}: ${x.description || x.title}`);
});
