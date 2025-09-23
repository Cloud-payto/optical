const express = require('express');
const router = express.Router();
const { emailOperations } = require('../lib/supabase');

// GET /api/emails/:accountId - Get emails for an account
router.get('/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const emails = await emailOperations.getEmailsByAccount(parseInt(accountId));
    
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

// DELETE /api/emails/:accountId/:emailId - Delete email
router.delete('/:accountId/:emailId', async (req, res) => {
  try {
    const { accountId, emailId } = req.params;
    
    await emailOperations.deleteEmail(parseInt(emailId), parseInt(accountId));
    
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