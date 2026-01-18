const fs = require('fs');
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const timestamp = Math.floor(Date.now() / 1000);

const featuresToUpdate = [
  'XSS vulnerabilities are prevented in post content',
  'CSRF protection is implemented on state-changing endpoints',
  'TypeScript strict mode is enabled throughout',
];

features.forEach((f) => {
  if (featuresToUpdate.includes(f.description)) {
    f.is_dev_done = true;
    f.dev_completed_at = timestamp.toString();
    console.log(`Updated: ${f.description}`);
  }
});

fs.writeFileSync('feature_list.json', JSON.stringify(features, null, 2));
console.log('\nFeature list updated successfully!');
