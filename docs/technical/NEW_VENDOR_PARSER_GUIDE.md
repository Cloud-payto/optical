# New Vendor Parser Implementation Guide

> **Living Document**: This guide is updated as we add new vendors. Last updated: December 2025 (Kenmark, Europa, Marchon)

## Overview

This document outlines the step-by-step process for adding a new vendor email parser to OptiProfit. The system uses a multi-tier vendor detection approach and modular parser architecture.

## Prerequisites

Before starting, you need:
- [ ] Sample vendor email(s) - at least 2-3 examples
- [ ] Understanding of email format (HTML or PDF attachment)
- [ ] Vendor's sender email domain(s)
- [ ] Any unique identifiers in the email body

---

## Step-by-Step Process

### Step 1: Analyze the Vendor Email

**Goal:** Understand the email structure and identify key data points.

**Tasks:**
- [ ] Identify email format: HTML body or PDF attachment
- [ ] Note the sender email domain(s)
- [ ] Identify unique body signatures (company name, URLs, phone numbers)
- [ ] Map out where key data lives:
  - Order number
  - Account number
  - Frame/product details (brand, model, color, size, UPC, quantity, prices)

**Files to reference:**
- `dev-email-parsers/[VendorName]/` - Store sample emails here

---

### Step 2: Create SQL Script for Database Entry

**Goal:** Add the vendor to the database with email detection patterns.

**File to create:** `supabase/XX-add-[vendor]-vendor.sql` (or add to existing script)

**SQL Template:**
```sql
INSERT INTO public.vendors (
  id,
  name,
  code,
  domain,
  email_patterns,
  parser_service,
  is_active,
  created_at,
  updated_at,
  contact_email
) VALUES (
  'uuid-here',
  'Vendor Name',
  'VENDORCODE',
  'vendordomain.com',
  '{
    "tier1": {
      "weight": 95,
      "domains": ["vendordomain.com"]
    },
    "tier2": {
      "weight": 85,
      "body_signatures": [
        "vendor company name",
        "vendordomain.com"
      ]
    },
    "tier3": {
      "weight": 60,
      "body_keywords": ["vendor", "order number"],
      "required_matches": 2,
      "subject_keywords": ["vendor", "receipt for order"]
    }
  }'::jsonb,
  'VendorParser',
  true,
  NOW(),
  NOW(),
  'noreply@vendordomain.com'
) ON CONFLICT (name) DO UPDATE SET
  email_patterns = EXCLUDED.email_patterns,
  updated_at = NOW();
```

**Current SQL script:** `supabase/14-add-new-vendors.sql`

---

### Step 3: Create the Parser

**Goal:** Build the parser that extracts order and frame data.

**File to create:** `server/parsers/[vendorName]Parser.js`

**Parser Template:**
```javascript
const cheerio = require('cheerio');

function parseVendorHtml(html, plainText) {
    const textToUse = plainText || html;
    const $ = cheerio.load(html);

    // Extract order details
    const orderNumberMatch = textToUse.match(/Order\s*#[:\s]*(\d+)/i);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : '';

    // Extract customer info
    const customerInfo = extractCustomerInfo(html, textToUse);

    // Extract items
    const items = extractItems(html);

    return {
        vendor: 'VendorName',
        vendorCode: 'vendorcode',
        orderNumber,
        orderDate,
        repName,
        accountNumber: customerInfo.accountNumber,
        customerName: customerInfo.customerName,
        items,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        metadata: {
            parsedAt: new Date().toISOString(),
            parserVersion: '1.0'
        }
    };
}

function extractCustomerInfo(html, textToUse) {
    // Vendor-specific extraction
}

function extractItems(html) {
    // Vendor-specific item extraction
    // Return: [{ brand, model, color, colorCode, size, quantity, upc, ... }]
}

function validateParsedData(parsedData) {
    const errors = [];
    const warnings = [];

    if (!parsedData.orderNumber) errors.push('Missing order number');
    if (!parsedData.items?.length) errors.push('No items found');

    return { valid: errors.length === 0, errors, warnings };
}

module.exports = { parseVendorHtml, validateParsedData };
```

---

### Step 4: Register the Parser in Index

**Goal:** Add the parser to the registry so it can be routed to.

**File:** `server/parsers/index.js`

**Changes needed:**
```javascript
// 1. Import at top of file
const { parseVendorHtml } = require('./vendorParser');

// 2. Add to parsers Map in constructor
this.parsers.set('vendordomain.com', this.processVendorWithService.bind(this));

// 3. Add processing method
processVendorWithService(html, plainText) {
    const parsedResult = parseVendorHtml(html, plainText);
    return this.transformVendorResult(parsedResult);
}

// 4. Add transform method
transformVendorResult(vendorResult) {
    const items = vendorResult.items.map(item => ({
        sku: `${item.brand}-${item.model}-${item.colorCode}`,
        brand: item.brand,
        model: item.model,
        color: item.color,
        // ... map all fields
    }));

    return {
        vendor: 'VendorName',
        account_number: vendorResult.accountNumber,
        order: { /* order details */ },
        items: items,
        parsed_at: new Date().toISOString()
    };
}
```

