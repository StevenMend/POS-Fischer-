// Tipos principales del sistema POS - VERSIÓN ACTUALIZADA CON QUINCENAL + CRUD
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  notes?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid';
  total: number;
  currency: 'USD' | 'CRC';
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  discount?: OrderDiscount;  // 🔥 NUEVO
  splitPayments?: SplitPayment[];  // 🔥 NUEVO
  tableNumber: number;  // 🔥 NECESARIO para impresión
  subtotal: number;  // 🔥 NECESARIO para impresión
  serviceCharge: number;  // 🔥 NECESARIO para impresión
}
export interface Table {
  id: string;
  number: number;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: Order;
}

// EXPENSES - Estructura existente
export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: 'CRC' | 'USD';
  category: string;
  date: string;
  type: 'gasto' | 'inversion';
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// CASHREGISTER - Estructura existente
export interface CashRegister {
  isOpen: boolean;
  openingCashCRC: number;
  openingCashUSD: number;
  currentCashCRC: number;
  currentCashUSD: number;
  totalSalesCRC: number;
  totalSalesUSD: number;
  totalOrders: number;
  cashPaymentsCRC: number;
  cashPaymentsUSD: number;
  cardPaymentsCRC: number;
  cardPaymentsUSD: number;
  openedAt?: Date;
  closedAt?: Date;
}

// Tipos para pagos
export interface PaymentMethod {
  type: 'cash' | 'card';
  currency: Currency;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  received?: number;
  change?: number;
  timestamp: Date;
}

// DAILY SUMMARY - Estructura existente
export interface DailySummary {
  date: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  paymentMethods: {
    cashCRC: number;
    cashUSD: number;
    cardCRC: number;
    cardUSD: number;
  };
  openingCash: number;
  closingCash: number;
  cashFromSales: number;
}

// DAILY RECORD - Estructura existente CON ÓRDENES DETALLADAS
export interface DailyRecord {
  id: string;
  date: string;
  openingCashCRC: number;
  openingCashUSD: number;
  closingCashCRC: number;
  closingCashUSD: number;
  totalSalesCRC: number;
  totalSalesUSD: number;
  totalOrders: number;
  averageOrderValue: number;
  cashPaymentsCRC: number;
  cashPaymentsUSD: number;
  cardPaymentsCRC: number;
  cardPaymentsUSD: number;
  openedAt: string;
  closedAt: string;
  // 🔥 NUEVO: Agregar al DailyRecord existente:
  ordersDetails?: Array<{
    orderId: string;
    tableNumber: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    createdAt: string;
    paymentMethod: 'cash' | 'card';
  }>;
}

export interface Currency {
  symbol: string;
  code: 'USD' | 'CRC';
  exchangeRate: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
}

export type CurrencyCode = 'USD' | 'CRC';

// 🔥 FINANCIAL STATS - ACTUALIZADO CON PERÍODO QUINCENAL
export interface FinancialStats {
  period: 'biweekly' | 'month';  // 🔥 CAMBIO: Eliminado 'week', agregado 'biweekly'
  startDate: string;
  endDate: string;
  
  // INGRESOS (de múltiples cierres)
  totalIncome: number;
  ordersCount: number;
  averageOrderValue: number;
  closuresCount: number;           // Cantidad de días operados reales
  
  // GASTOS (acumulados del período)
  totalExpenses: number;
  expensesCount: number;
  totalGastos: number;
  totalInversiones: number;
  
  // RENTABILIDAD
  netProfit: number;
  profitMargin: number;
  efficiency: 'excelente' | 'buena' | 'mejorable';
  
  // PROMEDIOS DIARIOS
  dailyAverageIncome: number;
  dailyAverageExpenses: number;
  
  // BREAKDOWN
  expensesByCategory: Record<string, number>;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  
  // ALERTAS
  alerts: Array<{
    type: 'info' | 'warning' | 'critical';
    message: string;
  }>;
}

// 🔥 NUEVOS TIPOS PARA CRUD DE CIERRES
export interface ClosureEditData {
  id: string;
  openingCashCRC?: number;
  openingCashUSD?: number;
  closingCashCRC?: number;
  closingCashUSD?: number;
  notes?: string;
}

export interface ClosureOperationResult {
  success: boolean;
  message: string;
  updatedRecord?: DailyRecord;
}

export interface ClosureValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// BLUETOOTH PRINTER SYSTEM - Sin cambios
export interface BluetoothPrinter {
  id: string;
  name: string;
  connected: boolean;
  device?: BluetoothDevice;
  characteristic?: BluetoothRemoteGATTCharacteristic;
  rssi?: number;
  lastSeen?: Date;
  model?: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email?: string;
  taxId: string;
  website?: string;
  logoBase64?: string;
}

export interface PrinterSettings {
  paperWidth: number;
  fontSize: 'small' | 'normal' | 'large';
  density: number;
  cutPaper: boolean;
  cashDrawer: boolean;
  encoding: 'utf8' | 'latin1';
}

export interface ReceiptData {
  company: CompanyInfo;
  order: Order;
  payment: Payment;
  receiptNumber: string;
  timestamp: Date;
  settings: PrinterSettings;
}
// 🔥 TIPOS FALTANTES PARA DESCUENTOS Y SPLITS

export interface OrderDiscount {
  type: 'remove_service' | 'percent_10' | 'percent_12' | 'percent_15';
  amount: number;
  reason: string;
  authorizedBy: string; // PIN usado
  appliedAt: Date;
}

export interface SplitPayment {
  personNumber: number;
  amount: number;
  method: 'cash' | 'card';
  currency: 'CRC' | 'USD';
}
// types/index.ts - AGREGAR estos tipos al archivo existente

// ... tipos existentes ...

export interface ItemAssignment {
  itemId: string;
  itemName: string;
  personNumber: number;
  quantity: number;        // Puede ser fracción: 0.5, 1, 2, etc.
  pricePerUnit: number;
  subtotal: number;
}

export interface PersonAccount {
  personNumber: number;
  items: ItemAssignment[];
  subtotal: number;
  serviceCharge: number;
  total: number;
  paid: boolean;
  paymentId?: string;
  paidAt?: Date;
  paymentMethod?: 'cash' | 'card';
  paymentCurrency?: 'CRC' | 'USD';
}

export interface ManualSplit {
  type: 'manual';
  totalPeople: number;
  assignments: ItemAssignment[];
  personAccounts: PersonAccount[];
  createdAt: Date;
  allPaid: boolean;
}

// Extender Order para incluir ManualSplit
export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  subtotal: number;
  serviceCharge: number;
  total: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  discount?: OrderDiscount;
  splitPayments?: SplitPayment[];  // División equitativa
  manualSplit?: ManualSplit;       // 🆕 División manual por artículos
}

// ... resto de tipos existentes ...