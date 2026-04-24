// src/utils/geocode.js

export const getLatLngFromAddress = async (address) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "cravzo-app",
        },
      }
    );

    const data = await res.json();

    // 🔥 IMPORTANT: crash mat karo
    if (!data || data.length === 0) {
      console.log("Geocode failed for:", address);

      return {
        lat: null,
        lng: null,
      };
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };

  } catch (err) {
    console.log("Geocode error:", err.message);

    return {
      lat: null,
      lng: null,
    };
  }
};