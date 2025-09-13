// uberService.js - REAL service for Uber.
// This file makes actual calls to the Uber API using axios.

const axios = require('axios');

// 1. Create an Axios instance for Uber API requests.
// This is a best practice as it allows you to centralize configuration.
const uberApi = axios.create({
  baseURL: process.env.UBER_API_URL, // e.g., 'https://api.uber.com/v1.2'
  headers: {
    'Authorization': `Bearer ${process.env.UBER_API_KEY}`,
    'Content-Type': 'application/json'
  }
});


// 2. Private helper function to normalize the complex API response.
// This is crucial for consistency. It takes the raw data from the Uber API
// and transforms it into our standard, simple format.
const _normalizeFareResponse = (uberData) => {
  // IMPORTANT: The structure below is HYPOTHETICAL.
  // You MUST inspect the real Uber API response and map the correct fields.
  const estimate = uberData.prices[0]; // Assuming 'prices' is an array of options
  return {
    provider: 'uber',
    price: { 
      currency: estimate.currency_code, 
      min: estimate.low_estimate, 
      max: estimate.high_estimate 
    },
    eta: `${Math.round(estimate.pickup_estimate / 60)} mins`, // Convert seconds to minutes
    duration: `${Math.round(estimate.duration / 60)} mins`
  };
};


class UberService {
  /**
   * REAL: Get a fare estimate from the Uber API.
   */
  async getFareEstimate(pickup, drop) {
    console.log(`[Uber Service] Getting REAL fare for ${pickup} to ${drop}`);
    
    try {
      // 3. Make the actual API call.
      // NOTE: The endpoint '/estimates/price' and the request body structure
      // are HYPOTHETICAL. You need to replace them with the actual ones
      // from the Uber API documentation.
      const response = await uberApi.post('/estimates/price', {
        start_latitude: pickup.lat,
        start_longitude: pickup.lng,
        end_latitude: drop.lat,
        end_longitude: drop.lng,
      });

      // 4. Normalize the response before returning it.
      return _normalizeFareResponse(response.data);

    } catch (error) {
      console.error('[Uber Service] Error fetching fare:', error.response?.data || error.message);
      // It's important to throw a new, more specific error or handle it.
      throw new Error('Failed to fetch fare estimate from Uber.');
    }
  }

  /**
   * MOCK: Book a ride. (Implementation would follow a similar pattern)
   */
  async bookRide(rideDetails) {
    console.log('[Uber Service] Booking a ride with details:', rideDetails);
    // TODO: Implement actual API call to Uber's booking endpoint.
    // const response = await uberApi.post('/requests', { ... });
    // return _normalizeBookingResponse(response.data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      bookingId: `UBER-${Date.now()}`,
      status: 'SEARCHING_FOR_DRIVER'
    };
  }

  /**
   * MOCK: Get ride status.
   */
  async getRideStatus(rideId) {
    console.log(`[Uber Service] Getting status for ride: ${rideId}`);
    // TODO: Implement actual API call. e.g., await uberApi.get(`/requests/${rideId}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      rideId,
      status: 'DRIVER_EN_ROUTE',
      driver: { name: 'John Doe', car: 'Toyota Camry', licensePlate: 'UB1234' },
      eta: '3 mins'
    };
  }

  /**
   * MOCK: Cancel a ride.
   */
  async cancelRide(rideId) {
    console.log(`[Uber Service] Cancelling ride: ${rideId}`);
    // TODO: Implement actual API call. e.g., await uberApi.delete(`/requests/${rideId}`);
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      rideId,
      status: 'CANCELLED',
      message: 'Your ride has been successfully cancelled.',
      refund: { amount: 0, currency: 'INR' }
    };
  }
}

module.exports = new UberService();

