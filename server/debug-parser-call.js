const parserRegistry = require('./parsers');

/**
 * Debug script to test exact parser call flow
 */
async function debugParserCall() {
    console.log('🔍 Debugging Parser Call Flow...\n');
    
    try {
        const testEmail = 'noreply@safilo.com';
        
        console.log('1. Testing parser detection:');
        const hasParser = parserRegistry.hasParser(testEmail);
        console.log(`   Has Parser: ${hasParser}`);
        
        if (hasParser) {
            console.log('\n2. Getting parser info:');
            const parserInfo = parserRegistry.getParser(testEmail);
            console.log(`   Parser Type: ${typeof parserInfo}`);
            console.log(`   Is Object: ${typeof parserInfo === 'object'}`);
            console.log(`   Has Parser Function: ${!!(parserInfo && parserInfo.parser)}`);
            console.log(`   Parser Type: ${parserInfo?.type}`);
            console.log(`   Function Name: ${parserInfo?.parser?.name}`);
            
            console.log('\n3. Testing parser function call:');
            if (parserInfo && parserInfo.parser && parserInfo.type === 'pdf') {
                console.log('   ✅ PDF parser detected');
                
                // Create a dummy PDF buffer for testing
                const testBuffer = Buffer.from('%PDF-1.4 test content');
                
                try {
                    console.log('   🚀 Calling parser function...');
                    const result = await parserInfo.parser(testBuffer);
                    console.log('   ✅ Parser call succeeded!');
                    console.log('   Result type:', typeof result);
                    console.log('   Has orderInfo:', !!(result && result.orderInfo));
                    console.log('   Has frames:', !!(result && result.frames));
                } catch (parseError) {
                    console.log('   ❌ Parser call failed:', parseError.message);
                    console.log('   This might be expected with dummy PDF data');
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugParserCall();