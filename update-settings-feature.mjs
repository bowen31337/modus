import fs from 'fs';

const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Find and update the settings page feature
const feature = data.find(f => f.description === 'Settings pages have consistent layout');

if (feature) {
  feature.passes = true;
  feature.is_dev_done = true;
  feature.is_qa_passed = true;
  feature.dev_completed_at = Math.floor(Date.now() / 1000).toString();
  feature.qa_completed_at = Math.floor(Date.now() / 1000).toString();
  feature.qa_retry_count = 0;

  fs.writeFileSync('feature_list.json', JSON.stringify(data, null, 2));
  console.log('✓ Feature updated: "Settings pages have consistent layout"');
  console.log(`  - passes: ${feature.passes}`);
  console.log(`  - is_dev_done: ${feature.is_dev_done}`);
  console.log(`  - is_qa_passed: ${feature.is_qa_passed}`);
} else {
  console.log('✗ Feature not found: "Settings pages have consistent layout"');
}

// Show updated stats
const done = data.filter(f => f.passes);
console.log(`\nTotal progress: ${done.length}/${data.length} (${((done.length/data.length)*100).toFixed(1)}%)`);
