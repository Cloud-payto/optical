# OptiProfit - Optical Business Intelligence Platform

A SaaS platform for optical practices that automates vendor email parsing, inventory tracking, and profitability analysis.

## Features

- **Automated Email Processing**: CloudMailin webhook integration for vendor order emails
- **Multi-Vendor Support**: Parsers for Safilo, Modern Optical, Luxottica, and more
- **Inventory Management**: Track frames from order to sale
- **Profitability Analysis**: Calculate margins and optimize pricing
- **Multi-Tenant Architecture**: Secure, isolated data for each practice
- **API Enrichment**: Automatic product data validation and enrichment

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Backend**: Vercel Serverless Functions
- **Database**: PostgreSQL (Vercel Postgres)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Email Processing**: CloudMailin webhooks
- **PDF Parsing**: pdf-parse
- **HTML Parsing**: Cheerio

## Project Structure

```
optical-app/
├── api/                    # Vercel serverless functions
│   ├── webhook.js         # CloudMailin email webhook
│   ├── parse-safilo.js    # Safilo PDF parser
│   ├── parse-modern.js    # Modern Optical parser
│   ├── inventory.js       # Inventory management
│   └── orders.js          # Order management
├── frontend/              # Next.js frontend
│   ├── pages/            # Page components
│   ├── components/       # React components
│   └── styles/           # CSS files
├── services/             # Business logic
│   ├── SafiloService.js  # Safilo parser service
│   └── ModernOpticalParser.js
├── lib/                  # Utilities
│   └── database.js       # Database queries
├── database/             # Database files
│   └── schema.sql        # PostgreSQL schema
└── vercel.json           # Vercel configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Vercel account
- CloudMailin account

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd optical-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. Run database migrations:
```bash
psql $DATABASE_URL < database/schema.sql
```

5. Start development server:
```bash
npm run dev
```

Visit http://localhost:3000

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Configure environment variables in Vercel dashboard

4. Set CloudMailin webhook URL to:
```
https://your-domain.vercel.app/api/webhook
```

## API Endpoints

### Email Processing
- `POST /api/webhook` - CloudMailin webhook endpoint
- `GET /api/webhook?emailId={id}` - Debug email parsing
- `GET /api/webhook?accountId={id}` - List emails

### Vendor Parsers
- `POST /api/parse-safilo` - Process Safilo PDF
- `PUT /api/parse-safilo` - Re-process with enrichment
- `POST /api/parse-modern` - Process Modern Optical email

### Inventory Management
- `GET /api/inventory` - List inventory items
- `POST /api/inventory` - Add inventory items
- `PUT /api/inventory?id={id}` - Update item
- `DELETE /api/inventory?id={id}` - Delete item

### Order Management
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PUT /api/orders?id={id}` - Update order
- `DELETE /api/orders?id={id}` - Delete order

## Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `EMAIL_WEBHOOK_SECRET` - CloudMailin verification
- `SAFILO_API_KEY` - Safilo API credentials
- And more...

## Development

### Running Tests
```bash
npm test
```

### Code Style
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

## Architecture

### Multi-Tenant Design
- Account-based data isolation
- Row-level security
- Tenant-specific API keys

### Email Processing Flow
1. Vendor sends order email
2. CloudMailin receives and forwards to webhook
3. Webhook detects vendor and selects parser
4. Parser extracts order and frame data
5. Data saved to PostgreSQL
6. Optional API enrichment for validation

### Security
- JWT authentication
- Encrypted API keys
- HTTPS only
- Rate limiting
- Input validation

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

Proprietary - All rights reserved

## Support

For support, email support@optiprofit.com or create an issue.

---

Built with ❤️ for optical practices