const axios = require("axios");

// Helper to get coordinates from OpenStreetMap safely
async function getCoordinates(address) {
  if (!address) return null;

  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: address,
        format: "json",
        limit: 1,
        addressdetails: 1
      },
      headers: {
        // Use a unique User-Agent for your app
        "User-Agent": "WanderLustApp/1.0 (contactwanderlust9@gmail.com)"
      },
      timeout: 5000 // 5 seconds timeout
    });

    if (!response.data || response.data.length === 0) return null;

    const { lat, lon, display_name } = response.data[0];
    return { lat, lon, display_name };
  } catch (err) {
    console.error("Geocoding error:", err.message);
    return null;
  }
}

module.exports = { getCoordinates };
