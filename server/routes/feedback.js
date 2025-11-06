const express = require('express');
const router = express.Router();
const { feedbackOperations } = require('../lib/supabase');

/**
 * POST /api/feedback/bug-report
 * Submit a bug report
 */
router.post('/bug-report', async (req, res) => {
  try {
    const { title, description, userId, userEmail } = req.body;

    if (!title || !description || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, and userId are required'
      });
    }

    const result = await feedbackOperations.saveBugReport(
      userId,
      userEmail,
      title,
      description
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Bug report submitted successfully'
    });
  } catch (error) {
    console.error('Error saving bug report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save bug report',
      details: error.message
    });
  }
});

/**
 * POST /api/feedback/vendor-request
 * Submit a vendor request
 */
router.post('/vendor-request', async (req, res) => {
  try {
    const { vendorName, vendorWebsite, reason, userId, userEmail } = req.body;

    if (!vendorName || !reason || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vendorName, reason, and userId are required'
      });
    }

    const result = await feedbackOperations.saveVendorRequest(
      userId,
      userEmail,
      vendorName,
      vendorWebsite || null,
      reason
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Vendor request submitted successfully'
    });
  } catch (error) {
    console.error('Error saving vendor request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save vendor request',
      details: error.message
    });
  }
});

/**
 * GET /api/feedback/bug-reports
 * Get all bug reports (admin/dev view)
 * Optional query params:
 *   - status: filter by status (new, reviewing, in-progress, resolved, closed)
 *   - limit: number of results to return
 */
router.get('/bug-reports', async (req, res) => {
  try {
    const { status, limit } = req.query;
    const reports = await feedbackOperations.getBugReports(status, limit);

    res.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bug reports',
      details: error.message
    });
  }
});

/**
 * GET /api/feedback/vendor-requests
 * Get all vendor requests (admin/dev view)
 * Optional query params:
 *   - status: filter by status (new, reviewing, in-progress, completed, rejected)
 *   - limit: number of results to return
 */
router.get('/vendor-requests', async (req, res) => {
  try {
    const { status, limit } = req.query;
    const requests = await feedbackOperations.getVendorRequests(status, limit);

    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Error fetching vendor requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor requests',
      details: error.message
    });
  }
});

/**
 * PATCH /api/feedback/bug-report/:id/status
 * Update bug report status (admin only)
 */
router.patch('/bug-report/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'reviewing', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await feedbackOperations.updateBugReportStatus(id, status);

    res.json({
      success: true,
      data: result,
      message: 'Bug report status updated'
    });
  } catch (error) {
    console.error('Error updating bug report status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bug report status',
      details: error.message
    });
  }
});

/**
 * PATCH /api/feedback/vendor-request/:id/status
 * Update vendor request status (admin only)
 */
router.patch('/vendor-request/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'reviewing', 'in-progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await feedbackOperations.updateVendorRequestStatus(id, status);

    res.json({
      success: true,
      data: result,
      message: 'Vendor request status updated'
    });
  } catch (error) {
    console.error('Error updating vendor request status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vendor request status',
      details: error.message
    });
  }
});

module.exports = router;
