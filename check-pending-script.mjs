import fs from 'fs';
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const pendingDev = data.filter(f => !f.is_dev_done);
console.log('Pending dev:', pendingDev.length);
pendingDev.forEach((f, i) => console.log(`${i+1}. ${f.description}`));
