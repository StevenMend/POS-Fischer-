import { useState, useEffect, useCallback } from 'react';
import { Restaurant } from '../lib/classes/Restaurant';
import { Table, Order, MenuItem, CashRegister, Payment, DailyRecord, Expense } from '../types';

export const useRestaurant = () => {
  const [restaurant] = useState(() => new Restaurant());
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState({});

  // Force re-render helper
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [restaurant]);

  // 🔥 MÉTODOS DE CAJA - LOGS MÍNIMOS
  const openCashRegister = useCallback((crcAmount: number, usdAmount: number) => {
    console.log('💰 Abriendo caja:', crcAmount, 'CRC +', usdAmount, 'USD');
    restaurant.openCashRegister(crcAmount, usdAmount);
    triggerUpdate();
  }, [restaurant, triggerUpdate]);

  const closeCashRegister = useCallback((): DailyRecord => {
    console.log('🔒 Cerrando caja...');
    const record = restaurant.closeCashRegister();
    console.log('✅ Caja cerrada. Record:', record.date, '- ₡' + record.totalSalesCRC);
    triggerUpdate();
    return record;
  }, [restaurant, triggerUpdate]);

  // MÉTODOS DE ÓRDENES - SIN LOGS EXCESIVOS
  const createOrder = useCallback((tableNumber: number, notes?: string): Order => {
    const order = restaurant.createOrder(tableNumber, notes);
    triggerUpdate();
    return order;
  }, [restaurant, triggerUpdate]);

  const updateOrder = useCallback((order: Order) => {
    restaurant.updateOrder(order);
    triggerUpdate();
  }, [restaurant, triggerUpdate]);

  const processPayment = useCallback((
    orderId: string, 
    amount: number, 
    currency: 'CRC' | 'USD', 
    method: 'cash' | 'card', 
    received?: number
  ): Payment => {
    const payment = restaurant.processPayment(orderId, amount, currency, method, received);
    console.log('💳 Pago procesado:', amount, currency);
    triggerUpdate();
    return payment;
  }, [restaurant, triggerUpdate]);

  // 🔥 GETTERS OPTIMIZADOS - SIN LOGS CONSTANTES
  const getRestaurantState = useCallback(() => {
    return {
      tables: restaurant.getTables(),
      menuItems: restaurant.getMenuItems(),
      cashRegister: restaurant.getCashRegister(),
      expenses: restaurant.getExpenses(),
      todaysOrders: restaurant.getTodaysOrders()
    };
  }, [restaurant]);

  const getOrder = useCallback((orderId: string): Order | undefined => {
    return restaurant.getOrder(orderId);
  }, [restaurant]);

  const getTodaysOrders = useCallback((): Order[] => {
    return restaurant.getTodaysOrders();
  }, [restaurant]);

  const getTableByNumber = useCallback((number: number): Table | undefined => {
    return restaurant.getTableByNumber(number);
  }, [restaurant]);

  // MÉTODOS DE MENÚ
  const addMenuItem = useCallback((item: Omit<MenuItem, 'id'>): MenuItem => {
    const menuItem = restaurant.addMenuItem(item);
    triggerUpdate();
    return menuItem;
  }, [restaurant, triggerUpdate]);

  const updateMenuItem = useCallback((item: MenuItem) => {
    restaurant.updateMenuItem(item);
    triggerUpdate();
  }, [restaurant, triggerUpdate]);

  const deleteMenuItem = useCallback((itemId: string) => {
    restaurant.deleteMenuItem(itemId);
    triggerUpdate();
  }, [restaurant, triggerUpdate]);

  // 🔥 MÉTODOS DE EXPENSES - OPTIMIZADOS
  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'date'>): Expense => {
    const newExpense = restaurant.addExpense(expense);
    console.log('💸 Expense agregado:', newExpense.description, '₡' + newExpense.amount);
    triggerUpdate();
    return newExpense;
  }, [restaurant, triggerUpdate]);

  const updateExpense = useCallback((expense: Expense) => {
    restaurant.updateExpense(expense);
    triggerUpdate();
  }, [restaurant, triggerUpdate]);

  const deleteExpense = useCallback((expenseId: string) => {
    restaurant.deleteExpense(expenseId);
    triggerUpdate();
  }, [restaurant, triggerUpdate]);

  // 🔥 HISTORIAL DE CIERRES - SIN LOGS MASIVOS
  const getClosureHistory = useCallback(() => {
    try {
      const historyData = localStorage.getItem('fischer_closure_history');
      if (historyData) {
        const history = JSON.parse(historyData);
        return history;
      } else {
        return [];
      }
    } catch (error) {
      console.error('❌ Error cargando historial:', error);
      return [];
    }
  }, []);

  // ESTADÍSTICAS
  const getDailySummary = useCallback(() => {
    return restaurant.getFinancialStats('today');
  }, [restaurant]);

  const getFinancialStats = useCallback((period: 'today' | 'week' | 'month') => {
    return restaurant.getFinancialStats(period);
  }, [restaurant]);

  const debugInfo = useCallback(() => {
    const state = getRestaurantState();
    console.log('🐛 DEBUG:', {
      cashOpen: state.cashRegister.isOpen,
      sales: state.cashRegister.totalSalesCRC,
      orders: state.todaysOrders.length,
      expenses: state.expenses.length
    });
    return state;
  }, [getRestaurantState]);

  const refreshData = useCallback(() => {
    triggerUpdate();
  }, [triggerUpdate]);

  // 🔥 ESTADO OPTIMIZADO - UNA SOLA LLAMADA
  const state = getRestaurantState();

  return {
    // Estado unificado
    tables: state.tables,
    menuItems: state.menuItems,
    cashRegister: state.cashRegister,
    expenses: state.expenses,
    loading,
    
    // Métodos de Caja
    openCashRegister,
    closeCashRegister,
    
    // Métodos de Órdenes
    createOrder,
    updateOrder,
    processPayment,
    getOrder,
    getTodaysOrders,
    getTableByNumber,
    
    // Métodos de Menú
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    
    // 🔥 Métodos de Gastos
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory: restaurant.getExpensesByCategory,
    getExpensesByType: () => {
      const expenses = restaurant.getExpenses();
      return expenses.reduce((acc, expense) => {
        const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
        if (expense.type === 'gasto') {
          acc.gastos += amountInCRC;
        } else {
          acc.inversiones += amountInCRC;
        }
        return acc;
      }, { gastos: 0, inversiones: 0 });
    },
    getTodaysExpenses: useCallback(() => restaurant.getTodaysExpenses(), [restaurant]),
    getExpensesInPeriod: restaurant.getExpensesByPeriod,
    
    // Historial de Cierres
    getClosureHistory,
    
    // Estadísticas Financieras
    getDailySummary,
    getFinancialStats,
    
    // Utilidades
    debugInfo,
    refreshData
  };
};