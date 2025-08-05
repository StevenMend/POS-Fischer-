import { useState, useEffect, useCallback } from 'react';
import { Restaurant } from '../lib/classes/Restaurant';
import { Table, Order, MenuItem, CashRegister, DailySummary, Currency, Payment } from '../types';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../lib/storage';

// Instancia singleton del restaurante
let restaurantInstance: Restaurant | null = null;

const getRestaurantInstance = (): Restaurant => {
  if (!restaurantInstance) {
    restaurantInstance = new Restaurant();
  }
  return restaurantInstance;
};

export const useRestaurant = () => {
  const [restaurant] = useState(() => getRestaurantInstance());
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Refrescar datos
  const refreshData = useCallback(() => {
    setTables(restaurant.getTables());
    setMenuItems(restaurant.getMenuItems());
    setCashRegister(restaurant.getCashRegister());
    setForceUpdate(prev => prev + 1);
    setLoading(false);
  }, [restaurant]);

  // Inicializar datos
  useEffect(() => {
    // Pequeño delay para asegurar que todo se carga
    setTimeout(() => {
      refreshData();
    }
    )
    refreshData();
  }, [refreshData]);

  // GESTIÓN DE CAJA
  const openCashRegister = useCallback((openingCashCRC: number, openingCashUSD: number) => {
    restaurant.openCashRegister(openingCashCRC, openingCashUSD);
    refreshData();
  }, [restaurant, refreshData]);

  const closeCashRegister = useCallback((): DailySummary => {
    const summary = restaurant.closeCashRegister();
    refreshData();
    return summary;
  }, [restaurant, refreshData]);

  // GESTIÓN DE ÓRDENES
  const createOrder = useCallback((tableNumber: number, notes?: string): Order => {
    const order = restaurant.createOrder(tableNumber, notes);
    refreshData();
    return order;
  }, [restaurant, refreshData]);

  const getOrder = useCallback((orderId: string): Order | undefined => {
    return restaurant.getOrder(orderId);
  }, [restaurant]);

  const updateOrder = useCallback((order: Order) => {
    restaurant.updateOrder(order);
    refreshData();
  }, [restaurant, refreshData]);

  const deleteOrder = useCallback((orderId: string) => {
    restaurant.deleteOrder(orderId);
    refreshData();
  }, [restaurant, refreshData]);

  // GESTIÓN DE MENÚ
  const addMenuItem = useCallback((item: Omit<MenuItem, 'id'>): MenuItem => {
    const newItem = restaurant.addMenuItem(item);
    refreshData();
    return newItem;
  }, [restaurant, refreshData]);

  const updateMenuItem = useCallback((menuItem: MenuItem) => {
    restaurant.updateMenuItem(menuItem);
    refreshData();
  }, [restaurant, refreshData]);

  const deleteMenuItem = useCallback((itemId: string) => {
    restaurant.deleteMenuItem(itemId);
    refreshData();
  }, [restaurant, refreshData]);

  const getMenuItemsByCategory = useCallback((category: string): MenuItem[] => {
    return restaurant.getMenuItemsByCategory(category);
  }, [restaurant]);

  // GESTIÓN DE PAGOS
  const processPayment = useCallback((
    orderId: string, 
    amount: number, 
    currency: Currency, 
    method: 'cash' | 'card', 
    received?: number
  ): Payment => {
    const payment = restaurant.processPayment(orderId, amount, currency, method, received);
    refreshData();
    return payment;
  }, [restaurant, refreshData]);

  // GETTERS
  const getTable = useCallback((tableId: string): Table | undefined => {
    return restaurant.getTable(tableId);
  }, [restaurant]);

  const getTableByNumber = useCallback((number: number): Table | undefined => {
    return restaurant.getTableByNumber(number);
  }, [restaurant]);

  const getAvailableTables = useCallback((): Table[] => {
    return restaurant.getAvailableTables();
  }, [restaurant]);

  const getOccupiedTables = useCallback((): Table[] => {
    return restaurant.getOccupiedTables();
  }, [restaurant]);

  const getTodaysOrders = useCallback((): Order[] => {
    return restaurant.getTodaysOrders();
  }, [restaurant]);

  const getCategories = useCallback((): string[] => {
    return restaurant.getCategories();
  }, [restaurant]);

  // UTILIDADES ADICIONALES
  const getTableStats = useCallback(() => {
    const allTables = restaurant.getTables();
    return {
      total: allTables.length,
      available: allTables.filter(t => t.status === 'available').length,
      occupied: allTables.filter(t => t.status === 'occupied').length,
      reserved: allTables.filter(t => t.status === 'reserved').length,
      cleaning: allTables.filter(t => t.status === 'cleaning').length
    };
  }, [restaurant]);

  const getDailySales = useCallback(() => {
    const cashReg = restaurant.getCashRegister();
    return {
      totalCRC: cashReg.totalSalesCRC,
      totalUSD: cashReg.totalSalesUSD,
      totalOrders: cashReg.totalOrders,
      currentCashCRC: cashReg.currentCashCRC,
      currentCashUSD: cashReg.currentCashUSD
    };
  }, [restaurant]);
  return {
    // Estado
    tables,
    menuItems,
    cashRegister,
    loading,
    forceUpdate,
    
    // Acciones de caja
    openCashRegister,
    closeCashRegister,
    
    // Acciones de órdenes
    createOrder,
    getOrder,
    updateOrder,
    deleteOrder,
    
    // Acciones de menú
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuItemsByCategory,
    
    // Acciones de pagos
    processPayment,
    
    // Getters
    getTable,
    getTableByNumber,
    getAvailableTables,
    getOccupiedTables,
    getTodaysOrders,
    getCategories,
    getTableStats,
    getDailySales,
    
    // Utilidades
    refreshData
  };
};