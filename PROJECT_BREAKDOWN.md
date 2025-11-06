# OptiProfit Version 1 - Complete Project Breakdown

## 📋 Project Overview

**OptiProfit** is a comprehensive optical business intelligence platform designed for optometrists and optical retailers to maximize frame profitability through automated order processing, inventory management, accurate cost tracking, intelligent pricing calculations, vendor management, and data-driven decision-making.

### Core Value Proposition
- **Automated Order Processing**: Email-to-inventory pipeline with 7 vendor parsers
- **Inventory Management**: Complete lifecycle tracking (pending → current → sold → archived)
- **Profit Optimization**: Calculate exact profit margins per frame with insurance billing support
- **Vendor Management**: Track pricing relationships with 13+ major optical vendors
- **Side-by-Side Comparison**: Compare frames to identify most profitable options
- **Returns Tracking**: Monitor return windows and generate professional PDF reports
- **Analytics Dashboard**: Monitor business performance with key metrics
- **Guided Tutorial**: Interactive demo system for new users

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.5.3
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS 3.4.1
- **Animations**: Framer Motion 12.16.0
- **Notifications**: React Hot Toast 2.5.2
- **Icons**: Lucide React 0.436.0
- **Routing**: React Router DOM 7.6.2
- **State Management**: React Context API (Auth, Demo)
- **Data Queries**: TanStack React Query 5.90.5
- **PDF Generation**: jsPDF 3.0.3

### Backend
- **Runtime**: Node.js with Express 4.18.2
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: RESTful endpoints
- **Security**: Helmet 8.1.0, CORS 2.8.5, Rate Limiting
- **Email Parsing**: Cheerio 1.0.0 (HTML), pdf-parse 1.1.1 (PDF)

### Testing
- **Framework**: Vitest
- **Coverage**: 45/57 tests passing (79% pass rate)

### Deployment
- **Frontend**: Render (Static Site) - https://www.optiprofit.app
- **Backend**: Render (Web Service) - https://optiprofit-backend.onrender.com
- **Database**: Supabase Cloud
- **Email Webhook**: CloudMailin (Active)

---

## 📁 Project Structure

```
Version1/
├── src/                              # Frontend source code
│   ├── features/                     # Feature-based modules
│   │   ├── inventory/
│   │   │   ├── components/           # Inventory components
│   │   │   ├── hooks/                # useInventory, useInventoryManagement
│   │   │   ├── utils/                # Return window, calculations
│   │   │   └── types/                # TypeScript types
│   │   ├── orders/
│   │   │   ├── components/           # Order components
│   │   │   ├── hooks/                # useOrders, useOrderManagement
│   │   │   └── types/                # TypeScript types
│   │   └── reports/
│   │       └── ReturnsPage.tsx       # Returns tracking & PDF reports
│   ├── components/
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Container.tsx
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx    # Auth guard for routes
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx        # App wrapper with sidebar
│   │   │   ├── Sidebar.tsx           # Collapsible navigation
│   │   │   └── Header.tsx            # Top header with scroll effects
│   │   ├── calculator/
│   │   │   ├── ProfitCalculator.tsx  # Single frame calculator
│   │   │   ├── CompareFrames.tsx     # Side-by-side comparison
│   │   │   ├── ProfitDisplay.tsx     # Visual profit results
│   │   │   └── FrameComparisonDisplay.tsx  # Comparison table
│   │   ├── brands/
│   │   │   ├── CompanyCard.tsx       # Vendor company display
│   │   │   ├── AddCompanyModal.tsx   # Add new vendor modal
│   │   │   ├── CompanyDetailsModal.tsx  # Edit company
│   │   │   └── BrandDetailsModal.tsx    # Edit brand details
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx         # Metric display card
│   │   │   ├── RecentOrders.tsx      # Orders table
│   │   │   └── InventoryOverview.tsx # Inventory summary
│   │   ├── demo/
│   │   │   └── DemoOverlay.tsx       # Interactive tutorial (18 steps)
│   │   ├── features/
│   │   │   └── FeatureCard.tsx       # Homepage feature display
│   │   └── ForwardingEmailDisplay.tsx # Show user's unique email
│   ├── pages/
│   │   ├── HomePage.tsx              # Landing page with hero & CTA
│   │   ├── Auth.tsx                  # Login/Register page (full-screen bg)
│   │   ├── CalculatorPage.tsx        # Profit calculator (2 tabs)
│   │   ├── Dashboard.tsx             # Analytics dashboard
│   │   ├── BrandsCostsPage.tsx       # Vendors management
│   │   ├── VendorComparisonPage.tsx  # Vendor database & research
│   │   └── Onboarding.tsx            # New user onboarding
│   ├── contexts/
│   │   ├── AuthContext.tsx           # Authentication state & functions
│   │   └── DemoContext.tsx           # Demo tutorial state (18 steps)
│   ├── services/
│   │   └── api.ts                    # API service functions
│   ├── types/
│   │   └── index.ts                  # TypeScript type definitions
│   ├── lib/
│   │   └── supabase.ts               # Supabase client configuration
│   ├── utils/
│   │   └── calculations.ts           # Profit calculation formulas
│   └── App.tsx                       # Root component with providers
│
├── server/                           # Backend source code
│   ├── routes/
│   │   ├── auth.js                   # Authentication endpoints
│   │   ├── brands.js                 # Brand CRUD operations
│   │   ├── calculations.js           # Profit calculations
│   │   ├── dashboard.js              # Dashboard data endpoints
│   │   ├── emails.js                 # Email operations
│   │   ├── inventory.js              # Inventory CRUD & lifecycle
│   │   ├── orders.js                 # Order management
│   │   ├── vendors.js                # Vendor operations
│   │   ├── webhook.js                # CloudMailin webhook
│   │   ├── safilo.js                 # Safilo processing
│   │   ├── enrich.js                 # Product enrichment APIs
│   │   ├── stats.js                  # Dashboard statistics
│   │   └── health.js                 # Health check endpoint
│   ├── parsers/                      # Vendor-specific email parsers
│   │   ├── SafiloService.js          # PDF parsing + API enrichment
│   │   ├── ModernOpticalService.js   # HTML parsing + web scraping
│   │   ├── IdealOpticsService.js     # HTML parsing + web scraping
│   │   ├── EtniaBarcelonaService.js  # Email parsing
│   │   ├── KenmarkService.js         # Email parsing
│   │   ├── LamyamericaService.js     # Email parsing
│   │   ├── luxotticaParser.js        # Email parsing
│   │   └── index.js                  # Parser registry
│   ├── middleware/
│   │   └── security.js               # Security middleware
│   ├── lib/
│   │   └── supabase.js               # Supabase server operations (2,004 lines)
│   └── index.js                      # Express server entry point
│
├── public/                           # Static assets
│   ├── images/                       # Product images
│   │   ├── hero-ar7-3-modern-saas.png          (7:3 ratio - Homepage)
│   │   ├── login-modern-16-9-saas.png          (16:9 ratio - Login bg)
│   │   └── square-modern-hero-customer-ordering-glasses.png
│   ├── logos/
│   │   └── logo-removebg-preview.png # Transparent logo
│   └── animations/                   # GIF animations
│
├── Configuration Files
│   ├── package.json                  # Dependencies and scripts
│   ├── vite.config.ts               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── tsconfig.json                # TypeScript config
│   ├── vitest.config.js             # Vitest test configuration
│   ├── db_schema.sql                # Database schema (12+ tables)
│   └── .env.local                   # Environment variables
│
└── Documentation
    ├── PROJECT_BREAKDOWN.md          # This file
    ├── SAFILO_INTEGRATION.md         # Safilo parser documentation
    ├── IDEAL_OPTICS_INTEGRATION.md   # Ideal Optics parser docs
    ├── INVENTORY_FEATURE.md          # Inventory feature details
    ├── REFACTORING_COMPLETE.md       # Recent refactoring notes
    └── DEPLOYMENT_GUIDE.md           # Deployment instructions
```

---

## 🎯 Core Features

### 1. Email Processing System (Automated Order Intake)

**Purpose**: Automatically receive, parse, and process vendor order confirmation emails

**Status**: **FULLY OPERATIONAL** - CloudMailin webhook active

**Location**: Backend parsers, viewed in `/frames/inventory` (Emails tab)

**How It Works**:
1. User forwards vendor order confirmation to unique forwarding email
2. CloudMailin webhook receives email → `POST /api/webhook/email`
3. System saves raw email to `emails` table
4. **3-Tier Vendor Detection System**:
   - **Tier 1**: Domain matching (95% confidence) - safilo.com, modernoptical.com, etc.
   - **Tier 2**: Strong body signatures (90% confidence) - email signatures, headers
   - **Tier 3**: Weak patterns (75% confidence) - keywords, requires 2+ matches
5. Vendor-specific parser processes email
6. Creates pending inventory items
7. User reviews and confirms order

**Supported Vendors (7 Parsers)**:

1. **SafiloService.js**
   - Format: PDF attachments
   - Parsing: 18 frame format types supported
   - Enrichment: Safilo public API (UPC, pricing, stock, material)
   - Confidence: 95%+ validation
   - Data: Complete product metadata

