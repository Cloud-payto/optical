/**
 * Quick Test Script for Vendor Detection
 *
 * This script tests the vendor detection logic directly without making HTTP requests.
 * Useful for quick testing without starting the server.
 */

require('dotenv').config();
const vendorDetectionService = require('../services/vendorDetection');

const testCases = [
  {
    name: '🔥 CRITICAL: Safilo - Must detect as Safilo (NOT Etnia Barcelona)',
    from: 'noreply@safilo.com',
    subject: 'Your Receipt for Order 113106782',
    plainText: 'Your order has been received for processing and will ship shortly.\n\nWe appreciate your business.\nSafilo USA, Inc.',
    expectedVendor: 'safilo'
  },
  {
    name: 'Luxottica - Cart Order',
    from: 'RShaver@us.luxottica.com',
    subject: 'Luxottica: Cart number 1757452162354 - 09-09-2025',
    plainText: 'Agent reference: Risa Shaver\nmy.luxottica.com',
    expectedVendor: 'luxottica'
  },
  {
    name: 'Modern Optical',
    from: 'noreply@modernoptical.com',
    subject: 'Your Receipt for Order Number 6817',
    plainText: 'Order Number: 6817\ncustsvc@modernoptical.com',
    expectedVendor: 'modern_optical'
  },
  {
    name: 'Etnia Barcelona',
    from: 'customeramerica@etniabarcelona.com',
    subject: 'ORDER 1201039424',
    plainText: 'ETNIA BARCELONA LLC\nThank you for trusting in Etnia Eyewear Culture',
    expectedVendor: 'etnia_barcelona'
  },
  {
    name: 'Europa',
    from: 'noreply@europaeye.com',
    subject: 'Customer Receipt: Your Receipt for Order #1484047',
    plainText: 'Order Placed By Rep: NATALIE NELSON\neuropaeye.com',
    expectedVendor: 'europa'
  }
];

async function runTests() {
  console.log('\n🧪 VENDOR DETECTION - QUICK TEST\n');
  console.log('Testing detection service directly...\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`${'-'.repeat(80)}`);
    console.log(`TEST: ${testCase.name}`);
    console.log(`From: ${testCase.from}`);
    console.log(`Expected: ${testCase.expectedVendor}`);

    try {
      const result = await vendorDetectionService.detectVendor({
        from: testCase.from,
        subject: testCase.subject,
        plainText: testCase.plainText
      });

      const isCorrect = result.vendor === testCase.expectedVendor;

      console.log(`\nResult: ${result.vendor}`);
      console.log(`Confidence: ${result.confidence}%`);
      console.log(`Method: ${result.method || 'N/A'}`);
      console.log(`Time: ${result.executionTime}ms`);
      console.log(`Status: ${isCorrect ? '✅ PASS' : '❌ FAIL'}\n`);

      if (isCorrect) {
        passed++;
      } else {
        failed++;
        console.log(`❌ MISMATCH: Expected ${testCase.expectedVendor}, got ${result.vendor}\n`);
      }
    } catch (error) {
      console.log(`\n❌ ERROR: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`${'='.repeat(80)}`);
  console.log(`\n📊 RESULTS:`);
  console.log(`  Passed: ${passed} ✅`);
  console.log(`  Failed: ${failed} ❌`);
  console.log(`  Total: ${testCases.length}`);
  console.log(`  Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! The Safilo issue is FIXED! ✅\n');
  } else {
    console.log('⚠️  Some tests failed. Check patterns and database configuration.\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  console.error('\nMake sure:');
  console.error('  1. You have created a .env file with Supabase credentials');
  console.error('  2. You have run: node scripts/seedVendorPatterns.js');
  console.error('  3. The vendors table has the email_patterns column (JSONB)\n');
  process.exit(1);
});
