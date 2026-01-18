import fs from 'fs';

const f = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const pending = f.filter(x => x.is_dev_done && !x.passes);

console.log('Dev Complete but QA Failing:', pending.length);
pending.forEach((x, i) => {
  console.log('Index:', i);
  console.log(JSON.stringify(x, null, 2));
  console.log('---');
});
