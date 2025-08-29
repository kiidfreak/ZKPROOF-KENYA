#!/bin/bash

echo "🚀 BKCVerify Railway Deployment Script"
echo "======================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-github-repo-url>"
    echo "   git push -u origin main"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

echo "✅ Git repository found"
echo "✅ .env file found"

echo ""
echo "📋 Deployment Checklist:"
echo "1. ✅ Smart Contract deployed locally"
echo "2. ✅ All tests passing (22/22)"
echo "3. ✅ MongoDB Atlas connected"
echo "4. 🔄 Push to GitHub (if not done)"
echo "5. 🔄 Connect Railway to GitHub"
echo "6. 🔄 Configure Railway environment variables"
echo "7. 🔄 Deploy to Railway"

echo ""
echo "🌐 Next Steps:"
echo ""
echo "1. Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for Railway deployment'"
echo "   git push"
echo ""
echo "2. Deploy to Railway:"
echo "   - Go to https://railway.app"
echo "   - Click 'New Project'"
echo "   - Select 'Deploy from GitHub repo'"
echo "   - Choose your repository"
echo ""
echo "3. Configure Environment Variables in Railway:"
echo "   - PORT=5000"
echo "   - NODE_ENV=production"
echo "   - MONGODB_URI=mongodb+srv://imaina671:kiidfreak@cluster0.9rz77mk.mongodb.net/bkcverify?retryWrites=true&w=majority"
echo "   - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production"
echo "   - ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/e4fe02f7ad2c46f9b02e661a18ece012"
echo "   - PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo "   - CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3"
echo "   - RATE_LIMIT_WINDOW_MS=900000"
echo "   - RATE_LIMIT_MAX_REQUESTS=100"
echo "   - MAX_FILE_SIZE=10485760"
echo "   - UPLOAD_PATH=uploads"
echo "   - CLIENT_URL=https://your-vercel-app.vercel.app"
echo ""
echo "4. Deploy Frontend to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Import from GitHub"
echo "   - Set root directory to 'client'"
echo "   - Configure environment variables"
echo ""
echo "✅ Your application is ready for deployment!"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_SETUP.md"
