# Kenmark Parser & Web Service

Complete solution for processing Kenmark Eyewear email order confirmations with UPC-based API enrichment.

## Overview

The Kenmark integration consists of two main components:

1. **kenmarkParser.js** - Extracts order details and UPC codes from HTML emails
2. **KenmarkService.js** - Enriches parsed data using Kenmark's API with UPC lookups

## Key Features

### Parser (kenmarkParser.js)
- ✅ Extracts order number, date, and rep name
- ✅ Parses customer account number and shipping information
- ✅ **Automatically extracts UPC codes from image URLs**
- ✅ Supports table-based email format
- ✅ Handles linkprotect URL wrappers
- ✅ Validates parsed data

### Web Service (KenmarkService.js)
- ✅ UPC-based product lookup via Kenmark API
- ✅ Retrieves pricing (wholesale, MSRP)
- ✅ Stock availability and dates
- ✅ Complete product details (material, shape, gender, etc.)
- ✅ Cross-reference validation
- ✅ Batch processing with retry logic
- ✅ Response caching for performance

## Email Structure

### Sample Email Properties
- **From:** `noreply@kenmarkeyewear.com`
- **Subject:** `Kenmark Eyewear: Your Receipt for Order Number [number]`
- **Format:** HTML table with embedded images

### Email Sections
1. **Order Header:** Order number, rep name, date
2. **Customer Info:** Name, account number, address, phone
3. **Ship To:** Shipping destination
4. **Order Items:** Table with Image, Model, Color, Size, Qty
5. **Notes:** PO number, terms, promotions

## UPC Extraction

The **key innovation** is extracting UPC codes directly from image URLs:

```
Image URL: https://imageserver.jiecosystem.net/image/kenmark/715317146401
                                                          └─────────┬─────────┘
                                                              UPC Code
```

This is more reliable than searching by model name!

## API Integration

### Endpoint
```
https://kenmarkeyewear.com/US/api/CatalogAPI/filter
```

