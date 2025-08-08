import { useState, useEffect, useCallback } from 'react';
import { Restaurant } from '../lib/classes/Restaurant';
import { Table, Order, MenuItem, CashRegister, Payment, DailyRecord, Expense } from '../types';

export const useRestaurant = () => {
  const [restaurant] = useState(() => new Restaurant());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState({});

  // Force re-render helper
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  // 🔥 CARGAR EXPENSES DESDE LOCALSTORAGE
  const loadExpenses = useCallback(() => {
    try {
      const savedExpenses = localStorage.getItem('fischer_expenses');
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses([]);
    }
  }, []);

  // 🔥 GUARDAR EXPENSES EN LOCALSTORAGE
  const saveExpenses = useCallback((newExpenses: Expense[]) => {
    try {
      localStorage.setItem('fischer_expenses', JSON.stringify(newExpenses));
      setExpenses(newExpenses);
    } catch (error) {
      console.error('Error saving expenses:', error);
    }
  }, []);

  useEffect(() => {
    console.log('🎣 useRestaurant hook inicializado');
    
    // Cargar expenses al inicializar
    loadExpenses();
    
    // Simular carga inicial
    const timer = setTimeout(() => {
      setLoading(false);
      console.log('✅ useRestaurant hook listo');
    }, 500);

    return () => clearTimeout(timer);
  }, [loadExpenses]);

  // Métodos de Caja
  const openCashRegister = useCallback((crcAmount: number, usdAmount: number) => {
    console.log('🎣 Hook: Abriendo caja registradora');
    restaurant.openCashRegister(crcAmount, usdAmount);
    triggerUpdate();
  }, [restaurant, triggerUpdate]);

  const closeCashRegister = useCallback((): DailyRecord => {
    console.log('🎣 Hook: Cerrando caja registradora');
    const record = restaurant.closeCashRegister();
    triggerUpdate();
    return record;
  }, [restaurant, triggerUpdate]);

  // Métodos de Órdenes
  const createOrder = useCallback((tableNumber: number, notes?: string): Order => {
    console.log('🎣 Hook: Creando orden para mesa', tableNumber);
    const order = restaurant.createOrder(tableNumber, notes);
    triggerUpdate();
    return order;
  }, [restaurant, triggerUpdate]);

  const updateOrder = useCallback((order: Order) => {
    console.log('🎣 Hook: Actualizando orden', order.id);
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
    console.log('🎣 Hook: Procesando pago');
    const payment = restaurant.processPayment(orderId, amount, currency, method, received);
    triggerUpdate();
    return payment;
  }, [restaurant, triggerUpdate]);

  const getOrder = useCallback((orderId: string): Order | undefined => {
    return restaurant.getOrder(orderId);
  }, [restaurant]);

  const getTodaysOrders = useCallback((): Order[] => {
    return restaurant.getTodaysOrders();
  }, [restaurant]);

  const getTableByNumber = useCallback((number: number): Table | undefined => {
    return restaurant.getTableByNumber(number);
  }, [restaurant]);

  // Métodos de Menú
  const addMenuItem = useCallback((item: Omit<MenuItem, 'id'>): MenuItem => {
    console.log('🎣 Hook: Agregando item al menú');
    const menuItem = restaurant.addMenuItem(item);
    triggerUpdate();
    return menuItem;
  }, [restaurant, triggerUpdate]);

  const updateMenuItem = useCallback((item: MenuItem) => {
    console.log('🎣 Hook: Actualizando item del menú');
    restaurant.updateMenuItem(item);
    triggerUpdate();
  }, [restaurant, triggerUpdate]);

  const deleteMenuItem = useCallback((itemId: string) => {
    console.log('🎣 Hook: Eliminando item del menú');
    restaurant.deleteMenuItem(itemId);
    triggerUpdate();
  }, [restaurant, triggerUpdate]);

  // 🔥 MÉTODOS DE GASTOS - LOCALSTORAGE DIRECTO (SIN USAR RESTAURANT)
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    console.log('🎣 Hook: Agregando gasto');
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    
    const updatedExpenses = [...expenses, newExpense];
    saveExpenses(updatedExpenses);
    return newExpense;
  }, [expenses, saveExpenses]);

  const updateExpense = useCallback((updatedExpense: Expense) => {
    console.log('🎣 Hook: Actualizando gasto');
    const updatedExpenses = expenses.map(exp => 
      exp.id === updatedExpense.id ? { ...updatedExpense, updatedAt: new Date().toISOString() } : exp
    );
    saveExpenses(updatedExpenses);
  }, [expenses, saveExpenses]);

  const deleteExpense = useCallback((expenseId: string) => {
    console.log('🎣 Hook: Eliminando gasto');
    const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
    saveExpenses(updatedExpenses);
  }, [expenses, saveExpenses]);

  const getExpensesByCategory = useCallback((expensesToUse?: Expense[]): Record<string, number> => {
    const expenseList = expensesToUse || expenses;
    return expenseList.reduce((acc, expense) => {
      const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
      acc[expense.category] = (acc[expense.category] || 0) + amountInCRC;
      return acc;
    }, {} as Record<string, number>);
  }, [expenses]);

  const getExpensesByType = useCallback((expensesToUse?: Expense[]): { gastos: number; inversiones: number } => {
    const expenseList = expensesToUse || expenses;
    return expenseList.reduce((acc, expense) => {
      const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
      if (expense.type === 'gasto') {
        acc.gastos += amountInCRC;
      } else {
        acc.inversiones += amountInCRC;
      }
      return acc;
    }, { gastos: 0, inversiones: 0 });
  }, [expenses]);

  const getTodaysExpenses = useCallback((): Expense[] => {
    const today = new Date().toISOString().split('T')[0];
    return expenses.filter(expense => expense.date === today);
  }, [expenses]);

  const getExpensesInPeriod = useCallback((startDate: string, endDate: string): Expense[] => {
    return expenses.filter(expense => 
      expense.date >= startDate && expense.date <= endDate
    );
  }, [expenses]);

  // 🔥 ESTADÍSTICAS FINANCIERAS - IMPLEMENTACIÓN BÁSICA
  const getDailySummary = useCallback(() => {
    const todayOrders = restaurant.getTodaysOrders().filter(order => order.status === 'paid');
    const todayExpenses = getTodaysExpenses();
    
    const totalSales = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const totalExpenses = todayExpenses.reduce((sum, expense) => 
      sum + (expense.currency === 'USD' ? expense.amount * 520 : expense.amount), 0
    );
    
    return {
      date: new Date().toISOString().split('T')[0],
      totalSales,
      totalOrders: todayOrders.length,
      averageOrderValue: todayOrders.length > 0 ? totalSales / todayOrders.length : 0,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      profitMargin: totalSales > 0 ? ((totalSales - totalExpenses) / totalSales) * 100 : 0,
      expensesByCategory: getExpensesByCategory(todayExpenses),
      expensesByType: getExpensesByType(todayExpenses)
    };
  }, [restaurant, getTodaysExpenses, getExpensesByCategory, getExpensesByType]);

  const getFinancialStats = useCallback((period: 'today' | 'week' | 'month') => {
    // Implementación básica
    return getDailySummary();
  }, [getDailySummary]);

  // Utilidades
  const refreshData = useCallback(() => {
    console.log('🎣 Hook: Refrescando datos');
    loadExpenses();
    triggerUpdate();
  }, [triggerUpdate, loadExpenses]);

  return {
    // Estado
    tables: restaurant.getTables(),
    menuItems: restaurant.getMenuItems(),
    cashRegister: restaurant.getCashRegister(),
    expenses, // 🔥 Desde localStorage
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
    
    // 🔥 Métodos de Gastos (localStorage directo)
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    getExpensesByType,
    getTodaysExpenses,
    getExpensesInPeriod,
    
    // 🔥 Estadísticas Financieras
    getDailySummary,
    getFinancialStats,
    
    // Utilidades
    refreshData
  };
};