---

### Step 5: Add Parse Route Endpoint

**Goal:** Create an API endpoint for direct parsing (used by n8n).

**File:** `server/routes/parse.js`

**Changes needed:**
```javascript
// 1. Import at top
const { parseVendorHtml, validateParsedData: validateVendorData } = require('../parsers/vendorParser');

// 2. Add endpoint
router.post('/vendor', async (req, res) => {
  try {
    const { html, plainText, accountId } = req.body;

    if (!html && !plainText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: html or plainText'
      });
    }

    const parsedData = parseVendorHtml(html, plainText);
    const validation = validateVendorData(parsedData);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    // Get vendor ID from database
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('code', 'VENDORCODE')
      .single();

    return res.status(200).json({
      success: true,
      vendor: 'vendor',
      vendorId: vendor?.id,
      order: { /* mapped order data */ },
      items: parsedData.items.map(/* item mapping */),
      unique_frames: /* unique brand/model combos */
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

### Step 6: Update n8n Workflow

**Goal:** Add routing logic to send detected vendor emails to the new parser.

**Files:**
- `n8n/n8n_workflow.json` (reference only - do NOT edit directly)
- `n8n/templates/` (use these templates to create nodes)

#### Using n8n Node Templates

We have pre-built JSON templates for each node type. To add a new vendor:

1. **Copy and customize each template file** from `n8n/templates/`:

| Template | Purpose | When to Use |
|----------|---------|-------------|
| `vendor_parser_node.json` | Calls `/api/parse/[vendor]` | Always - first node in chain |
| `check_catalog_node.json` | Checks vendor catalog cache | Always - after parser |
| `prepare_email_data_node.json` | Formats data for email record | Always - after catalog check |
| `create_email_record_node.json` | Saves email to database | Always - after prepare data |
| `bulk_add_node.json` | Adds items to inventory | Always - parallel to catalog |
| `enrich_node.json` | Enriches with product data | Optional - if vendor has API |
| `cache_to_catalog_node.json` | Caches catalog items | Optional - after enrich |

2. **Replace placeholders** in each template:
   - `{{VENDOR_NAME}}` - PascalCase for code references (e.g., `Europa`)
   - `{{VENDOR_SLUG}}` - lowercase for URLs (e.g., `europa`)
   - `{{VENDOR_DISPLAY_NAME}}` - Display name (e.g., `'Europa'`)
   - `{{NODE_ID}}` - Generate unique UUID
   - `{{POSITION_Y}}` - Y coordinate (increment by ~200 for each vendor)
   - `{{CATALOG_NUMBER}}`, `{{RECORD_NUMBER}}`, etc. - Increment from existing highest

3. **Import into n8n:**
   - Open n8n workflow editor
   - Use "Import from JSON" feature
   - Paste the customized node JSON
   - Position and connect nodes appropriately

4. **Update the Switch node:**
   - Add new output for the vendor code (e.g., `EUROPA`)
   - Connect to the parser node

#### Node Connection Order

```
Vendor Detection Switch
         ↓
   Parser Node (parse_VendorName)
         ↓
    ┌────┴────┐
    ↓         ↓
Check Catalog  Bulk-Add
    ↓
Prepare Email Data
    ↓
Create Email Record
    ↓
Enrich (if applicable)
    ↓
