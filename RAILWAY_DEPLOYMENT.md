# 🚀 Railway Deployment Guide for BKCVerify Backend

## **Important: This is BACKEND ONLY deployment**

Railway will deploy only the **backend server** (Node.js + Express). The frontend should be deployed separately to Vercel.

---

## **Deployment Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Vercel)      │◄──►│   (Railway)     │◄──►│   (MongoDB)     │
│   React App     │    │   Node.js API   │    │   Atlas         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## **Railway Deployment Steps**

### **1. Connect to GitHub**
1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### **2. Configure Build Settings**
- **Root Directory**: `/` (root of project)
- **Build Command**: `npm install` (automatic)
- **Start Command**: `npm start`

### **3. Environment Variables**
Add these in Railway dashboard → Variables tab:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb+srv://imaina671:kiidfreak@cluster0.9rz77mk.mongodb.net/bkcverify?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Ethereum Configuration
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/e4fe02f7ad2c46f9b02e661a18ece012
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads

# Client URL (Update after Vercel deployment)
CLIENT_URL=https://your-vercel-app.vercel.app
```

### **4. Deploy**
1. Railway will automatically deploy when you push to GitHub
2. Wait for deployment to complete
3. Copy your Railway app URL (e.g., `https://your-app-name.railway.app`)

---

## **Vercel Frontend Deployment**

### **1. Deploy Frontend to Vercel**
1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "New Project" → Import from GitHub
3. Select your repository
4. Configure settings:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### **2. Environment Variables for Frontend**
```env
REACT_APP_API_URL=https://your-railway-app.railway.app
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
REACT_APP_NETWORK_ID=1337
```

### **3. Update Backend CORS**
After getting your Vercel URL, update the `CLIENT_URL` in Railway environment variables.

---

## **Testing the Deployment**

### **Backend Health Check**
```bash
curl https://your-railway-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-08-29T12:36:13.765Z",
  "blockchain": "Connected"
}
```

### **Frontend Connection**
1. Open your Vercel app URL
2. Check browser console for API connection
3. Test user registration and login

---

## **Troubleshooting**

### **Common Issues**

1. **Build Failed - react-scripts not found**
   - ✅ **Fixed**: Backend-only build script
   - Railway only builds the backend, not the client

2. **CORS Errors**
   - Update `CLIENT_URL` in Railway environment variables
   - Ensure Vercel URL is correct

3. **MongoDB Connection Failed**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string

4. **Environment Variables Missing**
   - Add all required variables in Railway dashboard
   - Check variable names match exactly

---

## **Production Checklist**

- ✅ Backend deployed to Railway
- ✅ Frontend deployed to Vercel
- ✅ Environment variables configured
- ✅ CORS settings updated
- ✅ Health check endpoint working
- ✅ Database connection established
- ✅ Blockchain connection working

---

## **Monitoring**

### **Railway Dashboard**
- View logs in real-time
- Monitor resource usage
- Check deployment status

### **Health Monitoring**
- `/api/health` endpoint for uptime monitoring
- Railway automatic health checks
- Error logging and alerts

---

**🎉 Your BKCVerify backend is now deployed on Railway!**
