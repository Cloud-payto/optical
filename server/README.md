# OptiProfit Backend Server

Express.js backend server for OptiProfit, providing API endpoints for email processing, inventory management, and vendor integrations. Uses Supabase (PostgreSQL) for data storage and CloudMailin for email webhook processing.

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Supabase account with database configured
- CloudMailin account (for email processing)

### Installation

```bash
# From project root
npm install

# Or from server directory
cd server
npm install
```

### Environment Variables

Copy the backend variables from the root [.env.example](../.env.example) file to `server/.env`:

```bash
# From project root
cp .env.example server/.env
# Edit server/.env and keep only the backend variables
```

Required variables for the server:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key
- `CLOUDMAILIN_WEBHOOK_SECRET` - CloudMailin webhook verification
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS

See the root [.env.example](../.env.example) file for complete documentation of all variables.

## 🏃‍♂️ Running the Server

### Development Mode

```bash
# From project root - run both frontend and backend
npm run dev:all

# Run backend only
cd server
node index.js
```

The server will start on port 3001 (http://localhost:3001).

### Production Mode

```bash
cd server
NODE_ENV=production node index.js
```

## 📡 API Endpoints

### Health & Status
- **GET** `/api/health` - Server health check and status

### Authentication
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/logout` - User logout

### Email Management
- **POST** `/api/webhook/email` - CloudMailin webhook endpoint (receives vendor emails)
- **GET** `/api/emails/:accountId` - List all emails for account
- **DELETE** `/api/emails/:accountId/:emailId` - Delete specific email
- **POST** `/api/emails/detect-vendor` - Test vendor detection logic

### Inventory Management
- **GET** `/api/inventory/:accountId` - List all inventory items
- **GET** `/api/inventory/:accountId/status/:status` - Filter by status (pending/current/sold/archived)
- **POST** `/api/inventory/:accountId/confirm/:orderNumber` - Confirm order and enrich data
- **PUT** `/api/inventory/:accountId/:itemId/sold` - Mark item as sold
- **PUT** `/api/inventory/:accountId/:itemId/archive` - Archive item
- **PUT** `/api/inventory/:accountId/:itemId/restore` - Restore archived item
- **DELETE** `/api/inventory/:accountId/:itemId` - Permanently delete item

### Order Management
- **GET** `/api/orders/:accountId` - List all orders
- **GET** `/api/orders/:accountId/status/:status` - Filter orders by status
- **POST** `/api/orders/:accountId` - Create new order
- **DELETE** `/api/orders/:accountId/:orderId` - Delete order

### Vendor Management
- **GET** `/api/vendors` - List all global vendors
- **GET** `/api/vendors/:accountId/with-pricing` - Get vendors with account-specific pricing
- **POST** `/api/vendors/:accountId/brands` - Save account brand pricing
- **PUT** `/api/vendors/:accountId/brands/:brandId` - Update brand pricing
- **DELETE** `/api/vendors/:accountId/brands/:brandId` - Remove brand

### Vendor-Specific Processing
- **POST** `/api/safilo/process` - Process Safilo PDF orders
- **POST** `/api/safilo/reprocess` - Re-run Safilo enrichment
- **GET** `/api/safilo/statistics` - Safilo processing statistics

### Enrichment Services
- **POST** `/api/enrich/idealoptics` - Ideal Optics batch enrichment
- **POST** `/api/enrich/idealoptics/single` - Single product test

### Statistics & Analytics
- **GET** `/api/stats/:accountId` - Dashboard statistics
- **GET** `/api/stats/:accountId/vendors` - Vendor inventory breakdown

### Brands & Calculations
- **GET** `/api/brands` - List all brands (legacy)
- **POST** `/api/brands` - Create brand (legacy)
- **POST** `/api/calculations` - Profit calculations

## 🗄️ Database Structure

The server uses Supabase (PostgreSQL) with the following key tables:

- `accounts` - User accounts
- `emails` - Received vendor emails
- `inventory` - Frame inventory with lifecycle tracking
- `orders` - Vendor orders
- `vendors` - Global vendor list
- `brands` - Frame brands
- `account_brands` - Account-specific brand pricing
- `account_vendors` - Account-vendor relationships
- `return_reports` - Return report metadata
- `api_logs` - API call logging
- `email_patterns` - Vendor detection patterns

See [README_SCHEMA.md](../README_SCHEMA.md) for complete database schema.

## 📧 Email Processing

### CloudMailin Webhook Flow

1. Vendor email forwarded to `account-{id}@mail.optiprofit.app`
2. CloudMailin posts to `/api/webhook/email`
3. Server performs 3-tier vendor detection:
   - **Tier 1**: Domain matching (95% confidence)
   - **Tier 2**: Strong signatures (90% confidence)
   - **Tier 3**: Weak patterns (75% confidence)
4. Vendor-specific parser processes email
5. Creates pending inventory items
6. User confirms order to move to current inventory

### Supported Vendor Parsers

Located in `/server/parsers/`:

1. **SafiloService.js** - PDF parsing with API enrichment (18 formats)
2. **ModernOpticalService.js** - HTML parsing with web scraping
3. **IdealOpticsService.js** - HTML parsing with web scraping
4. **EtniaBarcelonaService.js** - Email parsing
5. **KenmarkService.js** - Email parsing
6. **LamyamericaService.js** - Email parsing
7. **luxotticaParser.js** - Email parsing

## 🔒 Security

### Middleware (`/server/middleware/security.js`)
- **Helmet.js** - Security headers (XSS, clickjacking protection)
- **CORS** - Cross-origin resource sharing configuration
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Request Logging** - Morgan for HTTP request logging

### Authentication
- JWT-based authentication via Supabase Auth
- Service role key for server-side operations
- Row-level security (RLS) policies in database

## 🧪 Testing

### Test Email Webhook
```bash
cd server
node scripts/testForwardedEmail.js
```

### Test Vendor Detection
```bash
cd server
node scripts/testVendorDetection.js
```

### Test Specific Parsers
```bash
cd server/parsers
node test-safilo-pdf.js
node test-idealoptics-quick.js
node test-kenmark.js
```

### Run API Tests
```bash
npm test
```

## 📁 Project Structure

```
server/
├── index.js              # Express server entry point
├── routes/              # API route handlers
│   ├── auth.js
│   ├── emails.js
│   ├── inventory.js
│   ├── orders.js
│   ├── vendors.js
│   └── webhook.js
├── parsers/             # Vendor email parsers
│   ├── SafiloService.js
│   ├── ModernOpticalService.js
│   └── ...
├── middleware/          # Express middleware
│   └── security.js
├── lib/                # Utilities
│   └── supabase.js     # Supabase client and operations
├── services/           # Business logic
│   └── vendorDetection.js
└── scripts/            # Utility scripts
```

## 🚀 Deployment

### Environment Variables Required

```env
# Production Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# CloudMailin
CLOUDMAILIN_WEBHOOK_SECRET=your_secret

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://www.optiprofit.app
```

### Deploy to Render.com

1. Create Web Service
2. Set build command: `cd server && npm install`
3. Set start command: `cd server && node index.js`
4. Add environment variables
5. Deploy

## 🐛 Debugging

Enable debug logging:
```bash
DEBUG=optiprofit:* node index.js
```

Check API logs in Supabase:
```sql
SELECT * FROM api_logs 
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;
```

## 📚 Additional Resources

- [Vendor Detection README](./VENDOR_DETECTION_README.md)
- [Forwarded Email Handling](./FORWARDED_EMAIL_HANDLING.md)
- [Customer Domains Config](./CUSTOMER_DOMAINS_CONFIG.md)
- [Kenmark Parser Documentation](./parsers/KENMARK_README.md)