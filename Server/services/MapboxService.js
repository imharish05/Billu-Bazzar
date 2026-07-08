'use strict';
/**
 * MapboxService — local mock. Replace with real Mapbox API before production.
 */
class MapboxService {
  geocode(address) {
    return Promise.resolve({
      coordinates: [72.8777 + Math.random() * 0.1, 19.0760 + Math.random() * 0.1],
      placeName: address,
      accuracy: 'rooftop',
    });
  }

  getRouteDistance(origin, destination) {
    return Promise.resolve({ distance: '12.4 km', duration: '28 min', polyline: [] });
  }
}

module.exports = new MapboxService();