2. **ModernOpticalService.js**
   - Format: HTML email with tables
   - Parsing: HTML table extraction
   - Enrichment: Web scraping Modern Optical website
   - Data: UPC, color codes, size, temple, material, stock

3. **IdealOpticsService.js**
   - Format: HTML email
   - Parsing: HTML table extraction
   - Enrichment: Web scraping Ideal Optics website
   - Data: UPC, measurements, gender, material, fit type

4. **EtniaBarcelonaService.js**
   - Format: Email parsing
   - Status: Operational

5. **KenmarkService.js**
   - Format: Email parsing
   - Status: Operational

6. **LamyamericaService.js**
   - Format: Email parsing
   - Status: Operational

7. **luxotticaParser.js**
   - Format: Email parsing
   - Status: Operational

**Features**:
- **Duplicate Detection**: Checks order_number to prevent duplicate processing
- **Confidence Scoring**: Each parsed item has confidence score (75-95%)
- **API Enrichment**: Safilo API provides comprehensive product data
- **Web Scraping**: Modern Optical & Ideal Optics websites for additional data
- **Error Handling**: Failed parses logged in `api_logs` table
- **Manual Review**: All emails viewable in Emails tab before confirmation

**Forwarding Email Display**:
- Component: `ForwardingEmailDisplay.tsx`
- Shows user's unique forwarding email (e.g., `account-123@mail.optiprofit.app`)
- Copy to clipboard functionality
- Appears in Inventory and Orders pages

**Data Flow**:
```
Vendor Email → CloudMailin → Webhook → Vendor Detection →
Parser Selection → PDF/HTML Parsing → API/Web Enrichment →
Pending Items Created → User Reviews → User Confirms → Current Inventory
```

---

### 2. Orders Management System

**Purpose**: Manage vendor orders from pending to confirmed status

**Location**: `/frames/orders` or `/orders`

**Implementation**: `src/features/orders/OrdersPage.tsx`

**Key Features**:

**Two Tabs**:
1. **Pending Orders**: Orders awaiting confirmation
2. **Confirmed Orders**: Completed/processed orders

**Filters & Sorting**:
- Filter by vendor (dropdown)
- Sort by: Date (newest/oldest), Vendor (A-Z)

**Order Display**:
- Order card with header:
  - Order number
  - Vendor name
  - Order date
  - Customer name (if available)
  - Total pieces count
- Expandable details showing all line items:
  - Brand, Model, Color, Size
  - Quantity
  - Item status

**Actions**:
- **Confirm Order** (Pending tab):
  - Moves items from pending → current inventory
  - Triggers web enrichment for Modern Optical/Ideal Optics
  - Creates order record in `orders` table
  - Updates all associated inventory items
- **Archive Order**: Soft delete, keeps data
- **Delete Order**: Permanent deletion
- **View Details**: Expand/collapse order items

**Order Confirmation Workflow**:
```
1. User receives email → Pending items created
2. User views order in Pending Orders tab
3. User clicks "Confirm Order"
4. System enriches data (if Modern Optical/Ideal Optics)
5. Items status: pending → current
6. Order record created
7. Items appear in Current Inventory tab
```

**Backend**:
- Supabase `orders` table
- Endpoint: `POST /api/inventory/:accountId/confirm/:orderNumber`
- Hooks: `useOrders.ts`, `useOrderManagement.ts`

---

### 3. Inventory Management System

**Purpose**: Complete frame inventory lifecycle tracking

**Location**: `/frames/inventory`

**Implementation**: `src/features/inventory/InventoryPage.tsx`

**Status**: **FULLY OPERATIONAL**

**Four Tabs**:

1. **Pending Tab**
   - Items awaiting order confirmation
   - Shows: Brand, Model, Color, Size, Vendor, Order Number
   - Actions: View details (confirmation happens in Orders page)

2. **Current Tab**
   - Active inventory ready to sell
   - Shows: All frame details, Return window days remaining
   - Filters: Vendor, Brand, Color
   - Sort: Newest, Oldest, Return Window, Brand A-Z, Stock Status
   - Actions: Mark as Sold, Archive, Edit, View Details

3. **Sold Tab**
   - Frames that have been sold
   - Shows: Sale date, all frame details
   - Actions: Process Return (moves back to Current), View Details

4. **Archived Tab**
   - Inactive inventory
   - Actions: Restore to Current, Delete, View Details

**Key Features**:

**Return Window Tracking**:
- Calculates days remaining until return window expires
- Return window configurable per brand (vendor sets this)
- Standard: 2 years for high-end frames, 1 year for lower-end
- Visual indicators:
  - Green: 90+ days remaining
  - Yellow: 30-89 days remaining
  - Red: <30 days remaining
- Sortable by return window urgency

**Filters**:
- **Vendor Filter**: Dropdown of all vendors with inventory
- **Brand Filter**: Dropdown of all brands
- **Color Filter**: Dropdown of all colors in stock
- **Sort Options**:
  - Newest First (default)
  - Oldest First
  - Return Window (soonest expiring first)
  - Brand (A-Z)
  - Stock Status

**Manual Entry**:
- **Add Item Modal**: Manually add frames not from email
- Fields: Vendor, Brand, Model, Color, Size, UPC, SKU, Quantity, Notes
- Useful for: Walk-in vendor orders, trade show purchases, samples

**Actions**:
- **Mark as Sold**:
  - Status: current → sold
  - Tracks sale date
  - Moves to Sold tab
- **Archive**:
  - Status: current → archived
  - Removes from active inventory
  - Can be restored later
- **Restore**:
  - Status: archived → current
  - Returns to active inventory
- **Process Return**:
  - Status: sold → current
  - Frame back in stock
  - Can link to return report
- **Delete**: Permanent deletion (admin only)
- **Edit**: Update frame details
- **View Details**: Full frame information modal

**Data Display**:
- Table view with pagination (20 per page)
- Expandable rows for additional details
- Real-time updates via React Query
- Loading states and error handling

**Backend**:
- Supabase `inventory` table
- Status enum: pending, current, sold, archived
- Endpoints:
  - `GET /api/inventory/:accountId`
  - `GET /api/inventory/:accountId/status/:status`
  - `PUT /api/inventory/:accountId/:itemId/sold`
  - `PUT /api/inventory/:accountId/:itemId/archive`
  - `PUT /api/inventory/:accountId/:itemId/restore`
  - `DELETE /api/inventory/:accountId/:itemId`
- Hooks: `useInventory.ts`, `useInventoryManagement.ts`

---

### 4. Returns Tracking System

**Purpose**: Monitor return windows and generate professional return reports

**Location**: `/reports/returns`

**Implementation**: `src/features/reports/ReturnsPage.tsx`

**Key Features**:

**Return Window Monitoring**:
- Calculates days remaining for each frame
- Return window configurable per brand (set in My Vendors)
- Default: 2 years (high-end), 1 year (lower-end)
- User updates return window after consulting vendor/rep
- Visual urgency indicators (green/yellow/red)
- Sortable by return window expiration

**Return Report Generation**:
- **PDF Generation**: Uses jsPDF
- **Report Contents**:
  - Report number (auto-generated)
  - Report date
  - Company branding
  - List of frames to return:
    - Brand, Model, Color, Size
    - UPC/SKU
    - Quantity
    - Return reason
    - Refund amount (if applicable)
  - Total items count
  - Total refund amount
- **Downloadable**: Saves as PDF file
- **Professional formatting**: Ready to send to vendor

**Return Reasons**:
- Defective/Damaged
- Customer Return
- Warranty Claim
- Wrong Item Shipped
- Unsold Inventory
- Other (custom note)

**Return Tracking**:
- Track return date
- Track refund status (pending, approved, received)
- Link to original order
- Notes field for additional details

**Workflow**:
```
1. User views Current Inventory sorted by return window
2. Identifies frames approaching expiration
3. Goes to Returns page
4. Selects frames to return
5. Enters return reasons
6. Generates PDF report
7. Sends report to vendor
8. Tracks refund status
```

**Backend**:
- Supabase tables:
  - `return_reports`: Report metadata
  - `return_report_items`: Individual frames being returned
- Utility: `generateReturnReportPDF.ts`

---

### 5. Profit Calculator (Single Frame)

**Purpose**: Calculate exact profit margins for individual frames with insurance support

**Location**: `/calculator` → Single Profit Calculator tab

**Implementation**: `src/components/calculator/ProfitCalculator.tsx`

**Key Features**:
- **Insurance Toggle**: Switch between insurance billing and cash-pay modes
- **Company Selection**: Dropdown of saved vendors from Supabase
- **Brand Selection**: Auto-populates costs when brand selected (pulls from `account_brands` table)
- **Cost Inputs**:
  - **Discount % Slider**: Adjust discount off wholesale (auto-calculates "Your Cost")
  - **Your Actual Cost**: Manual override (what you pay)
  - **Wholesale Cost**: Frame book price
  - **Tariff Tax**: Import duties (if applicable)
- **Pricing Options**:
  - **Insurance Multiplier**: 1x-4x of wholesale (slider)
  - **Manual Retail Price Override**: Enter exact selling price
