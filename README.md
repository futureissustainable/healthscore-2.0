# ULTRASCORE - AI-Powered Health Scoring App

ULTRASCORE is a comprehensive health scoring application that uses AI to analyze food and personal care products, providing users with objective health scores and recommendations.

## Features

- **AI-Powered Analysis**: Uses Google Gemini AI to analyze products from text descriptions or images
- **Health Scoring**: Provides 0-100 health scores based on nutritional data and ingredients
- **Product Recommendations**: Suggests healthier alternatives and top-in-category products
- **Mobile-Optimized**: Responsive design with camera capture for mobile devices
- **Rate Limiting**: Redis-based rate limiting with different tiers for free and paid users
- **Payment Plans**: Three-tier pricing system (Free, Pro, Premium)
- **Usage Tracking**: Real-time usage monitoring with upgrade prompts

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **AI**: Google Gemini 2.5 Flash
- **Database**: Upstash Redis for rate limiting and user data
- **Deployment**: Vercel
- **UI Components**: shadcn/ui

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`env
# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Upstash Redis Configuration
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_redis_token

# Optional: Stripe for payments (future implementation)
# STRIPE_SECRET_KEY=your_stripe_secret_key
# STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
# STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
\`\`\`

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key
- Upstash Redis database

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd ultrascore-app
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your API keys
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

1. **Connect to Vercel**:
   - Push your code to GitHub
   - Connect your repository to Vercel
   - Vercel will automatically detect it's a Next.js app

2. **Environment Variables**:
   - In your Vercel dashboard, go to Settings > Environment Variables
   - Add all the environment variables from your `.env.local` file

3. **Integrations**:
   - Add Upstash Redis integration in Vercel dashboard
   - This will automatically set up `KV_REST_API_URL` and `KV_REST_API_TOKEN`

4. **Deploy**:
   - Vercel will automatically deploy on every push to main branch
   - Your app will be available at `https://your-app-name.vercel.app`

### Manual Deployment

If deploying elsewhere, ensure:
- Node.js 18+ runtime
- All environment variables are set
- Build command: `npm run build`
- Start command: `npm start`

## API Endpoints

### POST /api/analyze
Analyzes a product and returns health score.

**Request Body:**
\`\`\`json
{
  "term": "Product name or description",
  "image": "base64_encoded_image_data" // optional
}
\`\`\`

**Response:**
\`\`\`json
{
  "finalScore": 85,
  "category": "Good",
  "productName": "Greek Yogurt",
  "trustScore": 95,
  "breakdown": {
    "baseScore": 50,
    "adjustments": [
      { "reason": "High Protein", "points": 15 },
      { "reason": "Low Sugar", "points": 10 }
    ]
  },
  "nutrients": { ... },
  "healthierAddon": { ... },
  "topInCategory": { ... }
}
\`\`\`

### GET /api/usage
Returns current usage statistics for rate limiting.

**Response:**
\`\`\`json
{
  "used": 5,
  "limit": 10,
  "remaining": 5,
  "resetTime": 1640995200,
  "planName": "Free"
}
\`\`\`

## Rate Limiting

The app implements Redis-based rate limiting with different tiers:

- **Free Plan**: 10 scans per day
- **Pro Plan**: 100 scans per day  
- **Premium Plan**: 500 scans per day

Rate limits reset every 24 hours and are tracked per IP address.

## Payment Plans

Three pricing tiers are available:

1. **Free** ($0/month): 10 daily scans, basic features
2. **Pro** ($9.99/month): 100 daily scans, advanced insights
3. **Premium** ($19.99/month): 500 daily scans, API access

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── analyze/route.ts    # Main analysis endpoint
│   │   └── usage/route.ts      # Usage tracking endpoint
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── error-state.tsx         # Error display component
│   ├── header.tsx              # App header
│   ├── loading-state.tsx       # Loading animation
│   ├── pricing-modal.tsx       # Pricing plans modal
│   ├── score-display.tsx       # Score results display
│   ├── search-bar.tsx          # Search input with camera
│   └── usage-indicator.tsx     # Usage tracking display
├── lib/
│   ├── plans.ts                # Payment plan definitions
│   ├── rate-limit.ts           # Rate limiting logic
│   ├── user-plans.ts           # User plan management
│   └── utils.ts                # Utility functions
└── hooks/
    └── use-mobile.tsx          # Mobile detection hook
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@ultrascore.app or create an issue in the GitHub repository.
