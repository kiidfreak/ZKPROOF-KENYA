# 🚨 Deployment Fix Guide - Resolving 404 Error

## **Current Issue**
Your Vercel deployment is showing a 404 error because the frontend is trying to make API calls to a placeholder URL instead of a real Railway backend.

## **Root Cause**
The API configuration in `client/src/services/api.js` is using a placeholder URL:
```javascript
return 'https://your-railway-backend.railway.app/api';
```

## **Solution Steps**

### **Step 1: Update Railway Environment Variables**

Since your Railway backend is already deployed and the health check is working, you just need to update the environment variables:

1. **Go to Railway Dashboard**
   - Visit [Railway Dashboard](https://railway.app)
   - Find your project: `zkproof-kenya-production`

2. **Update Environment Variables**
   Go to Variables tab and add/update these:
   ```env
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://imaina671:kiidfreak@cluster0.9rz77mk.mongodb.net/bkcverify?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/e4fe02f7ad2c46f9b02e661a18ece012
   PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=uploads
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```

3. **Redeploy Backend**
   - Railway will automatically redeploy with the updated environment variables

  4. **Test the Fix**
   - Wait for Railway redeployment to complete
   - Run the test script again: `node check-railway-deployment.js`
   - Verify that both health check and API base URL are working

### **Step 2: Update Vercel Environment Variables**

1. **Go to Vercel Dashboard**
   - Visit [Vercel Dashboard](https://vercel.com)
   - Select your project

2. **Add Environment Variables**
   Go to Settings → Environment Variables and add:
   ```env
   REACT_APP_API_URL=https://zkproof-kenya-production.up.railway.app/api
   REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   REACT_APP_NETWORK_ID=11155111
   NODE_ENV=production
   ```

3. **Redeploy**
   - Go to Deployments tab
   - Click "Redeploy" on your latest deployment

### **Step 3: Update Backend CORS**

1. **Update Railway Environment Variables**
   - Go back to Railway dashboard
   - Update `CLIENT_URL` with your actual Vercel URL:
   ```env
   CLIENT_URL=https://your-actual-vercel-app.vercel.app
   ```

2. **Redeploy Backend**
   - Railway will automatically redeploy

### **Step 4: Test the Fix**

1. **Check Frontend**
   - Open your Vercel URL
   - Open browser developer tools
   - Check Console for any errors

2. **Test API Connection**
   - Go to Network tab
   - Try to register/login
   - Verify API calls go to your Railway URL

3. **Health Check**
   ```bash
   curl https://your-railway-app.railway.app/api/health
   ```

## **Expected Results**

After completing these steps:
- ✅ Frontend loads without 404 errors
- ✅ API calls go to your Railway backend
- ✅ Authentication works
- ✅ All features function properly

## **Common Issues & Solutions**

### **Issue: Still getting 404 errors**
**Solution**: Check that `REACT_APP_API_URL` in Vercel matches your Railway URL exactly

### **Issue: CORS errors**
**Solution**: Update `CLIENT_URL` in Railway with your exact Vercel URL

### **Issue: Build fails**
**Solution**: Ensure all environment variables are set correctly in Vercel

## **Verification Checklist**

- [ ] Backend deployed to Railway
- [ ] Railway URL copied correctly
- [ ] Vercel environment variables set
- [ ] Frontend redeployed
- [ ] Backend CORS updated
- [ ] API calls working
- [ ] No console errors

## **Next Steps**

Once the deployment is working:
1. Test all features thoroughly
2. Set up monitoring and logging
3. Configure custom domains if needed
4. Set up CI/CD for automatic deployments

---

**🎉 Your BKCVerify application should now be fully functional!**
