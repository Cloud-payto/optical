# n8n Vendor Catalog Nodes - Implementation Guide

This guide shows you exactly how to add the two vendor catalog nodes to your n8n workflow.

## Overview

We're adding two nodes to enable incremental caching:
- **Node 1: Check Catalog** - After parsing, check if items exist in catalog
- **Node 2: Cache to Catalog** - After enrichment, save items to catalog

## Where These Nodes Go

```
Current Flow:
Parse → Prepare Email → Create Email → Bulk-Add → Enrich

New Flow:
Parse → [NODE 1: Check Catalog] → Prepare Email → Create Email → Bulk-Add → Enrich → [NODE 2: Cache to Catalog]
```

---

## NODE 1: Check Catalog

**Purpose:** Check if items already exist in vendor_catalog (avoids web scraping)

**Position:** Between `parse_{vendor}` and `Prepare Email {vendor}`

**Node Type:** HTTP Request

### Configuration:

**Name:** `Check Catalog - {Vendor}` (e.g., "Check Catalog - Modern Optical")

**Method:** `POST`

**URL:** `https://optical-express-api.onrender.com/api/catalog/check`

**Send Headers:** ✅ Yes
- Header Name: `Content-Type`
- Header Value: `application/json`

**Send Body:** ✅ Yes (Body Parameters)

**Body Parameters:**
```json
{
  "vendorId": "={{ $('parse_ModernOptical').item.json.vendorId }}",
  "items": "={{ $('parse_ModernOptical').item.json.items }}"
}
```

**Options:**
- Timeout: `10000` (10 seconds)

### Important Notes:

1. **Replace vendor names** in the expression based on which vendor:
   - Modern Optical: `$('parse_ModernOptical').item.json`
   - Safilo: `$('parse_Safilo').item.json`
   - Ideal Optics: `$('parse_Idealoptics').item.json`
   - Luxottica: `$('parse_Luxottica').item.json`
   - Etnia Barcelona: `$('parse_Etnia').item.json`
   - Lamyamerica: `$('parse_Lamy').item.json`
   - Kenmark: `$('parse_kenmark').item.json`

2. **vendorId** needs to be added to the parse response. We'll need to update each parser to include this.

---

## NODE 2: Cache to Catalog

**Purpose:** Save enriched items to vendor_catalog for future lookups

**Position:** After `Enrich` or `Bulk-Add` (if no enrich step)

**Node Type:** HTTP Request

### Configuration:

**Name:** `Cache to Catalog - {Vendor}` (e.g., "Cache to Catalog - Modern Optical")

**Method:** `POST`

**URL:** `https://optical-express-api.onrender.com/api/catalog/cache`

**Send Headers:** ✅ Yes
- Header Name: `Content-Type`
- Header Value: `application/json`

**Send Body:** ✅ Yes (Body Parameters)

**Body Parameters:**
```json
{
  "vendorId": "={{ $('parse_ModernOptical').item.json.vendorId }}",
  "vendorName": "Modern Optical",
  "items": "={{ $('Enrich').item.json.items || $('Bulk-Add').item.json.items }}"
}
```

**Options:**
- Timeout: `10000` (10 seconds)

### Important Notes:

1. **Get items from the right node:**
   - If vendor has Enrich step: `$('Enrich').item.json.items`
   - If vendor has no Enrich: `$('Bulk-Add').item.json.items`

2. **vendorName** should match the vendor display name

---

## Example: Modern Optical

Here's the complete flow for Modern Optical with both nodes:

```
1. parse_ModernOptical
   ↓
2. Check Catalog - Modern Optical (NEW!)
   POST /api/catalog/check
   Body: {
     vendorId: "={{ $('parse_ModernOptical').item.json.vendorId }}",
     items: "={{ $('parse_ModernOptical').item.json.items }}"
   }
   ↓
3. Prepare Email Data
   (Update to use $('Check Catalog - Modern Optical').item.json.items)
   ↓
4. Create Email Record
   ↓
5. Bulk-Add
   ↓
6. Enrich
   ↓
7. Cache to Catalog - Modern Optical (NEW!)
   POST /api/catalog/cache
   Body: {
     vendorId: "={{ $('parse_ModernOptical').item.json.vendorId }}",
     vendorName: "Modern Optical",
     items: "={{ $('Enrich').item.json.items }}"
   }
```

