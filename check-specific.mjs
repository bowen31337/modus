import fs from 'fs';
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Check for specific features mentioned in the summary
const specificFeatures = [
  'Real-time sync updates queue within 2 seconds of changes',
  'Real-time sync updates post status changes across clients',
  'Supabase Realtime subscription connects successfully',
  'Categories can be managed by admin',
  'Database migrations run successfully on fresh database',
  'Seed data populates initial categories and rules'
];

console.log('=== Checking Specific Features ===\n');
for (const desc of specificFeatures) {
  const feature = data.find(f => f.description === desc);
  if (feature) {
    console.log(`${feature.passes ? '✅' : '❌'} ${desc}`);
    console.log(`   Dev done: ${feature.is_dev_done}, QA passed: ${feature.is_qa_passed}`);
  } else {
    console.log(`❓ NOT FOUND: ${desc}`);
  }
  console.log();
}
