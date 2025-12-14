// src/database/users.ts
import { databaseService } from './db';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  phone?: string;
  created_at: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  message?: string;
}

class UsersService {
  
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const db = await databaseService.getConnection();
      
      const result = await db.query(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password]
      );

      if (result.values && result.values.length > 0) {
        const user = result.values[0] as User;
        
        // Remove password from returned user object for security
        const { password: _, ...userWithoutPassword } = user;
        
        return {
          success: true,
          user: user,
          message: 'Login successful'
        };
      } else {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login'
      };
    }
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name: string, phone?: string): Promise<LoginResult> {
    try {
      const db = await databaseService.getConnection();
      
      // Check if user already exists
      const existingUser = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (existingUser.values && existingUser.values.length > 0) {
        return {
          success: false,
          message: 'Email already registered'
        };
      }

      // Insert new user
      const result = await db.run(
        'INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)',
        [email, password, name, phone || null]
      );

      if (result.changes && result.changes.lastId) {
        // Get the newly created user
        const newUser = await db.query(
          'SELECT * FROM users WHERE id = ?',
          [result.changes.lastId]
        );

        return {
          success: true,
          user: newUser.values![0] as User,
          message: 'Registration successful'
        };
      } else {
        return {
          success: false,
          message: 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'An error occurred during registration'
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User | null> {
    try {
      const db = await databaseService.getConnection();
      
      const result = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (result.values && result.values.length > 0) {
        return result.values[0] as User;
      }
      return null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: number, name: string, phone?: string): Promise<boolean> {
    try {
      const db = await databaseService.getConnection();
      
      await db.run(
        'UPDATE users SET name = ?, phone = ? WHERE id = ?',
        [name, phone || null, userId]
      );

      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      const db = await databaseService.getConnection();
      
      // Verify old password
      const result = await db.query(
        'SELECT * FROM users WHERE id = ? AND password = ?',
        [userId, oldPassword]
      );

      if (!result.values || result.values.length === 0) {
        return false;
      }

      // Update password
      await db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [newPassword, userId]
      );

      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  }
}

export const usersService = new UsersService();
export default usersService;