import { Table } from './Table';
import { Order } from './Order';
import { MenuItem } from './MenuItem';
import { CashRegister, Payment, DailyRecord, Currency, MenuItem as IMenuItem, Expense } from '../../types';
import { generateId, formatCurrency, convertCurrency, getClosureDateString, parseDateString, getPeriodDates } from '../utils';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../storage';
import { SAMPLE_MENU_ITEMS } from '../constants';

export class Restaurant {
  private tables: Map<string, Table> = new Map();
  private orders: Map<string, Order> = new Map();
  private menuItems: Map<string, MenuItem> = new Map();
  private cashRegister: CashRegister;
  private payments: Payment[] = [];
  private expenses: Map<string, Expense> = new Map();

  constructor() {
    console.log('🏗️ Construyendo Restaurant...');
    
    this.cashRegister = {
      isOpen: false,
      openingCashCRC: 0,
      openingCashUSD: 0,
      currentCashCRC: 0,
      currentCashUSD: 0,
      totalSalesCRC: 0,
      totalSalesUSD: 0,
      totalOrders: 0,
      cashPaymentsCRC: 0,
      cashPaymentsUSD: 0,
      cardPaymentsCRC: 0,
      cardPaymentsUSD: 0
    };
    
    this.loadFromStorage();
    this.initializeDefaultData();
    
    console.log('💾 Realizando guardado inicial...');
    this.saveToStorage();
  }

  // Inicializar datos por defecto
  private initializeDefaultData(): void {
    if (this.tables.size === 0) {
      console.log('🍽️ Creando 15 mesas por defecto...');
      for (let i = 1; i <= 15; i++) {
        const seats = i <= 4 ? 2 : i <= 8 ? 4 : i <= 12 ? 6 : 8;
        const table = new Table(i, seats);
        this.tables.set(table.id, table);
      }
    }

    if (this.menuItems.size === 0) {
      console.log('📋 Cargando menú por defecto...');
      SAMPLE_MENU_ITEMS.forEach(item => {
        const menuItem = new MenuItem(item);
        this.menuItems.set(menuItem.id, menuItem);
      });
    }
  }

  // 🔥 CORRECCIÓN DEL MÉTODO openCashRegister - RESET COMPLETO
openCashRegister(openingCashCRC: number, openingCashUSD: number): void {
  console.log('🏦 Abriendo caja registradora con RESET COMPLETO...', { openingCashCRC, openingCashUSD });
  
  // 🧹 PRIMERO: RESET COMPLETO DE DATOS DEL DÍA ANTERIOR
  console.log('🧹 Limpiando datos del día anterior...');
  
  // 🗑️ LIMPIAR ÓRDENES DEL DÍA ANTERIOR
  this.orders.clear();
  console.log('✅ Órdenes del día anterior eliminadas');
  
  // 🗑️ LIMPIAR PAGOS DEL DÍA ANTERIOR  
  this.payments = [];
  console.log('✅ Pagos del día anterior eliminados');
  
  // 🗑️ LIMPIAR EXPENSES DEL DÍA ANTERIOR  
  this.expenses.clear();
  console.log('✅ Expenses del día anterior eliminados');
  
  // 🍽️ LIBERAR TODAS LAS MESAS (estado limpio)
  this.tables.forEach(table => {
    if (table.status !== 'available') {
      table.free();
    }
  });
  console.log('✅ Todas las mesas liberadas');

  // 🔥 SEGUNDO: INICIALIZAR CAJA NUEVA CON DATOS EN CERO
  this.cashRegister = {
    // 🏦 ESTADO OPERATIVO
    isOpen: true,
    
    // 💰 DINERO FÍSICO BASE (para vueltos) - INICIAL
    openingCashCRC,
    openingCashUSD,
    currentCashCRC: openingCashCRC,     // Empieza igual al inicial
    currentCashUSD: openingCashUSD,     // Empieza igual al inicial
    
    // 📊 VENTAS DEL DÍA - RESET COMPLETO A CERO
    totalSalesCRC: 0,                   // 🔥 NUEVO DÍA = 0
    totalSalesUSD: 0,                   // 🔥 NUEVO DÍA = 0
    totalOrders: 0,                     // 🔥 NUEVO DÍA = 0
    
    // 💳 DESGLOSE DE PAGOS - RESET COMPLETO A CERO
    cashPaymentsCRC: 0,                 // 🔥 NUEVO DÍA = 0
    cashPaymentsUSD: 0,                 // 🔥 NUEVO DÍA = 0
    cardPaymentsCRC: 0,                 // 🔥 NUEVO DÍA = 0
    cardPaymentsUSD: 0,                 // 🔥 NUEVO DÍA = 0
    
    // 📅 TIMESTAMP NUEVO
    openedAt: new Date()
  };
  
  // 💾 GUARDAR ESTADO LIMPIO
  this.saveToStorage();
  
  console.log('✅ Caja abierta con estado completamente limpio');
  console.log('📊 Dashboard se mostrará con datos en cero');
}

