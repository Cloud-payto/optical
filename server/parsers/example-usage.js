const SafiloService = require('./SafiloService');
const fs = require('fs');

/**
 * EXAMPLE USAGE - How to integrate SafiloService into your application
 */

// Example 1: Basic usage with file
async function processFromFile() {
    const service = new SafiloService({
        debug: true,
        minConfidence: 50,
        batchSize: 3
    });
    
    try {
        // Read PDF file
        const pdfBuffer = fs.readFileSync('safilo_order.pdf');
        
        // Process the order
        const result = await service.processOrder(pdfBuffer);
        
        // Save results
        fs.writeFileSync('processed_order.json', JSON.stringify(result, null, 2));
        
        console.log(`✅ Processed ${result.frames.length} frames`);
        console.log(`📊 Validation rate: ${result.statistics.validationRate}`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

// Example 2: Express.js API endpoint
async function createExpressEndpoint(app) {
    const multer = require('multer');
    const upload = multer({ storage: multer.memoryStorage() });
    
    app.post('/api/safilo/process', upload.single('pdf'), async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }
        
        const service = new SafiloService();
        
        try {
            const result = await service.processOrder(req.file.buffer);
            
            res.json({
                success: true,
                data: result,
                summary: {
                    totalFrames: result.frames.length,
                    validatedFrames: result.statistics.validated,
                    validationRate: result.statistics.validationRate,
                    processingTime: result.statistics.processingTimeSeconds
                }
            });
            
        } catch (error) {
            console.error('SafiloService error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Processing failed',
                message: error.message 
            });
        }
    });
}

// Example 3: Queue/Job processing
async function processAsJob(jobData) {
    const service = new SafiloService({
        timeout: 15000,
        maxRetries: 5,
        batchSize: 10
    });
    
    try {
        const { pdfBuffer, orderId, userId } = jobData;
        
        const result = await service.processOrder(pdfBuffer);
        
        // Store in database
        await database.orders.update(orderId, {
            status: 'processed',
            frames: result.frames,
            statistics: result.statistics,
            processedAt: new Date()
        });
        
        // Send notification
        await notifications.send(userId, {
            type: 'order_processed',
            orderId: orderId,
            framesCount: result.frames.length,
            validationRate: result.statistics.validationRate
        });
        
        return result;
        
    } catch (error) {
        // Handle job failure
        await database.orders.update(orderId, {
            status: 'failed',
            error: error.message,
            failedAt: new Date()
        });
        
        throw error;
    }
}

// Example 4: Batch processing multiple files
async function processBatch(pdfFiles) {
    const service = new SafiloService({ debug: false });
    const results = [];
    
    for (const file of pdfFiles) {
        console.log(`Processing ${file.name}...`);
        
        try {
            const pdfBuffer = fs.readFileSync(file.path);
            const result = await service.processOrder(pdfBuffer);
            
            results.push({
                filename: file.name,
                success: true,
                data: result
            });
            
        } catch (error) {
            results.push({
                filename: file.name,
                success: false,
                error: error.message
            });
        }
    }
    
    return results;
}

// Example 5: Custom validation rules
class CustomSafiloService extends SafiloService {
    crossReferenceFrame(parsedFrame, apiData) {
        const result = super.crossReferenceFrame(parsedFrame, apiData);
        
        // Add custom validation logic
        if (result.validated) {
            // Require UPC for high-value items
            if (result.bestMatch.wholesale > 100 && !result.bestMatch.upc) {
                result.validated = false;
                result.reason = 'High-value item missing UPC';
            }
            
            // Flag discontinued items
            if (result.bestMatch.availability === 'discontinued') {
                result.warnings = ['Item is discontinued'];
            }
        }
        
        return result;
    }
}

module.exports = {
    SafiloService,
    processFromFile,
    createExpressEndpoint,
    processAsJob,
    processBatch,
    CustomSafiloService
};