const axios = require('axios');

const VERCEL_URL = 'https://zkproof-kenya-ooux-5x1f6xoe5-kiidfreaks-projects.vercel.app';

async function testVercelDeployment() {
  console.log('🔍 Testing Vercel Deployment...\n');
  
  try {
    // Test 1: Check if the main page loads
    console.log('1. Testing Main Page...');
    const mainResponse = await axios.get(VERCEL_URL, { timeout: 10000 });
    console.log('✅ Main Page: PASSED');
    console.log(`   Status: ${mainResponse.status}`);
    console.log(`   Content-Type: ${mainResponse.headers['content-type']}`);
    
    // Check if it's the React app
    if (mainResponse.data.includes('BKC Verify') || mainResponse.data.includes('root')) {
      console.log('✅ React App: Detected');
    } else {
      console.log('⚠️  React App: Not detected');
    }
    console.log('');
    
    // Test 2: Check static assets
    console.log('2. Testing Static Assets...');
    try {
      const staticResponse = await axios.get(`${VERCEL_URL}/static/js/main.02af7b24.js`, { timeout: 5000 });
      console.log('✅ Static JS: PASSED');
    } catch (error) {
      console.log('❌ Static JS: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    
    try {
      const cssResponse = await axios.get(`${VERCEL_URL}/static/css/main.673fb961.css`, { timeout: 5000 });
      console.log('✅ Static CSS: PASSED');
    } catch (error) {
      console.log('❌ Static CSS: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
    
    // Test 3: Check API calls (this will fail until environment variables are set)
    console.log('3. Testing API Configuration...');
    console.log('⚠️  API calls will fail until REACT_APP_API_URL is set in Vercel');
    console.log('   Expected behavior: API calls should go to Railway backend');
    console.log('');
    
    console.log('📋 Deployment Analysis:');
    console.log(`   Vercel URL: ${VERCEL_URL}`);
    console.log('');
    
    console.log('💡 Next Steps:');
    console.log('1. Set environment variables in Vercel dashboard');
    console.log('2. Redeploy the application');
    console.log('3. Test API functionality');
    
  } catch (error) {
    console.log('❌ Vercel Deployment Test Failed');
    console.log(`Error: ${error.message}`);
    
    if (error.response?.status === 404) {
      console.log('\n💡 The page is returning 404 - this suggests a routing issue');
      console.log('The updated vercel.json should fix this after redeployment');
    }
  }
}

testVercelDeployment();
