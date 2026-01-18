// Test to verify category badges are displayed
import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/v1/posts',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Posts response:', JSON.stringify(json, null, 2).substring(0, 1000));

      if (json.data && json.data.length > 0) {
        console.log('\n=== Checking first post for category ===');
        const firstPost = json.data[0];
        console.log('Post ID:', firstPost.id);
        console.log('Title:', firstPost.title);
        console.log('Category ID:', firstPost.category_id);
        console.log('Category object:', JSON.stringify(firstPost.category, null, 2));

        if (firstPost.category) {
          console.log('\n✓ Category badge is present!');
          console.log('  - Name:', firstPost.category.name);
          console.log('  - Color:', firstPost.category.color);
        } else {
          console.log('\n✗ Category badge is missing!');
        }
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();
