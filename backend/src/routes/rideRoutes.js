// routes/rideRoutes.js - Defines all API endpoints for ride-related actions.
// This is the simplified version for the main prototype functionality.

const express = require('express');
const { getAggregatedFares } = require('../controllers/rideController');

const router = express.Router();

// --- Route Definition ---

// The only endpoint the frontend needs. It gets fares from all providers.
// GET /api/v1/ride/fare
router.route('/fare').get(getAggregatedFares);

module.exports = router;

