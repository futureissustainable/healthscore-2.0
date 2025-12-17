# HEALTHSCORE - AI-Powered Health Scoring App

HEALTHSCORE is a comprehensive health scoring application that uses AI to analyze food and personal care products, providing users with objective health scores and recommendations.

## Features

### Core Features
- **AI-Powered Analysis**: Uses Google Gemini 3.0 Flash to analyze products from text descriptions or images
- **Health Scoring**: Provides 0-100 health scores based on nutritional data and ingredients
- **Product Recommendations**: Suggests healthier alternatives and top-in-category products
- **Mobile-Optimized**: Responsive design with camera capture for mobile devices
- **Rate Limiting**: Redis-based rate limiting with different tiers for free and paid users

### New Premium Features
- **Smart Meal Planner**: AI-powered personalized meal planning based on dietary preferences
- **Discover Foods**: Explore and discover new healthy food options curated by AI
- **Dietary Preferences**: Set and customize your dietary restrictions, allergies, and health goals
- **Scan History**: Track and access all your previous product scans
- **Favorites List**: Save and bookmark your favorite healthy products
- **In-Depth Analysis**: Detailed nutritional breakdowns, ingredient analysis, and personalized advice (Pro/Premium)
- **Community Features**: Share scans, see trending products, and connect with other users

### Payment Integration
- **Stripe Integration**: Secure payment processing for subscription upgrades
- **Three-Tier Pricing**: Free, Pro ($9.99/mo), and Premium ($19.99/mo) plans
- **Billing Portal**: Self-service subscription management via Stripe

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **AI**: Google Gemini 3.0 Flash
- **Database**: Upstash Redis for rate limiting and user data
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Deployment**: Vercel
- **UI Components**: shadcn/ui, Lucide Icons

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Upstash Redis Configuration
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_redis_token

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Optional - for Google Sign In)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxx
STRIPE_PRICE_PREMIUM_YEARLY=price_xxx

# MailerLite (Optional - for newsletter)
MAILERLITE_API_KEY=your_mailerlite_api_key
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Google Gemini API key
- Upstash Redis database
- Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd healthscore-2.0
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Stripe Setup

### Creating Products and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Products > Add Product
3. Create two products:
   - **Pro Plan**: $9.99/month (or $95.90/year for 20% discount)
   - **Premium Plan**: $19.99/month (or $191.90/year for 20% discount)
4. Copy the Price IDs to your environment variables

### Setting up Webhooks

1. Go to Developers > Webhooks in Stripe Dashboard
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the Webhook signing secret to `STRIPE_WEBHOOK_SECRET`

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

## API Endpoints

### POST /api/analyze
Analyzes a product and returns health score.

### GET /api/history
Returns user's scan history (requires authentication).

### POST /api/favorites
Add/remove products from favorites (requires authentication).

### GET/POST /api/preferences
Get/update user dietary preferences (requires authentication).

### GET/POST /api/meal-planner
Get/generate AI-powered meal plans (Pro/Premium only).

### GET /api/discover
Get curated healthy food recommendations.

### GET/POST /api/community
Community feed and interactions.

### POST /api/stripe/checkout
Create Stripe checkout session for subscription.

### POST /api/stripe/webhook
Handle Stripe webhook events.

### POST /api/stripe/portal
Create Stripe billing portal session.

## Rate Limiting

The app implements Redis-based rate limiting with different tiers:

- **Free Plan**: 30 scans per day
- **Pro Plan**: 100 scans per day
- **Premium Plan**: 500 scans per day

Rate limits reset every 24 hours and are tracked per IP address (or user ID for logged-in users).

## Payment Plans

Three pricing tiers are available:

| Plan | Price | Daily Scans | Features |
|------|-------|-------------|----------|
| Free | $0/month | 30 | Basic scoring, recommendations |
| Pro | $9.99/month | 100 | Advanced insights, meal planner, scan history, in-depth analysis |
| Premium | $19.99/month | 500 | All Pro features + API access, priority support |

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── analyze/route.ts       # Main analysis endpoint
│   │   ├── auth/[...nextauth]/    # NextAuth.js authentication
│   │   ├── community/route.ts     # Community feed
│   │   ├── discover/route.ts      # Discover foods
│   │   ├── favorites/route.ts     # Favorites management
│   │   ├── history/route.ts       # Scan history
│   │   ├── meal-planner/route.ts  # AI meal planning
│   │   ├── preferences/route.ts   # User preferences
│   │   ├── stripe/                # Stripe integration
│   │   └── usage/route.ts         # Usage tracking
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout with providers
│   └── page.tsx                   # Home page
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── community-modal.tsx        # Community features
│   ├── discover-modal.tsx         # Discover foods
│   ├── favorites-modal.tsx        # Favorites list
│   ├── header.tsx                 # App header with navigation
│   ├── meal-planner-modal.tsx     # AI meal planner
│   ├── preferences-modal.tsx      # Dietary preferences
│   ├── pricing-modal.tsx          # Stripe pricing
│   ├── providers.tsx              # SessionProvider wrapper
│   ├── scan-history-modal.tsx     # Scan history
│   ├── score-display.tsx          # Score results display
│   ├── search-bar.tsx             # Search input with camera
│   └── user-menu.tsx              # User account menu
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   ├── db.ts                      # Database helpers
│   ├── plans.ts                   # Payment plan definitions
│   ├── rate-limit.ts              # Rate limiting logic
│   ├── stripe.ts                  # Stripe configuration
│   ├── user-plans.ts              # User plan management
│   └── utils.ts                   # Utility functions
├── types/
│   └── next-auth.d.ts             # NextAuth type extensions
└── hooks/
    └── use-mobile.tsx             # Mobile detection hook
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@healthscore.app or create an issue in the GitHub repository.
