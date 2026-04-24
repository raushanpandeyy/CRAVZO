export const getNearbyRestaurantsService = (restaurants, userLat, userLng) => {
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  return restaurants
    .map((r) => {
      const distance = getDistance(userLat, userLng, r.latitude, r.longitude);

      return {
        ...r,
        distance: Number(distance.toFixed(2)),
      };
    })
    .filter((r) => r.distance <= 5)
    .sort((a, b) => a.distance - b.distance);
};