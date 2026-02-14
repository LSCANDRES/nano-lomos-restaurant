const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');
const authMiddleware = require('../middleware/auth');

// All report routes require authentication and manager role
router.use(authMiddleware);

// Middleware to check manager role
const requireManager = (req, res, next) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Solo los gerentes pueden ver reportes.' 
    });
  }
  next();
};

router.use(requireManager);

/**
 * GET /api/reports/daily
 * Get daily statistics (defaults to today)
 */
router.get('/daily', async (req, res, next) => {
  try {
    const { date } = req.query;
    const stats = await reportService.getDailyStats(date);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/status
 * Get current order counts by status (real-time)
 */
router.get('/status', async (req, res, next) => {
  try {
    const statusCounts = await reportService.getOrdersByStatus();
    res.json(statusCounts);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/assignments
 * Get current cook assignments and their workload
 */
router.get('/assignments', async (req, res, next) => {
  try {
    const assignments = await reportService.getCookAssignments();
    res.json(assignments);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/revenue
 * Get revenue report for a date range
 */
router.get('/revenue', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    
    // Default to last 7 days if no dates provided
    const toDate = to || new Date().toISOString().split('T')[0];
    const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const report = await reportService.getRevenueReport(fromDate, toDate);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/top-items
 * Get top selling menu items
 */
router.get('/top-items', async (req, res, next) => {
  try {
    const { limit } = req.query;
    const items = await reportService.getTopSellingItems(parseInt(limit) || 5);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
