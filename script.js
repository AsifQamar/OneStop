// --- LEAFLET MAP INITIALIZATION ---
const map = L.map("map").setView([20.5937, 78.9629], 5); // Center on India
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

let routeLayer = L.layerGroup().addTo(map);

function updateLeafletRoute(startCoords, endCoords) {
  routeLayer.clearLayers();

  // Add markers
  L.marker(startCoords).addTo(routeLayer).bindPopup("Pickup").openPopup();
  L.marker(endCoords).addTo(routeLayer).bindPopup("Destination");

  // Draw polyline
  L.polyline([startCoords, endCoords], { color: "blue", weight: 4 }).addTo(routeLayer);

  // Adjust zoom
  map.fitBounds([startCoords, endCoords]);
}

// --- REST OF YOUR LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
  const rideForm = document.getElementById("ride-form");
  const resultsSection = document.getElementById("results-section");
  const loadingSpinner = document.getElementById("loading-spinner");

  rideForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await findRides();
  });

  async function findRides() {
    resultsSection.innerHTML = "";
    loadingSpinner.style.display = "block";

    const pickup = document.getElementById("pickup").value;
    const destination = document.getElementById("destination").value;

    if (!pickup || !destination) {
      alert("Please enter both pickup and destination");
      loadingSpinner.style.display = "none";
      return;
    }

    try {
    // New Code (Relative path)
    const response = await fetch(
        `/api/rides?pickup=${pickup}&destination=${destination}`,
        { cache: "no-store" }
        );
      const data = await response.json();

      loadingSpinner.style.display = "none";

      if (data.distance_km !== null && data.eta_min !== null) {
        resultsSection.insertAdjacentHTML(
          "beforeend",
          `<p><strong>Distance:</strong> ${data.distance_km} km | <strong>ETA:</strong> ${data.eta_min} min</p>`
        );
      } else {
        resultsSection.insertAdjacentHTML(
          "beforeend",
          `<p>Distance and ETA could not be calculated for this route, but here are available services:</p>`
        );
      }

      displayRides(data.rides);

      document.querySelector('.map-placeholder').style.display = 'none';
      
      // 🗺️ Update Leaflet map
      updateLeafletRoute(
        [data.pickupLoc.lat, data.pickupLoc.lng],
        [data.destLoc.lat, data.destLoc.lng]
      );
    } catch (error) {
      console.error(error);
      loadingSpinner.style.display = "none";
      resultsSection.innerHTML = "<p>Failed to fetch rides</p>";
    }
  }

  function displayRides(rides) {
    const sortedRides = rides.sort((a, b) => a.price - b.price);

    sortedRides.forEach((ride) => {
      const priceText = ride.price !== null ? `₹${ride.price}` : "Price N/A";
      const etaText = ride.eta !== null ? `ETA: ${ride.eta} mins` : "ETA: N/A";

      const rideCardHTML = `
        <div class="ride-card">
          <img src="${ride.logo}" alt="${ride.service} Logo" class="service-logo">
          <div class="ride-details">
              <h3>${ride.service} ${ride.type}</h3>
          </div>
          <div class="ride-price">
              <p class="price">${priceText}</p>
              <p class="eta">${etaText}</p>
          </div>
        </div>
      `;
      resultsSection.insertAdjacentHTML("beforeend", rideCardHTML);
    });
  }

  // --- Scroll animation ---
  const animatedElements = document.querySelectorAll(".scroll-animate");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1 });

  animatedElements.forEach((el) => observer.observe(el));
});
