// services/geocodingService.js - Handles converting text addresses to geographic coordinates.

const axios = require('axios');

// Using the free and public OpenStreetMap Nominatim API for geocoding.
// No API key is required for moderate use, which is perfect for a prototype.
const geocodingAPI = axios.create({
    baseURL: 'https://nominatim.openstreetmap.org',
});

/**
 * Converts a text address into latitude and longitude coordinates.
 * @param {string} address - The address to geocode (e.g., "Munger, Bihar").
 * @returns {Promise<object|null>} - A promise that resolves to { lat, lng } or null if not found.
 */
exports.getCoordsFromAddress = async (address) => {
    console.log(`[Geocoding Service] Converting address to coordinates: "${address}"`);
    try {
        const response = await geocodingAPI.get('/search', {
            params: {
                q: address,
                format: 'json',
                limit: 1, // We only want the top result
            }
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            const coordinates = {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
            };
            console.log(`[Geocoding Service] Found coordinates:`, coordinates);
            return coordinates;
        } else {
            console.warn(`[Geocoding Service] No coordinates found for address: "${address}"`);
            return null;
        }
    } catch (error) {
        console.error(`[Geocoding Service] Error fetching coordinates: ${error.message}`);
        return null;
    }
};
