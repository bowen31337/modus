#!/usr/bin/env node

/**
 * Manual test script for presence functionality
 */

const BASE_URL = 'http://localhost:3000';

async function testPresence() {
  console.log('=== Testing Presence Functionality ===\n');

  // Test 1: Add presence for post 1 with agent 1
  console.log('1. Adding presence for post 1 with agent-1...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: '1',
        agent_id: 'agent-1',
      }),
    });
    const data = await response.json();
    console.log('✓ Presence added:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('✗ Failed to add presence:', error.message);
    return;
  }

  // Test 2: Get presence for post 1
  console.log('\n2. Getting presence for post 1...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/presence?post_id=1`);
    const data = await response.json();
    console.log('✓ Presence data:', JSON.stringify(data, null, 2));

    if (data.presences && data.presences.length > 0) {
      console.log(`\n✓ Found ${data.presences.length} agent(s) viewing post 1`);
    } else {
      console.log('\n✗ No presence data found');
    }
  } catch (error) {
    console.error('✗ Failed to get presence:', error.message);
  }

  // Test 3: Add presence for another agent
  console.log('\n3. Adding presence for post 1 with agent-2...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: '1',
        agent_id: 'agent-2',
      }),
    });
    const data = await response.json();
    console.log('✓ Presence added:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('✗ Failed to add presence:', error.message);
  }

  // Test 4: Get updated presence
  console.log('\n4. Getting updated presence for post 1...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/presence?post_id=1`);
    const data = await response.json();
    console.log(`✓ Found ${data.presences.length} agent(s) viewing post 1`);

    data.presences.forEach((p) => {
      console.log(`  - ${p.agent_name} (${p.agent_status})`);
    });
  } catch (error) {
    console.error('✗ Failed to get presence:', error.message);
  }

  // Test 5: Remove presence
  console.log('\n5. Removing presence for agent-1...');
  try {
    await fetch(`${BASE_URL}/api/v1/presence?post_id=1&agent_id=agent-1`, {
      method: 'DELETE',
    });
    console.log('✓ Presence removed');
  } catch (error) {
    console.error('✗ Failed to remove presence:', error.message);
  }

  // Test 6: Verify removal
  console.log('\n6. Verifying removal...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/presence?post_id=1`);
    const data = await response.json();
    console.log(`✓ Now ${data.presences.length} agent(s) viewing post 1`);

    if (data.presences.length === 1 && data.presences[0].agent_id === 'agent-2') {
      console.log('✓ Correct: Only agent-2 remains');
    }
  } catch (error) {
    console.error('✗ Failed to verify:', error.message);
  }

  console.log('\n=== Test Complete ===');
}

testPresence().catch(console.error);
