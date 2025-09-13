// services/olaService.js - Handles API calls to Ola services.
// This now uses the official Ola Maps API for route details.

const axios = require('axios');

/**
 * Gets REAL route details (distance and duration) from the Ola Maps API.
 * @param {object} pickupCoords - { lat, lng }
 * @param {object} dropCoords - { lat, lng }
 * @returns {Promise<object|null>} - A promise that resolves to { distance, duration } or null.
 */
exports.getRouteDetails = async (pickupCoords, dropCoords) => {
    if (!process.env.OLA_MAPS_KEY) {
        console.warn('[Ola Maps Service] OLA_MAPS_KEY not found. Cannot fetch real route details.');
        return null;
    }

    console.log(`[Ola Maps Service] Getting REAL route details...`);
    
    // Format coordinates for the Ola Maps API: "lat,lng"
    const origins = `${pickupCoords.lat},${pickupCoords.lng}`;
    const destinations = `${dropCoords.lat},${dropCoords.lng}`;

    try {
        const response = await axios.get("https://api.olamaps.io/routing/v1/distanceMatrix", {
            params: {
                origins,
                destinations,
                mode: "driving",
                api_key: process.env.OLA_MAPS_KEY
            }
        });

        const element = response.data.elements[0];
        if (element && element.status === 'OK') {
            const details = {
                distance: (element.distance.value / 1000).toFixed(2), // Convert meters to km
                duration: Math.round(element.duration.value / 60) // Convert seconds to mins
            };
            console.log('[Ola Maps Service] Found route details:', details);
            return details;
        }
        return null;

    } catch (error) {
        console.error(`[Ola Maps Service] Error fetching route details: ${error.message}`);
        return null;
    }
};

/**
 * Get fare estimate from Ola. Uses real route metrics if available.
 * @param {object} pickupCoords - { lat, lng }
 * @param {object} dropCoords - { lat, lng }
 * @param {object} [routeMetrics=null] - Optional pre-fetched { distance, duration }.
 * @returns {Promise<object>} - A promise that resolves to the fare estimate.
 */
exports.getFareEstimate = async (pickupCoords, dropCoords, routeMetrics = null) => {
    let distanceInKm = 10; // Default fallback values
    let durationInMinutes = 25;

    if (routeMetrics) {
        distanceInKm = parseFloat(routeMetrics.distance);
        durationInMinutes = routeMetrics.duration;
    }
    
    // Dynamic mock fare calculation
    const baseFare = 35;
    const pricePerKm = 14;
    const minPrice = Math.round(baseFare + (distanceInKm * pricePerKm));
    const maxPrice = minPrice + Math.round(Math.random() * 30 + 15);
    const eta = Math.round(2 + (Math.random() * 5));

    return {
        provider: 'Ola',
        price: { currency: 'INR', min: minPrice, max: maxPrice },
        eta: `${eta} mins`,
        duration: `${durationInMinutes} mins`,
        // Include the real distance in the response for the frontend to display
        distance: `${distanceInKm} km`, 
    };
};

