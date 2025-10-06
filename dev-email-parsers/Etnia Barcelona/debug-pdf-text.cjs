const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const pdfPath = path.join(__dirname, '1201039424.PDF');
const pdfBuffer = fs.readFileSync(pdfPath);

async function debug() {
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    console.log('PDF Pages:', pdfData.numpages);
    console.log('Text Length:', text.length);
    console.log('\n=== First 2000 chars ===\n');
    console.log(text.substring(0, 2000));

    console.log('\n\n=== Looking for frame patterns ===');
    const lines = text.split('\n');

    // Look for lines starting with ORDI-
    const ordiLines = lines.filter(l => l.includes('ORDI-'));
    console.log('\nLines with ORDI-:', ordiLines.length);
    ordiLines.slice(0, 5).forEach(line => console.log('  ', line));

    // Write full text to file
    fs.writeFileSync(path.join(__dirname, 'pdf-text.txt'), text);
    console.log('\n✅ Full PDF text saved to pdf-text.txt');
}

debug();
