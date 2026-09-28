import { Product } from '../types';
import { POUCH_IMAGES } from './productImages';

export const DEFAULT_PRODUCT_IMAGE = POUCH_IMAGES.garamMasala;

export interface SpicePreset {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
}

export const CURATED_SPICE_PRESETS: SpicePreset[] = [
  {
    id: 'preset-chole-masala',
    name: 'Amritsari Chole Masala (छोले मसाला)',
    category: 'Blended Masalas',
    image: POUCH_IMAGES.choleMasala,
    description: 'Tangy dark authentic Punjabi Chole & Chana spice blend pouch',
  },
  {
    id: 'preset-garam-masala',
    name: 'Royal Garam Masala (गरम मसाला)',
    category: 'Blended Masalas',
    image: POUCH_IMAGES.garamMasala,
    description: '16-spice roasted royal garam masala pouch',
  },
  {
    id: 'preset-turmeric',
    name: 'Lakadong Haldi / Turmeric (हल्दी)',
    category: 'Pure Spice Powders',
    image: POUCH_IMAGES.turmeric,
    description: 'High-curcumin golden Lakadong turmeric pouch',
  },
  {
    id: 'preset-chilli',
    name: 'Kashmiri Lal Mirch (लाल मिर्च)',
    category: 'Pure Spice Powders',
    image: POUCH_IMAGES.chilli,
    description: 'Stemless sun-dried vibrant Kashmiri red chilli pouch',
  },
  {
    id: 'preset-jeera',
    name: 'Roasted Jeera / Cumin (जीरा)',
    category: 'Pure Spice Powders',
    image: POUCH_IMAGES.jeera,
    description: 'Cold-pressed aromatic roasted cumin powder pouch',
  },
  {
    id: 'preset-coriander',
    name: 'Dhaniya / Coriander (धनिया)',
    category: 'Pure Spice Powders',
    image: POUCH_IMAGES.coriander,
    description: 'Lush green micro-milled fragrant coriander powder pouch',
  },
  {
    id: 'preset-biryani',
    name: 'Shahi Biryani Masala (शाही बिरयानी)',
    category: 'Blended Masalas',
    image: POUCH_IMAGES.biryani,
    description: 'Slow-stone ground Hyderabadi dum biryani masala pouch',
  },
  {
    id: 'preset-combo',
    name: 'Essential Kitchen Spice Trio (किचन कॉम्बो)',
    category: 'Kitchen Combos',
    image: POUCH_IMAGES.heroBanner,
    description: 'Complete daily cooking spices collection in aroma-seal pouch',
  },
  {
    id: 'preset-elaichi',
    name: 'Idukki Green Cardamom (हरी इलायची)',
    category: 'Pure Spice Powders',
    image: POUCH_IMAGES.biryani,
    description: 'Aromatic green cardamom pod essence powder',
  },
  {
    id: 'preset-pepper',
    name: 'Malabar Black Pepper (काली मिर्च)',
    category: 'Pure Spice Powders',
    image: POUCH_IMAGES.garamMasala,
    description: 'Bold pungency Malabar tellicherry black pepper',
  },
  {
    id: 'preset-cinnamon',
    name: 'Ceylon Dalchini / Cinnamon (दालचीनी)',
    category: 'Pure Spice Powders',
    image: POUCH_IMAGES.coriander,
    description: 'Sweet delicate true Ceylon cinnamon quill powder',
  },
];

/**
 * Safely resolves a product image or fallback URL, guaranteeing authentic
 * Hapinoz artisanal stand-up pouch images over generic external URLs like unsplash.
 */