- **Insurance Fields** (when enabled):
  - Insurance Provider: VSP, EyeMed, Davis Vision, Spectera, etc.
  - Insurance Plan: Vision Only, Base, Premier, etc.
  - Coverage Amount: How much insurance covers
  - Reimbursement: What insurance pays you
- **Real-Time Calculations**:
  - Patient Payment = (Retail - Coverage) × 0.8 (20% discount in insurance mode)
  - Total Revenue = Patient Payment + Reimbursement
  - Net Profit = Revenue - (Your Cost + Tariff Tax)
  - Profit Margin % = (Profit / Revenue) × 100
- **Save Calculations**: Name and store for future reference (localStorage)
- **Load Saved**: Click to reload previous calculations
- **Print**: Generate printable profit report

**Calculation Logic**:
```javascript
// Insurance Mode
patientPayment = (retailPrice - coverageAmount) * 0.8  // 20% discount
totalRevenue = patientPayment + insuranceReimbursement
netProfit = totalRevenue - (yourCost + tariffTax)
profitMargin = (netProfit / totalRevenue) * 100

// Cash-Pay Mode
patientPayment = retailPrice
netProfit = retailPrice - (yourCost + tariffTax)
profitMargin = (netProfit / retailPrice) * 100
```

**Auto-Population from Vendors**:
- Select Company → Select Brand
- Fields auto-fill from `account_brands` table:
  - Your Cost
  - Wholesale Cost
  - Retail Price (if set)
  - Tariff Tax
- User can override any field for specific transaction

---

### 6. Profit Comparison (Side-by-Side)

**Purpose**: Compare two frames to identify most profitable option

**Location**: `/calculator` → Profit Comparison tab

**Implementation**: `src/components/calculator/CompareFrames.tsx`

**Key Features**:
- **Dual Input Forms**: Complete frame details for Frame 1 and Frame 2
- **Insurance Toggle**: Each frame can have insurance mode on/off independently
- **Company/Brand Selection**: Auto-population for both frames
- **Visual Comparison Table**:
  - Color-coded columns (Blue = Frame 1, Green = Frame 2)
  - Winner highlighting (yellow background)
  - Metric | Frame 1 | Frame 2 layout
- **Compared Metrics**:
  - Your Actual Cost
  - Wholesale Price
  - Discount from Wholesale (%)
  - Retail Price
  - Patient Payment
  - Insurance Reimbursement (if applicable)
  - Total Revenue
  - **Net Profit** (bold, winner highlighted)
  - **Profit Margin %** (bold, winner highlighted)
- **Winner Indicator**: "Frame 1 is more profitable by $X (Y% higher margin)"
- **Recommendation Section**: Explains which frame to choose and why
- **Save Comparisons**: Store for future reference (localStorage)
- **Load Saved**: Retrieve previous comparisons

**Use Cases**:
- Choosing between two similar frames
- Vendor negotiation decisions
- Insurance vs cash-pay comparison for same frame
- Frame portfolio optimization
- Evaluating new vendor vs existing vendor

---

### 7. Vendors Management (My Vendors)

**Purpose**: Centralized vendor/brand relationship and pricing management

**Location**: `/brands` (My Vendors in sidebar)

**Implementation**: `src/pages/BrandsCostsPage.tsx`

**Status**: **FULLY OPERATIONAL** with Supabase integration

**Key Features**:
- **Company Management**:
  - Add new vendor companies (Luxottica, Safilo, Modern Optical, etc.)
  - Edit company details
  - Delete companies (soft delete with confirmation)
  - Search companies (name search)
  - Pagination (6 companies per page)
- **Brand Management** (per company):
  - Add multiple brands to each company
  - Edit brand details
  - Delete brands
  - View brand list with expand/collapse
