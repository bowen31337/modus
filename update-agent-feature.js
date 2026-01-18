const fs = require('fs');

// Read the feature list
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Find the feature about admin viewing agents
const feature = data.find(f =>
  f.description && f.description.includes('Admin can view list of all agents')
);

if (feature) {
  console.log('Found feature:', feature.description);
  console.log('Current passes:', feature.passes);

  // Update the feature
  feature.passes = true;
  feature.is_dev_done = true;
  feature.is_qa_passed = true;
  feature.qa_completed_at = new Date().toISOString();

  // Write back
  fs.writeFileSync('feature_list.json', JSON.stringify(data, null, 2));
  console.log('Feature updated successfully!');
} else {
  console.log('Feature not found');
}
