const axios = require('axios');

const RAILWAY_URL = 'https://zkproof-kenya-production.up.railway.app';
const API_URL = `${RAILWAY_URL}/api`;

async function checkDeploymentStatus() {
  console.log('🔍 Checking Railway Deployment Status...\n');
  
  try {
    // Test 1: Check if server is responding at all
    console.log('1. Testing Server Response...');
    const rootResponse = await axios.get(RAILWAY_URL, { timeout: 5000 });
    console.log('✅ Server is responding');
    console.log(`   Status: ${rootResponse.status}`);
    console.log(`   Content-Type: ${rootResponse.headers['content-type']}\n`);
  } catch (error) {
    console.log('❌ Server not responding');
    console.log(`   Error: ${error.message}\n`);
    return;
  }
  
  try {
    // Test 2: Health Check (this was working before)
    console.log('2. Testing Health Check...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health Check: PASSED');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${JSON.stringify(healthResponse.data)}\n`);
  } catch (error) {
    console.log('❌ Health Check: FAILED');
    console.log(`   Error: ${error.message}\n`);
  }
  
  try {
    // Test 3: API Base Route (this should work after deployment)
    console.log('3. Testing API Base Route...');
    const baseResponse = await axios.get(API_URL);
    console.log('✅ API Base Route: PASSED');
    console.log(`   Status: ${baseResponse.status}`);
    console.log(`   Response: ${JSON.stringify(baseResponse.data, null, 2)}\n`);
  } catch (error) {
    console.log('❌ API Base Route: FAILED');
    console.log(`   Error: ${error.message}`);
    console.log(`   Status Code: ${error.response?.status || 'Unknown'}\n`);
  }
  
  // Test 4: Check what routes are available
  console.log('4. Testing Available Routes...');
  const routesToTest = [
    '/api/auth',
    '/api/identity', 
    '/api/documents',
    '/api/signatures',
    '/api/chat'
  ];
  
  for (const route of routesToTest) {
    try {
      const response = await axios.get(`${RAILWAY_URL}${route}`, { timeout: 3000 });
      console.log(`✅ ${route}: ${response.status}`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`❌ ${route}: 404 (Not Found)`);
      } else if (error.response?.status === 401) {
        console.log(`✅ ${route}: 401 (Unauthorized - Route exists)`);
      } else {
        console.log(`❌ ${route}: ${error.response?.status || error.message}`);
      }
    }
  }
  console.log('');
  
  console.log('📋 Deployment Analysis:');
  console.log(`   Railway URL: ${RAILWAY_URL}`);
  console.log(`   API URL: ${API_URL}`);
  console.log('');
  
  console.log('💡 Possible Issues:');
  console.log('1. Railway hasn\'t redeployed with the latest code changes');
  console.log('2. The deployment is still in progress');
  console.log('3. There might be a build error preventing deployment');
  console.log('');
  
  console.log('🔧 Next Steps:');
  console.log('1. Check Railway dashboard for deployment status');
  console.log('2. Wait 5-10 minutes for deployment to complete');
  console.log('3. Run this test again: node check-deployment-status.js');
  console.log('4. If still failing, check Railway logs for errors');
}

checkDeploymentStatus();
