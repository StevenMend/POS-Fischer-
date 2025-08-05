import { Table } from './Table';
import { Order } from './Order';
import { MenuItem } from './MenuItem';
import { CashRegister, Payment, DailySummary, Currency, MenuItem as IMenuItem } from '../../types';
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
    this.cashRegister = {
      isOpen: false,
      openingCashCRC: 0,
      openingCashUSD: 0,
      currentCashCRC: 0,
      currentCashUSD: 0,
      totalSalesCRC: 0,
      totalSalesUSD: 0,
      totalOrders: 0
    };
    
    this.loadFromStorage();
    this.initializeDefaultData();
  }

  // Inicializar datos por defecto
  private initializeDefaultData(): void {
    if (this.tables.size === 0) {
      // Crear 15 mesas por defecto
      for (let i = 1; i <= 15; i++) {
        const seats = i <= 4 ? 2 : i <= 8 ? 4 : i <= 12 ? 6 : 8;
        const table = new Table(i, seats);
        this.tables.set(table.id, table);
      }
    }

    if (this.menuItems.size === 0) {
      // Cargar menú por defecto desde constants
      SAMPLE_MENU_ITEMS.forEach(item => {
        const menuItem = new MenuItem(item);
        this.menuItems.set(menuItem.id, menuItem);
      });
    }
  }

  // GESTIÓN DE CAJA
  openCashRegister(openingCashCRC: number, openingCashUSD: number): void {
    this.cashRegister = {
      ...this.cashRegister,
      isOpen: true,
      openingCashCRC,
      openingCashUSD,
      currentCashCRC: openingCashCRC,
      currentCashUSD: openingCashUSD,
      totalSalesCRC: 0,
      totalSalesUSD: 0,
      totalOrders: 0,
      openedAt: new Date()
    };
    this.saveToStorage();
  }

  closeCashRegister(): DailySummary {
    const summary: DailySummary = {
      date: new Date().toISOString().split('T')[0],
      totalSales: this.cashRegister.totalSalesCRC + convertCurrency(this.cashRegister.totalSalesUSD, 'USD', 'CRC'),
      totalOrders: this.cashRegister.totalOrders,
      averageOrderValue: this.cashRegister.totalOrders > 0 
        ? (this.cashRegister.totalSalesCRC + convertCurrency(this.cashRegister.totalSalesUSD, 'USD', 'CRC')) / this.cashRegister.totalOrders 
        : 0,
      paymentMethods: {
        cashCRC: this.payments.filter(p => p.method.type === 'cash' && p.currency === 'CRC').reduce((sum, p) => sum + p.amount, 0),
        cashUSD: this.payments.filter(p => p.method.type === 'cash' && p.currency === 'USD').reduce((sum, p) => sum + p.amount, 0),
        cardCRC: this.payments.filter(p => p.method.type === 'card' && p.currency === 'CRC').reduce((sum, p) => sum + p.amount, 0),
        cardUSD: this.payments.filter(p => p.method.type === 'card' && p.currency === 'USD').reduce((sum, p) => sum + p.amount, 0)
      }
    };

    this.cashRegister.isOpen = false;
    this.cashRegister.closedAt = new Date();
    this.saveToStorage();
    
    return summary;
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
    this.orders.set(order.id, order);
    
    // Actualizar la mesa correspondiente
    const table = this.getTableByNumber(order.tableNumber);
    if (table) {
      table.currentOrder = order;
    }
    
    this.saveToStorage();
  }

  deleteOrder(orderId: string): void {
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
    const menuItem = new MenuItem(item);
    this.menuItems.set(menuItem.id, menuItem);
    this.saveToStorage();
    return menuItem;
  }

  updateMenuItem(menuItem: MenuItem): void {
    this.menuItems.set(menuItem.id, menuItem);
    this.saveToStorage();
  }

  deleteMenuItem(itemId: string): void {
    this.menuItems.delete(itemId);
    this.saveToStorage();
  }

  // GESTIÓN DE PAGOS
  processPayment(orderId: string, amount: number, currency: Currency, method: 'cash' | 'card', received?: number): Payment {
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

    // Actualizar caja
    if (currency === 'CRC') {
      this.cashRegister.totalSalesCRC += amount;
      if (method === 'cash') {
        this.cashRegister.currentCashCRC += amount;
      }
    } else {
      this.cashRegister.totalSalesUSD += amount;
      if (method === 'cash') {
        this.cashRegister.currentCashUSD += amount;
      }
    }

    this.cashRegister.totalOrders += 1;

    // Marcar orden como pagada
    order.updateStatus('paid');
    this.updateOrder(order);

    // Liberar mesa
    const table = this.getTableByNumber(order.tableNumber);
    if (table) {
      table.free();
    }

    this.saveToStorage();
    return payment;
  }

  // PERSISTENCIA
  private saveToStorage(): void {
    const data = {
      tables: Array.from(this.tables.values()).map(t => t.toJSON()),
      orders: Array.from(this.orders.values()).map(o => o.toJSON()),
      menuItems: Array.from(this.menuItems.values()).map(m => m.toJSON()),
      cashRegister: this.cashRegister,
      payments: this.payments
    };
    
    saveToStorage(STORAGE_KEYS.RESTAURANT_DATA, data);
  }

  private loadFromStorage(): void {
    const data = loadFromStorage(STORAGE_KEYS.RESTAURANT_DATA, null);
    
    if (data) {
      // Cargar mesas
      if (data.tables) {
        data.tables.forEach((tableData: any) => {
          const table = Table.fromJSON(tableData);
          this.tables.set(table.id, table);
        });
      }

      // Cargar órdenes
      if (data.orders) {
        data.orders.forEach((orderData: any) => {
          const order = Order.fromJSON(orderData);
          this.orders.set(order.id, order);
        });
      }

      // Cargar menú
      if (data.menuItems) {
        data.menuItems.forEach((itemData: any) => {
          const item = MenuItem.fromJSON(itemData);
          this.menuItems.set(item.id, item);
        });
      }

      // Cargar caja
      if (data.cashRegister) {
        this.cashRegister = data.cashRegister;
      }

      // Cargar pagos
      if (data.payments) {
        this.payments = data.payments;
      }
    }
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