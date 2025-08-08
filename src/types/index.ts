// Tipos principales del sistema POS - VERSIÓN UNIFICADA COMPLETA CON EXPENSES
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
}

export interface Table {
  id: string;
  number: number;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: Order;
}

// 🔥 EXPENSES - NUEVA INTEGRACIÓN COMPLETA
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

// 🔥 CASHREGISTER CORREGIDO - SEPARACIÓN DE CONCEPTOS
export interface CashRegister {
  // 🏦 ESTADO OPERATIVO
  isOpen: boolean;
  
  // 💰 DINERO FÍSICO BASE (para vueltos)
  openingCashCRC: number;     // Dinero inicial puesto al abrir
  openingCashUSD: number;     // Dinero inicial puesto al abrir
  
  // 💰 DINERO FÍSICO ACTUAL (base + efectivo de ventas)
  currentCashCRC: number;     // Dinero físico total en caja
  currentCashUSD: number;     // Dinero físico total en caja
  
  // 📊 VENTAS DEL DÍA (separadas del dinero físico)
  totalSalesCRC: number;      // Solo ingresos por ventas
  totalSalesUSD: number;      // Solo ingresos por ventas
  totalOrders: number;        // Órdenes procesadas hoy
  
  // 💳 DESGLOSE DE PAGOS DEL DÍA (para análisis)
  cashPaymentsCRC: number;    // Efectivo recibido en ventas
  cashPaymentsUSD: number;    // Efectivo recibido en ventas
  cardPaymentsCRC: number;    // Tarjetas procesadas
  cardPaymentsUSD: number;    // Tarjetas procesadas
  
  // 📅 TIMESTAMPS
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
  received?: number;  // Para pagos en efectivo
  change?: number;    // Para pagos en efectivo
  timestamp: Date;
}

// 🔥 DAILY SUMMARY - Para compatibilidad con Reports existente
export interface DailySummary {
  date: string;
  
  // 💰 INGRESOS
  totalSales: number;         // Total combinado en CRC
  totalOrders: number;
  averageOrderValue: number;
  
  // 💳 MÉTODOS DE PAGO
  paymentMethods: {
    cashCRC: number;
    cashUSD: number;
    cardCRC: number;
    cardUSD: number;
  };
  
  // 💰 ESTADO DE CAJA
  openingCash: number;        // Dinero inicial
  closingCash: number;        // Dinero final físico
  cashFromSales: number;      // Efectivo recibido por ventas
}

// 🔥 DAILY RECORD - ESTRUCTURA EXACTA que espera ClosureHistory
export interface DailyRecord {
  id: string;
  date: string;
  
  // 💰 DINERO FÍSICO - NOMBRES EXACTOS de ClosureHistory
  openingCashCRC: number;     // Dinero inicial puesto
  openingCashUSD: number;     // Dinero inicial puesto
  closingCashCRC: number;     // Dinero físico final
  closingCashUSD: number;     // Dinero físico final
  
  // 📊 VENTAS DEL DÍA - NOMBRES EXACTOS de ClosureHistory
  totalSalesCRC: number;      // Ingresos por ventas
  totalSalesUSD: number;      // Ingresos por ventas
  totalOrders: number;        // Órdenes procesadas
  averageOrderValue: number;  // Promedio por orden
  
  // 💳 MÉTODOS DE PAGO - NOMBRES EXACTOS de ClosureHistory
  cashPaymentsCRC: number;    // Efectivo recibido en ventas
  cashPaymentsUSD: number;    // Efectivo recibido en ventas
  cardPaymentsCRC: number;    // Tarjetas procesadas
  cardPaymentsUSD: number;    // Tarjetas procesadas
  
  // 📅 TIMESTAMPS - FORMATO EXACTO de ClosureHistory
  openedAt: string;
  closedAt: string;
}

export interface Currency {
  symbol: string;
  code: 'USD' | 'CRC';
  exchangeRate: number;
}

// Re-export de MenuItem para compatibilidad
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
}

// Tipo union para monedas
export type CurrencyCode = 'USD' | 'CRC';

// 🔥 FINANCIAL STATS - Para reportes SEMANALES/MENSUALES
export interface FinancialStats {
  period: 'week' | 'month';        // Eliminado 'today' - solo semanal/mensual
  startDate: string;
  endDate: string;
  
  // 💰 INGRESOS (de múltiples cierres)
  totalIncome: number;
  ordersCount: number;
  averageOrderValue: number;
  closuresCount: number;           // Cantidad de días operados
  
  // 💸 GASTOS (acumulados del período)
  totalExpenses: number;
  expensesCount: number;
  totalGastos: number;             // Solo gastos operativos
  totalInversiones: number;        // Solo inversiones
  
  // 📈 RENTABILIDAD
  netProfit: number;
  profitMargin: number;
  efficiency: 'excelente' | 'buena' | 'mejorable';
  
  // 📊 PROMEDIOS DIARIOS
  dailyAverageIncome: number;      // Promedio de ingresos por día
  dailyAverageExpenses: number;    // Promedio de gastos por día
  
  // 📋 BREAKDOWN
  expensesByCategory: Record<string, number>;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  
  // ⚠️ ALERTAS
  alerts: Array<{
    type: 'info' | 'warning' | 'critical';
    message: string;
  }>;
}