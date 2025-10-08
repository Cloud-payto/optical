const fs = require('fs');
const data = JSON.parse(fs.readFileSync('parsed-result.json', 'utf8'));

console.log('Color extraction test:\n');
console.log('='.repeat(70));

data.frames.forEach((item, i) => {
    console.log(`${i+1}. ${item.model}`);
    console.log(`   Color: ${item.colorName}`);
    console.log(`   Code: ${item.colorCode}`);
    console.log(`   Material: ${item.material}`);
    console.log();
});

console.log('='.repeat(70));
console.log(`\nTotal items: ${data.frames.length}`);