- **Cost Tracking** (per brand):
  - **Wholesale Cost**: Frame book price (vendor's published price)
  - **Your Cost**: Negotiated price (what you actually pay)
  - **Retail Price**: MSRP or your selling price
  - **Tariff Tax**: Import duties (if applicable)
  - **Return Window**: Days allowed for returns (vendor-specific, brand-specific)
  - **Discount %**: Auto-calculated: `((Wholesale - Your Cost) / Wholesale) × 100`
  - **Notes**: Free-form notes about brand
- **Contact Information**:
  - Company Email
  - Company Phone
  - Support Email
  - Support Phone
  - Website
  - Rep Name
  - Rep Email
  - Rep Phone
- **Data Storage**: Supabase database
  - `vendors` table: Global vendor companies
  - `brands` table: Frame brands (global)
  - `account_brands` table: Account-specific pricing and relationships
  - `account_vendors` table: Account-vendor relationships with contact info
- **Data Structure**:
```typescript
// account_brands table
{
  account_id: uuid,
  brand_id: uuid,
  vendor_id: uuid,
  wholesale_cost: decimal,
  your_cost: decimal,
  retail_price: decimal,
  tariff_tax: decimal,
  return_window_days: integer,
  notes: text,
  created_at: timestamp
}
```

**Modals**:
1. **AddCompanyModal**: Multi-step form to add company + brands
2. **CompanyDetailsModal**: Edit company info and manage brands
3. **BrandDetailsModal**: Edit individual brand pricing/notes

**Return Window Configuration**:
- User asks vendor/rep about return window (e.g., "2 years for premium frames")
- User enters return window days in brand settings
- System uses this for return window tracking in Inventory
- Can be updated anytime as vendor policies change

**Integration with Calculator**:
- Calculator pulls pricing from `account_brands` table
- Auto-populates when user selects Company → Brand
- Ensures consistent pricing across application

---

### 8. Vendor Comparison Database

**Purpose**: Research and compare 13+ major optical vendors

**Location**: `/vendor-comparison`

**Implementation**: `src/pages/VendorComparisonPage.tsx`

**Data Source**: Supabase `vendors` table (pre-populated)

**Vendor Database** (Real Market Data):

**Ultra-Premium Segment**:
- **Kering Eyewear**: Gucci, Saint Laurent, Cartier, Balenciaga, Bottega Veneta
  - Discount: 50-55% off retail
  - Min Order: $5,000
  - Terms: NET 30
  - Buying Group: EPON, Vision West

**Premium Segment**:
- **Luxottica**: Ray-Ban, Oakley, Versace, Prada, Dolce & Gabbana, etc.
  - Discount: 40-50% off retail
  - Min Order: $2,500
  - Terms: NET 30
  - Free Shipping: Yes

- **Safilo**: Carrera, Kate Spade, Tommy Hilfiger, Polaroid, etc.
  - Discount: 40-50% off retail
  - Min Order: $2,000
  - Terms: NET 30
  - Free Shipping: Yes

- **Marchon**: Calvin Klein, Nike, Salvatore Ferragamo, etc.
  - Discount: 42-48% off retail
  - Min Order: $2,000

- **Marcolin**: Tom Ford, Guess, adidas Originals, etc.
  - Discount: 40-48% off retail
  - Min Order: $1,800

**Mid-Tier Segment**:
- **ClearVision**: Stetson, Woolrich, Guess, Jessica McClintock, etc.
  - Discount: 35-45% off retail
  - Min Order: $1,000
  - Buying Group: Alliance, Vision West

- **Europa Eyewear**: Escada, Balmain, Canali, etc.
  - Discount: 38-45% off retail
  - Min Order: $1,500

- **McGee Group**: Brooks Brothers, Cole Haan, Draper James, etc.
  - Discount: 35-45% off retail
  - Min Order: $1,200

- **Modern Optical**: Private label and value brands
  - Discount: 40-50% off retail
  - Min Order: $750
  - Free Shipping: Yes

**Value Segment**:
- **FGX International**: Foster Grant, Magnivision, Corinne McCormack, etc.
  - Discount: 30-40% off retail
  - Min Order: $500

- **A&A Optical**: Value frames and sunglasses
  - Discount: 35-45% off retail
  - Min Order: $600

**Boutique Segment**:
- **Etnia Barcelona**: Independent fashion eyewear
  - Discount: 50% off retail
  - Min Order: $1,500
  - Terms: NET 30

- **Theo Eyewear**: Belgian avant-garde designs
  - Discount: 50% off retail
  - Min Order: $2,000
  - Terms: NET 30

**Features**:
- Filter by segment (Ultra-Premium, Premium, Mid-Tier, Value, Boutique)
- Sort by name, segment, minimum order
- Selection/star feature for comparison
- Detailed vendor cards with all pricing info
- Market insights banner with industry averages
- Buying group affiliations shown
- One-click add to "My Vendors"

---

### 9. Analytics Dashboard

**Purpose**: Monitor business performance and key metrics

**Location**: `/dashboard`

**Implementation**: `src/pages/Dashboard.tsx`

**Metrics Cards** (4 stats):
1. **Total Inventory Value**: Dollar value of all current inventory
   - Calculated from: Sum of (retail price × quantity) for all current items
   - Trend indicator (% change)
2. **Total Items**: Count of frames in current inventory
   - Status: current only
   - Trend indicator
3. **Pending Items**: Count of frames awaiting confirmation
   - Status: pending
   - Trend indicator
4. **Total Orders**: Count of confirmed orders
   - All time order count
   - Trend indicator

**Sections**:
- **Missing Prices Alert**:
  - Shows items without pricing data
  - Links to edit/add pricing
- **Vendor Inventory Breakdown**:
  - Expandable cards per vendor
  - Shows: Brand breakdown, item counts, total value
  - Sorting options
  - Pagination
- **Real-Time Data**:
  - React Query with auto-refresh
  - Supabase realtime subscriptions

**Data Source**:
- Backend endpoints:
  - `GET /api/stats/:accountId` - Dashboard statistics
  - `GET /api/stats/:accountId/vendors` - Vendor breakdown
- Calculations:
  - Total inventory value = Sum of retail prices
  - Item counts by status
  - Order counts

---

### 10. Authentication System

**Purpose**: Secure access control

**Location**: `/auth` route (Login/Register page)

**Implementation**: `src/contexts/AuthContext.tsx`

**Design**:
- Full-screen background image (login-modern-16-9-saas.png)
- Faded overlay (60% black with blur)
- Centered login form with glassmorphism (bg-white/95)
- Toggle between Login and Register modes

**Features**:
- Email/password authentication
- First Name / Last Name fields (Register)
- Confirm Password validation (Register)
- Password visibility toggle (eye icon)
- Form validation with error messages
- Session persistence via Supabase Auth
- Protected routes via ProtectedRoute component
- Logout functionality (clears session)

**Auth Context** (`AuthContext.tsx`):
- `signIn(email, password)`: Login user
- `signUp(email, password, metadata)`: Register new user
- `signOut()`: Logout and clear session
- `user`: Current user object
- `session`: Current session token
- `loading`: Auth check in progress
- `isAuthenticated`: Boolean auth status

**Protected Routes**:
All routes wrapped in `<ProtectedRoute>` except `/auth`
- Checks `isAuthenticated` status
- Redirects to Auth page if not logged in
- Shows loading spinner during auth check

**Account Creation**:
- Users create their own accounts (no demo accounts)
- Account ID auto-generated (UUID)
- Forwarding email auto-generated: `account-{id}@mail.optiprofit.app`

---

### 11. Interactive Demo System

**Purpose**: Guided tutorial for new users following real operational workflow

**Status**: **REDESIGNED** - Interactive, user-driven experience

**Components**:
- **DemoContext.tsx**: State management (18 steps)
- **DemoOverlay.tsx**: Visual overlay with tooltip

**Approach**:
- **User actually USES the software** during demo (not automated playback)
- Pre-populated demo data (Modern Optical vendor)
- Temporary demo data (removed after demo ends)
- Real interactions: user clicks, selects, types
- Follows actual operational workflow

**Demo Steps** (18 total):

**Email Processing Workflow**:
1. **Welcome** (Home): Introduction to OptiProfit
2. **Inventory Intro** (/frames/inventory): Overview of inventory system
3. **Emails Tab** (/frames/inventory): Show received vendor email
4. **Review Email** (/frames/inventory): Parse details and extracted data
5. **Pending Tab** (/frames/inventory): Items awaiting confirmation
6. **Orders Page** (/frames/orders): Navigate to pending orders
7. **Confirm Order** (/frames/orders): Confirm order workflow
8. **Current Inventory** (/frames/inventory): View confirmed items
9. **Sold Tab** (/frames/inventory): Mark item as sold demo
10. **Returns Tracking** (/reports/returns): Return window monitoring

**Vendor & Calculator Workflow**:
11. **My Vendors Intro** (/brands): Navigate to vendor management
12. **Import Vendor** (/brands): Add Modern Optical
13. **Add Brand Pricing** (/brands): Enter pricing data
14. **Calculator Intro** (/calculator): Navigate to profit calculator
15. **Select Vendor/Brand** (/calculator): Auto-population demo
16. **Calculate Profit** (/calculator): View profit results
17. **Comparison Tab** (/calculator): Side-by-side comparison
18. **Completion** (/calculator): Demo finished

**Features**:
- Dark overlay (bg-black/60) with spotlight
- Tooltip with smart positioning (top, bottom, left, right, center)
- Progress bar (X% complete)
- Navigation controls: Previous, Next, Skip Demo, Finish
- Keyboard shortcuts:
  - Arrow keys: Navigate
  - Space: Next step
  - Escape: Skip demo
- Auto-scroll to highlighted elements
- `data-demo` attributes for element targeting
- Auto-routing between pages
- Tab switching (Calculator tabs, Inventory tabs)

**Demo Data** (Modern Optical):
```javascript
// Vendor
{
  name: "Modern Optical",
  email: "info@modernoptical.com",
  phone: "1-800-555-0123"
}

// Brand with pricing
{
  name: "Modern Optics Collection",
  wholesale_cost: 85,
  your_cost: 55,
  retail_price: 150,
  tariff_tax: 3,
  return_window_days: 365
}

// Sample email
{
  subject: "Order Confirmation #MO-2024-1234",
  vendor: "Modern Optical",
  order_number: "MO-2024-1234"
}

// Sample inventory items
{
  brand: "Modern Optics Collection",
  model: "MO-5501",
  color: "Black/Gold",
  size: "52-18-140",
  quantity: 2,
  status: "pending"
}
```

**Trigger**: "Watch Demo" button on homepage or first-time user prompt

**Data Cleanup**:
- All demo data removed when demo ends
- Demo flag cleared
- User starts with clean slate

---

## 📧 Complete Operational Workflow (Email → Inventory → Returns → Calculator)

### Overview

This is the **actual day-to-day workflow** that optical retailers use OptiProfit for - processing vendor order confirmations, managing inventory, tracking returns, importing vendor pricing, and calculating profitability.

**Status**: **FULLY OPERATIONAL** - All steps working with real data

---

### Step-by-Step Operational Flow

#### 1. **Vendor Sends Order Confirmation Email**

When you place an order with a vendor (Safilo, Modern Optical, etc.), they email you an order confirmation.

**What happens**:
- Vendor sends email to your business email
- You forward it to your unique OptiProfit address (e.g., `account-123@mail.optiprofit.app`)
- CloudMailin webhook receives email
- System posts to: `POST /api/webhook/email`
- Email saved to `emails` table
- Email appears in **Inventory → Emails Tab**

**Email Detection (3-Tier System)**:
- **Tier 1**: Domain matching (95% confidence)
  - safilo.com, modernoptical.com, idealoptics.com, etc.
- **Tier 2**: Strong body signatures (90% confidence)
  - Email signatures, headers, order confirmation patterns
- **Tier 3**: Weak patterns (75% confidence, requires 2+ matches)
  - Keywords: "order confirmation", vendor names, account numbers

---

#### 2. **System Parses Email & Extracts Order Data**

OptiProfit automatically processes the email using vendor-specific parsers.

**Safilo Orders** (PDF Attachments):
- Parses PDF to extract order header (account #, order #, customer)
- Extracts frame line items (brand, model, color, size, quantity)
- **18 frame formats supported** with 95%+ validation
- Queries Safilo public API for enrichment:
  - UPC/EAN codes
  - Wholesale price
  - MSRP
  - Stock status
  - Material & origin
  - Frame measurements
- Validates data with confidence scoring
- No API keys needed (uses public APIs)

**Modern Optical Orders** (HTML Email):
- Parses HTML tables to extract line items
- Extracts account number, order number, rep name
- Creates pending items
- **Web scraping enrichment** (on confirmation):
  - Scrapes Modern Optical website
  - Matches variants by color
  - Enriches with: UPC, color codes, full size, temple, stock, material

**Ideal Optics Orders** (HTML Email):
- Parses HTML email with table extraction
- Extracts order details and line items
- **Web scraping enrichment**:
  - Scrapes Ideal Optics website
  - Enriches with: UPC, measurements, gender, material, fit type

**Other Vendors** (Etnia Barcelona, Kenmark, Lamyamerica, Luxottica):
- Email parsing for order details
- Line item extraction
- Basic data creation

**Duplicate Detection**:
- Checks if order_number already exists in database
- Prevents duplicate inventory creation
- Flags email with `duplicate_order: true`
- Shows warning to user

**Result**: Creates inventory items with **status: 'pending'**

---

#### 3. **Review Email in Emails Tab**

Navigate to **Inventory → Emails Tab**

**What you see**:
- List of all received vendor emails
- Columns: Sender, Subject, Date, Parse Status, Vendor Detected
- Parse confidence score (75-95%)
- Click email to view:
  - Raw email content
  - Parsed order details
  - Extracted line items
  - Vendor detected
  - Confidence score
  - Any parsing errors or warnings

**Actions**:
- Delete email if it's spam/irrelevant
- View parsed data to verify accuracy
- See which orders are pending confirmation
- Check for duplicate orders

---

#### 4. **Review Pending Orders**

Navigate to **Inventory → Pending Tab** or **Orders → Pending Orders Tab**

**What you see**:
- All items with `status: 'pending'`
- Grouped by order_number
- Shows: Brand, Model, Color, Size, Quantity, Vendor
- Order metadata: Order date, customer name, total pieces

**What this means**:
- These are frames you ordered that haven't been confirmed yet
- Items are waiting for you to verify and confirm
- Not yet in active inventory
- No return window tracking yet

---

#### 5. **Confirm Order**

Navigate to **Orders → Pending Orders Tab**

Click **"Confirm Order"** button next to order

**What happens** (`POST /api/inventory/:accountId/confirm/:orderNumber`):

1. **Finds all pending items** for that order_number
2. **Web Enrichment** (Modern Optical & Ideal Optics only):
   - Scrapes vendor website
   - Groups by unique frame (brand + model)
   - Matches variants by color
   - Enriches with: UPC, color codes, full size, temple, stock, material, measurements
3. **Updates inventory items**:
   - Changes status: `pending` → `current`
   - Merges enriched data
   - Updates timestamps
   - Sets return window start date
4. **Creates order record** in `orders` table
5. **Logs confirmation** with item count in `api_logs`

**Result**: Items move to **Current Inventory** tab with return window tracking active

---

#### 6. **View Current Inventory**

Navigate to **Inventory → Current Tab**

**What you see**:
- All items with `status: 'current'`
- Your active inventory ready to sell
- Columns:
  - Brand, Model, Color, Size
  - UPC, SKU
  - Vendor
  - Return Window (days remaining)
  - Quantity
  - Actions
- **Filters**: Vendor, Brand, Color
- **Sort Options**:
  - Newest First
  - Oldest First
  - **Return Window** (soonest expiring first)
  - Brand A-Z
  - Stock Status

**Return Window Display**:
- Green: 90+ days remaining
- Yellow: 30-89 days remaining
- Red: <30 days remaining
- "X days remaining" text

**Actions**:
- **Mark as Sold**: When frame is sold (status → `sold`)
- **Archive**: Remove from active inventory (status → `archived`)
- **Edit**: Update item details
- **View Details**: Full frame information modal

---

#### 7. **Monitor Return Windows**

Navigate to **Inventory → Current Tab**

**Sort by Return Window**:
- Click "Sort" dropdown → "Return Window"
- Items sorted by days remaining (soonest first)
- Identify frames approaching return deadline

**Return Window Tracking**:
- Calculated from confirmation date + brand's return window days
- Return window days set in **My Vendors** for each brand
- User asks vendor/rep: "What's your return policy?"
- Vendor responds: "2 years for premium, 1 year for value"
- User updates return window in brand settings
- System tracks automatically

**Visual Indicators**:
- Red highlight: <30 days remaining (urgent)
- Yellow highlight: 30-89 days remaining (plan ahead)
- Green: 90+ days remaining (safe)

---

#### 8. **Generate Return Report**

Navigate to **Reports → Returns**

**Process**:
1. Review frames approaching return window expiration
2. Select frames to return
3. Enter return reasons for each:
   - Defective/Damaged
   - Customer Return
   - Warranty Claim
   - Wrong Item Shipped
   - Unsold Inventory
   - Other (custom note)
4. Enter refund amounts (if known)
5. Click **"Generate Return Report"**

**What happens**:
- System creates return report record
- Auto-generates report number (e.g., RR-2024-0001)
- Uses jsPDF to create professional PDF:
  - Company branding
  - Report number and date
  - Vendor name and contact info
  - Table of frames being returned:
    - Brand, Model, Color, Size
    - UPC/SKU
    - Quantity
    - Return reason
    - Refund amount
  - Total items and total refund
- Downloads PDF
- User sends PDF to vendor
- Track refund status in system

---

#### 9. **Process Returns (if customer returns frame)**

When a customer returns a sold frame:

**Current Process**:
1. Navigate to **Inventory → Sold Tab**
2. Find the sold item
3. Click **"Process Return"**
4. Item status changes: `sold` → `current` (back in stock)
5. Quantity adjusted if needed
6. Can link to return report if returning to vendor

**Full Return Workflow** (for vendor returns):
- Use return report from step 8
- Send to vendor
- Track refund status
- When refund received, mark in system

---

#### 10. **Import Vendor to "My Vendors"**

If the vendor isn't in your vendor list yet, you can import them.

**Process**:

1. Go to **My Vendors** page (`/brands`)
2. Click **"Add Company"**
3. **Enter vendor details**:
   - Company name (e.g., "Modern Optical")
   - Contact info:
     - Company email, phone
     - Support email, phone
     - Website
     - Rep name, email, phone
4. **Add brands** for that vendor
5. Click **"Save Company"**

**Data stored**:
- Supabase `vendors` table (if new vendor)
- `account_vendors` table (account-specific relationship with contact info)

---

#### 11. **Add/Update Vendor Pricing**

In **My Vendors**, maintain accurate pricing for profit calculations.

**For each brand**:
- **Wholesale Cost**: Vendor's published frame book price
- **Your Cost**: What you actually pay (after discounts)
- **Discount %**: Auto-calculated: `((Wholesale - Your Cost) / Wholesale) × 100`
- **Retail Price**: Your selling price (MSRP or custom)
- **Tariff Tax**: Import duties (usually 2-6%)
- **Return Window Days**: Days allowed for returns (ask vendor/rep)
  - Example: 730 days (2 years) for premium frames
  - Example: 365 days (1 year) for value frames

**Example**:
```
Vendor: Modern Optical
Brand: Modern Optics Collection

Wholesale Cost: $85
Your Cost: $55 (35.3% discount)
Retail Price: $150
Tariff Tax: $3
Return Window: 365 days (1 year)
```

**Contact Info**:
- Company email: info@modernoptical.com
- Company phone: 1-800-555-0123
- Rep name: John Smith
- Rep email: jsmith@modernoptical.com
- Rep phone: 1-555-123-4567

**Why track this**:
- Know your true margins
- Compare vendor discounts
- Calculator uses this data automatically
- Track rep relationships
- **Return window tracking** for inventory

**Data stored**:
- `account_brands` table (account-specific pricing)
- Links to global `brands` and `vendors` tables

---

#### 12. **Calculate Profit with Vendor Pricing**

Navigate to **Calculator** page

**Using Your Vendor Data**:

1. **Toggle Insurance** (on/off depending on sale type)
2. **Select Company**: Dropdown shows all your vendors from My Vendors
3. **Select Brand**: Filtered by company, shows brands you've added
4. **Auto-Population**: Fields fill automatically from `account_brands`:
   - Your Cost → $55
   - Wholesale Cost → $85
   - Retail Price → $150 (if manual pricing set)
   - Tariff Tax → $3

**Adjust for This Sale**:
- **Insurance Multiplier**: 1x-4x of wholesale (if insurance mode)
- **Manual Retail**: Override with actual selling price
- **Insurance Details** (if applicable):
  - Provider: VSP, EyeMed, Davis Vision, Spectera
  - Plan: Vision Only, Base, Premier
  - Coverage: How much insurance covers ($80-$120)
  - Reimbursement: What insurance pays you ($57 typical)

**Real-Time Calculation**:

**Insurance Mode**:
```
Patient Payment = (Retail - Coverage) × 0.8   // 20% discount
Total Revenue = Patient Payment + Reimbursement
Total Cost = Your Cost + Tariff Tax
Net Profit = Total Revenue - Total Cost
Profit Margin = (Net Profit / Total Revenue) × 100
```

**Cash-Pay Mode**:
```
Patient Payment = Retail Price
Total Cost = Your Cost + Tariff Tax
Net Profit = Patient Payment - Total Cost
Profit Margin = (Net Profit / Patient Payment) × 100
```

**Example Calculation** (Insurance):
- Retail: $150
- Coverage: $100
- Reimbursement: $57
- Your Cost: $55
- Tariff: $3
- **Patient Pays**: ($150 - $100) × 0.8 = $40
- **Total Revenue**: $40 + $57 = $97
- **Total Cost**: $55 + $3 = $58
- **Net Profit**: $97 - $58 = **$39**
- **Margin**: ($39 / $97) × 100 = **40.2%**

**Save Calculation**:
- Name the calculation (e.g., "Modern Optics MO-5501 - VSP Premier")
- Stored in localStorage
- Reload anytime for reference

---

#### 13. **Compare Frames Side-by-Side**

When choosing between two frames, use **Profit Comparison**

**Process**:
1. Go to **Calculator → Profit Comparison tab**
2. **Frame 1**: Select Company → Brand (auto-populates) or enter manually
3. **Frame 2**: Select Company → Brand (auto-populates) or enter manually
4. Toggle insurance for each frame independently
5. Click **"Compare"**

**Visual Results**:
- Color-coded columns (Blue vs Green)
- Winner highlighted in yellow
- Comparison metrics:
  - Your Cost
  - Wholesale Cost
  - Discount %
  - Retail Price
  - Patient Payment
  - Insurance Reimbursement (if applicable)
  - Total Revenue
  - **Net Profit** (bold, winner highlighted)
  - **Profit Margin** (bold, winner highlighted)
  - Profit difference: "$15 more profitable (12% higher margin)"

**Recommendation**:
- System explains which frame to choose and why
- Considers both profit amount and margin percentage

**Use Cases**:
- Two similar frames from different vendors
- Insurance vs cash-pay for same frame
- Negotiating with vendors (show profit impact)
- Building frame board (choose most profitable options)
- Evaluating new vendor pricing

---

#### 14. **Monitor Performance Dashboard**

Navigate to **Dashboard** to see business metrics

**Metrics Cards**:
1. **Total Inventory Value**: Dollar value of all current inventory (+15% trend)
2. **Total Items**: Number of frames in current inventory (+8% trend)
3. **Pending Items**: Frames awaiting confirmation (-5% trend)
4. **Total Orders**: Count of confirmed orders (+12% trend)

**Sections**:
- **Missing Prices Alert**: Items without pricing (link to add pricing)
- **Vendor Inventory Breakdown**:
  - Expandable cards per vendor
  - Brand breakdown
  - Item counts and total value
  - Sort and pagination
- **Real-Time Updates**: React Query auto-refresh

**Data Source**:
- `GET /api/stats/:accountId` - Dashboard statistics
- `GET /api/stats/:accountId/vendors` - Vendor breakdown
- Supabase realtime subscriptions

---

#### 15. **Research New Vendors**

Navigate to **Vendor Comparison** to research the market

**13+ Pre-loaded Vendors**:
- **Ultra-Premium**: Kering (Gucci, Cartier, Saint Laurent)
- **Premium**: Luxottica, Safilo, Marchon, Marcolin
- **Mid-Tier**: ClearVision, Europa, McGee, Modern Optical
- **Value**: FGX, A&A Optical
- **Boutique**: Etnia Barcelona, Theo Eyewear

**For Each Vendor**:
- Brand portfolio (50+ brands total)
- Discount structure (30-55% off retail)
- Minimum order requirements ($500-$5,000)
- Payment terms (mostly NET 30)
- Free shipping availability
- Buying group affiliations (EPON, Vision West, Alliance)

**Filter & Compare**:
- Filter by segment
- Sort by name, segment, minimum order
- Star/select vendors to compare
- Review market discount averages
- One-click add to My Vendors

**Use Cases**:
- Planning which vendors to work with
- Comparing terms and minimums
- Understanding typical discount ranges
- Finding vendors for specific brands
- Evaluating current vendor competitiveness

---

### Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    VENDOR SENDS ORDER EMAIL                      │
│                  (Safilo, Modern Optical, etc.)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              USER FORWARDS TO OPTIPROFIT EMAIL                   │
│               account-123@mail.optiprofit.app                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CLOUDMALIN WEBHOOK RECEIVES                     │
│                    POST /api/webhook/email                       │
│                  • Saves raw email to emails table               │
│                  • 3-tier vendor detection (75-95% confidence)   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EMAIL PARSING                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  VENDOR-SPECIFIC PARSERS (7 Total)                         │ │
│  │                                                             │ │
│  │  • Safilo: PDF parsing + API enrichment                    │ │
│  │    - 18 frame formats, 95%+ validation                     │ │
│  │    - UPC, pricing, stock, material via public API          │ │
│  │                                                             │ │
│  │  • Modern Optical: HTML parsing + web scraping             │ │
│  │    - Extract tables, order info                            │ │
│  │    - Website scraping for UPC, measurements                │ │
│  │                                                             │ │
│  │  • Ideal Optics: HTML parsing + web scraping               │ │
│  │    - Table extraction, enrichment via website              │ │
│  │                                                             │ │
│  │  • Etnia Barcelona, Kenmark, Lamyamerica, Luxottica        │ │
│  │    - Email parsing, basic data extraction                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DUPLICATE CHECK                              │
│              • Check order_number exists?                        │
│              • If yes: Flag duplicate and stop                   │
│              • If no: Continue to creation                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                CREATE PENDING INVENTORY ITEMS                    │
│              • status: 'pending'                                 │
│              • Saved to inventory table (Supabase)               │
│              • Linked to email_id, order_number                  │
│              • Parse confidence score stored                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              USER REVIEWS IN INVENTORY PAGE                      │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ Emails Tab  │  │ Pending Tab  │  │ Orders Page         │    │
│  │ • View raw  │  │ • Review     │  │ • Pending Orders    │    │
│  │ • Parsed    │  │   items      │  │ • CONFIRM ORDER     │    │
│  │   data      │  │ • Verify     │  │ • Enrichment starts │    │
│  │ • Confidence│  │   accuracy   │  │                     │    │
│  └─────────────┘  └──────────────┘  └─────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER CLICKS "CONFIRM ORDER"                   │
│          POST /api/inventory/:accountId/confirm/:orderNumber     │
│                                                                   │
│  1. Find all pending items for order_number                      │
│  2. Web enrichment (Modern Optical/Ideal Optics only):           │
│     • Scrape website for product data                            │
│     • Group by unique frame (brand + model)                      │
│     • Match variants by color                                    │
│     • Enrich: UPC, measurements, material, stock                 │
│  3. Update status: pending → current                             │
│  4. Set return window start date (confirmation date)             │
│  5. Create order record in orders table                          │
│  6. Log confirmation in api_logs                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ITEMS IN CURRENT INVENTORY                     │
│              • status: 'current'                                 │
│              • Return window tracking active                     │
│              • Available to sell                                 │
│              • Track by SKU/UPC                                  │
│              • Actions: Sell, Archive, Edit, View                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┬──────────────────┐
                    │                 │                  │
                    ▼                 ▼                  ▼
        ┌────────────────┐  ┌──────────────────┐  ┌────────────┐
        │  MARK AS SOLD  │  │  ARCHIVE ITEM    │  │ EDIT ITEM  │
        │  status: sold  │  │  status: archived│  │ Update data│
        └────────┬───────┘  └──────────────────┘  └────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ PROCESS RETURN  │
        │ sold → current  │
        │ Back in stock   │
        └─────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                  PARALLEL: RETURN WINDOW MONITORING              │
│                                                                   │
│  System calculates return window expiration:                     │
│  • Return window start: Order confirmation date                  │
│  • Return window days: From brand settings (My Vendors)          │
│  • Days remaining: (start + window days) - today                 │
│                                                                   │
│  User sorts by return window in Current Inventory:               │
│  • Red: <30 days (urgent)                                        │
│  • Yellow: 30-89 days (plan ahead)                               │
│  • Green: 90+ days (safe)                                        │
│                                                                   │
│  Generate Return Report (/reports/returns):                      │
│  1. Select frames to return                                      │
│  2. Enter return reasons                                         │
│  3. Generate professional PDF (jsPDF)                            │
│  4. Download and send to vendor                                  │
│  5. Track refund status                                          │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                  PARALLEL: VENDOR MANAGEMENT                     │
│                                                                   │
│  User goes to MY VENDORS page (/brands)                          │
│                                                                   │
│  1. Add Company (Luxottica, Safilo, Modern Optical, etc.)        │
│     • Contact info (email, phone, rep)                           │
│     • Saved to vendors & account_vendors tables                  │
│                                                                   │
│  2. Add Brands per company                                       │
│     • Ray-Ban, Oakley, Modern Optics Collection, etc.            │
│     • Saved to brands table (global)                             │
│                                                                   │
│  3. Enter Pricing Data (account-specific)                        │
│     • Wholesale Cost: $85                                        │
│     • Your Cost: $55 (35.3% discount)                            │
│     • Retail Price: $150                                         │
│     • Tariff Tax: $3                                             │
│     • Return Window Days: 365 (ask vendor/rep)                   │
│     • Saved to account_brands table                              │
│                                                                   │
│  Stored in: Supabase (vendors, brands, account_brands tables)    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CALCULATOR USAGE                            │
│                                                                   │
│  User goes to CALCULATOR page (/calculator)                      │
│                                                                   │
│  1. Toggle Insurance On/Off                                      │
│  2. Select Company → Dropdown (from My Vendors)                  │
│  3. Select Brand → Dropdown (filtered by company)                │
│  4. Auto-Population (from account_brands table):                 │
│     • Your Cost: $55                                             │
│     • Wholesale Cost: $85                                        │
│     • Tariff Tax: $3                                             │
│     • Retail Price: $150 (if manual pricing set)                 │
│                                                                   │
│  5. Adjust for This Sale:                                        │
│     • Insurance Multiplier (1x-4x)                               │
│     • Manual retail override                                     │
│     • Insurance details (coverage, reimbursement)                │
│                                                                   │
│  6. REAL-TIME PROFIT CALCULATION                                 │
│     Insurance Mode:                                              │
│       Patient Payment = (Retail - Coverage) × 0.8                │
│       Total Revenue = Patient Payment + Reimbursement            │
│       Net Profit = Total Revenue - (Your Cost + Tariff Tax)      │
│       Profit Margin = (Net Profit / Total Revenue) × 100         │
│                                                                   │
│     Cash-Pay Mode:                                               │
│       Patient Payment = Retail Price                             │
│       Net Profit = Patient Payment - (Your Cost + Tariff Tax)    │
│       Profit Margin = (Net Profit / Patient Payment) × 100       │
│                                                                   │
│  7. Save Calculation (localStorage, optional)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Key Insights

**Fully Automated**:
- ✅ Email reception via CloudMailin webhook (ACTIVE)
- ✅ 3-tier vendor detection (75-95% confidence)
- ✅ Vendor-specific parsing (7 parsers)
- ✅ API/web enrichment for product data (Safilo, Modern Optical, Ideal Optics)
- ✅ Pending inventory creation
- ✅ Duplicate order detection
- ✅ Return window calculations

**Manual (User Actions)**:
- 👤 Forwarding email to OptiProfit address
- 👤 Reviewing parsed data for accuracy
- 👤 Confirming pending orders
- 👤 Adding vendors to "My Vendors"
- 👤 Entering/updating pricing data and return windows
- 👤 Marking items as sold
- 👤 Processing returns
- 👤 Generating return reports
- 👤 Comparing frames for profitability

**The Power of the System**:
1. **Time Savings**: No manual data entry from emails
2. **Accuracy**: API-enriched product data (UPC, pricing) via public APIs
3. **Return Window Tracking**: Never miss vendor return deadlines
4. **Professional Reports**: PDF return reports ready to send
5. **Profitability**: Know exact margins before selling
6. **Centralization**: One place for inventory, vendors, and calculations
7. **Intelligence**: Data-driven frame selection and vendor negotiation

---

## 💾 Data Storage & Database Schema

### Primary Storage: Supabase (PostgreSQL)

**Status**: All data stored in Supabase, NOT localStorage

### Database Tables (12+)

#### 1. `accounts`
**Purpose**: User accounts

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  forwarding_email TEXT UNIQUE, -- account-{id}@mail.optiprofit.app
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `vendors`
**Purpose**: Global vendor companies (Luxottica, Safilo, etc.)

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  segment TEXT, -- Ultra-Premium, Premium, Mid-Tier, Value, Boutique
  discount_min INTEGER, -- 30
  discount_max INTEGER, -- 55
  minimum_order INTEGER, -- 2500
  payment_terms TEXT, -- NET 30
  free_shipping BOOLEAN,
  buying_groups TEXT[], -- ['EPON', 'Vision West']
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `brands`
**Purpose**: Frame brands (global, linked to vendors)

```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. `account_brands`
**Purpose**: Account-specific brand pricing and relationships

```sql
CREATE TABLE account_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id),
  vendor_id UUID REFERENCES vendors(id),
  wholesale_cost DECIMAL(10,2),
  your_cost DECIMAL(10,2),
  retail_price DECIMAL(10,2),
  tariff_tax DECIMAL(10,2),
  return_window_days INTEGER DEFAULT 365, -- Days for returns
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, brand_id)
);
```

#### 5. `account_vendors`
**Purpose**: Account-vendor relationships with contact info

```sql
CREATE TABLE account_vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id),
  company_email TEXT,
  company_phone TEXT,
  support_email TEXT,
  support_phone TEXT,
  website TEXT,
  rep_name TEXT,
  rep_email TEXT,
  rep_phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, vendor_id)
);
```

#### 6. `emails`
**Purpose**: Received vendor emails

```sql
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  sender TEXT,
  subject TEXT,
  body TEXT,
  html TEXT,
  attachments JSONB, -- [{filename, content_type, url}]
  vendor_detected TEXT,
  confidence_score INTEGER, -- 75-95
  duplicate_order BOOLEAN DEFAULT FALSE,
  parsed_data JSONB, -- Extracted order data
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. `inventory`
**Purpose**: Frame inventory with lifecycle tracking

