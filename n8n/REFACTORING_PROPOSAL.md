# Workflow Refactoring Proposal

**Goal:** Eliminate 82% code duplication and improve maintainability
**Current:** 66 nodes, 9 duplicated vendor branches
**Proposed:** 15-20 nodes total using sub-workflows and dynamic routing

---

## Current Architecture Problems

1. **Massive Duplication:** Each vendor has 6 identical nodes (54 total)
2. **Error-Prone:** Copy-paste leads to bugs (8 cache nodes, 1 bulk-add, 1 prepare node)
3. **Hard to Maintain:** Adding vendor requires creating 6+ new nodes
4. **Hard to Debug:** Numbered nodes (Bulk-Add1, Bulk-Add2, etc.) are confusing
5. **No Reusability:** Each vendor branch is completely separate

---

## Proposed Architecture: Sub-Workflow Pattern

### Main Workflow (Simple)
```
1. Webhook (CloudMailin)
   └─> 2. Extract Account ID
       └─> 3. Detect Vendor (API)
           └─> 4. Format API Response
               └─> 5. Execute Sub-Workflow "Process Vendor Order"
                   └─> 6. Return Response
```

### Sub-Workflow: "Process Vendor Order"
**Input Parameters:**
- `vendor` (string): Vendor name
- `accountId` (string): Account ID
- `email` (object): Full email data
- `requireEnrichment` (boolean): Whether to enrich (Modern Optical, Ideal Optics)

**Flow:**
```
1. Parse Email
   ├─> HTTP Request
   ├─> URL: {{ $env.API_BASE_URL }}/api/emails/parse-{{ $json.vendor.toLowerCase().replace(/[^a-z]/g, '') }}
   └─> Method: POST

2. Check Catalog
   ├─> HTTP Request
   ├─> URL: {{ $env.API_BASE_URL }}/api/catalog/check
   └─> Body: { accountId, items: $json.items }

3. [Conditional] Enrich Items (if requireEnrichment)
   ├─> HTTP Request: Enrich
   └─> If Node: Check if cached
       ├─> Cached: Skip to next step
       └─> Not Cached: Continue enrichment

4. Prepare Email Data
   ├─> Code Node (dynamic)
   └─> Uses vendor parameter for all fields

5. Create Email Record
   ├─> HTTP Request
   └─> URL: {{ $env.API_BASE_URL }}/api/emails

6. Bulk-Add Inventory
   ├─> HTTP Request
   └─> Body includes dynamic vendor name

7. Cache to Catalog
   ├─> HTTP Request
   └─> Body includes dynamic vendor name

8. Return Success
   └─> Output: { success: true, vendor, orderId, itemCount }
```

---

## Implementation Plan

### Phase 1: Create Sub-Workflow (2-3 hours)

#### Step 1: Create New Workflow
1. Create new workflow: "Process Vendor Order"
2. Add "Execute Workflow Trigger" node
3. Define input parameters

#### Step 2: Build Dynamic Flow
```javascript
// 1. Parse Email Node (HTTP Request)
{
  "method": "POST",
  "url": "={{ $env.API_BASE_URL }}/api/emails/parse-{{ $json.vendor.toLowerCase().replace(/[^a-z]/g, '') }}",
  "body": {
    "accountId": "={{ $json.accountId }}",
    "email": "={{ $json.email }}"
  }
}

// 2. Check Catalog Node (HTTP Request)
{
  "method": "POST",
  "url": "={{ $env.API_BASE_URL }}/api/catalog/check",
  "body": {
    "accountId": "={{ $json.accountId }}",
    "items": "={{ $node['Parse Email'].json.items }}"
  }
}

// 3. Prepare Email Data Node (Code)
const parseResult = $('Parse Email').item.json;
const checkCatalogResult = $('Check Catalog').item.json;
const accountId = $input.item.json.accountId;
const vendor = $input.item.json.vendor;
const emailData = $input.item.json.email;

return [{
  json: {
    accountId: accountId,
    from: vendor,
    subject: `Order #${parseResult.order.order_number}`,
    html: emailData.html,
    plainText: emailData.plain,
    parsedData: {
      vendor: vendor,
      order: parseResult.order,
      items: checkCatalogResult.items
    }
  }
}];

