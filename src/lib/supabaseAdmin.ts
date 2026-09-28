import { SupabaseClient } from '@supabase/supabase-js';
import { Product, StockStatus } from '../types';
import { fileToDataUrl } from './imageHelper';

export interface ProductInputPayload {
  id?: string;
  title: string;
  slug: string;
  sku: string;
  description: string;
  short_description?: string;
  price: number;
  regular_price?: number;
  sale_price?: number;
  size?: string;
  available_sizes?: string[];
  size_pricing?: Record<string, { price: number; regular_price?: number }>;
  stock_quantity: number;
  stock_status: StockStatus;
  category: string;
  tags?: string[];
  images?: string[];
  rating?: number;
  reviews_count?: number;
  is_featured?: boolean;
  is_active?: boolean;
}

export interface StorageUploadResult {
  path: string;
  publicUrl: string;
  error?: string;
}

/**
 * Admin Product Management Functions
 */
export class SupabaseAdminService {
  private client: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.client = supabaseClient;
  }

  /**
   * Create a new product in the public.products table
   */
  async createProduct(payload: ProductInputPayload): Promise<{ data: Product | null; error: Error | null }> {
    try {
      const slug = payload.slug || payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const sku = payload.sku || `HPZ-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data, error } = await this.client
        .from('products')
        .insert({
          title: payload.title,
          slug,
          sku,
          description: payload.description,
          short_description: payload.short_description || '',
          price: payload.price,
          regular_price: payload.regular_price || null,
          sale_price: payload.sale_price || null,
          size: payload.size || '100g',
          available_sizes: payload.available_sizes || ['100g', '250g', '500g'],
          size_pricing: payload.size_pricing || {
            '100g': { price: payload.price, regular_price: payload.regular_price || payload.price },
            '250g': { price: Math.round(payload.price * 2.25), regular_price: Math.round((payload.regular_price || payload.price) * 2.25) },
            '500g': { price: Math.round(payload.price * 4.2), regular_price: Math.round((payload.regular_price || payload.price) * 4.2) },
          },
          stock_quantity: payload.stock_quantity ?? 0,
          stock_status: payload.stock_status || (payload.stock_quantity > 0 ? 'in_stock' : 'out_of_stock'),
          category: payload.category || 'Pure Spice Powders',
          tags: payload.tags || ['Pure Spices'],
          images: payload.images || [],
          rating: payload.rating || 5.0,
          reviews_count: payload.reviews_count || 0,
          is_featured: Boolean(payload.is_featured),
          is_active: payload.is_active !== undefined ? payload.is_active : true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as Product, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, payload: Partial<ProductInputPayload>): Promise<{ data: Product | null; error: Error | null }> {
    try {
      const updateData: Record<string, any> = {
        ...payload,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined keys
      Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

      // Auto update stock status if quantity changed
      if (typeof payload.stock_quantity === 'number' && !payload.stock_status) {
        if (payload.stock_quantity <= 0) {
          updateData.stock_status = 'out_of_stock';
        } else if (payload.stock_quantity < 10) {
          updateData.stock_status = 'low_stock';
        } else {
          updateData.stock_status = 'in_stock';
        }
      }

      const { data, error } = await this.client
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as Product, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  /**
   * Delete a product by ID
   */
  async deleteProduct(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await this.client
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err };
    }
  }

  /**
   * Supabase Storage: Upload product image to 'product-images' bucket with instant compressed data URL fallback
   */
  async uploadProductImage(
    file: File | Blob,
    fileNamePrefix: string = 'spice'
  ): Promise<StorageUploadResult> {
    // Generate an optimized client-side compressed data URL first to guarantee immediate display & persistence
    let fallbackDataUrl = '';
    try {
      fallbackDataUrl = await fileToDataUrl(file, 1200, 1200, 0.85);
    } catch {
      // ignore
    }

    try {
      const bucketName = 'product-images';
      const fileExt = file.type ? file.type.split('/')[1] || 'jpg' : 'jpg';
      const cleanPrefix = (fileNamePrefix || 'spice').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filePath = `products/${cleanPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { data, error } = await this.client.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (!error && data?.path) {
        const { data: publicUrlData } = this.client.storage
          .from(bucketName)
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return {
            path: data.path,
            publicUrl: publicUrlData.publicUrl,
          };
        }
      }

      // If bucket is missing or RLS blocked, return the high-quality compressed Data URL
      if (fallbackDataUrl) {
        return {
          path: 'inline-compressed',
          publicUrl: fallbackDataUrl,
        };
      }

      throw error || new Error('Image storage upload failed');
    } catch (err: any) {
      if (fallbackDataUrl) {
        return {
          path: 'inline-compressed',
          publicUrl: fallbackDataUrl,
        };
      }
      return {
        path: '',
        publicUrl: '',
        error: err?.message || 'Image upload failed',
      };
    }
  }

  /**
   * Delete image from storage
   */
  async deleteProductImage(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const bucketName = 'product-images';
      const { error } = await this.client.storage.from(bucketName).remove([path]);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
