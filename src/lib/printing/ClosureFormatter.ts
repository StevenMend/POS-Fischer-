// lib/printing/ClosureFormatter.ts
import { DailyRecord, Expense, Order } from '../types';
import { CommandBuilder, createDivider } from './PrinterCommands';
import { 
  encodeToCP437, 
  sanitizeText, 
  normalizeCurrency, 
  createTwoColumnLine,
  truncateText 
} from './CharacterEncoding';

/**
 * FORMATEADOR DE CIERRE DIARIO
 * Genera reportes de cierre de caja con:
 * - Resumen ejecutivo
 * - Estado de caja (apertura/cierre/diferencia)
 * - Desglose de ventas (efectivo/tarjeta)
 * - Top productos vendidos
 * - Gastos del día
 * - Órdenes detalladas (opcional)
 */

interface ClosureFormatOptions {
  record: DailyRecord;
  expenses?: Expense[];
  orders?: Order[];
  includeDetailedOrders?: boolean;
  paperWidth?: number;
}

/**
 * Genera reporte de cierre COMPLETO
 */
export function formatClosureReport(options: ClosureFormatOptions): Uint8Array {
  const { record, expenses = [], orders = [], includeDetailedOrders = false, paperWidth = 32 } = options;
  
  const builder = new CommandBuilder()
    .init()
    .setCodePage()
    .setDensity(3);

  // === HEADER PRINCIPAL ===
  builder
    .alignCenter()
    .bold()
    .doubleSize()
    .text('CIERRE DE CAJA')
    .line()
    .bold(false)
    .doubleSize(false)
    .text(sanitizeText('SODA FISCHER'))
    .line()
    .text(new Date(record.date).toLocaleDateString('es-CR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
    .line()
    .blankLines(1)
    .divider(paperWidth);

  // === 1. RESUMEN EJECUTIVO ===
  formatExecutiveSummary(builder, record, expenses, paperWidth);

  // === 2. ESTADO DE CAJA ===
  formatCashStatus(builder, record, paperWidth);

  // === 3. DESGLOSE DE VENTAS ===
  formatSalesBreakdown(builder, record, paperWidth);

  // === 4. TOP PRODUCTOS (si hay órdenes detalladas) ===
  if (record.ordersDetails && record.ordersDetails.length > 0) {
    formatTopProducts(builder, record.ordersDetails, paperWidth);
  }

  // === 5. GASTOS DEL DÍA ===
  if (expenses.length > 0) {
    formatExpenses(builder, expenses, paperWidth);
  }

  // === 6. ÓRDENES DETALLADAS (OPCIONAL) ===
  if (includeDetailedOrders && record.ordersDetails && record.ordersDetails.length > 0) {
    formatDetailedOrders(builder, record.ordersDetails, paperWidth);
  }

  // === FOOTER ===
  builder
    .blankLines(1)
    .alignCenter()
    .text('================================')
    .line()
    .text('FIN DEL REPORTE')
    .line()
    .text(new Date().toLocaleTimeString('en-US', { 
  hour: '2-digit', 
  minute: '2-digit',
  hour12: true 
}))
    .line()
    .blankLines(3)
    .cut();

  const commandString = builder.build();
  return encodeToCP437(commandString);
}

/**
 * 1. RESUMEN EJECUTIVO
 */
function formatExecutiveSummary(
  builder: CommandBuilder, 
  record: DailyRecord, 
  expenses: Expense[], 
  width: number
): void {
  builder
    .blankLines(1)
    .alignLeft()
    .bold()
    .text('1. RESUMEN EJECUTIVO')
    .line()
    .bold(false)
    .divider(width);

  // Ventas totales
  const totalSalesCRC = record.totalSalesCRC;
  const totalSalesUSD = record.totalSalesUSD;
  
  builder.text(createTwoColumnLine(
    'Ventas CRC:',
    normalizeCurrency(totalSalesCRC, 'CRC'),
    width
  )).line();
  
  if (totalSalesUSD > 0) {
    builder.text(createTwoColumnLine(
      'Ventas USD:',
      normalizeCurrency(totalSalesUSD, 'USD'),
      width
    )).line();
  }

  // Gastos totales
  const totalExpensesCRC = expenses
    .filter(e => e.currency === 'CRC')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalExpensesUSD = expenses
    .filter(e => e.currency === 'USD')
    .reduce((sum, e) => sum + e.amount, 0);

  if (expenses.length > 0) {
    builder.text(createTwoColumnLine(
      'Gastos CRC:',
      normalizeCurrency(totalExpensesCRC, 'CRC'),
      width
    )).line();
    
    if (totalExpensesUSD > 0) {
      builder.text(createTwoColumnLine(
        'Gastos USD:',
        normalizeCurrency(totalExpensesUSD, 'USD'),
        width
      )).line();
    }
  }

  // Ganancia neta
  builder.divider(width);
  const netProfitCRC = totalSalesCRC - totalExpensesCRC;
  
  builder
    .bold()
    .text(createTwoColumnLine(
      'GANANCIA NETA:',
      normalizeCurrency(netProfitCRC, 'CRC'),
      width
    ))
    .line()
    .bold(false);

  // Órdenes procesadas
  builder
    .blankLines(1)
    .text(createTwoColumnLine(
      'Ordenes:',
      record.totalOrders.toString(),
      width
    ))
    .line();

  // Ticket promedio
  const avgTicket = record.totalOrders > 0 ? totalSalesCRC / record.totalOrders : 0;
  builder
    .text(createTwoColumnLine(
      'Ticket Promedio:',
      normalizeCurrency(avgTicket, 'CRC'),
      width
    ))
    .line();
}

/**
 * 2. ESTADO DE CAJA
 */
function formatCashStatus(
  builder: CommandBuilder, 
  record: DailyRecord, 
  width: number
): void {
  builder
    .blankLines(1)
    .bold()
    .text('2. ESTADO DE CAJA')
    .line()
    .bold(false)
    .divider(width);

  // === CRC ===
  builder.bold().text('COLONES (CRC)').line().bold(false);
  
  builder.text(createTwoColumnLine(
    '  Apertura:',
    normalizeCurrency(record.openingCashCRC, 'CRC'),
    width
  )).line();
  
  builder.text(createTwoColumnLine(
    '  Ventas Efectivo:',
    normalizeCurrency(record.cashPaymentsCRC, 'CRC'),
    width
  )).line();
  
  const expectedCRC = record.openingCashCRC + record.cashPaymentsCRC;
  builder.text(createTwoColumnLine(
    '  Esperado:',
    normalizeCurrency(expectedCRC, 'CRC'),
    width
  )).line();
  
  builder.text(createTwoColumnLine(
    '  Cierre Real:',
    normalizeCurrency(record.closingCashCRC, 'CRC'),
    width
  )).line();
  
  const differenceCRC = record.closingCashCRC - expectedCRC;
  const diffLabel = differenceCRC >= 0 ? 'Sobrante:' : 'Faltante:';
  
  builder
    .bold()
    .text(createTwoColumnLine(
      `  ${diffLabel}`,
      normalizeCurrency(Math.abs(differenceCRC), 'CRC'),
      width
    ))
    .line()
    .bold(false);

  // === USD ===
  if (record.openingCashUSD > 0 || record.cashPaymentsUSD > 0 || record.closingCashUSD > 0) {
    builder.blankLines(1).bold().text('DOLARES (USD)').line().bold(false);
    
    builder.text(createTwoColumnLine(
      '  Apertura:',
      normalizeCurrency(record.openingCashUSD, 'USD'),
      width
    )).line();
    
    builder.text(createTwoColumnLine(
      '  Ventas Efectivo:',
      normalizeCurrency(record.cashPaymentsUSD, 'USD'),
      width
    )).line();
    
    const expectedUSD = record.openingCashUSD + record.cashPaymentsUSD;
    builder.text(createTwoColumnLine(
      '  Esperado:',
      normalizeCurrency(expectedUSD, 'USD'),
      width
    )).line();
    
    builder.text(createTwoColumnLine(
      '  Cierre Real:',
      normalizeCurrency(record.closingCashUSD, 'USD'),
      width
    )).line();
    
    const differenceUSD = record.closingCashUSD - expectedUSD;
    const diffLabelUSD = differenceUSD >= 0 ? 'Sobrante:' : 'Faltante:';
    
    builder
      .bold()
      .text(createTwoColumnLine(
        `  ${diffLabelUSD}`,
        normalizeCurrency(Math.abs(differenceUSD), 'USD'),
        width
      ))
      .line()
      .bold(false);
  }
}

/**
 * 3. DESGLOSE DE VENTAS
 */
function formatSalesBreakdown(
  builder: CommandBuilder, 
  record: DailyRecord, 
  width: number
): void {
  builder
    .blankLines(1)
    .bold()
    .text('3. DESGLOSE DE VENTAS')
    .line()
    .bold(false)
    .divider(width);

  // Efectivo
  builder.bold().text('EFECTIVO').line().bold(false);
  builder.text(createTwoColumnLine(
    '  CRC:',
    normalizeCurrency(record.cashPaymentsCRC, 'CRC'),
    width
  )).line();
  
  if (record.cashPaymentsUSD > 0) {
    builder.text(createTwoColumnLine(
      '  USD:',
      normalizeCurrency(record.cashPaymentsUSD, 'USD'),
      width
    )).line();
  }

  // Tarjeta
  builder.blankLines(1).bold().text('TARJETA').line().bold(false);
  builder.text(createTwoColumnLine(
    '  CRC:',
    normalizeCurrency(record.cardPaymentsCRC, 'CRC'),
    width
  )).line();
  
  if (record.cardPaymentsUSD > 0) {
    builder.text(createTwoColumnLine(
      '  USD:',
      normalizeCurrency(record.cardPaymentsUSD, 'USD'),
      width
    )).line();
  }

  // Total
  builder.blankLines(1).divider(width);
  builder
    .bold()
    .text(createTwoColumnLine(
      'TOTAL VENTAS:',
      normalizeCurrency(record.totalSalesCRC, 'CRC'),
      width
    ))
    .line()
    .bold(false);
}

/**
 * 4. TOP PRODUCTOS VENDIDOS
 */
function formatTopProducts(
  builder: CommandBuilder, 
  ordersDetails: DailyRecord['ordersDetails'], 
  width: number
): void {
  if (!ordersDetails || ordersDetails.length === 0) return;

  // Agrupar productos
  const productCounts = new Map<string, { count: number; revenue: number }>();
  
  ordersDetails.forEach(order => {
    order.items.forEach(item => {
      const existing = productCounts.get(item.name) || { count: 0, revenue: 0 };
      productCounts.set(item.name, {
        count: existing.count + item.quantity,
        revenue: existing.revenue + (item.price * item.quantity)
      });
    });
  });

  // Ordenar por cantidad vendida
  const topProducts = Array.from(productCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  if (topProducts.length === 0) return;

  builder
    .blankLines(1)
    .bold()
    .text('4. TOP 5 PRODUCTOS')
    .line()
    .bold(false)
    .divider(width);

  topProducts.forEach(([name, data], index) => {
    builder
      .text(`${index + 1}. ${sanitizeText(truncateText(name, width - 4))}`)
      .line()
      .text(createTwoColumnLine(
        `   Vendidos: ${data.count}`,
        normalizeCurrency(data.revenue, 'CRC'),
        width
      ))
      .line();
  });
}

/**
 * 5. GASTOS DEL DÍA
 */
function formatExpenses(
  builder: CommandBuilder, 
  expenses: Expense[], 
  width: number
): void {
  builder
    .blankLines(1)
    .bold()
    .text('5. GASTOS DEL DIA')
    .line()
    .bold(false)
    .divider(width);

  // Agrupar por categoría
  const byCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  Object.entries(byCategory).forEach(([category, items]) => {
    const totalCRC = items
      .filter(e => e.currency === 'CRC')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalUSD = items
      .filter(e => e.currency === 'USD')
      .reduce((sum, e) => sum + e.amount, 0);

    builder
      .bold()
      .text(sanitizeText(category.toUpperCase()))
      .line()
      .bold(false);

    items.forEach(expense => {
      const desc = truncateText(sanitizeText(expense.description), width - 12);
      const amount = normalizeCurrency(expense.amount, expense.currency);
      builder.text(createTwoColumnLine(`  ${desc}`, amount, width)).line();
    });

    // Subtotal por categoría
    if (totalCRC > 0) {
      builder.text(createTwoColumnLine(
        '  Subtotal CRC:',
        normalizeCurrency(totalCRC, 'CRC'),
        width
      )).line();
    }
    if (totalUSD > 0) {
      builder.text(createTwoColumnLine(
        '  Subtotal USD:',
        normalizeCurrency(totalUSD, 'USD'),
        width
      )).line();
    }
    
    builder.blankLines(1);
  });

  // Total general de gastos
  builder.divider(width);
  const totalExpensesCRC = expenses
    .filter(e => e.currency === 'CRC')
    .reduce((sum, e) => sum + e.amount, 0);

  builder
    .bold()
    .text(createTwoColumnLine(
      'TOTAL GASTOS:',
      normalizeCurrency(totalExpensesCRC, 'CRC'),
      width
    ))
    .line()
    .bold(false);
}

/**
 * 6. ÓRDENES DETALLADAS (OPCIONAL - PUEDE SER MUY LARGO)
 */
function formatDetailedOrders(
  builder: CommandBuilder, 
  ordersDetails: DailyRecord['ordersDetails'], 
  width: number
): void {
  if (!ordersDetails || ordersDetails.length === 0) return;

  builder
    .blankLines(1)
    .bold()
    .text('6. ORDENES DETALLADAS')
    .line()
    .bold(false)
    .divider(width);

  ordersDetails.forEach((order, index) => {
    builder
      .text(`Orden ${index + 1} - Mesa ${order.tableNumber}`)
      .line()
      .text(`  ${new Date(order.createdAt).toLocaleTimeString('en-US', { 
  hour: '2-digit', 
  minute: '2-digit',
  hour12: true 
})}`)
      .line();

    order.items.forEach(item => {
      builder.text(createTwoColumnLine(
        `  ${item.quantity}x ${sanitizeText(truncateText(item.name, width - 15))}`,
        normalizeCurrency(item.price * item.quantity, 'CRC'),
        width
      )).line();
    });

    const method = order.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta';
    builder
      .text(createTwoColumnLine(
        `  ${method}:`,
        normalizeCurrency(order.total, 'CRC'),
        width
      ))
      .line()
      .blankLines(1);
  });
}

/**
 * Genera preview de cierre para pantalla (texto plano)
 */
export function generateClosurePreview(options: ClosureFormatOptions): string {
  const { record, expenses = [] } = options;
  
  let preview = '================================\n';
  preview += 'CIERRE DE CAJA\n';
  preview += `${new Date(record.date).toLocaleDateString('es-CR')}\n`;
  preview += '================================\n\n';
  
  preview += 'RESUMEN EJECUTIVO\n';
  preview += `Ventas: ₡${Math.round(record.totalSalesCRC)}\n`;
  preview += `Ordenes: ${record.totalOrders}\n`;
  
  if (expenses.length > 0) {
    const totalExpenses = expenses
      .filter(e => e.currency === 'CRC')
      .reduce((sum, e) => sum + e.amount, 0);
    preview += `Gastos: ₡${Math.round(totalExpenses)}\n`;
    preview += `Ganancia: ₡${Math.round(record.totalSalesCRC - totalExpenses)}\n`;
  }
  
  preview += '\nESTADO DE CAJA (CRC)\n';
  preview += `Apertura: ₡${Math.round(record.openingCashCRC)}\n`;
  preview += `Cierre: ₡${Math.round(record.closingCashCRC)}\n`;
  
  const expected = record.openingCashCRC + record.cashPaymentsCRC;
  const diff = record.closingCashCRC - expected;
  preview += `Diferencia: ₡${Math.round(diff)}\n`;
  
  preview += '\n================================\n';
  preview += 'FIN DEL REPORTE\n';
  preview += '================================\n';
  
  return preview;
}