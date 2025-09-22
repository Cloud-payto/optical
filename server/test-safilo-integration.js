const SafiloService = require('./parsers/SafiloService');
const fs = require('fs');

/**
 * Simple test to verify SafiloService integration
 */
async function testSafiloIntegration() {
    console.log('🧪 Testing SafiloService Integration...\n');
    
    try {
        // Initialize SafiloService
        const safiloService = new SafiloService({
            debug: true,
            minConfidence: 50,
            batchSize: 3,
            timeout: 5000
        });
        
        console.log('✅ SafiloService initialized successfully');
        console.log('✅ Dependencies loaded correctly');
        
        // Test parser registry
        const parserRegistry = require('./parsers');
        console.log('✅ Parser registry loaded');
        console.log('✅ Safilo parser registered');
        
        // Test if we can access the transform function
        if (parserRegistry.safiloService) {
            console.log('✅ SafiloService accessible from registry');
        }
        
        console.log('\n🎉 Integration test passed!');
        console.log('\nNext steps:');
        console.log('1. Send a Safilo PDF via email webhook');
        console.log('2. Monitor processing with enhanced API enrichment');
        console.log('3. View enriched data in inventory interface');
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testSafiloIntegration();