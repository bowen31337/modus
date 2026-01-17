// Simple API test script
const http = require('http');

function testAPI() {
  const options = {
    hostname: 'localhost',
    port: 3006,
    path: '/api/v1/posts',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        console.log('Posts count:', parsed.data?.length || 0);
        if (parsed.data && parsed.data.length > 0) {
          console.log('First post:', {
            id: parsed.data[0].id,
            title: parsed.data[0].title,
            status: parsed.data[0].status,
            priority: parsed.data[0].priority
          });
        }
        console.log('Full response:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Response:', data);
      }
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });

  req.end();
}

testAPI();
