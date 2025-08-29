const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 MongoDB Connection Diagnostic Tool');
console.log('=====================================');

// Test different connection strings
const connectionStrings = [
  {
    name: 'Your Atlas Connection',
    uri: process.env.MONGODB_URI
  },
  {
    name: 'Local MongoDB',
    uri: 'mongodb://localhost:27017/bkcverify'
  },
  {
    name: 'Atlas with different options',
    uri: process.env.MONGODB_URI ? 
      process.env.MONGODB_URI.replace('?', '?retryWrites=true&w=majority&serverSelectionTimeoutMS=5000&socketTimeoutMS=45000&family=4') : 
      null
  }
];

async function testConnection(name, uri) {
  if (!uri) {
    console.log(`❌ ${name}: No URI provided`);
    return false;
  }

  console.log(`\n🔍 Testing: ${name}`);
  console.log(`URI: ${uri.substring(0, 50)}...`);

  try {
    const conn = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 1
    });

    console.log(`✅ ${name}: SUCCESS`);
    console.log(`   Host: ${conn.host}`);
    console.log(`   Port: ${conn.port}`);
    console.log(`   Database: ${conn.name}`);
    
    await conn.close();
    return true;
  } catch (error) {
    console.log(`❌ ${name}: FAILED`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}`);
    return false;
  }
}

async function runDiagnostics() {
  console.log('\n🚀 Starting connection tests...\n');

  let successCount = 0;
  
  for (const conn of connectionStrings) {
    const success = await testConnection(conn.name, conn.uri);
    if (success) successCount++;
  }

  console.log('\n📊 Results Summary:');
  console.log(`✅ Successful connections: ${successCount}/${connectionStrings.length}`);

  if (successCount === 0) {
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Check if MongoDB Atlas IP whitelist includes your current IP');
    console.log('2. Verify your MongoDB Atlas username and password');
    console.log('3. Check if your MongoDB Atlas cluster is running');
    console.log('4. Try installing MongoDB locally for development');
    console.log('5. Check your network firewall settings');
  } else {
    console.log('\n🎉 At least one connection works!');
  }

  process.exit(0);
}

runDiagnostics().catch(console.error);
