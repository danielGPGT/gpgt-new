import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
    googleMapsLoaded: boolean;
  }
}

let scriptLoadingPromise: Promise<void> | null = null;

export function useGoogleMapsScript() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    console.log('useGoogleMapsScript - API key exists:', !!apiKey);
    console.log('useGoogleMapsScript - API key length:', apiKey?.length || 0);

    if (!apiKey) {
      console.log('useGoogleMapsScript - No API key found');
      setError('Google Maps API key is not defined');
      return;
    }

    // If Google Maps is already loaded, set loaded state and return
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // If script is already loading, wait for it
    if (scriptLoadingPromise) {
      scriptLoadingPromise.then(() => setIsLoaded(true)).catch(setError);
      return;
    }

    // Create a new script loading promise
    scriptLoadingPromise = new Promise((resolve, reject) => {
      // Check if script is already in the document
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.nonce = 'google-maps';

      // Handle script load
      script.onload = () => {
        window.googleMapsLoaded = true;
        resolve();
      };

      // Handle script error
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script'));
      };

      // Add script to document
      document.head.appendChild(script);
    });

    // Handle the script loading promise
    scriptLoadingPromise
      .then(() => {
        setIsLoaded(true);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        scriptLoadingPromise = null;
      });

    // Cleanup
    return () => {
      // Don't remove the script on cleanup as it might be needed by other components
      // Just reset the loading promise if this is the last component using it
      if (window.googleMapsLoaded) {
        scriptLoadingPromise = null;
      }
    };
  }, []);

  return { isLoaded, error };
} 