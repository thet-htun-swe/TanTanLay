import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Sale } from '@/types';
import { databaseService } from './database';

const PRODUCTS_KEY = 'products';
const SALES_KEY = 'sales';
const MIGRATION_COMPLETED_KEY = 'migration_completed';

export class MigrationService {
  async isMigrationCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(MIGRATION_COMPLETED_KEY);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  async migrateFromAsyncStorage(): Promise<{ success: boolean; message: string; stats?: { products: number; sales: number } }> {
    try {
      // Check if migration already completed
      const migrationCompleted = await this.isMigrationCompleted();
      if (migrationCompleted) {
        return { success: true, message: 'Migration already completed' };
      }

      // Initialize database
      await databaseService.initializeDatabase();

      let migratedProducts = 0;
      let migratedSales = 0;

      // Migrate products
      try {
        const productsJson = await AsyncStorage.getItem(PRODUCTS_KEY);
        if (productsJson) {
          const products: Product[] = JSON.parse(productsJson);
          console.log(`Found ${products.length} products to migrate`);

          for (const product of products) {
            try {
              await databaseService.saveProduct(product);
              migratedProducts++;
            } catch (error) {
              console.warn(`Failed to migrate product ${product.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.warn('Error migrating products:', error);
      }

      // Migrate sales
      try {
        const salesJson = await AsyncStorage.getItem(SALES_KEY);
        if (salesJson) {
          const sales: Sale[] = JSON.parse(salesJson);
          console.log(`Found ${sales.length} sales to migrate`);

          for (const sale of sales) {
            try {
              await databaseService.saveSale(sale);
              migratedSales++;
            } catch (error) {
              console.warn(`Failed to migrate sale ${sale.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.warn('Error migrating sales:', error);
      }

      // Mark migration as completed
      await AsyncStorage.setItem(MIGRATION_COMPLETED_KEY, 'true');

      const message = `Migration completed successfully. Migrated ${migratedProducts} products and ${migratedSales} sales.`;
      console.log(message);

      return {
        success: true,
        message,
        stats: { products: migratedProducts, sales: migratedSales }
      };

    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async clearAsyncStorageData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([PRODUCTS_KEY, SALES_KEY]);
      console.log('AsyncStorage data cleared');
    } catch (error) {
      console.error('Error clearing AsyncStorage data:', error);
    }
  }

  async resetMigration(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MIGRATION_COMPLETED_KEY);
      await databaseService.clearAllData();
      console.log('Migration reset completed');
    } catch (error) {
      console.error('Error resetting migration:', error);
    }
  }
}

export const migrationService = new MigrationService();