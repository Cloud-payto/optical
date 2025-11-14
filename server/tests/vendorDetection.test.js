require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Vendor Detection API Test Suite
 *
 * Tests the /api/emails/detect-vendor endpoint against real vendor emails
 * to ensure accurate detection and proper confidence scoring.
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const DETECT_VENDOR_URL = `${API_BASE_URL}/api/emails/detect-vendor`;

// Test cases based on real vendor emails
const testCases = [
  {
    name: 'Safilo - Critical Failure Case',
    vendor: 'safilo',
    from: 'noreply@safilo.com',
    subject: 'Your Receipt for Order 113106782',
    plainText: 'Your order has been received for processing and will ship shortly.\n\nWe appreciate your business.\nSafilo USA, Inc.',
    expectedVendor: 'safilo',
    expectedMethod: 'domain',
    minConfidence: 90
  },
  {
    name: 'Luxottica - Cart Order',
    vendor: 'luxottica',
    from: 'RShaver@us.luxottica.com',
    subject: 'Luxottica: Cart number 1757452162354 - 09-09-2025',
    plainText: 'Agent reference: Risa Shaver\nCustomer code: 0001247652\nCart number: 1757452162354\nFor specific shipment tracking, go to my.luxottica.com',
    expectedVendor: 'luxottica',
    expectedMethod: 'domain',
    minConfidence: 90
  },
  {
    name: 'Modern Optical - Order Receipt',
    vendor: 'modern_optical',
    from: 'noreply@modernoptical.com',
    subject: 'Your Receipt for Order Number 6817',
    plainText: 'Order Number: 6817\nPlaced By Rep: Payton Millet\nIf you have questions, send email to custsvc@modernoptical.com',
    expectedVendor: 'modern_optical',
    expectedMethod: 'domain',
    minConfidence: 90
  },
  {
    name: 'Etnia Barcelona - Order Confirmation',
    vendor: 'etnia_barcelona',
    from: 'customeramerica@etniabarcelona.com',
    subject: 'ORDER 1201039424 MOHAVE EYE CENTER KINGMAN',
    plainText: 'Dear Customer,\n\nThank you for your order!\n\nThank you for trusting in Etnia Eyewear Culture\n\nETNIA BARCELONA LLC\n6701 NE 2nd Ct MIAMI. FL 33138',
    expectedVendor: 'etnia_barcelona',
    expectedMethod: 'domain',
    minConfidence: 90
  },
  {
    name: 'Europa - Customer Receipt',
    vendor: 'europa',
    from: 'noreply@europaeye.com',
    subject: 'Customer Receipt: Your Receipt for Order #1484047',
    plainText: 'Order #: 1484047\nOrder Placed By Rep: NATALIE NELSON\nIf you have questions, contact your Europa sales representative\neuropaeye.com',
    expectedVendor: 'europa',
    expectedMethod: 'domain',
    minConfidence: 90
  },
  {
    name: 'Unknown Vendor - No Match',
    vendor: 'unknown',
    from: 'sales@randomeyewear.com',
    subject: 'Your Order Confirmation',
    plainText: 'Thank you for your order.',
    expectedVendor: 'unknown',
    expectedMethod: null,
    minConfidence: 0
  },
  {
    name: 'Safilo - Body Signature Only (No Domain)',
    vendor: 'safilo',
    from: 'forwarded@example.com',
    subject: 'Forwarded: Order Confirmation',
    plainText: 'This is a forwarded email from Safilo USA, Inc. regarding your order.',
    expectedVendor: 'safilo',
    expectedMethod: 'body_signature',
    minConfidence: 70
  },
  {
    name: 'Etnia Barcelona - Alternative Domain',
    vendor: 'etnia_barcelona',
    from: 'megan.neumann@etnia.es',
    subject: 'Fwd: ORDER 1201039424',
    plainText: 'Order details from Etnia Eyewear Culture',
    expectedVendor: 'etnia_barcelona',
    expectedMethod: 'domain',
    minConfidence: 90
  },
  {
    name: 'Kenmark - Order Receipt',
    vendor: 'kenmark',
    from: 'noreply@kenmarkeyewear.com',
    subject: 'Kenmark Eyewear: Your Receipt for Order Number 102870',
    plainText: 'Order Number: 102870\nPlaced By Rep: Alicia\nDate: 8/9/2025\nKenmark Eyewear',
    expectedVendor: 'kenmark',
    expectedMethod: 'domain',
    minConfidence: 90
  }
];

