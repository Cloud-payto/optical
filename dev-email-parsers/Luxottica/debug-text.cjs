const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Read the sample email
const emailPath = path.join(__dirname, 'email.txt');
const html = fs.readFileSync(emailPath, 'utf-8');

// Extract text from <pre> tag
const $ = cheerio.load(html);
const textContent = $('pre').text();

console.log('Text length:', textContent.length);
console.log('\n=== First 1000 chars ===');
console.log(textContent.substring(0, 1000));

console.log('\n\n=== Look for brand patterns ===');
const brandMatches = textContent.match(/<font size="5"><b><i>([A-Z\s&]+)\s*\((\d+)\)/g);
console.log('Brand matches:', brandMatches);

console.log('\n\n=== Check if HTML tags are in the text ===');
console.log('Has <font> tags:', textContent.includes('<font'));
console.log('Has <b> tags:', textContent.includes('<b>'));
console.log('Has <i> tags:', textContent.includes('<i>'));

// Write to file for detailed inspection
fs.writeFileSync(path.join(__dirname, 'extracted-text.txt'), textContent);
console.log('\n✅ Full text saved to extracted-text.txt');
