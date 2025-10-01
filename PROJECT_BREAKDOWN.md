# Opti-Profit Version 1 - Project Breakdown

## 📋 Project Overview

**Opti-Profit** is an inventory management system for optical/eyewear businesses that automatically processes vendor order confirmation emails, extracts product data, and manages inventory tracking.

### Core Functionality
- **Email Processing**: Receives vendor order confirmation emails via webhook
- **Automatic Parsing**: Extracts order details, items, and brand information
- **Inventory Management**: Tracks frames from order to sale
- **Multi-Vendor Support**: Modern Optical, Safilo, Luxottica, and more

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion v12.16.0
- **Notifications**: React Hot Toast v2.5.2
- **Icons**: Lucide React
- **Authentication**: Supabase Auth
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js with Express
- **Database**: Supabase (PostgreSQL)
- **Email Processing**: CloudMailin webhook integration
- **API**: RESTful endpoints
- **File Storage**: JSON files (legacy) + Supabase

### External Services
- **Supabase**: PostgreSQL database, authentication, real-time features
- **CloudMailin**: Email webhook receiver
- **Vendor APIs**: Safilo (for product enrichment)

---

## 📁 Project Structure

```
Version1/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── ui/                  # Reusable UI components (Button, Card, ConfirmDialog)
│   │   ├── auth/                # Auth components (Login, SignUp, ProtectedRoute)
│   │   ├── brands/              # Brand management components
│   │   ├── features/            # Feature showcase components
│   │   ├── layout/              # Layout components (Header, Footer, Sidebar)
│   │   └── demo/                # Demo overlay components
│   ├── pages/                   # Page components
│   │   ├── Inventory.tsx        # Main inventory management page
│   │   ├── Dashboard.tsx        # User dashboard
│   │   ├── BrandsCostsPage.tsx  # Brand/vendor cost management
│   │   ├── Auth.tsx             # Authentication page
│   │   └── ...
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── DemoContext.tsx      # Demo mode state
│   ├── services/                # API services
│   │   └── api.ts               # API request functions
│   └── types/                   # TypeScript type definitions
│
├── server/                      # Backend source code
│   ├── routes/                  # Express route handlers
│   │   ├── emails.js           # Email CRUD operations
│   │   ├── webhook.js          # CloudMailin webhook handler
│   │   ├── inventory.js        # Inventory management
│   │   ├── orders.js           # Order management
│   │   └── safilo.js           # Safilo vendor integration
│   ├── lib/                    # Shared libraries
│   │   └── supabase.js        # Supabase client & operations
│   ├── parsers/               # Email parsing logic
│   │   ├── index.js           # Main parser coordinator
│   │   ├── modernopticalparser.js  # Modern Optical parser
│   │   └── ...
│   ├── db/                    # Database utilities
│   │   └── database.js        # Legacy JSON database functions
│   └── server.js              # Express server entry point
│
├── public/                    # Static assets
├── dist/                      # Production build output
└── Configuration Files
    ├── package.json           # Dependencies and scripts
    ├── vite.config.ts        # Vite configuration
    ├── tailwind.config.js    # Tailwind CSS config
    ├── tsconfig.json         # TypeScript config
    └── .env.local            # Environment variables
```

---

## 🗄️ Database Schema (Supabase PostgreSQL)

### Tables

#### `accounts`
- User/business accounts
- Fields: `id` (UUID), `name`, `email`, `business_name`, `subscription_tier`, `status`

#### `emails`
- Vendor order confirmation emails
- Fields: `id` (UUID), `account_id`, `vendor_id`, `from_email`, `subject`, `parse_status`, `parsed_data` (JSONB)
- **Key Field**: `processed_at` - when email was received/scanned

#### `inventory`
- Individual frame/product items
- Fields: `id` (UUID), `account_id`, `email_id`, `order_id`, `sku`, `brand`, `model`, `color`, `size`, `quantity`, `status`
- Status values: `pending`, `confirmed`, `in_stock`, `sold`, `returned`

