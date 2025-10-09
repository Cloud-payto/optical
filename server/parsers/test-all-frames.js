const SafiloService = require('./SafiloService');

/**
 * Test parsing all 41 frames from the PDF
 * Based on the actual PDF content provided
 */
function testAllFrames() {
    console.log('🧪 Testing All 41 Frames from PDF\n');

    const service = new SafiloService();

    // All frame lines from the PDF (page 1 + page 2)
    const allFrameLines = [
        // Page 1 - 24 frames (last one CATRINA/3 continues to page 2)
        'HER 0153 RHL GOLD BLACK 54/18 145',
        'HER 0246 1ED GREEN 53/16 145',
        'HER 0274 807 BLACK 55/16 145',
        'HER 0324 PJP BLUE 53/19 140',
        'HER 0329/G 1ZX PINK HORN 53/17 140',
        'HER 0334/C 807 BLACK 53/17 145 WJ',
        'HER 0339/S 807 BLACK 57/18 145 9O',
        'HER 0341 1ED GREEN 55/14 145',
        'HER 0343 SDK BLACK MULTICOLOR 53/15 145',
        'HER 0348/S 3H2 BLACK PINK 55/20 140 HA',
        'HER 0353 9E1 BLACK SHADED CORAL 54/16 140',
        'HER 0356/G 1ED GREEN 53/13 140',
        'HER 0357 LKS GOLD BLUE 54/17 140',
        'HER 0358/G 807 BLACK 51/16 145',
        'HER 0359/G K4G BURGUNDY HORN 52/15 140',
        'BOSS 0679/IT 3HH STRIPED BLUE GREY 56/15 145',
        'BOSS 1740/F 09Q BROWN 53/19 145',
        'BOSS 1761/S J5G GOLD 62/16 135 UC',
        'BOSS 1764 I46 MATTE BLACK GOLD 57/17 145',
        'BOSS 1833 2W8 GREY HORN 57/19 150',
        'BOSS 1850 003 MATTE BLACK 55/19 150',
        'BOSS 1857/G/U TI7 MATTE BLACK RUTHENIUM 56/18 145 O7',
        'ADRIE/3 VDY PATTERN CRYSTAL BLACK 53/16 140',
        'CATRINA/3 TAY BLACK PATTERN WHITE 51/15 135',

        // Page 2 - 17 frames
        'CLAUDIE/G KB7 GREY 54/16 140',
        'CLIO/G 807 BLACK 53/17 140',
        'GAIA 4QX CRYSTAL MULTIC 52/17 140',
        'HELKA/N/FJ 2IK HAVANA GOLD 49/22 140',
        'JOLIET/3 1ED GREEN 51/17 140',
        'KS CAELEY 2/S 09Q BROWN 52/20 140 HA',
        'KS CHERETTE2/US X19 PATTERN MULTICOLOR 52/17 140',
        'KS DAESHA 2/G/S TCB BLACK WHITE HAVANA 55/19 145 9O',
        'KS HERMIONE 2 35J PINK 52/18 140',
        'KS JACALYN 2/G 1ED GREEN 54/16 140',
        'KS JAILENE 2/FJ 3H2 BLACK PINK 52/17 140',
        'KS KAYSIE 2/G/S 807 BLACK 58/17 145 HA',
        'KS POLINA 2/G/S 84E GOLD BEIGE 61/15 140 HA',
        'KS REILLY 2 3H2 BLACK PINK 55/17 140',
        'KS TAYA 2 F8X STRIPED BURGUNDY VIOLET 52/16 140',
        'KS TEYA HKZ VIOLET HAVANA 52/16 140',
        'YOLANDA/S 807 BLACK 51/20 140 9O'
    ];

    console.log(`Total frame lines to test: ${allFrameLines.length}`);
    console.log('Expected: 41 frames\n');

    let successCount = 0;
    let failCount = 0;
    const failedLines = [];

    console.log('Parsing frames...\n');

    allFrameLines.forEach((line, idx) => {
        const result = service.parseFrameLine(line, idx + 1);

        if (result) {
            successCount++;

            // Check for problematic suffixes
            const hasSuffix = result.model.match(/\/[A-Z]+/);
            const status = hasSuffix ? '⚠️ ' : '✅';

            console.log(`${status} ${idx + 1}. ${result.brand} ${result.model} ${result.colorCode} - ${result.size}`);

            if (hasSuffix) {
                console.log(`   ❌ WARNING: Model still contains suffix: ${result.model}`);
            }
        } else {
            failCount++;
            failedLines.push({ lineNumber: idx + 1, line });
            console.log(`❌ ${idx + 1}. FAILED TO PARSE: ${line}`);
        }
    });

    console.log('\n═══════════════════════════════════════');
    console.log(`Results: ${successCount}/${allFrameLines.length} frames parsed`);
    console.log('');

    if (successCount === 41) {
        console.log('✅ SUCCESS: All 41 frames parsed correctly!');
    } else {
        console.log(`❌ FAILED: Expected 41 frames, parsed ${successCount}`);
    }

    if (failCount > 0) {
        console.log(`\n❌ Failed to parse ${failCount} lines:`);
        failedLines.forEach(f => {
            console.log(`  Line ${f.lineNumber}: ${f.line}`);
        });
    }

    // Check specifically for suffix removal
    const parsedFrames = allFrameLines.map((line, idx) =>
        service.parseFrameLine(line, idx + 1)
    ).filter(Boolean);

    const framesWithSuffixes = parsedFrames.filter(f => f.model.match(/\/[A-Z]+/));

    console.log('\n🔍 Suffix Removal Check:');
    if (framesWithSuffixes.length === 0) {
        console.log('✅ All variant suffixes removed correctly!');
    } else {
        console.log(`❌ ${framesWithSuffixes.length} frames still have suffixes:`);
        framesWithSuffixes.forEach(f => {
            console.log(`  - ${f.model}`);
        });
    }

    console.log('═══════════════════════════════════════\n');

    return successCount === 41 && framesWithSuffixes.length === 0;
}

// Run the test
const success = testAllFrames();
process.exit(success ? 0 : 1);