  // 🔥 MÉTODO closeCashRegister CORREGIDO CON FECHAS EXACTAS
closeCashRegister(): DailyRecord {
  console.log('🔒 Cerrando caja registradora...');
  
  // 📊 CAPTURAR DATOS ANTES DE RESETEAR
  const record: DailyRecord = {
    id: `closure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    
    // 🔥 FECHA CORRECTA EN TIMEZONE COSTA RICA
    date: getClosureDateString(), // YYYY-MM-DD en timezone correcto
    
    // 💰 DINERO FÍSICO (antes del reset)
    openingCashCRC: this.cashRegister.openingCashCRC,
    openingCashUSD: this.cashRegister.openingCashUSD,
    closingCashCRC: this.cashRegister.currentCashCRC,
    closingCashUSD: this.cashRegister.currentCashUSD,
    
    // 📊 VENTAS DEL DÍA (antes del reset) 
    totalSalesCRC: this.cashRegister.totalSalesCRC,
    totalSalesUSD: this.cashRegister.totalSalesUSD,
    totalOrders: this.cashRegister.totalOrders,
    averageOrderValue: this.cashRegister.totalOrders > 0 
      ? this.cashRegister.totalSalesCRC / this.cashRegister.totalOrders 
      : 0,
    
    // 💳 MÉTODOS DE PAGO (antes del reset)
    cashPaymentsCRC: this.cashRegister.cashPaymentsCRC,
    cashPaymentsUSD: this.cashRegister.cashPaymentsUSD,
    cardPaymentsCRC: this.cashRegister.cardPaymentsCRC,
    cardPaymentsUSD: this.cashRegister.cardPaymentsUSD,
    
    // 📅 TIMESTAMPS EN ISO STRING
    openedAt: this.cashRegister.openedAt instanceof Date 
      ? this.cashRegister.openedAt.toISOString() 
      : (this.cashRegister.openedAt || new Date().toISOString()),
    closedAt: new Date().toISOString()
  };

  // 💾 GUARDAR EN HISTORIAL PRIMERO (con datos reales)
  this.saveToClosure(record);

  // 🧹 AHORA SÍ RESETEAR COMPLETAMENTE PARA PRÓXIMO DÍA
  console.log('🧹 Reseteando completamente el sistema...');
  
  // 🔥 CAJA CERRADA Y DATOS RESETEADOS
  this.cashRegister = {
    // 🏦 ESTADO CERRADO
    isOpen: false,
    
    // 💰 RESET COMPLETO DEL DINERO FÍSICO
    openingCashCRC: 0,
    openingCashUSD: 0,
    currentCashCRC: 0,
    currentCashUSD: 0,
    
    // 📊 RESET COMPLETO DE VENTAS
    totalSalesCRC: 0,
    totalSalesUSD: 0,
    totalOrders: 0,
    
    // 💳 RESET COMPLETO DE PAGOS
    cashPaymentsCRC: 0,
    cashPaymentsUSD: 0,
    cardPaymentsCRC: 0,
    cardPaymentsUSD: 0,
    
    // 📅 TIMESTAMP DE CIERRE
    closedAt: new Date()
  };

  // 🗑️ LIMPIAR ÓRDENES Y MESAS
  console.log('🗑️ Limpiando órdenes del día...');
  this.orders.clear();
  
  console.log('🗑️ Limpiando pagos del día...');
  this.payments = [];
  
  console.log('🗑️ Limpiando expenses del día...');
  this.expenses.clear();
  
  console.log('🍽️ Liberando todas las mesas...');
  this.tables.forEach(table => {
    if (table.status !== 'available') {
      table.free();
    }
  });

  // 💾 GUARDAR ESTADO LIMPIO
  this.saveToStorage();
  
  console.log('✅ Caja cerrada - Sistema completamente reseteado');
  console.log('📊 Dashboard se mostrará como "Caja Cerrada"');
  
  return record;
}

  private getPaymentsByType(method: string, currency: Currency): number {
    return this.payments
      .filter(p => p.method.type === method && p.currency === currency)
      .reduce((sum, p) => sum + p.amount, 0);
  }

  private saveToClosure(record: DailyRecord): void {
    console.log('💾 Guardando registro de cierre en historial:', record.id);
    
    try {
      const existingHistory = JSON.parse(localStorage.getItem('fischer_closure_history') || '[]');
      existingHistory.push(record);
      localStorage.setItem('fischer_closure_history', JSON.stringify(existingHistory));
      
      console.log('✅ Registro de cierre guardado exitosamente');
    } catch (error) {
      console.error('❌ Error guardando registro de cierre:', error);
      throw new Error('Failed to save closure record');
    }
  }

  // GESTIÓN DE MESAS
  getTables(): Table[] {
    return Array.from(this.tables.values()).sort((a, b) => a.number - b.number);
  }

  getTable(tableId: string): Table | undefined {
    return this.tables.get(tableId);
  }

  getTableByNumber(number: number): Table | undefined {
    return Array.from(this.tables.values()).find(table => table.number === number);
  }

  // GESTIÓN DE ÓRDENES
  createOrder(tableNumber: number, notes?: string): Order {
    console.log('📝 Creando nueva orden para mesa:', tableNumber);
    
    const table = this.getTableByNumber(tableNumber);
    if (!table) {
      throw new Error(`Mesa ${tableNumber} no encontrada`);
    }

    const order = new Order(tableNumber, notes);
    this.orders.set(order.id, order);
    table.occupy(order);
    
    this.saveToStorage();
    return order;
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  updateOrder(order: Order): void {
    console.log('✏️ Actualizando orden:', order.id, `Items: ${order.items.length}, Total: ₡${order.total}`);
    
    this.orders.set(order.id, order);
    
    // Update corresponding table
    const table = this.getTableByNumber(order.tableNumber);
    if (table) {
      table.currentOrder = order;
    }
    
    this.saveToStorage();
  }

  deleteOrder(orderId: string): void {
    console.log('🗑️ Eliminando orden:', orderId);
    
    const order = this.orders.get(orderId);
    if (order) {
      const table = this.getTableByNumber(order.tableNumber);
      if (table) {
        table.free();
      }
      this.orders.delete(orderId);
      this.saveToStorage();
    }
  }

  // GESTIÓN DE MENÚ
  getMenuItems(): MenuItem[] {
    return Array.from(this.menuItems.values());
  }

  getMenuItemsByCategory(category: string): MenuItem[] {
    return this.getMenuItems().filter(item => item.category === category);
  }

  addMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
    console.log('➕ Agregando item al menú:', item.name);
    
    const menuItem = new MenuItem(item);
    this.menuItems.set(menuItem.id, menuItem);
    this.saveToStorage();
    return menuItem;
  }

  updateMenuItem(menuItem: MenuItem): void {
    console.log('✏️ Actualizando item del menú:', menuItem.name);
    
    this.menuItems.set(menuItem.id, menuItem);
    this.saveToStorage();
  }

  deleteMenuItem(itemId: string): void {
    console.log('🗑️ Eliminando item del menú:', itemId);
    
    this.menuItems.delete(itemId);
    this.saveToStorage();
  }

  // ==========================================
  // 🔥 GESTIÓN COMPLETA DE EXPENSES
  // ==========================================

  addExpense(expense: Omit<Expense, 'id' | 'date'>): Expense {
    console.log('💸 Agregando expense:', expense.description, `₡${expense.amount}`);
    
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      date: getClosureDateString(), // Siempre fecha actual en formato YYYY-MM-DD
    };
    
    this.expenses.set(newExpense.id, newExpense);
    this.saveToStorage();
    return newExpense;
  }

  updateExpense(expense: Expense): void {
    console.log('✏️ Actualizando expense:', expense.description);
    
    this.expenses.set(expense.id, expense);
    this.saveToStorage();
  }

  deleteExpense(expenseId: string): void {
    console.log('🗑️ Eliminando expense:', expenseId);
    
    this.expenses.delete(expenseId);
    this.saveToStorage();
  }

  getExpenses(): Expense[] {
    return Array.from(this.expenses.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  getExpensesByPeriod(startDate: string, endDate: string): Expense[] {
    return this.getExpenses().filter(expense => {
      return expense.date >= startDate && expense.date <= endDate;
    });
  }

  getTodaysExpenses(): Expense[] {
    const today = getClosureDateString();
    return this.getExpenses().filter(expense => expense.date === today);
  }

  getExpensesByCategory(category: string): Expense[] {
    return this.getExpenses().filter(expense => expense.category === category);
  }

  // 🔥 NUEVO: Obtener cierres por período (para estadísticas financieras)
  getClosuresByPeriod(startDate: string, endDate: string): any[] {
    try {
      const history = JSON.parse(localStorage.getItem('fischer_closure_history') || '[]');
      return history.filter((record: any) => {
        return record.date >= startDate && record.date <= endDate;
      });
    } catch (error) {
      console.error('Error loading closure history:', error);
      return [];
    }
  }

  // 🔥 NUEVO: Estadísticas financieras reales
  getFinancialStats(period: 'week' | 'month' | 'today' = 'today'): {
    totalIncome: { CRC: number; USD: number };
    totalExpenses: { CRC: number; USD: number };
    netProfit: { CRC: number; USD: number };
    alerts: string[];
    expensesByCategory: Record<string, number>;
    averageOrderValue: number;
    totalOrders: number;
  } {
    let startDate: string, endDate: string;
    
    if (period === 'today') {
      startDate = endDate = getClosureDateString();
    } else {
      const dates = getPeriodDates(period);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }
    
    // 💰 INGRESOS: Suma de todos los cierres del período
    const closures = this.getClosuresByPeriod(startDate, endDate);
    const totalIncome = {
      CRC: closures.reduce((sum, record) => sum + (record.totalSalesCRC || 0), 0),
      USD: closures.reduce((sum, record) => sum + (record.totalSalesUSD || 0), 0)
    };
    
    // 💸 GASTOS: Suma de expenses del período
    const expenses = this.getExpensesByPeriod(startDate, endDate);
    const totalExpenses = {
      CRC: expenses.filter(e => e.currency === 'CRC').reduce((sum, e) => sum + e.amount, 0),
      USD: expenses.filter(e => e.currency === 'USD').reduce((sum, e) => sum + e.amount, 0)
    };
    
    // 💵 GANANCIA NETA
    const netProfit = {
      CRC: totalIncome.CRC - totalExpenses.CRC,
      USD: totalIncome.USD - totalExpenses.USD
    };
    
    // 📊 GASTOS POR CATEGORÍA
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(expense => {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0;
      }
      // Convertir todo a CRC para simplicidad
      const amountInCRC = expense.currency === 'USD' 
        ? expense.amount * 520 // usar tasa de cambio
        : expense.amount;
      expensesByCategory[expense.category] += amountInCRC;
    });
    
    // 📈 MÉTRICAS ADICIONALES
    const totalOrders = closures.reduce((sum, record) => sum + (record.totalOrders || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalIncome.CRC / totalOrders : 0;
    
    // 🚨 ALERTAS
    const alerts: string[] = [];
    
    // Alerta: Gastos muy altos vs ingresos
    const expenseRatio = totalIncome.CRC > 0 ? (totalExpenses.CRC / totalIncome.CRC) * 100 : 0;
    if (expenseRatio > 40) {
      alerts.push(`Gastos representan ${expenseRatio.toFixed(1)}% de ingresos (muy alto)`);
    }
    
    // Alerta: Pérdidas
    if (netProfit.CRC < 0) {
      alerts.push(`Pérdida neta de ₡${Math.abs(netProfit.CRC).toLocaleString()}`);
    }
    
    // Alerta: Sin ventas en el período
    if (totalIncome.CRC === 0 && period !== 'today') {
      alerts.push('Sin ventas registradas en el período');
    }
    
    return {
      totalIncome,
      totalExpenses,
      netProfit,
      alerts,
      expensesByCategory,
      averageOrderValue,
      totalOrders
    };
  }

  // GESTIÓN DE PAGOS
  processPayment(orderId: string, amount: number, currency: Currency, method: 'cash' | 'card', received?: number): Payment {
    console.log('💳 Procesando pago:', { orderId, amount, currency, method });
    
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error('Orden no encontrada');
    }

    const payment: Payment = {
      id: generateId(),
      orderId,
      amount,
      currency,
      method: { type: method, currency },
      received,
      change: received ? Math.max(0, received - amount) : undefined,
      timestamp: new Date()
    };

    this.payments.push(payment);

    // Update cash register
    this.updateCashRegisterForPayment(amount, currency, method);
    this.cashRegister.totalOrders += 1;

    // Mark order as paid
    if (typeof order.updateStatus === 'function') {
      order.updateStatus('paid');
    } else {
      // Para objetos planos, actualizar directamente
      order.status = 'paid';
      order.updatedAt = new Date();
    }
  
    this.updateOrder(order);

    // Free table
    const table = this.getTableByNumber(order.tableNumber);
    if (table) {
      table.free();
    }

    this.saveToStorage();
    return payment;
  }

  // PROCESAMIENTO DE PAGO CORREGIDO - SEPARACIÓN DE CONCEPTOS
  private updateCashRegisterForPayment(amount: number, currency: Currency, method: string): void {
    if (currency === 'CRC') {
      // 📊 SIEMPRE sumar a ventas del día
      this.cashRegister.totalSalesCRC += amount;
      
      if (method === 'cash') {
        // 💰 Efectivo: Se suma al dinero físico Y se registra en pagos
        this.cashRegister.currentCashCRC += amount;
        this.cashRegister.cashPaymentsCRC += amount;
      } else {
        // 💳 Tarjeta: Solo se registra en pagos (no afecta dinero físico)
        this.cashRegister.cardPaymentsCRC += amount;
      }
    } else {
      // Misma lógica para USD
      this.cashRegister.totalSalesUSD += amount;
      
      if (method === 'cash') {
        this.cashRegister.currentCashUSD += amount;
        this.cashRegister.cashPaymentsUSD += amount;
      } else {
        this.cashRegister.cardPaymentsUSD += amount;
      }
    }
  }

  // PERSISTENCIA
  private saveToStorage(): void {
    try {
      const data = {
        tables: this.serializeTables(),
        orders: this.serializeOrders(),
        menuItems: this.serializeMenuItems(),
        cashRegister: this.cashRegister,
        payments: this.payments,
        expenses: this.serializeExpenses(),
        lastSaved: new Date().toISOString()
      };
      
      saveToStorage(STORAGE_KEYS.RESTAURANT_DATA, data);
      
    } catch (error) {
      console.error('🚨 ERROR EN GUARDADO:', error);
    }
  }

  private serializeTables(): any[] {
    return Array.from(this.tables.values()).map(t => 
      typeof t.toJSON === 'function' ? t.toJSON() : t
    );
  }

  private serializeOrders(): any[] {
    return Array.from(this.orders.values()).map(order => {
      if (typeof order.toJSON === 'function') {
        return order.toJSON();
      }
      return order;
    });
  }

  private serializeMenuItems(): any[] {
    return Array.from(this.menuItems.values()).map(m => 
      typeof m.toJSON === 'function' ? m.toJSON() : m
    );
  }

  private serializeExpenses(): any[] {
    return Array.from(this.expenses.values());
  }

  private loadFromStorage(): void {
    console.log('📂 Intentando cargar datos desde localStorage...');
    
    const data = loadFromStorage(STORAGE_KEYS.RESTAURANT_DATA, null);
    
    if (!data) {
      console.log('📭 No hay datos guardados en localStorage - iniciando fresh');
      return;
    }

    console.log('📋 Datos encontrados en localStorage:', {
      tables: data.tables?.length || 0,
      orders: data.orders?.length || 0,
      menuItems: data.menuItems?.length || 0,
      expenses: data.expenses?.length || 0,
      cashRegisterOpen: data.cashRegister?.isOpen || false,
      lastSaved: data.lastSaved || 'No timestamp'
    });
    
    this.loadOrders(data.orders);
    this.loadTables(data.tables);
    this.loadMenuItems(data.menuItems);
    this.loadCashRegister(data.cashRegister);
    this.loadPayments(data.payments);
    this.loadExpenses(data.expenses);
    
    this.verifyOrderReconnection();
  }

  private loadOrders(ordersData: any[]): void {
    if (!ordersData) return;
    
    console.log('📝 Cargando órdenes...');
    ordersData.forEach((orderData: any) => {
      const order = Order.fromJSON(orderData);
      this.orders.set(order.id, order);
    });
    console.log(`✅ Total órdenes cargadas: ${ordersData.length}`);
  }

  private loadTables(tablesData: any[]): void {
    if (!tablesData) return;
    
    console.log('🍽️ Cargando mesas...');
    tablesData.forEach((tableData: any) => {
      const table = Table.fromJSON(tableData);
      
      // Reconnect order if exists
      if (tableData.currentOrder) {
        const order = this.orders.get(tableData.currentOrder.id);
        if (order) {
          table.currentOrder = order;
        }
      }
      
      this.tables.set(table.id, table);
    });
    console.log(`✅ Cargadas ${tablesData.length} mesas`);
  }

  private loadMenuItems(menuItemsData: any[]): void {
    if (!menuItemsData) return;
    
    menuItemsData.forEach((itemData: any) => {
      const item = MenuItem.fromJSON(itemData);
      this.menuItems.set(item.id, item);
    });
    console.log(`✅ Cargados ${menuItemsData.length} items del menú`);
  }

  private loadCashRegister(cashRegisterData: any): void {
    if (cashRegisterData) {
      this.cashRegister = cashRegisterData;
      console.log('✅ Estado de caja cargado:', cashRegisterData.isOpen ? 'Abierta' : 'Cerrada');
    }
  }

  private loadPayments(paymentsData: any[]): void {
    if (paymentsData) {
      this.payments = paymentsData;
      console.log(`✅ Cargados ${paymentsData.length} pagos`);
    }
  }

  private loadExpenses(expensesData: any[]): void {
    if (expensesData) {
      expensesData.forEach((expenseData: any) => {
        this.expenses.set(expenseData.id, expenseData);
      });
      console.log(`✅ Cargados ${expensesData.length} expenses`);
    }
  }

  private verifyOrderReconnection(): void {
    console.log('🔍 Verificación final de reconexión:');
    this.tables.forEach(table => {
      if (table.status === 'occupied' && table.currentOrder) {
        console.log(`✅ Mesa ${table.number}: ${table.currentOrder.items.length} items, Total: ₡${table.currentOrder.total}`);
      } else if (table.status === 'occupied' && !table.currentOrder) {
        console.error(`❌ Mesa ${table.number} está ocupada pero NO tiene orden!`);
      }
    });
  }

  // GETTERS PARA ESTADÍSTICAS
  getCashRegister(): CashRegister {
    return { ...this.cashRegister };
  }

  getAvailableTables(): Table[] {
    return this.getTables().filter(table => table.isAvailable());
  }

  getOccupiedTables(): Table[] {
    return this.getTables().filter(table => table.isOccupied());
  }

  getTodaysOrders(): Order[] {
    const today = new Date().toDateString();
    return Array.from(this.orders.values()).filter(
      order => order.createdAt.toDateString() === today
    );
  }

  getCategories(): string[] {
    const categories = new Set(this.getMenuItems().map(item => item.category));
    return Array.from(categories).sort();
  }
}