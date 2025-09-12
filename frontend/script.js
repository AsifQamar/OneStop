document.addEventListener('DOMContentLoaded', () => {

    // --- RIDE FINDER LOGIC ---
    const rideForm = document.getElementById('ride-form');
    const resultsSection = document.getElementById('results-section');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    const rideData = [
        { service: 'Uber', type: 'Go', eta: 3, price: 150, logo: 'https://i.imgur.com/08S322t.png' },
        { service: 'Ola', type: 'Mini', eta: 4, price: 145, logo: 'https://i.imgur.com/TcasYfW.png' },
        { service: 'Yatri Sathi', type: 'AC Taxi', eta: 5, price: 130, logo: 'https://i.imgur.com/2A7ccw9.png' },
        { service: 'Uber', type: 'Premier', eta: 6, price: 210, logo: 'https://i.imgur.com/08S322t.png' },
        { service: 'Ola', type: 'Prime Sedan', eta: 7, price: 200, logo: 'https://i.imgur.com/TcasYfW.png' },
    ];

    rideForm.addEventListener('submit', (event) => {
        event.preventDefault();
        findRides();
    });

    function findRides() {
        resultsSection.innerHTML = '';
        loadingSpinner.style.display = 'block'; // Make sure spinner exists or create it
        
        // This is a placeholder for the spinner if it's not in the HTML initially
        if (!document.getElementById('loading-spinner')) {
             resultsSection.innerHTML = '<div class="spinner" id="loading-spinner"></div>';
        }

        setTimeout(() => {
            const spinner = document.getElementById('loading-spinner');
            if(spinner) spinner.style.display = 'none';
            displayRides(rideData);
        }, 2000);
    }

    function displayRides(rides) {
        const sortedRides = rides.sort((a, b) => a.eta - b.eta);
        sortedRides.forEach(ride => {
            // Re-using the card structure from the previous response as it's solid.
            // Styles in the new CSS file will give it the glossy look.
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

    // --- NEW: SCROLL ANIMATION LOGIC ---
    // This adds a "visible" class to elements as they scroll into view.
    
    const animatedElements = document.querySelectorAll('.scroll-animate');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // When the element is intersecting (visible on screen)
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    // Tell the observer to watch each of our animated elements
    animatedElements.forEach(el => {
        observer.observe(el);
    });
});