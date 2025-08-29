const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Simple MongoDB Connection Test');
console.log('==================================');

async function testConnection() {
  try {
    console.log('📡 Attempting to connect to MongoDB...');
    console.log('🔗 URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    // Try with minimal options first
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      family: 4
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Ready State: ${conn.connection.readyState}`);
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Name: ${error.name}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.reason) {
      console.error(`   Reason: ${error.reason.type}`);
    }
    
    console.log('\n🔧 Suggested Solutions:');
    console.log('1. Check your .env file has the correct MONGODB_URI');
    console.log('2. Verify your IP is whitelisted in MongoDB Atlas');
    console.log('3. Check your username/password in the connection string');
    console.log('4. Try using a local MongoDB for development');
  }
}

testConnection().then(() => {
  process.exit(0);
}).catch(console.error);