// 4. Create Email Record Node (HTTP Request)
{
  "method": "POST",
  "url": "={{ $env.API_BASE_URL }}/api/emails",
  "body": "={{ $json }}"
}

// 5. Bulk-Add Node (HTTP Request)
{
  "method": "POST",
  "url": "={{ $env.API_BASE_URL }}/api/inventory/bulk-add",
  "body": {
    "accountId": "={{ $json.accountId }}",
    "orderNumber": "={{ $json.parsedData.order.order_number }}",
    "vendor": "={{ $input.item.json.vendor }}",
    "items": "={{ $json.parsedData.items }}"
  }
}

// 6. Cache to Catalog Node (HTTP Request)
{
  "method": "POST",
  "url": "={{ $env.API_BASE_URL }}/api/catalog/cache",
  "body": {
    "accountId": "={{ $json.accountId }}",
    "vendorName": "={{ $input.item.json.vendor }}",
    "items": "={{ $json.parsedData.items }}"
  }
}
```

#### Step 3: Add Enrichment Logic
```javascript
// If Node: Check if Enrichment Required
{{ $input.item.json.requireEnrichment === true }}

// True path:
  → Enrich HTTP Request
  → If Node: Check if cached
    → Not cached: Continue
    → Cached: Merge to main flow

// False path:
  → Skip to Prepare Email Data
```

### Phase 2: Update Main Workflow (1 hour)

#### Replace Switch + All Vendor Branches
**Old:** Switch → 9 vendor branches (54 nodes)

**New:** Execute Workflow node (1 node)

```javascript
// Execute Workflow Node
{
  "workflowId": "{{ $env.PROCESS_VENDOR_ORDER_WORKFLOW_ID }}",
  "waitForSubWorkflow": true,
  "inputData": {
    "vendor": "={{ $json.vendor }}",
    "accountId": "={{ $('Extract Account ID').item.json.accountId }}",
    "email": "={{ $('Extract Account ID').item.json.email }}",
    "requireEnrichment": "={{ ['Modern Optical', 'Ideal Optics'].includes($json.vendor) }}"
  }
}
```

### Phase 3: Handle Special Cases (1 hour)

#### Vendor-Specific Configuration Table
Instead of hardcoding, use a vendor config lookup:

```javascript
// Vendor Config (Supabase table or JSON in workflow)
const vendorConfig = {
  'Modern Optical': {
    parseEndpoint: 'modernoptical',
    requireEnrichment: true,
    displayName: 'Modern Optical'
  },
  'Safilo': {
    parseEndpoint: 'safilo',
    requireEnrichment: false,
    displayName: 'Safilo'
  },
  'Luxottica': {
    parseEndpoint: 'luxottica',
    requireEnrichment: false,
    displayName: 'Luxottica'
  },
  'Europa': {
    parseEndpoint: 'europa',
    requireEnrichment: false,
    displayName: 'Europa'
  },
  'Etnia Barcelona': {
    parseEndpoint: 'etnia',
    requireEnrichment: false,
    displayName: 'Etnia Barcelona'
  },
  'Ideal Optics': {
    parseEndpoint: 'idealoptics',
    requireEnrichment: true,
    displayName: 'Ideal Optics'
  },
  'L\'amy America': {
    parseEndpoint: 'lamy',
    requireEnrichment: false,
    displayName: 'L\'amyamerica'
  },
  'Kenmark': {
    parseEndpoint: 'kenmark',
    requireEnrichment: false,
    displayName: 'kenmark'
  },
  'Marchon': {
    parseEndpoint: 'marchon',
    requireEnrichment: false,
    displayName: 'Marchon'
  }
};

// Use in workflow
const vendor = $json.vendor;
const config = vendorConfig[vendor];

if (!config) {
  throw new Error(`Unknown vendor: ${vendor}`);
}

