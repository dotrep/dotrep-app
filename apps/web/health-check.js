// Pre-flight health check for deployment verification
// This tests that the server can start and respond to health checks

import http from 'http';

const PORT = process.env.PORT || 5000;
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000; // 1 second

console.log('🔍 Starting deployment health check...');
console.log(`   Testing server on port ${PORT}`);

async function checkHealth(attempt = 1) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${PORT}/healthz`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ Health check passed (attempt ${attempt})`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${data.trim()}`);
          resolve(true);
        } else {
          reject(new Error(`Health check returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      if (attempt < MAX_RETRIES) {
        console.log(`   Attempt ${attempt}/${MAX_RETRIES} - Server not ready yet, retrying...`);
        setTimeout(() => {
          checkHealth(attempt + 1).then(resolve).catch(reject);
        }, RETRY_DELAY);
      } else {
        reject(new Error(`Health check failed after ${MAX_RETRIES} attempts: ${err.message}`));
      }
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Health check request timeout'));
    });
  });
}

// Run the health check
checkHealth()
  .then(() => {
    console.log('\n🎉 Deployment health check PASSED - Server is ready!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Deployment health check FAILED:');
    console.error(`   ${err.message}`);
    console.error('\n   This means the server is not responding to health checks.');
    console.error('   Cloud Run deployment will fail if this persists.\n');
    process.exit(1);
  });
