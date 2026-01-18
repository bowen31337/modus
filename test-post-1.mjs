// Test if post 1 exists and has responses
import fs from 'fs';

const content = fs.readFileSync('apps/web/lib/data-store.ts', 'utf8');
const hasPost1 = content.includes("id: '1'");
const hasResponse1 = content.includes("post_id: '1'");

console.log('Has post 1:', hasPost1);
console.log('Has response for post 1:', hasResponse1);

// Count mock responses
const responseMatches = content.match(/post_id: '1'/g);
console.log('Responses for post 1:', responseMatches ? responseMatches.length : 0);
