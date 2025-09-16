import { Table } from './Table';
import { Order } from './Order';
import { MenuItem } from './MenuItem';
import { CashRegister, Payment, DailyRecord, Currency, MenuItem as IMenuItem, Expense, ClosureEditData, ClosureOperationResult, ClosureValidation, FinancialStats } from '../../types';
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

  // ==========================================
  // 🛡️ RECOVERY SYSTEM - DETECCIÓN Y REPARACIÓN
  // ==========================================

  /**
   * Detectar estados inconsistentes en el sistema
   */
  detectInconsistentStates(): Array<{
    type: 'empty_order' | 'orphan_table' | 'missing_order';
    tableNumber: number;
    orderId?: string;
    table?: any;
    order?: any;
    message: string;
  }> {
    console.log('🔍 Detectando estados inconsistentes...');
    
    const issues: any[] = [];
    
    // 👻 PROBLEMA 1: Mesas ocupadas sin orden o con orden vacía
    this.tables.forEach(table => {
      if (table.status === 'occupied') {
        if (!table.currentOrder) {
          // Mesa ocupada sin orden
          issues.push({
            type: 'orphan_table',
            tableNumber: table.number,
            table: table,
            message: `Mesa ${table.number} está ocupada pero no tiene orden asignada`
          });
        } else if (table.currentOrder.items.length === 0 || table.currentOrder.total === 0) {
          // Mesa ocupada con orden vacía
          issues.push({
            type: 'empty_order',
            tableNumber: table.number,
            orderId: table.currentOrder.id,
            table: table,
            order: table.currentOrder,
            message: `Mesa ${table.number} tiene una orden vacía (${table.currentOrder.items.length} items, ₡${table.currentOrder.total})`
          });
        }
      }
    });

    // 🔍 PROBLEMA 2: Órdenes huérfanas (sin mesa asignada)
    this.orders.forEach(order => {
      const table = this.getTableByNumber(order.tableNumber);
      if (!table || table.currentOrder?.id !== order.id) {
        issues.push({
          type: 'missing_order',
          tableNumber: order.tableNumber,
          orderId: order.id,
          order: order,
          message: `Orden ${order.id} no está correctamente asignada a mesa ${order.tableNumber}`
        });
      }
    });

    console.log(`🔍 Detectados ${issues.length} problemas:`, issues.map(i => i.message));
    return issues;
  }

  /**
   * Reparar estados inconsistentes automáticamente
   */
  repairInconsistentStates(): {
    fixed: number;
    actions: string[];
  } {
    console.log('🔧 Reparando estados inconsistentes...');
    
    const issues = this.detectInconsistentStates();
    const actions: string[] = [];
    let fixed = 0;

    issues.forEach(issue => {
      switch (issue.type) {
        case 'orphan_table':
          // Mesa ocupada sin orden → liberar mesa
          const orphanTable = this.getTableByNumber(issue.tableNumber);
          if (orphanTable) {
            orphanTable.free();
            actions.push(`Mesa ${issue.tableNumber} liberada (estaba ocupada sin orden)`);
            fixed++;
          }
          break;
          
        case 'missing_order':
          // Orden sin mesa → eliminar orden huérfana
          if (issue.orderId) {
            this.orders.delete(issue.orderId);
            actions.push(`Orden huérfana ${issue.orderId} eliminada`);
            fixed++;
          }
          break;
          
        // Las órdenes vacías no se auto-reparan, requieren decisión manual
      }
    });

    if (fixed > 0) {
      this.saveToStorage();
    }

    console.log(`✅ Reparación automática completada: ${fixed} problemas corregidos`);
    return { fixed, actions };
  }

  // ==========================================
  // 🔧 MÉTODOS DE RECUPERACIÓN MANUAL
  // ==========================================

  /**
   * Liberar mesa manteniendo la orden (para casos de error)
   */
  freeTable(tableNumber: number): void {
    console.log('🆓 Liberando mesa:', tableNumber);
    
    const table = this.getTableByNumber(tableNumber);
    if (!table) {
      throw new Error(`Mesa ${tableNumber} no encontrada`);
    }

    table.free();
    this.saveToStorage();
    console.log(`✅ Mesa ${tableNumber} liberada`);
  }

  /**
   * Cancelar orden completamente y liberar mesa
   */
  cancelOrderAndFreeTable(orderId: string): boolean {
    console.log('🗑️ Cancelando orden y liberando mesa:', orderId);
    
    const order = this.orders.get(orderId);
    if (!order) {
      console.warn('⚠️ Orden no encontrada:', orderId);
      return false;
    }

    // Encontrar y liberar la mesa
    const table = this.getTableByNumber(order.tableNumber);
    if (table) {
      table.free();
      console.log(`✅ Mesa ${table.number} liberada`);
    }

    // Eliminar la orden
    this.orders.delete(orderId);
    this.saveToStorage();
    
    console.log('✅ Orden cancelada y mesa liberada');
    return true;
  }

  /**
   * Resetear orden manteniendo mesa ocupada
   */
  resetOrder(orderId: string): Order | null {
    console.log('🔄 Reseteando orden:', orderId);
    
    const order = this.orders.get(orderId);
    if (!order) {
      console.warn('⚠️ Orden no encontrada para resetear:', orderId);
      return null;
    }

    // Crear nueva orden limpia para la misma mesa
    const newOrder = new Order(order.tableNumber, 'Orden reseteada');
    
    // Reemplazar orden anterior
    this.orders.delete(orderId);
    this.orders.set(newOrder.id, newOrder);
    
    // Actualizar mesa con nueva orden
    const table = this.getTableByNumber(order.tableNumber);
    if (table) {
      table.currentOrder = newOrder;
    }
    
    this.saveToStorage();
    
    console.log(`✅ Orden reseteada. Nueva orden: ${newOrder.id}`);
    return newOrder;
  }

  // 🔥 MÉTODO CORREGIDO - NO BORRAR EXPENSES
  openCashRegister(openingCashCRC: number, openingCashUSD: number): void {
    console.log('🏦 Abriendo caja registradora...');
    
    // 🧹 LIMPIAR SOLO DATOS OPERATIVOS DEL DÍA ANTERIOR
    console.log('🧹 Limpiando datos operativos...');
    
    // 🗑️ LIMPIAR ÓRDENES DEL DÍA ANTERIOR (temporal)
    this.orders.clear();
    console.log('✅ Órdenes del día anterior eliminadas');
    
    // 🗑️ LIMPIAR PAGOS DEL DÍA ANTERIOR (temporal)
    this.payments = [];
    console.log('✅ Pagos del día anterior eliminados');
    
    // 🔥 CRÍTICO: NO borrar expenses - estos persisten por fecha específica
    // this.expenses.clear(); // ❌ COMENTADO - expenses se mantienen
    console.log('📅 Expenses conservados (persisten por fecha específica)');
    
    // 🍽️ LIBERAR TODAS LAS MESAS (estado limpio)
    this.tables.forEach(table => {
      if (table.status !== 'available') {
        table.free();
      }
    });
    console.log('✅ Todas las mesas liberadas');

    // 🔥 INICIALIZAR CAJA NUEVA CON DATOS EN CERO
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
    
    console.log('✅ Caja abierta - Expenses conservados para análisis histórico');
  }

  // 🔥 MÉTODO closeCashRegister CORREGIDO CON FECHAS EXACTAS Y CAPTURA DE ÓRDENES
  closeCashRegister(): DailyRecord {
    console.log('🔒 Cerrando caja registradora...');
    
    // 🔥 CAPTURAR ÓRDENES DEL DÍA ANTES DEL RESET
    const todaysOrdersDetails = this.getTodaysOrders()
      .filter(order => order.status === 'paid')
      .map(order => ({
        orderId: order.id,
        tableNumber: order.tableNumber,
        items: order.items.map(item => ({
          // 🔥 CORREGIR ACCESO A PROPIEDADES - manejar diferentes estructuras
          name: item.product?.name || item.name || 'Item desconocido',
          quantity: item.quantity,
          price: item.product?.price || item.price || 0
        })),
        total: order.total,
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
        paymentMethod: 'cash' as 'cash' | 'card' // TODO: Determinar basado en payment real
      }));

    console.log(`🔥 Capturadas ${todaysOrdersDetails.length} órdenes del día`);

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
      closedAt: new Date().toISOString(),
      
      // 🔥 NUEVO: ÓRDENES PROCESADAS DEL DÍA
      ordersDetails: todaysOrdersDetails
    };

    // 💾 GUARDAR EN HISTORIAL PRIMERO (con datos reales)
    this.saveToClosure(record);

    // 🧹 AHORA SÍ RESETEAR COMPLETAMENTE PARA PRÓXIMO DÍA (PERO NO EXPENSES)
    console.log('🧹 Reseteando sistema operativo...');
    
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
    
    // 🔥 CRÍTICO: NO limpiar expenses - persisten para análisis histórico
    console.log('📅 Expenses conservados para análisis histórico');
    
    console.log('🍽️ Liberando todas las mesas...');
    this.tables.forEach(table => {
      if (table.status !== 'available') {
        table.free();
      }
    });

    // 💾 GUARDAR ESTADO LIMPIO
    this.saveToStorage();
    
    console.log('✅ Caja cerrada - Órdenes procesadas guardadas en el cierre');
    
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

  // ==========================================
  // 🔥 NUEVO: GESTIÓN QUINCENAL DE REPORTES FINANCIEROS
  // ==========================================

  /**
   * Obtener fechas de los últimos N cierres (días operados reales)
   * @param count Número de cierres a obtener (15 para quincenal, 30 para mensual)
   */
  private getLastClosureDates(count: number): { startDate: string; endDate: string; closures: any[] } {
    console.log(`📊 Obteniendo fechas de los últimos ${count} cierres...`);
    
    try {
      const history = JSON.parse(localStorage.getItem('fischer_closure_history') || '[]');
      const sortedHistory = history
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, count); // Tomar los últimos N cierres

      if (sortedHistory.length === 0) {
        const today = getClosureDateString();
        return { startDate: today, endDate: today, closures: [] };
      }

      const endDate = sortedHistory[0].date; // Más reciente
      const startDate = sortedHistory[sortedHistory.length - 1].date; // Más antiguo
      
      console.log(`📊 Período real: ${startDate} a ${endDate} (${sortedHistory.length} días operados)`);
      
      return { startDate, endDate, closures: sortedHistory };
    } catch (error) {
      console.error('❌ Error obteniendo fechas de cierres:', error);
      const today = getClosureDateString();
      return { startDate: today, endDate: today, closures: [] };
    }
  }

  /**
   * Estadísticas financieras mejoradas - SOLO QUINCENAL Y MENSUAL
   * @param period 'biweekly' (15 cierres) o 'month' (30 cierres)
   */
  getFinancialStats(period: 'biweekly' | 'month'): FinancialStats {
    console.log(`📊 Calculando stats financieros para período: ${period}`);
    
    // 🔥 LÓGICA QUINCENAL: Basada en cierres reales, no días calendario
    const closuresCount = period === 'biweekly' ? 15 : 30;
    const { startDate, endDate, closures } = this.getLastClosureDates(closuresCount);
    
    // 💰 INGRESOS: Suma de todos los cierres reales
    const totalIncome = closures.reduce((sum, record) => {
      const crcSales = record.totalSalesCRC || 0;
      const usdSales = (record.totalSalesUSD || 0) * 520; // Convertir a CRC
      return sum + crcSales + usdSales;
    }, 0);
    
    // 💸 GASTOS: Solo de las fechas donde realmente operamos
    const expenses = this.getExpensesByPeriod(startDate, endDate);
    const totalExpenses = expenses.reduce((sum, expense) => {
      const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
      return sum + amountInCRC;
    }, 0);
    
    // 📊 DESGLOSE DE GASTOS
    const totalGastos = expenses
      .filter(e => e.type === 'gasto')
      .reduce((sum, e) => sum + (e.currency === 'USD' ? e.amount * 520 : e.amount), 0);
    
    const totalInversiones = expenses
      .filter(e => e.type === 'inversion')
      .reduce((sum, e) => sum + (e.currency === 'USD' ? e.amount * 520 : e.amount), 0);
    
    // 📈 MÉTRICAS CALCULADAS
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const ordersCount = closures.reduce((sum, record) => sum + (record.totalOrders || 0), 0);
    const averageOrderValue = ordersCount > 0 ? totalIncome / ordersCount : 0;
    const dailyAverageIncome = closures.length > 0 ? totalIncome / closures.length : 0;
    const dailyAverageExpenses = closures.length > 0 ? totalExpenses / closures.length : 0;
    
    // 📊 GASTOS POR CATEGORÍA
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(expense => {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0;
      }
      const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
      expensesByCategory[expense.category] += amountInCRC;
    });
    
    // 🏆 TOP CATEGORÍAS
    const topExpenseCategories = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // 🚨 ALERTAS INTELIGENTES
    const alerts: Array<{ type: 'info' | 'warning' | 'critical'; message: string }> = [];
    
    // Alerta: Sin datos suficientes
    if (closures.length < (period === 'biweekly' ? 10 : 20)) {
      alerts.push({
        type: 'info',
        message: `Solo ${closures.length} días operados de ${closuresCount} esperados. Datos parciales.`
      });
    }
    
    // Alerta: Gastos vs Ingresos
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
    if (expenseRatio > 50) {
      alerts.push({
        type: 'critical',
        message: `CRÍTICO: Gastos representan ${expenseRatio.toFixed(1)}% de ingresos.`
      });
    } else if (expenseRatio > 35) {
      alerts.push({
        type: 'warning',
        message: `Gastos representan ${expenseRatio.toFixed(1)}% de ingresos (alto).`
      });
    }
    
    // Alerta: Pérdidas
    if (netProfit < 0) {
      alerts.push({
        type: 'critical',
        message: `Pérdida neta de ₡${Math.abs(netProfit).toLocaleString()} en el período.`
      });
    }
    
    // Alerta: Baja rentabilidad
    if (profitMargin > 0 && profitMargin < 10) {
      alerts.push({
        type: 'warning',
        message: `Margen de ganancia bajo: ${profitMargin.toFixed(1)}%. Meta: >15%.`
      });
    }
    
    // Determinar eficiencia
    let efficiency: 'excelente' | 'buena' | 'mejorable';
    if (profitMargin >= 20) {
      efficiency = 'excelente';
    } else if (profitMargin >= 10) {
      efficiency = 'buena';
    } else {
      efficiency = 'mejorable';
    }
    
    const result: FinancialStats = {
      period,
      startDate,
      endDate,
      totalIncome,
      ordersCount,
      averageOrderValue,
      closuresCount: closures.length,
      totalExpenses,
      expensesCount: expenses.length,
      totalGastos,
      totalInversiones,
      netProfit,
      profitMargin,
      efficiency,
      dailyAverageIncome,
      dailyAverageExpenses,
      expensesByCategory,
      topExpenseCategories,
      alerts
    };
    
    console.log(`📊 Stats calculados - ${period}: ₡${totalIncome.toLocaleString()} ingresos, ₡${totalExpenses.toLocaleString()} gastos, ${profitMargin.toFixed(1)}% margen`);
    
    return result;
  }

  // ==========================================
  // 🔥 NUEVO: SISTEMA CRUD PARA CIERRES
  // ==========================================

  /**
   * Validar datos de un cierre antes de editar
   */
  private validateClosureData(data: ClosureEditData): ClosureValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validaciones críticas
    if (data.openingCashCRC !== undefined && data.openingCashCRC < 0) {
      errors.push('El efectivo de apertura CRC no puede ser negativo');
    }
    
    if (data.openingCashUSD !== undefined && data.openingCashUSD < 0) {
      errors.push('El efectivo de apertura USD no puede ser negativo');
    }
    
    if (data.closingCashCRC !== undefined && data.closingCashCRC < 0) {
      errors.push('El efectivo de cierre CRC no puede ser negativo');
    }
    
    if (data.closingCashUSD !== undefined && data.closingCashUSD < 0) {
      errors.push('El efectivo de cierre USD no puede ser negativo');
    }
    
    // Validaciones de advertencia
    if (data.openingCashCRC !== undefined && data.closingCashCRC !== undefined) {
      if (data.closingCashCRC < data.openingCashCRC) {
        warnings.push('El efectivo de cierre es menor al de apertura (posible error)');
      }
    }
    
    if (data.openingCashUSD !== undefined && data.closingCashUSD !== undefined) {
      if (data.closingCashUSD < data.openingCashUSD) {
        warnings.push('El efectivo USD de cierre es menor al de apertura (posible error)');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Editar un registro de cierre existente
   */
  editClosureRecord(closureId: string, editData: ClosureEditData): ClosureOperationResult {
    console.log(`✏️ Editando cierre: ${closureId}`);
    
    try {
      // Validar datos de entrada
      const validation = this.validateClosureData(editData);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Errores de validación: ${validation.errors.join(', ')}`
        };
      }
      
      // Cargar historial
      const history = JSON.parse(localStorage.getItem('fischer_closure_history') || '[]');
      const recordIndex = history.findIndex((record: any) => record.id === closureId);
      
      if (recordIndex === -1) {
        return {
          success: false,
          message: 'Registro de cierre no encontrado'
        };
      }
      
      // Crear registro actualizado
      const originalRecord = history[recordIndex];
      const updatedRecord = {
        ...originalRecord,
        ...editData,
        updatedAt: new Date().toISOString(),
        editHistory: [
          ...(originalRecord.editHistory || []),
          {
            timestamp: new Date().toISOString(),
            changes: editData,
            reason: editData.notes || 'Corrección manual'
          }
        ]
      };
      
      // Recalcular campos derivados si es necesario
      if (editData.openingCashCRC !== undefined || editData.closingCashCRC !== undefined) {
        updatedRecord.cashDifferenceCRC = updatedRecord.closingCashCRC - updatedRecord.openingCashCRC;
      }
      
      if (editData.openingCashUSD !== undefined || editData.closingCashUSD !== undefined) {
        updatedRecord.cashDifferenceUSD = updatedRecord.closingCashUSD - updatedRecord.openingCashUSD;
      }
      
      // Actualizar en el historial
      history[recordIndex] = updatedRecord;
      localStorage.setItem('fischer_closure_history', JSON.stringify(history));
      
      console.log(`✅ Cierre editado exitosamente: ${closureId}`);
      
      return {
        success: true,
        message: `Cierre actualizado exitosamente. ${validation.warnings.length > 0 ? 'Advertencias: ' + validation.warnings.join(', ') : ''}`,
        updatedRecord
      };
      
    } catch (error) {
      console.error('❌ Error editando cierre:', error);
      return {
        success: false,
        message: 'Error interno al editar el cierre'
      };
    }
  }

  /**
   * Eliminar un registro de cierre
   */
  deleteClosureRecord(closureId: string, reason: string = 'Eliminado por usuario'): ClosureOperationResult {
    console.log(`🗑️ Eliminando cierre: ${closureId}, razón: ${reason}`);
    
    try {
      // Cargar historial
      const history = JSON.parse(localStorage.getItem('fischer_closure_history') || '[]');
      const recordIndex = history.findIndex((record: any) => record.id === closureId);
      
      if (recordIndex === -1) {
        return {
          success: false,
          message: 'Registro de cierre no encontrado'
        };
      }
      
      const recordToDelete = history[recordIndex];
      
      // Verificar si es el único cierre del día (advertencia)
      const sameDay = history.filter((record: any) => record.date === recordToDelete.date);
      if (sameDay.length === 1) {
        console.warn(`⚠️ Eliminando el único cierre del día: ${recordToDelete.date}`);
      }
      
      // Crear backup del registro eliminado (por si se necesita recuperar)
      const deletedRecord = {
        ...recordToDelete,
        deletedAt: new Date().toISOString(),
        deleteReason: reason
      };
      
      // Guardar en historial de eliminados (opcional, para auditoria)
      const deletedHistory = JSON.parse(localStorage.getItem('fischer_deleted_closures') || '[]');
      deletedHistory.push(deletedRecord);
      localStorage.setItem('fischer_deleted_closures', JSON.stringify(deletedHistory));
      
      // Eliminar del historial principal
      history.splice(recordIndex, 1);
      localStorage.setItem('fischer_closure_history', JSON.stringify(history));
      
      console.log(`✅ Cierre eliminado exitosamente: ${closureId}`);
      
      return {
        success: true,
        message: `Cierre eliminado exitosamente. Se guardó un backup para auditoría.`
      };
      
    } catch (error) {
      console.error('❌ Error eliminando cierre:', error);
      return {
        success: false,
        message: 'Error interno al eliminar el cierre'
      };
    }
  }

  /**
   * Obtener historial de cierres eliminados (para auditoría)
   */
  getDeletedClosures(): any[] {
    try {
      return JSON.parse(localStorage.getItem('fischer_deleted_closures') || '[]');
    } catch (error) {
      console.error('❌ Error cargando cierres eliminados:', error);
      return [];
    }
  }

  /**
   * Restaurar un cierre eliminado
   */
  restoreClosureRecord(deletedClosureId: string): ClosureOperationResult {
    console.log(`🔄 Restaurando cierre eliminado: ${deletedClosureId}`);
    
    try {
      // Cargar historial de eliminados
      const deletedHistory = JSON.parse(localStorage.getItem('fischer_deleted_closures') || '[]');
      const recordIndex = deletedHistory.findIndex((record: any) => record.id === deletedClosureId);
      
      if (recordIndex === -1) {
        return {
          success: false,
          message: 'Registro eliminado no encontrado'
        };
      }
      
      const recordToRestore = { ...deletedHistory[recordIndex] };
      
      // Limpiar campos de eliminación
      delete recordToRestore.deletedAt;
      delete recordToRestore.deleteReason;
      recordToRestore.restoredAt = new Date().toISOString();
      
      // Restaurar al historial principal
      const history = JSON.parse(localStorage.getItem('fischer_closure_history') || '[]');
      history.push(recordToRestore);
      history.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      localStorage.setItem('fischer_closure_history', JSON.stringify(history));
      
      // Eliminar del historial de eliminados
      deletedHistory.splice(recordIndex, 1);
      localStorage.setItem('fischer_deleted_closures', JSON.stringify(deletedHistory));
      
      console.log(`✅ Cierre restaurado exitosamente: ${deletedClosureId}`);
      
      return {
        success: true,
        message: 'Cierre restaurado exitosamente',
        updatedRecord: recordToRestore
      };
      
    } catch (error) {
      console.error('❌ Error restaurando cierre:', error);
      return {
        success: false,
        message: 'Error interno al restaurar el cierre'
      };
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
  // 🔥 GESTIÓN COMPLETA DE EXPENSES - CORREGIDA
  // ==========================================

  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
    console.log('💸 Agregando expense:', expense.description, `₡${expense.amount}`);
    
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      // 🔥 USAR FECHA ESPECÍFICA del parámetro o hoy por defecto
      date: expense.date || getClosureDateString(),
      // 🔥 AGREGAR createdAt OBLIGATORIO (timestamp exacto)
      createdAt: new Date().toISOString(),
    };
    
    // 💾 Guardar en expenses map (persistente)
    this.expenses.set(newExpense.id, newExpense);
    this.saveToStorage();
    
    console.log(`✅ Expense guardado con fecha: ${newExpense.date} (ID: ${newExpense.id})`);
    return newExpense;
  }

  updateExpense(expense: Expense): void {
    console.log('✏️ Actualizando expense:', expense.description);
    
    // 🔥 Asegurar que tenga updatedAt
    const updatedExpense = {
      ...expense,
      updatedAt: new Date().toISOString()
    };
    
    this.expenses.set(updatedExpense.id, updatedExpense);
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

  // 🔥 MÉTODO MEJORADO: Obtener expenses por rango de fechas
  getExpensesByPeriod(startDate: string, endDate: string): Expense[] {
    console.log(`📊 Buscando expenses entre ${startDate} y ${endDate}`);
    
    const expenses = this.getExpenses().filter(expense => {
      return expense.date >= startDate && expense.date <= endDate;
    });
    
    console.log(`📊 Encontrados ${expenses.length} expenses en el período`);
    return expenses;
  }

  getTodaysExpenses(): Expense[] {
    const today = getClosureDateString();
    return this.getExpenses().filter(expense => expense.date === today);
  }

  getExpensesByCategory(category?: string): Record<string, number> {
    const expenses = category 
      ? this.getExpenses().filter(expense => expense.category === category)
      : this.getExpenses();
      
    return expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      // Convertir a CRC para uniformidad
      const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
      acc[expense.category] += amountInCRC;
      return acc;
    }, {} as Record<string, number>);
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
    return Array.from(this.tables.values()).map(table => ({
      id: table.id,
      number: table.number,
      seats: table.seats,
      status: table.status,
      currentOrder: table.currentOrder ? {
        id: table.currentOrder.id,
        tableNumber: table.currentOrder.tableNumber,
        items: table.currentOrder.items,
        status: table.currentOrder.status,
        subtotal: table.currentOrder.subtotal,
        serviceCharge: table.currentOrder.serviceCharge,
        total: table.currentOrder.total,
        notes: table.currentOrder.notes,
        createdAt: table.currentOrder.createdAt,
        updatedAt: table.currentOrder.updatedAt
      } : null
    }));
  }

  private serializeOrders(): any[] {
    return Array.from(this.orders.values()).map(order => ({
      id: order.id,
      tableNumber: order.tableNumber,
      items: order.items,
      status: order.status,
      subtotal: order.subtotal,
      serviceCharge: order.serviceCharge,
      total: order.total,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));
  }

  private serializeMenuItems(): any[] {
    return Array.from(this.menuItems.values()).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      image: item.image
    }));
  }

  private serializeExpenses(): any[] {
    return Array.from(this.expenses.values()).map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      type: expense.type,
      date: expense.date,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      notes: expense.notes
    }));
  }

  private loadFromStorage(): void {
    try {
      const data = loadFromStorage(STORAGE_KEYS.RESTAURANT_DATA);
      if (!data) {
        console.log('📦 No hay datos guardados, usando configuración por defecto');
        return;
      }

      console.log('📦 Cargando datos guardados...');

      // Cargar mesas
      if (data.tables) {
        this.tables.clear();
        data.tables.forEach((tableData: any) => {
          const table = new Table(tableData.number, tableData.seats);
          table.id = tableData.id;
          table.status = tableData.status;
          
          if (tableData.currentOrder) {
            const order = new Order(
              tableData.currentOrder.tableNumber,
              tableData.currentOrder.notes
            );
            Object.assign(order, tableData.currentOrder);
            table.currentOrder = order;
          }
          
          this.tables.set(table.id, table);
        });
      }

      // Cargar órdenes
      if (data.orders) {
        this.orders.clear();
        data.orders.forEach((orderData: any) => {
          const order = new Order(orderData.tableNumber, orderData.notes);
          Object.assign(order, orderData);
          this.orders.set(order.id, order);
        });
      }

      // Cargar items del menú
      if (data.menuItems) {
        this.menuItems.clear();
        data.menuItems.forEach((itemData: any) => {
          const menuItem = new MenuItem(itemData);
          this.menuItems.set(menuItem.id, menuItem);
        });
      }

      // Cargar caja registradora
      if (data.cashRegister) {
        this.cashRegister = { ...this.cashRegister, ...data.cashRegister };
      }

      // Cargar pagos
      if (data.payments) {
        this.payments = data.payments;
      }

      // 🔥 CARGAR EXPENSES CORREGIDO
      if (data.expenses) {
        this.expenses.clear();
        data.expenses.forEach((expenseData: any) => {
          // 🔥 Asegurar que todos los campos estén presentes
          const expense: Expense = {
            id: expenseData.id,
            description: expenseData.description,
            amount: expenseData.amount,
            currency: expenseData.currency,
            category: expenseData.category,
            type: expenseData.type,
            date: expenseData.date,
            createdAt: expenseData.createdAt || new Date().toISOString(),
            updatedAt: expenseData.updatedAt,
            notes: expenseData.notes
          };
          this.expenses.set(expense.id, expense);
        });
      }

      console.log('✅ Datos cargados exitosamente');
      console.log(`📊 Expenses cargados: ${this.expenses.size}`);
      
    } catch (error) {
      console.error('🚨 Error cargando datos:', error);
    }
  }

  // MÉTODOS PÚBLICOS PARA EL HOOK
  getCashRegister(): CashRegister {
    return this.cashRegister;
  }

  getPayments(): Payment[] {
    return this.payments;
  }

  // 🔥 MÉTODO CORREGIDO - MANEJAR FECHAS STRING Y DATE
  getTodaysOrders(): Order[] {
    const today = getClosureDateString();
    return Array.from(this.orders.values()).filter(order => {
      // ✅ MANEJAR TANTO Date COMO string correctamente
      let orderDate: string;
      
      if (order.createdAt instanceof Date) {
        // Si es Date object, convertir usando función helper
        orderDate = getClosureDateString(order.createdAt);
      } else if (typeof order.createdAt === 'string') {
        // Si es string (cargado desde localStorage), parsear y convertir
        orderDate = getClosureDateString(new Date(order.createdAt));
      } else {
        // Fallback a hoy si no hay createdAt válido
        console.warn('⚠️ Orden sin createdAt válido:', order.id);
        orderDate = today;
      }
      
      const isToday = orderDate === today;
      
      // Log solo para debugging en desarrollo
      if (process.env.NODE_ENV === 'development' && isToday) {
        console.log('📅 Orden de hoy encontrada:', {
          orderId: order.id,
          orderDate,
          today,
          createdAt: order.createdAt,
          total: order.total
        });
      }
      
      return isToday;
    });
  }

  getClosureHistory(): DailyRecord[] {
    try {
      const history = JSON.parse(localStorage.getItem('fischer_closure_history') || '[]');
      return history.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('Error loading closure history:', error);
      return [];
    }
  }

  refreshData(): void {
    console.log('🔄 Refrescando datos...');
    this.loadFromStorage();
  }
}