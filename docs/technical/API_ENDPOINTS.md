# OptiProfit API Documentation

<div align="center">
  
  **Complete REST API Reference for OptiProfit Backend Services**
  
  [![API Version](https://img.shields.io/badge/API-v1.0-blue)](./API_ENDPOINTS.md)
  [![Server](https://img.shields.io/badge/server-Express.js-green)](../../../server/README.md)
  [![Database](https://img.shields.io/badge/database-Supabase-orange)](./README_SCHEMA.md)
  
</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Authentication](#-authentication)
- [Rate Limiting](#-rate-limiting)
- [Error Handling](#-error-handling)
- [Health & Monitoring](#-health--monitoring)
- [Email Management](#-email-management)
- [Inventory Management](#-inventory-management)
- [Order Management](#-order-management)
- [Vendor Management](#-vendor-management)
- [Email Parsing](#-email-parsing)
- [Data Enrichment](#-data-enrichment)
- [Vendor Catalog](#-vendor-catalog)
- [Statistics & Analytics](#-statistics--analytics)
- [Feedback System](#-feedback-system)
- [Safilo Operations](#-safilo-operations)
- [Webhook Endpoints](#-webhook-endpoints)
- [Workflow Examples](#-workflow-examples)

---

## 🚀 Overview

The OptiProfit API provides comprehensive REST endpoints for managing optical inventory, processing vendor emails, and analyzing business data. Built with Express.js and secured with multiple middleware layers.

### Base URL
```
Production:  https://optiprofit-backend.onrender.com
Development: http://localhost:3001
```

### Content Types
- **Request**: `application/json` (unless otherwise specified)
- **Response**: `application/json`
- **File Upload**: `multipart/form-data`

---

## 🔐 Authentication

### Account-Based Authentication
Most endpoints require a valid `accountId` (UUID) in the request path. Account validation happens automatically through:

1. **Email Processing**: Account ID extracted from forwarding email format
2. **Frontend Requests**: Account ID from authenticated user session
3. **Admin Endpoints**: Additional admin token validation

### Authentication Headers
```http
# For debugging endpoints in production
x-debug-token: your_debug_token
```

---

## ⚡ Rate Limiting

All endpoints are protected by rate limiting middleware:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| **General API** | 100 requests | 15 minutes |
| **Webhooks** | 1000 requests | 1 hour |
| **Expensive Operations** | 20 requests | 5 minutes |
| **Authentication** | 5 requests | 15 minutes |

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

---

## 🚨 Error Handling

### Standard Error Response
```json
{
  "error": "Error message",
  "details": "Optional detailed error information",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## 🏥 Health & Monitoring

### GET `/health`
Basic health check for monitoring services.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

### GET `/api/health`
Detailed health check with database connectivity.

**Response:**
```json
{
  "status": "OK",
  "environment": "production",
  "supabase": {
    "connected": true,
    "responseTime": "45ms"
  },
  "memory": {
    "used": "125MB",
    "total": "512MB"
  }
}
```

### GET `/api/health/debug`
Debug information (production requires debug token).

**Headers:**
```http
x-debug-token: your_debug_token  # Production only
```

**Response:**
```json
{
  "environment": {
    "NODE_ENV": "production",
    "PORT": "3001"
  },
  "headers": {
    "user-agent": "Mozilla/5.0...",
    "host": "api.optiprofit.app"
  },
  "system": {
    "platform": "linux",
    "arch": "x64",
    "nodeVersion": "18.19.1"
  }
}
```

---

## 📧 Email Management

### POST `/api/emails/create`
Create email record for n8n workflow compatibility.

**Request Body:**
```json
{
  "accountId": "123e4567-e89b-12d3-a456-426614174000",
  "from": "noreply@safilo.com",
  "subject": "Order Confirmation #12345",
  "html": "<html>...</html>",
  "plainText": "Order details...",
  "parsedData": {
    "orderNumber": "12345",
    "vendor": "Safilo"
  }
}
```

**Response:**
```json
{
  "id": "987fcdeb-51a2-43d1-9f8e-123456789abc",
  "accountId": "123e4567-e89b-12d3-a456-426614174000",
  "from": "noreply@safilo.com",
  "subject": "Order Confirmation #12345",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### POST `/api/emails/detect-vendor`
Detect vendor from email content using 3-tier pattern matching.

**Request Body:**
```json
{
  "from": "orders@modernoptical.com",
  "subject": "Your Order Confirmation",
  "html": "<html>...</html>",
  "plainText": "Order details..."
}
```

**Response:**
```json
{
  "vendor": "Modern Optical",
  "confidence": 95,
  "matchType": "domain",
  "patterns": [
    {
      "type": "domain",
      "pattern": "modernoptical.com",
      "confidence": 95
    }
  ]
}
```

### GET `/api/emails/:userId`
Get all emails for a user.

**Parameters:**
- `userId` (path, UUID) - User account ID

**Response:**
```json
{
  "emails": [
    {
      "id": "email-uuid",
      "from": "noreply@safilo.com",
      "subject": "Order Confirmation",
      "vendorDetected": "Safilo",
      "confidenceScore": 95,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### DELETE `/api/emails/:userId/:emailId`
Delete specific email.

**Parameters:**
- `userId` (path, UUID) - User account ID
- `emailId` (path, UUID) - Email ID

**Response:**
```json
{
  "success": true,
  "message": "Email deleted successfully"
}
```

---

## 📦 Inventory Management

### POST `/api/inventory/bulk-add`
Add parsed order and items to database.

**Request Body:**
```json
{
  "accountId": "123e4567-e89b-12d3-a456-426614174000",
  "vendor": "Safilo",
  "order": {
    "order_number": "SAF-12345",
    "customer_name": "John Doe",
    "order_date": "2024-01-01"
  },
  "items": [
    {
      "sku": "CA123456",
      "brand": "Carrera",
      "model": "CA8801",
      "color": "Black",
      "size": "55-16-140",
      "quantity": 2,
      "upc": "123456789012"
    }
  ],
  "emailId": 123
}
```

**Response:**
```json
{
  "order": {
    "id": "order-uuid",
    "orderNumber": "SAF-12345",
    "itemCount": 1
  },
  "items": [
    {
      "id": "item-uuid",
      "sku": "CA123456",
      "status": "pending"
    }
  ],
  "success": true
}
```

### GET `/api/inventory/:userId`
Get inventory for a user.

**Parameters:**
- `userId` (path, UUID) - User account ID

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `current`, `sold`, `archived`
- `vendor` (optional) - Filter by vendor name
- `limit` (optional) - Number of results (default: 50)
- `offset` (optional) - Pagination offset

**Response:**
```json
{
  "items": [
    {
      "id": "item-uuid",
      "sku": "CA123456",
      "brand": "Carrera",
      "model": "CA8801",
      "color": "Black",
      "size": "55-16-140",
      "quantity": 2,
      "status": "current",
      "vendor": "Safilo",
      "orderNumber": "SAF-12345",
      "confirmationDate": "2024-01-01T00:00:00.000Z",
      "returnWindowDays": 730,
      "daysRemaining": 725
    }
  ],
  "total": 1,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### POST `/api/inventory/:accountId/confirm/:orderNumber`
Confirm pending order items and trigger enrichment.

**Parameters:**
- `accountId` (path, UUID) - Account ID
- `orderNumber` (path, string) - Order number to confirm

**Response:**
```json
{
  "success": true,
  "itemsConfirmed": 5,
  "orderNumber": "SAF-12345",
  "enrichmentTriggered": true,
  "details": {
    "vendor": "Safilo",
    "totalItems": 5,
    "enrichedItems": 3
  }
}
```

### PUT `/api/inventory/:userId/:itemId/sold`
Mark inventory item as sold.

**Parameters:**
- `userId` (path, UUID) - User account ID  
- `itemId` (path, UUID) - Inventory item ID

**Request Body:**
```json
{
  "saleDate": "2024-01-15",
  "salePrice": 299.99,
  "notes": "Sold to walk-in customer"
}
```

**Response:**
```json
{
  "id": "item-uuid",
  "status": "sold",
  "saleDate": "2024-01-15T00:00:00.000Z",
  "salePrice": 299.99,
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### PUT `/api/inventory/:userId/:itemId/archive`
Archive inventory item.

**Parameters:**
- `userId` (path, UUID) - User account ID
- `itemId` (path, UUID) - Inventory item ID

**Response:**
```json
{
  "id": "item-uuid",
  "status": "archived",
  "archivedAt": "2024-01-15T10:30:00.000Z"
}
```

### PUT `/api/inventory/:accountId/:itemId/restore`
Restore inventory item from archive.

**Parameters:**
- `accountId` (path, UUID) - Account ID
- `itemId` (path, UUID) - Inventory item ID

**Response:**
```json
{
  "id": "item-uuid",
  "status": "current",
  "restoredAt": "2024-01-15T10:30:00.000Z"
}
```

### DELETE `/api/inventory/:userId/:itemId`
Permanently delete inventory item.

**Parameters:**
- `userId` (path, UUID) - User account ID
- `itemId` (path, UUID) - Inventory item ID

**Response:**
```json
{
  "success": true,
  "message": "Item deleted successfully",
  "deletedId": "item-uuid"
}
```

---

## 📋 Order Management

### GET `/api/orders/:userId`
Get all orders for a user.

**Parameters:**
- `userId` (path, UUID) - User account ID

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `confirmed`, `archived`
- `vendor` (optional) - Filter by vendor name
- `limit` (optional) - Number of results (default: 20)

**Response:**
```json
{
  "orders": [
    {
      "id": "order-uuid",
      "orderNumber": "SAF-12345",
      "vendor": "Safilo",
      "orderDate": "2024-01-01",
      "customerName": "John Doe",
      "totalPieces": 5,
      "status": "confirmed",
      "items": [
        {
          "id": "item-uuid",
          "brand": "Carrera",
          "model": "CA8801",
          "quantity": 2
        }
      ]
    }
  ],
  "total": 1
}
```

### PUT `/api/orders/:userId/:orderId/archive`
Archive an order.

**Parameters:**
- `userId` (path, UUID) - User account ID
- `orderId` (path, UUID) - Order ID

**Response:**
```json
{
  "id": "order-uuid",
  "status": "archived",
  "archivedAt": "2024-01-15T10:30:00.000Z"
}
```

### DELETE `/api/orders/:accountId/:orderId`
Delete an archived order.

**Parameters:**
- `accountId` (path, UUID) - Account ID
- `orderId` (path, UUID) - Order ID

**Response:**
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

---

## 🏢 Vendor Management

### GET `/api/vendors`
Get all vendors in the system.

**Response:**
```json
{
  "vendors": [
    {
      "id": "vendor-uuid",
      "name": "Safilo",
      "segment": "Premium",
      "discountMin": 40,
      "discountMax": 50,
      "minimumOrder": 2000,
      "paymentTerms": "NET 30",
      "freeShipping": true,
      "buyingGroups": ["EPON", "Vision West"]
    }
  ],
  "total": 13
}
```

### GET `/api/vendors/pricing/:userId`
Get user-specific account brands with pricing.

**Parameters:**
- `userId` (path, UUID) - User account ID

**Response:**
```json
{
  "accountBrands": [
    {
      "id": "account-brand-uuid",
      "brandId": "brand-uuid",
      "brandName": "Carrera",
      "vendorId": "vendor-uuid", 
      "vendorName": "Safilo",
      "wholesaleCost": 85.00,
      "yourCost": 55.00,
      "retailPrice": 150.00,
      "tariffTax": 3.00,
      "returnWindowDays": 730,
      "discountPercent": 35.3
    }
  ]
}
```

### POST `/api/vendors/pricing/:userId`
Save account-specific brand pricing data.

**Parameters:**
- `userId` (path, UUID) - User account ID

**Request Body:**
```json
{
  "brand_id": "brand-uuid",
  "vendor_id": "vendor-uuid", 
  "wholesale_cost": 85.00,
  "your_cost": 55.00,
  "retail_price": 150.00,
  "tariff_tax": 3.00,
  "return_window_days": 730,
  "notes": "Premium frame line"
}
```

**Response:**
```json
{
  "id": "account-brand-uuid",
  "brandId": "brand-uuid",
  "vendorId": "vendor-uuid",
  "wholesaleCost": 85.00,
  "yourCost": 55.00,
  "discountPercent": 35.3,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET `/api/vendors/companies/:userId`
Get vendors formatted as companies with brand relationships.

**Parameters:**
- `userId` (path, UUID) - User account ID

**Response:**
```json
{
  "companies": [
    {
      "id": "vendor-uuid",
      "name": "Safilo",
      "email": "orders@safilo.com",
      "website": "https://www.safilo.com",
      "brands": [
        {
          "id": "brand-uuid",
          "name": "Carrera",
          "wholesaleCost": 85.00,
          "yourCost": 55.00,
          "hasAccountPricing": true
        }
      ],
      "brandCount": 15,
      "configuredBrands": 3
    }
  ]
}
```

---

## ⚙️ Email Parsing

### POST `/api/parse/safilo`
Parse Safilo PDF order content with API enrichment.

**Request Body:**
```json
{
  "pdfBase64": "JVBERi0xLjQKJdPr6eEKMSAwIG9...",
  "accountId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "orderNumber": "112947761",
    "customerName": "John Doe",
    "orderDate": "2024-01-01",
    "accountNumber": "12345"
  },
  "items": [
    {
      "brand": "Carrera",
      "model": "CA8801",
      "color": "Black",
      "size": "55-16-140",
      "quantity": 2,
      "upc": "123456789012",
      "wholesalePrice": 85.00,
      "msrp": 150.00,
      "material": "Acetate",
      "origin": "Italy",
      "confidence": 95
    }
  ],
  "statistics": {
    "totalItems": 5,
    "enrichedItems": 4,
    "apiCalls": 4,
    "processingTime": "2.3s"
  }
}
```

### POST `/api/parse/modernoptical`
Parse Modern Optical HTML email content.

**Request Body:**
```json
{
  "html": "<html><body>...</body></html>",
  "plainText": "Order confirmation text...",
  "accountId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "orderNumber": "MO-2024-1234",
    "orderDate": "2024-01-01",
    "repName": "Jane Smith"
  },
  "items": [
    {
      "brand": "Modern Optics",
      "model": "MO-5501",
      "color": "Black/Gold",
      "size": "52-18-140",
      "quantity": 1,
      "readyForEnrichment": true
    }
  ],
  "requiresEnrichment": true
}
```

### POST `/api/parse/idealoptics`
Parse Ideal Optics HTML email content.

**Request Body:**
```json
{
  "html": "<html><body>...</body></html>",
  "plainText": "Order details...",
  "accountId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "orderNumber": "IO-2024-5678",
    "orderDate": "2024-01-01"
  },
  "items": [
    {
      "brand": "Ideal Collection",
      "model": "IC-1001",
      "color": "Tortoise",
      "quantity": 1
    }
  ]
}
```

---

## 🔍 Data Enrichment

### POST `/api/enrich/modernoptical`
Enrich Modern Optical items with web scraping data.

**Request Body:**
```json
{
  "accountId": "123e4567-e89b-12d3-a456-426614174000",
  "orderNumber": "MO-2024-1234",
  "items": [
    {
      "brand": "Modern Optics",
      "model": "MO-5501"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "enrichedItems": [
    {
      "brand": "Modern Optics",
      "model": "MO-5501",
      "enrichedData": {
        "upc": "123456789012",
        "colorCode": "C1",
        "fullSize": "52-18-140",
        "temple": "140",
        "material": "Acetate",
        "stockStatus": "In Stock"
      },
      "enrichmentSource": "web_scraping",
      "confidence": 90
    }
  ],
  "statistics": {
    "totalItems": 1,
    "successfulEnrichments": 1,
    "failedEnrichments": 0,
    "processingTime": "3.2s"
  }
}
```

### POST `/api/enrich/idealoptics/single`
Test enrichment for single Ideal Optics product.

**Request Body:**
```json
{
  "model": "IC-1001"
}
```

**Response:**
```json
{
  "success": true,
  "model": "IC-1001",
  "enrichedData": {
    "upc": "987654321098",
    "measurements": {
      "eye": "54",
      "bridge": "18", 
      "temple": "140"
    },
    "gender": "Unisex",
    "material": "Metal",
    "fitType": "Regular"
  },
  "source": "idealoptics_website",
  "scrapingTime": "1.8s"
}
```

---

## 📚 Vendor Catalog

### POST `/api/catalog/check`
Check if items exist in vendor catalog cache.

**Request Body:**
```json
{
  "vendorId": "vendor-uuid",
  "items": [
    {
      "brand": "Carrera",
      "model": "CA8801",
      "color": "Black",
      "eye_size": "55"
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "brand": "Carrera",
      "model": "CA8801",
      "cacheHit": true,
      "cachedData": {
        "upc": "123456789012",
        "wholesaleCost": 85.00,
        "msrp": 150.00,
        "material": "Acetate"
      },
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  ],
  "summary": {
    "totalItems": 1,
    "cacheHits": 1,
    "cacheMisses": 0,
    "hitRate": 100
  }
}
```

### POST `/api/catalog/cache`
Save enriched items to vendor catalog.

**Request Body:**
```json
{
  "vendorId": "vendor-uuid",
  "vendorName": "Safilo",
  "items": [
    {
      "brand": "Carrera", 
      "model": "CA8801",
      "color": "Black",
      "eye_size": "55",
      "wholesale_cost": 85.00,
      "msrp": 150.00,
      "upc": "123456789012",
      "material": "Acetate",
      "origin": "Italy"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "cachedItems": 1,
  "updatedItems": 0,
  "skippedItems": 0,
  "details": [
    {
      "brand": "Carrera",
      "model": "CA8801", 
      "action": "cached",
      "id": "catalog-item-uuid"
    }
  ]
}
```

### GET `/api/catalog/stats`
Get vendor catalog statistics.

**Query Parameters:**
- `vendorId` (optional) - Filter by specific vendor

**Response:**
```json
{
  "overview": {
    "totalItems": 15420,
    "totalVendors": 7,
    "totalBrands": 145,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  },
  "byVendor": [
    {
      "vendorId": "vendor-uuid",
      "vendorName": "Safilo",
      "itemCount": 8750,
      "brandCount": 45,
      "coverage": 85.2
    }
  ],
  "recentActivity": {
    "itemsAddedToday": 125,
    "itemsUpdatedToday": 67
  }
}
```

---

## 📊 Statistics & Analytics

### GET `/api/stats/:userId`
Get dashboard statistics for a user.

**Parameters:**
- `userId` (path, UUID) - User account ID

**Response:**
```json
{
  "overview": {
    "totalInventoryValue": 125000.00,
    "totalItems": 450,
    "pendingItems": 25,
    "totalOrders": 89
  },
  "trends": {
    "inventoryValueChange": 15.2,
    "itemCountChange": 8.5,
    "pendingItemsChange": -12.1,
    "ordersChange": 22.3
  },
  "vendorBreakdown": [
    {
      "vendor": "Safilo",
      "itemCount": 120,
      "totalValue": 35000.00,
      "percentage": 28.0
    }
  ],
  "recentActivity": {
    "lastOrderDate": "2024-01-15",
    "lastSaleDate": "2024-01-14", 
    "itemsConfirmedThisWeek": 12
  }
}
```

### GET `/api/stats/:userId/inventory-by-vendor`
Get inventory grouped by vendor and brand.

**Parameters:**
- `userId` (path, UUID) - User account ID

**Query Parameters:**
- `sortBy` (optional) - Sort by: `vendor`, `itemCount`, `value` (default: `vendor`)
- `sortOrder` (optional) - Order: `asc`, `desc` (default: `asc`)
- `limit` (optional) - Number of results (default: 10)
- `offset` (optional) - Pagination offset

**Response:**
```json
{
  "vendors": [
    {
      "vendorName": "Safilo",
      "totalItems": 120,
      "totalValue": 35000.00,
      "brands": [
        {
          "brandName": "Carrera",
          "itemCount": 45,
          "totalValue": 15000.00,
          "averageValue": 333.33
        }
      ]
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 7,
    "hasMore": false
  },
  "summary": {
    "totalVendors": 7,
    "totalBrands": 23,
    "grandTotalItems": 450,
    "grandTotalValue": 125000.00
  }
}
```

---

## 💬 Feedback System

### POST `/api/feedback/bug-report`
Submit a bug report.

**Request Body:**
```json
{
  "title": "Calculator shows incorrect profit margin",
  "description": "When calculating profit with insurance, the margin shows as negative even with positive values.",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "userEmail": "user@example.com",
  "severity": "medium",
  "page": "/calculator",
  "browserInfo": "Chrome 120.0.0 on Windows 11"
}
```

**Response:**
```json
{
  "id": "bug-report-uuid",
  "title": "Calculator shows incorrect profit margin",
  "status": "new",
  "reportNumber": "BR-2024-0015",
  "submittedAt": "2024-01-15T10:30:00.000Z",
  "estimatedResponse": "2024-01-17T10:30:00.000Z"
}
```

### POST `/api/feedback/vendor-request`
Submit a vendor integration request.

**Request Body:**
```json
{
  "vendorName": "Marcolin",
  "vendorWebsite": "https://www.marcolin.com",
  "reason": "We order frequently from this vendor and manual entry is time-consuming",
  "orderVolume": "monthly",
  "priority": "high",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "userEmail": "user@example.com"
}
```

**Response:**
```json
{
  "id": "vendor-request-uuid", 
  "vendorName": "Marcolin",
  "status": "new",
  "requestNumber": "VR-2024-0008",
  "submittedAt": "2024-01-15T10:30:00.000Z",
  "estimatedImplementation": "Q2 2024"
}
```

### GET `/api/feedback/bug-reports`
Get all bug reports (admin endpoint).

**Query Parameters:**
- `status` (optional) - Filter by status: `new`, `reviewing`, `in-progress`, `resolved`, `closed`
- `severity` (optional) - Filter by severity: `low`, `medium`, `high`, `critical`
- `limit` (optional) - Number of results (default: 20)

**Response:**
```json
{
  "bugReports": [
    {
      "id": "bug-report-uuid",
      "reportNumber": "BR-2024-0015",
      "title": "Calculator shows incorrect profit margin",
      "status": "new",
      "severity": "medium",
      "submittedAt": "2024-01-15T10:30:00.000Z",
      "userEmail": "user@example.com"
    }
  ],
  "total": 1,
  "statusSummary": {
    "new": 5,
    "reviewing": 3,
    "in-progress": 7,
    "resolved": 25,
    "closed": 12
  }
}
```

---

## 🏗️ Safilo Operations

### POST `/api/safilo/process`
Manual Safilo PDF processing with file upload.

**Request:** Multipart form data
```http
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="pdf"; filename="order.pdf"
Content-Type: application/pdf

[PDF binary data]
--boundary
Content-Disposition: form-data; name="accountId"

123e4567-e89b-12d3-a456-426614174000
--boundary--
```

**Response:**
```json
{
  "success": true,
  "order": {
    "orderNumber": "112947761",
    "processingTime": "3.5s"
  },
  "statistics": {
    "totalFrames": 15,
    "enrichedFrames": 13,
    "apiCalls": 13,
    "validationPassed": 95,
    "confidence": 92
  },
  "items": [
    {
      "brand": "Carrera",
      "model": "CA8801",
      "enriched": true,
      "confidence": 95
    }
  ]
}
```

### POST `/api/safilo/reprocess`
Re-process existing Safilo order with API enrichment.

**Request Body:**
```json
{
  "emailId": 123,
  "accountId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "success": true,
  "emailId": 123,
  "reprocessingResults": {
    "itemsReprocessed": 8,
    "newEnrichments": 5,
    "updatedItems": 3,
    "processingTime": "4.2s"
  }
}
```

### GET `/api/safilo/statistics`
Get Safilo processing statistics.

**Query Parameters:**
- `accountId` (required) - Account ID filter

**Response:**
```json
{
  "overview": {
    "totalOrders": 25,
    "totalItems": 150,
    "successRate": 94.2,
    "avgProcessingTime": "2.8s"
  },
  "enrichment": {
    "totalApiCalls": 140,
    "successfulEnrichments": 132,
    "enrichmentRate": 94.3,
    "avgConfidenceScore": 92.1
  },
  "recentActivity": {
    "ordersThisMonth": 8,
    "itemsThisMonth": 45,
    "lastProcessed": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🎣 Webhook Endpoints

### POST `/api/webhook/email`
CloudMailin webhook endpoint for email processing.

**Request Body:** CloudMailin webhook format
```json
{
  "headers": {
    "to": "account-123e4567-e89b-12d3-a456-426614174000@mail.optiprofit.app",
    "from": "noreply@safilo.com",
    "subject": "Order Confirmation #112947761"
  },
  "plain": "Order confirmation text...",
  "html": "<html>...</html>",
  "attachments": [
    {
      "content": "base64_encoded_pdf_content",
      "file_name": "order.pdf",
      "content_type": "application/pdf",
      "size": 45678
    }
  ]
}
```

**Response:**
```json
{
  "received": true,
  "emailId": 123,
  "vendorDetected": "Safilo",
  "confidence": 95,
  "itemsCreated": 5,
  "status": "processing"
}
```

### GET `/api/webhook/email/test`
Test webhook endpoint connectivity.

**Response:**
```json
{
  "status": "OK",
  "endpoint": "/api/webhook/email",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production"
}
```

---

## 🔄 Workflow Examples

### Complete Order Processing Flow

#### 1. Email Reception & Processing
```bash
# CloudMailin automatically posts to webhook
POST /api/webhook/email
```

#### 2. Vendor Detection & Parsing
```bash
# If Safilo PDF detected
POST /api/parse/safilo
{
  "pdfBase64": "...",
  "accountId": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### 3. Add to Inventory
```bash
POST /api/inventory/bulk-add
{
  "accountId": "123e4567-e89b-12d3-a456-426614174000",
  "vendor": "Safilo",
  "order": {...},
  "items": [...]
}
```

#### 4. Order Confirmation
```bash
POST /api/inventory/123e4567-e89b-12d3-a456-426614174000/confirm/SAF-12345
```

#### 5. Enrichment (if applicable)
```bash
POST /api/enrich/modernoptical
{
  "accountId": "123e4567-e89b-12d3-a456-426614174000",
  "orderNumber": "MO-2024-1234"
}
```

### Vendor Management Setup

#### 1. Check Available Vendors
```bash
GET /api/vendors
```

#### 2. Import Vendors from Inventory
```bash
POST /api/vendors/import-from-inventory/123e4567-e89b-12d3-a456-426614174000
{
  "vendorIds": ["vendor-uuid"],
  "brandData": {}
}
```

#### 3. Set Brand Pricing
```bash
POST /api/vendors/pricing/123e4567-e89b-12d3-a456-426614174000
{
  "brand_id": "brand-uuid",
  "vendor_id": "vendor-uuid",
  "wholesale_cost": 85.00,
  "your_cost": 55.00
}
```

#### 4. View Configured Companies
```bash
GET /api/vendors/companies/123e4567-e89b-12d3-a456-426614174000
```

### Analytics Dashboard Data

#### 1. Get Overview Stats
```bash
GET /api/stats/123e4567-e89b-12d3-a456-426614174000
```

#### 2. Get Vendor Breakdown
```bash
GET /api/stats/123e4567-e89b-12d3-a456-426614174000/inventory-by-vendor?sortBy=value&sortOrder=desc
```

#### 3. Get Catalog Performance
```bash
GET /api/catalog/stats
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs must be valid v4 format
- File uploads limited to 10MB
- PDF processing timeout: 30 seconds
- Web scraping timeout: 15 seconds per item
- Pagination uses limit/offset pattern
- All monetary values in USD with 2 decimal precision

---

*Last Updated: 2024-01-15*  
*API Version: 1.0*  
*For technical support, see [Debugging Guide](./DEBUGGING_GUIDE.md)*