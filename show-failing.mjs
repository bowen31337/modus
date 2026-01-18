import fs from 'fs';

const f = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const target = f.filter((x, i) => x.is_dev_done && !x.passes);
target.forEach(x => console.log(JSON.stringify(x, null, 2)));
