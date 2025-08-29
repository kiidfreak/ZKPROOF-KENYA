#!/bin/bash

echo "🚀 BKCVerify Deployment Script"
echo "================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from template..."
    cat > .env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://imaina671:kiidfreak@cluster0.9rz77mk.mongodb.net/bkcverify?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Ethereum Configuration
ETHEREUM_RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads

# Client URL
CLIENT_URL=http://localhost:3000
EOF
    echo "✅ .env file created"
fi

echo "📦 Installing dependencies..."
npm install

echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

echo "🧪 Running tests..."
npm run test

echo "🔧 Building client..."
cd client && npm run build && cd ..

echo "✅ Setup complete!"
echo ""
echo "🚀 To deploy:"
echo "1. Push your code to GitHub"
echo "2. Follow the DEPLOYMENT_GUIDE.md"
echo "3. Deploy backend to Railway"
echo "4. Deploy frontend to Vercel"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
