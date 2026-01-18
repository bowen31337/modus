#!/usr/bin/env node

/**
 * Test script for Auth and Rules API endpoints
 */

const BASE_URL = 'http://localhost:3000';

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

async function testLogin() {
  await test('POST /api/v1/auth/login - Valid credentials', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.data || !data.data.agent_id) {
      throw new Error('Response missing agent_id');
    }

    log(`  Logged in agent: ${data.data.display_name}`);
    log(`  Role: ${data.data.role}, Status: ${data.data.status}`);
  });
}

async function testLoginInvalid() {
  await test('POST /api/v1/auth/login - Missing password', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }

    log('  Correctly returned 400 for missing password');
  });
}

async function testSessionNoAuth() {
  await test('GET /api/v1/auth/session - No session', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/auth/session`);

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }

    log('  Correctly returned 401 for no session');
  });
}

async function testGetRules() {
  await test('GET /api/v1/rules - Returns all rules', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/rules`);

    if (!response.ok) {
      throw new Error(`Get rules failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Response missing data array');
    }

    log(`  Found ${data.data.length} rules`);
    data.data.slice(0, 3).forEach((rule) => {
      log(`  - ${rule.name}: ${rule.condition_type} → ${rule.action_value}`);
    });
  });
}

async function testCreateRule() {
  await test('POST /api/v1/rules - Create new rule', async () => {
    const newRule = {
      name: 'Test Rule',
      description: 'A test rule for automation',
      condition_type: 'test_condition',
      condition_value: 'test_value',
      action_type: 'set_priority',
      action_value: 'P2',
      is_active: true,
    };

    const response = await fetch(`${BASE_URL}/api/v1/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRule),
    });

    if (!response.ok) {
      throw new Error(`Create rule failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.data || !data.data.id) {
      throw new Error('Response missing rule ID');
    }

    log(`  Created rule: ${data.data.name} (ID: ${data.data.id})`);
  });
}

async function testCreateRuleMissingFields() {
  await test('POST /api/v1/rules - Missing required fields', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Incomplete Rule',
      }),
    });

    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }

    log('  Correctly returned 400 for missing fields');
  });
}

async function runAllTests() {
  log('\n==============================================', YELLOW);
  log('  Auth and Rules API Tests', YELLOW);
  log('==============================================', YELLOW);

  await testLogin();
  await testLoginInvalid();
  await testSessionNoAuth();
  await testGetRules();
  await testCreateRule();
  await testCreateRuleMissingFields();

  log('\n==============================================', YELLOW);
  log('  Test Summary', YELLOW);
  log('==============================================', YELLOW);
  log(`Total Tests: ${passedTests + failedTests}`, YELLOW);
  log(`Passed: ${passedTests}`, GREEN);
  log(`Failed: ${failedTests}`, RED);
  log('==============================================\n', YELLOW);

  process.exit(failedTests > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  log(`\nFatal error: ${error.message}`, RED);
  console.error(error);
  process.exit(1);
});
