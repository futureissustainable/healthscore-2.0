# Deployment Guide

This guide covers deploying ULTRASCORE to Vercel and setting up the required integrations.

## Prerequisites

Before deploying, ensure you have:

1. **Google Gemini API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Save it securely

2. **Upstash Redis Database**
   - Visit [Upstash Console](https://console.upstash.com/)
   - Create a new Redis database
   - Note the REST API URL and Token

3. **GitHub Repository**
   - Push your code to a GitHub repository
   - Ensure all files are committed

## Vercel Deployment Steps

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Next.js project

### 2. Configure Environment Variables

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Production, Preview, Development |
| `KV_REST_API_URL` | Your Upstash Redis URL | Production, Preview, Development |
| `KV_REST_API_TOKEN` | Your Upstash Redis token | Production, Preview, Development |

### 3. Add Upstash Integration (Recommended)

Instead of manually adding Redis variables:

1. Go to **Integrations** in your Vercel dashboard
2. Search for "Upstash"
3. Install the Upstash integration
4. Connect your Upstash account
5. Select your Redis database

This automatically sets up the `KV_REST_API_URL` and `KV_REST_API_TOKEN` variables.

### 4. Deploy

1. Click **Deploy** in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## Post-Deployment Checklist

### Test Core Functionality

1. **Health Scoring**: Try analyzing a product
2. **Image Upload**: Test camera/image upload functionality
3. **Rate Limiting**: Make multiple requests to test limits
4. **Mobile Experience**: Test on mobile devices

### Monitor Performance

1. Check Vercel Analytics for performance metrics
2. Monitor Upstash Redis usage
3. Set up error tracking (optional: Sentry integration)

### Security Considerations

1. **API Keys**: Ensure all sensitive keys are in environment variables
2. **Rate Limiting**: Verify rate limiting is working correctly
3. **CORS**: API routes are protected by Next.js defaults
4. **Input Validation**: All user inputs are validated

## Environment-Specific Configuration

### Development
\`\`\`bash
# .env.local
GEMINI_API_KEY=your_dev_api_key
KV_REST_API_URL=your_dev_redis_url
KV_REST_API_TOKEN=your_dev_redis_token
\`\`\`

### Production
- Use Vercel environment variables
- Consider separate Redis database for production
- Enable Vercel Analytics and Speed Insights

### Preview (Staging)
- Same as production but with staging API keys
- Useful for testing before production deployment

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify Gemini API key is correct
   - Check API key has proper permissions
   - Ensure environment variable names match exactly

2. **Redis Connection Issues**
   - Verify Upstash Redis URL and token
   - Check Redis database is active
   - Test connection in Upstash console

3. **Build Failures**
   - Check for TypeScript errors
   - Verify all dependencies are in package.json
   - Review build logs in Vercel dashboard

4. **Rate Limiting Not Working**
   - Verify Redis connection
   - Check rate limiting logic in `/api/analyze`
   - Test with different IP addresses

### Performance Optimization

1. **API Response Times**
   - Monitor Gemini API response times
   - Consider caching common product analyses
   - Optimize image processing

2. **Redis Usage**
   - Monitor Redis memory usage
   - Set appropriate TTL values
   - Clean up expired rate limit entries

3. **Bundle Size**
   - Use Next.js bundle analyzer
   - Optimize images and assets
   - Remove unused dependencies

## Scaling Considerations

### Traffic Growth
- Monitor Vercel function execution limits
- Consider upgrading Vercel plan for higher limits
- Implement caching strategies

### Database Scaling
- Monitor Upstash Redis usage
- Consider upgrading Redis plan
- Implement data archiving for old rate limit data

### API Limits
- Monitor Google Gemini API usage
- Implement request queuing for high traffic
- Consider multiple API keys for load distribution

## Monitoring and Maintenance

### Regular Tasks
1. Monitor error rates in Vercel dashboard
2. Check Redis memory usage in Upstash console
3. Review API usage and costs
4. Update dependencies regularly

### Alerts Setup
1. Set up Vercel deployment notifications
2. Configure Upstash usage alerts
3. Monitor API error rates

This deployment guide ensures a smooth production deployment with proper monitoring and scaling considerations.
