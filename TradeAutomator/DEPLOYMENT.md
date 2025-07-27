# XAUUSD Trading Platform - Render Deployment Guide

## Quick Setup for Render

### 1. Repository Configuration
- **Root Directory**: `.` (use the project root)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node.js
- **Node Version**: 20.x

### 2. Required Environment Variables
Set these in your Render service settings:

```
OANDA_API_KEY=your_oanda_api_key_here
OANDA_ACCOUNT_ID=your_oanda_account_id_here
NODE_ENV=production
DATABASE_URL=your_postgresql_url_here (optional)
```

### 3. Deployment Steps

1. **Connect Repository**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - Name: `xauusd-trading-platform`
   - Environment: `Node`
   - Region: Choose closest to your users
   - Branch: `main` (or your default branch)
   - Root Directory: `.` (leave empty or use dot)
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Set Environment Variables**
   - Add your OANDA API credentials
   - Set NODE_ENV to production
   - Add DATABASE_URL if using external database

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your app will be available at: `https://your-service-name.onrender.com`

### 4. Post-Deployment

- The platform will automatically:
  - Build the frontend with Vite
  - Bundle the backend with esbuild
  - Serve static files from Express
  - Connect to OANDA API for live data
  - Run trade monitoring in the background

### 5. Custom Domain (Optional)

1. Go to your service settings
2. Add your custom domain
3. Configure DNS to point to Render
4. Render will handle SSL certificates automatically

## Troubleshooting

### Common Issues

1. **Build Fails**: Check that all dependencies are in package.json, not just devDependencies
2. **Environment Variables**: Ensure OANDA_API_KEY and OANDA_ACCOUNT_ID are set correctly
3. **Database Connection**: If using external database, verify DATABASE_URL format
4. **Port Issues**: The app automatically uses Render's assigned port via process.env.PORT

### Logs
- Check build logs in Render dashboard
- Monitor runtime logs for API connection issues
- Verify OANDA API credentials are working

## Features Available After Deployment

✅ Live XAU/USD market data
✅ Real-time candlestick charts
✅ Automated trade management
✅ Partial closing at TP1 (75%)
✅ Stop loss move to breakeven
✅ Mobile responsive design
✅ Professional trading interface

## Security Notes

- OANDA API keys are securely stored as environment variables
- No sensitive data is logged or exposed
- HTTPS is automatically enabled by Render
- Login system prevents unauthorized access

Your trading platform will be fully functional on Render with real market data!