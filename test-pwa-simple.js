import http from 'http';

const baseUrl = 'http://localhost:5173';

const testUrls = [
  '/manifest.webmanifest',
  '/offline.html',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/registerSW.js',
  '/sw.js',
];

async function testUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(`${baseUrl}${url}`, (res) => {
      resolve({
        url,
        status: res.statusCode,
        success: res.statusCode === 200,
      });
    });

    req.on('error', () => {
      resolve({
        url,
        status: 'ERROR',
        success: false,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        success: false,
      });
    });
  });
}

async function testPWA() {
  console.log('🧪 Testing PWA Setup...');
  console.log(`Testing against: ${baseUrl}`);
  console.log('');

  const results = [];

  for (const url of testUrls) {
    const result = await testUrl(url);
    results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${url} - ${result.status}`);
  }

  console.log('');
  console.log('📊 Results Summary:');
  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;
  console.log(
    `Success: ${successCount}/${totalCount} (${Math.round(
      (successCount / totalCount) * 100
    )}%)`
  );

  if (successCount >= totalCount * 0.7) {
    console.log('🎉 PWA setup looks good!');
  } else {
    console.log('⚠️  Some PWA files are missing or inaccessible');
  }
}

// Wait a bit for the dev server to start
setTimeout(testPWA, 3000);
