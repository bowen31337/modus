const fs = require('fs');
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Find the icons feature
const iconsFeature = features.find(f => f.description === 'Icons are consistent size and style (Lucide/Radix)');
if (iconsFeature) {
  console.log('Found feature:');
  console.log(`  ID: ${iconsFeature.id}`);
  console.log(`  Description: ${iconsFeature.description}`);
  console.log(`  passes: ${iconsFeature.passes}`);
  console.log(`  is_dev_done: ${iconsFeature.is_dev_done}`);
  console.log(`  is_qa_passed: ${iconsFeature.is_qa_passed}`);
  console.log(`  dev_completed_at: ${iconsFeature.dev_completed_at}`);
  console.log(`  last_qa_run: ${iconsFeature.last_qa_run}`);
  console.log(`  qa_notes: ${iconsFeature.qa_notes}`);
} else {
  console.log('Feature not found');
}