#### `orders`
- Order records extracted from emails
- Fields: `id` (UUID), `account_id`, `email_id`, `order_number`, `customer_name`, `total_pieces`, `status`

#### `vendors`
- Vendor/supplier information
- Fields: `id` (UUID), `name`, `domain`, `email_patterns` (JSONB), `parser_service`

#### `brands`
- Eyewear brand information
- Fields: `id` (UUID), `name`, `vendor_id`, `tier`, `wholesale_cost`, `msrp`

#### `account_brands`
- Negotiated pricing per account/brand
- Fields: `id` (UUID), `account_id`, `brand_id`, `discount_percentage`, `payment_terms`

---

## 🔄 Email Processing Workflow

### 1. Email Reception
```
CloudMailin → POST /api/webhook → server/routes/webhook.js
```

### 2. Email Storage
- Raw email data stored in `emails` table
- Fields populated: `from_email`, `subject`, `raw_data`, `processed_at`
- Initial `parse_status`: `'pending'`

### 3. Vendor Detection
- Checks sender email domain against `vendors` table
- Matches email pattern to determine vendor
- Examples:
  - `@modernoptical.com` → Modern Optical
  - `@safilo.com` → Safilo

### 4. Email Parsing
- Routes to appropriate parser based on vendor
- Parsers extract:
  - Order number
  - Customer information
  - Line items (SKU, brand, model, color, size, quantity)
  - Brands list

### 5. Data Transformation
- Creates inventory items with `status: 'pending'`
- Normalizes color names, sizes
- Generates SKUs if missing
- Updates `parse_status` to `'parsed'`

### 6. Database Updates
```javascript
// Updates email record
updateEmailWithParsedData(emailId, parsedData)

// Creates inventory items
saveInventoryItems([{
  account_id,
  email_id,
  sku,
  brand,
  model,
  color,
  size,
  quantity,
  status: 'pending'
}])
```

---

## 🔌 API Endpoints

### Email Endpoints (`/api/emails`)
- `GET /:userId` - Fetch all emails for user
- `DELETE /:userId/:emailId` - Delete email (UUID validation required)

### Inventory Endpoints (`/api/inventory`)
- `GET /:userId` - Get inventory items
- `POST /:userId/:itemId/confirm` - Confirm pending order
- `DELETE /:userId/:itemId` - Delete inventory item
- `POST /:userId/:itemId/archive` - Archive item
- `POST /:userId/:itemId/restore` - Restore archived item
- `POST /:userId/:itemId/mark-sold` - Mark as sold

### Order Endpoints (`/api/orders`)
- `GET /:userId` - Get orders
- `POST /:userId/:orderId/archive` - Archive order
- `DELETE /:userId/:orderId` - Delete order

### Webhook Endpoint
- `POST /api/webhook` - CloudMailin email receiver

---

## 🎨 Frontend Architecture

### Main Pages

#### **Inventory Page** (`src/pages/Inventory.tsx`)
- **Tabs**: Emails, Pending, Current, Orders, Archive, Sold
- **Email Section**: Lists parsed order confirmation emails
- **Pending Section**: Items awaiting confirmation
- **Current Section**: Confirmed inventory in stock
- **Features**:
  - Search/filter by vendor, brand
  - Delete emails/items with animated confirmation dialog
  - View order details modal
  - Confirm pending orders
  - Archive/restore items
  - Mark items as sold

#### **Dashboard** (`src/pages/Dashboard.tsx`)
- User overview and analytics

#### **Brands & Costs** (`src/pages/BrandsCostsPage.tsx`)
- Manage vendor relationships
- Set negotiated pricing

### Key Components

#### **ConfirmDialog** (`src/components/ui/ConfirmDialog.tsx`)
- Custom animated confirmation modal
- Replaces browser `confirm()`
- Framer Motion slide-up animation
- Backdrop blur effect
- Variants: `danger`, `warning`, `info`

