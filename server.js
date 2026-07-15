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
app.use(express.static(__dirname));

const RIDE_CATALOG = [
  { id: 1, service: "Uber", type: "Go", category: "car", pickupOffset: 2, risk: 10, logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQys0XBQ5Iht-LdIlpMLTVLmGvd33hTz9lDMw&s" },
  { id: 2, service: "Ola", type: "Mini", category: "car", pickupOffset: 3, risk: 12, logo: "https://www.svgrepo.com/show/303255/ola-cabs-logo.svg" },
  { id: 3, service: "Rapido", type: "Bike", category: "bike", pickupOffset: 0, risk: 15, logo: "https://upload.wikimedia.org/wikipedia/en/e/e7/Rapido-logo.png" },
  { id: 4, service: "Yatri Sathi", type: "Cab", category: "car", pickupOffset: 4, risk: 8, logo: "https://play-lh.googleusercontent.com/YCVmcSHlGGjKPjlmBE_vU4U6zWSG55lllT5dYNnHu1uT8APBxFK-7jSGVUW74p8jXiE=w240-h480-rw" },
  { id: 5, service: "Indrive", type: "Car", category: "car", pickupOffset: 5, risk: 18, logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf0iuYFSTJftX0Vrw92XJBSfirnWiUjcP27Q&s" },
  { id: 6, service: "BluSmart", type: "Electric", category: "eco", pickupOffset: 6, risk: 5, logo: "https://play-lh.googleusercontent.com/cRdxFHJ3j82q9yT2nqBTzJagzaa8NvTTmx2eE8AID4tk-a_MCxYSqkLm7Xp5agkJl1Dh" },
  { id: 7, service: "Uber", type: "Premier", category: "car", pickupOffset: 4, risk: 7, logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQys0XBQ5Iht-LdIlpMLTVLmGvd33hTz9lDMw&s" },
  { id: 8, service: "Ola", type: "Prime", category: "car", pickupOffset: 5, risk: 9, logo: "https://www.svgrepo.com/show/303255/ola-cabs-logo.svg" }
];

export function calculateFare(service, type, distance) {
  const dist = Number.parseFloat(distance);
  if (!Number.isFinite(dist) || dist <= 0) return null;

  const fares = {
    "Rapido-Bike": [2, 35, 8],
    "Yatri Sathi-Cab": [1.5, 50, 12],
    "Ola-Mini": [1.5, 55, 13],
    "Indrive-Car": [1.5, 55, 13.5],
    "Uber-Go": [1.5, 60, 14],
    "BluSmart-Electric": [2, 75, 15],
    "Uber-Premier": [1.5, 80, 18],
    "Ola-Prime": [1.5, 85, 17]
  };
  const [includedKm, baseFare, perKm] = fares[`${service}-${type}`] ?? [0, 40, 12];
  return Math.round(baseFare + Math.max(0, dist - includedKm) * perKm);
}

function scale(value, min, max) {
  if (max === min) return 1;
  return 1 - (value - min) / (max - min);
}

export function buildRideComparison(distance, routeDuration, hour = new Date().getHours()) {
  const dist = Number(distance);
  const peakSurcharge = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20) ? 5 : 0;
  const longTripRisk = dist > 15 ? 4 : 0;
  const basePickupEta = Math.max(2, Math.min(12, Math.round(Number(routeDuration) * 0.18)));

  const rides = RIDE_CATALOG.map((ride) => {
    const price = calculateFare(ride.service, ride.type, dist);
    const eta = basePickupEta + ride.pickupOffset;
    const cancellationChance = Math.min(35, ride.risk + peakSurcharge + longTripRisk);
    return { ...ride, price, eta, cancellationChance, reliability: 100 - cancellationChance };
  });

  const prices = rides.map((ride) => ride.price).filter(Number.isFinite);
  const etas = rides.map((ride) => ride.eta);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minEta = Math.min(...etas);
  const maxEta = Math.max(...etas);

  return rides.map((ride) => ({
    ...ride,
    matchScore: Math.round(100 * (
      0.5 * scale(ride.price, minPrice, maxPrice) +
      0.3 * scale(ride.eta, minEta, maxEta) +
      0.2 * (ride.reliability / 100)
    ))
  })).sort((a, b) => b.matchScore - a.matchScore);
}

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.get("/api/rides", async (req, res) => {
  const pickup = String(req.query.pickup ?? "").trim();
  const destination = String(req.query.destination ?? "").trim();
  if (!pickup || !destination) return res.status(400).json({ error: "Pickup and destination are required." });
  if (pickup.length > 160 || destination.length > 160) return res.status(400).json({ error: "Location names are too long." });
  if (!process.env.OLA_MAPS_KEY) return res.status(503).json({ error: "Ride search is not configured. Add OLA_MAPS_KEY to the server environment." });

  try {
    const requestOptions = { params: { api_key: process.env.OLA_MAPS_KEY }, timeout: 8000 };
    const [pickupGeo, destinationGeo] = await Promise.all([
      axios.get("https://api.olamaps.io/places/v1/geocode", { ...requestOptions, params: { ...requestOptions.params, address: pickup } }),
      axios.get("https://api.olamaps.io/places/v1/geocode", { ...requestOptions, params: { ...requestOptions.params, address: destination } })
    ]);

    const pickupLoc = pickupGeo.data.geocodingResults?.[0]?.geometry?.location;
    const destLoc = destinationGeo.data.geocodingResults?.[0]?.geometry?.location;
    if (!pickupLoc || !destLoc) return res.status(400).json({ error: "One or both locations could not be found. Try adding a city name." });

    const distanceResponse = await axios.get("https://api.olamaps.io/routing/v1/distanceMatrix", {
      params: {
        origins: `${pickupLoc.lat},${pickupLoc.lng}`,
        destinations: `${destLoc.lat},${destLoc.lng}`,
        mode: "driving",
        api_key: process.env.OLA_MAPS_KEY
      },
      timeout: 8000
    });
    const route = distanceResponse.data.rows?.[0]?.elements?.[0];
    if (!route || route.status !== "OK") return res.status(502).json({ error: "A driving route could not be calculated for those locations." });

    const distance_km = Number((route.distance / 1000).toFixed(2));
    const eta_min = Math.max(1, Math.round(route.duration / 60));
    const rides = buildRideComparison(distance_km, eta_min);
    return res.json({ pickup, destination, distance_km, eta_min, rides, pickupLoc, destLoc });
  } catch (error) {
    console.error("Ride comparison failed:", error.message);
    const status = error.code === "ECONNABORTED" ? 504 : 502;
    return res.status(status).json({ error: status === 504 ? "The map service timed out. Please try again." : "The map service is temporarily unavailable." });
  }
});

const PORT = process.env.PORT || 5000;
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

export default app;