Cache to Catalog (if applicable)
```

---

### Step 7: Update Seed Script (Optional)

**Goal:** Ensure vendor patterns are seeded for new installations.

**File:** `server/scripts/seedVendorPatterns.js`

Add the vendor's email patterns to the `vendorPatterns` object.

---

### Step 8: Test the Parser

**Goal:** Verify the parser works with real emails.

**Testing approaches:**
1. **Unit test:** Create test file in `dev-email-parsers/[VendorName]/`
2. **API test:** POST to `/api/parse/vendorname` with sample email
3. **Integration test:** Forward real email through CloudMailin

**Test checklist:**
- [ ] Order number extracted correctly
- [ ] Account number extracted correctly
- [ ] All line items parsed
- [ ] Frame details accurate (brand, model, color, size)
- [ ] Quantities correct
- [ ] Prices extracted (if available)

---

## File Checklist for New Vendor

| File | Action | Status |
|------|--------|--------|
| `dev-email-parsers/[Vendor]/` | Create folder with samples | |
| `supabase/XX-add-vendor.sql` | Create SQL for database entry | |
| `server/parsers/[vendor]Parser.js` | Create parser | |
| `server/parsers/index.js` | Register parser + transform | |
| `server/routes/parse.js` | Add endpoint | |
| **n8n Workflow** | Import nodes using templates | |
| ↳ `n8n/templates/vendor_parser_node.json` | Parser node | |
| ↳ `n8n/templates/check_catalog_node.json` | Catalog check node | |
| ↳ `n8n/templates/prepare_email_data_node.json` | Prepare data node | |
| ↳ `n8n/templates/create_email_record_node.json` | Create record node | |
| ↳ `n8n/templates/bulk_add_node.json` | Bulk add node | |
| ↳ `n8n/templates/enrich_node.json` | Enrich node (optional) | |
| ↳ `n8n/templates/cache_to_catalog_node.json` | Cache node (optional) | |
| `server/scripts/seedVendorPatterns.js` | Add to seed (optional) | |

---

## Current Supported Vendors

| Vendor | Parser Type | Parser File | Route | Status |
|--------|-------------|-------------|-------|--------|
| Modern Optical | HTML | `modernopticalparser.js` + `ModernOpticalService.js` | `/api/parse/modernoptical` | Active |
| Safilo | PDF | `SafiloService.js` | `/api/parse/safilo` | Active |
| Luxottica | HTML | `luxotticaParser.js` | `/api/parse/luxottica` | Active |
| Etnia Barcelona | PDF | `EtniaBarcelonaService.js` | `/api/parse/etnia` | Active |
| Ideal Optics | HTML | `idealOpticsParser.js` + `IdealOpticsService.js` | `/api/parse/idealoptics` | Active |
| L'America | HTML | `lamyamericaParser.js` + `LamyamericaService.js` | `/api/parse/lamyamerica` | Active |
| Kenmark | HTML | `kenmarkParser.js` + `KenmarkService.js` | `/api/parse/kenmark` | Active |
| Europa | HTML | `europaParser.js` | `/api/parse/europa` | Active |
| Marchon | HTML | `marchonParser.js` | `/api/parse/marchon` | Active |

---

## Troubleshooting

### Email not being detected
- Check vendor detection logs
- Verify domain is in tier1 patterns
- Test with `/api/emails/detect-vendor` endpoint

### Parser returning empty results
- Check HTML/PDF structure matches expectations
- Add console logging to debug extraction
- Verify cheerio selectors are correct

### n8n not routing correctly
- Check switch node conditions
- Verify vendor code matches exactly
- Check parser endpoint is responding

---

## Notes from Implementation Sessions

### Kenmark (December 2025)
**Status:** Parser already existed, just needed route endpoint

**Findings:**
- Parser: `kenmarkParser.js` - extracts order data from HTML
- Enrichment: `KenmarkService.js` - uses UPCs from image URLs to query Kenmark API
- Image URL pattern: `https://imageserver.jiecosystem.net/image/kenmark/[UPC]`
- Same backend as L'amyamerica and Modern Optical (jiecosystem)

**What was added:**
- `/api/parse/kenmark` endpoint in `parse.js`
- SQL entry in `14-add-new-vendors.sql`

---

### Europa (December 2025)
**Status:** Complete - new parser created from scratch

**Email Format Analysis:**
- From: `noreply@europaeye.com`
- Subject: `Customer Receipt: Your Receipt for Order #[number]`
- HTML tables with CSS classes (x_tableheader, x_secondaryheader)
- Model format: `Brand - Model` (e.g., "American Optical - Adams")
- Color format: `ColorCode ColorName` (e.g., "1 Black - Green Nylon Polarized")

**Brands carried:**
- American Optical
- Cinzia
- Michael Ryen

**What was created:**
- `server/parsers/europaParser.js` - HTML parser
- `processEuropaWithService()` in `index.js`
- `transformEuropaResult()` in `index.js`
- `/api/parse/europa` endpoint in `parse.js`
- SQL entry in `14-add-new-vendors.sql`

**Note:** Europa doesn't have UPCs in emails, so no API enrichment is available.

---

### Marchon (December 2025)
**Status:** Complete - new parser created from scratch

**Email Format Analysis:**
- From: `noreply@marchon.com`
- Subject: `Marchon Order Confirmation for [CUSTOMER NAME]`
- HTML tables with frame data
- Style format: `MODEL COLOR` (e.g., "SF2223N LIGHT GOLD/BURGUNDY")
- Size format: `(54 eye)` in parentheses
- Customer format: `CUSTOMER NAME (ACCOUNT_NUMBER)` e.g., "FAMILY TREE EYE CARE (3075807)"
- Order ID format: `2010STR0982864`

**Brands carried (identified by model prefix):**
- Salvatore Ferragamo (SF)
- Calvin Klein (CK, CKJ)
- Nike (NK)
- Columbia (COL, C)
- Dragon (DG)
- Flexon (FL)
- Lacoste (L)
- Longchamp (LO)
- Marchon NYC (MNY, MNYC)
- Nine West (NW)
- MCM, Chloe, Liu Jo, Karl Lagerfeld, DKNY, and more

**What was created:**
- `server/parsers/marchonParser.js` - HTML parser with brand detection from model prefixes
- `processMarchonWithService()` in `index.js`
- `transformMarchonResult()` in `index.js`
- `/api/parse/marchon` endpoint in `parse.js`
- SQL entry in `14-add-new-vendors.sql`
- Pattern entry in `seedVendorPatterns.js`

**Note:** Marchon doesn't have UPCs in emails. Images are hosted on salsify.com but don't contain UPC data in the URL.