#### **Animation System**
- Uses Framer Motion for all animations
- Row animations: `initial`, `animate`, `exit` states
- Delete animations: slide-out + fade + height collapse
- Button micro-interactions: scale on hover/tap
- Stagger effect on list items

---

## 🔐 Authentication Flow

### Supabase Auth Integration
```typescript
// AuthContext.tsx
const { user, session } = useAuth()

// Protected routes
<ProtectedRoute>
  <Inventory />
</ProtectedRoute>
```

### User Session
- JWT stored in localStorage
- Session refresh handled by Supabase
- User ID passed to all API calls

---

## 🐛 Known Issues & Recent Fixes

### ✅ Recently Fixed

1. **Delete Email Validation Error**
   - Issue: Backend expected UUID but received integers (0, 1, 2)
   - Fix: Added UUID validation in `server/routes/emails.js`
   - Debug logging added to track incoming IDs

2. **Full Name Column Error**
   - Issue: Trying to insert `full_name` into inventory table (column doesn't exist)
   - Fix: Removed `full_name` from all parsers and save functions
   - `full_name` was concatenation of `brand + model` (redundant)

3. **Browser Confirm Dialog**
   - Issue: Native browser alert was jarring UX
   - Fix: Replaced with custom animated `ConfirmDialog` component
   - Added toast notifications for success/error

### 🔄 Current Architecture Patterns

#### Error Handling
```typescript
try {
  await deleteEmail(emailId);
  toast.success('Email deleted successfully');
  await loadData();
} catch (err) {
  toast.error(err.message || 'Failed to delete');
}
```

#### State Management
- React useState for local state
- Context API for global state (Auth)
- No Redux/Zustand (simple enough without)

---

## 🚀 Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Environment variables (.env.local)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Running Locally
```bash
# Frontend dev server (Vite)
npm run dev              # http://localhost:5173

# Backend server
node server/server.js    # http://localhost:3001
```

### Build & Deploy
```bash
npm run build           # Outputs to /dist
```

---

## 📊 Data Flow Diagrams

### Email to Inventory Flow
```
CloudMailin Email
    ↓
Webhook Endpoint
    ↓
Store Raw Email (emails table)
    ↓
Detect Vendor (check domain)
    ↓
Route to Parser (modernopticalparser.js, etc.)
    ↓
Extract Order Data (order number, customer, items)
    ↓
Update Email (parse_status: 'parsed', parsed_data)
    ↓
Create Inventory Items (status: 'pending')
    ↓
Frontend Displays in "Emails" Tab
    ↓
User Confirms Order
    ↓
Status Changes to 'confirmed'
    ↓
Appears in "Current" Inventory
```

### Delete Flow (After Recent Updates)
```
User Clicks Delete Button
    ↓
ConfirmDialog Slides Up (Framer Motion)
    ↓
User Confirms
    ↓
Row Slides Out & Fades (AnimatePresence)
    ↓
API DELETE Request (with UUID)
    ↓
Database Record Deleted
    ↓
Row Collapses (height: 0)
    ↓
Toast Notification (success/error)
```

---

## 🔧 Environment Variables

### Frontend (.env.local)
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_API_URL=http://localhost:3001
```

### Backend (server/.env)
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...
PORT=3001
```

---

## 📝 Recent Code Changes Summary

### Files Modified (Latest Session)
1. **Created**: `src/components/ui/ConfirmDialog.tsx`
   - Custom animated confirmation dialog
   - Replaces browser confirm()

2. **Modified**: `src/pages/Inventory.tsx`
   - Added Framer Motion animations
   - Integrated ConfirmDialog
   - Added toast notifications
   - Wrapped table rows in `<motion.tr>` with exit animations
   - Changed header "Received" → "Email Received"

3. **Fixed**: `server/routes/webhook.js`
   - Removed `full_name` field from inventory items (line 323)

4. **Fixed**: `server/db/database.js`
   - Removed `full_name` field from saveInventoryItems (line 270)

5. **Fixed**: `server/routes/safilo.js`
   - Removed `full_name` from Safilo parser (line 69)

6. **Fixed**: `server/parsers/index.js`
   - Removed `full_name` from parser (line 140)

7. **Fixed**: `server/parsers/modernopticalparser.js`
   - Removed `full_name` from Modern Optical parser (3 locations)

8. **Debug Added**: `server/routes/emails.js`
   - Added console.log at line 30-36 to debug DELETE requests

---

## 🎯 Key Business Logic

### Inventory Status Lifecycle
```
pending → confirmed → in_stock → sold
                  ↓
              archived (can restore)
```

### Vendor-Specific Parsers
Each vendor has different email formats:
- **Modern Optical**: Table-based HTML emails
- **Safilo**: Structured with account numbers
- Each parser normalizes data to common format

### Pricing Calculation
- Base wholesale cost (from brands table)
- Account-specific discount (from account_brands table)
- MSRP and MAP pricing
- Profit margin calculations

---

## 🔍 Debugging Tips

### Common Issues

1. **UUID vs Integer IDs**
   - Always use string UUIDs for email/inventory IDs
   - Check `email.id` is UUID, not array index

2. **Parse Status**
   - Check `parse_status` field: `pending`, `parsed`, `failed`
   - View `error_message` field for parsing failures

3. **Missing Fields**
   - Schema doesn't have `full_name` column
   - Use `brand + model` separately, not concatenated

4. **Toast Not Showing**
   - Ensure `<Toaster />` is in App.tsx
   - Import: `import toast from 'react-hot-toast'`

### Debug Endpoints
```bash
# Check email structure
GET /api/emails/:userId

# View raw parsed data
SELECT parsed_data FROM emails WHERE id = 'xxx';
```

---

## 📚 Dependencies Reference

### Core Frontend
- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `typescript`: ^5.5.3
- `vite`: ^5.3.1

### UI & Animations
- `framer-motion`: ^12.16.0
- `react-hot-toast`: ^2.5.2
- `lucide-react`: ^0.436.0
- `tailwindcss`: ^3.4.4

### Backend
- `express`: ^4.19.2
- `@supabase/supabase-js`: ^2.45.4
- `cors`: ^2.8.5
- `dotenv`: ^16.4.5

---

## 🎨 Design System

### Colors (Tailwind Config)
- Primary: Blue (buttons, links)
- Success: Green (parsed status, confirmations)
- Warning: Yellow (pending status)
- Danger: Red (delete actions, errors)

### Animations
- Duration: 0.2s - 0.3s (quick micro-interactions)
- Easing: `ease-out` (natural feel)
- Stagger delay: 0.05s per item

### Typography
- Font: Inter (sans-serif)
- Heading: Cal Sans

---

## 🚨 Important Notes for AI Assistant

1. **IDs are UUIDs**: All primary keys in Supabase are UUIDs, not integers
2. **No full_name field**: Inventory table doesn't have this column
3. **parse_status values**: `pending`, `processing`, `parsed`, `failed`, `ignored`
4. **Toast is configured**: Use `toast.success()` and `toast.error()` instead of `setError()`
5. **Framer Motion is installed**: Use for all animations
6. **Email processed_at**: Represents when email was received, not when order was placed

---

## 📞 Contact & Documentation

- **Project Path**: `C:\Users\payto\OneDrive\Desktop\Software\Opti-Profit\Version1`
- **Database**: Supabase PostgreSQL
- **Email Webhook**: CloudMailin
- **Frontend Port**: 5173 (dev)
- **Backend Port**: 3001

---

*Last Updated: 2025-09-30*
*Version: 1.0*
*Status: Active Development*
