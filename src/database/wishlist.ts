// src/database/wishlist.ts
import { databaseService } from './db';
import productsService, { Product } from './products';

class WishlistService {
  async addToWishlist(userId: number, productId: number): Promise<boolean> {
    try {
      const db = await databaseService.getConnection();
      await db.run(
        `INSERT OR IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)`,
        [userId, productId]
      );
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return false;
    }
  }

  async removeFromWishlist(userId: number, productId: number): Promise<boolean> {
    try {
      const db = await databaseService.getConnection();
      await db.run(
        `DELETE FROM wishlists WHERE user_id = ? AND product_id = ?`,
        [userId, productId]
      );
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    }
  }

  async getWishlistProductIds(userId: number): Promise<number[]> {
    try {
      const db = await databaseService.getConnection();
      const res = await db.query(
        `SELECT product_id FROM wishlists WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
      if (res.values) return (res.values as any[]).map(r => r.product_id as number);
      return [];
    } catch (error) {
      console.error('Error fetching wishlist ids:', error);
      return [];
    }
  }

  async getWishlistProducts(userId: number): Promise<Product[]> {
    try {
      const db = await databaseService.getConnection();
      const res = await db.query(
        `SELECT p.* FROM products p
         INNER JOIN wishlists w ON p.id = w.product_id
         WHERE w.user_id = ?
         ORDER BY w.created_at DESC`,
        [userId]
      );
      return (res.values as Product[]) || [];
    } catch (error) {
      console.error('Error fetching wishlist products:', error);
      return [];
    }
  }

  async isInWishlist(userId: number, productId: number): Promise<boolean> {
    try {
      const db = await databaseService.getConnection();
      const res = await db.query(
        `SELECT COUNT(*) as count FROM wishlists WHERE user_id = ? AND product_id = ?`,
        [userId, productId]
      );
      return !!(res.values && res.values[0] && res.values[0].count > 0);
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return false;
    }
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;
