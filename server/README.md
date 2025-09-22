# OptiProfit Backend Server

Express.js backend server with JSON file storage for handling email webhooks from CloudMailin.

## Setup

The server dependencies are already installed when you run `npm install` from the project root.

## Running the Server

### Development Mode

Run both frontend and backend together:
```bash
npm run dev:all
```

Or run the backend server only:
```bash
npm run server
```

The server will start on port 3001 (http://localhost:3001).

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns server status and timestamp

### Email Webhook (CloudMailin)
- **POST** `/api/webhook/email`
- Receives and processes CloudMailin email data
- Stores emails in SQLite database

### Email Webhook Test
- **GET** `/api/webhook/email/test`
- Returns webhook endpoint information

### List Emails (Webhook Route)
- **GET** `/api/webhook/email/list/:accountId`
- Returns list of emails for specified account (legacy route)

### List Emails (Direct Route)
- **GET** `/api/emails/:accountId`
- Returns list of emails for specified account

### Inventory Management
- **GET** `/api/inventory/:accountId`
- Returns inventory items for specified account
- **POST** `/api/inventory/:accountId`
- Add or update inventory item (requires sku, quantity, vendor in body)

## Data Storage

Data is stored in JSON files in the `server/data/` directory:

### accounts.json
```json
[{
  "id": 1,
  "email": "test@optiprofit.com",
  "name": "Test Account",
  "created_at": "2025-01-05T12:00:00Z"
}]
```

### emails.json
Stores CloudMailin webhook data:
- `id` - Unique identifier
- `account_id` - Associated account
- `raw_data` - Full CloudMailin JSON payload
- `from_email`, `to_email`, `subject` - Email metadata
- `plain_text`, `html_text` - Email content
- `attachments_count` - Number of attachments
- `message_id` - Email message ID
- `spam_score` - Spam rating
- `processed_at` - Timestamp

### inventory.json
Stores inventory data:
- `id` - Unique identifier
- `account_id` - Associated account
- `sku` - Product SKU
- `quantity` - Current quantity
- `vendor` - Vendor name
- `created_at`, `updated_at` - Timestamps

## Testing

Test the webhook endpoints (server must be running):
```bash
cd server
node test-webhook.js
```

Test the database directly:
```bash
cd server
node test-database.js
```

## CloudMailin Setup

1. Configure CloudMailin to send webhooks to:
   ```
   http://your-server.com:3001/api/webhook/email
   ```

2. Set format to JSON (not multipart)

3. The webhook will log all incoming data and save to database

## Data Location

JSON data files are stored in:
```
server/data/
├── accounts.json
├── emails.json
└── inventory.json
```

This directory is gitignored and will be created automatically when the server starts.

## CORS Configuration

The server is configured to accept requests from the frontend at `http://localhost:5173`.

## Future Enhancements

- JWT authentication (placeholder in middleware/auth.js)
- Email parsing for inventory updates
- API endpoints for inventory management
- WebSocket support for real-time updates