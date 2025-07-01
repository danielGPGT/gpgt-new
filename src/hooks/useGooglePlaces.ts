import { useState, useEffect } from 'react';

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (input: HTMLInputElement, options?: google.maps.places.AutocompleteOptions) => google.maps.places.Autocomplete;
        };
      };
    };
  }
}

interface PlaceDetails {
  name: string;
  formattedAddress: string;
  country: string;
  city: string;
  state?: string;
}

export function useGooglePlaces(inputRef: React.RefObject<HTMLInputElement | null> | null) {
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    console.log('useGooglePlaces - inputRef:', !!inputRef);
    console.log('useGooglePlaces - inputRef.current:', !!inputRef?.current);
    console.log('useGooglePlaces - window.google?.maps?.places:', !!window.google?.maps?.places);
    
    if (!inputRef || !inputRef.current || !window.google?.maps?.places) {
      console.log('useGooglePlaces - early return, missing requirements');
      return;
    }

    console.log('useGooglePlaces - creating autocomplete');
    const placeAutocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'],
      fields: ['name', 'formatted_address', 'address_components'],
    });

    placeAutocomplete.addListener('place_changed', () => {
      const selectedPlace = placeAutocomplete.getPlace();
      if (selectedPlace) {
        // Extract address components
        const addressComponents = selectedPlace.address_components || [];
        const country = addressComponents.find(component => 
          component.types.includes('country')
        )?.long_name || '';
        
        const city = addressComponents.find(component => 
          component.types.includes('locality')
        )?.long_name || '';
        
        const state = addressComponents.find(component => 
          component.types.includes('administrative_area_level_1')
        )?.long_name;

        setPlace({
          name: selectedPlace.name || '',
          formattedAddress: selectedPlace.formatted_address || '',
          country,
          city,
          state,
        });
      }
    });

    setAutocomplete(placeAutocomplete);

    return () => {
      if (placeAutocomplete) {
        google.maps.event.clearInstanceListeners(placeAutocomplete);
      }
    };
  }, [inputRef]);

  return { place, autocomplete };
} 