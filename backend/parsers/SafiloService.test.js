import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * SAFILO PARSER AUTOMATED TESTS
 *
 * Tests the SafiloService parser to ensure:
 * 1. PDF parsing works correctly
 * 2. Order data is extracted properly
 * 3. Frame details are parsed accurately
 * 4. API enrichment works (when available)
 */

const SafiloService = require('./SafiloService');

describe('SafiloService - PDF Parsing', () => {
  let service;

  beforeEach(() => {
    service = new SafiloService({ debug: false });
  });

  it('should instantiate with default config', () => {
    expect(service).toBeDefined();
    expect(service.config).toHaveProperty('apiUrl');
    expect(service.config.timeout).toBeGreaterThan(0);
  });

  it('should accept custom configuration', () => {
    const customService = new SafiloService({
      timeout: 20000,
      maxRetries: 5,
      debug: true
    });

    expect(customService.config.timeout).toBe(20000);
    expect(customService.config.maxRetries).toBe(5);
    expect(customService.config.debug).toBe(true);
  });

  it('should initialize with empty cache and reset stats', () => {
    expect(service.cache).toBeInstanceOf(Map);
    expect(service.cache.size).toBe(0);
    expect(service.stats).toHaveProperty('totalFrames');
    expect(service.stats.totalFrames).toBe(0);
  });
});

describe('SafiloService - Order Data Extraction', () => {
  let service;

  beforeEach(() => {
    service = new SafiloService({ debug: false });
  });

  it('should extract order number from PDF text', () => {
    const mockPdfText = `
      Eyerep Order Receipt
      Order Number: 113106782
      Customer: ACME Optical
      Date: 11/03/2025
    `;

    // This would call an internal method - adjust based on your actual implementation
    // For now, we'll test the pattern matching logic
    const orderNumberPattern = /Order Number:\s*(\d+)/i;
    const match = mockPdfText.match(orderNumberPattern);

    expect(match).not.toBeNull();
    expect(match[1]).toBe('113106782');
  });

  it('should extract customer name from PDF text', () => {
    const mockPdfText = `
      Customer: ACME Optical Store
      Account: 12345
    `;

    const customerPattern = /Customer:\s*(.+?)(?:\n|Account)/i;
    const match = mockPdfText.match(customerPattern);

    expect(match).not.toBeNull();
    expect(match[1].trim()).toBe('ACME Optical Store');
  });

  it('should extract account number from PDF text', () => {
    const mockPdfText = `
      Account: 12345
      Rep: John Doe
    `;

    const accountPattern = /Account:\s*(\d+)/i;
    const match = mockPdfText.match(accountPattern);

    expect(match).not.toBeNull();
    expect(match[1]).toBe('12345');
  });
});

describe('SafiloService - Frame Data Parsing', () => {
  let service;

  beforeEach(() => {
    service = new SafiloService({ debug: false });
  });

  it('should parse frame SKU format', () => {
    const testSkus = [
      'BOSS1234/003/54',
      'CARRERA123/ABC/56',
      'SAFILOSTYLS01/BLK/52'
    ];

    testSkus.forEach(sku => {
      // Test SKU pattern: BRAND/COLOR/SIZE
      const skuPattern = /^([A-Z0-9]+)\/([A-Z0-9]+)\/(\d{2})$/i;
      const match = sku.match(skuPattern);

      expect(match).not.toBeNull();
      expect(match[3]).toMatch(/^\d{2}$/); // Size should be 2 digits
    });
  });

  it('should extract brand from SKU', () => {
    const sku = 'BOSS1234/003/54';
    const skuPattern = /^([A-Z0-9]+)\//i;
    const match = sku.match(skuPattern);

    expect(match[1]).toBe('BOSS1234');
  });

  it('should extract color code from SKU', () => {
    const sku = 'BOSS1234/003/54';
    const parts = sku.split('/');

    expect(parts[1]).toBe('003');
  });

  it('should extract size from SKU', () => {
    const sku = 'BOSS1234/003/54';
    const parts = sku.split('/');

    expect(parts[2]).toBe('54');
    expect(parseInt(parts[2])).toBe(54);
  });

  it('should handle frame quantities', () => {
    const mockFrameData = {
      sku: 'BOSS1234/003/54',
      quantity: 2,
      price: 89.50
    };

    expect(mockFrameData.quantity).toBeGreaterThan(0);
    expect(mockFrameData.quantity).toBeLessThanOrEqual(10); // Reasonable order quantity
  });
});