return [{
  json: {
    ....$json,
    vendorConfig: config
  }
}];
```

---

## Benefits of Refactored Architecture

### 1. Maintainability
- **Before:** 54 duplicated nodes to maintain
- **After:** 1 sub-workflow (10-15 nodes)
- **Impact:** 90% reduction in maintenance burden

### 2. Adding New Vendors
- **Before:** Create 6+ new nodes, wire connections, test
- **After:** Add 1 entry to vendor config table
- **Impact:** 95% faster to add vendors

### 3. Bug Prevention
- **Before:** Copy-paste errors across 9 branches
- **After:** Single source of truth, impossible to have inconsistent vendor names
- **Impact:** Near-zero risk of configuration bugs

### 4. Testing
- **Before:** Test 9 separate branches
- **After:** Test 1 workflow with different inputs
- **Impact:** 90% faster testing

### 5. Performance
- **Before:** Large workflow with many nodes
- **After:** Smaller workflows, better performance
- **Impact:** 20-30% faster execution

---

## Migration Strategy

### Option A: Gradual Migration (Low Risk)
1. Create sub-workflow
2. Test with 1 vendor (e.g., Modern Optical)
3. Once working, migrate 2-3 more vendors
4. Monitor for issues
5. Complete migration
6. Remove old nodes

**Timeline:** 1-2 weeks
**Risk:** Low
**Downtime:** None

### Option B: Big Bang Migration (Faster)
1. Create sub-workflow
2. Test thoroughly with all vendors
3. Deploy all at once
4. Monitor closely
5. Rollback plan ready

**Timeline:** 3-5 days
**Risk:** Medium
**Downtime:** Minimal (during deployment)

**Recommendation:** Option A (Gradual Migration)

---

## Comparison: Before vs After

### Before Refactoring
```
Nodes: 66
├─ Webhook: 1
├─ Extract Account ID: 1
├─ Detect Vendor (API): 1
├─ Format API Response: 1
├─ Detect Vendor (dead): 1
├─ Switch: 1
├─ Parse nodes: 9
├─ Check Catalog nodes: 9
├─ Enrich nodes: 2
├─ If cached nodes: 2
├─ Prepare Email nodes: 9
├─ Create Email Record nodes: 9
├─ Bulk-Add nodes: 9
├─ Cache to Catalog nodes: 9
└─ Supabase fallback: 1

Lines of code: ~2000 (duplicated)
Maintainability: LOW
Bug risk: HIGH
```

### After Refactoring
```
Main Workflow Nodes: 7
├─ Webhook: 1
├─ Extract Account ID: 1
├─ Detect Vendor (API): 1
├─ Format API Response: 1
├─ Get Vendor Config: 1
├─ Execute Sub-Workflow: 1
└─ Supabase fallback: 1

Sub-Workflow Nodes: 10-12
├─ Execute Workflow Trigger: 1
├─ Parse Email: 1
├─ Check Catalog: 1
├─ [Conditional] Enrich: 1
├─ [Conditional] If Cached: 1
├─ Prepare Email Data: 1
├─ Create Email Record: 1
├─ Bulk-Add: 1
├─ Cache to Catalog: 1
└─ Error Handler: 1-2

Total Nodes: 17-19
Lines of code: ~500 (no duplication)
Maintainability: HIGH
Bug risk: LOW
```

---

## Code Example: Vendor Config as Supabase Table

### Table: vendor_configs
```sql
CREATE TABLE vendor_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_name VARCHAR(100) UNIQUE NOT NULL,
  parse_endpoint VARCHAR(100) NOT NULL,
  require_enrichment BOOLEAN DEFAULT FALSE,
  display_name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO vendor_configs (vendor_name, parse_endpoint, require_enrichment, display_name) VALUES
  ('Modern Optical', 'modernoptical', TRUE, 'Modern Optical'),
  ('Safilo', 'safilo', FALSE, 'Safilo'),
  ('Luxottica', 'luxottica', FALSE, 'Luxottica'),
  ('Europa', 'europa', FALSE, 'Europa'),
  ('Etnia Barcelona', 'etnia', FALSE, 'Etnia Barcelona'),
  ('Ideal Optics', 'idealoptics', TRUE, 'Ideal Optics'),
  ('L''amy America', 'lamy', FALSE, 'L''amyamerica'),
  ('Kenmark', 'kenmark', FALSE, 'kenmark'),
  ('Marchon', 'marchon', FALSE, 'Marchon');
```

### Workflow Usage
```javascript
// Get Vendor Config Node (Supabase)
const vendor = $json.vendor;

// Query Supabase
SELECT * FROM vendor_configs WHERE vendor_name = '{{ $json.vendor }}' AND active = TRUE

