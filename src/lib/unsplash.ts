import { createApi } from 'unsplash-js';

// Initialize Unsplash API
const unsplash = createApi({
  accessKey: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
});

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
  };
}

function pickBestMatch(results: any[], keywords: string[]): any | null {
  if (!results || results.length === 0) return null;
  // Try to find a result whose alt_description contains any keyword
  const lowerKeywords = keywords.map(k => k.toLowerCase());
  const best = results.find(img =>
    img.alt_description && lowerKeywords.some(k => img.alt_description.toLowerCase().includes(k))
  );
  return best || results[0]; // fallback to first if none match
}

export async function searchDestinationImage(destination: string): Promise<UnsplashImage | null> {
  try {
    if (!import.meta.env.VITE_UNSPLASH_ACCESS_KEY) {
      console.warn('Unsplash API key not found');
      return null;
    }

    const queries = [
      `${destination} luxury travel`,
      `${destination} travel`,
      `${destination} scenery`,
      `${destination}`
    ];
    for (const query of queries) {
      const result = await unsplash.search.getPhotos({
        query,
        page: 1,
        perPage: 5,
        orientation: 'landscape',
        orderBy: 'relevant',
      });
      if (result.response?.results && result.response.results.length > 0) {
        const best = pickBestMatch(result.response.results, [destination, 'luxury', 'travel']);
        if (best) return best;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    return null;
  }
}

export async function searchActivityImage(activity: string, destination: string): Promise<UnsplashImage | null> {
  try {
    if (!import.meta.env.VITE_UNSPLASH_ACCESS_KEY) {
      console.warn('Unsplash API key not found');
      return null;
    }

    const queries = [
      `${activity} ${destination}`,
      `${activity} in ${destination}`,
      `${destination} ${activity}`,
      `${activity}`,
      `${destination}`
    ];
    for (const query of queries) {
      const result = await unsplash.search.getPhotos({
        query,
        page: 1,
        perPage: 5,
        orientation: 'landscape',
        orderBy: 'relevant',
      });
      if (result.response?.results && result.response.results.length > 0) {
        const best = pickBestMatch(result.response.results, [activity, destination]);
        if (best) return best;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    return null;
  }
}

/**
 * Search Unsplash images with a general query for media library
 */
export async function searchUnsplashImages(query: string, page: number = 1, perPage: number = 20): Promise<UnsplashImage[]> {
  try {
    if (!import.meta.env.VITE_UNSPLASH_ACCESS_KEY) {
      console.warn('Unsplash API key not found');
      return [];
    }

    const result = await unsplash.search.getPhotos({
      query,
      page,
      perPage,
      orientation: 'landscape',
      orderBy: 'relevant',
    });

    if (result.response?.results) {
      return result.response.results.map((photo: any) => ({
        id: photo.id,
        urls: {
          regular: photo.urls.regular,
          small: photo.urls.small,
          thumb: photo.urls.thumb,
        },
        alt_description: photo.alt_description || query,
        user: {
          name: photo.user?.name || 'Unknown',
        },
      }));
    }

    return [];
  } catch (error) {
    console.error('Error searching Unsplash images:', error);
    return [];
  }
} 