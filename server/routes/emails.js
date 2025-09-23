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
    
    await emailOperations.deleteEmail(parseInt(emailId), userId);
    
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