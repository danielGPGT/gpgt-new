// Utility function to convert image URL to base64 for React PDF
export const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    console.log('ImageUtils - Fetching image from URL:', imageUrl);
    const response = await fetch(imageUrl);
    console.log('ImageUtils - Fetch response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('ImageUtils - Blob size:', blob.size, 'bytes, type:', blob.type);
    
    // If it's an SVG, try to convert it to PNG using canvas
    if (blob.type === 'image/svg+xml') {
      console.log('ImageUtils - Converting SVG to PNG...');
      return await convertSvgToPngBase64(blob);
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        console.log('ImageUtils - Base64 conversion complete, length:', base64String.length);
        resolve(base64String);
      };
      reader.onerror = (error) => {
        console.error('ImageUtils - FileReader error:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

// Convert SVG to PNG using canvas
const convertSvgToPngBase64 = async (svgBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = 120; // Match the PDF logo width
    canvas.height = 40;  // Match the PDF logo height
    
    img.onload = () => {
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngBase64 = canvas.toDataURL('image/png');
        console.log('ImageUtils - SVG to PNG conversion complete, length:', pngBase64.length);
        resolve(pngBase64);
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load SVG image'));
    };
    
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  });
};

// Cache for base64 images to avoid refetching
const imageCache = new Map<string, string>();

export const getBase64Image = async (imageUrl: string): Promise<string> => {
  console.log('ImageUtils - Getting base64 for URL:', imageUrl);
  
  // Check cache first
  if (imageCache.has(imageUrl)) {
    console.log('ImageUtils - Found in cache');
    return imageCache.get(imageUrl)!;
  }
  
  console.log('ImageUtils - Converting image to base64...');
  // Convert and cache
  const base64 = await convertImageToBase64(imageUrl);
  console.log('ImageUtils - Conversion complete, caching result');
  imageCache.set(imageUrl, base64);
  return base64;
}; 