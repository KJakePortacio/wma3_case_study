// src/database/db.ts
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private dbName = 'furnitune.db';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initializeDatabase(): Promise<void> {
    try {
      const platform = Capacitor.getPlatform();
      
      // Create connection
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false,
        'no-encryption',
        1,
        false
      );

      // Open database
      await this.db.open();

      // Create tables
      await this.createTables();

      // Seed initial data
      await this.seedData();

      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const queries = `
      -- Users Table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Products Table
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        stock INTEGER DEFAULT 0,
        rating_avg REAL DEFAULT 0,
        reviews_count INTEGER DEFAULT 0,
        colors TEXT,
        sizes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Cart Table
      CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        selected_color TEXT,
        selected_size TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      -- Wishlists Table
      CREATE TABLE IF NOT EXISTS wishlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(user_id, product_id)
      );

      -- Orders Table
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'processing',
        shipping_address TEXT,
        payment_proof TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Order Items Table
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        selected_color TEXT,
        selected_size TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      -- Notifications Table
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        type TEXT DEFAULT 'general',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Reviews Table
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        order_id INTEGER,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
      CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlists(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    `;

    await this.db!.execute(queries);

      // Add profile_image column if it doesn't exist (safe to run repeatedly)
      try {
        await this.db!.run(`ALTER TABLE users ADD COLUMN profile_image TEXT`);
      } catch (e) {
        // ignore errors (most likely column already exists)
      }
  }

   private async seedData(): Promise<void> {
    // Check if data already exists
    const checkUsers = await this.db!.query('SELECT COUNT(*) as count FROM users');
    if (checkUsers.values![0].count > 0) {
      console.log('📊 Data already seeded');
      return;
    }

    console.log('🌱 Seeding initial data...');

    // Insert Users
    await this.db!.run(
      `INSERT INTO users (email, password, name, phone) VALUES 
        ('jake@gmail.com', '12345', 'Jake Portacio', '09123456789'),
        ('enrico@gmail.com', '12345', 'Enrico Valencia', '09987654321')`
    );

    // Set default profile images for seeded users (assets under src/Assets/profile)
    await this.db!.run(
      `UPDATE users SET profile_image = ? WHERE email = ?`,
      ['../Assets/profile/jake.png', 'jake@gmail.com']
    );
    await this.db!.run(
      `UPDATE users SET profile_image = ? WHERE email = ?`,
      ['../Assets/profile/enrico.jpg', 'enrico@gmail.com']
    );

    // Insert Products (one entry per image in src/Assets)
    await this.db!.run(
      `INSERT INTO products (name, description, price, category, image_url, stock, rating_avg, reviews_count, colors, sizes) VALUES
        ('Classic Sofa', 'Elegant 3-seater sofa with timeless design', 14999, 'Sofas', '../Assets/sofa/ClassicSofa.jpg', 8, 4.4, 10, 'Gray,Beige,Navy', '2-Seater,3-Seater'),
        ('Harbor Sofa', 'Comfortable sofa with deep cushions', 16999, 'Sofas', '../Assets/sofa/HarborSofa.jpg', 6, 4.6, 11, 'Navy,Beige', '3-Seater'),
        ('Nova Sofa', 'Modern sofa with clean lines', 15999, 'Sofas', '../Assets/sofa/NovaSofa.jpg', 10, 4.5, 12, 'Gray,Beige,Navy', '2-Seater,3-Seater'),
        ('Terra Sofa', 'Earth-tone sofa with plush fabric', 17500, 'Sofas', '../Assets/sofa/TerraSofa.jpg', 5, 4.7, 9, 'Brown,Beige', '3-Seater'),
        ('Atlas Chair', 'Sturdy dining chair with cushioned seat', 3200, 'Chairs', '../Assets/chairs/AtlasChair.jpg', 30, 4.5, 7, 'Brown,White,Black', 'Standard'),
        ('Bloom Chair', 'Curved accent chair with soft fabric', 3800, 'Chairs', '../Assets/chairs/BloomChair.jpg', 18, 4.6, 8, 'Green,Gray', 'Standard'),
        ('Cinder Chair', 'Minimalist chair with wooden legs', 2999, 'Chairs', '../Assets/chairs/CinderChair.jpg', 22, 4.3, 5, 'Black,Gray', 'Standard'),
        ('Dune Chair', 'Cozy armchair for reading nooks', 4200, 'Chairs', '../Assets/chairs/DuneChair.jpg', 12, 4.6, 6, 'Beige,Brown', 'Standard'),
        ('Aria Bed', 'Platform bed with upholstered headboard', 24000, 'Beds', '../Assets/bed/AriaBed.jpg', 4, 4.8, 14, 'Walnut,Oak,White', 'Queen,King'),
        ('Boreal Bed', 'Solid frame bed with slatted base', 23000, 'Beds', '../Assets/bed/BorealBed.jpg', 3, 4.7, 10, 'Oak,Gray', 'Queen,King'),
        ('Cedar Bed', 'Rustic bed frame crafted from cedar', 25500, 'Beds', '../Assets/bed/CedarBed.jpg', 2, 4.8, 9, 'Cedar,White', 'Queen,King'),
        ('Delta Bed', 'Contemporary bed with storage options', 26000, 'Beds', '../Assets/bed/DeltaBed.jpg', 5, 4.6, 11, 'Walnut,Gray', 'Queen,King'),
        ('Aurora Sectional', 'Spacious L-shaped sectional', 32000, 'Sectionals', '../Assets/sectional/AuroraSectional.jpg', 3, 4.9, 20, 'Charcoal,Beige,Navy', 'Left,Right'),
        ('Beacon Sectional', 'Comfortable sectional with chaise', 30500, 'Sectionals', '../Assets/sectional/BeaconSectional.jpg', 2, 4.8, 12, 'Gray,Blue', 'Left,Right'),
        ('Cascade Sectional', 'Modular sectional for flexible layouts', 33500, 'Sectionals', '../Assets/sectional/CascadeSectional.jpg', 2, 4.9, 15, 'Beige,Charcoal', 'Modular'),
        ('Drift Sectional', 'Casual sectional with soft cushions', 29800, 'Sectionals', '../Assets/sectional/DriftSectional.jpg', 4, 4.7, 9, 'Navy,Gray', 'Left,Right'),
        ('Halo Ottoman', 'Tufted storage ottoman', 4599, 'Ottomans', '../Assets/ottoman/HaloOttoman.jpg', 20, 4.2, 5, 'Gray,Cream,Blue', 'Small,Large'),
        ('Nest Ottoman', 'Compact ottoman for extra seating', 3999, 'Ottomans', '../Assets/ottoman/NestOttoman.jpg', 25, 4.3, 6, 'Beige,Gray', 'Small,Large'),
        ('Pearl Ottoman', 'Round ottoman with elegant finish', 5299, 'Ottomans', '../Assets/ottoman/PearlOttoman.jpg', 15, 4.4, 4, 'Cream,White', 'Small,Large'),
        ('Pique Ottoman', 'Stylish ottoman with storage', 4899, 'Ottomans', '../Assets/ottoman/PiqueOttoman.jpg', 18, 4.1, 3, 'Gray,Blue', 'Small,Large'),
        ('Brio Dining Table', 'Sleek dining table for family meals', 20000, 'Tables', '../Assets/table/BrioDiningTable.png', 6, 4.7, 11, 'Oak,Walnut', '4-Seater,6-Seater'),
        ('Cove Dining Table', 'Round dining table with pedestal base', 21000, 'Tables', '../Assets/table/CoveDiningTable.jpg', 5, 4.6, 8, 'White,Oak', '4-Seater,6-Seater'),
        ('Dawn Dining Table', 'Contemporary table with durable finish', 18500, 'Tables', '../Assets/table/DawnDiningTable.jpg', 7, 4.5, 7, 'Oak,White', '4-Seater')`
    );

    // Insert Sample Notifications for User 1 (Jake)
    await this.db!.run(
      `INSERT INTO notifications (user_id, title, body, type) VALUES 
        (1, 'Welcome to Furnitune! 🎉', 'Thank you for joining us. Browse our collection!', 'welcome'),
        (1, 'New Collection Available', 'Check out our latest modern furniture collection', 'promotion'),
        (1, 'Flash Sale Alert! ⚡', 'Up to 30% off on selected items. Limited time only!', 'sale')`
    );

    // Insert Sample Notifications for User 2 (Enrico)
    await this.db!.run(
      `INSERT INTO notifications (user_id, title, body, type) VALUES 
        (2, 'Welcome to Furnitune! 🎉', 'Thank you for joining us. Browse our collection!', 'welcome'),
        (2, 'Mid-Year Sale', 'Save up to 15% on all furniture. Shop now!', 'sale')`
    );

    // Insert Sample Reviews
    await this.db!.run(
      `INSERT INTO reviews (user_id, product_id, rating, message) VALUES 
        (1, 1, 5, 'Excellent quality sofa! Very comfortable and looks great in my living room.'),
        (2, 3, 5, 'Sturdy bed frame, easy to assemble. Highly recommend!'),
        (1, 7, 4, 'Great sectional sofa, but delivery took longer than expected.')`
    );

    console.log('✅ Data seeded successfully');
  }

  async getConnection(): Promise<SQLiteDBConnection> {
    if (!this.db) {
      await this.initializeDatabase();
    }
    return this.db!;
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;