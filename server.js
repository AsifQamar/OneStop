import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

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

    // THIS IS THE CORRECTED PART
    const pickupLoc = pickupGeo.data.geocodingResults[0]?.geometry?.location;
    const destLoc = destGeo.data.geocodingResults[0]?.geometry?.location;

    if (!pickupLoc || !destLoc) {
      return res.status(400).json({ error: "Could not resolve locations" });
    }

    const pickupLatLng = `${pickupLoc.lat},${pickupLoc.lng}`;
    const destLatLng = `${destLoc.lat},${destLoc.lng}`;

    // --- 2️⃣ Get distance & ETA, with a fallback if it fails ---
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

    // --- 3️⃣ Generate Ride Data ---
    const calculatePrice = (base, perKm) => {
      if (distance_km === null) return null;
      return Math.round(base + (distance_km * perKm));
    };

    let rides = [
      { id: 1, service: "Uber", type: "Go", price: calculatePrice(45, 12), eta: eta_min, logo: "https://i.imgur.com/s211n2t.png" },
      { id: 2, service: "Ola", type: "Mini", price: calculatePrice(40, 11), eta: eta_min, logo: "https://i.imgur.com/3jS5Y8P.png" },
      { id: 3, service: "Rapido", type: "Bike", price: calculatePrice(25, 7), eta: eta_min, logo: "https://i.imgur.com/U4hB2d1.png" }
    ];

    rides.sort((a, b) => a.price - b.price);

    res.json({ pickup, destination, distance_km, eta_min, rides, pickupLoc, destLoc });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
