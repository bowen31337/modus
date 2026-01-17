#!/usr/bin/env node

/**
 * Test script for API integration
 * Tests assignment, release, and response submission workflows
 */

const BASE_URL = 'http://localhost:3002';

// Colors for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let passedTests = 0;
let failedTests = 0;

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

async function test(name, testFn) {
  try {
    log(`\n▶ Testing: ${name}`, YELLOW);
    await testFn();
    log(`✓ PASSED: ${name}`, GREEN);
    passedTests++;
  } catch (error) {
    log(`✗ FAILED: ${name}`, RED);
    log(`  Error: ${error.message}`, RED);
    failedTests++;
  }
}

async function testAssignPost() {
  await test('Assign post to agent', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/posts/1/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: 'agent-1' }),
    });

    if (!response.ok) {
      throw new Error(`Assignment failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.data || !data.data.assigned_to_id) {
      throw new Error('Response missing assigned_to_id');
    }

    log(`  Post assigned to agent: ${data.data.assigned_to_id}`, GREEN);
  });
}

async function testReleasePost() {
  await test('Release post assignment', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/posts/1/release`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Release failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.data.assigned_to_id !== null) {
      throw new Error('Post was not properly released');
    }

    log(`  Post released successfully`, GREEN);
  });
}

async function testSubmitResponse() {
  await test('Submit response to post', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/posts/1/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'This is a test response from API integration test',
        is_internal_note: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Response submission failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.data || !data.data.id) {
      throw new Error('Response missing ID');
    }

    log(`  Response created with ID: ${data.data.id}`, GREEN);
  });
}

async function testSubmitInternalNote() {
  await test('Submit internal note', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/posts/1/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'This is an internal note',
        is_internal_note: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Internal note submission failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.data.is_internal_note !== true) {
      throw new Error('Response is not marked as internal note');
    }

    log(`  Internal note created successfully`, GREEN);
  });
}

async function testGetResponses() {
  await test('Get responses for a post', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/posts/1/responses`);

    if (!response.ok) {
      throw new Error(`Get responses failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.data)) {
      throw new Error('Response data is not an array');
    }

    log(`  Found ${data.data.length} responses`, GREEN);
  });
}

async function testUpdatePostStatus() {
  await test('Update post status to resolved', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/posts/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    });

    if (!response.ok) {
      throw new Error(`Status update failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.data.status !== 'resolved') {
      throw new Error('Status was not updated to resolved');
    }

    log(`  Post status updated to: ${data.data.status}`, GREEN);
  });
}

async function runAllTests() {
  log('\n==============================================', YELLOW);
  log('  API Integration Tests', YELLOW);
  log('==============================================', YELLOW);

  await testAssignPost();
  await testReleasePost();
  await testSubmitResponse();
  await testSubmitInternalNote();
  await testGetResponses();
  await testUpdatePostStatus();

  log('\n==============================================', YELLOW);
  log('  Test Summary', YELLOW);
  log('==============================================', YELLOW);
  log(`Total Tests: ${passedTests + failedTests}`, YELLOW);
  log(`Passed: ${passedTests}`, GREEN);
  log(`Failed: ${failedTests}`, RED);
  log('==============================================\n', YELLOW);

  process.exit(failedTests > 0 ? 1 : 0);
}

// Wait a bit for server to be ready
setTimeout(() => {
  runAllTests().catch((error) => {
    log(`\nFatal error: ${error.message}`, RED);
    process.exit(1);
  });
}, 1000);
