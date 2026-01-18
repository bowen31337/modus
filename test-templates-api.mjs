// Test script for templates API endpoints
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

async function testGetAllTemplates() {
  info('Testing GET /api/v1/templates');

  try {
    const response = await fetch(`${BASE_URL}/api/v1/templates`);
    const data = await response.json();

    if (response.ok && data.data && Array.isArray(data.data)) {
      success(`GET /api/v1/templates - Returned ${data.data.length} templates`);
      data.data.forEach((template) => {
        info(`  - ${template.name} (${template.usage_count} uses)`);
      });
      return true;
    } else {
      error(`GET /api/v1/templates - Failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (e) {
    error(`GET /api/v1/templates - Error: ${e.message}`);
    return false;
  }
}

async function testGetTemplateById() {
  info('Testing GET /api/v1/templates/template-1');

  try {
    const response = await fetch(`${BASE_URL}/api/v1/templates/template-1`);
    const data = await response.json();

    if (response.ok && data.data && data.data.id === 'template-1') {
      success(`GET /api/v1/templates/template-1 - Returned "${data.data.name}"`);
      return true;
    } else {
      error(`GET /api/v1/templates/template-1 - Failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (e) {
    error(`GET /api/v1/templates/template-1 - Error: ${e.message}`);
    return false;
  }
}

async function testGetTemplateNotFound() {
  info('Testing GET /api/v1/templates/template-999 (404)');

  try {
    const response = await fetch(`${BASE_URL}/api/v1/templates/template-999`);
    const data = await response.json();

    if (response.status === 404) {
      success(`GET /api/v1/templates/template-999 - Correctly returned 404`);
      return true;
    } else {
      error(`GET /api/v1/templates/template-999 - Expected 404, got ${response.status}`);
      return false;
    }
  } catch (e) {
    error(`GET /api/v1/templates/template-999 - Error: ${e.message}`);
    return false;
  }
}

async function testCreateTemplate() {
  info('Testing POST /api/v1/templates');

  try {
    const newTemplate = {
      name: 'Test Template',
      content: 'Hi {{authorName}}, this is a test template.',
      placeholders: ['authorName'],
      category_id: null,
      created_by: 'agent-1',
    };

    const response = await fetch(`${BASE_URL}/api/v1/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTemplate),
    });

    const data = await response.json();

    if (response.ok && data.data && data.data.name === 'Test Template') {
      success(
        `POST /api/v1/templates - Created template "${data.data.name}" (ID: ${data.data.id})`
      );

      // Clean up - delete the test template
      await fetch(`${BASE_URL}/api/v1/templates/${data.data.id}`, {
        method: 'DELETE',
      });

      return true;
    } else {
      error(`POST /api/v1/templates - Failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (e) {
    error(`POST /api/v1/templates - Error: ${e.message}`);
    return false;
  }
}

async function testCreateTemplateInvalid() {
  info('Testing POST /api/v1/templates with missing name (400)');

  try {
    const invalidTemplate = {
      content: 'This template has no name',
      created_by: 'agent-1',
    };

    const response = await fetch(`${BASE_URL}/api/v1/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidTemplate),
    });

    const data = await response.json();

    if (response.status === 400) {
      success(`POST /api/v1/templates - Correctly returned 400 for missing name`);
      return true;
    } else {
      error(`POST /api/v1/templates - Expected 400, got ${response.status}`);
      return false;
    }
  } catch (e) {
    error(`POST /api/v1/templates - Error: ${e.message}`);
    return false;
  }
}

async function testUpdateTemplate() {
  info('Testing PATCH /api/v1/templates/template-1');

  try {
    const updates = {
      name: 'Updated Bug Acknowledgment',
    };

    const response = await fetch(`${BASE_URL}/api/v1/templates/template-1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (response.ok && data.data && data.data.name === 'Updated Bug Acknowledgment') {
      success(`PATCH /api/v1/templates/template-1 - Updated name to "${data.data.name}"`);

      // Restore original name
      await fetch(`${BASE_URL}/api/v1/templates/template-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Bug Acknowledgment' }),
      });

      return true;
    } else {
      error(`PATCH /api/v1/templates/template-1 - Failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (e) {
    error(`PATCH /api/v1/templates/template-1 - Error: ${e.message}`);
    return false;
  }
}

async function testUpdateTemplateNotFound() {
  info('Testing PATCH /api/v1/templates/template-999 (404)');

  try {
    const response = await fetch(`${BASE_URL}/api/v1/templates/template-999`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Updated' }),
    });

    const data = await response.json();

    if (response.status === 404) {
      success(`PATCH /api/v1/templates/template-999 - Correctly returned 404`);
      return true;
    } else {
      error(`PATCH /api/v1/templates/template-999 - Expected 404, got ${response.status}`);
      return false;
    }
  } catch (e) {
    error(`PATCH /api/v1/templates/template-999 - Error: ${e.message}`);
    return false;
  }
}

async function testDeleteTemplate() {
  info('Testing DELETE /api/v1/templates (create then delete)');

  try {
    // First create a template to delete
    const newTemplate = {
      name: 'Template To Delete',
      content: 'This will be deleted',
      created_by: 'agent-1',
    };

    const createResponse = await fetch(`${BASE_URL}/api/v1/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTemplate),
    });

    const createData = await createResponse.json();
    if (!createResponse.ok) {
      error(`DELETE test setup failed - could not create template`);
      return false;
    }

    const templateId = createData.data.id;

    // Now delete it
    const deleteResponse = await fetch(`${BASE_URL}/api/v1/templates/${templateId}`, {
      method: 'DELETE',
    });

    const deleteData = await deleteResponse.json();

    if (deleteResponse.ok && deleteData.message === 'Template deleted successfully') {
      success(`DELETE /api/v1/templates/${templateId} - Template deleted successfully`);

      // Verify it's actually deleted
      const verifyResponse = await fetch(`${BASE_URL}/api/v1/templates/${templateId}`);
      if (verifyResponse.status === 404) {
        success(`DELETE verification - Template is actually gone (404)`);
        return true;
      } else {
        error(`DELETE verification - Template still exists after delete`);
        return false;
      }
    } else {
      error(`DELETE /api/v1/templates/${templateId} - Failed: ${JSON.stringify(deleteData)}`);
      return false;
    }
  } catch (e) {
    error(`DELETE /api/v1/templates - Error: ${e.message}`);
    return false;
  }
}

async function runTests() {
  log('\n=== Templates API Test Suite ===\n', 'blue');

  const tests = [
    testGetAllTemplates,
    testGetTemplateById,
    testGetTemplateNotFound,
    testCreateTemplate,
    testCreateTemplateInvalid,
    testUpdateTemplate,
    testUpdateTemplateNotFound,
    testDeleteTemplate,
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
