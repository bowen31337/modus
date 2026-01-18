// Test script for agents API endpoints
const BASE_URL = 'http://localhost:3000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

async function testGetAllAgents() {
  info('Testing GET /api/v1/agents');

  try {
    const response = await fetch(`${BASE_URL}/api/v1/agents`);
    const data = await response.json();

    if (response.ok && data.data && Array.isArray(data.data)) {
      success(`GET /api/v1/agents - Returned ${data.data.length} agents`);
      data.data.forEach((agent) => {
        info(`  - ${agent.display_name} (${agent.status})`);
      });
      return true;
    } else {
      error(`GET /api/v1/agents - Failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (e) {
    error(`GET /api/v1/agents - Error: ${e.message}`);
    return false;
  }
}

async function testGetAgentById() {
  info('Testing GET /api/v1/agents/agent-1');

  try {
    const response = await fetch(`${BASE_URL}/api/v1/agents/agent-1`);
    const data = await response.json();

    if (response.ok && data.data && data.data.id === 'agent-1') {
      success(`GET /api/v1/agents/agent-1 - Returned ${data.data.display_name}`);
      return true;
    } else {
      error(`GET /api/v1/agents/agent-1 - Failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (e) {
    error(`GET /api/v1/agents/agent-1 - Error: ${e.message}`);
    return false;
  }
}

async function testGetAgentNotFound() {
  info('Testing GET /api/v1/agents/agent-999 (404)');

  try {
    const response = await fetch(`${BASE_URL}/api/v1/agents/agent-999`);
    const data = await response.json();

    if (response.status === 404) {
      success(`GET /api/v1/agents/agent-999 - Correctly returned 404`);
      return true;
    } else {
      error(`GET /api/v1/agents/agent-999 - Expected 404, got ${response.status}`);
      return false;
    }
  } catch (e) {
    error(`GET /api/v1/agents/agent-999 - Error: ${e.message}`);
    return false;
  }
}

async function testUpdateAgentStatus() {
  info('Testing PATCH /api/v1/agents/agent-1');

  try {
    const response = await fetch(`${BASE_URL}/api/v1/agents/agent-1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'busy' }),
    });
    const data = await response.json();

    if (response.ok && data.data && data.data.status === 'busy') {
      success(`PATCH /api/v1/agents/agent-1 - Updated status to 'busy'`);

      // Reset back to online
      await fetch(`${BASE_URL}/api/v1/agents/agent-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'online' }),
      });

      return true;
    } else {
      error(`PATCH /api/v1/agents/agent-1 - Failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (e) {
    error(`PATCH /api/v1/agents/agent-1 - Error: ${e.message}`);
    return false;
  }
}

async function testUpdateAgentStatusInvalid() {
  info('Testing PATCH /api/v1/agents/agent-1 with invalid status (400)');

  try {
    const response = await fetch(`${BASE_URL}/api/v1/agents/agent-1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'invalid' }),
    });
    const data = await response.json();

    if (response.status === 400) {
      success(`PATCH /api/v1/agents/agent-1 - Correctly returned 400 for invalid status`);
      return true;
    } else {
      error(`PATCH /api/v1/agents/agent-1 - Expected 400, got ${response.status}`);
      return false;
    }
  } catch (e) {
    error(`PATCH /api/v1/agents/agent-1 - Error: ${e.message}`);
    return false;
  }
}

async function runTests() {
  log('\n=== Agents API Test Suite ===\n', 'blue');

  const tests = [
    testGetAllAgents,
    testGetAgentById,
    testGetAgentNotFound,
    testUpdateAgentStatus,
    testUpdateAgentStatusInvalid,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    console.log('');
  }

  log(`\n=== Test Results ===`, 'blue');
  log(`Total: ${tests.length}`, 'blue');
  success(`Passed: ${passed}`);
  if (failed > 0) {
    error(`Failed: ${failed}`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
