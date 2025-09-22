import { saveEmail, getEmailsByAccount, updateEmailWithParsedData, saveInventoryItems, checkDuplicateOrder } from '../lib/database';
import parserRegistry from '../services/parserRegistry';

/**
 * Smart vendor detection for forwarded emails
 */
function detectVendorFromEmail(emailData, rawEmailData) {
  const subject = emailData.subject.toLowerCase();
  const plainText = emailData.plain_text.toLowerCase();
  const htmlText = emailData.html_text.toLowerCase();
  
  console.log('Detecting vendor from email:');
  console.log('- Subject:', subject);
  console.log('- From:', emailData.from);
  
  // Check subject line for vendor keywords
  if (subject.includes('safilo') || subject.includes('eyerep order') || 
      subject.includes('receipt for order') || subject.includes('order confirmation')) {
    
    // For generic order subjects, check if content mentions Safilo
    if (plainText.includes('safilo') || htmlText.includes('safilo')) {
      console.log('✓ Detected Safilo from subject + content combination');
      return 'noreply@safilo.com';
    }
  }
  
  // Look for original sender in forwarded email content
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
    
    if (plainMatch || htmlMatch) {
      console.log('✓ Detected Safilo from forwarded content');
      return 'noreply@safilo.com';
    }
  }
  
  // Check email content for vendor signatures
  if (plainText.includes('safilo usa') || plainText.includes('mysafilo.com') || 
      htmlText.includes('safilo usa') || htmlText.includes('mysafilo.com')) {
    console.log('✓ Detected Safilo from email signature');
    return 'noreply@safilo.com';
  }
  
  // Check for Modern Optical
  if (subject.includes('modern optical') || plainText.includes('modern optical') || 
      htmlText.includes('modern optical')) {
    console.log('✓ Detected Modern Optical from content');
    return 'orders@modernoptical.com';
  }
  
  // Check email headers
  const references = rawEmailData.headers?.references;
  const inReplyTo = rawEmailData.headers?.in_reply_to;
  
  if ((references && references.toUpperCase().includes('SAFILO.COM')) ||
      (inReplyTo && inReplyTo.toUpperCase().includes('SAFILO.COM'))) {
    console.log('✓ Detected Safilo from headers');
    return 'noreply@safilo.com';
  }
  
  // Fallback to domain-based detection
  const domain = emailData.from.split('@')[1]?.toLowerCase() || '';
  console.log('→ Falling back to domain-based detection:', domain);
  return domain;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET request for testing
  if (req.method === 'GET') {
    const { emailId, accountId } = req.query;
    
    if (emailId) {
      // Debug endpoint
      try {
        const emails = getEmailsByAccount(1); // Default account
        const email = emails.find(e => e.id === parseInt(emailId));
        
        if (!email) {
          return res.status(404).json({ error: 'Email not found' });
        }
        
        return res.status(200).json({
          email_id: email.id,
          subject: email.subject,
          from: email.from_email,
          parsed_data: email.parsed_data,
          has_html: !!email.html_text,
          has_plain: !!email.plain_text,
          parse_status: email.parse_status,
          content_preview: {
            plain_preview: email.plain_text ? email.plain_text.substring(0, 500) : null,
            html_preview: email.html_text ? email.html_text.substring(0, 500) : null
          }
        });
      } catch (error) {
        console.error('Error debugging email:', error);
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
    
    if (accountId) {
      // List emails endpoint
      try {
        const emails = getEmailsByAccount(accountId);
        
        return res.status(200).json({
          success: true,
          count: emails.length,
          emails: emails
        });
      } catch (error) {
        console.error('Error fetching emails:', error);
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
    
    // Test endpoint
    return res.status(200).json({ 
      message: 'Email webhook endpoint is ready',
      endpoint: '/api/webhook',
      method: 'POST'
    });
  }

  // Handle POST request for webhook
  if (req.method === 'POST') {
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

      console.log('Extracted Email Data:', {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        attachments: emailData.attachments_count
      });

      // TODO: Determine account_id based on 'to' email address
      const accountId = 1;

      // Save to database
      const result = saveEmail(accountId, JSON.stringify(req.body), emailData);
      
      console.log('Email saved to database with ID:', result.emailId);

      // Try to parse the email using vendor-specific parser
      console.log('\n=== VENDOR DETECTION START ===');
      const fromEmail = detectVendorFromEmail(emailData, req.body);
      console.log('=== VENDOR DETECTION RESULT:', fromEmail, '===');
      
      if (parserRegistry.hasParser(fromEmail)) {
        console.log('Parser found for vendor, processing...');
        try {
          const parsedData = await parserRegistry.parseEmail(
            fromEmail, 
            emailData.html_text, 
            emailData.plain_text, 
            emailData.attachments
          );
          
          if (parsedData && parsedData.items && parsedData.items.length > 0) {
            console.log(`Parsed ${parsedData.items.length} items from ${parsedData.vendor} order`);
            
            // Check for duplicate order
            const orderNumber = parsedData.order?.order_number;
            const customerName = parsedData.order?.customer_name;
            const accountNumber = parsedData.order?.account_number;
            
            if (orderNumber) {
              const duplicateCheck = checkDuplicateOrder(accountId, orderNumber, customerName, accountNumber);
              
              if (duplicateCheck.isDuplicate) {
                console.log(`Duplicate order detected: ${duplicateCheck.message}`);
                
                updateEmailWithParsedData(result.emailId, {
                  ...parsedData,
                  duplicate_order: true,
                  duplicate_message: duplicateCheck.message
                });
                
                return res.status(200).json({ 
                  success: true,
                  message: 'Email processed but duplicate order detected',
                  emailId: result.emailId,
                  parsed: true,
                  duplicate: true,
                  duplicateMessage: duplicateCheck.message
                });
              }
            }
            
            // Update email with parsed data
            updateEmailWithParsedData(result.emailId, parsedData);
            
            // Save inventory items
            parsedData.items.forEach(item => {
              saveInventoryItems(accountId, [{
                ...item,
                status: 'pending',
                email_id: result.emailId,
                order_number: parsedData.order?.order_number || '',
                account_number: parsedData.account_number || parsedData.order?.account_number || '',
                vendor: item.vendor || parsedData.vendor || ''
              }]);
            });
            
            console.log('Email parsed and inventory items created');
          } else {
            console.log('No items found in parsed data');
          }
        } catch (parseError) {
          console.error('Error parsing email:', parseError);
        }
      } else {
        console.log('No parser available for this vendor domain');
      }

      // CloudMailin expects a 200 status for successful processing
      return res.status(200).json({ 
        success: true,
        message: 'Email processed successfully',
        emailId: result.emailId,
        parsed: parserRegistry.hasParser(fromEmail)
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
      
      // Return 200 with error flag to prevent CloudMailin retry
      return res.status(200).json({ 
        success: false,
        error: error.message,
        message: 'Email received but processing failed'
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}