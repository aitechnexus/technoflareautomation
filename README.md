# GHL SaaS Automation Platform

## Project Overview
- **Name**: GHL SaaS Automation Platform
- **Goal**: Build an external application that programmatically turns 150+ GoHighLevel (GHL) snapshots into sellable SaaS plans
- **Features**: 
  - Export GHL snapshots to Excel
  - Bulk plan creation with AI-generated descriptions and images
  - Stripe integration with 14-day free trials
  - Automated provisioning and snapshot application
  - Full audit trail and role-based access

## URLs
- **Production**: https://interface-technoflare.pages.dev
- **Alternative**: https://int.technoflare.tech
- **GitHub**: (To be created)

## Current Status

### ✅ Completed Features
- Homepage with 3-step workflow visualization
- Catalog page (placeholder)
- Admin dashboard (placeholder)
- Basic API structure with health check
- Responsive UI with TailwindCSS
- FontAwesome icons integration

### 🚧 Features Not Yet Implemented
- GHL OAuth 2.0 integration
- Snapshot export to Excel functionality
- Excel import and plan generation
- Stripe product/price/payment link creation
- Database integration (Cloudflare D1)
- Tenant provisioning workflow
- Webhook handlers for Stripe events
- Image generation via AI
- Collection management
- Bulk operations for 150+ snapshots

## Architecture

### Tech Stack
- **Frontend**: HTML + TailwindCSS + FontAwesome
- **Backend**: Hono framework (TypeScript)
- **Deployment**: Cloudflare Pages
- **Database**: Cloudflare D1 (planned)
- **Storage**: Cloudflare KV/R2 (planned)
- **Billing**: Stripe
- **External APIs**: GoHighLevel API 2.0, OpenAI (for content generation)

### Data Models
See `skill.md` for complete data model specifications including:
- vendors, snapshots, collections
- plans, media_assets, catalog_assets
- tenants, runs, webhook_events
- xlsx_rows (staging table)

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server (sandbox)
npm run dev:sandbox

# Or use PM2 for background process
pm2 start ecosystem.config.cjs

# Test the server
npm test  # or: curl http://localhost:3000
```

### Production Deployment
```bash
# Build and deploy to Cloudflare Pages
npm run deploy:prod

# Verify deployment
curl https://interface-technoflare.pages.dev
```

## Project Structure
```
ghl-saas-automation/
├── src/
│   └── index.tsx          # Main Hono application with routes
├── public/
│   └── static/            # Static assets (future)
├── skill.md               # Complete implementation specification
├── README.md              # This file
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── wrangler.jsonc         # Cloudflare configuration
└── .gitignore            # Git ignore rules
```

## API Endpoints

### Current Routes
- `GET /` - Homepage
- `GET /catalog` - Snapshot catalog (placeholder)
- `GET /admin` - Admin dashboard (placeholder)
- `GET /api/health` - Health check
- `GET /api/snapshots` - Snapshots list (to be implemented)

### Planned API Routes (from skill.md)
See `skill.md` Section 7 for complete endpoint specifications including:
- Auth: `/auth/ghl/login`, `/auth/ghl/callback`
- Admin: `/admin/snapshots/export`, `/admin/excel/upload`, `/admin/excel/process`
- Catalog: `/catalog/plans`, `/catalog/plans/:slug`
- Webhooks: `/webhook/stripe`
- Operations: `/admin/plans/:id/push-update`

## Environment Variables Required
```env
# App
APP_ENV=dev
APP_URL=https://saas.yourdomain.com
JWT_SECRET=•••

# GoHighLevel OAuth (LeadConnector)
GHL_CLIENT_ID=•••
GHL_CLIENT_SECRET=•••
GHL_OAUTH_REDIRECT_URL=https://saas.yourdomain.com/oauth/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_•••
STRIPE_WEBHOOK_SECRET=whsec_•••

# Content Generation (optional)
OPENAI_API_KEY=•••
IMAGE_GEN_API_KEY=•••
```

## Recommended Next Steps

### Phase 1: Foundation (Priority)
1. Set up Cloudflare D1 database with schema from skill.md
2. Implement GHL OAuth 2.0 flow
3. Create GHL API adapter with v2.0 endpoints
4. Build snapshot export to Excel functionality

### Phase 2: Core Workflow
1. Implement Excel upload and parsing
2. Build plan creation pipeline (sequential processing)
3. Integrate Stripe SDK for product/price/payment link generation
4. Add AI-generated descriptions and images

### Phase 3: Provisioning
1. Set up Stripe webhook handler
2. Implement tenant provisioning workflow
3. Build GHL sub-account creation and snapshot application
4. Add welcome email/SMS triggers

### Phase 4: Management
1. Build collection management UI
2. Add bulk operations for 150+ snapshots
3. Implement audit trail and logging
4. Add role-based access controls

## Documentation
- Complete implementation specification: `skill.md`
- GHL API 2.0 documentation: [https://highlevel.stoplight.io/](https://highlevel.stoplight.io/)
- Stripe API documentation: [https://stripe.com/docs/api](https://stripe.com/docs/api)
- Cloudflare Pages: [https://developers.cloudflare.com/pages/](https://developers.cloudflare.com/pages/)
- Hono framework: [https://hono.dev/](https://hono.dev/)

## User Guide
This platform is designed for GHL agencies who want to:
1. Convert their snapshot library into monetized SaaS products
2. Automate customer provisioning and onboarding
3. Manage subscriptions and billing through Stripe
4. Scale operations with bulk processing capabilities

### Typical User Journey
1. **Admin**: Export snapshots from GHL to Excel
2. **Admin**: Review and edit snapshot metadata in Excel
3. **Admin**: Upload Excel to create plans with Stripe integration
4. **Customer**: Browse catalog and select a plan
5. **Customer**: Checkout with 14-day free trial (Stripe)
6. **System**: Auto-provision sub-account and apply snapshot
7. **Customer**: Receive welcome email with credentials
8. **Admin**: Monitor tenants and push updates

## Deployment Status
- **Platform**: Cloudflare Pages
- **Status**: ✅ Active (Frontend only - backend features pending)
- **Last Updated**: 2024-10-30

## License
Proprietary - All rights reserved

## Support
For implementation guidance, refer to the comprehensive `skill.md` documentation.
