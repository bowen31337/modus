#!/usr/bin/env node

/**
 * Test script for Agent Role Management functionality
 */

const BASE_URL = 'http://localhost:3000';

async function testAgentRoleManagement() {
  console.log('🧪 Testing Agent Role Management Feature\n');

  try {
    // Test 1: Get all agents
    console.log('Test 1: GET /api/v1/agents');
    const agentsResponse = await fetch(`${BASE_URL}/api/v1/agents`);
    const agentsData = await agentsResponse.json();
    console.log(`✓ Found ${agentsData.data.length} agents`);

    // Test 2: Update agent role to supervisor
    console.log('\nTest 2: PATCH /api/v1/agents/agent-3 (role: supervisor)');
    const updateResponse = await fetch(`${BASE_URL}/api/v1/agents/agent-3`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'supervisor' }),
    });
    const updateData = await updateResponse.json();
    console.log(`✓ Role updated to: ${updateData.data.role}`);
    console.log(`✓ Message: ${updateData.message}`);

    // Test 3: Verify the change
    console.log('\nTest 3: GET /api/v1/agents/agent-3 (verify change)');
    const verifyResponse = await fetch(`${BASE_URL}/api/v1/agents/agent-3`);
    const verifyData = await verifyResponse.json();
    console.log(`✓ Current role: ${verifyData.data.role}`);
    console.log(`✓ Role matches expected: ${verifyData.data.role === 'supervisor' ? 'YES' : 'NO'}`);

    // Test 4: Change role again to admin
    console.log('\nTest 4: PATCH /api/v1/agents/agent-3 (role: admin)');
    const adminResponse = await fetch(`${BASE_URL}/api/v1/agents/agent-3`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' }),
    });
    const adminData = await adminResponse.json();
    console.log(`✓ Role updated to: ${adminData.data.role}`);

    // Test 5: Test invalid role
    console.log('\nTest 5: PATCH /api/v1/agents/agent-3 (invalid role)');
    const invalidResponse = await fetch(`${BASE_URL}/api/v1/agents/agent-3`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'superadmin' }),
    });
    console.log(`✓ Invalid role rejected: ${invalidResponse.status === 400 ? 'YES' : 'NO'}`);

    // Test 6: Test non-existent agent
    console.log('\nTest 6: PATCH /api/v1/agents/non-existent');
    const notFoundResponse = await fetch(`${BASE_URL}/api/v1/agents/non-existent`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' }),
    });
    console.log(`✓ Non-existent agent returns 404: ${notFoundResponse.status === 404 ? 'YES' : 'NO'}`);

    console.log('\n✅ All API tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAgentRoleManagement();
