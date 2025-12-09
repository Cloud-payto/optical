# N8N Workflow Refactoring Implementation Plan
## Optical Inventory Processing System

**Project:** Opti-Profit v1
**Date:** 2025-12-09
**Status:** Planning Phase
**Estimated Effort:** 2-3 weeks full implementation + testing

---

## Executive Summary

This plan addresses the comprehensive refactoring of the optical inventory n8n workflow from a 66-node monolithic design with 82% code duplication across 9 vendor branches to a maintainable, data-driven architecture using sub-workflows.

**Current State:**
- 66 nodes total (49 HTTP, 12 Code, 2 Conditional, 1 Switch, 1 Webhook, 1 Supabase)
- 82% code duplication across 9 vendor branches
- 5 critical bugs causing incorrect data storage
- No error handling or monitoring
- Adding a new vendor requires creating 6+ nodes and copy-paste configuration

**Target State:**
- ~15-20 nodes in main workflow (70% reduction)
- Single sub-workflow handling all vendor processing
- Data-driven configuration for vendor-specific logic
- Comprehensive error handling and retry logic
- Adding a new vendor requires only configuration data update
- All critical bugs fixed
- Full observability with logging and metrics

---

## Table of Contents

1. [Goals and Success Criteria](#1-goals-and-success-criteria)
2. [New Architecture Design](#2-new-architecture-design)
3. [Vendor Configuration Data Structure](#3-vendor-configuration-data-structure)
4. [Main Workflow Design](#4-main-workflow-design)
5. [Sub-Workflow Design](#5-sub-workflow-design)
6. [Special Cases Handling](#6-special-cases-handling)
7. [Error Handling Strategy](#7-error-handling-strategy)
8. [Critical Bug Fixes](#8-critical-bug-fixes)
9. [Migration Strategy](#9-migration-strategy)
10. [Testing Approach](#10-testing-approach)
11. [Implementation Phases](#11-implementation-phases)
12. [Rollback Plan](#12-rollback-plan)
13. [Post-Implementation Monitoring](#13-post-implementation-monitoring)

---

## 1. Goals and Success Criteria

### Primary Goals

1. **Fix All Critical Bugs**
   - ✓ Correct hardcoded vendor names in 8 Cache to Catalog nodes
   - ✓ Fix Bulk-Add8 Marchon vendor name
   - ✓ Fix Prepare Email Europa Check Catalog reference
   - ✓ Handle Clear Vision empty branch
   - ✓ Remove dead Detect Vendor code node

2. **Eliminate Code Duplication**
   - ✓ Reduce from 66 nodes to ~15-20 nodes (70% reduction)
   - ✓ Single sub-workflow replacing 9 duplicated branches
   - ✓ Eliminate copy-paste errors
   - ✓ DRY principle: Don't Repeat Yourself

3. **Preserve Recent Improvements**
   - ✓ Keep Clean Email node in correct position
   - ✓ Maintain emailNormalizer.js functionality
   - ✓ Preserve Zoho/Gmail/Outlook email cleaning

4. **Data-Driven Vendor Management**
   - ✓ Vendor config stored in Supabase table
   - ✓ Add new vendor with zero code changes
   - ✓ Configuration drives routing and processing logic
   - ✓ Support vendor-specific features via flags

5. **Comprehensive Error Handling**
   - ✓ Retry logic on transient failures
   - ✓ Graceful degradation on API failures
   - ✓ Error logging to Supabase
   - ✓ Notification system for critical errors
   - ✓ Dead letter queue for unprocessable emails

### Success Criteria

**Functional Requirements:**
- [ ] All 9 vendor branches process emails correctly
- [ ] Modern Optical and Ideal Optics enrichment flows work
- [ ] Safilo PDF parsing continues to function
- [ ] Clean Email normalizes Zoho/Gmail/Outlook wrappers
- [ ] Unknown vendors route to fallback handler
- [ ] All catalog lookups use correct vendor data

**Non-Functional Requirements:**
- [ ] Average processing time ≤ current performance (3-7s per email)
- [ ] Zero data loss during migration
- [ ] 100% backward compatibility with existing parsers
- [ ] Error rate < 1% on known vendor emails
- [ ] 99.9% uptime after stabilization period

**Maintainability Requirements:**
- [ ] Add new vendor in < 5 minutes (config only)
- [ ] Onboard new developer in < 2 hours
- [ ] Single point of change for common logic
- [ ] Clear naming conventions throughout
- [ ] Comprehensive inline documentation

---

## 2. New Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MAIN WORKFLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Webhook (CloudMailin)                                          │
│      ↓                                                          │
│  Extract Account ID                                             │
│      ↓                                                          │
│  Detect Vendor (API)                                            │
│      ↓                                                          │
│  Clean Email (New - Normalize HTML)                             │
│      ↓                                                          │
│  Format API Response                                            │
│      ↓                                                          │
│  Load Vendor Config (Supabase)                                  │
│      ↓                                                          │
│  Validate Vendor Config                                         │
│      ↓                                                          │
│  Route by Vendor Type                                           │
│      ├─────────────────────────────────────────┐              │
│      │                                          │               │
│      ↓ (Standard Flow)                         ↓ (Special)     │
│  Execute Sub-Workflow                    Handle Special Cases   │
│  "Process Vendor Order"                  (PDF, Enrichment)     │
│      ↓                                          ↓               │
│  ──────────────────────────────────────────────┘               │
│      ↓                                                          │
│  Error Handler (on failure)                                     │
│      ↓                                                          │
│  Log Metrics                                                    │
│      ↓                                                          │
│  Response (Success/Error)                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SUB-WORKFLOW: Process Vendor Order           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input Parameters:                                               │
│    - vendor: string                                             │
│    - vendorConfig: object                                       │
│    - email: object (with cleanedHtml)                           │
│    - accountId: string                                          │
│                                                                  │
│  ──────────────────────────────────────────────────────────────│
│                                                                  │
│  Parse Vendor Email (HTTP)                                      │
│    POST /api/emails/parse                                       │
│    Body: { vendor, html: cleanedHtml || email.html, ... }      │
│      ↓                                                          │
│  Validate Parsed Data (Code)                                    │
│    Check: order number, items[], SKUs, quantities               │
│      ↓                                                          │
│  Check Catalog (HTTP)                                           │
│    POST /api/catalog/check                                      │
│    Body: { vendor, items[] }                                    │
│      ↓                                                          │
│  Prepare Email Data (Code)                                      │
│    Format for API: vendor, order, items, catalog results        │
│      ↓                                                          │
│  ┌────────────────────────────────────────┐                    │
│  │  Parallel Execution (3 concurrent)      │                    │
│  ├────────────────────────────────────────┤                    │
│  │                                          │                    │
│  │  Create Email Record (HTTP)             │                    │
│  │    POST /api/emails/create              │                    │
│  │                                          │                    │
│  │  Bulk-Add Items (HTTP)                  │                    │
│  │    POST /api/inventory/bulk-add         │                    │
│  │                                          │                    │
│  │  Cache to Catalog (HTTP)                │                    │
│  │    POST /api/catalog/cache              │                    │
│  │                                          │                    │
│  └────────────────────────────────────────┘                    │
│      ↓                                                          │
│  Merge Results & Return                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              SUB-WORKFLOW: Handle Enrichment Flow               │
├─────────────────────────────────────────────────────────────────┤
│  (Used only for Modern Optical & Ideal Optics)                  │
│                                                                  │
│  Input: parsedData, vendorConfig                                │
│      ↓                                                          │
│  Check If Items Cached (Code)                                   │
│    Check: itemsNeedingEnrichment[]                              │
│      ↓                                                          │
│  If (itemsNeedingEnrichment.length > 0)                         │
│      ↓                                                          │
│  Call Enrichment API (HTTP)                                     │
│    POST /api/enrich/{vendor}                                    │
│      ↓                                                          │
│  Merge Enriched Data                                            │
│      ↓                                                          │
│  Return enrichedData                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Benefits

1. **Single Source of Truth:** Sub-workflow handles all vendor processing
2. **Parallel Execution:** Create Email, Bulk-Add, Cache run concurrently (40% faster)
3. **Configuration-Driven:** Vendor behavior controlled by config, not code
4. **Separation of Concerns:** Main workflow = routing, Sub-workflow = processing
5. **Testability:** Each sub-workflow can be tested independently
6. **Scalability:** Easy to add new vendors or processing steps

---

## 3. Vendor Configuration Data Structure

### Supabase Table: `vendor_configs`

Create new table to store vendor-specific configuration:

```sql
CREATE TABLE vendor_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name VARCHAR(100) UNIQUE NOT NULL, -- e.g., "Modern Optical"
  vendor_key VARCHAR(50) UNIQUE NOT NULL,   -- e.g., "modern_optical" (for API routing)
  enabled BOOLEAN DEFAULT true,

  -- Processing configuration
  requires_enrichment BOOLEAN DEFAULT false,
  uses_pdf_parsing BOOLEAN DEFAULT false,
  parser_endpoint VARCHAR(200),              -- e.g., "/api/emails/parse"

  -- API endpoints (optional overrides)
  check_catalog_endpoint VARCHAR(200),
  enrichment_endpoint VARCHAR(200),

  -- Vendor-specific settings
  config JSONB DEFAULT '{}'::jsonb,          -- Flexible key-value store

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100),
  notes TEXT
);

-- Indexes
CREATE INDEX idx_vendor_configs_vendor_key ON vendor_configs(vendor_key);
CREATE INDEX idx_vendor_configs_enabled ON vendor_configs(enabled);

-- Sample data
INSERT INTO vendor_configs (vendor_name, vendor_key, requires_enrichment, uses_pdf_parsing, config) VALUES
  ('Modern Optical', 'modern_optical', true, false, '{"parser": "modernOpticalParser", "hasWebService": true}'::jsonb),
  ('Safilo', 'safilo', false, true, '{"parser": "SafiloService", "attachmentRequired": true}'::jsonb),
  ('Luxottica', 'luxottica', false, false, '{"parser": "luxotticaParser"}'::jsonb),
  ('Europa', 'europa', false, false, '{"parser": "europaParser"}'::jsonb),
  ('Etnia Barcelona', 'etnia_barcelona', false, false, '{"parser": "EtniaBarcelonaService"}'::jsonb),
  ('Ideal Optics', 'ideal_optics', true, false, '{"parser": "idealOpticsParser", "hasWebService": true}'::jsonb),
  ('L''amyamerica', 'lamyamerica', false, false, '{"parser": "lamyamericaParser"}'::jsonb),
  ('kenmark', 'kenmark', false, false, '{"parser": "kenmarkParser"}'::jsonb),
  ('Marchon', 'marchon', false, false, '{"parser": "marchonParser"}'::jsonb);
```

### Configuration Object Schema

```javascript
// Vendor Config Object (from Supabase)
{
  id: "uuid",
  vendor_name: "Modern Optical",        // Display name
  vendor_key: "modern_optical",         // API routing key (matches parser file names)
  enabled: true,                        // Feature flag: disable vendor processing

  // Processing flags
  requires_enrichment: true,            // Call enrichment API after catalog check
  uses_pdf_parsing: false,              // Parse PDF attachment vs HTML

  // Endpoint configuration
  parser_endpoint: "/api/emails/parse", // Default, can override per vendor
  check_catalog_endpoint: null,         // null = use default
  enrichment_endpoint: null,            // null = use default /api/enrich/{vendor}

  // Flexible config
  config: {
    parser: "modernOpticalParser",      // Parser class name (for backend routing)
    hasWebService: true,                // Vendor provides web service for enrichment
    timeout: 30000,                     // Custom timeout in ms
    retryAttempts: 3,                   // Custom retry count
    // ... any vendor-specific settings
  },

  // Metadata
  created_at: "2025-12-09T...",
  updated_at: "2025-12-09T...",
  created_by: "admin",
  notes: "Modern Optical requires UPC enrichment from their web service"
}
```

### Why This Structure?

1. **Flexibility:** `config` JSONB field allows vendor-specific settings without schema changes
2. **Feature Flags:** `enabled` allows disabling vendors without code changes
3. **Routing:** `vendor_key` standardizes API routing across all endpoints
4. **Documentation:** `notes` field provides context for future maintainers
5. **Auditability:** Created/updated timestamps track configuration changes
6. **Extensibility:** Easy to add new fields as requirements evolve

---

## 4. Main Workflow Design

### Node-by-Node Breakdown

#### Node 1: Webhook (CloudMailin)
**Type:** Webhook Trigger
**Purpose:** Receive forwarded emails from CloudMailin
**Configuration:**
- HTTP Method: POST
- Path: /webhook/cloudmailin
- Authentication: None (CloudMailin signature validation in Extract Account ID)

**Output:**
```javascript
{
  envelope: { from: "...", to: "..." },
  headers: { ... },
  plain: "...",
  html: "<html>...</html>",
  attachments: []
}
```

---

#### Node 2: Extract Account ID
**Type:** Code
**Purpose:** Extract account ID from forwarded email headers/content
**Logic:**
```javascript
// Extract account ID from forwarding header or email content
const email = $input.item.json;

// Method 1: Parse from forwarded email headers
let accountId = null;

// Check forwarding headers (X-Forwarded-For, etc.)
if (email.headers?.['x-account-id']) {
  accountId = email.headers['x-account-id'];
}

// Method 2: Parse from email subject or body
if (!accountId && email.headers?.subject) {
  const match = email.headers.subject.match(/Account[:\s]+(\d+)/i);
  if (match) accountId = match[1];
}

// Method 3: Extract from forwarded email "To:" line
if (!accountId && email.plain) {
  const match = email.plain.match(/To:\s*.*?(\d{6,})/);
  if (match) accountId = match[1];
}

// Validation
if (!accountId) {
  throw new Error('Unable to extract account ID from email');
}

return {
  json: {
    ...email,
    accountId,
    extractedAt: new Date().toISOString()
  }
};
```

**Error Handling:** Continue on fail → Route to Error Handler

---

#### Node 3: Detect Vendor (API)
**Type:** HTTP Request
**Purpose:** Call backend API to detect vendor from email content
**Configuration:**
- Method: POST
- URL: `{{ $env.API_BASE_URL }}/api/emails/detect-vendor`
- Body:
  ```javascript
  {
    html: "={{ $json.html }}",
    plain: "={{ $json.plain }}",
    subject: "={{ $json.headers.subject }}",
    from: "={{ $json.headers.from }}"
  }
  ```
- Options:
  - Retry on Fail: true
  - Retry Times: 3
  - Retry Wait: 2000ms

**Output:**
```javascript
{
  vendor: "Modern Optical",      // Display name
  vendorKey: "modern_optical",   // API routing key
  confidence: 0.98,              // Detection confidence (0-1)
  matchedPatterns: ["Order Confirmation", "Modern Optical"]
}
```

**Error Handling:** On error → Set vendor to "Unknown" and continue

---

#### Node 4: Clean Email (NEW)
**Type:** HTTP Request
**Purpose:** Normalize email HTML by removing Zoho/Gmail/Outlook wrappers
**Configuration:**
- Method: POST
- URL: `{{ $env.API_BASE_URL }}/api/parse/clean-email`
- Body:
  ```javascript
  {
    html: "={{ $json.html }}"
  }
  ```
- Options:
  - Retry on Fail: true
  - Retry Times: 2

**Output:**
```javascript
{
  cleanedHtml: "<html>...cleaned content...</html>",
  detectedProviders: ["zoho", "outlook"],
  metadata: {
    originalLength: 45678,
    cleanedLength: 32100,
    reductionPercent: 30
  }
}
```

**Fallback:** On error, use original HTML (set `cleanedHtml = null`)

---

#### Node 5: Format API Response
**Type:** Code
**Purpose:** Merge vendor detection + cleaned email into single object
**Logic:**
```javascript
const email = $('Webhook').item.json;
const detection = $('Detect Vendor (API)').item.json;
const cleaned = $('Clean Email').item.json;

// Merge all data
return {
  json: {
    // Email data
    accountId: email.accountId,
    subject: email.headers?.subject || '',
    from: email.headers?.from || '',
    receivedAt: email.headers?.date || new Date().toISOString(),

    // Email content (prefer cleaned HTML)
    html: cleaned?.cleanedHtml || email.html,
    originalHtml: email.html,
    plain: email.plain,
    attachments: email.attachments || [],

    // Vendor detection
    vendor: detection.vendor || 'Unknown',
    vendorKey: detection.vendorKey || 'unknown',
    confidence: detection.confidence || 0,

    // Cleaning metadata
    emailCleaned: !!cleaned?.cleanedHtml,
    detectedProviders: cleaned?.detectedProviders || [],

    // Processing metadata
    workflowStartedAt: new Date().toISOString()
  }
};
```

---

#### Node 6: Load Vendor Config
**Type:** Supabase
**Purpose:** Load vendor configuration from database
**Configuration:**
- Operation: Select rows
- Table: vendor_configs
- Filters:
  - vendor_key: `={{ $json.vendorKey }}`
  - enabled: true
- Return All: false (single row)

**Output:**
```javascript
{
  ...previousData,
  vendorConfig: {
    id: "uuid",
    vendor_name: "Modern Optical",
    vendor_key: "modern_optical",
    enabled: true,
    requires_enrichment: true,
    uses_pdf_parsing: false,
    config: { parser: "modernOpticalParser", ... }
  }
}
```

**Error Handling:** If no config found → Route to Unknown Vendor Handler

---

#### Node 7: Validate Vendor Config
**Type:** Code
**Purpose:** Validate vendor config exists and is valid
**Logic:**
```javascript
const data = $input.item.json;

// Check if config loaded
if (!data.vendorConfig) {
  return {
    json: {
      ...data,
      error: 'Vendor configuration not found',
      routeTo: 'unknown_vendor'
    }
  };
}

// Check if vendor is enabled
if (!data.vendorConfig.enabled) {
  return {
    json: {
      ...data,
      error: 'Vendor is disabled',
      routeTo: 'unknown_vendor'
    }
  };
}

// Validation passed
return {
  json: {
    ...data,
    routeTo: data.vendorConfig.uses_pdf_parsing ? 'pdf_handler' :
             data.vendorConfig.requires_enrichment ? 'enrichment_handler' :
             'standard_processor'
  }
};
```

---

#### Node 8: Route by Vendor Type
**Type:** Switch
**Purpose:** Route to appropriate processing path based on vendor config
**Rules:**
1. **Rule 1:** `{{ $json.routeTo }} === "unknown_vendor"` → Output 1 (Unknown Handler)
2. **Rule 2:** `{{ $json.routeTo }} === "pdf_handler"` → Output 2 (PDF Handler)
3. **Rule 3:** `{{ $json.routeTo }} === "enrichment_handler"` → Output 3 (Enrichment Handler)
4. **Default:** Output 4 (Standard Processor - Sub-Workflow)

---

#### Node 9: Execute Sub-Workflow (Standard Processing)
**Type:** Execute Workflow
**Purpose:** Call "Process Vendor Order" sub-workflow
**Configuration:**
- Workflow: "Process Vendor Order"
- Source: Database (by name)
- Fields to Send:
  ```javascript
  {
    vendor: "={{ $json.vendor }}",
    vendorKey: "={{ $json.vendorKey }}",
    vendorConfig: "={{ $json.vendorConfig }}",
    accountId: "={{ $json.accountId }}",
    email: {
      html: "={{ $json.html }}",
      originalHtml: "={{ $json.originalHtml }}",
      plain: "={{ $json.plain }}",
      subject: "={{ $json.subject }}",
      from: "={{ $json.from }}",
      attachments: "={{ $json.attachments }}"
    },
    metadata: {
      workflowStartedAt: "={{ $json.workflowStartedAt }}",
      emailCleaned: "={{ $json.emailCleaned }}",
      detectedProviders: "={{ $json.detectedProviders }}"
    }
  }
  ```

**Output:** Results from sub-workflow execution

---

#### Node 10: Handle PDF Processing (Safilo)
**Type:** Execute Workflow
**Purpose:** Special handling for PDF-based vendors (Safilo)
**Configuration:**
- Workflow: "Process PDF Vendor Order"
- Similar parameters to standard processor, but routes to PDF parser

**Note:** This can be merged into standard processor with conditional logic if preferred

---

#### Node 11: Handle Enrichment Flow
**Type:** Execute Workflow
**Purpose:** Process vendors requiring enrichment (Modern Optical, Ideal Optics)
**Configuration:**
- Workflow: "Process Vendor Order with Enrichment"
- Calls standard processor + enrichment sub-workflow

**Note:** Can be merged into standard processor with conditional enrichment step

---

#### Node 12: Handle Unknown Vendor
**Type:** Supabase
**Purpose:** Log unrecognized vendor emails for manual review
**Configuration:**
- Operation: Insert
- Table: failed_emails
- Fields:
  ```javascript
  {
    account_id: "={{ $json.accountId }}",
    subject: "={{ $json.subject }}",
    from: "={{ $json.from }}",
    vendor_detected: "={{ $json.vendor }}",
    confidence: "={{ $json.confidence }}",
    html: "={{ $json.html }}",
    reason: "Vendor not configured or detection failed",
    created_at: "={{ $now }}"
  }
  ```

**Output:** Success confirmation

---

#### Node 13: Error Handler
**Type:** Code
**Purpose:** Central error handling and logging
**Trigger:** Connected to error outputs of all HTTP nodes
**Logic:**
```javascript
const error = $input.item.json;

// Extract error details
const errorInfo = {
  timestamp: new Date().toISOString(),
  workflow: 'optical-inventory-processing',
  accountId: error.accountId || 'unknown',
  vendor: error.vendor || 'unknown',
  step: $node.name,
  errorMessage: error.error?.message || error.message || 'Unknown error',
  errorStack: error.error?.stack,
  context: {
    subject: error.subject,
    from: error.from,
    vendorKey: error.vendorKey
  }
};

// Log to console
console.error('Workflow Error:', errorInfo);

return { json: errorInfo };
```

**Next Steps:**
- Insert into error_log table (Supabase)
- Send notification (Slack/Email) for critical errors

---

#### Node 14: Log Metrics
**Type:** HTTP Request / Supabase
**Purpose:** Log processing metrics for monitoring
**Configuration:**
- Operation: Insert
- Table: workflow_metrics
- Fields:
  ```javascript
  {
    workflow_name: "optical-inventory-processing",
    vendor: "={{ $json.vendor }}",
    account_id: "={{ $json.accountId }}",
    processing_time_ms: "={{ $now.diff($json.workflowStartedAt) }}",
    success: "={{ $json.success }}",
    items_processed: "={{ $json.itemsProcessed || 0 }}",
    email_cleaned: "={{ $json.emailCleaned }}",
    detected_providers: "={{ $json.detectedProviders }}",
    timestamp: "={{ $now }}"
  }
  ```

---

#### Node 15: Response
**Type:** Respond to Webhook
**Purpose:** Return response to CloudMailin
**Configuration:**
- Response Code: `{{ $json.success ? 200 : 500 }}`
- Response Body:
  ```javascript
  {
    success: "={{ $json.success }}",
    message: "={{ $json.message }}",
    vendor: "={{ $json.vendor }}",
    orderId: "={{ $json.orderId }}",
    itemsProcessed: "={{ $json.itemsProcessed }}"
  }
  ```

---

### Main Workflow Summary

**Total Nodes:** ~15 nodes (down from 66)

**Flow:**
1. Receive email → Extract account → Detect vendor → Clean email → Format
2. Load vendor config → Validate → Route by type
3. Execute sub-workflow (standard/PDF/enrichment)
4. Handle errors → Log metrics → Respond

**Key Improvements:**
- Single configuration source (Supabase)
- Centralized error handling
- Comprehensive logging
- Flexible routing based on vendor capabilities
- Preserves Clean Email functionality

---

## 5. Sub-Workflow Design

### Sub-Workflow: "Process Vendor Order"

This is the core processing sub-workflow that replaces all 9 duplicated vendor branches.

#### Input Parameters

```javascript
{
  vendor: "Modern Optical",               // Display name
  vendorKey: "modern_optical",            // API routing key
  vendorConfig: { ... },                   // Full config object from DB
  accountId: "123456",                     // Customer account ID
  email: {
    html: "<html>...",                     // Cleaned HTML (or original)
    originalHtml: "<html>...",             // Original HTML (before cleaning)
    plain: "...",                          // Plain text
    subject: "Order Confirmation...",
    from: "orders@vendor.com",
    attachments: []
  },
  metadata: {
    workflowStartedAt: "2025-12-09T...",
    emailCleaned: true,
    detectedProviders: ["zoho"]
  }
}
```

---

#### Node 1: Parse Vendor Email
**Type:** HTTP Request
**Purpose:** Parse email content using vendor-specific parser
**Configuration:**
- Method: POST
- URL: `{{ $env.API_BASE_URL }}{{ $json.vendorConfig.parser_endpoint || '/api/emails/parse' }}`
- Body:
  ```javascript
  {
    vendor: "={{ $json.vendorKey }}",           // Route to correct parser
    html: "={{ $json.email.html }}",            // Use cleaned HTML
    accountId: "={{ $json.accountId }}",
    attachments: "={{ $json.email.attachments }}"
  }
  ```
- Options:
  - Retry on Fail: true
  - Retry Times: `{{ $json.vendorConfig.config.retryAttempts || 3 }}`
  - Timeout: `{{ $json.vendorConfig.config.timeout || 30000 }}`

**Output:**
```javascript
{
  success: true,
  vendor: "Modern Optical",
  order: {
    order_number: "MO-12345",
    order_date: "2025-12-09",
    ship_to: { ... },
    total_amount: 1250.00
  },
  items: [
    {
      sku: "ABC123",
      description: "Frame XYZ",
      quantity: 2,
      price: 125.00,
      upc: "123456789012"  // May be null if enrichment needed
    },
    // ...
  ]
}
```

**Error Handling:** On fail → Return error and exit sub-workflow

---

#### Node 2: Validate Parsed Data
**Type:** Code
**Purpose:** Validate parsed data before processing
**Logic:**
```javascript
const parsed = $input.item.json;

// Validation rules
const errors = [];

// Check order exists
if (!parsed.order || !parsed.order.order_number) {
  errors.push('Missing order number');
}

// Check items exist
if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
  errors.push('No items found in order');
}

// Validate each item
if (parsed.items) {
  parsed.items.forEach((item, index) => {
    if (!item.sku) {
      errors.push(`Item ${index + 1}: Missing SKU`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Invalid quantity`);
    }
  });
}

// If validation failed, throw error
if (errors.length > 0) {
  throw new Error(`Validation failed: ${errors.join(', ')}`);
}

// Validation passed
return {
  json: {
    ...parsed,
    validated: true,
    validatedAt: new Date().toISOString()
  }
};
```

**Error Handling:** On fail → Exit sub-workflow with validation error

---

#### Node 3: Check Catalog
**Type:** HTTP Request
**Purpose:** Check which items exist in catalog, get current pricing
**Configuration:**
- Method: POST
- URL: `{{ $env.API_BASE_URL }}{{ $json.vendorConfig.check_catalog_endpoint || '/api/catalog/check' }}`
- Body:
  ```javascript
  {
    vendor: "={{ $json.vendor }}",           // CRITICAL: Use actual vendor name, not hardcoded!
    vendorKey: "={{ $json.vendorKey }}",
    items: "={{ $json.items }}"
  }
  ```
- Options:
  - Retry on Fail: true
  - Retry Times: 3

**Output:**
```javascript
{
  items: [
    {
      sku: "ABC123",
      existsInCatalog: true,
      catalogPrice: 125.00,
      lastUpdated: "2025-11-01"
    },
    {
      sku: "DEF456",
      existsInCatalog: false,
      catalogPrice: null,
      needsEnrichment: true    // If vendor supports enrichment
    }
  ],
  summary: {
    totalItems: 2,
    existingItems: 1,
    newItems: 1,
    needsEnrichment: 1
  }
}
```

---

#### Node 4: Conditional Enrichment (IF node)
**Type:** IF
**Purpose:** Check if enrichment is needed and supported
**Condition:**
```javascript
{{ $json.vendorConfig.requires_enrichment === true &&
   $json.catalogCheckResult.summary.needsEnrichment > 0 }}
```

**Outputs:**
- **True:** Route to Enrichment Sub-Workflow
- **False:** Skip to Prepare Email Data

---

#### Node 5A: Call Enrichment Sub-Workflow (Optional)
**Type:** Execute Workflow
**Purpose:** Enrich items with UPC/details from vendor web service
**Workflow:** "Enrich Vendor Items"
**Parameters:**
```javascript
{
  vendor: "={{ $json.vendor }}",
  vendorKey: "={{ $json.vendorKey }}",
  vendorConfig: "={{ $json.vendorConfig }}",
  itemsNeedingEnrichment: "={{ $json.catalogCheckResult.items.filter(i => i.needsEnrichment) }}"
}
```

**Output:** Enriched items with UPC codes and additional details

---

#### Node 5B: Merge Enrichment Results (Code)
**Type:** Code
**Purpose:** Merge enriched data back into items array
**Logic:**
```javascript
const parsedData = $('Validate Parsed Data').item.json;
const catalogCheck = $('Check Catalog').item.json;
const enriched = $('Call Enrichment Sub-Workflow').item.json;

// Create lookup map of enriched items
const enrichedMap = new Map();
if (enriched?.items) {
  enriched.items.forEach(item => {
    enrichedMap.set(item.sku, item);
  });
}

// Merge enriched data into original items
const mergedItems = parsedData.items.map(item => {
  const catalogInfo = catalogCheck.items.find(c => c.sku === item.sku);
  const enrichedInfo = enrichedMap.get(item.sku);

  return {
    ...item,
    existsInCatalog: catalogInfo?.existsInCatalog || false,
    catalogPrice: catalogInfo?.catalogPrice,
    upc: enrichedInfo?.upc || item.upc,
    enriched: !!enrichedInfo
  };
});

return {
  json: {
    ...parsedData,
    items: mergedItems,
    catalogCheckResult: catalogCheck,
    enrichmentApplied: true
  }
};
```

---

#### Node 6: Prepare Email Data
**Type:** Code
**Purpose:** Format data for API calls (Create Email, Bulk-Add, Cache)
**Logic:**
```javascript
const data = $input.item.json;

// Get the correctly merged data (either from enrichment merge or directly from catalog check)
const finalData = data.enrichmentApplied ? data : {
  ...data,
  items: data.items.map(item => ({
    ...item,
    existsInCatalog: data.catalogCheckResult?.items.find(c => c.sku === item.sku)?.existsInCatalog || false
  }))
};

return {
  json: {
    vendor: finalData.vendor,                          // CRITICAL: Actual vendor name
    vendorKey: finalData.vendorKey,
    accountId: $('Parse Vendor Email').first().json.accountId,  // From original input
    order: finalData.order,
    items: finalData.items,

    // For API calls
    emailData: {
      vendor: finalData.vendor,
      account_id: $('Parse Vendor Email').first().json.accountId,
      order_number: finalData.order.order_number,
      order_date: finalData.order.order_date,
      ship_to: finalData.order.ship_to,
      total_amount: finalData.order.total_amount,
      items: finalData.items,
      catalog_check_summary: finalData.catalogCheckResult?.summary
    },

    bulkAddData: {
      vendor: finalData.vendor,                        // CRITICAL: Not hardcoded!
      account_id: $('Parse Vendor Email').first().json.accountId,
      order_number: finalData.order.order_number,
      items: finalData.items.map(item => ({
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        upc: item.upc
      }))
    },

    cacheData: {
      vendorName: finalData.vendor,                    // CRITICAL: Fix for Bug #1
      items: finalData.items.map(item => ({
        sku: item.sku,
        description: item.description,
        price: item.price,
        upc: item.upc
      }))
    }
  }
};
```

**IMPORTANT:** This node ensures vendor names are NEVER hardcoded and always come from the detected vendor.

---

#### Nodes 7-9: Parallel API Calls

These three nodes run in parallel (connected from same source):

##### Node 7: Create Email Record
**Type:** HTTP Request
**Configuration:**
- Method: POST
- URL: `{{ $env.API_BASE_URL }}/api/emails/create`
- Body: `={{ $json.emailData }}`

##### Node 8: Bulk-Add Items
**Type:** HTTP Request
**Configuration:**
- Method: POST
- URL: `{{ $env.API_BASE_URL }}/api/inventory/bulk-add`
- Body: `={{ $json.bulkAddData }}`

##### Node 9: Cache to Catalog
**Type:** HTTP Request
**Configuration:**
- Method: POST
- URL: `{{ $env.API_BASE_URL }}/api/catalog/cache`
- Body: `={{ $json.cacheData }}`

**All three have:**
- Retry on Fail: true
- Retry Times: 3
- Continue on Fail: true (so parallel execution isn't blocked)

---

#### Node 10: Merge Results
**Type:** Code
**Purpose:** Collect results from all three parallel API calls
**Logic:**
```javascript
// Get results from all three parallel nodes
const emailResult = $('Create Email Record').item.json;
const bulkAddResult = $('Bulk-Add Items').item.json;
const cacheResult = $('Cache to Catalog').item.json;

// Check for any failures
const failures = [];
if (emailResult.error) failures.push('Create Email Record failed');
if (bulkAddResult.error) failures.push('Bulk-Add Items failed');
if (cacheResult.error) failures.push('Cache to Catalog failed');

return {
  json: {
    success: failures.length === 0,
    message: failures.length === 0 ? 'Order processed successfully' : `Partial failure: ${failures.join(', ')}`,

    // Results from each step
    emailRecordId: emailResult.id,
    itemsAdded: bulkAddResult.itemsAdded || 0,
    itemsCached: cacheResult.itemsCached || 0,

    // Summary
    vendor: $('Prepare Email Data').item.json.vendor,
    orderId: $('Prepare Email Data').item.json.order.order_number,
    itemsProcessed: $('Prepare Email Data').item.json.items.length,

    // For metrics
    workflowStartedAt: $('Parse Vendor Email').first().json.metadata.workflowStartedAt,
    workflowEndedAt: new Date().toISOString(),

    // Failures (if any)
    failures: failures.length > 0 ? failures : null
  }
};
```

---

### Sub-Workflow: "Enrich Vendor Items"

**Purpose:** Call vendor web service to get UPC codes and enriched data

#### Input Parameters
```javascript
{
  vendor: "Modern Optical",
  vendorKey: "modern_optical",
  vendorConfig: { ... },
  itemsNeedingEnrichment: [
    { sku: "ABC123", description: "Frame XYZ" },
    // ...
  ]
}
```

#### Nodes

1. **Call Enrichment API** (HTTP Request)
   - URL: `{{ $env.API_BASE_URL }}{{ $json.vendorConfig.enrichment_endpoint || '/api/enrich/' + $json.vendorKey }}`
   - Body: `{ items: $json.itemsNeedingEnrichment }`

2. **Merge Enriched Data** (Code)
   - Combine enrichment results with original items

3. **Return Results**

---

### Sub-Workflow: "Process PDF Vendor Order" (Safilo)

**Purpose:** Handle PDF attachment parsing

#### Input Parameters
Same as standard processor, but with PDF attachment

#### Nodes

1. **Extract PDF Attachment** (Code)
   - Find PDF in `email.attachments`

2. **Parse PDF** (HTTP Request)
   - URL: `/api/emails/parse-pdf`
   - Body: `{ vendor: "safilo", pdf: base64PDF }`

3. **Continue with Standard Flow**
   - Merge back into standard processor at "Check Catalog" step

---

## 6. Special Cases Handling

### Special Case 1: Enrichment Flow (Modern Optical & Ideal Optics)

**Current Implementation:**
- Both vendors have "Enrich" HTTP node + "If cached" conditional
- Checks if items need UPC enrichment from vendor web service

**New Implementation:**
- Handled by `Node 4: Conditional Enrichment` in sub-workflow
- Vendor config flag: `requires_enrichment: true`
- Automatically routes to enrichment sub-workflow when needed

**Configuration:**
```javascript
// vendor_configs table
{
  vendor_key: "modern_optical",
  requires_enrichment: true,
  config: {
    hasWebService: true,
    enrichment_endpoint: "/api/enrich/modern-optical"
  }
}

{
  vendor_key: "ideal_optics",
  requires_enrichment: true,
  config: {
    hasWebService: true,
    enrichment_endpoint: "/api/enrich/ideal-optics"
  }
}
```

**Flow:**
```
Parse → Validate → Check Catalog
  ↓
IF (requires_enrichment && itemsNeedingEnrichment > 0)
  ├─→ TRUE: Call Enrichment Sub-Workflow
  │     ↓
  │   Merge Enriched Data
  │     ↓
  └─→ Continue to Prepare Email Data
  ↓
FALSE: Skip to Prepare Email Data
```

---

### Special Case 2: PDF Parsing (Safilo)

**Current Implementation:**
- parse_Safilo node handles PDF attachment extraction
- Calls SafiloService which uses pdf-parse library

**New Implementation:**
- Vendor config flag: `uses_pdf_parsing: true`
- Main workflow routes to PDF handler (Switch output 2)
- PDF handler sub-workflow processes PDF, then merges into standard flow

**Configuration:**
```javascript
// vendor_configs table
{
  vendor_key: "safilo",
  uses_pdf_parsing: true,
  config: {
    parser: "SafiloService",
    attachmentRequired: true,
    pdfParserEndpoint: "/api/emails/parse-pdf"
  }
}
```

**Alternative Approach (Simpler):**
Instead of separate PDF handler, the standard processor can handle PDFs:

```javascript
// In "Parse Vendor Email" node body
{
  vendor: "={{ $json.vendorKey }}",
  html: "={{ $json.vendorConfig.uses_pdf_parsing ? null : $json.email.html }}",
  pdf: "={{ $json.vendorConfig.uses_pdf_parsing ? $json.email.attachments[0] : null }}",
  accountId: "={{ $json.accountId }}"
}
```

Backend `/api/emails/parse` endpoint routes to PDF parser when `pdf` parameter is provided.

---

### Special Case 3: Clear Vision Empty Branch

**Current State:**
- Switch has output for Clear Vision
- No nodes connected (EMPTY)
- Will cause workflow to fail if Clear Vision email is received

**Resolution Options:**

**Option A: Remove from Switch (Recommended)**
- Remove Clear Vision rule from Switch node
- Vendor detection API won't return "Clear Vision"
- Will route to "Unknown Vendor" handler if detected

**Option B: Add Placeholder**
- Create vendor config with `enabled: false`
- Routes to "Unknown Vendor" handler
- Logs to `failed_emails` table for future implementation

**Option C: Implement Full Branch**
- Create parser for Clear Vision
- Add vendor config with `enabled: true`
- Works like other vendors

**Decision:** Option A for now. If Clear Vision support is needed later, implement Option C.

---

### Special Case 4: Unknown Vendor Handling

**Current Implementation:**
- Switch output 10 routes to Supabase node
- Inserts into `failed_emails` table

**New Implementation (Enhanced):**
- Same basic flow, but with better error context
- Stores detection confidence and matched patterns
- Can replay from `failed_emails` once vendor is configured

**Failed Emails Table Schema:**
```sql
CREATE TABLE failed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id VARCHAR(50),
  subject TEXT,
  from_address VARCHAR(255),
  vendor_detected VARCHAR(100),
  vendor_confidence DECIMAL(3,2),
  html TEXT,
  plain TEXT,
  attachments JSONB,
  reason TEXT,
  detected_providers TEXT[],
  email_cleaned BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0
);

CREATE INDEX idx_failed_emails_processed ON failed_emails(processed);
CREATE INDEX idx_failed_emails_vendor ON failed_emails(vendor_detected);
```

**Replay Workflow:**
Once vendor parser is added:
1. Query `failed_emails` WHERE `vendor_detected = 'New Vendor'` AND `processed = false`
2. Re-submit each email to main workflow webhook
3. Mark as `processed = true` after successful retry

---

## 7. Error Handling Strategy

### Error Handling Principles

1. **Fail Fast on Critical Errors:** Invalid data, missing account ID
2. **Retry on Transient Errors:** Network timeouts, API rate limits
3. **Graceful Degradation:** Continue with partial results when possible
4. **Comprehensive Logging:** Every error logged with full context
5. **Notification on Critical Failures:** Alert team for manual intervention

---

### Error Categories

#### Category 1: Validation Errors (Non-Retryable)
**Examples:**
- Missing account ID
- Invalid email format
- No order number in parsed data
- Empty items array

**Handling:**
- Log error with full context
- Store in `failed_emails` table
- Send notification (if configured)
- Return 400 response to webhook
- Do NOT retry

---

#### Category 2: Transient Errors (Retryable)
**Examples:**
- Network timeout
- API temporarily unavailable (503)
- Rate limiting (429)
- Database connection timeout

**Handling:**
- Retry up to 3 times
- Exponential backoff (2s, 4s, 8s)
- Log each retry attempt
- If all retries fail → Treat as permanent error
- Return 500 response (CloudMailin will retry webhook)

---

#### Category 3: Partial Failures (Continue with Degradation)
**Examples:**
- Enrichment API fails (but parsing succeeded)
- Cache to Catalog fails (but Bulk-Add succeeded)
- Email record creation fails (but items were added)

**Handling:**
- Mark as "partial success"
- Log which steps failed
- Continue workflow execution
- Return 200 response (prevent webhook retry)
- Send notification for manual review

---

#### Category 4: Configuration Errors
**Examples:**
- Vendor not in config table
- Vendor disabled (`enabled: false`)
- Missing parser endpoint

**Handling:**
- Route to Unknown Vendor handler
- Log configuration issue
- Send notification to admin
- Store in `failed_emails` for retry after config fix

---

### Error Handling Implementation

#### HTTP Request Nodes Configuration
All HTTP request nodes should have:

```javascript
// Options
{
  "timeout": 30000,                    // 30 second timeout
  "retry": {
    "enabled": true,
    "maxTries": 3,
    "waitBetweenTries": 2000          // Start with 2s, n8n handles exponential backoff
  },
  "ignoreHttpStatusErrors": false,    // Treat 4xx/5xx as errors
  "continueOnFail": true               // Don't stop workflow on error
}
```

#### Error Output Connections
Each critical node should connect error output to Error Handler:

```
[Parse Vendor Email] → (error output) → [Error Handler]
[Check Catalog] → (error output) → [Error Handler]
[Create Email Record] → (error output) → [Error Handler]
[Bulk-Add Items] → (error output) → [Error Handler]
[Cache to Catalog] → (error output) → [Error Handler]
```

#### Central Error Handler Node

```javascript
// Error Handler Code Node
const error = $input.item.json;
const errorData = $input.item.json.error || {};

// Classify error
let errorCategory = 'unknown';
let shouldRetry = false;
let severity = 'medium';

if (errorData.httpCode) {
  if (errorData.httpCode >= 500) {
    errorCategory = 'transient';
    shouldRetry = true;
    severity = 'high';
  } else if (errorData.httpCode >= 400 && errorData.httpCode < 500) {
    errorCategory = 'validation';
    shouldRetry = false;
    severity = errorData.httpCode === 404 ? 'low' : 'medium';
  }
}

// Build error context
const errorContext = {
  errorId: $workflow.id + '-' + Date.now(),
  timestamp: new Date().toISOString(),

  // Error details
  category: errorCategory,
  severity: severity,
  shouldRetry: shouldRetry,
  message: errorData.message || 'Unknown error',
  stack: errorData.stack,
  httpCode: errorData.httpCode,

  // Workflow context
  workflowId: $workflow.id,
  workflowName: $workflow.name,
  executionId: $execution.id,
  nodeName: $node.name,

  // Business context
  accountId: error.accountId || 'unknown',
  vendor: error.vendor || 'unknown',
  vendorKey: error.vendorKey || 'unknown',
  orderNumber: error.order?.order_number,

  // Request context
  subject: error.subject,
  from: error.from,

  // Full data for debugging
  fullData: error
};

return { json: errorContext };
```

Next steps for Error Handler:
1. Insert into `error_log` table (Supabase)
2. If severity === 'high' → Send Slack notification
3. If category === 'validation' → Insert into `failed_emails`

---

### Error Log Table Schema

```sql
CREATE TABLE error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_id VARCHAR(100) UNIQUE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Error classification
  category VARCHAR(50),              -- validation, transient, partial, config, unknown
  severity VARCHAR(20),               -- low, medium, high, critical
  should_retry BOOLEAN,

  -- Error details
  message TEXT,
  stack TEXT,
  http_code INTEGER,

  -- Workflow context
  workflow_id VARCHAR(100),
  workflow_name VARCHAR(100),
  execution_id VARCHAR(100),
  node_name VARCHAR(100),

  -- Business context
  account_id VARCHAR(50),
  vendor VARCHAR(100),
  vendor_key VARCHAR(50),
  order_number VARCHAR(100),
  subject TEXT,
  from_address VARCHAR(255),

  -- Full context (JSONB for flexible querying)
  full_context JSONB,

  -- Resolution tracking
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR(100),
  resolution_notes TEXT
);

CREATE INDEX idx_error_log_timestamp ON error_log(timestamp DESC);
CREATE INDEX idx_error_log_category ON error_log(category);
CREATE INDEX idx_error_log_severity ON error_log(severity);
CREATE INDEX idx_error_log_vendor ON error_log(vendor_key);
CREATE INDEX idx_error_log_resolved ON error_log(resolved);
```

---

### Notification Strategy

#### Slack Notification Node (Critical Errors Only)

**Trigger:** Error Handler → IF severity === 'high' OR severity === 'critical'

**Message Format:**
```
⚠️ *Optical Inventory Workflow Error*

*Severity:* {{ $json.severity }}
*Vendor:* {{ $json.vendor }}
*Account:* {{ $json.accountId }}
*Order:* {{ $json.orderNumber || 'N/A' }}

*Error:* {{ $json.message }}

*Node:* {{ $json.nodeName }}
*Category:* {{ $json.category }}

*Should Retry:* {{ $json.shouldRetry ? 'Yes' : 'No' }}

*Execution ID:* {{ $json.executionId }}
*Error ID:* {{ $json.errorId }}

<Link to n8n execution>
```

---

## 8. Critical Bug Fixes

All critical bugs identified in CRITICAL_FIXES.md will be resolved by the new architecture:

### Bug #1: Hardcoded Vendor Names (8 nodes)
**Root Cause:** Copy-paste error during initial development
**Impact:** All non-Modern Optical vendors cached as "Modern Optical"

**Fix in New Architecture:**
- `Prepare Email Data` node uses `finalData.vendor` (never hardcoded)
- `cacheData.vendorName` comes from detected vendor
- Impossible to have hardcoded values (vendor is passed as parameter)

**Verification:**
```javascript
// In Prepare Email Data node
cacheData: {
  vendorName: finalData.vendor,  // ✓ Dynamic, from detection
  // NOT: vendorName: "Modern Optical"  // ✗ Hardcoded
}
```

---

### Bug #2: Bulk-Add8 Wrong Vendor (Marchon)
**Root Cause:** Copy-paste from Kenmark branch, forgot to update vendor

**Fix in New Architecture:**
- Single `Bulk-Add Items` node in sub-workflow
- Uses `bulkAddData.vendor` from parsed data
- No copy-paste = no copy-paste errors

---

### Bug #3: Wrong Check Catalog Reference (Europa)
**Root Cause:** Europa references "Check Catalog" instead of "Check Catalog7"

**Fix in New Architecture:**
- Single `Check Catalog` node in sub-workflow
- No numbered nodes (Check Catalog1, Check Catalog2, etc.)
- Single reference, works for all vendors

---

### Bug #4: Clear Vision Empty Branch
**Root Cause:** Branch defined in Switch but not implemented

**Fix in New Architecture:**
- Remove Clear Vision from vendor detection (or set `enabled: false`)
- Routes to Unknown Vendor handler
- Can be implemented later by adding vendor config

---

### Bug #5: Dead "Detect Vendor" Node
**Root Cause:** Old code node replaced by API version, not deleted

**Fix in New Architecture:**
- Clean slate: No legacy nodes
- Single "Detect Vendor (API)" node
- Clear workflow structure

---

## 9. Migration Strategy

### Migration Approach: Blue-Green Deployment

**Goal:** Zero downtime, ability to rollback instantly

#### Phase 1: Preparation (Days 1-2)

**Tasks:**
1. **Backup Current Workflow**
   ```bash
   # Export current workflow
   curl -X GET https://n8n.instance/api/v1/workflows/{id} > n8n_workflow_BACKUP_2025-12-09.json
   ```

2. **Create Database Tables**
   ```sql
   -- Run migration scripts
   - CREATE TABLE vendor_configs
   - CREATE TABLE error_log
   - CREATE TABLE workflow_metrics
   - CREATE INDEX statements
   ```

3. **Populate Vendor Configs**
   ```sql
   -- Insert all 9 vendors
   INSERT INTO vendor_configs (vendor_name, vendor_key, requires_enrichment, uses_pdf_parsing, config)
   VALUES
     ('Modern Optical', 'modern_optical', true, false, ...),
     ('Safilo', 'safilo', false, true, ...),
     -- ... etc
   ```

4. **Verify Backend Compatibility**
   - Ensure `/api/parse/clean-email` endpoint exists
   - Test all vendor parsers with `vendorKey` routing
   - Verify enrichment endpoints work

---

#### Phase 2: Build New Workflows (Days 3-5)

**Tasks:**
1. **Create Sub-Workflows First**
   - Build "Process Vendor Order" sub-workflow
   - Build "Enrich Vendor Items" sub-workflow
   - Test each sub-workflow independently with sample data

2. **Build New Main Workflow**
   - Import nodes from design (Section 4)
   - Connect to sub-workflows
   - Set all environment variables
   - Configure error handling

3. **Set Up Test Environment**
   - Create test n8n workflow instance
   - Use test webhook URL
   - Point to test database/API

---

#### Phase 3: Testing (Days 6-8)

**Test Cases:**

1. **Smoke Tests (All Vendors)**
   - [ ] Modern Optical email → Processes correctly with enrichment
   - [ ] Safilo PDF → Parses PDF attachment
   - [ ] Luxottica email → Standard processing
   - [ ] Europa email → Standard processing (verify uses Europa catalog, not Modern Optical)
   - [ ] Etnia Barcelona email → Standard processing
   - [ ] Ideal Optics email → Processes correctly with enrichment
   - [ ] L'amy America email → Standard processing
   - [ ] Kenmark email → Standard processing
   - [ ] Marchon email → Standard processing (verify vendor = "Marchon", not "kenmark")

2. **Edge Cases**
   - [ ] Unknown vendor → Routes to failed_emails
   - [ ] Vendor with `enabled: false` → Routes to failed_emails
   - [ ] Malformed email (no order number) → Validation error
   - [ ] Email with no items → Validation error
   - [ ] Forwarded email from Zoho → Clean Email works
   - [ ] Forwarded email from Gmail → Clean Email works
   - [ ] Forwarded email from Outlook → Clean Email works

3. **Error Handling Tests**
   - [ ] Parse API timeout → Retries 3 times → Fails gracefully
   - [ ] Check Catalog API error → Logs error → Routes to error handler
   - [ ] Bulk-Add fails but Cache succeeds → Logs partial failure
   - [ ] Critical error → Sends Slack notification (if configured)

4. **Performance Tests**
   - [ ] Average processing time < 7 seconds
   - [ ] Parallel API calls work (Bulk-Add + Create Email + Cache)
   - [ ] 10 concurrent emails → All process successfully

5. **Data Validation Tests**
   - [ ] All vendors cache with correct vendorName
   - [ ] Marchon orders have vendor = "Marchon"
   - [ ] Europa uses Check Catalog7 data (via sub-workflow, implicitly correct)
   - [ ] Enrichment only triggers for Modern Optical & Ideal Optics

---

#### Phase 4: Parallel Running (Days 9-11)

**Blue-Green Setup:**

```
CloudMailin Webhook
    ├─→ OLD Workflow (Blue) - Production
    └─→ NEW Workflow (Green) - Shadow Mode
```

**Shadow Mode Configuration:**
- New workflow receives COPY of all webhook data
- Processes in parallel with old workflow
- Results logged to separate `test_results` table
- Does NOT write to production tables (uses test tables)
- Compare results:
  - Same items parsed?
  - Same catalog checks?
  - Processing time faster/slower?

**Comparison Script:**
```sql
-- Compare results from old vs new workflow
SELECT
  old.order_number,
  old.vendor,
  old.items_count AS old_items,
  new.items_count AS new_items,
  old.processing_time_ms AS old_time,
  new.processing_time_ms AS new_time,
  CASE
    WHEN old.items_count = new.items_count THEN '✓ Match'
    ELSE '✗ Mismatch'
  END AS status
FROM old_workflow_results old
LEFT JOIN new_workflow_results new ON old.order_number = new.order_number
ORDER BY old.timestamp DESC
LIMIT 100;
```

**Validation Criteria:**
- 100% match on parsed items
- 0 data loss
- Performance within 20% of old workflow
- Error rate ≤ old workflow error rate

---

#### Phase 5: Cutover (Day 12)

**Cutover Plan (15-minute maintenance window):**

1. **T-5 minutes:** Announce maintenance window
2. **T-0:** Stop CloudMailin webhook → OLD workflow
3. **T+2:** Verify no active executions in old workflow
4. **T+3:** Point CloudMailin webhook → NEW workflow (production mode)
5. **T+5:** Send test email for each vendor
6. **T+8:** Verify all test emails processed correctly
7. **T+10:** Monitor for errors
8. **T+15:** Declare success, end maintenance window

**Rollback Trigger:**
- Any critical error in first 15 minutes
- Data loss detected
- Processing failures > 5%

**Rollback Procedure (2 minutes):**
1. Point CloudMailin webhook back → OLD workflow
2. Verify old workflow processing
3. Investigate new workflow issue
4. Reschedule cutover after fix

---

#### Phase 6: Monitoring (Days 12-14)

**Intensive Monitoring Period (72 hours):**

**Metrics to Watch:**
- Execution success rate (target: >99%)
- Average processing time (target: <7s)
- Error rate by vendor
- Cache hit rate
- API response times

**Alerts:**
- Error rate > 5%
- Processing time > 10s
- Any critical error
- Execution failures > 3 in 1 hour

**Daily Review:**
- Query error_log table
- Review failed_emails
- Check workflow_metrics
- Verify all vendors processing

---

#### Phase 7: Cleanup (Day 15+)

**After 1 week of stable operation:**

1. **Archive Old Workflow**
   - Export one final time
   - Deactivate (don't delete yet)
   - Keep for 30 days as backup

2. **Remove Test Infrastructure**
   - Drop test tables
   - Remove test webhooks
   - Clean up test data

3. **Document Lessons Learned**
   - What went well?
   - What could be improved?
   - Update runbooks

4. **Final Cleanup (After 30 days)**
   - Delete old workflow if no issues
   - Remove backup files
   - Celebrate! 🎉

---

## 10. Testing Approach

### Test Data Collection

**Collect Real Email Samples:**
For each vendor, collect 2-3 sample emails:
- `/mnt/c/Users/payto/OneDrive/Desktop/Software/Opti-Profit/Version1/dev/email-parsers/Marchon/`
  - `gmail-email.txt`
  - `outlook-email.txt`
  - `zoho-email.txt`

**Create Test Email Suite:**
```
test-emails/
├── modern-optical/
│   ├── standard-order.json
│   ├── order-with-enrichment.json
│   └── zoho-forwarded.json
├── safilo/
│   ├── pdf-attachment.json
│   └── pdf-with-multiple-pages.json
├── luxottica/
│   ├── standard-order.json
│   └── gmail-forwarded.json
├── europa/
│   └── standard-order.json
├── etnia-barcelona/
│   └── standard-order.json
├── ideal-optics/
│   ├── standard-order.json
│   └── order-with-enrichment.json
├── lamyamerica/
│   └── standard-order.json
├── kenmark/
│   └── standard-order.json
├── marchon/
│   └── standard-order.json
└── edge-cases/
    ├── unknown-vendor.json
    ├── malformed-order.json
    ├── no-items.json
    └── missing-account-id.json
```

---

### Unit Testing (Sub-Workflows)

**Test Each Sub-Workflow Independently:**

#### Test: "Process Vendor Order" Sub-Workflow

**Test Case 1: Modern Optical Standard Order**
```javascript
// Input
{
  vendor: "Modern Optical",
  vendorKey: "modern_optical",
  vendorConfig: { /* from DB */ },
  accountId: "123456",
  email: {
    html: "<html>... order confirmation ...</html>",
    subject: "Order Confirmation #MO-12345"
  }
}

// Expected Output
{
  success: true,
  vendor: "Modern Optical",
  orderId: "MO-12345",
  itemsProcessed: 5,
  emailRecordId: "uuid",
  itemsAdded: 5,
  itemsCached: 5
}
```

**Test Case 2: Safilo PDF Order**
```javascript
// Input
{
  vendor: "Safilo",
  vendorKey: "safilo",
  vendorConfig: { uses_pdf_parsing: true },
  accountId: "789012",
  email: {
    attachments: [{ filename: "order.pdf", content: "base64..." }]
  }
}

// Expected Output
{
  success: true,
  vendor: "Safilo",
  orderId: "SF-67890",
  itemsProcessed: 12
}
```

**Test Case 3: Enrichment Flow (Ideal Optics)**
```javascript
// Input
{
  vendor: "Ideal Optics",
  vendorKey: "ideal_optics",
  vendorConfig: { requires_enrichment: true },
  accountId: "345678",
  email: {
    html: "<html>... order ...</html>"
  }
}

// Expected Output
{
  success: true,
  vendor: "Ideal Optics",
  orderId: "IO-11111",
  itemsProcessed: 8,
  enrichmentApplied: true,
  itemsEnriched: 3  // Some items already had UPC, only 3 needed enrichment
}
```

---

### Integration Testing (Main Workflow)

**Test Complete End-to-End Flow:**

#### Test Scenario 1: Happy Path (Modern Optical)

**Steps:**
1. Send webhook POST with Modern Optical email
2. Verify workflow execution starts
3. Check each node output:
   - Extract Account ID: `accountId = "123456"`
   - Detect Vendor: `vendor = "Modern Optical"`
   - Clean Email: `cleanedHtml` present, `detectedProviders = ["zoho"]`
   - Load Vendor Config: Config loaded successfully
   - Execute Sub-Workflow: Processed successfully
4. Verify database records created:
   - Email record in `emails` table
   - Items in `inventory` table with correct vendor
   - Items in `catalog_cache` table with vendorName = "Modern Optical"
5. Verify webhook response: `200 OK`

**Expected Duration:** 4-6 seconds

---

#### Test Scenario 2: Enrichment Flow (Ideal Optics)

**Steps:**
1. Send webhook POST with Ideal Optics email
2. Verify enrichment sub-workflow called
3. Check catalog: Some items exist, some need enrichment
4. Verify enrichment API called for missing UPCs
5. Verify final data has enriched UPC codes
6. Verify all data saved correctly

---

#### Test Scenario 3: PDF Parsing (Safilo)

**Steps:**
1. Send webhook POST with Safilo email containing PDF attachment
2. Verify PDF extraction
3. Verify PDF parsing
4. Verify items parsed from PDF (not HTML)
5. Verify standard processing continues normally

---

#### Test Scenario 4: Error Handling

**Test 4a: Parse API Timeout**
1. Mock Parse API to timeout
2. Verify workflow retries 3 times
3. Verify error logged after 3 failures
4. Verify email stored in failed_emails
5. Verify Slack notification sent (if configured)

**Test 4b: Partial Failure**
1. Mock "Cache to Catalog" API to fail
2. Verify "Create Email" and "Bulk-Add" succeed
3. Verify workflow marked as "partial success"
4. Verify error logged with which step failed

---

### Performance Testing

**Load Test:**
- Send 50 emails concurrently (5 of each vendor)
- Verify all process successfully
- Measure:
  - Average processing time
  - 95th percentile processing time
  - Success rate
  - Resource usage (n8n memory/CPU)

**Stress Test:**
- Send 200 emails in 1 minute
- Verify n8n handles load
- Check for throttling/queueing
- Ensure no data loss

---

### Regression Testing

**Compare Old vs New Workflow:**

For each test email:
1. Process through OLD workflow → Save results
2. Process through NEW workflow → Save results
3. Compare:
   - Same number of items parsed?
   - Same SKUs?
   - Same quantities?
   - Same vendor names?
   - Same catalog matches?

**Acceptance Criteria:**
- 100% match on all data fields
- Processing time within 20% of old workflow
- Zero data loss

---

### Test Automation

**Create n8n Test Workflow:**

```
Trigger: Manual/Schedule
  ↓
For Each Test Case (Loop)
  ↓
Send Test Email (HTTP Request to webhook)
  ↓
Wait 5 seconds
  ↓
Query Results (Supabase)
  ↓
Compare with Expected Results (Code)
  ↓
Log Test Results (Supabase: test_results table)
  ↓
Next Test Case
  ↓
Send Summary Report (Slack/Email)
```

**Test Results Table:**
```sql
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID,
  test_name VARCHAR(200),
  test_category VARCHAR(50),
  vendor VARCHAR(100),
  expected_result JSONB,
  actual_result JSONB,
  passed BOOLEAN,
  error_message TEXT,
  execution_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 11. Implementation Phases

### Phase 1: Foundation (Week 1)

**Days 1-2: Database & Configuration**
- [ ] Create database tables (vendor_configs, error_log, workflow_metrics, failed_emails)
- [ ] Populate vendor_configs with all 9 vendors
- [ ] Test Supabase connections from n8n
- [ ] Verify all indexes created

**Days 3-4: Backend Updates**
- [ ] Verify `/api/parse/clean-email` endpoint exists and works
- [ ] Update `/api/emails/parse` to route by vendorKey
- [ ] Test all vendor parsers with cleaned HTML
- [ ] Ensure enrichment endpoints accept vendorKey parameter

**Day 5: Sub-Workflow Development**
- [ ] Create "Process Vendor Order" sub-workflow
- [ ] Create "Enrich Vendor Items" sub-workflow
- [ ] Test sub-workflows with sample data

---

### Phase 2: Main Workflow Build (Week 2)

**Days 6-7: Main Workflow Structure**
- [ ] Create new main workflow
- [ ] Build nodes 1-7 (Webhook → Validate Vendor Config)
- [ ] Build Route by Vendor Type (Switch)
- [ ] Connect to sub-workflows

**Days 8-9: Error Handling & Logging**
- [ ] Implement Error Handler node
- [ ] Connect error outputs from all critical nodes
- [ ] Create error_log inserts
- [ ] Test error scenarios

**Day 10: Integration & Polish**
- [ ] Add Log Metrics node
- [ ] Add Response node
- [ ] Test complete flow end-to-end
- [ ] Fix any issues found

---

### Phase 3: Testing (Week 3)

**Days 11-12: Unit & Integration Testing**
- [ ] Test each vendor independently
- [ ] Test enrichment flow (Modern Optical, Ideal Optics)
- [ ] Test PDF flow (Safilo)
- [ ] Test error handling
- [ ] Test edge cases

**Days 13-14: Performance & Regression Testing**
- [ ] Run load tests (50 concurrent emails)
- [ ] Compare results: old workflow vs new workflow
- [ ] Verify data consistency
- [ ] Measure performance improvements

**Day 15: Shadow Mode Testing**
- [ ] Set up parallel running (Blue-Green)
- [ ] Process real emails through both workflows
- [ ] Compare results
- [ ] Validate 100% data match

---

### Phase 4: Deployment (Week 4)

**Days 16-17: Pre-Deployment Prep**
- [ ] Final review of all configurations
- [ ] Backup current workflow
- [ ] Create rollback plan
- [ ] Prepare cutover checklist
- [ ] Schedule maintenance window

**Day 18: Cutover**
- [ ] Execute cutover plan (15 minutes)
- [ ] Monitor intensively for 4 hours
- [ ] Verify all vendors processing
- [ ] Check error logs

**Days 19-21: Post-Deployment Monitoring**
- [ ] Daily metrics review
- [ ] Daily error log review
- [ ] Performance monitoring
- [ ] Verify all critical bugs fixed

---

### Phase 5: Cleanup & Optimization (Week 5+)

**After 1 Week of Stable Operation:**
- [ ] Archive old workflow
- [ ] Remove test infrastructure
- [ ] Document lessons learned
- [ ] Optimize performance (if needed)

**After 30 Days:**
- [ ] Delete old workflow
- [ ] Final retrospective
- [ ] Update documentation
- [ ] Plan Phase 2 improvements (if any)

---

## 12. Rollback Plan

### When to Rollback

**Immediate Rollback Triggers:**
1. Data loss detected (missing orders or items)
2. Critical error rate > 10%
3. Any vendor completely broken
4. Processing time > 20 seconds average
5. Database corruption

**Evaluation Period Rollback Triggers (within 72 hours):**
1. Error rate > 5% sustained
2. Performance degradation > 30%
3. Multiple vendor issues
4. Customer complaints about missing data

---

### Rollback Procedure

**Emergency Rollback (2 minutes):**

1. **T-0:** Decision to rollback
2. **T+30s:** Update CloudMailin webhook URL → OLD workflow
3. **T+1m:** Verify old workflow receiving webhooks
4. **T+1.5m:** Send test email → Verify processing
5. **T+2m:** Announce rollback complete

**Post-Rollback Actions:**

1. **Data Reconciliation**
   - Identify any emails processed by new workflow during issue
   - Export that data
   - Verify data integrity
   - Re-process through old workflow if needed

2. **Issue Investigation**
   - Export n8n execution logs
   - Query error_log table
   - Identify root cause
   - Document findings

3. **Fix & Retry**
   - Fix identified issue
   - Re-test in test environment
   - Re-schedule cutover after validation

---

### Data Integrity Safeguards

**During Cutover:**
- Keep old workflow active but paused (don't delete)
- Export all new workflow data hourly for first 24 hours
- Run data comparison queries every 4 hours
- Maintain backup of vendor_configs table

**Backup Strategy:**
```bash
# Before cutover
pg_dump -t vendor_configs > vendor_configs_backup.sql
pg_dump -t error_log > error_log_backup.sql

# Export n8n workflow
curl -X GET https://n8n.instance/api/v1/workflows/{new_id} > new_workflow_backup.json
```

---

## 13. Post-Implementation Monitoring

### Monitoring Dashboard

**Create Real-Time Dashboard (Grafana/Supabase Dashboard):**

#### Panel 1: Processing Volume
```sql
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  vendor,
  COUNT(*) as emails_processed,
  AVG(processing_time_ms) as avg_time_ms
FROM workflow_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour, vendor
ORDER BY hour DESC;
```

#### Panel 2: Success Rate
```sql
SELECT
  vendor,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM workflow_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY vendor;
```

#### Panel 3: Error Rate
```sql
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  category,
  severity,
  COUNT(*) as error_count
FROM error_log
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour, category, severity
ORDER BY hour DESC;
```

#### Panel 4: Performance Trends
```sql
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY processing_time_ms) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms) as p95,
  MAX(processing_time_ms) as max_time
FROM workflow_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

---

### Alert Configuration

**Critical Alerts (Immediate Notification):**

1. **High Error Rate**
   ```sql
   -- Alert if error rate > 10% in last hour
   SELECT
     COUNT(*) FILTER (WHERE NOT success) * 100.0 / COUNT(*) as error_rate
   FROM workflow_metrics
   WHERE timestamp > NOW() - INTERVAL '1 hour'
   HAVING error_rate > 10;
   ```

2. **Vendor Complete Failure**
   ```sql
   -- Alert if any vendor has 0 successful processing in last 30 min
   SELECT vendor
   FROM workflow_metrics
   WHERE timestamp > NOW() - INTERVAL '30 minutes'
   GROUP BY vendor
   HAVING SUM(CASE WHEN success THEN 1 ELSE 0 END) = 0;
   ```

3. **Performance Degradation**
   ```sql
   -- Alert if average processing time > 15 seconds
   SELECT AVG(processing_time_ms) as avg_time
   FROM workflow_metrics
   WHERE timestamp > NOW() - INTERVAL '1 hour'
   HAVING avg_time > 15000;
   ```

**Warning Alerts (Review Within 1 Hour):**

1. **Elevated Error Rate (5-10%)**
2. **Slow Processing (10-15s average)**
3. **Failed Emails Accumulating**
4. **Enrichment API Failures**

---

### Health Check Workflow

**Create Scheduled Health Check (Every 15 minutes):**

```
Trigger: Schedule (every 15 min)
  ↓
Query Workflow Metrics (last 15 min)
  ↓
Query Error Log (last 15 min)
  ↓
Calculate Health Score (Code)
  ↓
IF Health Score < 80%
  ↓
Send Alert (Slack/Email)
```

**Health Score Calculation:**
```javascript
const metrics = $('Query Workflow Metrics').item.json;

// Calculate health score (0-100)
const totalExecutions = metrics.total || 0;
const successfulExecutions = metrics.successful || 0;
const avgProcessingTime = metrics.avgTime || 0;
const errorCount = metrics.errors || 0;

// Success rate (0-50 points)
const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) : 1;
const successPoints = successRate * 50;

// Performance (0-30 points)
const performanceScore = avgProcessingTime < 5000 ? 30 :
                         avgProcessingTime < 10000 ? 20 :
                         avgProcessingTime < 15000 ? 10 : 0;

// Error rate (0-20 points)
const errorRate = totalExecutions > 0 ? (errorCount / totalExecutions) : 0;
const errorPoints = errorRate < 0.01 ? 20 :
                    errorRate < 0.05 ? 15 :
                    errorRate < 0.10 ? 10 : 0;

const healthScore = successPoints + performanceScore + errorPoints;

return {
  json: {
    healthScore: Math.round(healthScore),
    status: healthScore >= 90 ? 'healthy' :
            healthScore >= 80 ? 'warning' :
            healthScore >= 60 ? 'degraded' : 'critical',
    metrics: {
      totalExecutions,
      successfulExecutions,
      successRate: Math.round(successRate * 100) + '%',
      avgProcessingTime: avgProcessingTime + 'ms',
      errorCount
    }
  }
};
```

---

### Weekly Review

**Every Monday Morning:**

1. **Review Last Week's Metrics**
   - Total emails processed by vendor
   - Average processing time trends
   - Error rate by category
   - Top 5 errors

2. **Failed Emails Review**
   - How many unknown vendors?
   - Any patterns in failures?
   - Can any be reprocessed?

3. **Performance Trends**
   - Is processing time increasing?
   - Any vendors slower than others?
   - Opportunities for optimization?

4. **Action Items**
   - Update vendor configs if needed
   - Fix recurring errors
   - Optimize slow steps
   - Update documentation

---

## Summary

This implementation plan provides a comprehensive roadmap for refactoring the optical inventory n8n workflow from a 66-node monolithic design to a maintainable, data-driven architecture.

**Key Improvements:**
- ✅ All 5 critical bugs fixed by design
- ✅ 70% reduction in node count (66 → ~15-20)
- ✅ 82% code duplication eliminated
- ✅ Data-driven vendor configuration
- ✅ Comprehensive error handling
- ✅ Parallel processing for 40% performance gain
- ✅ Clean Email functionality preserved
- ✅ Zero-downtime migration strategy
- ✅ Extensive testing approach
- ✅ Post-deployment monitoring

**Timeline:** 4-5 weeks from start to stable production

**Risk Level:** Low (with Blue-Green deployment and rollback plan)

**Expected Outcomes:**
- Easier maintenance (add vendor in 5 minutes vs 2 hours)
- Higher reliability (error handling + retry logic)
- Better observability (metrics + logging)
- Faster onboarding (clear architecture)
- Scalable for future growth

---

## Next Steps

1. **Review & Approve Plan** ← You are here
2. **Create Implementation Tickets** (break down into tasks)
3. **Begin Phase 1: Foundation** (database setup)
4. **Execute phases sequentially**
5. **Deploy to production**
6. **Monitor & optimize**

---

**Document Version:** 1.0
**Last Updated:** 2025-12-09
**Author:** AI Assistant
**Status:** Ready for Review
