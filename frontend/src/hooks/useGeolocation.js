import { useState, useEffect, useCallback } from 'react';

// Default fallback coordinates (e.g., Bogotá, Colombia)
const DEFAULT_COORDINATES = {
  lat: 4.6533,
  lng: -74.0836,
};

/**
 * Custom Hook: useGeolocation
 * Retrieves client GPS coordinates with error handling and fallback defaults.
 */
export function useGeolocation() {
  const [coordinates, setCoordinates] = useState(DEFAULT_COORDINATES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  const requestCoordinates = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setHasPermission(true);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.warn('[useGeolocation] Warning: Access denied or unavailable. Using fallback.', err);
        setError(err.message);
        setHasPermission(false);
        setCoordinates(DEFAULT_COORDINATES);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  useEffect(() => {
    requestCoordinates();
  }, [requestCoordinates]);

  return {
    coordinates,
    loading,
    error,
    hasPermission,
    refreshLocation: requestCoordinates,
  };
}

export default useGeolocation;