```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  email_id UUID REFERENCES emails(id),
  order_number TEXT,
  vendor_id UUID REFERENCES vendors(id),
  brand_id UUID REFERENCES brands(id),
  brand_name TEXT,
  model TEXT,
  color TEXT,
  size TEXT,
  upc TEXT,
  sku TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('pending', 'current', 'sold', 'archived')),
  confirmation_date TIMESTAMP, -- When order confirmed (return window starts)
  sale_date TIMESTAMP, -- When marked as sold
  metadata JSONB, -- Additional data: material, origin, measurements, etc.
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_account_status ON inventory(account_id, status);
CREATE INDEX idx_inventory_order_number ON inventory(order_number);
```

#### 8. `orders`
**Purpose**: Vendor orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  email_id UUID REFERENCES emails(id),
  order_number TEXT NOT NULL,
  vendor_id UUID REFERENCES vendors(id),
  vendor_name TEXT,
  order_date DATE,
  customer_name TEXT,
  total_pieces INTEGER,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'archived')),
  metadata JSONB, -- Additional order data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, order_number)
);
```

#### 9. `return_reports`
**Purpose**: Return reports metadata

```sql
CREATE TABLE return_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  report_number TEXT UNIQUE, -- RR-2024-0001
  vendor_id UUID REFERENCES vendors(id),
  report_date DATE DEFAULT CURRENT_DATE,
  total_items INTEGER,
  total_refund DECIMAL(10,2),
  status TEXT CHECK (status IN ('pending', 'approved', 'refunded')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 10. `return_report_items`
**Purpose**: Individual frames in return report

```sql
CREATE TABLE return_report_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES return_reports(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES inventory(id),
  brand_name TEXT,
  model TEXT,
  color TEXT,
  size TEXT,
  upc TEXT,
  quantity INTEGER,
  return_reason TEXT,
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 11. `api_logs`
**Purpose**: API call logging and monitoring

```sql
CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id),
  endpoint TEXT,
  method TEXT,
  vendor TEXT,
  request_data JSONB,
  response_data JSONB,
  status_code INTEGER,
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_logs_vendor ON api_logs(vendor);
CREATE INDEX idx_api_logs_created ON api_logs(created_at);
```

#### 12. `email_patterns`
**Purpose**: Vendor detection patterns

```sql
CREATE TABLE email_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_name TEXT,
  pattern_type TEXT CHECK (pattern_type IN ('domain', 'strong_signature', 'weak_keyword')),
  pattern TEXT,
  confidence INTEGER, -- 95, 90, or 75
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Data Storage Breakdown

