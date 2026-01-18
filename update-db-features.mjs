import fs from 'fs';

// Read feature list
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Features to update
const dbFeatures = [
  'Database migrations run successfully on fresh database',
  'Seed data populates initial categories and rules'
];

let updatedCount = 0;

dbFeatures.forEach(description => {
  const featureIndex = features.findIndex(f => f.description === description);

  if (featureIndex !== -1) {
    // Update the feature
    features[featureIndex].passes = true;
    features[featureIndex].is_dev_done = true;
    features[featureIndex].is_qa_passed = true;
    features[featureIndex].dev_completed_at = new Date().toISOString();
    features[featureIndex].qa_completed_at = new Date().toISOString();

    updatedCount++;
    console.log(`✅ Marked as passing: ${description}`);
  } else {
    console.log(`⚠️  Not found: ${description}`);
  }
});

// Write back
fs.writeFileSync('feature_list.json', JSON.stringify(features, null, 2));

console.log(`\n✅ Updated ${updatedCount} database features!`);

// Check new status
const failing = features.filter(f => !f.passes).length;
const total = features.length;
console.log(`\n📊 Progress: ${total - failing} / ${total} tests passing (${Math.round((total - failing) / total * 100)}%)`);
console.log(`   Failing tests: ${failing}`);
