const express = require('express');
const router = express.Router();
const { emailOperations } = require('../lib/supabase');

// GET /api/emails/:userId - Get emails for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const emails = await emailOperations.getEmailsByAccount(userId);
    
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

// DELETE /api/emails/:userId/:emailId - Delete email
router.delete('/:userId/:emailId', async (req, res) => {
  try {
    const { userId, emailId } = req.params;

    // Debug logging
    console.log('DELETE request received:', {
      emailId: emailId,
      typeof: typeof emailId,
      fullParams: req.params,
      fullUrl: req.url
    });

    // Validate emailId is provided and looks like a valid UUID
    if (!emailId || emailId === 'undefined' || emailId === 'null') {
      return res.status(400).json({
        success: false,
        error: 'Invalid email ID provided'
      });
    }
    
    // Basic UUID format validation (8-4-4-4-12 hex characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(emailId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid email ID format: ${emailId}. Expected UUID format.`
      });
    }
    
    // Pass emailId as string (not parsed as integer)
    await emailOperations.deleteEmail(emailId, userId);
    
    res.json({
      success: true,
      message: 'Email deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;