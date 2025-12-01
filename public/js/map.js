function initMap(listings, currentListingId) {
    if (!listings || listings.length === 0) return;

    // Initialize map centered in India initially
    const map = L.map('map').setView([20.5937, 78.9629], 5);

    // Tile layer
    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            subdomains: "abcd",
            maxZoom: 10,
        }
    ).addTo(map);

    // Icons
    const currentIcon = L.icon({
        iconUrl: '/image/pin.png',   // Current listing red pin
        iconSize: [35, 40],
        iconAnchor: [17, 40],
        popupAnchor: [0, -35]
    });

    const otherIcon = L.icon({
        iconUrl: '/image/gps.png', // Other listings black pin
        iconSize: [35, 40],
        iconAnchor: [17, 40],
        popupAnchor: [0, -35]
    });

    // Add all markers first
    listings.forEach(listing => {
        const icon = listing.id === currentListingId ? currentIcon : otherIcon;
        L.marker(listing.coordinates, { icon })
            .addTo(map)
            .bindPopup(`<strong>${listing.title}</strong><br>${listing.location || "Location unavailable"}<br>Exact location will be provided after booking`);
    });

    // Center map on current listing
    const currentListing = listings.find(l => l.id === currentListingId);
    if (currentListing) {
        map.setView(currentListing.coordinates, 12);
    }

    // Button: Find nearest hotel using user geolocation
    const findBtn = document.getElementById("findNearestBtn");
    findBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(pos => {
            const userLat = pos.coords.latitude;
            const userLon = pos.coords.longitude;

            // Mark user's location
            const userIcon = L.icon({
                iconUrl: '/image/location.png', // Can use a distinct icon
                iconSize: [35, 40],
                iconAnchor: [17, 40]
            });
            L.marker([userLat, userLon], { icon: userIcon }).addTo(map).bindPopup("<strong>You are here</strong>").openPopup();

            // Haversine formula
            function getDistance(lat1, lon1, lat2, lon2) {
                const R = 6371; // km
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = 0.5 - Math.cos(dLat)/2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*(1 - Math.cos(dLon))/2;
                return R * 2 * Math.asin(Math.sqrt(a));
            }

            // Find nearest listing to user
            let nearest = null;
            let minDist = Infinity;
            listings.forEach(listing => {
                const [lat, lng] = listing.coordinates;
                const dist = getDistance(userLat, userLon, lat, lng);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = listing;
                }
            });

            if (nearest) {
                // Highlight nearest with Airbnb circle
                L.circle(nearest.coordinates, {
                    radius: 800,          // meters
                    color: null,
                    weight: 0,
                    fillColor: "#FF385C",
                    fillOpacity: 0.25
                }).addTo(map);

                map.setView(nearest.coordinates, 13);
            }
        }, () => {
            alert("Could not get your location");
        });
    });
}
