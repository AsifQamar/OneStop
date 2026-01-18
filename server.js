import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 1. ENABLE THIS LINE (It was missing/commented out)
app.use(express.static(__dirname));

// ... (Keep your calculateFare function exactly as it is) ...
const calculateFare = (service, type, distance) => {
    // ... your existing logic ...
    if (distance === null || distance <= 0) return null;
    let price = 0;
    const dist = parseFloat(distance);
    switch (`${service}-${type}`) {
        case 'Rapido-Bike': if (dist <= 2) price = 35; else price = 35 + (dist - 2) * 8; break;
        case 'Yatri Sathi-Cab': if (dist <= 1.5) price = 50; else price = 50 + (dist - 1.5) * 12; break;
        case 'Ola-Mini': if (dist <= 1.5) price = 55; else price = 55 + (dist - 1.5) * 13; break;
        case 'Indrive-Car': if (dist <= 1.5) price = 55; else price = 55 + (dist - 1.5) * 13.5; break;
        case 'Uber-Go': if (dist <= 1.5) price = 60; else price = 60 + (dist - 1.5) * 14; break;
        case 'BluSmart-Electric': if (dist <= 2) price = 75; else price = 75 + (dist - 2) * 15; break;
        case 'Uber-Premier': if (dist <= 1.5) price = 80; else price = 80 + (dist - 1.5) * 18; break;
        case 'Ola-Prime': if (dist <= 1.5) price = 85; else price = 85 + (dist - 1.5) * 17; break;
        default: price = 40 + dist * 12;
    }
    return Math.round(price);
};

// 2. CHANGE THIS ROUTE (Serve the file instead of text)


// ... (Keep the rest of your API routes exactly the same) ...
app.get("/api/rides", async (req, res) => {
    // ... your existing API logic ...
    try {
        const { pickup, destination } = req.query;
        if (!pickup || !destination) return res.status(400).json({ error: "Pickup and destination required" });

        const pickupGeo = await axios.get("https://api.olamaps.io/places/v1/geocode", { params: { address: pickup, api_key: process.env.OLA_MAPS_KEY } });
        const destGeo = await axios.get("https://api.olamaps.io/places/v1/geocode", { params: { address: destination, api_key: process.env.OLA_MAPS_KEY } });

        const pickupLoc = pickupGeo.data.geocodingResults[0]?.geometry?.location;
        const destLoc = destGeo.data.geocodingResults[0]?.geometry?.location;
        if (!pickupLoc || !destLoc) return res.status(400).json({ error: "Could not resolve locations" });

        const pickupLatLng = `${pickupLoc.lat},${pickupLoc.lng}`;
        const destLatLng = `${destLoc.lat},${destLoc.lng}`;

        let distance_km = null;
        let eta_min = null;
        try {
            const distanceRes = await axios.get("https://api.olamaps.io/routing/v1/distanceMatrix", {
                params: { origins: pickupLatLng, destinations: destLatLng, mode: "driving", api_key: process.env.OLA_MAPS_KEY }
            });
            const distanceData = distanceRes.data.rows[0].elements[0];
            if (distanceData.status === "OK") {
                distance_km = (distanceData.distance / 1000).toFixed(2);
                eta_min = Math.round(distanceData.duration / 60);
            }
        } catch (e) { console.error("Distance Error:", e.message); }

        let rides = [
            { id: 1, service: "Uber", type: "Go", price: calculateFare("Uber", "Go", distance_km), eta: eta_min, logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQys0XBQ5Iht-LdIlpMLTVLmGvd33hTz9lDMw&s" },
            { id: 2, service: "Ola", type: "Mini", price: calculateFare("Ola", "Mini", distance_km), eta: eta_min, logo: "https://www.svgrepo.com/show/303255/ola-cabs-logo.svg" },
            { id: 3, service: "Rapido", type: "Bike", price: calculateFare("Rapido", "Bike", distance_km), eta: eta_min, logo: "https://upload.wikimedia.org/wikipedia/en/e/e7/Rapido-logo.png" },
            { id: 4, service: "Yatri Sathi", type: "Cab", price: calculateFare("Yatri Sathi", "Cab", distance_km), eta: eta_min, logo: "https://play-lh.googleusercontent.com/YCVmcSHlGGjKPjlmBE_vU4U6zWSG55lllT5dYNnHu1uT8APBxFK-7jSGVUW74p8jXiE=w240-h480-rw" },
            { id: 5, service: "Indrive", type: "Car", price: calculateFare("Indrive", "Car", distance_km), eta: eta_min, logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf0iuYFSTJftX0Vrw92XJBSfirnWiUjcP27Q&s" },
            { id: 6, service: "BluSmart", type: "Electric", price: calculateFare("BluSmart", "Electric", distance_km), eta: eta_min, logo: "https://play-lh.googleusercontent.com/cRdxFHJ3j82q9yT2nqBTzJagzaa8NvTTmx2eE8AID4tk-a_MCxYSqkLm7Xp5agkJl1Dh" },
            { id: 7, service: "Uber", type: "Premier", price: calculateFare("Uber", "Premier", distance_km), eta: eta_min, logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQys0XBQ5Iht-LdIlpMLTVLmGvd33hTz9lDMw&s" },
            { id: 8, service: "Ola", type: "Prime", price: calculateFare("Ola", "Prime", distance_km), eta: eta_min, logo: "https://www.svgrepo.com/show/303255/ola-cabs-logo.svg" }
        ];
        
        rides.sort((a, b) => (a.price === null ? 1 : b.price === null ? -1 : a.price - b.price));

        res.json({ pickup, destination, distance_km, eta_min, rides, pickupLoc, destLoc });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch rides" });
    }
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}
export default app;
