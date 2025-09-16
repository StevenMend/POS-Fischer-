import { useState, useEffect, useCallback } from 'react';
import { Restaurant } from '../lib/classes/Restaurant';
import { Table, Order, MenuItem, CashRegister, Payment, DailyRecord, Expense, ClosureEditData, ClosureOperationResult } from '../types';

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

  // MÉTODOS DE CAJA - Sin cambios
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

  // MÉTODOS DE RECOVERY SYSTEM - Sin cambios
  const detectInconsistentStates = useCallback(() => {
    return restaurant.detectInconsistentStates();
  }, [restaurant]);

  const repairInconsistentStates = useCallback(() => {
    const result = restaurant.repairInconsistentStates();
    triggerUpdate();
    return result;
  }, [restaurant, triggerUpdate]);

  const freeTable = useCallback((tableNumber: number) => {
    restaurant.freeTable(tableNumber);
    triggerUpdate();
  }, [restaurant, triggerUpdate]);

  const cancelOrderAndFreeTable = useCallback((orderId: string) => {
    const result = restaurant.cancelOrderAndFreeTable(orderId);
    triggerUpdate();
    return result;
  }, [restaurant, triggerUpdate]);

  const resetOrder = useCallback((orderId: string) => {
    const newOrder = restaurant.resetOrder(orderId);
    triggerUpdate();
    return newOrder;
  }, [restaurant, triggerUpdate]);

  // MÉTODOS DE ÓRDENES - Sin cambios
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

  // GETTERS OPTIMIZADOS - Sin cambios
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

  // MÉTODOS DE MENÚ - Sin cambios
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

  // MÉTODOS DE EXPENSES - Sin cambios
  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    const newExpense = restaurant.addExpense(expense);
    console.log('💸 Expense agregado via hook:', newExpense.description, '₡' + newExpense.amount);
    triggerUpdate();
    return newExpense;
  }, [restaurant, triggerUpdate]);

  const updateExpense = useCallback((expense: Expense) => {
    restaurant.updateExpense(expense);
    console.log('✏️ Expense actualizado via hook:', expense.id);
    triggerUpdate();
  }, [restaurant, triggerUpdate]);

  const deleteExpense = useCallback((expenseId: string) => {
    restaurant.deleteExpense(expenseId);
    console.log('🗑️ Expense eliminado via hook:', expenseId);
    triggerUpdate();
  }, [restaurant, triggerUpdate]);

  const getTodaysExpenses = useCallback(() => {
    return restaurant.getTodaysExpenses();
  }, [restaurant]);

  const getExpensesInPeriod = useCallback((startDate: string, endDate: string) => {
    return restaurant.getExpensesByPeriod(startDate, endDate);
  }, [restaurant]);

  const getExpensesByCategory = useCallback((expenses?: Expense[]) => {
    if (expenses) {
      return expenses.reduce((acc, expense) => {
        if (!acc[expense.category]) {
          acc[expense.category] = 0;
        }
        const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
        acc[expense.category] += amountInCRC;
        return acc;
      }, {} as Record<string, number>);
    }
    return restaurant.getExpensesByCategory();
  }, [restaurant]);

  const getExpensesByType = useCallback((expenses?: Expense[]) => {
    const expensesToAnalyze = expenses || restaurant.getExpenses();
    return expensesToAnalyze.reduce((acc, expense) => {
      const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
      if (expense.type === 'gasto') {
        acc.gastos += amountInCRC;
      } else {
        acc.inversiones += amountInCRC;
      }
      return acc;
    }, { gastos: 0, inversiones: 0 });
  }, [restaurant]);

  // 🔥 NUEVOS MÉTODOS CRUD DE CIERRES
  const editClosureRecord = useCallback((closureId: string, editData: ClosureEditData): ClosureOperationResult => {
    console.log('✏️ Editando cierre via hook:', closureId);
    const result = restaurant.editClosureRecord(closureId, editData);
    if (result.success) {
      triggerUpdate(); // Refrescar UI después de editar
    }
    return result;
  }, [restaurant, triggerUpdate]);

  const deleteClosureRecord = useCallback((closureId: string, reason?: string): ClosureOperationResult => {
    console.log('🗑️ Eliminando cierre via hook:', closureId);
    const result = restaurant.deleteClosureRecord(closureId, reason);
    if (result.success) {
      triggerUpdate(); // Refrescar UI después de eliminar
    }
    return result;
  }, [restaurant, triggerUpdate]);

  const getDeletedClosures = useCallback(() => {
    return restaurant.getDeletedClosures();
  }, [restaurant]);

  const restoreClosureRecord = useCallback((deletedClosureId: string): ClosureOperationResult => {
    console.log('🔄 Restaurando cierre via hook:', deletedClosureId);
    const result = restaurant.restoreClosureRecord(deletedClosureId);
    if (result.success) {
      triggerUpdate(); // Refrescar UI después de restaurar
    }
    return result;
  }, [restaurant, triggerUpdate]);

  // HISTORIAL DE CIERRES - Sin cambios
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

  // ESTADÍSTICAS - ACTUALIZADO PARA PERÍODO QUINCENAL
  const getDailySummary = useCallback(() => {
    // Para compatibilidad, usar período quincenal como default
    return restaurant.getFinancialStats('biweekly');
  }, [restaurant]);

  // 🔥 MÉTODO ACTUALIZADO: Solo períodos quincenal y mensual
  const getFinancialStats = useCallback((period: 'biweekly' | 'month') => {
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

  // ESTADO UNIFICADO
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
    
    // Métodos de Recovery System
    detectInconsistentStates,
    repairInconsistentStates,
    freeTable,
    cancelOrderAndFreeTable,
    resetOrder,
    
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
    
    // Métodos de Gastos
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    getExpensesByType,
    getTodaysExpenses,
    getExpensesInPeriod,
    
    // 🔥 NUEVOS MÉTODOS CRUD DE CIERRES
    editClosureRecord,
    deleteClosureRecord,
    getDeletedClosures,
    restoreClosureRecord,
    
    // Historial de Cierres
    getClosureHistory,
    
    // 🔥 ESTADÍSTICAS FINANCIERAS ACTUALIZADAS (Solo quincenal y mensual)
    getDailySummary,
    getFinancialStats,
    
    // Utilidades
    debugInfo,
    refreshData
  };
};