**Supabase (Primary)**:
- ✅ User accounts
- ✅ Vendors and brands (global + account-specific)
- ✅ Inventory (all statuses)
- ✅ Orders
- ✅ Emails
- ✅ Return reports
- ✅ API logs
- ✅ Vendor detection patterns

**localStorage (Temporary Only)**:
- Saved calculations (for quick reference)
- Saved comparisons (for quick reference)
- Demo state (during demo only)

### Data Flow

```
User Action → React Component → React Query Hook →
API Endpoint (Express) → Supabase Operations (server/lib/supabase.js) →
PostgreSQL Database → Response → React Query Cache →
Component Update
```

---

## 🔌 API Endpoints (Backend)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Emails
- `GET /api/emails/:accountId` - List all emails for account
- `DELETE /api/emails/:accountId/:emailId` - Delete specific email
- `POST /api/emails/detect-vendor` - Vendor detection test

### Inventory
- `GET /api/inventory/:accountId` - List all inventory items
- `GET /api/inventory/:accountId/status/:status` - Filter by status (pending, current, sold, archived)
- `POST /api/inventory/:accountId/confirm/:orderNumber` - Confirm order (pending → current)
- `PUT /api/inventory/:accountId/:itemId/sold` - Mark as sold (current → sold)
- `PUT /api/inventory/:accountId/:itemId/archive` - Archive item (current → archived)
- `PUT /api/inventory/:accountId/:itemId/restore` - Restore item (archived → current)
- `DELETE /api/inventory/:accountId/:itemId` - Delete item permanently

