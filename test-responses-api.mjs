// Test script for responses API endpoint

const BASE_URL = 'http://localhost:3002';

async function testGetResponses() {
  console.log('\n=== Testing GET /api/v1/posts/1/responses ===');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/posts/1/responses`);
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return response.status === 200;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testPostResponse() {
  console.log('\n=== Testing POST /api/v1/posts/1/responses ===');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/posts/1/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content:
          'Thank you for reaching out. I have looked into your account issue and will help resolve it.',
        is_internal_note: false,
      }),
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return response.status === 201;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testPostInternalNote() {
  console.log('\n=== Testing POST /api/v1/posts/2/responses (internal note) ===');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/posts/2/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Internal note: This user has contacted us before about similar issues.',
        is_internal_note: true,
      }),
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return response.status === 201;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testInvalidPost() {
  console.log('\n=== Testing POST /api/v1/posts/999/responses (non-existent post) ===');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/posts/999/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'This should fail',
      }),
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return response.status === 404;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testInvalidBody() {
  console.log('\n=== Testing POST /api/v1/posts/1/responses (invalid body) ===');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/posts/1/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing content field
      }),
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return response.status === 400;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('Testing Responses API Endpoints');
  console.log('================================');

  const results = [];

  results.push(['GET /api/v1/posts/1/responses', await testGetResponses()]);
  results.push(['POST /api/v1/posts/1/responses', await testPostResponse()]);
  results.push(['POST /api/v1/posts/2/responses (internal)', await testPostInternalNote()]);
  results.push(['POST /api/v1/posts/999/responses (404)', await testInvalidPost()]);
  results.push(['POST /api/v1/posts/1/responses (400)', await testInvalidBody()]);

  console.log('\n=== Test Summary ===');
  let allPassed = true;
  for (const [name, passed] of results) {
    console.log(`${passed ? '✓' : '✗'} ${name}`);
    if (!passed) allPassed = false;
  }

  console.log('\n' + (allPassed ? 'All tests passed!' : 'Some tests failed.'));
  process.exit(allPassed ? 0 : 1);
}

main();