---

## Vendor IDs Reference

You'll need these vendor IDs for the `vendorId` parameter. These come from your `vendors` table in Supabase.

**HOW TO GET VENDOR IDs:**

Option 1: Query Supabase directly
```sql
SELECT id, name, code FROM vendors WHERE is_active = true;
```

Option 2: Use API endpoint
```bash
curl https://optical-express-api.onrender.com/api/vendors
```

**Common Vendor IDs:** (You'll need to update these with actual UUIDs from your database)

- Modern Optical: `{uuid from database}`
- Safilo: `{uuid from database}`
- Ideal Optics: `d02eef90-9ce9-4cba-91bf-796314e59177`
- Luxottica: `{uuid from database}`
- Etnia Barcelona: `{uuid from database}`
- Lamyamerica: `{uuid from database}`
- Kenmark: `{uuid from database}`

---

## Parser Updates Needed

Each parser needs to return `vendorId` in the response. Here's what needs to be added:

**In each parser service file:**

```javascript
// At the top, import supabase
const { supabase } = require('../lib/supabase');

// In the parse function, before returning:
async parse(html, plainText, accountId) {
  // ... existing parsing logic ...

  // Get vendor ID from database
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('code', 'modern_optical') // Change per vendor
    .single();

  return {
    success: true,
    vendorId: vendor?.id, // Add this!
    order: { ... },
    items: [ ... ]
  };
}
```

---

## Testing the Nodes

### Test Node 1 (Check Catalog):

**Before adding items to catalog:**
```json
{
  "success": true,
  "items": [...],
  "cacheHits": 0,
  "cacheMisses": 3,
  "hitRate": 0,
  "message": "Found 0 of 3 items in catalog"
}
```

**After items are in catalog:**
```json
{
  "success": true,
  "items": [...], // Items now have cached: true and enriched data
  "cacheHits": 3,
  "cacheMisses": 0,
  "hitRate": 100,
  "message": "Found 3 of 3 items in catalog"
}
```

### Test Node 2 (Cache to Catalog):

**First time caching:**
```json
{
  "success": true,
  "cached": 3,
  "updated": 0,
  "skipped": 0,
  "total": 3,
  "message": "Cached 3 new items, updated 0 existing items"
}
```

**Second time (already cached):**
```json
{
  "success": true,
  "cached": 0,
  "updated": 0,
  "skipped": 3,
  "total": 3,
  "message": "Cached 0 new items, updated 0 existing items"
}
```

---

## Benefits

Once implemented, you'll see:

1. **Faster processing:** Cache hit = no web scraping needed
2. **Incremental building:** Catalog grows with each order
3. **Vendor comparison ready:** Data accumulates for comparison features
4. **Better reliability:** Less dependent on vendor websites being up

---

## Rollout Strategy

**Phase 1: Test with One Vendor**
1. Add both nodes to Modern Optical flow
2. Process 5-10 test emails
3. Verify caching works
4. Check catalog stats: `GET /api/catalog/stats`

**Phase 2: Expand to All Vendors**
1. Copy the node pattern to Safilo
2. Copy to Ideal Optics
3. Copy to remaining vendors

**Phase 3: Monitor & Optimize**
1. Track cache hit rates
2. Identify vendors with good data
3. Build full catalog crawler for vendors with APIs

---

## Troubleshooting

**Problem: "vendorId is undefined"**
- Solution: Update parser to include vendorId in response

**Problem: "Items not found in catalog even after caching"**
- Solution: Check that model/color/size match exactly
- Check catalog with: `GET /api/catalog/stats?vendorId={uuid}`

**Problem: "Cache hit rate is 0%"**
- Solution: Ensure Node 2 is running after enrichment
- Verify data is being saved: Check Supabase `vendor_catalog` table

---

## Next Steps

1. ✅ Run the SQL script to create the table: `scripts/create-vendor-catalog.sql`
2. ✅ Update each parser to return `vendorId`
3. 🤝 **Together in n8n:** Add Node 1 to Modern Optical flow
4. 🤝 **Together in n8n:** Add Node 2 to Modern Optical flow
5. 🧪 Test with demo emails
6. 📊 Check catalog stats
7. 🔄 Repeat for other vendors

Let's start with Modern Optical when you're ready!
