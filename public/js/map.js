function initMap(listings, currentListingId) {
    if (!listings || listings.length === 0) return;

    let map = L.map('map').setView([20.5937, 78.9629], 5);
    let routeLine = null;
    let userMarker = null;

    // Tile Layer
    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
            attribution: '&copy; OpenStreetMap contributors',
            subdomains: "abcd",
            maxZoom: 10,
        }
    ).addTo(map);

    // Icons
    const currentIcon = L.icon({
        iconUrl: '/image/pin.png',
        iconSize: [35, 40],
        iconAnchor: [17, 40],
        popupAnchor: [0, -35]
    });

    const otherIcon = L.icon({
        iconUrl: '/image/gps.png',
        iconSize: [35, 40],
        iconAnchor: [17, 40],
        popupAnchor: [0, -35]
    });

    // Add markers
    const markers = [];
    listings.forEach(listing => {
        const icon = listing.id === currentListingId ? currentIcon : otherIcon;

        const marker = L.marker(listing.coordinates, { icon })
            .addTo(map)
            .bindPopup(
                `<strong>${listing.title}</strong><br>${listing.location || "Location unavailable"}<br>Exact location will be provided after booking`
            );

        markers.push({ ...listing, marker });
    });

    // Center on current listing
    const currentListing = listings.find(l => l.id === currentListingId);
    if (currentListing) {
        map.setView(currentListing.coordinates, 12);
    }

    // 🔴 SOCKET.IO LISTENER FOR LIVE LOCATION UPDATES
    const socket = io();
    socket.on("listingLocationUpdated", (data) => {
        console.log("📍 Live update received:", data);

        const listing = markers.find(m => m.id === data.id);
        if (!listing) return;

        const [lng, lat] = data.coordinates;

        // Update marker position
        listing.marker.setLatLng([lat, lng]);

        // Keep the original "Exact location will be provided after booking"
        listing.marker.bindPopup(
            `<strong>${data.title}</strong><br>${data.location || "Location unavailable"}<br>Exact location will be provided after booking`
        );

        // Recenter if it's the current listing
        if (data.id === currentListingId) {
            map.setView([lat, lng], 12);
        }
    });

    // Button - Find Nearest
    const findBtn = document.getElementById("findNearestBtn");
    if (findBtn) {
        findBtn.addEventListener("click", () => {
            if (!navigator.geolocation) {
                alert("Geolocation not supported by your browser");
                return;
            }

            navigator.geolocation.getCurrentPosition(pos => {
                const userLat = pos.coords.latitude;
                const userLon = pos.coords.longitude;
                const userLoc = [userLat, userLon];

                if (userMarker) map.removeLayer(userMarker);

                const userIcon = L.icon({
                    iconUrl: '/image/location.png',
                    iconSize: [35, 40],
                    iconAnchor: [17, 40]
                });

                userMarker = L.marker(userLoc, { icon: userIcon })
                    .addTo(map)
                    .bindPopup("<strong>You are here</strong>")
                    .openPopup();

                // Haversine distance
                function getDistance(lat1, lon1, lat2, lon2) {
                    const R = 6371;
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLon = (lon2 - lon1) * Math.PI / 180;
                    const a = 0.5 - Math.cos(dLat)/2 +
                        Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180) *
                        (1 - Math.cos(dLon))/2;
                    return R * 2 * Math.asin(Math.sqrt(a));
                }

                // Find nearest
                let nearest = null;
                let minDist = Infinity;

                markers.forEach(hotel => {
                    const [lat, lng] = hotel.coordinates;
                    const dist = getDistance(userLat, userLon, lat, lng);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = hotel;
                    }
                });

                if (!nearest) {
                    alert("No hotels found");
                    return;
                }

                L.circle(nearest.coordinates, {
                    radius: 800,
                    color: null,
                    weight: 0,
                    fillColor: "#FF385C",
                    fillOpacity: 0.25
                }).addTo(map);

                if (routeLine) map.removeLayer(routeLine);

                routeLine = L.polyline([userLoc, nearest.coordinates], {
                    color: "#FF385C",
                    weight: 4,
                    dashArray: "6,6",
                }).addTo(map);

                nearest.marker.openPopup();
                map.fitBounds([userLoc, nearest.coordinates], { padding: [50, 50] });
            }, () => {
                alert("Could not get your location");
            });
        });
    }
}
