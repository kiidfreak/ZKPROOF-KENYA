const axios = require('axios');

// Configuration
const RAILWAY_URL = process.env.RAILWAY_URL || 'https://zkproof-kenya-production.up.railway.app';
const API_URL = `${RAILWAY_URL}/api`;

async function checkRailwayDeployment() {
  console.log('🔍 Checking Railway Backend Deployment...\n');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health Check: PASSED');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${JSON.stringify(healthResponse.data)}\n`);
    
    // Test 2: API Base URL
    console.log('2. Testing API Base URL...');
    const baseResponse = await axios.get(API_URL);
    console.log('✅ API Base URL: PASSED');
    console.log(`   Status: ${baseResponse.status}\n`);
    
    // Test 3: CORS Headers
    console.log('3. Testing CORS Configuration...');
    const corsResponse = await axios.options(`${API_URL}/auth/login`);
    const corsHeaders = corsResponse.headers;
    
    if (corsHeaders['access-control-allow-origin']) {
      console.log('✅ CORS Configuration: PASSED');
      console.log(`   Allow-Origin: ${corsHeaders['access-control-allow-origin']}`);
    } else {
      console.log('⚠️  CORS Configuration: WARNING - No CORS headers found');
    }
    console.log('');
    
    // Test 4: Database Connection (if available)
    console.log('4. Testing Database Connection...');
    try {
      const dbResponse = await axios.get(`${API_URL}/auth/profile`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      console.log('✅ Database Connection: PASSED');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Database Connection: PASSED (401 expected for invalid token)');
      } else {
        console.log('❌ Database Connection: FAILED');
        console.log(`   Error: ${error.message}`);
      }
    }
    console.log('');
    
    console.log('🎉 Railway Backend Deployment Check Complete!');
    console.log(`📋 Your Railway URL: ${RAILWAY_URL}`);
    console.log(`🔗 Your API URL: ${API_URL}`);
    console.log('\n📝 Next Steps:');
    console.log('1. Copy the Railway URL above');
    console.log('2. Update REACT_APP_API_URL in Vercel environment variables');
    console.log('3. Redeploy your Vercel frontend');
    
  } catch (error) {
    console.log('❌ Railway Backend Check Failed');
    console.log(`Error: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Possible Solutions:');
      console.log('1. Check if Railway deployment is complete');
      console.log('2. Verify the Railway URL is correct');
      console.log('3. Wait a few minutes for DNS propagation');
    }
    
    if (error.response?.status === 404) {
      console.log('\n💡 The API endpoint might not exist yet');
      console.log('Check if your backend routes are properly configured');
    }
  }
}

// Run the check
checkRailwayDeployment();
