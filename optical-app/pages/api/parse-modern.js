import ModernOpticalParser from '../../services/ModernOpticalParser';
import { saveInventoryItems, updateEmailWithParsedData } from '../../lib/database';

// Initialize parser
const modernOpticalParser = new ModernOpticalParser();

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

  if (req.method === 'POST') {
    try {
      const { html, plain, attachments, emailId, accountId } = req.body;

      if (!html && !plain) {
        return res.status(400).json({
          success: false,
          error: 'No email content provided (html or plain text required)'
        });
      }

      console.log('📄 Processing Modern Optical email');

      // Parse the email
      const result = await modernOpticalParser.parse(html, plain, attachments);

      if (result.items && result.items.length > 0) {
        console.log(`Parsed ${result.items.length} items from Modern Optical order`);

        // If emailId is provided, update the email record
        if (emailId) {
          updateEmailWithParsedData(emailId, result);
        }

        // If accountId is provided, save inventory items
        if (accountId) {
          const inventoryItems = result.items.map(item => ({
            ...item,
            status: 'pending',
            email_id: emailId || null,
            order_number: result.order?.order_number || '',
            account_number: result.account_number || result.order?.account_number || '',
            vendor: item.vendor || result.vendor || 'Modern Optical'
          }));

          saveInventoryItems(accountId, inventoryItems);
        }
      }

      return res.status(200).json({
        success: true,
        data: result,
        summary: {
          totalItems: result.items?.length || 0,
          orderNumber: result.order?.order_number,
          vendor: result.vendor,
          parserVersion: result.parser_version
        }
      });

    } catch (error) {
      console.error('Modern Optical parser error:', error);
      return res.status(500).json({
        success: false,
        error: 'Processing failed',
        message: error.message
      });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Modern Optical parser API endpoint',
      endpoints: {
        process: 'POST /api/parse-modern',
        requiredFields: ['html or plain'],
        optionalFields: ['attachments', 'emailId', 'accountId']
      }
    });
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}