const axios = require('axios');

const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const chars = 'ABCDEFGHIJ0123456789'.split('');
    const allProducts = new Map();
    let totalReturned = 0;

    console.log('Testing Alphabet Soup approach with first 10 letters + digits...\n');

    for (const c of chars) {
        try {
            const res = await axios.post('https://www.mysafilo.com/US/api/CatalogAPI/filter', {
                Collections: [],
                ColorFamily: [],
                Shapes: [],
                FrameTypes: [],
                Genders: [],
                FrameMaterials: [],
                FrontMaterials: [],
                HingeTypes: [],
                RimTypes: [],
                TempleMaterials: [],
                LensMaterials: [],
                FITTING: [],
                COUNTRYOFORIGIN: [],
                NewStyles: false,
                BestSellers: false,
                RxAvailable: false,
                InStock: false,
                Readers: false,
                ASizes: {min: -1, max: -1},
                BSizes: {min: -1, max: -1},
                EDSizes: {min: -1, max: -1},
                DBLSizes: {min: -1, max: -1},
                search: c
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            console.log(`"${c}": ${res.data.length} products`);
            totalReturned += res.data.length;

            for (const p of res.data) {
                const key = p.styleCode || p.model;
                if (!allProducts.has(key)) {
                    allProducts.set(key, p);
                }
            }

            await delay(1200);

        } catch (err) {
            console.error(`"${c}" - Error:`, err.message);
        }
    }

    console.log('\n=== RESULTS ===');
    console.log('Total API responses:', totalReturned, 'products');
    console.log('Unique products:', allProducts.size);

    const brands = new Set();
    Array.from(allProducts.values()).forEach(p => brands.add(p.collectionName));
    console.log('\nBrands found:', Array.from(brands).sort().join(', '));

    // Extrapolate to full alphabet
    const avgPerChar = allProducts.size / chars.length;
    const estimatedTotal = Math.round(avgPerChar * 36); // 26 letters + 10 digits
    console.log(`\nEstimated total catalog (all 36 chars): ~${estimatedTotal} products`);
})();
