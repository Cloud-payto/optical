const axios = require('axios');

/**
 * Test script to debug Marchon API connectivity
 * Tests POST request with proper JSON body format
 */

async function testMarchonAPI() {
    const testStyle = 'MA60'; // Example style from user's payload

    const url = 'https://www.mymarchon.com//ProductCatologWebWeb/Frame/sku';

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    // Payload format from user's browser inspection
    const payload = {
        style: testStyle,
        itemType: 'FRAME',
        orderType: 'STOCK',
        salesOrg: '2010',
        distChannel: '10',
        userCredential: {
            salesOrg: '2010',
            language: 'en_US',
            countryCode: 'US'
        }
    };

    console.log('='.repeat(60));
    console.log('MARCHON API TEST (POST REQUEST)');
    console.log('='.repeat(60));
    console.log(`Testing Style: ${testStyle}`);
    console.log(`URL: ${url}`);
    console.log(`Payload: ${JSON.stringify(payload, null, 2)}\n`);

    // Test 1: POST request with correct payload format
    console.log('-'.repeat(60));
    console.log('Test 1: POST with JSON body (no auth)');
    console.log('-'.repeat(60));

    try {
        const response = await axios.post(url, payload, {
            headers: headers,
            timeout: 15000
        });

        console.log(`✅ Status: ${response.status}`);
        console.log(`Response type: ${typeof response.data}`);

        if (response.data) {
            if (response.data.serviceStatus) {
                console.log(`Service Status: ${JSON.stringify(response.data.serviceStatus)}`);
            }
            if (response.data.skuDetail) {
                console.log(`SKU Details found: ${response.data.skuDetail.length} variants`);
                if (response.data.skuDetail[0]) {
                    const first = response.data.skuDetail[0];
                    console.log(`First variant: UPC=${first.upcNumber}, Retail=${first.retail}, MSRP=${first.msrp}`);
                }
            } else {
                console.log('Response data (first 500 chars):');
                console.log(JSON.stringify(response.data).substring(0, 500));
            }
        }

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Status Text: ${error.response.statusText}`);
            if (error.response.data) {
                console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 500)}`);
            }
        }
    }

    console.log('');

    // Test 2: Try different styles
    const otherStyles = ['SF2223N', 'CK20305'];
    for (const style of otherStyles) {
        console.log('-'.repeat(60));
        console.log(`Test: POST with style "${style}"`);
        console.log('-'.repeat(60));

        try {
            const response = await axios.post(url, { ...payload, style }, {
                headers: headers,
                timeout: 15000
            });

            console.log(`✅ Status: ${response.status}`);
            if (response.data?.skuDetail) {
                console.log(`   Found ${response.data.skuDetail.length} variants`);
            } else if (response.data?.serviceStatus) {
                console.log(`   Service Status: ${JSON.stringify(response.data.serviceStatus)}`);
            }

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
            }
        }
        console.log('');
    }
}

async function testMarchonService() {
    console.log('\n' + '='.repeat(60));
    console.log('TESTING MARCHONSERVICE CLASS');
    console.log('='.repeat(60));

    const MarchonService = require('./parsers/MarchonService');
    const service = new MarchonService({ debug: true });

    const testStyles = ['MA60', 'SF2223N'];

    for (const style of testStyles) {
        console.log(`\nTesting service.makeAPIRequest("${style}")...`);
        const result = await service.makeAPIRequest(style);

        if (result.found) {
            console.log(`✅ Found: ${result.totalVariants} variants`);
            console.log(`   Style: ${result.styleName}`);
            console.log(`   Brand: ${result.marketingGroupDescription}`);
            if (result.variants && result.variants[0]) {
                const v = result.variants[0];
                console.log(`   First variant: UPC=${v.upcNumber?.trim()}, Wholesale=${v.retail}, MSRP=${v.msrp}`);
            }
        } else {
            console.log(`❌ Not found: ${result.reason}`);
        }
    }
}

testMarchonAPI().then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('Direct API test complete');
    return testMarchonService();
}).then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('All tests complete');
}).catch(err => {
    console.error('Test failed:', err);
});
