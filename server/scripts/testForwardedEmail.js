/**
 * Test Forwarded Email Detection
 *
 * Quick test to verify that forwarded emails are properly detected
 */

require('dotenv').config();
const vendorDetectionService = require('../services/vendorDetection');

const testCases = [
  {
    name: 'Safilo - Forwarded from Gmail',
    from: 'user@gmail.com',
    subject: 'Fwd: Your Receipt for Order 113106782',
    plainText: `
Begin forwarded message:

From: Safilo <noreply@safilo.com>
Date: October 6, 2025 at 10:35 AM
To: Tim Sliva <Tim@yesnickvision.com>
Cc: KATHY.BLANCETT@SAFILO.COM <KATHY.BLANCETT@SAFILO.COM>
Subject: Your Receipt for Order 113106782

Your order has been received for processing and will ship shortly.

We appreciate your business.
Safilo USA, Inc.
    `,
    expectedVendor: 'safilo'
  },
  {
    name: 'Luxottica - Forwarded from Outlook',
    from: 'optical@myshop.com',
    subject: 'FW: Cart number 1757452162354',
    plainText: `
-----Original Message-----
From: Risa Shaver <RShaver@us.luxottica.com>
Sent: Tuesday, September 9, 2025 4:20 PM
To: optical tatumeyecare.com <optical@tatumeyecare.com>
Subject: Luxottica: Cart number 1757452162354 - 09-09-2025

Agent reference: Risa Shaver (206098)
Customer Reference: TATUM EYECARE 7070 TATUM EYECARE
Customer code: 0001247652

For specific shipment tracking of your orders, go in My Orders on my.luxottica.com
    `,
    expectedVendor: 'luxottica'
  },
  {
    name: 'Modern Optical - Forwarded from iPhone',
    from: 'amrohabib@yahoo.com',
    subject: 'Fwd: Your Receipt for Order Number 6817',
    plainText: `
Sent from my iPhone

Begin forwarded message:

From: noreply@modernoptical.com
Date: September 5, 2025 at 11:07:20 AM MST
To: amrohabib@yahoo.com
Subject: Your Receipt for Order Number 6817
Reply-To: noreply@modernoptical.com

PLEASE DO NOT REPLY TO THIS EMAIL
If you have questions or need to comment on an order, send email to custsvc@modernoptical.com

Order Number: 6817
Placed By Rep: Payton Millet
Date: 9/5/2025
    `,
    expectedVendor: 'modern_optical'
  },
  {
    name: 'Etnia Barcelona - Forwarded twice',
    from: 'megan76@gmail.com',
    subject: 'Fwd: Fwd: ORDER 1201039424 MOHAVE EYE CENTER',
    plainText: `
Nice to meet you! Have fun at VEW

Begin forwarded message:

From: Megan Neumann | Etnia Eyewear Culture <megan.neumann@etnia.es>
Date: September 15, 2025 at 3:57:25 PM MST
To: Megan Neumann <megan76@gmail.com>
Subject: Fwd: ORDER 1201039424 MOHAVE EYE CENTER KINGMAN

Begin forwarded message:

From: customeramerica@etniabarcelona.com
Date: September 15, 2025 at 1:12:52 PM MST
To: Megan Neumann | Etnia Eyewear Culture <megan.neumann@etnia.es>
Subject: ORDER 1201039424 MOHAVE EYE CENTER KINGMAN

Dear Customer,

Thank you for your order! Please find attached the copy.
Thank you for trusting in Etnia Eyewear Culture

ETNIA BARCELONA LLC
6701 NE 2nd Ct MIAMI. FL 33138
TEL. +1.888.553.8642 | FAX. +1.305.557.4964
    `,
    expectedVendor: 'etnia_barcelona'
  },
  {
    name: 'Europa - Forwarded from work email',
    from: 'manager@pveyecare.com',
    subject: 'FW: Customer Receipt: Your Receipt for Order #1484047',
    plainText: `
-----Original Message-----
From: noreply@europaeye.com <noreply@europaeye.com>
Sent: Tuesday, June 24, 2025 1:13 PM
To: Kaila Bucher <manager@pveyecare.com>
Subject: Customer Receipt: Your Receipt for Order #1484047

PLEASE DO NOT REPLY TO THIS EMAIL
If you have questions or need to comment on an order, please contact your Europa sales representative

Order #: 1484047
Order Placed By Rep: NATALIE NELSON
Date: 6/24/2025

For more information, visit europaeye.com
    `,
    expectedVendor: 'europa'
  }
];

async function runTest(testCase) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST: ${testCase.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Outer From: ${testCase.from}`);
  console.log(`Subject: ${testCase.subject}`);
  console.log(`Expected: ${testCase.expectedVendor}\n`);

  try {
    const result = await vendorDetectionService.detectVendor({
      from: testCase.from,
      subject: testCase.subject,
      plainText: testCase.plainText
    });

    const isCorrect = result.vendor === testCase.expectedVendor;

    console.log(`\n📊 RESULT:`);
    console.log(`  Detected Vendor: ${result.vendor}`);
    console.log(`  Confidence: ${result.confidence}%`);
    console.log(`  Method: ${result.method || 'N/A'}`);
    console.log(`  Time: ${result.executionTime}ms`);

    if (result.signals?.forwarded) {
      console.log(`  Forwarded: YES ✉️`);
      console.log(`  Original Sender: ${result.signals.originalSender}`);
    }

    console.log(`\n${isCorrect ? '✅ PASS' : '❌ FAIL'}`);

    return { name: testCase.name, passed: isCorrect, result };
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    return { name: testCase.name, passed: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('\n🚀 FORWARDED EMAIL DETECTION TEST\n');
  console.log('Testing vendor detection with forwarded emails...\n');

  const results = [];

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 SUMMARY`);
  console.log(`${'='.repeat(80)}\n`);
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('❌ FAILED TESTS:\n');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`);
      if (r.error) {
        console.log(`    Error: ${r.error}`);
      } else if (r.result) {
        console.log(`    Expected: ${testCases.find(t => t.name === r.name).expectedVendor}`);
        console.log(`    Got: ${r.result.vendor}`);
      }
    });
    console.log('');
  } else {
    console.log('🎉 All forwarded email tests passed!\n');
    console.log('The vendor detection now properly handles:');
    console.log('  ✅ Single forwarded emails');
    console.log('  ✅ Double forwarded emails');
    console.log('  ✅ Gmail forwarding format');
    console.log('  ✅ Outlook forwarding format');
    console.log('  ✅ iPhone/mobile forwarding format\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  console.error('\nMake sure:');
  console.error('  1. You have a .env file with Supabase credentials');
  console.error('  2. You have run: node scripts/seedVendorPatterns.js\n');
  process.exit(1);
});
