# 🚀 Deployment Guide - BKCVerify Platform

## **Deploy to Vercel (Frontend) + Railway (Backend)**

---

## 📋 **Prerequisites**

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - [vercel.com](https://vercel.com)
3. **Railway Account** - [railway.app](https://railway.app)
4. **MongoDB Atlas** - Already configured ✅
5. **Infura Account** - For Ethereum RPC (optional)

---

## 🔧 **Step 1: Fix MongoDB Connection**

### **Whitelist Your IP in MongoDB Atlas**

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Select your cluster
3. Click **"Network Access"** in the left sidebar
4. Click **"Add IP Address"**
5. Choose one of these options:
   - **"Allow Access from Anywhere"** (0.0.0.0/0) - For development
   - **"Add Current IP Address"** - For your specific IP
   - **"Add IP Address"** - For specific IPs

### **Test MongoDB Connection**

```bash
# Test your current connection
npm run dev
```

---

## 🚀 **Step 2: Deploy Backend to Railway**

### **2.1 Connect Railway to GitHub**

1. Go to [Railway Dashboard](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Select the **root directory** (not client or server)

### **2.2 Configure Railway Environment Variables**

In Railway dashboard, go to your project → **Variables** tab and add:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration (Your existing connection string)
MONGODB_URI=mongodb+srv://imaina671:kiidfreak@cluster0.9rz77mk.mongodb.net/bkcverify?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Ethereum Configuration
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads

# Client URL (Update this after Vercel deployment)
CLIENT_URL=https://your-vercel-app.vercel.app
```

### **2.3 Configure Railway Build Settings**

Railway will automatically detect it's a Node.js project. Make sure:

1. **Root Directory**: `/` (root of your project)
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`

### **2.4 Deploy Backend**

1. Railway will automatically deploy when you push to GitHub
2. Wait for deployment to complete
3. Copy your Railway app URL (e.g., `https://your-app-name.railway.app`)

---

## 🌐 **Step 3: Deploy Frontend to Vercel**

### **3.1 Connect Vercel to GitHub**

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure the project:

### **3.2 Vercel Project Configuration**

```
Framework Preset: Create React App
Root Directory: client
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

### **3.3 Configure Vercel Environment Variables**

In Vercel dashboard, go to **Settings** → **Environment Variables** and add:

```env
REACT_APP_API_URL=https://your-railway-app-name.railway.app/api
REACT_APP_NODE_ENV=production
REACT_APP_ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
REACT_APP_CONTRACT_ADDRESS=your-deployed-contract-address
```

### **3.4 Deploy Frontend**

1. Click **"Deploy"**
2. Wait for build to complete
3. Copy your Vercel app URL (e.g., `https://your-app-name.vercel.app`)

---

## 🔄 **Step 4: Update Configuration**

### **4.1 Update Railway Environment Variables**

Go back to Railway and update the `CLIENT_URL`:

```env
CLIENT_URL=https://your-vercel-app.vercel.app
```

### **4.2 Update Client API Configuration**

Update `client/src/services/api.js` with your Railway URL:

```javascript
// Replace 'your-railway-app-name' with your actual Railway app name
if (process.env.NODE_ENV === 'production') {
  return 'https://your-railway-app-name.railway.app/api';
}
```

---

## 🔒 **Step 5: Security & Production Settings**

### **5.1 Update JWT Secret**

Generate a strong JWT secret:

```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Update this in Railway environment variables.

### **5.2 Update Private Key**

For production, use a proper private key (not the Hardhat default):

```env
PRIVATE_KEY=your-actual-private-key-here
```

### **5.3 Update Contract Address**

Deploy your smart contract to Sepolia testnet and update:

```env
CONTRACT_ADDRESS=your-actual-deployed-contract-address
```

---

## 🧪 **Step 6: Test Deployment**

### **6.1 Test Backend Health**

```bash
curl https://your-railway-app-name.railway.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-XX...",
  "blockchain": "Connected"
}
```

### **6.2 Test Frontend**

1. Visit your Vercel URL
2. Try to register/login
3. Test file upload
4. Test blockchain integration

---

## 📊 **Step 7: Monitoring & Maintenance**

### **7.1 Railway Monitoring**

- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: Monitor CPU, memory, and network usage
- **Health Checks**: Automatic health checks configured

### **7.2 Vercel Monitoring**

- **Analytics**: Built-in analytics and performance monitoring
- **Functions**: Serverless function logs
- **Edge Network**: Global CDN performance

### **7.3 MongoDB Monitoring**

- **Atlas Dashboard**: Monitor database performance
- **Connection Pool**: Check connection limits
- **Query Performance**: Analyze slow queries

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. MongoDB Connection Failed**
```bash
# Check if IP is whitelisted
# Verify connection string
# Check network connectivity
```

#### **2. Railway Build Failed**
```bash
# Check package.json scripts
# Verify Node.js version
# Check for missing dependencies
```

#### **3. Vercel Build Failed**
```bash
# Check React build errors
# Verify environment variables
# Check for missing dependencies
```

#### **4. CORS Errors**
```bash
# Update CLIENT_URL in Railway
# Check CORS configuration in server
# Verify API endpoints
```

### **Debug Commands**

```bash
# Test Railway deployment locally
railway login
railway link
railway up

# Test Vercel deployment locally
vercel login
vercel dev
```

---

## 📈 **Step 8: Production Optimization**

### **8.1 Performance**

- **CDN**: Vercel provides global CDN
- **Caching**: Implement Redis for session storage
- **Database**: Optimize MongoDB queries
- **Images**: Use Vercel Image Optimization

### **8.2 Security**

- **HTTPS**: Automatically enabled
- **Headers**: Security headers configured
- **Rate Limiting**: Already implemented
- **Input Validation**: Comprehensive validation

### **8.3 Scaling**

- **Auto-scaling**: Railway handles scaling
- **Load Balancing**: Automatic load balancing
- **Database**: MongoDB Atlas scaling
- **CDN**: Vercel edge network

---

## 🎉 **Deployment Complete!**

Your BKCVerify platform is now live at:
- **Frontend**: `https://your-vercel-app.vercel.app`
- **Backend**: `https://your-railway-app-name.railway.app`
- **Database**: MongoDB Atlas (configured)

### **Next Steps**

1. **Test all features** thoroughly
2. **Set up monitoring** and alerts
3. **Configure backups** for MongoDB
4. **Set up CI/CD** for automatic deployments
5. **Plan Phase 2** development

---

## 📞 **Support**

If you encounter issues:

1. **Check logs** in Railway and Vercel dashboards
2. **Verify environment variables** are set correctly
3. **Test endpoints** individually
4. **Check MongoDB Atlas** connection
5. **Review this guide** for common solutions

**Your blockchain identity verification platform is now live and ready for users! 🚀**