### Backend
Kenmark uses the **jiecosystem.net** backend (same as L'amyamerica and Modern Optical).

### Request Format
```javascript
POST /US/api/CatalogAPI/filter
{
  "Collections": [],
  "ColorFamily": [],
  "Shapes": [],
  "FrameTypes": [],
  "Genders": [],
  // ... other filter arrays
  "search": "715317146401"  // UPC code
}
```

### Response Structure
```javascript
[
  {
    "styleCode": "Percy",
    "collectionName": "Destiny",
    "colorGroup": [
      {
        "color": "Black",
        "sizes": [
          {
            "frameId": "715317146401",
            "upc": "715317146401",
            "eyeSize": "52",
            "bridge": "17",
            "temple": "140",
            "wholesale": 85.0,
            "msrp": "",
            "isInStock": false,
            "availableStatus": "back-ordered",
            "material": "plastic",
            "shape": "Rectangle",
            "gender": "male",
            // ... more fields
          }
        ]
      }
    ]
  }
]
```

## Usage

### Basic Parsing
```javascript
const { parseKenmarkHtml } = require('./kenmarkParser');

const parsedData = parseKenmarkHtml(emailHtml, emailPlainText);

console.log(parsedData.orderNumber);  // "102870"
console.log(parsedData.items);        // Array of parsed items with UPCs
```

### With API Enrichment
```javascript
const { parseKenmarkHtml } = require('./kenmarkParser');
const KenmarkService = require('./KenmarkService');

// Parse email
const parsedData = parseKenmarkHtml(emailHtml, emailPlainText);

// Enrich with API data
const service = new KenmarkService();
const enrichedData = await service.enrichOrderData(parsedData);

// Access enriched data
enrichedData.items.forEach(item => {
  console.log(`${item.brand} ${item.model}`);
  console.log(`  Wholesale: $${item.enrichedData?.wholesale}`);
  console.log(`  In Stock: ${item.enrichedData?.inStock}`);
});
```

### Configuration Options
```javascript
const service = new KenmarkService({
  timeout: 10000,        // API request timeout (ms)
  maxRetries: 3,         // Number of retry attempts
  retryDelay: 1000,      // Delay between retries (ms)
  batchSize: 5,          // Items per batch
  minConfidence: 50,     // Minimum validation confidence (%)
  debug: false           // Enable debug logging
});
```

## Testing

Run the test script:
```bash
cd server/parsers
node test-kenmark.js
```

### Test Requirements
- Sample email in `dev-email-parsers/Kenmark/email.txt`
- Node.js with required dependencies (cheerio, axios)

### Expected Output
```
✅ Parsing:     SUCCESS
✅ Validation:  PASSED
📊 Enrichment:  100%
⏱️  Processing:  1.2s

🎉 ALL ITEMS SUCCESSFULLY ENRICHED!
```

## Parsed Data Structure

```javascript
{
  vendor: 'Kenmark',
  vendorCode: 'kenmark',
  orderNumber: '102870',
  orderDate: '8/9/2025',
  repName: 'Alicia',
  accountNumber: '19903',
  customerName: 'Arizona Vision Therapy Center',
  customerAddress: 'Dr Amy Thomas 2312 N. Rosemont Blvd #103, Tucson , AZ 85712',
  customerPhone: '520-886-8800',
  shipToName: 'Arizona Vision Therapy Center',
  shipToAddress: 'Dr Amy Thomas 2312 N. Rosemont Blvd #103, Tucson, AZ 85712',
  items: [
    {
      brand: 'Destiny',
      model: 'Percy',
      colorCode: '',
      colorName: 'Black',
      color: 'Black',
      size: '52',
      eyeSize: '52',
      bridge: '',
      temple: '',
      quantity: 1,
      upc: '715317146401',
      imageUrl: 'https://...',
      // After enrichment:
      enrichedData: {
        wholesale: 85.0,
        msrp: 0,
        inStock: false,
        availability: 'back-ordered',
        material: 'plastic',
        shape: 'Rectangle',
        gender: 'male',
        collectionName: 'Destiny',
        // ... more fields
      },
      validation: {
        validated: true,
        confidence: 50,
        matches: { upc: true }
      }
    }
  ],
  totalQuantity: 3,
  totalItems: 3,
  metadata: {
    parsedAt: '2025-10-19T18:32:00.000Z',
    parserVersion: '1.0',
    source: 'email'
  }
}
```

## Integration with Main System

### 1. Add to Vendor Detection
Already configured in `server/services/vendorDetection.js` via database:
- Tier 1: Domain `kenmarkeyewear.com`
- Tier 2: Body signatures like "Kenmark Eyewear"
- Tier 3: Weak patterns with multiple keyword matches

### 2. Add to Parser Index
Update `server/parsers/index.js`:
```javascript
const { parseKenmarkHtml } = require('./kenmarkParser');
const KenmarkService = require('./KenmarkService');

// In parser mapping
case 'kenmark':
  parsedData = parseKenmarkHtml(html, plainText);
  if (enrichWithAPI) {
    const service = new KenmarkService();
    parsedData = await service.enrichOrderData(parsedData);
  }
  break;
```

### 3. Database Setup
Run the SQL in Supabase to add Kenmark vendor (already in db_schema.sql):
```sql
INSERT INTO public.vendors (name, code, domain, email_patterns, ...)
VALUES ('Kenmark', 'kenmark', 'kenmarkeyewear.com', ...);
```

## Troubleshooting

### No UPCs Extracted
- **Issue:** Image URLs might be wrapped in link protection services
- **Solution:** Parser handles `linkprotect.cudasvc.com` URLs automatically

### API Returns No Results
- **Possible Causes:**
  1. UPC not in current catalog (discontinued items)
  2. API requires authentication (check if headers needed)
  3. Search format might need adjustment
- **Debug:** Enable debug mode in KenmarkService

### Low Enrichment Rate
- **Check:** Item UPCs were successfully extracted from parser
- **Verify:** API endpoint is accessible
- **Try:** Reduce batch size to avoid rate limiting

## Performance

- **Parsing:** ~50ms for typical order (3-10 items)
- **API Enrichment:** ~200-500ms per item (with caching)
- **Total:** ~1-3s for complete order processing

## Validation Confidence Scoring

| Match Type | Score | Description |
|------------|-------|-------------|
| UPC Match | 50 | Highest priority - direct UPC match |
| Color Code | 20 | Color code from email matches API |
| Eye Size | 10 | Eye size dimension matches |
| Bridge | 10 | Bridge dimension matches |
| Temple | 10 | Temple length matches |

**Threshold:** 50% required for validation (UPC match alone validates)

## Related Files

- `kenmarkParser.js` - HTML email parser
- `KenmarkService.js` - API enrichment service
- `test-kenmark.js` - Test script
- `../services/vendorDetection.js` - Vendor detection patterns
- `../../dev-email-parsers/Kenmark/` - Sample emails for testing
- `../../db_schema.sql` - Database vendor configuration

## Notes

- Kenmark uses the same jiecosystem.net platform as L'amyamerica and Modern Optical
- UPC extraction from image URLs is the most reliable identification method
- API responses include comprehensive product details beyond basic order info
- Caching improves performance for duplicate UPC lookups
- Batch processing prevents API overload

## Future Enhancements

1. **Authentication:** Add API key support if required
2. **Retry Logic:** Improve retry strategy for rate-limited requests
3. **Fallback:** Model name search if UPC extraction fails
4. **PDF Support:** Add PDF attachment parsing if Kenmark sends invoices
5. **Image Recognition:** OCR on product images as last resort for UPC extraction

---

**Last Updated:** October 19, 2025
**Version:** 1.0
**Backend:** jiecosystem.net
