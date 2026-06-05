// Fix 9: Leaflet CSS moved here from main.jsx — was loading 4KB on every page
// even when map isn't shown. Now loads only when RiderMap mounts.
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const RiderMap = ({ pickup, drop, rider }) => {
  if (!pickup?.lat || !pickup?.lng) {
    return <p>Loading map...</p>;
  }

  const hasDrop = drop?.lat && drop?.lng;

  const center = hasDrop
    ? [(pickup.lat + drop.lat) / 2, (pickup.lng + drop.lng) / 2]
    : [pickup.lat, pickup.lng];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Marker position={[pickup.lat, pickup.lng]}>
        <Popup>Pickup Location</Popup>
      </Marker>

      {hasDrop && (
        <Marker position={[drop.lat, drop.lng]}>
          <Popup>Delivery Location</Popup>
        </Marker>
      )}

      {rider?.lat && rider?.lng && (
        <Marker position={[rider.lat, rider.lng]}>
          <Popup>Your Location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default RiderMap;