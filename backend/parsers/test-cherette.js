const SafiloService = require('./SafiloService');

const service = new SafiloService();
const result = service.parseFrameLine('KS CHERETTE2/US X19 PATTERN MULTICOLOR 52/17 140', 1);

console.log('═══════════════════════════════════════');
console.log('Testing KS CHERETTE2/US Frame');
console.log('═══════════════════════════════════════');
console.log('');
console.log('Original line: KS CHERETTE2/US X19 PATTERN MULTICOLOR 52/17 140');
console.log('');
console.log('Parsed Results:');
console.log('  Brand:', result.brand);
console.log('  Model:', result.model);
console.log('  Color Code:', result.colorCode);
console.log('  Color Name:', result.colorName);
console.log('  Size:', result.size);
console.log('');
console.log('Suffix Removal:');
console.log('  Has /US suffix?', result.model.includes('/US') ? 'YES ❌ FAILED' : 'NO ✅ PASSED');
console.log('');

const variations = service.generateSearchVariations(result);
console.log('API Search Variations Generated:');
variations.forEach((v, i) => console.log(`  ${i+1}. "${v}"`));
console.log('');

const hasKateSpade = variations.some(v => v.toLowerCase().includes('kate spade'));
console.log('Kate Spade Brand Expansion:');
console.log('  Includes "Kate Spade"?', hasKateSpade ? 'YES ✅' : 'NO ❌');
console.log('');

console.log('═══════════════════════════════════════');
if (!result.model.includes('/US') && hasKateSpade) {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('');
    console.log('The parser now:');
    console.log('  1. Removes the /US suffix from CHERETTE2/US');
    console.log('  2. Generates Kate Spade search variations');
    console.log('  3. Will correctly label as "Kate Spade" after API call');
} else {
    console.log('❌ SOME CHECKS FAILED');
}
console.log('═══════════════════════════════════════');
