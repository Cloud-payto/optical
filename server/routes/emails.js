const express = require('express');
const router = express.Router();
const { getEmailsByAccount, deleteEmail } = require('../db/database');

// GET /api/emails/:accountId - Get emails for an account
router.get('/:accountId', (req, res) => {
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

// DELETE /api/emails/:accountId/:emailId - Delete email
router.delete('/:accountId/:emailId', (req, res) => {
  try {
    const { accountId, emailId } = req.params;
    
    const result = deleteEmail(accountId, parseInt(emailId));
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Email deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error || 'Email not found'
      });
    }
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;