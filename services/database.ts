import { Customer, Product, Sale, SaleItem } from "@/types";
import * as SQLite from "expo-sqlite";

const DB_NAME = "tantanlay.db";

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
      `);

      await this.createTables();
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync(`
      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock_qty INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Customers table
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Sales table
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT,
        customer_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_contact TEXT,
        customer_address TEXT,
        subtotal REAL NOT NULL,
        total REAL NOT NULL,
        date DATETIME NOT NULL,
        order_date DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      );

      -- Sale items table
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        line_total REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE
      );

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);
      CREATE INDEX IF NOT EXISTS idx_sales_date ON sales (date);
      CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items (sale_id);
      CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items (product_id);

      -- Triggers to update timestamps
      CREATE TRIGGER IF NOT EXISTS update_products_timestamp 
        AFTER UPDATE ON products
        BEGIN
          UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

      CREATE TRIGGER IF NOT EXISTS update_customers_timestamp 
        AFTER UPDATE ON customers
        BEGIN
          UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
    `);

    // Migration: Add order_date column if it doesn't exist
    await this.migrateOrderDateColumn();
    
    // Migration: Add invoice_number column if it doesn't exist
    await this.migrateInvoiceNumberColumn();
  }

  private async migrateOrderDateColumn(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      // Check if order_date column exists
      const tableInfo = await this.db.getAllAsync('PRAGMA table_info(sales)');
      const orderDateExists = tableInfo.some((column: any) => column.name === 'order_date');

      if (!orderDateExists) {
        console.log("Adding order_date column to sales table");
        await this.db.execAsync(`
          ALTER TABLE sales ADD COLUMN order_date DATETIME;
          UPDATE sales SET order_date = date WHERE order_date IS NULL;
        `);
        console.log("order_date column added successfully");
      }
    } catch (error) {
      console.error("Failed to migrate order_date column:", error);
    }
  }

  private async migrateInvoiceNumberColumn(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      // Check if invoice_number column exists
      const columns = await this.db.getAllAsync(`
        PRAGMA table_info(sales);
      `);
      
      const hasInvoiceNumber = columns.some((col: any) => col.name === 'invoice_number');
      
      if (!hasInvoiceNumber) {
        await this.db.execAsync(`
          ALTER TABLE sales ADD COLUMN invoice_number TEXT;
        `);
        console.log("Added invoice_number column to sales table");
      }
    } catch (error) {
      console.error("Failed to migrate invoice_number column:", error);
    }
  }

  private async generateInvoiceNumber(orderDate: string): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      // Extract date and format as YYMMDD
      const date = new Date(orderDate);
      const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const datePrefix = `${year}${month}${day}`;
      
      // Find the highest invoice number for this date
      const result = await this.db.getFirstAsync(`
        SELECT invoice_number 
        FROM sales 
        WHERE DATE(order_date) = ? 
          AND invoice_number IS NOT NULL
          AND invoice_number LIKE ?
        ORDER BY CAST(SUBSTR(invoice_number, 7) AS INTEGER) DESC
        LIMIT 1
      `, [date.toISOString().split('T')[0], `${datePrefix}%`]);

      let nextNumber = 1;
      
      if (result && (result as any).invoice_number) {
        // Extract number from invoice format: 250910001
        const invoiceNumber = (result as any).invoice_number;
        const numberPart = invoiceNumber.substring(6); // Get everything after YYMMDD
        if (numberPart) {
          const currentNumber = parseInt(numberPart, 10);
          if (!isNaN(currentNumber)) {
            nextNumber = currentNumber + 1;
          }
        }
      }

      // Format: YYMMDD001
      const paddedNumber = nextNumber.toString().padStart(3, '0');
      
      return `${datePrefix}${paddedNumber}`;
    } catch (error) {
      console.error("Failed to generate invoice number:", error);
      throw error;
    }
  }

  // Product operations
  async saveProduct(product: Omit<Product, "id">): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.runAsync(
      "INSERT INTO products (name, price, stock_qty) VALUES (?, ?, ?)",
      [product.name, product.price, product.stockQty]
    );
    
    return result.lastInsertRowId;
  }

  async getProducts(): Promise<(Product & { id: number })[]> {
    if (!this.db) throw new Error("Database not initialized");

    const rows = await this.db.getAllAsync(
      "SELECT id, name, price, stock_qty as stockQty FROM products ORDER BY name"
    );

    // Filter out any rows with null or invalid ids
    return rows.filter(
      (row: any) => row.id != null && typeof row.id === "number"
    ) as (Product & { id: number })[];
  }

  async searchProducts(searchTerm: string): Promise<(Product & { id: number })[]> {
    if (!this.db) throw new Error("Database not initialized");
    
    if (!searchTerm.trim()) {
      return this.getProducts();
    }

    const rows = await this.db.getAllAsync(
      "SELECT id, name, price, stock_qty as stockQty FROM products WHERE name LIKE ? ORDER BY name",
      [`%${searchTerm.trim()}%`]
    );

    return rows.filter(
      (row: any) => row.id != null && typeof row.id === "number"
    ) as (Product & { id: number })[];
  }

  async getProductById(
    productId: number
  ): Promise<(Product & { id: number }) | null> {
    if (!this.db) throw new Error("Database not initialized");

    const row = await this.db.getFirstAsync(
      "SELECT id, name, price, stock_qty as stockQty FROM products WHERE id = ?",
      [productId]
    );

    return row as (Product & { id: number }) | null;
  }

  async updateProduct(product: Product & { id: number }): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      "UPDATE products SET name = ?, price = ?, stock_qty = ? WHERE id = ?",
      [product.name, product.price, product.stockQty, product.id]
    );
  }

  async deleteProduct(productId: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync("DELETE FROM products WHERE id = ?", [productId]);
  }

  // Customer operations
  async saveCustomer(customer: Customer): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.runAsync(
      "INSERT INTO customers (name, contact, address) VALUES (?, ?, ?)",
      [customer.name, customer.contact || null, customer.address || null]
    );

    return result.lastInsertRowId;
  }

  async findOrCreateCustomer(customer: Customer): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    // Try to find existing customer by name and contact
    const existingCustomer = await this.db.getFirstAsync(
      "SELECT id FROM customers WHERE name = ? AND contact = ?",
      [customer.name, customer.contact || ""]
    );

    if (existingCustomer) {
      return (existingCustomer as { id: number }).id;
    }

    // Create new customer
    return await this.saveCustomer(customer);
  }

  async getCustomers(): Promise<(Customer & { id: number })[]> {
    if (!this.db) throw new Error("Database not initialized");

    const rows = await this.db.getAllAsync(
      "SELECT id, name, contact, address FROM customers ORDER BY name"
    );

    return rows as (Customer & { id: number })[];
  }

  async updateCustomer(customer: Customer & { id: number }): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      "UPDATE customers SET name = ?, contact = ?, address = ? WHERE id = ?",
      [customer.name, customer.contact || null, customer.address || null, customer.id]
    );
  }

  async deleteCustomer(customerId: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync("DELETE FROM customers WHERE id = ?", [customerId]);
  }

  // Sale operations
  async saveSale(sale: Omit<Sale, "id">): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      // Start transaction
      await this.db.execAsync("BEGIN TRANSACTION");

      // Find or create customer
      const customerId = await this.findOrCreateCustomer(sale.customer);
      
      // Generate invoice number based on order date
      const invoiceNumber = await this.generateInvoiceNumber(sale.orderDate);

      // Insert sale
      const saleResult = await this.db.runAsync(
        `
        INSERT INTO sales (customer_id, customer_name, customer_contact, customer_address, subtotal, total, date, order_date, invoice_number) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          customerId,
          sale.customer.name,
          sale.customer.contact || null,
          sale.customer.address || null,
          sale.subtotal,
          sale.total,
          sale.date,
          sale.orderDate,
          invoiceNumber,
        ]
      );

      const saleId = saleResult.lastInsertRowId;

      // Insert sale items
      for (const item of sale.items) {
        await this.db.runAsync(
          `
          INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, line_total) 
          VALUES (?, ?, ?, ?, ?, ?)
        `,
          [
            saleId,
            item.productId,
            item.productName,
            item.quantity,
            item.unitPrice,
            item.lineTotal,
          ]
        );

        // Update product stock for existing products (not custom products)
        if (typeof item.productId === "number") {
          await this.db.runAsync(
            "UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?",
            [item.quantity, item.productId]
          );
        }
      }

      // Commit transaction
      await this.db.execAsync("COMMIT");
      return saleId;
    } catch (error) {
      // Rollback transaction on error
      await this.db.execAsync("ROLLBACK");
      throw error;
    }
  }

  async getSales(): Promise<(Sale & { id: number })[]> {
    if (!this.db) throw new Error("Database not initialized");

    const salesRows = await this.db.getAllAsync(`
      SELECT id, invoice_number, customer_name, customer_contact, customer_address, subtotal, total, date, order_date 
      FROM sales 
      ORDER BY date DESC
    `);

    // Filter out any rows with null or invalid ids
    const validSalesRows = salesRows.filter(
      (row: any) => row.id != null && typeof row.id === "number"
    );

    const sales: (Sale & { id: number })[] = [];

    for (const saleRow of validSalesRows) {
      const sale = saleRow as {
        id: number;
        invoice_number: string | null;
        customer_name: string;
        customer_contact: string | null;
        customer_address: string | null;
        subtotal: number;
        total: number;
        date: string;
        order_date: string;
      };

      // Get sale items
      const itemsRows = await this.db.getAllAsync(
        `
        SELECT product_id, product_name, quantity, unit_price, line_total 
        FROM sale_items 
        WHERE sale_id = ?
        ORDER BY id
      `,
        [sale.id]
      );

      const items: SaleItem[] = itemsRows.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        lineTotal: item.line_total,
      }));

      sales.push({
        id: sale.id,
        invoiceNumber: sale.invoice_number || undefined,
        date: sale.date,
        orderDate: sale.order_date,
        customer: {
          name: sale.customer_name,
          contact: sale.customer_contact || "",
          address: sale.customer_address || "",
        },
        items,
        subtotal: sale.subtotal,
        total: sale.total,
      });
    }

    return sales;
  }

  async getSaleById(saleId: number): Promise<(Sale & { id: number }) | null> {
    if (!this.db) throw new Error("Database not initialized");

    const saleRow = await this.db.getFirstAsync(
      `
      SELECT id, invoice_number, customer_name, customer_contact, customer_address, subtotal, total, date, order_date 
      FROM sales 
      WHERE id = ?
    `,
      [saleId]
    );

    if (!saleRow) return null;

    const sale = saleRow as {
        id: number;
        invoice_number: string | null;
        customer_name: string;
        customer_contact: string | null;
        customer_address: string | null;
        subtotal: number;
        total: number;
        date: string;
        order_date: string;
      };

    // Get sale items
    const itemsRows = await this.db.getAllAsync(
      `
      SELECT product_id, product_name, quantity, unit_price, line_total 
      FROM sale_items 
      WHERE sale_id = ?
      ORDER BY id
    `,
      [saleId]
    );

    const items: SaleItem[] = itemsRows.map((item: any) => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total,
    }));

    return {
      id: sale.id,
      invoiceNumber: sale.invoice_number || undefined,
      date: sale.date,
      orderDate: sale.order_date,
      customer: {
        name: sale.customer_name,
        contact: sale.customer_contact || "",
        address: sale.customer_address || "",
      },
      items,
      subtotal: sale.subtotal,
      total: sale.total,
    };
  }

  async updateSale(sale: Sale & { id: number }): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      // Start transaction
      await this.db.execAsync("BEGIN TRANSACTION");

      // Get original sale items to restore stock quantities
      const originalItemsRows = await this.db.getAllAsync(
        "SELECT product_id, quantity FROM sale_items WHERE sale_id = ?",
        [sale.id]
      );

      // Restore stock quantities for original items
      for (const originalItem of originalItemsRows) {
        const originalItemData = originalItem as { product_id: number | string; quantity: number };
        if (typeof originalItemData.product_id === "number") {
          await this.db.runAsync(
            "UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?",
            [originalItemData.quantity, originalItemData.product_id]
          );
        }
      }

      // Find or create customer
      const customerId = await this.findOrCreateCustomer(sale.customer);

      // Update sale
      await this.db.runAsync(
        `
        UPDATE sales 
        SET customer_id = ?, customer_name = ?, customer_contact = ?, customer_address = ?, 
            subtotal = ?, total = ?
        WHERE id = ?
      `,
        [
          customerId,
          sale.customer.name,
          sale.customer.contact || null,
          sale.customer.address || null,
          sale.subtotal,
          sale.total,
          sale.id,
        ]
      );

      // Delete existing sale items
      await this.db.runAsync("DELETE FROM sale_items WHERE sale_id = ?", [sale.id]);

      // Insert new sale items
      for (const item of sale.items) {
        await this.db.runAsync(
          `
          INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, line_total) 
          VALUES (?, ?, ?, ?, ?, ?)
        `,
          [
            sale.id,
            item.productId,
            item.productName,
            item.quantity,
            item.unitPrice,
            item.lineTotal,
          ]
        );

        // Update product stock for existing products (not custom products)
        if (typeof item.productId === "number") {
          await this.db.runAsync(
            "UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?",
            [item.quantity, item.productId]
          );
        }
      }

      // Commit transaction
      await this.db.execAsync("COMMIT");
    } catch (error) {
      // Rollback transaction on error
      await this.db.execAsync("ROLLBACK");
      throw error;
    }
  }

  // Analytics and reporting methods
  async getSalesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<(Sale & { id: number })[]> {
    if (!this.db) throw new Error("Database not initialized");

    const salesRows = await this.db.getAllAsync(
      `
      SELECT id, invoice_number, customer_name, customer_contact, customer_address, subtotal, total, date, order_date 
      FROM sales 
      WHERE date >= ? AND date <= ?
      ORDER BY date DESC
    `,
      [startDate, endDate]
    );

    // Filter out any rows with null or invalid ids
    const validSalesRows = salesRows.filter(
      (row: any) => row.id != null && typeof row.id === "number"
    );

    const sales: (Sale & { id: number })[] = [];

    for (const saleRow of validSalesRows) {
      const sale = saleRow as {
        id: number;
        invoice_number: string | null;
        customer_name: string;
        customer_contact: string | null;
        customer_address: string | null;
        subtotal: number;
        total: number;
        date: string;
        order_date: string;
      };

      const itemsRows = await this.db.getAllAsync(
        `
        SELECT product_id, product_name, quantity, unit_price, line_total 
        FROM sale_items 
        WHERE sale_id = ?
      `,
        [sale.id]
      );

      const items: SaleItem[] = itemsRows.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        lineTotal: item.line_total,
      }));

      sales.push({
        id: sale.id,
        invoiceNumber: sale.invoice_number || undefined,
        date: sale.date,
        orderDate: sale.order_date,
        customer: {
          name: sale.customer_name,
          contact: sale.customer_contact || "",
          address: sale.customer_address || "",
        },
        items,
        subtotal: sale.subtotal,
        total: sale.total,
      });
    }

    return sales;
  }

  async getTotalSalesAmount(): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync(
      "SELECT SUM(total) as total FROM sales"
    );
    return (result as { total: number }).total || 0;
  }

  async getLowStockProducts(
    threshold: number = 5
  ): Promise<(Product & { id: number })[]> {
    if (!this.db) throw new Error("Database not initialized");

    const rows = await this.db.getAllAsync(
      "SELECT id, name, price, stock_qty as stockQty FROM products WHERE stock_qty <= ? ORDER BY stock_qty ASC",
      [threshold]
    );

    return rows as (Product & { id: number })[];
  }

  // Migration helper methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync(`
      DELETE FROM sale_items;
      DELETE FROM sales;
      DELETE FROM customers;
      DELETE FROM products;
    `);
  }

  // Method to recreate tables with correct schema
  async recreateTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync(`
      DROP TABLE IF EXISTS sale_items;
      DROP TABLE IF EXISTS sales;
      DROP TABLE IF EXISTS customers;
      DROP TABLE IF EXISTS products;
    `);

    await this.createTables();
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

// Export individual functions for backward compatibility
export const initializeDatabase = () => databaseService.initializeDatabase();

export const saveProduct = (product: Omit<Product, "id">) =>
  databaseService.saveProduct(product);
export const getProducts = () => databaseService.getProducts();
export const searchProducts = (searchTerm: string) => databaseService.searchProducts(searchTerm);
export const getProductById = (id: number) =>
  databaseService.getProductById(id);
export const updateProduct = (product: Product & { id: number }) =>
  databaseService.updateProduct(product);
export const deleteProduct = (id: number) => databaseService.deleteProduct(id);

export const saveSale = (sale: Omit<Sale, "id">) =>
  databaseService.saveSale(sale);
export const getSales = () => databaseService.getSales();
export const getSaleById = (id: number) => databaseService.getSaleById(id);
export const updateSale = (sale: Sale & { id: number }) =>
  databaseService.updateSale(sale);

export const getCustomers = () => databaseService.getCustomers();
export const saveCustomer = (customer: Customer) => databaseService.saveCustomer(customer);
export const updateCustomer = (customer: Customer & { id: number }) =>
  databaseService.updateCustomer(customer);
export const deleteCustomer = (id: number) => databaseService.deleteCustomer(id);

export const getSalesByDateRange = (start: string, end: string) =>
  databaseService.getSalesByDateRange(start, end);
export const getTotalSalesAmount = () => databaseService.getTotalSalesAmount();
export const getLowStockProducts = (threshold?: number) =>
  databaseService.getLowStockProducts(threshold);
