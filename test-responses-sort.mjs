// Test response sorting logic

const mockResponses = [
  {
    id: 'response-1',
    post_id: '1',
    agent_id: 'agent-1',
    content: 'Thank you for reporting this issue.',
    is_internal_note: false,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'response-2',
    post_id: '1',
    agent_id: 'agent-2',
    content: 'Internal note: User has contacted support 3 times.',
    is_internal_note: true,
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z',
  },
  {
    id: 'response-3',
    post_id: '1',
    agent_id: 'agent-1',
    content: 'I\'ve escalated this to our technical team.',
    is_internal_note: false,
    created_at: '2025-01-15T11:00:00Z',
    updated_at: '2025-01-15T11:00:00Z',
  },
];

// Test sorting
const sorted = [...mockResponses].sort((a, b) =>
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
);

console.log('Original order:');
mockResponses.forEach((r, i) => {
  console.log(`${i + 1}. ${r.id} - ${r.created_at}`);
});

console.log('\nSorted order:');
sorted.forEach((r, i) => {
  console.log(`${i + 1}. ${r.id} - ${r.created_at}`);
});

// Verify order
let isSorted = true;
for (let i = 1; i < sorted.length; i++) {
  if (sorted[i].created_at < sorted[i - 1].created_at) {
    isSorted = false;
    console.log(`\n❌ Order mismatch at index ${i}: ${sorted[i - 1].created_at} > ${sorted[i].created_at}`);
  }
}

console.log(`\n✓ Chronological order: ${isSorted ? 'PASS' : 'FAIL'}`);
