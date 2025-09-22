const parserRegistry = require('./parsers');

/**
 * Test the parser registry to see if Safilo parser is properly registered
 */
function testParserRegistry() {
    console.log('🧪 Testing Parser Registry...\n');
    
    try {
        // Test different Safilo email addresses
        const safiloEmails = [
            'noreply@safilo.com',
            'test@safilo.com', 
            'orders@safilogroup.com'
        ];
        
        safiloEmails.forEach(email => {
            console.log(`Testing email: ${email}`);
            const hasParser = parserRegistry.hasParser(email);
            console.log(`- Has Parser: ${hasParser}`);
            
            if (hasParser) {
                const parser = parserRegistry.getParser(email);
                console.log(`- Parser Type: ${typeof parser}`);
                console.log(`- Parser Info:`, parser);
                
                if (typeof parser === 'object' && parser.type) {
                    console.log(`- PDF Parser: ${parser.type === 'pdf'}`);
                    console.log(`- Function: ${typeof parser.parser}`);
                }
            }
            console.log('');
        });
        
        // Check if SafiloService is accessible
        console.log('SafiloService instance:', parserRegistry.safiloService ? '✅ Available' : '❌ Missing');
        
        // Test domain extraction
        console.log('\nDomain extraction tests:');
        console.log(`noreply@safilo.com -> ${parserRegistry.extractDomain('noreply@safilo.com')}`);
        console.log(`test@safilogroup.com -> ${parserRegistry.extractDomain('test@safilogroup.com')}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testParserRegistry();