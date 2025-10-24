const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * Test the actual /api/emails/detect-vendor endpoint with Ideal Optics email
 */

async function testVendorDetectionAPI() {
  console.log('='.repeat(70));
  console.log('🧪 TESTING /api/emails/detect-vendor ENDPOINT');
  console.log('='.repeat(70));
  console.log();

  // Read the actual Ideal Optics email HTML
  const emailHtml = fs.readFileSync(
    path.join(__dirname, 'email.txt'),
    'utf-8'
  );

  const testPayload = {
    from: 'info@i-dealoptics.com',
    subject: 'I-Deal Optics Order Confirmation',
    html: emailHtml,
    plainText: null
  };

  console.log('📤 REQUEST PAYLOAD:');
  console.log(`  From: ${testPayload.from}`);
  console.log(`  Subject: ${testPayload.subject}`);
  console.log(`  HTML Length: ${emailHtml.length} characters`);
  console.log();

  try {
    console.log('🌐 Sending request to http://localhost:3001/api/emails/detect-vendor...');
    console.log();

    const response = await axios.post(
      'http://localhost:3001/api/emails/detect-vendor',
      testPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ RESPONSE RECEIVED');
    console.log('='.repeat(70));
    console.log(JSON.stringify(response.data, null, 2));
    console.log('='.repeat(70));
    console.log();

    // Validate response
    if (response.data.success) {
      console.log('✅ SUCCESS: Vendor detected!');
      console.log(`   Vendor: ${response.data.vendorName} (${response.data.vendor})`);
      console.log(`   Confidence: ${response.data.confidence}%`);
      console.log(`   Method: ${response.data.method}`);
      console.log(`   Execution Time: ${response.data.executionTime}ms`);

      if (response.data.vendor === 'ideal_optics') {
        console.log();
        console.log('🎯 PERFECT! Ideal Optics detected correctly!');
        console.log();
        console.log('📋 Signals:');
        console.log(JSON.stringify(response.data.signals, null, 2));
      } else {
        console.log();
        console.log('⚠️  WARNING: Wrong vendor detected!');
        console.log(`   Expected: ideal_optics`);
        console.log(`   Got: ${response.data.vendor}`);
      }
    } else {
      console.log('❌ FAILURE: Vendor not detected');
      console.log(`   Message: ${response.data.message}`);
      if (response.data.debug) {
        console.log();
        console.log('🔍 Debug Info:');
        console.log(JSON.stringify(response.data.debug, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);

    if (error.response) {
      console.error();
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.error();
      console.error('⚠️  Server is not running!');
      console.error('   Please start the server with: npm run dev');
    }
  }

  console.log();
  console.log('='.repeat(70));
}

// Run the test
testVendorDetectionAPI();
