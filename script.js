document.addEventListener('DOMContentLoaded', () => {

    // --- RIDE FINDER LOGIC ---
    const rideForm = document.getElementById('ride-form');
    const resultsSection = document.getElementById('results-section');
    const loadingSpinner = document.getElementById('loading-spinner');

    rideForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await findRides();
    });

    async function findRides() {
        resultsSection.innerHTML = '';
        loadingSpinner.style.display = 'block';

        const pickup = document.getElementById('pickup').value;
        const destination = document.getElementById('destination').value;

        if (!pickup || !destination) {
            alert("Please enter both pickup and destination");
            loadingSpinner.style.display = 'none';
            return;
        }

        try {
            // Call backend API
            const response = await fetch(`http://localhost:5000/api/rides?pickup=${pickup}&destination=${destination}`, {
                cache: "no-store"
            });
            const data = await response.json();

            loadingSpinner.style.display = 'none';

            if (!data.rides || data.rides.length === 0) {
                resultsSection.innerHTML = "<p>No rides available</p>";
                return;
            }

            // Show distance & ETA
            // Show distance & ETA
            resultsSection.insertAdjacentHTML(
                "beforeend",
                `<p><strong>Distance:</strong> ${data.distance_km} km | <strong>ETA:</strong> ${data.eta_min} min</p>`
            );


            displayRides(data.rides);

            // --- Update Map using Ola Maps ---
            // --- Update Map Securely ---
            // in script.js, inside the findRides function

            // --- Update Map using Ola Maps ---
            const mapFrame = document.getElementById("mapFrame");
            const mapPlaceholder = document.querySelector(".map-placeholder"); // Get the placeholder element

            if (mapFrame && mapPlaceholder) {
                // Hide the placeholder and show the map frame
                mapPlaceholder.style.display = "none";
                mapFrame.style.display = "block";

                const mapRes = await fetch(
                    `http://localhost:5000/api/map?pickup=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}`
                );
                const mapData = await mapRes.json();
                mapFrame.src = mapData.mapUrl;
            }


        } catch (error) {
            console.error(error);
            loadingSpinner.style.display = 'none';
            resultsSection.innerHTML = "<p>Failed to fetch rides</p>";
        }
    }

    function displayRides(rides) {
        // Sort rides by price
        const sortedRides = rides.sort((a, b) => a.price - b.price);

        sortedRides.forEach(ride => {
            const rideCardHTML = `
                <div class="ride-card">
                    <img src="${ride.logo}" alt="${ride.service} Logo" class="service-logo">
                    <div class="ride-details">
                        <h3>${ride.service} ${ride.type}</h3>
                    </div>
                    <div class="ride-price">
                        <p class="price">₹${ride.price}</p>
                        <p class="eta">ETA: ${ride.eta} mins</p>
                    </div>
                </div>
            `;
            resultsSection.insertAdjacentHTML('beforeend', rideCardHTML);
        });
    }

    // --- SCROLL ANIMATION LOGIC ---
    const animatedElements = document.querySelectorAll('.scroll-animate');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => observer.observe(el));
});
