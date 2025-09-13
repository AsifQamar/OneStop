// rideController.js - Orchestrates geocoding and fare aggregation.
// This is the correct BACKEND code for this file.

const geocodingService = require('../services/geocodingService');
const uberService = require('../services/uberService');
const olaService = require('../services/olaService');
const nammaYatriService = require('../services/nammaYatriService');

// --- Main Controller Function ---

/**
 * @desc Geocodes addresses, gets real route metrics, and aggregates fares from all providers.
 * @route GET /api/v1/ride/fare
 */
exports.getAggregatedFares = async (req, res, next) => {
  try {
    const { pickup, drop } = req.query;
    if (!pickup || !drop) {
      return res.status(400).json({ success: false, error: 'Pickup and drop locations are required.' });
    }

    // 1. Geocode addresses to get coordinates
    const [pickupCoords, dropCoords] = await Promise.all([
        geocodingService.getCoordsFromAddress(pickup),
        geocodingService.getCoordsFromAddress(drop)
    ]);

    if (!pickupCoords || !dropCoords) {
        console.warn('--- GECODING FAIL-SAFE TRIGGERED ---');
        console.warn('Could not find coordinates. Falling back to default Bengaluru locations for demo.');
        // If geocoding fails, we can't get route metrics, so we'll proceed without them.
    }

    // 2. Get REAL route metrics from Ola Maps API (only if geocoding was successful)
    let routeMetrics = null;
    if (pickupCoords && dropCoords) {
        routeMetrics = await olaService.getRouteDetails(pickupCoords, dropCoords);
    }

    // 3. Call all services, passing the real metrics to them if available
    const servicePromises = [
        olaService.getFareEstimate(pickupCoords, dropCoords, routeMetrics),
        uberService.getFareEstimate(pickupCoords, dropCoords, routeMetrics),
        nammaYatriService.getFareEstimate(pickupCoords, dropCoords, routeMetrics)
    ];

    const results = await Promise.allSettled(servicePromises);

    const successfulFares = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    // 4. Send a structured response
    res.status(200).json({ 
        success: true, 
        route: routeMetrics, 
        data: successfulFares 
    });
    
  } catch (error) {
    next(error);
  }
};

