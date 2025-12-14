// src/database/reviews.ts
import { databaseService } from './db';
import productsService from './products';

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  order_id?: number;
  rating: number;
  message?: string;
  created_at: string;
  user_name?: string;
}

class ReviewsService {
  
  /**
   * Create a new review
   */
  async createReview(
    userId: number,
    productId: number,
    rating: number,
    message?: string,
    orderId?: number
  ): Promise<boolean> {
    try {
      const db = await databaseService.getConnection();
      
      // Check if user already reviewed this product
      const existingReview = await db.query(
        'SELECT * FROM reviews WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );

      if (existingReview.values && existingReview.values.length > 0) {
        // Update existing review
        await db.run(
          'UPDATE reviews SET rating = ?, message = ? WHERE user_id = ? AND product_id = ?',
          [rating, message || null, userId, productId]
        );
      } else {
        // Create new review
        await db.run(
          'INSERT INTO reviews (user_id, product_id, order_id, rating, message) VALUES (?, ?, ?, ?, ?)',
          [userId, productId, orderId || null, rating, message || null]
        );
      }

      // Update product rating
      await productsService.updateProductRating(productId);

      return true;
    } catch (error) {
      console.error('Error creating review:', error);
      return false;
    }
  }

  /**
   * Get reviews for a product
   */
  async getProductReviews(productId: number): Promise<Review[]> {
    try {
      const db = await databaseService.getConnection();
      
      const result = await db.query(
        `SELECT 
          reviews.*,
          users.name as user_name
         FROM reviews
         JOIN users ON reviews.user_id = users.id
         WHERE reviews.product_id = ?
         ORDER BY reviews.created_at DESC`,
        [productId]
      );

      return result.values as Review[] || [];
    } catch (error) {
      console.error('Error getting product reviews:', error);
      return [];
    }
  }

  /**
   * Get user's reviews
   */
  async getUserReviews(userId: number): Promise<Review[]> {
    try {
      const db = await databaseService.getConnection();
      
      const result = await db.query(
        `SELECT 
          reviews.*,
          products.name as product_name,
          products.image_url as product_image
         FROM reviews
         JOIN products ON reviews.product_id = products.id
         WHERE reviews.user_id = ?
         ORDER BY reviews.created_at DESC`,
        [userId]
      );

      return result.values as Review[] || [];
    } catch (error) {
      console.error('Error getting user reviews:', error);
      return [];
    }
  }

  /**
   * Check if user can review a product (must have ordered it)
   */
  async canUserReview(userId: number, productId: number): Promise<boolean> {
    try {
      const db = await databaseService.getConnection();
      
      // Check if user has ordered this product
      const result = await db.query(
        `SELECT order_items.id 
         FROM order_items
         JOIN orders ON order_items.order_id = orders.id
         WHERE orders.user_id = ? 
           AND order_items.product_id = ?
           AND orders.status = 'completed'`,
        [userId, productId]
      );

      return !!(result.values && result.values.length > 0);
    } catch (error) {
      console.error('Error checking review permission:', error);
      return false;
    }
  }

  /**
   * Get review by user and product
   */
  async getUserProductReview(userId: number, productId: number): Promise<Review | null> {
    try {
      const db = await databaseService.getConnection();
      
      const result = await db.query(
        'SELECT * FROM reviews WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );

      if (result.values && result.values.length > 0) {
        return result.values[0] as Review;
      }

      return null;
    } catch (error) {
      console.error('Error getting user product review:', error);
      return null;
    }
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId: number, userId: number): Promise<boolean> {
    try {
      const db = await databaseService.getConnection();
      
      // Get review to get product_id
      const reviewResult = await db.query(
        'SELECT product_id FROM reviews WHERE id = ? AND user_id = ?',
        [reviewId, userId]
      );

      if (!reviewResult.values || reviewResult.values.length === 0) {
        return false;
      }

      const productId = reviewResult.values[0].product_id;

      // Delete review
      await db.run(
        'DELETE FROM reviews WHERE id = ? AND user_id = ?',
        [reviewId, userId]
      );

      // Update product rating
      await productsService.updateProductRating(productId);

      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      return false;
    }
  }

  /**
   * Get rating distribution for a product
   */
  async getRatingDistribution(productId: number): Promise<{
    [key: number]: number;
  }> {
    try {
      const db = await databaseService.getConnection();
      
      const result = await db.query(
        `SELECT 
          rating,
          COUNT(*) as count
         FROM reviews
         WHERE product_id = ?
         GROUP BY rating`,
        [productId]
      );

      const distribution: { [key: number]: number } = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      };

      if (result.values) {
        result.values.forEach((row: any) => {
          distribution[row.rating] = row.count;
        });
      }

      return distribution;
    } catch (error) {
      console.error('Error getting rating distribution:', error);
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }
  }
}

export const reviewsService = new ReviewsService();
export default reviewsService;