import { useState, useEffect, useCallback } from "react";

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  loadMap: () => Promise<void>;
}

let googleMapsPromise: Promise<void> | null = null;
let isGoogleMapsLoaded = false;

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(isGoogleMapsLoaded);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMap = useCallback(async () => {
    if (isGoogleMapsLoaded) {
      setIsLoaded(true);
      return;
    }

    if (googleMapsPromise) {
      try {
        await googleMapsPromise;
        isGoogleMapsLoaded = true;
        setIsLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load Google Maps");
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    googleMapsPromise = new Promise<void>(async (resolve, reject) => {
      try {
        const response = await fetch("/api/config/maps-key");
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to fetch Google Maps API key");
        }

        const { apiKey } = await response.json();

        if (!apiKey) {
          throw new Error("Google Maps API key not configured");
        }

        if (window.google?.maps) {
          isGoogleMapsLoaded = true;
          setIsLoaded(true);
          setIsLoading(false);
          resolve();
          return;
        }

        const existingScript = document.querySelector(
          'script[src*="maps.googleapis.com"]'
        );
        if (existingScript) {
          existingScript.addEventListener("load", () => {
            isGoogleMapsLoaded = true;
            setIsLoaded(true);
            setIsLoading(false);
            resolve();
          });
          return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          isGoogleMapsLoaded = true;
          setIsLoaded(true);
          setIsLoading(false);
          resolve();
        };

        script.onerror = () => {
          const errorMsg = "Failed to load Google Maps script";
          setError(errorMsg);
          setIsLoading(false);
          googleMapsPromise = null;
          reject(new Error(errorMsg));
        };

        document.head.appendChild(script);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load Google Maps";
        setError(errorMsg);
        setIsLoading(false);
        googleMapsPromise = null;
        reject(err);
      }
    });

    try {
      await googleMapsPromise;
    } catch {
    }
  }, []);

  useEffect(() => {
    loadMap();
  }, [loadMap]);

  return { isLoaded, isLoading, error, loadMap };
}