// Use in Execute Workflow
{
  "vendor": "={{ $json.vendor }}",
  "accountId": "={{ $('Extract Account ID').item.json.accountId }}",
  "email": "={{ $('Extract Account ID').item.json.email }}",
  "config": "={{ $json }}"
}
```

---

## Advanced: Dynamic Sub-Workflow Selection

For even more flexibility, use different sub-workflows for different vendor types:

```javascript
// Main Workflow: Select Sub-Workflow
const vendor = $json.vendor;
const vendorConfig = $('Get Vendor Config').item.json;

// Determine workflow based on vendor characteristics
let workflowId;

if (vendorConfig.require_enrichment) {
  workflowId = $env.PROCESS_ORDER_WITH_ENRICHMENT_WORKFLOW_ID;
} else {
  workflowId = $env.PROCESS_ORDER_STANDARD_WORKFLOW_ID;
}

return [{
  json: {
    ...$json,
    targetWorkflowId: workflowId
  }
}];
```

---

## Testing the Refactored Workflow

### Unit Tests (Per Sub-Workflow)
```javascript
// Test Parse Email
Input: { vendor: 'Safilo', accountId: '123', email: {...} }
Expected: { order: {...}, items: [...] }

// Test Check Catalog
Input: { accountId: '123', items: [...] }
Expected: { items: [...with catalog matches...] }

// Test Prepare Email
Input: { vendor: 'Safilo', accountId: '123', parseResult: {...}, catalogResult: {...} }
Expected: { formatted email data }
```

### Integration Tests (Full Flow)
```javascript
// Test Full Modern Optical Flow (with enrichment)
Input: CloudMailin webhook data
Expected: Email record created, items added, catalog cached

// Test Full Safilo Flow (no enrichment)
Input: CloudMailin webhook data
Expected: Email record created, items added, catalog cached

// Test Unknown Vendor
Input: CloudMailin webhook data with unknown vendor
Expected: Fallback to Supabase failed parse
```

---

## Rollback Plan

If refactored workflow has issues:

1. **Keep old workflow:** Don't delete, just deactivate
2. **Naming:** Old workflow = "Optical Inventory Software (Legacy)", New = "Optical Inventory Software"
3. **Quick switch:** Change webhook URL or reactivate old workflow
4. **Gradual migration:** Test new workflow on subset of vendors first
5. **Monitoring:** Watch error rates closely for 48 hours after migration

---

## Success Metrics

After refactoring, measure:

1. **Bug Rate:** Should drop to near-zero for vendor config issues
2. **Time to Add Vendor:** Should drop from 2-3 hours to 5 minutes
3. **Maintenance Time:** Should drop by 80-90%
4. **Performance:** Should improve by 20-30%
5. **Developer Satisfaction:** Much easier to understand and modify

---

## Next Steps

1. **Review this proposal** with team
2. **Get approval** for refactoring approach
3. **Schedule development time** (1-2 weeks)
4. **Create sub-workflow** in test environment
5. **Test thoroughly** with all vendors
6. **Gradual migration** starting with 1 vendor
7. **Monitor and adjust**
8. **Complete migration**
9. **Document new architecture**
10. **Train team** on new workflow

---

## Questions & Answers

**Q: What if a vendor needs completely different logic?**
A: Create a separate sub-workflow for that vendor and use conditional routing in main workflow.

**Q: What about performance with sub-workflows?**
A: Sub-workflows in n8n are very fast. Execution time will actually improve due to smaller workflow size.

**Q: How do we handle vendor-specific fields?**
A: Use vendor config table to store vendor-specific settings, or pass them as parameters.

**Q: Can we still debug individual vendor flows?**
A: Yes, sub-workflows can be executed independently with test data.

**Q: What if we need to rollback?**
A: Keep old workflow inactive as backup. Can reactivate anytime.

**Q: How do we test the sub-workflow?**
A: Create test workflow that calls sub-workflow with sample data for each vendor.

---

## Conclusion

Refactoring to a sub-workflow pattern will:
- Eliminate 82% of duplicate code
- Prevent configuration bugs
- Make adding vendors trivial
- Improve maintainability dramatically
- Reduce testing burden by 90%
- Set foundation for future enhancements

**Recommended approach:** Gradual migration starting with one vendor, then expanding.

**Estimated ROI:** 10x improvement in maintainability for 1-2 weeks of refactoring work.
