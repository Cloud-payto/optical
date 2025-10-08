const express = require('express');
const router = express.Router();
const { emailOperations, inventoryOperations, orderOperations, vendorOperations, checkDuplicateOrder, supabase } = require('../lib/supabase');
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
    // CloudMailin sends 'to' as either a string or an array
    let toEmail = 'unknown';
    if (envelope?.to) {
      // If it's an array, take the first element; if it's a string, use it directly
      toEmail = Array.isArray(envelope.to) ? envelope.to[0] : envelope.to;
    } else if (headers?.to) {
      toEmail = headers.to;
    }
    
    console.log('Raw envelope.to:', envelope?.to);
    console.log('Processed to email:', toEmail);

    const emailData = {
      from: envelope?.from || headers?.from || 'unknown',
      to: toEmail,
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

    // Extract account UUID from plus-addressed email
    function extractAccountIdFromEmail(email) {
      console.log('Attempting to extract UUID from email:', email);
      
      // Parse: a48947dbd077295c13ea+{uuid}@cloudmailin.net
      const match = email.match(/\+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})@/i);
      
      if (!match) {
        console.error('UUID extraction failed. Email format:', email);
        console.error('Expected format: a48947dbd077295c13ea+{uuid}@cloudmailin.net');
        throw new Error(`Invalid email format - no account UUID found in: ${email}`);
      }
      
      const uuid = match[1];
      console.log(`Successfully extracted UUID: ${uuid} from email: ${email}`);
      return uuid;
    }

    // Extract accountId from the 'to' email address
    let accountId;
    try {
      console.log('=== ACCOUNT EXTRACTION START ===');
      console.log('Email to parse:', emailData.to);
      accountId = extractAccountIdFromEmail(emailData.to);
      console.log(`Account UUID extracted: ${accountId}`);
      console.log('=== ACCOUNT EXTRACTION SUCCESS ===');
    } catch (error) {
      console.error('=== ACCOUNT EXTRACTION FAILED ===');
      console.error('Error:', error.message);
      console.error('Email that failed:', emailData.to);
      return res.status(200).json({ 
        success: false,
        error: error.message,
        message: 'Invalid recipient email format - missing account UUID',
        debug: {
          receivedEmail: emailData.to,
          expectedFormat: 'a48947dbd077295c13ea+{uuid}@cloudmailin.net'
        }
      });
    }

    // Validate that this account exists in Supabase
    try {
      const { data: accountExists, error: accountError } = await supabase
        .from('accounts')  // Check the accounts table
        .select('id')
        .eq('id', accountId)
        .single();

      if (accountError || !accountExists) {
        console.error(`Unknown account: ${accountId}`, accountError);
        return res.status(200).json({ 
          success: false,
          error: `Unknown account: ${accountId}`,
          message: 'Email received but account not found'
        });
      }
      
      console.log(`Account ${accountId} validated successfully`);
    } catch (validationError) {
      console.error('Account validation error:', validationError);
      return res.status(200).json({ 
        success: false,
        error: validationError.message,
        message: 'Email received but account validation failed'
      });
    }

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
          
          // Look up vendor UUID by name for inventory items
          let vendorIdForInventory = null;
          if (parsedData.vendor) {
            try {
              const { data: vendor, error: vendorError } = await supabase
                .from('vendors')
                .select('id')
                .ilike('name', parsedData.vendor)
                .single();
              
              if (vendor && !vendorError) {
                vendorIdForInventory = vendor.id;
                
                // Save or update vendor account number if available
                if (parsedData.account_number) {
                  try {
                    await emailOperations.saveOrUpdateVendorAccountNumber(
                      accountId,
                      vendor.id, // Use proper vendor UUID
                      parsedData.account_number
                    );
                    console.log(`✓ Saved vendor account #${parsedData.account_number} for ${parsedData.vendor} (account ${accountId})`);
                  } catch (vendorAccountError) {
                    console.error('Failed to save vendor account number:', vendorAccountError);
                    // Don't fail the entire process if this fails
                  }
                }
              } else {
                console.warn(`Vendor '${parsedData.vendor}' not found in vendors table`);
              }
            } catch (vendorLookupError) {
              console.error('Failed to lookup vendor:', vendorLookupError);
            }
          }
          
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

          // Auto-import brands from parsed data
          if (parsedData.brands && parsedData.brands.length > 0 && vendorIdForInventory) {
            console.log(`📦 Processing ${parsedData.brands.length} brands from order...`);

            // First, ensure vendor is added to user's account
            try {
              await vendorOperations.addAccountVendor(accountId, vendorIdForInventory, parsedData.account_number);
              console.log(`✅ Ensured vendor is added to account`);
            } catch (error) {
              console.error('❌ Error adding vendor to account:', error);
              // Continue anyway - the vendor operations will handle duplicates gracefully
            }

            for (const brandName of parsedData.brands) {
              try {
                // Check if brand exists in global brands table
                const { data: existingBrand } = await supabase
                  .from('brands')
                  .select('id')
                  .eq('vendor_id', vendorIdForInventory)
                  .ilike('name', brandName)
                  .single();

                let brandId = existingBrand?.id;

                // Create brand if it doesn't exist in global brands table
                if (!brandId) {
                  const { data: newBrand, error: createBrandError } = await supabase
                    .from('brands')
                    .insert({
                      name: brandName,
                      vendor_id: vendorIdForInventory,
                      wholesale_cost: 0,
                      msrp: 0,
                      is_active: true
                    })
                    .select()
                    .single();

                  if (createBrandError) {
                    console.error(`❌ Error creating brand ${brandName}:`, createBrandError);
                    continue; // Skip to next brand
                  }

                  brandId = newBrand.id;
                  console.log(`✅ Created new brand: ${brandName} (ID: ${brandId})`);
                }

                // Check if user has account_brands entry
                const { data: accountBrand } = await supabase
                  .from('account_brands')
                  .select('id')
                  .eq('account_id', accountId)
                  .eq('brand_id', brandId)
                  .single();

                // Create account_brands entry if missing
                if (!accountBrand) {
                  await vendorOperations.saveAccountBrand(accountId, {
                    brand_id: brandId,
                    vendor_id: vendorIdForInventory,
                    wholesale_cost: 0,
                    discount_percentage: 45, // Default discount
                    tariff_tax: 0
                  });
                  console.log(`✅ Added ${brandName} to account brands`);
                } else {
                  console.log(`ℹ️  ${brandName} already in account brands`);
                }

              } catch (error) {
                console.error(`❌ Error processing brand ${brandName}:`, error);
                // Continue with other brands even if one fails
              }
            }

            console.log('✅ Brand import processing complete');
          }

          // Create order record first
          let orderId = null;
          if (parsedData.order) {
            try {
              const orderRecord = await orderOperations.saveOrder({
                account_id: accountId,
                vendor_id: vendorIdForInventory,
                email_id: result.id,
                order_number: parsedData.order.order_number,
                reference_number: parsedData.order.reference_number,
                customer_name: parsedData.order.customer_name,
                customer_code: parsedData.order.customer_code,
                placed_by: parsedData.order.placed_by,
                order_date: parsedData.order.order_date,
                // phone: parsedData.order.phone, // Removed as not needed
                total_pieces: parsedData.order.total_pieces,
                status: 'pending'
              });
              orderId = orderRecord.id;
              console.log(`✓ Created order record with ID: ${orderId}`);
              console.log(`  📅 Order date saved:`, parsedData.order.order_date);
            } catch (orderError) {
              console.error('Failed to create order record:', orderError);
              // Continue without order_id for backward compatibility
            }
          }
          
          // Prepare inventory items with "pending" status and link to order
          const inventoryItems = parsedData.items.map(item => ({
            account_id: accountId,
            order_id: orderId, // ✅ Now linked to order!
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
            vendor_id: vendorIdForInventory,
            status: 'pending',
            email_id: result.id,
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