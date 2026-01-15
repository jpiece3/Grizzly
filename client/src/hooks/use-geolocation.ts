import { useState, useCallback } from "react";
import type { GeoPosition } from "@shared/schema";

interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  isLoading: boolean;
  getCurrentPosition: () => Promise<GeoPosition | null>;
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentPosition = useCallback(async (): Promise<GeoPosition | null> => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return null;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPosition: GeoPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition(newPosition);
          setIsLoading(false);
          resolve(newPosition);
        },
        (err) => {
          let errorMessage: string;
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Location access was denied. Please enable location services.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case err.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
            default:
              errorMessage = "An unknown error occurred.";
          }
          setError(errorMessage);
          setIsLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { position, error, isLoading, getCurrentPosition };
}

// Calculate distance between two coordinates in meters (Haversine formula)
export function calculateDistance(pos1: GeoPosition, pos2: GeoPosition): number {
  const R = 6371e3; // Earth's radius in meters
  const lat1Rad = (pos1.lat * Math.PI) / 180;
  const lat2Rad = (pos2.lat * Math.PI) / 180;
  const deltaLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const deltaLng = ((pos2.lng - pos1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
