# OptiProfit - Optical Business Intelligence Platform

<div align="center">
  <img src="public/logos/logo-removebg-preview.png" alt="OptiProfit Logo" width="200"/>
  
  **Maximize frame profitability through intelligent inventory management and profit optimization**
  
  [![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://www.optiprofit.app)
  [![Documentation](https://img.shields.io/badge/docs-comprehensive-blue)](./docs)
  [![Version](https://img.shields.io/badge/version-1.0-orange)](./package.json)
</div>

## 🚀 Overview

OptiProfit is a comprehensive business intelligence platform designed specifically for optometrists and optical retailers. It streamlines operations from order processing to profit calculation, helping businesses maximize their frame profitability through data-driven decisions.

### Core Features

- **📧 Automated Order Processing** - Email-to-inventory pipeline with 7 vendor parsers
- **📦 Inventory Management** - Complete lifecycle tracking (pending → current → sold → archived)
- **💰 Profit Optimization** - Calculate exact profit margins with insurance billing support
- **🏢 Vendor Management** - Track pricing relationships with 13+ major optical vendors
- **🔄 Side-by-Side Comparison** - Compare frames to identify most profitable options
- **📊 Returns Tracking** - Monitor return windows and generate professional PDF reports
- **📈 Analytics Dashboard** - Monitor business performance with key metrics
- **🎯 Interactive Demo** - 18-step guided tutorial for new users

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- CloudMailin account (for email processing)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/opti-profit.git
cd opti-profit/Version1

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Environment Variables

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001

# Backend (.env in /server)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
CLOUDMAILIN_WEBHOOK_SECRET=your_webhook_secret
```

### Running Locally

```bash
# Start the frontend (Vite)
npm run dev              # http://localhost:5173

# In another terminal, start the backend
cd backend
npm install
node index.js            # http://localhost:3001

# Or run both at once
npm run dev:all
```

### Building for Production

```bash
# Build frontend
npm run build            # Outputs to /dist

# Preview production build
npm run preview
```

## 📋 Complete Documentation Index

### Getting Started
- [Project Breakdown](./PROJECT_BREAKDOWN.md) - **Complete project overview** (start here!)
- [Deployment Guide](./docs/deployment/DEPLOYMENT_GUIDE.md) - Step-by-step deployment instructions
- [Environment Setup](./docs/deployment/ENVIRONMENT_CHECKLIST.md) - Environment requirements
- [Vite Environment Variables](./docs/deployment/VITE_ENVIRONMENT_VARIABLES.md) - Frontend configuration

### Feature Documentation
- [Inventory Feature](./docs/features/INVENTORY_FEATURE.md) - Inventory management system
- [Feedback System](./docs/features/FEEDBACK_SYSTEM_SETUP.md) - User feedback implementation
- [Supabase Auth](./docs/features/SUPABASE_AUTH_IMPLEMENTATION.md) - Authentication setup

### Vendor Integrations
- [Safilo Integration](./docs/vendor-integrations/SAFILO_INTEGRATION.md) - Safilo parser (18 formats)
- [Ideal Optics Integration](./docs/vendor-integrations/IDEAL_OPTICS_INTEGRATION.md) - Ideal Optics integration
- [Vendor Catalog Implementation](./docs/vendor-integrations/VENDOR_CATALOG_IMPLEMENTATION_SUMMARY.md) - Catalog system
- [Vendor Optimization](./docs/vendor-integrations/VENDOR_OPTIMIZATION_RECOMMENDATIONS.md) - Performance tips
- [N8N Workflow Guide](./docs/vendor-integrations/N8N_CATALOG_NODES_GUIDE.md) - Automation workflows

### Technical Documentation
- [System Architecture](./docs/technical/SYSTEM_ARCHITECTURE.md) - **Complete system architecture overview**
- [API Endpoints](./docs/technical/API_ENDPOINTS.md) - **Complete REST API reference**
- [Email Pipeline](./docs/technical/EMAIL_PIPELINE.md) - **Complete email processing pipeline documentation**
- [Database Schema](./docs/technical/DATABASE_SCHEMA.md) - **Complete database schema with ERD diagrams**
- [Style Guide](./docs/technical/STYLE_GUIDE.md) - **Complete design system and component library**
- [Testing Strategy](./docs/technical/TESTING.md) - Testing approach and coverage
- [Debugging Guide](./docs/technical/DEBUGGING_GUIDE.md) - Debugging tips and strategies
- [Refactoring Status](./docs/technical/REFACTORING_STATUS.md) - Current refactoring progress
- [Refactoring Complete](./docs/technical/REFACTORING_COMPLETE.md) - Completed refactoring tasks
- [Refactoring Plan](./docs/REFACTORING_PLAN.md) - Future refactoring strategy
- [Return Report Spec](./docs/return_report_spec.md) - Return report specifications
- [Previous Bugs](./previous_bugs/README.md) - Bug history and resolutions

### Security Documentation
- [Security Guide](./docs/security/SECURITY.md) - Security implementation details
- [Security Summary](./docs/security/SECURITY_SUMMARY.md) - Security overview

### UI/UX Documentation
- [Demo Plan](./docs/ui-ux/DEMO_PLAN.md) - Interactive tutorial planning
- [Demo Positioning](./docs/ui-ux/DEMO_POSITIONING_IMPROVEMENTS.md) - Demo tooltip positioning
- [Demo Tab Switching](./docs/ui-ux/DEMO_TAB_SWITCHING.md) - Demo navigation between tabs
- [Profit Comparison Demo](./docs/ui-ux/PROFIT_COMPARISON_DEMO.md) - Comparison feature demo
- [Spacing Guide](./docs/ui-ux/SPACING_GUIDE.md) - UI spacing guidelines

### Server Documentation
- [Server README](./server/README.md) - Express server and API endpoints
- [Customer Domains Config](./server/CUSTOMER_DOMAINS_CONFIG.md) - Domain filtering setup
- [Forwarded Email Handling](./server/FORWARDED_EMAIL_HANDLING.md) - Email processing
- [Vendor Detection](./server/VENDOR_DETECTION_README.md) - Vendor detection system
- [Kenmark Parser](./server/parsers/KENMARK_README.md) - Kenmark parser details

### Tool Documentation
- [Vendor Comparison Tool](./vendor-comparison/README.md) - Vendor comparison feature

## 🏗️ Architecture

OptiProfit employs a modern microservices-inspired architecture with clear separation between frontend, backend, and data layers. The system processes vendor emails, manages inventory workflows, and provides real-time analytics.

### Tech Stack

**Frontend**
- React 18.3.1 with TypeScript
- Vite 6.3.5 build tool
- Tailwind CSS for styling
- Framer Motion for animations
- React Query for data fetching

**Backend**
- Node.js with Express 4.18.2
- Supabase (PostgreSQL) database
- CloudMailin webhook for email processing
- Vendor-specific parsers (PDF & HTML)

**Deployment**
- Frontend: Vercel Edge Network
- Backend: Render Web Service
- Database: Supabase Cloud

**For complete technical details, see [System Architecture](./docs/technical/SYSTEM_ARCHITECTURE.md)**

### Project Structure

```
Version1/
├── frontend/              # Frontend source code (React + TypeScript)
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── backend/               # Backend source code (Express.js)
│   ├── routes/            # API endpoints
│   ├── parsers/           # Vendor email parsers
│   ├── middleware/        # Express middleware
│   ├── lib/               # Utilities
│   └── services/          # Backend services
├── supabase/              # Database configuration
│   ├── migrations/        # SQL migration files
│   └── functions/         # Supabase edge functions
├── n8n/                   # n8n workflow automation
│   ├── workflows/         # Workflow JSON files
│   └── templates/         # Workflow templates
├── docs/                  # Documentation
│   ├── technical/         # Technical docs (API, architecture)
│   ├── deployment/        # Deployment guides
│   ├── features/          # Feature documentation
│   ├── implementation/    # Implementation details
│   └── archive/           # Historical documentation
├── dev/                   # Development resources
│   ├── email-parsers/     # Test email samples by vendor
│   └── design-inspiration/# Design reference files
└── public/                # Static assets
```

## 🔄 Operational Workflow

1. **📧 Email Processing** → Vendor emails are forwarded to unique OptiProfit address
2. **🤖 Parsing** → Vendor-specific parsers extract order data
3. **📋 Review** → User reviews parsed data in Emails tab
4. **✅ Confirm** → User confirms orders to move to inventory
5. **📦 Manage** → Track inventory through lifecycle (current → sold)
6. **📊 Calculate** → Use profit calculator with auto-populated vendor pricing
7. **🔄 Returns** → Monitor return windows and generate reports

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Type checking
npm run type-check
```

Current test coverage: 45/57 tests passing (79%)

## 🚀 Deployment

See [Deployment Guide](./DEPLOYMENT_GUIDE.md) for detailed instructions.

### Quick Deploy to Render

1. **Frontend** - Deploy as Static Site
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **Backend** - Deploy as Web Service
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node index.js`

3. **Environment Variables** - Set in Render dashboard

## 🔐 Security

- JWT-based authentication with Supabase Auth
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure webhook verification
- CORS and security headers with Helmet

See [Security Guide](./SECURITY.md) for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support & Troubleshooting

### Common Issues

#### Environment Setup
- **"Module not found" errors**: Run `npm install` in both root and server directories
- **Port conflicts**: Change PORT in server/.env or kill processes on port 3001/5173
- **Supabase connection fails**: Verify SUPABASE_URL and keys in .env files
- **CORS errors**: Ensure FRONTEND_URL matches your development URL

#### Email Processing
- **Emails not received**: Check CloudMailin webhook URL and secret
- **Vendor not detected**: Email may be from unsupported vendor (see [Vendor Detection](./server/VENDOR_DETECTION_README.md))
- **Parsing failures**: Check [Previous Bugs](./previous_bugs/README.md) for known issues

#### Database Issues
- **Connection timeouts**: Verify Supabase service key has proper permissions
- **Missing tables**: Run database migrations in Supabase SQL editor
- **RLS policies**: Ensure Row Level Security is configured correctly

#### Development
- **Hot reload not working**: Restart Vite dev server (`npm run dev`)
- **API calls failing**: Check server is running on correct port
- **TypeScript errors**: Run `npm run type-check` to identify issues

### Getting Help

- **Documentation**: See the complete [documentation index](#-complete-documentation-index) above
- **Bug Reports**: Open an issue in the repository
- **Feature Requests**: Open an issue with the enhancement label
- **Debugging**: Check [Debugging Guide](./DEBUGGING_GUIDE.md) for detailed troubleshooting

### Quick Diagnostics

```bash
# Check if services are running
curl http://localhost:3001/api/health  # Backend health check
curl http://localhost:5173             # Frontend health check

# Test database connection
cd server && node -e "require('./lib/supabase.js').testConnection()"

# Verify environment variables
npm run env:check                      # (if script exists)
```

## 🎯 Roadmap

### Phase 1 ✅ (Complete)
- Email processing with 7 vendor parsers
- Inventory lifecycle management
- Profit calculator with insurance support
- Return window tracking
- Interactive demo system

### Phase 2 🚧 (In Progress)
- Multi-location support
- Advanced analytics
- Automated email forwarding
- Bulk inventory actions

### Phase 3 📋 (Planned)
- AI-powered recommendations
- POS system integration
- Mobile app
- Automated reorder suggestions

---

<div align="center">
  <strong>Built with ❤️ for Optical Professionals</strong>
  <br>
  <a href="https://www.optiprofit.app">Visit OptiProfit</a>
</div>