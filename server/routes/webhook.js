const express = require('express');
const router = express.Router();
const { emailOperations, inventoryOperations, checkDuplicateOrder } = require('../lib/supabase');
const parserRegistry = require('../parsers');

/**
 * Smart vendor detection for forwarded emails
 * @param {object} emailData - Processed email data
 * @param {object} rawEmailData - Raw CloudMailin data
 * @returns {string} Domain to use for parser selection
 */
function detectVendorFromEmail(emailData, rawEmailData) {
  const subject = emailData.subject.toLowerCase();
  const plainText = emailData.plain_text.toLowerCase();
  const htmlText = emailData.html_text.toLowerCase();
  
  console.log('Detecting vendor from email:');
  console.log('- Subject:', subject);
  console.log('- From:', emailData.from);
  
  // 1. Check subject line for vendor keywords
  if (subject.includes('safilo') || subject.includes('eyerep order') || 
      subject.includes('receipt for order') || subject.includes('order confirmation')) {
    
    // For generic order subjects, check if content mentions Safilo
    if (plainText.includes('safilo') || htmlText.includes('safilo')) {
      console.log('✓ Detected Safilo from subject + content combination');
      return 'noreply@safilo.com';
    }
  }
  
  // 2. Look for original sender in forwarded email content
  console.log('- Checking forwarded content...');
  console.log('- Plain text preview:', plainText.substring(0, 200));
  
  // Multiple patterns to catch different forwarding formats
  const fromPatterns = [
    /from:\s*safilo[^<]*<([^>]*safilo[^>]*)>/i,
    /from:\s*[^<]*<([^>]*safilo[^>]*)>/i,
    /from:\s*[^<]*<([^>]*@safilo\.com[^>]*)>/i,
    /sender:\s*[^<]*<([^>]*safilo[^>]*)>/i,
    /<([^>]*@safilo\.com[^>]*)>/i,
    /noreply@safilo\.com/i
  ];
  
  for (const pattern of fromPatterns) {
    const plainMatch = plainText.match(pattern);
    const htmlMatch = htmlText.match(pattern);
    
    if (plainMatch) {
      console.log('✓ Detected Safilo from forwarded content (plain):', plainMatch[0]);
      return 'noreply@safilo.com';
    }
    if (htmlMatch) {
      console.log('✓ Detected Safilo from forwarded content (html):', htmlMatch[0]);
      return 'noreply@safilo.com';
    }
  }
  
  // 3. Check email content for vendor signatures
  if (plainText.includes('safilo usa') || plainText.includes('mysafilo.com') || 
      htmlText.includes('safilo usa') || htmlText.includes('mysafilo.com')) {
    console.log('✓ Detected Safilo from email signature');
    return 'noreply@safilo.com';
  }
  
  // 4. Check for Modern Optical
  if (subject.includes('modern optical') || plainText.includes('modern optical') || 
      htmlText.includes('modern optical')) {
    console.log('✓ Detected Modern Optical from content');
    return 'orders@modernoptical.com';
  }
  
  // 5. Check email references header for original domain
  const references = rawEmailData.headers?.references;
  const inReplyTo = rawEmailData.headers?.in_reply_to;
  
  if (references && references.toUpperCase().includes('SAFILO.COM')) {
    console.log('✓ Detected Safilo from references header');
    return 'noreply@safilo.com';
  }
  
  if (inReplyTo && inReplyTo.toUpperCase().includes('SAFILO.COM')) {
    console.log('✓ Detected Safilo from in-reply-to header');
    return 'noreply@safilo.com';
  }
  
  // 6. Fallback to domain-based detection
  const domain = emailData.from.split('@')[1]?.toLowerCase() || '';
  console.log('→ Falling back to domain-based detection:', domain);
  return domain;
}

