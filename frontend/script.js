document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selectors from your index.html ---
    const rideForm = document.getElementById('ride-form');
    const resultsSection = document.getElementById('results-section');
    const loadingSpinner = document.getElementById('loading-spinner');
    const pickupInput = document.getElementById('pickup');
    const destinationInput = document.getElementById('destination');

    // This URL must match where your backend is running.
    const BACKEND_URL = 'http://localhost:5000';

    /**
     * Handles the form submission to fetch ride data from the backend.
     */
    const findRides = async (event) => {
        event.preventDefault(); // Prevent the form from reloading the page
        
        const pickupLocation = pickupInput.value.trim();
        const destinationLocation = destinationInput.value.trim();

        if (!pickupLocation || !destinationLocation) {
            alert('Please enter both pickup and destination.');
            return;
        }

        // --- Show Loading State ---
        resultsSection.innerHTML = ''; // Clear previous results
        if (loadingSpinner) loadingSpinner.style.display = 'block';

        try {
            // --- THE REAL API CALL ---
            // 'fetch' sends a network request to our backend server.
            const response = await fetch(`${BACKEND_URL}/api/v1/ride/fare?pickup=${encodeURIComponent(pickupLocation)}&drop=${encodeURIComponent(destinationLocation)}`);

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            
            const result = await response.json();

            // --- Hide Loading State ---
            if (loadingSpinner) loadingSpinner.style.display = 'none';

            if (result.success) {
                displayRides(result.data); // Display the real data
            } else {
                displayError('Could not retrieve fares. Please try again.');
            }

        } catch (error) {
            console.error('Failed to fetch rides:', error);
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            displayError('Could not connect to the server. Is it running?');
        }
    };

    /**
     * Renders the fetched ride data into HTML cards.
     * @param {Array} rides - The array of ride objects from the backend.
     */
    const displayRides = (rides) => {
        if (!rides || rides.length === 0) {
            resultsSection.innerHTML = '<p class="error-message">No rides found for this route.</p>';
            return;
        }

        // Sort by the minimum price to show the cheapest option first
        rides.sort((a, b) => a.price.min - b.price.min);

        rides.forEach(ride => {
            // NOTE: We need to assign a logo based on the provider name from the backend.
            const logos = {
                'uber': 'https://i.imgur.com/08S322t.png',
                'ola': 'https://i.imgur.com/TcasYfW.png',
                'Namma Yatri': 'https://i.imgur.com/2A7ccw9.png'
                // Add other provider logos here as you integrate them
            };

            const priceString = ride.price.min === ride.price.max 
                ? `₹${ride.price.min}` 
                : `₹${ride.price.min} - ₹${ride.price.max}`;
            
            // This HTML structure matches your original style.css
            const rideCardHTML = `
                <div class="ride-card scroll-animate visible">
                    <img src="${logos[ride.provider.toLowerCase()] || 'https://i.imgur.com/gC58g3L.png'}" alt="${ride.provider} Logo" class="service-logo">
                    <div class="ride-details">
                        <h3>${ride.provider}</h3>
                        <p class="eta">${ride.duration} ride</p>
                    </div>
                    <div class="ride-price">
                        <p class="price">${priceString}</p>
                        <p class="eta">ETA: ${ride.eta}</p>
                    </div>
                </div>
            `;
            resultsSection.insertAdjacentHTML('beforeend', rideCardHTML);
        });
    };

    /**
     * Displays an error message in the results section.
     * @param {string} message - The error message to display.
     */
    const displayError = (message) => {
        resultsSection.innerHTML = `<div class="error-message">${message}</div>`;
    };
    
    // Attach the findRides function to the form's submit event.
    if (rideForm) {
        rideForm.addEventListener('submit', findRides);
    }


    // --- Your Existing Scroll & Modal Logic (No changes needed) ---
    const animatedElements = document.querySelectorAll('.scroll-animate');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    animatedElements.forEach(el => observer.observe(el));

    const signupModal = document.getElementById('signup-modal');
    const signupBtn = document.getElementById('signup-btn');
    const closeSignupBtn = document.getElementById('close-signup');

    if (signupBtn) signupBtn.addEventListener('click', () => signupModal.classList.add('active'));
    if (closeSignupBtn) closeSignupBtn.addEventListener('click', () => signupModal.classList.remove('active'));
    if (signupModal) signupModal.addEventListener('click', (e) => {
        if (e.target === signupModal) signupModal.classList.remove('active');
    });
});

