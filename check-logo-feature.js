const fs = require('fs');
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Find the logo/branding feature
const logoFeature = features.find(f => f.description === 'Logo and branding are properly displayed');
if (logoFeature) {
  console.log('Found feature:');
  console.log(`  ID: ${logoFeature.id}`);
  console.log(`  Description: ${logoFeature.description}`);
  console.log(`  passes: ${logoFeature.passes}`);
  console.log(`  is_dev_done: ${logoFeature.is_dev_done}`);
  console.log(`  is_qa_passed: ${logoFeature.is_qa_passed}`);
} else {
  console.log('Feature not found');
}
