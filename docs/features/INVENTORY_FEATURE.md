# Inventory Management Feature

## Overview

The Inventory Management page provides a centralized view of pending orders and received inventory items by integrating with the backend JSON database.

## Features

### Frontend (`src/pages/Inventory.tsx`)

- **Pending Orders Tab**: Shows emails received from CloudMailin webhooks
  - Displays sender, subject, received date, attachments count, spam score
  - Color-coded spam scores (green < 0.3, yellow < 0.7, red ≥ 0.7)
  - Search functionality by email address or subject

- **Received Items Tab**: Shows inventory items in the system
  - Displays SKU, quantity, vendor, created/updated timestamps
  - Search functionality by SKU or vendor name

- **Responsive Design**: Consistent with existing Tailwind CSS design
- **Real-time Updates**: Refresh button to reload data from backend
- **Error Handling**: Shows user-friendly error messages with retry option

### Backend API (`src/services/api.ts`)

- **fetchEmails()**: GET `/api/webhook/email/list/{accountId}`
- **fetchInventory()**: GET `/api/inventory/{accountId}` 
- **checkHealth()**: GET `/api/health`
- **markAsReceived()**: POST (placeholder for future implementation)

### Navigation

- Added "Inventory" link to sidebar with warehouse icon
- Accessible at `/inventory` route

## Usage

1. **Start Backend**: 
   ```bash
   npm run server
   ```

2. **Start Frontend**:
   ```bash
   npm run dev
   ```

3. **Run Both**:
   ```bash
   npm run dev:all
   ```

4. **Add Sample Data**:
   ```bash
   cd server
   node test-database.js
   ```

5. Navigate to `http://localhost:5173/inventory` to view the page

## Data Flow

1. CloudMailin sends webhook to `/api/webhook/email`
2. Backend stores email data in `server/data/emails.json`
3. Frontend fetches data via API calls
4. User can view, search, and filter pending orders
5. Inventory items stored in `server/data/inventory.json`

## Future Enhancements

- Parse email content to automatically extract order information
- Mark emails as "received" or "processed" 
- Bulk actions for multiple items
- Export functionality
- Real-time notifications when new emails arrive
- Integration with existing frame/brand data from calculator

## Testing

The page gracefully handles:
- Empty states (no emails or inventory)
- Loading states with spinners
- Error states with retry functionality
- Backend connection failures
- Large datasets with efficient filtering

## File Structure

```
src/
├── pages/Inventory.tsx          # Main inventory page
├── services/api.ts              # API service layer
└── components/layout/Sidebar.tsx # Updated navigation

server/
├── routes/inventory.js          # Inventory API endpoints
├── routes/webhook.js            # Email webhook endpoints
├── db/database.js               # JSON file operations
└── data/                        # JSON data storage
    ├── emails.json
    ├── inventory.json
    └── accounts.json
```