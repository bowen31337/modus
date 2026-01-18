import fs from 'fs';

const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const quickWins = features.filter(f => !f.passes && f.is_dev_done);

console.log('=== QUICK WINS (Dev done, QA pending) ===\n');
quickWins.forEach((f, i) => {
  console.log(`${i+1}. ${f.description}`);
  console.log(`   Retries: ${f.qa_retry_count || 0}\n`);
});

console.log(`Total quick wins: ${quickWins.length}`);
