/**
 * Europa API Enrichment Test Script
 *
 * Tests the API-first approach for enriching Europa frames
 * API Endpoint: https://europaeye.com/api/products?q={searchTerm}
 */

const axios = require('axios');

// Test data from Europa email - the 20 frames we need to enrich
const testFrames = [
  // American Optical - These are the problem ones (no short codes in model name)
  { brand: 'American Optical', model: 'Adams', colorCode: '1', colorName: 'Black - Green Nylon Polarized - ST', size: '52' },
  { brand: 'American Optical', model: 'Blair', colorCode: '3', colorName: 'Burlwood Pearl - Demo - ST', size: '51' },
  { brand: 'American Optical', model: 'Margot', colorCode: '2', colorName: 'Rose Gold - Brown Nylon Polarized - ST', size: '58' },
  { brand: 'American Optical', model: 'Original Pilot', colorCode: '1', colorName: 'Gold - Gold Mirror Glass Polarized - BT', size: '55' },
  { brand: 'American Optical', model: 'Saratoga', colorCode: '10', colorName: 'Ebony - Gray Nylon Polarized - ST', size: '54' },

  // Cinzia - These have short codes like CIN-5080
  { brand: 'Cinzia', model: 'CIN-5080', colorCode: '1', colorName: 'Peacock Demi', size: '53' },
  { brand: 'Cinzia', model: 'CIN-5164', colorCode: '1', colorName: 'Shadow', size: '53' },
  { brand: 'Cinzia', model: 'CIN-5180', colorCode: '1', colorName: 'Teal', size: '52' },
  { brand: 'Cinzia', model: 'CIN-5184', colorCode: '3', colorName: 'Shadow', size: '51' },
  { brand: 'Cinzia', model: 'CIN-5186', colorCode: '3', colorName: 'Navy Tortoise', size: '50' },
  { brand: 'Cinzia', model: 'CIN-5187', colorCode: '1', colorName: 'Sand / Gold', size: '53' },

  // Michael Ryen - These have short codes like MR-314
  { brand: 'Michael Ryen', model: 'MR-314', colorCode: '1', colorName: 'Matte Black / Gunmetal', size: '60' },
  { brand: 'Michael Ryen', model: 'MR-380', colorCode: '1', colorName: 'Tortoise', size: '58' },
  { brand: 'Michael Ryen', model: 'MR-412', colorCode: '3', colorName: 'Crystal / Gunmetal', size: '49' },
  { brand: 'Michael Ryen', model: 'MR-430', colorCode: '3', colorName: 'Sand / Gold', size: '50' },
  { brand: 'Michael Ryen', model: 'MR-442', colorCode: '1', colorName: 'Black / Crystal', size: '52' },
  { brand: 'Michael Ryen', model: 'MR-446', colorCode: '1', colorName: 'Gunmetal', size: '55' },
  { brand: 'Michael Ryen', model: 'MR-450', colorCode: '1', colorName: 'Chocolate / Black', size: '53' },
  { brand: 'Michael Ryen', model: 'MR-450', colorCode: '2', colorName: 'Gunmetal / Navy', size: '53' },
  { brand: 'Michael Ryen', model: 'MRM-132', colorCode: '2', colorName: 'Black', size: '59' },
];

const API_BASE = 'https://europaeye.com/api/products';

const headers = {
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.5',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

/**
 * Search Europa API for a product
 */
async function searchProduct(searchTerm) {
  try {
    const url = `${API_BASE}?q=${encodeURIComponent(searchTerm)}`;
    const response = await axios.get(url, { headers, timeout: 15000 });
    return response.data;
  } catch (error) {
    console.error(`  ❌ API Error for "${searchTerm}":`, error.message);
    return null;
  }
}

/**
 * Find the best matching variant from search results
 */
function findMatchingVariant(searchResults, targetColorCode, targetSize) {
  if (!searchResults?.data || searchResults.data.length === 0) {
    return null;
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const product of searchResults.data) {
    let score = 0;

    // Check color number match
    const productColorNo = product.color_no || product.data?.colorNo;
    if (productColorNo && parseInt(productColorNo) === parseInt(targetColorCode)) {
      score += 50;
    }

    // Check eye size match
    const productEyeSize = product.eye_size_a || product.data?.eyeSizeA;
    if (productEyeSize && parseInt(productEyeSize) === parseInt(targetSize)) {
      score += 40;
    }

    // Track best match
    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        product,
        score,
        upc: product.data?.upcCode || null,
        stockNo: product.id || product.data?.stockNo,
        colorNo: productColorNo,
        eyeSize: productEyeSize
      };
    }
  }

  // If no good match, use first result as fallback
  if (!bestMatch && searchResults.data.length > 0) {
    const first = searchResults.data[0];
    bestMatch = {
      product: first,
      score: 10,
      upc: first.data?.upcCode || null,
      stockNo: first.id || first.data?.stockNo,
      colorNo: first.color_no || first.data?.colorNo,
      eyeSize: first.eye_size_a || first.data?.eyeSizeA,
      fallback: true
    };
  }

  return bestMatch;
}

