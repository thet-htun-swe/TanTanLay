import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Sale } from '@/types';

// Storage keys
const PRODUCTS_KEY = 'products';
const SALES_KEY = 'sales';

// Product storage functions
export const saveProduct = async (product: Product): Promise<void> => {
  try {
    const existingProducts = await getProducts();
    const updatedProducts = [...existingProducts, product];
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
  } catch (error) {
    console.error('Error saving product:', error);
    throw error;
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const productsJson = await AsyncStorage.getItem(PRODUCTS_KEY);
    return productsJson ? JSON.parse(productsJson) : [];
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};

export const updateProduct = async (updatedProduct: Product): Promise<void> => {
  try {
    const existingProducts = await getProducts();
    const updatedProducts = existingProducts.map(product => 
      product.id === updatedProduct.id ? updatedProduct : product
    );
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const existingProducts = await getProducts();
    const updatedProducts = existingProducts.filter(product => product.id !== productId);
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Sale storage functions
export const saveSale = async (sale: Sale): Promise<void> => {
  try {
    const existingSales = await getSales();
    const updatedSales = [...existingSales, sale];
    await AsyncStorage.setItem(SALES_KEY, JSON.stringify(updatedSales));
  } catch (error) {
    console.error('Error saving sale:', error);
    throw error;
  }
};

export const getSales = async (): Promise<Sale[]> => {
  try {
    const salesJson = await AsyncStorage.getItem(SALES_KEY);
    return salesJson ? JSON.parse(salesJson) : [];
  } catch (error) {
    console.error('Error getting sales:', error);
    return [];
  }
};

export const getSaleById = async (saleId: string): Promise<Sale | null> => {
  try {
    const sales = await getSales();
    return sales.find(sale => sale.id === saleId) || null;
  } catch (error) {
    console.error('Error getting sale by ID:', error);
    return null;
  }
};
