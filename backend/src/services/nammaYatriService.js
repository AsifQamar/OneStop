// services/nammaYatriService.js - Returns DYNAMIC MOCK data for the Namma Yatri service.
// NOTE: This makes the prototype feel real by calculating fares based on coordinates,
// ensuring different routes show different prices during a demonstration.

/**
 * Calculates a pseudo-distance to make mock data dynamic.
 * This is not a real-world distance calculation but serves to vary the output.
 * @param {object} startCoords - { lat, lng }
 * @param {object} endCoords - { lat, lng }
 * @returns {number} - A number representing the "distance" for fare calculation.
 */
const calculatePseudoDistance = (startCoords, endCoords) => {
    const latDiff = Math.abs(startCoords.lat - endCoords.lat);
    const lngDiff = Math.abs(startCoords.lng - endCoords.lng);
    return (latDiff + lngDiff) * 100; // Multiplier to get a reasonable number
};

/**
 * Get a DYNAMIC MOCK fare estimate for Namma Yatri.
 * @param {object} pickupCoords - { lat, lon/lng }
 * @param {object} dropCoords - { lat, lon/lng }
 * @returns {Promise<object>} - A promise that resolves to the mock fare estimate.
 */
exports.getFareEstimate = async (pickupCoords, dropCoords) => {
  console.log(`[Namma Yatri] Getting DYNAMIC MOCK fare from ${pickupCoords.lat},${pickupCoords.lng} to ${dropCoords.lat},${dropCoords.lng}`);

  const distance = calculatePseudoDistance(pickupCoords, dropCoords);

  // Base fare + a charge per "distance" unit + random variation
  const baseFare = 40;
  const pricePerUnit = 15;
  const randomFactor = Math.random() * 20 - 10; // adds between -10 and +10
  const minPrice = Math.round(baseFare + (distance * pricePerUnit) + randomFactor);
  const maxPrice = minPrice + Math.round(Math.random() * 25 + 10); // max is 10-35 higher

  // ETA and Duration also based on distance to be realistic
  const baseEta = 2;
  const baseDuration = 5;
  const eta = Math.round(baseEta + (distance / 5) + (Math.random() * 3));
  const duration = Math.round(baseDuration + (distance * 1.5) + (Math.random() * 5));


  // Simulate a network request delay to feel realistic.
  return new Promise(resolve => {
    setTimeout(() => {
      // Resolve with a realistic, dynamically calculated mock response.
      const mockResponse = {
        provider: 'Namma Yatri',
        price: { currency: 'INR', min: minPrice, max: maxPrice },
        eta: `${eta} mins`,
        duration: `${duration} mins`,
      };
      resolve(mockResponse);
    }, 800); // 800ms delay
  });
};

// --- Kept for reference and future implementation ---

exports.bookRide = async (userData) => {
    console.log('[Namma Yatri] MOCK booking ride...');
    return { success: true, bookingId: `NY-${Date.now()}`, status: 'SEARCHING_FOR_DRIVER' };
};

exports.getRideStatus = async (rideId) => {
    console.log(`[Namma Yatri] MOCK getting status for ride: ${rideId}`);
    return { success: true, status: 'DRIVER_ASSIGNED', eta: '3 mins' };
};

exports.cancelRide = async (rideId) => {
    console.log(`[Namma Yatri] MOCK cancelling ride: ${rideId}`);
    return { success: true, status: 'CANCELLED' };
};

