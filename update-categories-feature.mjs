import fs from 'fs';

// Read feature list
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Find the categories management feature
const featureIndex = features.findIndex(
  f => f.description === 'Categories can be managed by admin'
);

if (featureIndex !== -1) {
  // Update the feature
  features[featureIndex].passes = true;
  features[featureIndex].is_dev_done = true;
  features[featureIndex].is_qa_passed = true;
  features[featureIndex].dev_completed_at = new Date().toISOString();
  features[featureIndex].qa_completed_at = new Date().toISOString();

  // Write back
  fs.writeFileSync('feature_list.json', JSON.stringify(features, null, 2));

  console.log('✅ Categories management feature marked as passing!');
  console.log(`   Feature: ${features[featureIndex].description}`);
  console.log(`   Dev done: ${features[featureIndex].is_dev_done}`);
  console.log(`   QA passed: ${features[featureIndex].is_qa_passed}`);
} else {
  console.log('❌ Feature not found');
  process.exit(1);
}
