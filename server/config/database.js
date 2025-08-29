const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    // Try different connection options to handle SSL issues
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
      // SSL/TLS options to handle connection issues
      ssl: true,
      sslValidate: false,
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bkcverify', connectionOptions);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      reason: error.reason
    });
    
    // Try alternative connection string
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv://')) {
      console.log('🔄 Trying alternative connection string...');
      try {
        const alternativeUri = process.env.MONGODB_URI.replace('mongodb+srv://', 'mongodb://') + '?ssl=true&sslValidate=false';
        const conn = await mongoose.connect(alternativeUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          family: 4,
          maxPoolSize: 10,
          ssl: true,
          sslValidate: false
        });
        console.log(`✅ MongoDB Connected (Alternative): ${conn.connection.host}`);
        return;
      } catch (altError) {
        console.error('❌ Alternative connection also failed:', altError.message);
      }
    }
    
    // Don't exit immediately, let the app try to continue
    console.log('⚠️ Continuing without database connection...');
  }
};

module.exports = connectDB; 