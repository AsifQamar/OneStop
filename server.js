import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

// --- ✨ New Fare Calculation Logic ---
const calculateFare = (service, type, distance) => {
  if (distance === null || distance <= 0) return null;

  let price = 0;
  const dist = parseFloat(distance); // Ensure distance is a number

  // Logic simulates minimum fare for the first 1.5-2km, then a per-km rate.
  switch (`${service}-${type}`) {
    case 'Rapido-Bike':
      // Cheapest option, low base for bikes
      if (dist <= 2) price = 35;
      else price = 35 + (dist - 2) * 8;
      break;
    case 'Yatri Sathi-Cab':
      // Government-backed, often the most affordable cab
      if (dist <= 1.5) price = 50;
      else price = 50 + (dist - 1.5) * 12;
      break;
    case 'Ola-Mini':
      // Standard economy hatchback
      if (dist <= 1.5) price = 55;
      else price = 55 + (dist - 1.5) * 13;
      break;
    case 'Indrive-Car':
      // Competitive pricing, similar to other economy cabs
      if (dist <= 1.5) price = 55;
      else price = 55 + (dist - 1.5) * 13.5;
      break;
    case 'Uber-Go':
      // Standard economy hatchback
      if (dist <= 1.5) price = 60;
      else price = 60 + (dist - 1.5) * 14;
      break;
    case 'BluSmart-Electric':
      // Premium feel, slightly higher initial cost
      if (dist <= 2) price = 75;
      else price = 75 + (dist - 2) * 15;
      break;
    case 'Uber-Premier':
      // Premium sedan with higher base and per-km rate
      if (dist <= 1.5) price = 80;
      else price = 80 + (dist - 1.5) * 18;
      break;
    case 'Ola-Prime':
      // Premium sedan, competitive with Uber Premier
      if (dist <= 1.5) price = 85;
      else price = 85 + (dist - 1.5) * 17;
      break;
    default:
      // Generic fallback
      price = 40 + dist * 12;
  }

  return Math.round(price);
};


app.get("/api/rides", async (req, res) => {
  try {
    const { pickup, destination } = req.query;

    if (!pickup || !destination) {
      return res.status(400).json({ error: "Pickup and destination required" });
    }

    // --- 1️⃣ Geocoding ---
    const pickupGeo = await axios.get("https://api.olamaps.io/places/v1/geocode", {
      params: { address: pickup, api_key: process.env.OLA_MAPS_KEY }
    });
    const destGeo = await axios.get("https://api.olamaps.io/places/v1/geocode", {
      params: { address: destination, api_key: process.env.OLA_MAPS_KEY }
    });

    const pickupLoc = pickupGeo.data.geocodingResults[0]?.geometry?.location;
    const destLoc = destGeo.data.geocodingResults[0]?.geometry?.location;

    if (!pickupLoc || !destLoc) {
      return res.status(400).json({ error: "Could not resolve locations" });
    }

    const pickupLatLng = `${pickupLoc.lat},${pickupLoc.lng}`;
    const destLatLng = `${destLoc.lat},${destLoc.lng}`;

    // --- 2️⃣ Get distance & ETA ---
    let distance_km = null;
    let eta_min = null;

    try {
      const distanceRes = await axios.get("https://api.olamaps.io/routing/v1/distanceMatrix", {
        params: {
          origins: pickupLatLng,
          destinations: destLatLng,
          mode: "driving",
          api_key: process.env.OLA_MAPS_KEY
        }
      });

      const distanceData = distanceRes.data.rows[0].elements[0];
      if (distanceData.status === "OK") {
        distance_km = (distanceData.distance / 1000).toFixed(2);
        eta_min = Math.round(distanceData.duration / 60);
      }
    } catch (distanceError) {
      console.error("Ola Distance Matrix API failed, providing fallback ride data:", distanceError.message);
    }

    // --- 3️⃣ Generate Ride Data with new fare logic ---
    let rides = [
      { id: 1, service: "Uber", type: "Go", price: calculateFare("Uber", "Go", distance_km), eta: eta_min, logo: "https://i.imgur.com/s211n2t.png" },
      { id: 2, service: "Ola", type: "Mini", price: calculateFare("Ola", "Mini", distance_km), eta: eta_min, logo: "https://i.imgur.com/3jS5Y8P.png" },
      { id: 3, service: "Rapido", type: "Bike", price: calculateFare("Rapido", "Bike", distance_km), eta: eta_min, logo: "https://i.imgur.com/U4hB2d1.png" },
      { id: 4, service: "Yatri Sathi", type: "Cab", price: calculateFare("Yatri Sathi", "Cab", distance_km), eta: eta_min, logo: "https://i.imgur.com/8Y3k5cW.png" },
      { id: 5, service: "Indrive", type: "Car", price: calculateFare("Indrive", "Car", distance_km), eta: eta_min, logo: "https://i.imgur.com/e3sY1zJ.png" },
      { id: 6, service: "BluSmart", type: "Electric", price: calculateFare("BluSmart", "Electric", distance_km), eta: eta_min, logo: "https://i.imgur.com/p1g3fXY.png" },
      { id: 7, service: "Uber", type: "Premier", price: calculateFare("Uber", "Premier", distance_km), eta: eta_min, logo: "https://i.imgur.com/s211n2t.png" },
      { id: 8, service: "Ola", type: "Prime", price: calculateFare("Ola", "Prime", distance_km), eta: eta_min, logo: "https://i.imgur.com/3jS5Y8P.png" }
    ];

    // Sort by price, handling cases where price might be null
    rides.sort((a, b) => {
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return a.price - b.price;
    });

    res.json({ pickup, destination, distance_km, eta_min, rides, pickupLoc, destLoc });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));