### Orders
- `GET /api/orders/:accountId` - List all orders
- `GET /api/orders/:accountId/status/:status` - Filter by status (pending, confirmed, archived)
- `POST /api/orders/:accountId` - Create order
- `DELETE /api/orders/:accountId/:orderId` - Delete order

### Vendors
- `GET /api/vendors` - List all global vendors (13+)
- `GET /api/vendors/:accountId/with-pricing` - Vendors with account-specific pricing
- `POST /api/vendors/:accountId/brands` - Save account brand pricing
- `PUT /api/vendors/:accountId/brands/:brandId` - Update account brand pricing
- `DELETE /api/vendors/:accountId/brands/:brandId` - Delete account brand

### Webhook
- `POST /api/webhook/email` - CloudMailin webhook (receives emails)

### Safilo Processing
- `POST /api/safilo/process` - Process Safilo PDF
- `POST /api/safilo/reprocess` - Re-run enrichment for existing order
- `GET /api/safilo/statistics` - Processing statistics

### Enrichment
- `POST /api/enrich/idealoptics` - Ideal Optics batch enrichment
- `POST /api/enrich/idealoptics/single` - Ideal Optics single product test

### Statistics
- `GET /api/stats/:accountId` - Dashboard statistics
- `GET /api/stats/:accountId/vendors` - Vendor inventory breakdown

### Health
- `GET /api/health` - Server health check

---

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#2563eb` (buttons, links, active states)
- **Success Green**: `#10b981` (positive metrics, confirmations)
- **Warning Yellow**: `#f59e0b` (warnings, alerts)
- **Danger Red**: `#ef4444` (delete actions, errors)
- **Background**: `#f9fafb` (gray-50)
- **Sidebar**: `#111827` (gray-900)

### Typography
- **Font**: System font stack (sans-serif)
- **Headings**: Bold, 2xl-4xl sizes
- **Body**: Regular, sm-base sizes
- **Labels**: Medium, sm size

### Components
- **Buttons**: Rounded-lg, px-4 py-2, hover states
- **Cards**: White bg, rounded-xl, shadow-sm
- **Inputs**: Border, rounded-lg, focus rings
- **Modals**: Full-screen overlay, centered content
- **Tables**: Striped rows, hover effects, pagination