/**
 * Run a single test case
 */
async function runTest(testCase) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST: ${testCase.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`From: ${testCase.from}`);
  console.log(`Subject: ${testCase.subject}`);
  console.log(`Expected: ${testCase.expectedVendor} (${testCase.expectedMethod || 'N/A'})`);
  console.log(`Min Confidence: ${testCase.minConfidence}%\n`);

  try {
    const startTime = Date.now();

    const response = await axios.post(DETECT_VENDOR_URL, {
      from: testCase.from,
      subject: testCase.subject,
      plainText: testCase.plainText,
      html: null
    });

    const duration = Date.now() - startTime;
    const result = response.data;

    console.log(`📊 RESULT:`);
    console.log(`  Vendor: ${result.vendor}`);
    console.log(`  Vendor Name: ${result.vendorName || 'N/A'}`);
    console.log(`  Confidence: ${result.confidence}%`);
    console.log(`  Method: ${result.method || 'N/A'}`);
    console.log(`  API Response Time: ${duration}ms`);
    console.log(`  Detection Time: ${result.executionTime}ms`);

    if (result.signals) {
      console.log(`  Signals:`);
      if (result.signals.domain) {
        console.log(`    - Domain match: ${result.signals.matchedDomain || 'yes'}`);
      }
      if (result.signals.bodySignatures?.length > 0) {
        console.log(`    - Body signatures: ${result.signals.bodySignatures.join(', ')}`);
      }
      if (result.signals.subjectKeywords?.length > 0) {
        console.log(`    - Subject keywords: ${result.signals.subjectKeywords.join(', ')}`);
      }
    }

    // Validation
    const vendorMatch = result.vendor === testCase.expectedVendor;
    const confidencePass = result.confidence >= testCase.minConfidence;
    const methodMatch = !testCase.expectedMethod || result.method === testCase.expectedMethod;

    console.log(`\n✅ VALIDATION:`);
    console.log(`  Vendor Match: ${vendorMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Confidence: ${confidencePass ? '✅ PASS' : '❌ FAIL'} (${result.confidence}% >= ${testCase.minConfidence}%)`);
    console.log(`  Method: ${methodMatch ? '✅ PASS' : '⚠️  MISMATCH'} (expected: ${testCase.expectedMethod || 'any'}, got: ${result.method || 'N/A'})`);

    const passed = vendorMatch && confidencePass;
    console.log(`\n${passed ? '✅ TEST PASSED' : '❌ TEST FAILED'}`);

    return {
      name: testCase.name,
      passed,
      result,
      duration,
      vendorMatch,
      confidencePass,
      methodMatch
    };

  } catch (error) {
    console.log(`\n❌ TEST ERROR:`);
    console.log(`  Message: ${error.message}`);
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Response:`, error.response.data);
    }

    return {
      name: testCase.name,
      passed: false,
      error: error.message,
      vendorMatch: false,
      confidencePass: false,
      methodMatch: false
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🚀 VENDOR DETECTION TEST SUITE');
  console.log(`API Endpoint: ${DETECT_VENDOR_URL}`);
  console.log(`Total Tests: ${testCases.length}\n`);

  const results = [];

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(80)}\n`);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;

  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  console.log(`Avg Response Time: ${avgDuration.toFixed(0)}ms\n`);

  // Failed tests detail
  if (failed > 0) {
    console.log('❌ FAILED TESTS:\n');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`);
      if (r.error) {
        console.log(`    Error: ${r.error}`);
      } else {
        console.log(`    Expected: ${testCases.find(t => t.name === r.name).expectedVendor}`);
        console.log(`    Got: ${r.result?.vendor || 'N/A'}`);
      }
    });
  }

  // Critical test check
  const criticalTest = results.find(r => r.name === 'Safilo - Critical Failure Case');
  if (criticalTest) {
    console.log('\n🔥 CRITICAL TEST (Safilo Failure Case):');
    console.log(`  Status: ${criticalTest.passed ? '✅ FIXED' : '❌ STILL FAILING'}`);
    if (!criticalTest.passed) {
      console.log(`  ⚠️  WARNING: The critical Safilo detection issue is NOT resolved!`);
    }
  }

  console.log(`\n${'='.repeat(80)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testCases };
