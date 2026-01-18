import fs from 'fs';

// Read feature list
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Features to update
const featuresToUpdate = [
  'Contrast ratios meet WCAG 2.1 AA standards',
  'Tab order follows logical reading sequence',
  'Reduced motion preference is respected'
];

let updatedCount = 0;

featuresToUpdate.forEach(description => {
  const featureIndex = features.findIndex(f => f.description === description);

  if (featureIndex !== -1) {
    // Update the feature
    const feature = features[featureIndex];
    feature.passes = true;
    feature.is_dev_done = true;
    feature.is_qa_passed = true;
    feature.qa_completed_at = new Date().toISOString();

    updatedCount++;
    console.log(`✅ Marked as passing: ${description}`);
  } else {
    console.log(`⚠️  Not found: ${description}`);
  }
});

// Write back
fs.writeFileSync('feature_list.json', JSON.stringify(features, null, 2));

console.log(`\n✅ Updated ${updatedCount} features!`);

// Check new status
const failing = features.filter(f => !f.passes).length;
const total = features.length;
console.log(`\n📊 Progress: ${total - failing} / ${total} tests passing (${Math.round((total - failing) / total * 100)}%)`);
console.log(`   Failing tests: ${failing}`);
