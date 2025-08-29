# 🚀 Vercel Frontend Deployment Guide for BKCVerify

## **Important: This is FRONTEND ONLY deployment**

Vercel will deploy only the **React frontend**. The backend API is deployed separately on Railway.

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

## **Vercel Deployment Steps**

### **1. Connect to GitHub**
1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "New Project"
3. Import from GitHub repository
4. Select your repository

### **2. Configure Project Settings**
- **Framework Preset**: Create React App
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### **3. Environment Variables**
Add these in Vercel dashboard → Settings → Environment Variables:

```env
# API Configuration
REACT_APP_API_URL=https://your-railway-app-name.railway.app/api

# Blockchain Configuration
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
REACT_APP_NETWORK_ID=11155111

# Environment
NODE_ENV=production
```

### **4. Deploy**
1. Click "Deploy"
2. Wait for build to complete
3. Copy your Vercel URL (e.g., `https://your-app-name.vercel.app`)

---

## **Configuration Files**

### **Root vercel.json** (correct configuration)
```json
{
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

**Note**: This configuration tells Vercel to:
- Build only the `client` directory
- Use the `client/package.json` for build settings
- Output to the `build` directory
- Handle all routes by redirecting to root

---

## **Important Notes**

### **API Calls**
- All API calls go to your Railway backend
- Frontend uses `REACT_APP_API_URL` environment variable
- No API routes are handled by Vercel

### **CORS Configuration**
- Railway backend handles CORS for Vercel domain
- Update `CLIENT_URL` in Railway environment variables

### **Environment Variables**
- Must start with `REACT_APP_` to be accessible in React
- Set in Vercel dashboard, not in code
- Available at build time and runtime

---

## **Testing the Deployment**

### **1. Check Frontend**
1. Open your Vercel URL
2. Check browser console for errors
3. Verify React app loads correctly

### **2. Test API Connection**
1. Open browser developer tools
2. Go to Network tab
3. Try to register/login
4. Check if API calls go to Railway URL

### **3. Common Issues**
- **404 on API calls**: Check `REACT_APP_API_URL` is correct
- **CORS errors**: Update Railway `CLIENT_URL`
- **Build fails**: Check environment variables

---

## **Production Checklist**

- ✅ Frontend deployed to Vercel
- ✅ Environment variables configured
- ✅ API URL points to Railway
- ✅ React app loads without errors
- ✅ API calls work correctly
- ✅ CORS configured on Railway

---

## **Monitoring**

### **Vercel Dashboard**
- View deployment logs
- Monitor performance
- Check function invocations

### **Analytics**
- Page views and performance
- Error tracking
- User behavior

---

**🎉 Your BKCVerify frontend is now deployed on Vercel!**

**Next Step**: Update Railway backend with your Vercel URL in the `CLIENT_URL` environment variable.
