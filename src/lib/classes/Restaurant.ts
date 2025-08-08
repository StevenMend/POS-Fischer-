import { Table } from './Table';
import { Order } from './Order';
import { MenuItem } from './MenuItem';
import { CashRegister, Payment, DailyRecord, Currency, MenuItem as IMenuItem } from '../../types';
import { generateId, formatCurrency, convertCurrency } from '../utils';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../storage';
import { SAMPLE_MENU_ITEMS } from '../constants';

export class Restaurant {
  private tables: Map<string, Table> = new Map();
  private orders: Map<string, Order> = new Map();
  private menuItems: Map<string, MenuItem> = new Map();
  private cashRegister: CashRegister;
  private payments: Payment[] = [];

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

  // GESTIÓN DE CAJA - SEPARACIÓN DE CONCEPTOS IMPLEMENTADA
  openCashRegister(openingCashCRC: number, openingCashUSD: number): void {
    console.log('🏦 Abriendo caja registradora...', { openingCashCRC, openingCashUSD });
    
    this.cashRegister = {
      // 🏦 ESTADO OPERATIVO
      isOpen: true,
      
      // 💰 DINERO FÍSICO BASE (para vueltos)
      openingCashCRC,
      openingCashUSD,
      currentCashCRC: openingCashCRC,     // Empieza igual al inicial
      currentCashUSD: openingCashUSD,     // Empieza igual al inicial
      
      // 📊 VENTAS DEL DÍA (empiezan en 0)
      totalSalesCRC: 0,                   // Solo ingresos por ventas
      totalSalesUSD: 0,                   // Solo ingresos por ventas
      totalOrders: 0,                     // Órdenes procesadas
      
      // 💳 DESGLOSE DE PAGOS (empiezan en 0)
      cashPaymentsCRC: 0,                 // Efectivo recibido en ventas
      cashPaymentsUSD: 0,                 // Efectivo recibido en ventas
      cardPaymentsCRC: 0,                 // Tarjetas procesadas
      cardPaymentsUSD: 0,                 // Tarjetas procesadas
      
      // 📅 TIMESTAMP
      openedAt: new Date()
    };
    
    this.saveToStorage();
  }

  closeCashRegister(): DailyRecord {
  console.log('🔒 Cerrando caja registradora...');
  
  // 📊 CAPTURAR DATOS ANTES DE RESETEAR
  const record: DailyRecord = {
    id: `closure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString().split('T')[0],
    
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
    
    // 📅 TIMESTAMPS
    openedAt: this.cashRegister.openedAt instanceof Date 
      ? this.cashRegister.openedAt.toISOString() 
      : (this.cashRegister.openedAt || new Date().toISOString()),
    closedAt: new Date().toISOString()
  };

  // 💾 GUARDAR EN HISTORIAL PRIMERO (con datos reales)
  this.saveToClosure(record);

  // 🧹 AHORA SÍ RESETEAR PARA PRÓXIMO DÍA
  console.log('🧹 Limpiando datos para el próximo día...');
  
  // 🔥 MANTENER CAJA CERRADA PERO CON DATOS DEL CIERRE VISIBLES
  this.cashRegister = {
    // 🏦 ESTADO CERRADO
    isOpen: false,
    
    // 💰 MANTENER DINERO FÍSICO HASTA PRÓXIMA APERTURA
    openingCashCRC: this.cashRegister.openingCashCRC,
    openingCashUSD: this.cashRegister.openingCashUSD,
    currentCashCRC: this.cashRegister.currentCashCRC,    // 🔥 MANTENER para reporte
    currentCashUSD: this.cashRegister.currentCashUSD,    // 🔥 MANTENER para reporte
    
    // 📊 MANTENER DATOS DEL DÍA PARA EL REPORTE FINAL
    totalSalesCRC: this.cashRegister.totalSalesCRC,      // 🔥 MANTENER para reporte
    totalSalesUSD: this.cashRegister.totalSalesUSD,      // 🔥 MANTENER para reporte
    totalOrders: this.cashRegister.totalOrders,          // 🔥 MANTENER para reporte
    
    // 💳 MANTENER DESGLOSE PARA EL REPORTE FINAL
    cashPaymentsCRC: this.cashRegister.cashPaymentsCRC,  // 🔥 MANTENER para reporte
    cashPaymentsUSD: this.cashRegister.cashPaymentsUSD,  // 🔥 MANTENER para reporte
    cardPaymentsCRC: this.cashRegister.cardPaymentsCRC,  // 🔥 MANTENER para reporte
    cardPaymentsUSD: this.cashRegister.cardPaymentsUSD,  // 🔥 MANTENER para reporte
    
    // 📅 TIMESTAMP
    closedAt: new Date()
  };

  // 🗑️ LIMPIAR ÓRDENES Y MESAS
  console.log('🗑️ Limpiando órdenes del día...');
  this.orders.clear();
  
  console.log('🗑️ Limpiando pagos del día...');
  this.payments = [];
  
  console.log('🍽️ Liberando todas las mesas...');
  this.tables.forEach(table => {
    if (table.status !== 'available') {
      table.free();
    }
  });

  // 💾 GUARDAR ESTADO CON DATOS DEL CIERRE
  this.saveToStorage();
  
  console.log('✅ Caja cerrada - Datos del día mantenidos para reporte final');
  console.log('📊 Estado: Caja cerrada pero datos visibles hasta próxima apertura');
  
  return record;
}

// // 🔥 NUEVO MÉTODO: Reset completo al abrir nueva caja
// openCashRegister(openingCashCRC: number, openingCashUSD: number): void {
//   console.log('🏦 Abriendo caja registradora...', { openingCashCRC, openingCashUSD });
  
//   this.cashRegister = {
//     // 🏦 ESTADO OPERATIVO
//     isOpen: true,
    
//     // 💰 DINERO FÍSICO BASE (para vueltos)
//     openingCashCRC,
//     openingCashUSD,
//     currentCashCRC: openingCashCRC,     // Empieza igual al inicial
//     currentCashUSD: openingCashUSD,     // Empieza igual al inicial
    
//     // 📊 VENTAS DEL DÍA (RESET COMPLETO AL ABRIR)
//     totalSalesCRC: 0,                   // 🔥 RESET: nuevo día
//     totalSalesUSD: 0,                   // 🔥 RESET: nuevo día
//     totalOrders: 0,                     // 🔥 RESET: nuevo día
    
//     // 💳 DESGLOSE DE PAGOS (RESET COMPLETO AL ABRIR)
//     cashPaymentsCRC: 0,                 // 🔥 RESET: nuevo día
//     cashPaymentsUSD: 0,                 // 🔥 RESET: nuevo día
//     cardPaymentsCRC: 0,                 // 🔥 RESET: nuevo día
//     cardPaymentsUSD: 0,                 // 🔥 RESET: nuevo día
    
//     // 📅 TIMESTAMP
//     openedAt: new Date()
//   };
  
//   this.saveToStorage();
// }

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
      cashRegisterOpen: data.cashRegister?.isOpen || false,
      lastSaved: data.lastSaved || 'No timestamp'
    });
    
    this.loadOrders(data.orders);
    this.loadTables(data.tables);
    this.loadMenuItems(data.menuItems);
    this.loadCashRegister(data.cashRegister);
    this.loadPayments(data.payments);
    
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