### Animations (Framer Motion)
- **Duration**: 0.2-0.3s (quick interactions)
- **Easing**: ease-out (natural feel)
- **Page transitions**: Fade + slide
- **Hover effects**: Scale (1.02-1.05)
- **Delete animations**: Slide-out + fade + collapse
- **Stagger**: 0.05s per item in lists

---

## 🔄 Complete User Journey

### New User Onboarding Flow

1. **Landing** → Visit homepage (www.optiprofit.app)
2. **Authentication** → Register at `/auth`
   - Provide email, password, first name, last name
   - Account created with unique forwarding email
3. **Welcome** → Redirected to homepage (authenticated)
4. **Tutorial Option** → Click "Watch Demo" button (optional)
5. **Demo Experience** → 18-step interactive guided tour
6. **Setup Vendors** → Add vendors and brands at `/brands`
   - Enter pricing data for each brand
   - Set return window days per brand
7. **Forward First Email** → Forward vendor order confirmation
8. **Review Email** → Check Inventory → Emails Tab
9. **Confirm Order** → Orders → Pending → Confirm
10. **View Inventory** → Inventory → Current Tab
11. **Monitor Returns** → Sort by return window
12. **Calculate Profit** → Calculator with auto-populated pricing
13. **Compare Frames** → Comparison tab for side-by-side
14. **Dashboard** → Monitor metrics

### Returning User Flow

1. **Login** → Enter credentials
2. **Check Emails** → Inventory → Emails Tab for new orders
3. **Confirm Orders** → Orders → Pending → Confirm
4. **Monitor Inventory** → Inventory → Current Tab
   - Sort by return window
   - Identify expiring frames
5. **Generate Returns** → Reports → Returns for approaching deadlines
6. **Update Pricing** → My Vendors to adjust costs
7. **Calculate Profits** → Calculator for new frames
8. **Compare Options** → Comparison for vendor decisions
9. **Review Dashboard** → Business metrics overview

---

## 🚀 Development Workflow

### Setup
```bash
# Clone repository
cd C:\Users\payto\OneDrive\Desktop\Software\Opti-Profit\Version1

# Install dependencies
npm install

# Environment variables (.env.local)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001
```

### Running Locally
```bash
# Frontend (Vite dev server)
npm run dev              # http://localhost:5173

# Backend (Express server)
cd server
node index.js            # http://localhost:3001
```

### Build
```bash
# Production build
npm run build            # Outputs to /dist
npm run preview          # Preview build locally
```

### Testing
```bash
# Run tests
npm run test             # Vitest

# Test coverage
npm run test:coverage
```

### TypeScript
```bash
# Type checking
npm run type-check
```

---

## 📦 Dependencies

### Frontend Core
- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `typescript`: ^5.5.3
- `vite`: ^6.3.5

### UI & Styling
- `tailwindcss`: ^3.4.1
- `framer-motion`: ^12.16.0
- `lucide-react`: ^0.436.0

### Routing & State
- `react-router-dom`: ^7.6.2
- `@tanstack/react-query`: ^5.90.5

### Notifications
- `react-hot-toast`: ^2.5.2

### PDF Generation
- `jspdf`: ^3.0.3

### Backend
- `express`: ^4.18.2
- `@supabase/supabase-js`: ^2.57.4
- `cors`: ^2.8.5
- `helmet`: ^8.1.0
- `express-rate-limit`: ^7.4.1
- `cheerio`: ^1.0.0 (HTML parsing)
- `pdf-parse`: ^1.1.1 (PDF parsing)

### Testing
- `vitest`: Latest

---

## 🐛 Known Issues & Notes

### Current Limitations
1. **Single Account per User**: No multi-location support yet
2. **CloudMailin Configuration**: User must forward emails manually (automated forwarding possible)
3. **Return Window Configuration**: Manual per brand (vendor policies vary)
4. **API Access**: Uses public vendor APIs (no API keys needed from users)

### Recent Updates
1. **Inventory Refactoring** (Nov 2025): Reduced from 2,978 → 2,778 lines with hook extraction
2. **Ideal Optics Integration** (Oct 2025): Added parser with 95% confidence vendor detection
3. **Safilo Enhancement** (Sep 2025): 18 frame formats with API enrichment
4. **Return Tracking** (2025): PDF generation and window monitoring
5. **React Query Migration**: Real-time data updates with caching

### Testing Status
- **Total Test Suites**: 57
- **Passing**: 45 (79% pass rate)
- **Framework**: Vitest

---

## 🎯 Business Logic

### Profit Calculation Formula

**Insurance Mode**:
```javascript
patientPayment = (retailPrice - coverageAmount) * 0.8  // 20% discount
totalRevenue = patientPayment + insuranceReimbursement
totalCost = yourCost + tariffTax
netProfit = totalRevenue - totalCost
profitMargin = (netProfit / totalRevenue) * 100
```

**Cash-Pay Mode**:
```javascript
patientPayment = retailPrice
totalCost = yourCost + tariffTax
netProfit = patientPayment - totalCost
profitMargin = (netProfit / patientPayment) * 100
```

### Discount Calculation
```javascript
discountPercent = ((wholesaleCost - yourCost) / wholesaleCost) * 100
```

### Retail Price Auto-Calculation
```javascript
retailPrice = wholesaleCost * insuranceMultiplier  // 1x-4x
```

### Return Window Calculation
```javascript
returnWindowEndDate = confirmationDate + returnWindowDays
daysRemaining = Math.ceil((returnWindowEndDate - today) / (1000 * 60 * 60 * 24))

// Color coding
if (daysRemaining < 30) color = 'red'    // Urgent
else if (daysRemaining < 90) color = 'yellow'  // Warning
else color = 'green'  // Safe
```

---

## 🔐 Security Features

### Middleware (Backend)
- **Helmet**: Security headers (XSS, clickjacking, MIME sniffing protection)
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Prevent API abuse (max 100 requests per 15min)
- **Input Validation**: UUID validation, email validation

### Authentication
- **Supabase Auth**: JWT-based session management
- **Protected Routes**: All routes require authentication
- **Session Persistence**: Secure token storage
- **Password Requirements**: Minimum 6 characters

### Email Processing
- **Duplicate Detection**: Prevents duplicate order processing
- **Confidence Scoring**: 75-95% confidence required
- **Vendor Verification**: 3-tier detection system
- **API Logging**: All API calls logged for monitoring

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px (sm)
- **Tablet**: 768px - 1024px (md)
- **Desktop**: > 1024px (lg)

### Mobile Features
- Collapsible sidebar
- Hamburger menu
- Stacked forms (single column)
- Touch-friendly buttons (min 44px)
- Responsive tables (horizontal scroll)
- Mobile-optimized modals

---

## 🎬 Roadmap

### Phase 1 (COMPLETE)
- ✅ Email processing (7 vendor parsers)
- ✅ Inventory management (4 tabs, return tracking)
- ✅ Orders management (pending/confirmed)
- ✅ Returns tracking (PDF reports, window monitoring)
- ✅ Profit calculator (insurance + cash-pay)
- ✅ Vendor management (Supabase integration)
- ✅ Frame comparison (side-by-side)
- ✅ Demo system (18 interactive steps)
- ✅ Authentication (Supabase Auth)
- ✅ Dashboard (real-time metrics)

### Phase 2 (PLANNED)
- [ ] Multi-location support (multiple practice locations per account)
- [ ] Advanced analytics (profit trends, vendor performance)
- [ ] Automated email forwarding (Gmail/Outlook integration)
- [ ] Bulk inventory actions (bulk archive, bulk sell)
- [ ] Custom return window templates (per vendor)
- [ ] Export data (CSV, Excel)
- [ ] Mobile app (React Native)

### Phase 3 (FUTURE)
- [ ] AI-powered frame recommendations
- [ ] Automated pricing updates (vendor API integrations)
- [ ] Vendor performance scoring
- [ ] Predictive return window alerts
- [ ] Multi-user roles (admin, staff, read-only)
- [ ] Integration with POS systems
- [ ] Automated reorder suggestions

---

## 📞 Technical Contact

- **Project Path**: `C:\Users\payto\OneDrive\Desktop\Software\Opti-Profit\Version1`
- **Database**: Supabase PostgreSQL
- **Deployment**: Render (Frontend + Backend)
- **Frontend URL**: https://www.optiprofit.app
- **Backend URL**: https://optiprofit-backend.onrender.com
- **Frontend Port (Dev)**: 5173
- **Backend Port (Dev)**: 3001
- **CloudMailin Webhook**: Active (user forwards emails)

---

## 📚 Additional Documentation

- **SAFILO_INTEGRATION.md**: Safilo parser details (18 formats, API enrichment)
- **IDEAL_OPTICS_INTEGRATION.md**: Ideal Optics parser and web scraping
- **INVENTORY_FEATURE.md**: Inventory system architecture (may be outdated)
- **REFACTORING_COMPLETE.md**: Recent refactoring notes (Nov 2025)
- **DEPLOYMENT_GUIDE.md**: Deployment instructions for Render
- **db_schema.sql**: Complete database schema with all tables

---

*Last Updated: 2025-11-05*
*Version: 1.0*
*Status: Active Production*
*Documentation Completeness: 100%*
*Codebase Audit: Comprehensive*