/**
 * Main test function
 */
async function runTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  EUROPA API ENRICHMENT TEST');
  console.log('  Testing API-first approach for 20 frames from test email');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results = {
    success: [],
    failed: [],
    partial: []
  };

  for (let i = 0; i < testFrames.length; i++) {
    const frame = testFrames[i];
    console.log(`[${i + 1}/${testFrames.length}] ${frame.brand} - ${frame.model}`);
    console.log(`    Color: ${frame.colorCode} ${frame.colorName}, Size: ${frame.size}`);

    // Strategy 1: Search by model name only
    let searchTerm = frame.model;
    console.log(`    🔍 Searching API: "${searchTerm}"`);

    let searchResults = await searchProduct(searchTerm);
    let match = findMatchingVariant(searchResults, frame.colorCode, frame.size);

    // Strategy 2: If no results, try brand + model (less likely to work but worth trying)
    if (!match && searchResults?.data?.length === 0) {
      searchTerm = `${frame.brand} ${frame.model}`;
      console.log(`    🔍 Retry with: "${searchTerm}"`);
      searchResults = await searchProduct(searchTerm);
      match = findMatchingVariant(searchResults, frame.colorCode, frame.size);
    }

    // Strategy 3: Try just the model number if it has one
    if (!match && searchResults?.data?.length === 0) {
      const numberMatch = frame.model.match(/\d+/);
      if (numberMatch) {
        searchTerm = numberMatch[0];
        console.log(`    🔍 Retry with number: "${searchTerm}"`);
        searchResults = await searchProduct(searchTerm);
        match = findMatchingVariant(searchResults, frame.colorCode, frame.size);
      }
    }

    if (match && match.upc) {
      console.log(`    ✅ FOUND - UPC: ${match.upc}`);
      console.log(`       Stock: ${match.stockNo}, Score: ${match.score}${match.fallback ? ' (fallback)' : ''}`);
      results.success.push({
        ...frame,
        upc: match.upc,
        stockNo: match.stockNo,
        matchScore: match.score
      });
    } else if (match) {
      console.log(`    ⚠️  PARTIAL - Found product but no UPC`);
      console.log(`       Stock: ${match.stockNo}, Score: ${match.score}`);
      results.partial.push({
        ...frame,
        stockNo: match.stockNo,
        matchScore: match.score,
        reason: 'No UPC in API response'
      });
    } else {
      console.log(`    ❌ NOT FOUND - No results from API`);
      results.failed.push({
        ...frame,
        reason: 'No API results'
      });
    }

    console.log('');

    // Small delay between requests to be nice to the server
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Success (with UPC): ${results.success.length}/${testFrames.length}`);
  console.log(`  ⚠️  Partial (no UPC):  ${results.partial.length}/${testFrames.length}`);
  console.log(`  ❌ Failed:            ${results.failed.length}/${testFrames.length}`);
  console.log('');

  if (results.success.length > 0) {
    console.log('  Successful enrichments:');
    results.success.forEach(r => {
      console.log(`    - ${r.brand} ${r.model}: UPC ${r.upc}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n  Failed enrichments:');
    results.failed.forEach(r => {
      console.log(`    - ${r.brand} ${r.model}: ${r.reason}`);
    });
  }

  if (results.partial.length > 0) {
    console.log('\n  Partial enrichments (no UPC):');
    results.partial.forEach(r => {
      console.log(`    - ${r.brand} ${r.model}: ${r.reason}`);
    });
  }

  const successRate = ((results.success.length / testFrames.length) * 100).toFixed(1);
  console.log(`\n  📊 Success Rate: ${successRate}%`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  return results;
}

// Run the test
runTest().catch(console.error);
