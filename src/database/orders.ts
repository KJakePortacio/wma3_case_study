// src/database/orders.ts
import { databaseService } from './db';

export interface Order {
  id: number;
  user_id: number;
  total: number;
  status: string;
  shipping_address: string;
  payment_proof: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  selected_color?: string;
  selected_size?: string;
  image_url?: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

class OrdersService {
  
  /**
   * Create new order from cart
   */
  async createOrder(
    userId: number,
    shippingAddress: string,
    paymentProof?: string
  ): Promise<number | null> {
    try {
      const db = await databaseService.getConnection();
      
      // Get cart items with product details
      const cartItems = await db.query(
        `SELECT 
          cart.id,
          cart.product_id,
          cart.quantity,
          cart.selected_color,
          cart.selected_size,
          products.name,
          products.price,
          products.image_url
         FROM cart
         JOIN products ON cart.product_id = products.id
         WHERE cart.user_id = ?`,
        [userId]
      );

      if (!cartItems.values || cartItems.values.length === 0) {
        return null;
      }

      // Calculate total
      const total = cartItems.values.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Create order
      const orderResult = await db.run(
        `INSERT INTO orders (user_id, total, status, shipping_address, payment_proof)
         VALUES (?, ?, 'processing', ?, ?)`,
        [userId, total, shippingAddress, paymentProof || '']
      );

      const orderId = orderResult.changes?.lastId;
      
      if (!orderId) {
        throw new Error('Failed to create order');
      }

      // Create order items
      for (const item of cartItems.values) {
        await db.run(
          `INSERT INTO order_items 
           (order_id, product_id, quantity, price, selected_color, selected_size)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id,
            item.quantity,
            item.price,
            item.selected_color || null,
            item.selected_size || null
          ]
        );
      }

      // Clear cart
      await db.run('DELETE FROM cart WHERE user_id = ?', [userId]);

      // Create a notification for the user about the new order
      try {
        await db.run(
          `INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)`,
          [
            userId,
            'Order Received',
            `Your order #${orderId} was received and is now processing.`,
            'order'
          ]
        );
      } catch (nerr) {
        console.error('Failed to create order notification:', nerr);
      }

      return orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  /**
   * Get all orders for a user
   */
  async getUserOrders(userId: number): Promise<OrderWithItems[]> {
    try {
      const db = await databaseService.getConnection();
      
      // Get orders
      const ordersResult = await db.query(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      if (!ordersResult.values || ordersResult.values.length === 0) {
        return [];
      }

      const orders: OrderWithItems[] = [];

      // Get items for each order
      for (const order of ordersResult.values) {
        const itemsResult = await db.query(
          `SELECT 
            order_items.*,
            products.name as product_name,
            products.image_url
           FROM order_items
           JOIN products ON order_items.product_id = products.id
           WHERE order_items.order_id = ?`,
          [order.id]
        );

        orders.push({
          ...order,
          items: itemsResult.values as OrderItem[] || []
        });
      }

      return orders;
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  }

  /**
   * Get single order with items
   */
  async getOrderById(orderId: number, userId: number): Promise<OrderWithItems | null> {
    try {
      const db = await databaseService.getConnection();
      
      // Get order
      const orderResult = await db.query(
        'SELECT * FROM orders WHERE id = ? AND user_id = ?',
        [orderId, userId]
      );

      if (!orderResult.values || orderResult.values.length === 0) {
        return null;
      }

      const order = orderResult.values[0];

      // Get order items
      const itemsResult = await db.query(
        `SELECT 
          order_items.*,
          products.name as product_name,
          products.image_url
         FROM order_items
         JOIN products ON order_items.product_id = products.id
         WHERE order_items.order_id = ?`,
        [orderId]
      );

      return {
        ...order,
        items: itemsResult.values as OrderItem[] || []
      };
    } catch (error) {
      console.error('Error getting order by ID:', error);
      return null;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: number, status: string): Promise<boolean> {
    try {
      const db = await databaseService.getConnection();
      
      await db.run(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, orderId]
      );

      // Insert notification about status change
      try {
        // Get order to find user_id
        const orderRes = await db.query('SELECT user_id FROM orders WHERE id = ?', [orderId]);
        const userId = orderRes.values && orderRes.values[0] ? orderRes.values[0].user_id : null;
        if (userId) {
          await db.run(
            `INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)`,
            [
              userId,
              'Order Status Updated',
              `Your order #${orderId} status is now: ${status}`,
              'order-status'
            ]
          );
        }
      } catch (nerr) {
        console.error('Failed to create order status notification:', nerr);
      }

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: number, userId: number): Promise<boolean> {
    try {
      const db = await databaseService.getConnection();
      
      // Check if order exists and belongs to user
      const orderResult = await db.query(
        'SELECT * FROM orders WHERE id = ? AND user_id = ?',
        [orderId, userId]
      );

      if (!orderResult.values || orderResult.values.length === 0) {
        return false;
      }

      const order = orderResult.values[0];

      // Only allow cancellation if order is still processing
      if (order.status !== 'processing') {
        return false;
      }

      await db.run(
        'UPDATE orders SET status = ? WHERE id = ?',
        ['cancelled', orderId]
      );

      // Notify user about cancellation
      try {
        await db.run(
          `INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)`,
          [
            userId,
            'Order Cancelled',
            `Your order #${orderId} has been cancelled. If this is a mistake contact support.`,
            'order-status'
          ]
        );
      } catch (nerr) {
        console.error('Failed to create cancellation notification:', nerr);
      }

      return true;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(userId: number): Promise<{
    total: number;
    processing: number;
    completed: number;
    cancelled: number;
  }> {
    try {
      const db = await databaseService.getConnection();
      
      const result = await db.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
         FROM orders
         WHERE user_id = ?`,
        [userId]
      );

      if (result.values && result.values.length > 0) {
        return result.values[0];
      }

      return { total: 0, processing: 0, completed: 0, cancelled: 0 };
    } catch (error) {
      console.error('Error getting order stats:', error);
      return { total: 0, processing: 0, completed: 0, cancelled: 0 };
    }
  }
}

export const ordersService = new OrdersService();
export default ordersService;