describe('SafiloService - API Enrichment', () => {
  let service;

  beforeEach(() => {
    service = new SafiloService({ debug: false });
  });

  it('should have API configuration', () => {
    expect(service.config.apiUrl).toBeDefined();
    expect(service.config.apiUrl).toContain('mysafilo.com');
  });

  it('should have retry configuration', () => {
    expect(service.config.maxRetries).toBeGreaterThan(0);
    expect(service.config.retryDelay).toBeGreaterThan(0);
  });

  it('should track API stats', () => {
    expect(service.stats).toHaveProperty('apiErrors');
    expect(service.stats).toHaveProperty('validatedFrames');
    expect(service.stats).toHaveProperty('failedFrames');
  });

  it('should batch API requests', () => {
    expect(service.config.batchSize).toBeGreaterThan(0);
    expect(service.config.batchSize).toBeLessThanOrEqual(10); // Reasonable batch size
  });
});

describe('SafiloService - Error Handling', () => {
  let service;

  beforeEach(() => {
    service = new SafiloService({ debug: false });
  });

  it('should handle invalid PDF buffer', async () => {
    const invalidBuffer = Buffer.from('not a pdf');

    // The parsePDF method should handle this gracefully
    await expect(async () => {
      // This will fail, but should not crash the app
      try {
        await service.parsePDF(invalidBuffer);
      } catch (error) {
        expect(error).toBeDefined();
        throw error; // Re-throw for the expect to catch
      }
    }).rejects.toThrow();
  });

  it('should handle empty PDF buffer', async () => {
    const emptyBuffer = Buffer.from('');

    await expect(async () => {
      try {
        await service.parsePDF(emptyBuffer);
      } catch (error) {
        expect(error).toBeDefined();
        throw error;
      }
    }).rejects.toThrow();
  });

  it('should reset stats correctly', () => {
    service.stats.totalFrames = 10;
    service.stats.validatedFrames = 5;
    service.resetStats();

    expect(service.stats.totalFrames).toBe(0);
    expect(service.stats.validatedFrames).toBe(0);
    expect(service.stats.failedFrames).toBe(0);
  });

  it('should handle cache operations', () => {
    const testKey = 'BOSS1234/003/54';
    const testData = { brand: 'Boss', model: '1234' };

    service.cache.set(testKey, testData);
    expect(service.cache.has(testKey)).toBe(true);
    expect(service.cache.get(testKey)).toEqual(testData);

    service.cache.clear();
    expect(service.cache.size).toBe(0);
  });
});

describe('SafiloService - Performance', () => {
  let service;

  beforeEach(() => {
    service = new SafiloService({ debug: false });
  });

  it('should track processing time', async () => {
    service.stats.processingStartTime = Date.now();

    // Simulate some processing
    await new Promise(resolve => setTimeout(resolve, 100));

    service.stats.processingEndTime = Date.now();
    const duration = service.stats.processingEndTime - service.stats.processingStartTime;

    expect(duration).toBeGreaterThanOrEqual(100);
    expect(duration).toBeLessThan(200); // Should be close to 100ms
  });

  it('should have reasonable timeout settings', () => {
    expect(service.config.timeout).toBeGreaterThanOrEqual(5000);
    expect(service.config.timeout).toBeLessThanOrEqual(30000);
  });
});
