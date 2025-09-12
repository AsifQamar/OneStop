// rideController.js - Handles the business logic for ride-related requests.
// It calls the appropriate service based on the request and sends back a response.

const uberService = require('../services/uberService');
const olaService = require('../services/olaService');
// ... other services

const services = {
  uber: uberService,
  ola: olaService,
  // ... other services
};

// --- Controller Functions ---

/**
 * @desc Get fare estimates from ALL providers.
 * @route GET /api/v1/ride/fare
 */
exports.getAggregatedFares = async (req, res, next) => {
  try {
    const { pickup, drop } = req.query;
    if (!pickup || !drop) {
      return res.status(400).json({ success: false, error: 'Pickup and drop locations are required.' });
    }

    // In a real app, pickup and drop would likely be stringified JSON or lat/lng pairs.
    // E.g., pickup="28.6139,77.2090"
    // For now, we'll assume they are objects for the service layer.
    const pickupCoords = { lat: 28.6139, lng: 77.2090 }; // Mocked for demonstration
    const dropCoords = { lat: 28.7041, lng: 77.1025 }; // Mocked for demonstration

    // 1. Call all service promises.
    const uberPromise = services.uber.getFareEstimate(pickupCoords, dropCoords);
    const olaPromise = services.ola.getFareEstimate(pickupCoords, dropCoords);
    
    // 2. Use Promise.allSettled instead of Promise.all.
    // This is VERY important. It ensures that even if one API call (e.g., Ola) fails,
    // the aggregator will still return results from the APIs that succeeded (e.g., Uber).
    const results = await Promise.allSettled([uberPromise, olaPromise]);

    // 3. Filter out the failed promises and extract the values from the fulfilled ones.
    const successfulFares = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    res.status(200).json({ success: true, data: successfulFares });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
};

/**
 * @desc Get fare estimate from a specific provider.
 * @route GET /api/v1/ride/:provider/fare
 */
exports.getFareEstimate = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { pickup, drop } = req.query;

    const service = services[provider];
    if (!service) {
      return res.status(404).json({ success: false, error: 'Provider not found.' });
    }
    if (!pickup || !drop) {
        return res.status(400).json({ success: false, error: 'Pickup and drop locations are required.' });
    }
    
    // Mocked coordinates for demonstration.
    const pickupCoords = { lat: 28.6139, lng: 77.2090 }; 
    const dropCoords = { lat: 28.7041, lng: 77.1025 };

    const fare = await service.getFareEstimate(pickupCoords, dropCoords);
    res.status(200).json({ success: true, data: fare });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Book a ride with a specific provider.
 * @route POST /api/v1/ride/:provider/book
 */
exports.bookRide = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const service = services[provider];
    if (!service) {
      return res.status(404).json({ success: false, error: 'Provider not found.' });
    }
    const booking = await service.bookRide(req.body);
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get the status of a ride.
 * @route GET /api/v1/ride/:provider/status/:id
 */
exports.getRideStatus = async (req, res, next) => {
  try {
    const { provider, id } = req.params;
    const service = services[provider];
    if (!service) {
      return res.status(404).json({ success: false, error: 'Provider not found.' });
    }
    const status = await service.getRideStatus(id);
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Cancel a ride.
 * @route DELETE /api/v1/ride/:provider/cancel/:id
 */
exports.cancelRide = async (req, res, next) => {
  try {
    const { provider, id } = req.params;
    const service = services[provider];
    if (!service) {
      return res.status(404).json({ success: false, error: 'Provider not found.' });
    }
    const result = await service.cancelRide(id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