// POST /api/webhook/email - CloudMailin webhook endpoint
router.post('/email', async (req, res) => {
  try {
    console.log('=== Incoming CloudMailin Webhook ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // CloudMailin sends data in the following structure
    const {
      headers,
      envelope,
      plain,
      html,
      attachments,
      reply_plain,
      spam_score,
      spam_status
    } = req.body;

    // Extract important email data
    const emailData = {
      from: envelope?.from || headers?.from || 'unknown',
      to: envelope?.to?.[0] || headers?.to || 'unknown',
      subject: headers?.subject || 'No Subject',
      date: headers?.date || new Date().toISOString(),
      message_id: headers?.message_id || null,
      plain_text: plain || '',
      html_text: html || '',
      spam_score: spam_score || 0,
      spam_status: spam_status || 'unknown',
      attachments_count: attachments?.length || 0,
      attachments: attachments || []
    };

    // Log extracted data
    console.log('Extracted Email Data:', {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      attachments: emailData.attachments_count
    });

    // TODO: Determine account_id based on 'to' email address
    // For now, we'll use a placeholder account_id = 1
    const accountId = 1;

    // Save to database
    const result = await emailOperations.saveEmail({
      account_id: accountId,
      from_email: emailData.from,
      to_email: emailData.to,
      subject: emailData.subject,
      message_id: emailData.message_id,
      spam_score: emailData.spam_score,
      spam_status: emailData.spam_status,
      attachments_count: emailData.attachments_count,
      raw_data: JSON.stringify(req.body),
      plain_text: emailData.plain_text,
      html_text: emailData.html_text,
      received_at: emailData.date,
      processed_at: new Date().toISOString()
    });
    
    console.log('Email saved to database with ID:', result.id);

    // Try to parse the email using vendor-specific parser
    console.log('\n=== VENDOR DETECTION START ===');
    const fromEmail = detectVendorFromEmail(emailData, req.body);
    console.log('=== VENDOR DETECTION RESULT:', fromEmail, '===');
    console.log('Attempting to parse email from:', fromEmail);
    
    if (parserRegistry.hasParser(fromEmail)) {
      console.log('Parser found for vendor, processing...');
      try {
        const parsedData = await parserRegistry.parseEmail(fromEmail, emailData.html_text, emailData.plain_text, emailData.attachments);
        
        if (parsedData && parsedData.items && parsedData.items.length > 0) {
          console.log(`Parsed ${parsedData.items.length} items from ${parsedData.vendor} order`);
          console.log('📊 Webhook Parse Result Summary:');
          console.log('- Vendor:', parsedData.vendor);
          console.log('- Account Number:', parsedData.account_number);
          console.log('- Order Number:', parsedData.order?.order_number);
          console.log('- Customer Name:', parsedData.order?.customer_name);
          console.log('- Parser Version:', parsedData.parser_version);
          
          // Check for duplicate order before processing
          const orderNumber = parsedData.order?.order_number;
          const customerName = parsedData.order?.customer_name;
          const accountNumber = parsedData.order?.account_number;
          
          console.log(`Checking for duplicate order: ${orderNumber} from ${customerName} (${accountNumber})`);
          
          if (orderNumber) {
            const duplicateCheck = await checkDuplicateOrder(orderNumber, accountId);
            console.log('Duplicate check result:', duplicateCheck);
            
            if (duplicateCheck) {
              console.log(`Duplicate order detected: ${orderNumber}`);
              
              // Still update email with parsed data for reference, but don't create inventory
              await emailOperations.updateEmailWithParsedData(result.id, {
                ...parsedData,
                duplicate_order: true,
                duplicate_message: `Duplicate order: ${orderNumber}`
              });
              
              return res.status(200).json({ 
                success: true,
                message: 'Email processed but duplicate order detected',
                emailId: result.id,
                parsed: true,
                duplicate: true,
                duplicateMessage: `Duplicate order: ${orderNumber}`
              });
            }
          } else {
            console.log('No order number found, proceeding with processing');
          }
          
          // Update email with parsed data
          await emailOperations.updateEmailWithParsedData(result.id, parsedData);
          
          // Prepare inventory items with "pending" status
          const inventoryItems = parsedData.items.map(item => ({
            account_id: accountId,
            sku: item.sku,
            brand: item.brand,
            model: item.model,
            color: item.color,
            color_code: item.color_code,
            color_name: item.color_name,
            size: item.size,
            full_size: item.full_size,
            temple_length: item.temple_length,
            quantity: item.quantity,
            vendor: item.vendor || parsedData.vendor || '',
            status: 'pending',
            email_id: result.id,
            order_number: parsedData.order?.order_number || '',
            account_number: parsedData.account_number || parsedData.order?.account_number || '',
            full_name: item.full_name,
            wholesale_price: item.wholesale_price,
            upc: item.upc,
            in_stock: item.in_stock,
            api_verified: item.api_verified
          }));
          
          // Save inventory items
          await inventoryOperations.saveInventoryItems(inventoryItems);
          
          console.log('Email parsed and inventory items created');
        } else {
          console.log('No items found in parsed data');
        }
      } catch (parseError) {
        console.error('Error parsing email:', parseError);
        // Continue processing - parsing failure shouldn't break webhook
      }
    } else {
      console.log('No parser available for this vendor domain');
    }

    // CloudMailin expects a 200 status for successful processing
    res.status(200).json({ 
      success: true,
      message: 'Email processed successfully',
      emailId: result.id,
      parsed: parserRegistry.hasParser(fromEmail)
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // CloudMailin will retry if we return 500
    // Return 200 with error flag if we want to prevent retry
    res.status(200).json({ 
      success: false,
      error: error.message,
      message: 'Email received but processing failed'
    });
  }
});

// GET /api/webhook/email/test - Test endpoint
router.get('/email/test', (req, res) => {
  res.json({ 
    message: 'Email webhook endpoint is ready',
    endpoint: '/api/webhook/email',
    method: 'POST'
  });
});

// GET /api/webhook/email/list/:accountId - List emails for an account
router.get('/email/list/:accountId', (req, res) => {
  try {
    const { accountId } = req.params;
    const emails = getEmailsByAccount(accountId);
    
    res.json({
      success: true,
      count: emails.length,
      emails: emails
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/webhook/email/debug/:emailId - Debug email parsing
router.get('/email/debug/:emailId', (req, res) => {
  try {
    const { emailId } = req.params;
    const emails = getEmailsByAccount(1); // Default account
    const email = emails.find(e => e.id === parseInt(emailId));
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    // Show both raw and parsed data
    res.json({
      email_id: email.id,
      subject: email.subject,
      from: email.from_email,
      parsed_data: email.parsed_data,
      has_html: !!email.html_text,
      has_plain: !!email.plain_text,
      parse_status: email.parse_status,
      // Show a preview of the content to debug parsing
      content_preview: {
        plain_preview: email.plain_text ? email.plain_text.substring(0, 500) : null,
        html_preview: email.html_text ? email.html_text.substring(0, 500) : null
      }
    });
  } catch (error) {
    console.error('Error debugging email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;