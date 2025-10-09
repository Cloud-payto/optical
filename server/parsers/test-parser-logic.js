const SafiloService = require('./SafiloService');

/**
 * Test the parser logic with sample frame lines from the PDF
 * Based on the actual PDF content you provided
 */
function testParserLogic() {
    console.log('🧪 Testing Safilo Parser Logic\n');

    const service = new SafiloService();

    // Test frames from the actual PDF - including the problematic ones
    const testCases = [
        {
            line: 'KS CHERETTE2/US X19 PATTERN MULTICOLOR 52/17 140',
            expected: {
                brand: 'KS',
                model: 'KS CHERETTE2',  // Should NOT have /US
                colorCode: 'X19'
            }
        },
        {
            line: 'KS POLINA 2/G/S 84E GOLD BEIGE 61/15 140 HA',
            expected: {
                brand: 'KS',
                model: 'KS POLINA 2',  // Should NOT have /G/S
                colorCode: '84E'
            }
        },
        {
            line: 'KS JAILENE 2/FJ 3H2 BLACK PINK 52/17 140',
            expected: {
                brand: 'KS',
                model: 'KS JAILENE 2',  // Should NOT have /FJ
                colorCode: '3H2'
            }
        },
        {
            line: 'HER 0334/C 807 BLACK 53/17 145 WJ',
            expected: {
                brand: 'HER',
                model: 'HER 0334',  // Should NOT have /C
                colorCode: '807'
            }
        },
        {
            line: 'BOSS 1857/G/U TI7 MATTE BLACK RUTHENIUM 56/18 145 O7',
            expected: {
                brand: 'BOSS',
                model: 'BOSS 1857',  // Should NOT have /G/U
                colorCode: 'TI7'
            }
        },
        {
            line: 'KS CAELEY 2/S 09Q BROWN 52/20 140 HA',
            expected: {
                brand: 'KS',
                model: 'KS CAELEY 2',  // Should NOT have /S
                colorCode: '09Q'
            }
        }
    ];

    console.log('Testing frame parsing with variant suffix removal:\n');

    let passed = 0;
    let failed = 0;

    testCases.forEach((testCase, idx) => {
        console.log(`Test ${idx + 1}: ${testCase.line.substring(0, 60)}...`);

        const result = service.parseFrameLine(testCase.line, idx + 1);

        if (!result) {
            console.log('  ❌ Failed to parse line');
            failed++;
            return;
        }

        const checks = [];

        // Check brand
        if (result.brand === testCase.expected.brand) {
            checks.push('✅ Brand correct');
        } else {
            checks.push(`❌ Brand wrong: expected "${testCase.expected.brand}", got "${result.brand}"`);
        }

        // Check model (most important - should NOT have suffixes)
        if (result.model === testCase.expected.model) {
            checks.push('✅ Model correct (suffix removed)');
        } else {
            checks.push(`❌ Model wrong: expected "${testCase.expected.model}", got "${result.model}"`);
        }

        // Check color code
        if (result.colorCode === testCase.expected.colorCode) {
            checks.push('✅ Color code correct');
        } else {
            checks.push(`❌ Color code wrong: expected "${testCase.expected.colorCode}", got "${result.colorCode}"`);
        }

        const testPassed = checks.every(check => check.startsWith('✅'));
        if (testPassed) {
            passed++;
            console.log('  ✅ PASSED');
        } else {
            failed++;
            console.log('  ❌ FAILED');
            checks.forEach(check => console.log(`    ${check}`));
        }

        console.log('');
    });

    console.log('═══════════════════════════════════════');
    console.log(`Results: ${passed}/${testCases.length} tests passed`);

    if (failed === 0) {
        console.log('✅ ALL TESTS PASSED!');
        console.log('The parser correctly removes variant suffixes like /US, /G, /S, /FJ, etc.');
    } else {
        console.log(`❌ ${failed} TESTS FAILED`);
    }
    console.log('═══════════════════════════════════════\n');

    // Test search variations
    console.log('Testing Kate Spade search variations:\n');
    const testFrame = {
        brand: 'KS',
        model: 'KS CHERETTE2',
        colorCode: 'X19'
    };

    const variations = service.generateSearchVariations(testFrame);
    console.log('Search variations generated for "KS CHERETTE2":');
    variations.forEach((v, idx) => {
        console.log(`  ${idx + 1}. "${v}"`);
    });

    const expectedVariations = [
        'KATE SPADE CHERETTE2',
        'kate spade CHERETTE2',
        'CHERETTE2'
    ];

    const hasExpected = expectedVariations.every(exp =>
        variations.some(v => v.toLowerCase().includes(exp.toLowerCase()))
    );

    console.log('');
    if (hasExpected) {
        console.log('✅ Search variations include Kate Spade expansions');
    } else {
        console.log('❌ Missing expected Kate Spade search variations');
    }

    return failed === 0;
}

// Run the test
const success = testParserLogic();
process.exit(success ? 0 : 1);
