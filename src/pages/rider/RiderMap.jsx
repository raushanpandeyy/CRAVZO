// Fix 9: Leaflet CSS moved here from main.jsx — was loading 4KB on every page
// even when map isn't shown. Now loads only when RiderMap mounts.
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const RiderMap = ({ pickup, drop, rider }) => {
  // 🔍 Debug logs (MOST IMPORTANT)
  console.log("Pickup:", pickup);
  console.log("Drop:", drop);
  console.log("Rider:", rider);

  // 🛑 Safety check
  if (!pickup?.lat || !pickup?.lng || !drop?.lat || !drop?.lng) {
    console.log("❌ Missing coordinates:", {
      pickupLat: pickup?.lat,
      pickupLng: pickup?.lng,
      dropLat: drop?.lat,
      dropLng: drop?.lng,
    });

    return <p>Loading map...</p>;
  }

  return (
    <MapContainer
      center={[pickup.lat, pickup.lng]}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 📍 Restaurant */}
      <Marker position={[pickup.lat, pickup.lng]}>
        <Popup>Pickup Location</Popup>
      </Marker>

      {/* 📍 Customer */}
      <Marker position={[drop.lat, drop.lng]}>
        <Popup>Delivery Location</Popup>
      </Marker>

      {/* 🛵 Rider */}
      {rider?.lat && rider?.lng && (
        <Marker position={[rider.lat, rider.lng]}>
          <Popup>Your Location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default RiderMap;