export function getProductImage(product?: Partial<Product> | null, index = 0): string {
  if (!product) return DEFAULT_PRODUCT_IMAGE;

  // Helper: map product title, slug, and category directly to authentic pouch image
  const getPouchImageByDetails = (): string => {
    const title = (
      (product.title || '') +
      ' ' +
      (product.slug || '') +
      ' ' +
      (Array.isArray(product.tags) ? product.tags.join(' ') : '')
    ).toLowerCase();

    if (title.includes('chole') || title.includes('chhole') || title.includes('chana') || title.includes('amritsari')) {
      return POUCH_IMAGES.choleMasala;
    }
    if (title.includes('biryani') || title.includes('pulao') || title.includes('chai') || title.includes('tea')) {
      return POUCH_IMAGES.biryani;
    }
    if (
      title.includes('garam') ||
      title.includes('pepper') ||
      title.includes('black pepper') ||
      title.includes('kali mirch') ||
      title.includes('malabar')
    ) {
      return POUCH_IMAGES.garamMasala;
    }
    if (title.includes('turmeric') || title.includes('haldi') || title.includes('lakadong')) {
      return POUCH_IMAGES.turmeric;
    }
    if (
      title.includes('chilli') ||
      title.includes('mirch') ||
      title.includes('kashmiri') ||
      title.includes('teja') ||
      title.includes('guntur') ||
      title.includes('red chilli')
    ) {
      return POUCH_IMAGES.chilli;
    }
    if (title.includes('jeera') || title.includes('cumin') || title.includes('bhuna') || title.includes('roasted jeera')) {
      return POUCH_IMAGES.jeera;
    }
    if (title.includes('coriander') || title.includes('dhaniya')) {
      return POUCH_IMAGES.coriander;
    }
    if (title.includes('combo') || title.includes('box') || title.includes('pantry') || title.includes('trio')) {
      return POUCH_IMAGES.heroBanner;
    }

    const cat = (product.category || '').toLowerCase();
    if (cat.includes('kitchen') || cat.includes('combo')) {
      return POUCH_IMAGES.heroBanner;
    }
    if (cat.includes('blend')) {
      return POUCH_IMAGES.choleMasala;
    }
    if (cat.includes('pure') || cat.includes('powder')) {
      return POUCH_IMAGES.turmeric;
    }

    return DEFAULT_PRODUCT_IMAGE;
  };

  // Check candidate image
  let candidate: string | null = null;
  if (Array.isArray(product.images) && product.images.length > 0) {
    const raw = product.images[index] || product.images[0];
    if (typeof raw === 'string' && raw.trim().length > 0) {
      candidate = raw.trim();
    }
  } else if (typeof (product as any).images === 'string' && (product as any).images.trim().length > 0) {
    candidate = (product as any).images.trim();
  } else if (typeof (product as any).image === 'string' && (product as any).image.trim().length > 0) {
    candidate = (product as any).image.trim();
  }

  // If user uploaded a custom image in admin via Base64, honor it
  if (candidate && candidate.startsWith('data:image/')) {
    return candidate;
  }

  // If candidate is a generic unsplash photo or placeholder, discard it in favor of authentic pouch image
  if (candidate && (candidate.includes('unsplash.com') || candidate.includes('placeholder') || candidate.includes('via.placeholder'))) {
    return getPouchImageByDetails();
  }

  // If candidate is already an authentic pouch image or relative asset path
  if (
    candidate &&
    (candidate.includes('hapinoz_') ||
      candidate.includes('spice_milling') ||
      candidate.includes('/assets/') ||
      candidate.includes('/images/') ||
      candidate.startsWith('blob:'))
  ) {
    return candidate;
  }

  return getPouchImageByDetails();
}

/**
 * Compresses an image client-side to an optimized base64 Data URL
 * to guarantee immediate preview, offline persistence, and DB portability.
 */
export async function fileToDataUrl(
  file: File | Blob,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If FileReader is not available or file is invalid
    if (!file) {
      resolve(DEFAULT_PRODUCT_IMAGE);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        resolve(DEFAULT_PRODUCT_IMAGE);
        return;
      }

      // If SVG or small file, return directly
      if (file.type === 'image/svg+xml' || file.size < 50 * 1024) {
        resolve(result);
        return;
      }

      // Create an image element to resize and compress via canvas
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Calculate aspect ratio scaling
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(result);
            return;
          }

          // Fill white background for transparent PNGs converted to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first, fallback to JPEG
          let outputType = 'image/jpeg';
          try {
            const webpData = canvas.toDataURL('image/webp', quality);
            if (webpData && webpData.startsWith('data:image/webp')) {
              resolve(webpData);
              return;
            }
          } catch {
            // fallback to jpeg
          }

          const compressedData = canvas.toDataURL(outputType, quality);
          resolve(compressedData);
        } catch {
          // If canvas fails, return original data URL
          resolve(result);
        }
      };

      img.onerror = () => {
        resolve(result);
      };

      img.src = result;
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsDataURL(file);
  });
}
