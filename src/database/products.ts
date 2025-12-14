// src/database/products.ts
import { databaseService } from './db';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock: number;
  rating_avg: number;
  reviews_count: number;
  colors?: string;
  sizes?: string;
  created_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: number;
}

class ProductsService {
  
  /**
   * Get all products
   */
  async getAllProducts(): Promise<Product[]> {
    try {
      const db = await databaseService.getConnection();
      const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');
      
      return result.values as Product[] || [];
    } catch (error) {
      console.error('Error getting all products:', error);
      return [];
    }
  }

  /**
   * Get product by ID with images
   */
  async getProductById(productId: number): Promise<Product | null> {
    try {
      const db = await databaseService.getConnection();
      const result = await db.query(
        'SELECT * FROM products WHERE id = ?',
        [productId]
      );

      if (result.values && result.values.length > 0) {
        return result.values[0] as Product;
      }
      return null;
    } catch (error) {
      console.error('Error getting product by ID:', error);
      return null;
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const db = await databaseService.getConnection();
      const result = await db.query(
        'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC',
        [category]
      );
      
      return result.values as Product[] || [];
    } catch (error) {
      console.error('Error getting products by category:', error);
      return [];
    }
  }

  /**
   * Search products
   */
  async searchProducts(searchTerm: string): Promise<Product[]> {
    try {
      const db = await databaseService.getConnection();
      const result = await db.query(
        `SELECT * FROM products 
         WHERE name LIKE ? OR description LIKE ? 
         ORDER BY created_at DESC`,
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );
      
      return result.values as Product[] || [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  /**
   * Get product colors (parse from JSON string)
   */
  getProductColors(product: Product): string[] {
    if (!product.colors) return [];
    return product.colors.split(',').map(c => c.trim());
  }

  /**
   * Get product sizes (parse from JSON string)
   */
  getProductSizes(product: Product): string[] {
    if (!product.sizes) return [];
    return product.sizes.split(',').map(s => s.trim());
  }

  /**
   * Update product rating after review
   */
  async updateProductRating(productId: number): Promise<void> {
    try {
      const db = await databaseService.getConnection();
      
      // Calculate average rating
      const result = await db.query(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as count 
         FROM reviews WHERE product_id = ?`,
        [productId]
      );

      if (result.values && result.values.length > 0) {
        const avgRating = result.values[0].avg_rating || 0;
        const reviewCount = result.values[0].count || 0;

        await db.run(
          'UPDATE products SET rating_avg = ?, reviews_count = ? WHERE id = ?',
          [avgRating, reviewCount, productId]
        );
      }
    } catch (error) {
      console.error('Error updating product rating:', error);
    }
  }
}

export const productsService = new ProductsService();
export default productsService;