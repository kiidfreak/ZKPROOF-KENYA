const axios = require('axios');

const RAILWAY_URL = 'https://zkproof-kenya-production.up.railway.app';
const API_URL = `${RAILWAY_URL}/api`;

async function testBackendFix() {
  console.log('🔧 Testing Backend Fixes...\n');
  
  try {
    // Test 1: API Base Route (should now work)
    console.log('1. Testing API Base Route...');
    const baseResponse = await axios.get(API_URL);
    console.log('✅ API Base Route: PASSED');
    console.log(`   Status: ${baseResponse.status}`);
    console.log(`   Response: ${JSON.stringify(baseResponse.data, null, 2)}\n`);
    
    // Test 2: Health Check (should still work)
    console.log('2. Testing Health Check...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health Check: PASSED');
    console.log(`   Status: ${healthResponse.status}\n`);
    
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
    
    console.log('🎉 Backend Fixes Test Complete!');
    console.log(`📋 Your Railway URL: ${RAILWAY_URL}`);
    console.log(`🔗 Your API URL: ${API_URL}`);
    console.log('\n📝 Next Steps:');
    console.log('1. Update CLIENT_URL in Railway environment variables with your Vercel URL');
    console.log('2. Set REACT_APP_API_URL in Vercel environment variables');
    console.log('3. Redeploy your Vercel frontend');
    
  } catch (error) {
    console.log('❌ Backend Fixes Test Failed');
    console.log(`Error: ${error.message}`);
    
    if (error.response?.status === 404) {
      console.log('\n💡 The API base route might not be deployed yet');
      console.log('Wait a few minutes for Railway to redeploy with the changes');
    }
  }
}

testBackendFix();
