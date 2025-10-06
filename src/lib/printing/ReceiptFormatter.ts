// lib/printing/ReceiptFormatter.ts - VERSIÓN ARREGLADA
import { Order, Payment, CompanyInfo, PrinterSettings, OrderDiscount, SplitPayment } from '../../types';
import { CommandBuilder, ESC_POS, createDivider } from './PrinterCommands';
import { 
  encodeToCP437, 
  sanitizeText, 
  normalizeCurrency, 
  createTwoColumnLine, 
  truncateText,
  getCodePageCommand 
} from './CharacterEncoding';

interface ReceiptFormatOptions {
  company: CompanyInfo;
  order: Order;
  payment: Payment;
  receiptNumber: string;
  timestamp: Date;
  settings: PrinterSettings;
  splitInfo?: {
    partNumber: number;
    totalParts: number;
    amount: number;
  };
}

export function formatStandardReceipt(options: ReceiptFormatOptions): Uint8Array {
  const { company, order, payment, receiptNumber, timestamp, settings } = options;
  const width = settings.paperWidth || 32;
  
  const builder = new CommandBuilder()
    .init()
    .setCodePage()
    .setDensity(settings.density);

  // Header
  builder
    .alignCenter()
    .bold()
    .text(sanitizeText(company.name))
    .line()
    .bold(false)
    .text(sanitizeText(company.address))
    .line();
  
  if (company.phone) {
    builder.text(`Tel: ${sanitizeText(company.phone)}`).line();
  }
  
  builder.blankLines(1);

  // Info
  builder
    .alignLeft()
    .text(`Recibo #: ${receiptNumber}`)
    .line()
    .text(`Mesa: ${order.tableNumber}`)
    .line()
    .text(`Fecha: ${timestamp.toLocaleDateString('es-CR')}`)
    .line()
    .text(`Hora: ${timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
  })}`)
    .line()
    .blankLines(1);

  // Productos
  builder
    .bold()
    .text('PRODUCTOS')
    .line()
    .bold(false)
    .divider(width);

  order.items?.forEach((item: any) => {
    const name = sanitizeText(item.product?.name || item.menuItem?.name || 'Producto');
    const qty = item.quantity;
    const price = item.product?.price || item.menuItem?.price || 0;
    const subtotal = item.subtotal;

    builder.text(truncateText(name, width)).line();
    
    const qtyLine = createTwoColumnLine(
      `  ${qty} x ${normalizeCurrency(price, 'CRC')}`,
      normalizeCurrency(subtotal, 'CRC'),
      width
    );
    builder.text(qtyLine).line();
    
    if (item.notes) {
      builder.text(`  ${sanitizeText(truncateText(item.notes, width - 2))}`).line();
    }
  });

  builder.divider(width);
  
  // Totales
  const subtotalLine = createTwoColumnLine(
    'Subtotal:',
    normalizeCurrency(order.subtotal, 'CRC'),
    width
  );
  builder.text(subtotalLine).line();

  if (order.discount) {
    formatDiscountSection(builder, order, width);
  } else {
    const serviceLine = createTwoColumnLine(
      'Servicio (10%):',
      normalizeCurrency(order.serviceCharge, 'CRC'),
      width
    );
    builder.text(serviceLine).line();
  }

  builder
    .bold()
    .doubleSize()
    .text(createTwoColumnLine('TOTAL:', normalizeCurrency(order.total, 'CRC'), width))
    .line()
    .bold(false)
    .doubleSize(false)
    .blankLines(1);

  formatPaymentSection(builder, payment, width);

  // Footer
  builder
    .alignCenter()
    .text('Gracias por su visita!')
    .line()
    .text('Vuelva pronto')
    .line()
    .blankLines(3);

  if (settings.cutPaper) {
    builder.cut();
  }

  const commandString = builder.build();
  return encodeToCP437(commandString);
}

/**
 * NUEVA VERSIÓN: Genera UN SOLO ticket con división clara
 */
export function formatSplitReceipts(options: ReceiptFormatOptions): Uint8Array[] {
  const { order } = options;
  
  if (!order.splitPayments || order.splitPayments.length === 0) {
    return [formatStandardReceipt(options)];
  }

  // Generar UN SOLO TICKET con división clara
  return [formatSingleSplitReceipt(options)];
}

/**
 * Genera UN ticket mostrando TODAS las divisiones de forma organizada
 */
function formatSingleSplitReceipt(options: ReceiptFormatOptions): Uint8Array {
  const { company, order, payment, receiptNumber, timestamp, settings } = options;
  const width = settings.paperWidth || 32;
  
  const builder = new CommandBuilder()
    .init()
    .setCodePage()
    .setDensity(settings.density);

  // === HEADER ===
  builder
    .alignCenter()
    .bold()
    .text(sanitizeText(company.name))
    .line()
    .bold(false)
    .text(sanitizeText(company.address))
    .line();
  
  if (company.phone) {
    builder.text(`Tel: ${sanitizeText(company.phone)}`).line();
  }
  
  builder.blankLines(1);

  // === INDICADOR GRANDE DE CUENTA DIVIDIDA ===
  builder
    .alignCenter()
    .bold()
    .doubleSize()
    .text('*** CUENTA DIVIDIDA ***')
    .line()
    .bold(false)
    .doubleSize(false)
    .blankLines(1);

  // === INFO DEL RECIBO ===
  builder
    .alignLeft()
    .text(`Recibo #: ${receiptNumber}`)
    .line()
    .text(`Mesa: ${order.tableNumber}`)
    .line()
    .text(`Fecha: ${timestamp.toLocaleDateString('es-CR')}`)
    .line()
    .text(`Hora: ${timestamp.toLocaleTimeString('en-US', { 
  hour: '2-digit', 
  minute: '2-digit',
  hour12: true 
})}`)
    .line()
    .blankLines(1);

  // === PRODUCTOS (mostramos todos UNA SOLA VEZ) ===
  builder
    .bold()
    .text('PRODUCTOS')
    .line()
    .bold(false)
    .divider(width);

  order.items?.forEach((item: any) => {
    const name = sanitizeText(item.product?.name || item.menuItem?.name || 'Producto');
    const qty = item.quantity;
    const price = item.product?.price || item.menuItem?.price || 0;
    const subtotal = item.subtotal;

    builder.text(truncateText(name, width)).line();
    
    const qtyLine = createTwoColumnLine(
      `  ${qty} x ${normalizeCurrency(price, 'CRC')}`,
      normalizeCurrency(subtotal, 'CRC'),
      width
    );
    builder.text(qtyLine).line();
  });

  // === TOTALES GENERALES ===
  builder.divider(width);
  
  const subtotalLine = createTwoColumnLine(
    'Subtotal:',
    normalizeCurrency(order.subtotal, 'CRC'),
    width
  );
  builder.text(subtotalLine).line();

  const serviceLine = createTwoColumnLine(
    'Servicio (10%):',
    normalizeCurrency(order.serviceCharge, 'CRC'),
    width
  );
  builder.text(serviceLine).line();

  builder
    .bold()
    .text(createTwoColumnLine('TOTAL:', normalizeCurrency(order.total, 'CRC'), width))
    .line()
    .bold(false)
    .blankLines(2);

  // === SECCIÓN DE DIVISIÓN (mejorada) ===
  builder
    .alignCenter()
    .text('='.repeat(width))
    .line()
    .bold()
    .text('DIVISION DE LA CUENTA')
    .line()
    .bold(false)
    .text('='.repeat(width))
    .line()
    .blankLines(1)
    .alignLeft();

  // Mostrar cada parte de forma clara
  order.splitPayments.forEach((split: any, index: number) => {
    builder
      .bold()
      .text(`PARTE ${split.personNumber} DE ${order.splitPayments.length}`)
      .line()
      .bold(false);
    
    // Monto a pagar con formato destacado
    const amountLine = createTwoColumnLine(
      'Monto a pagar:',
      normalizeCurrency(split.amount, split.currency || 'CRC'),
      width
    );
    builder.text(amountLine).line();
    
    // Método de pago
    const methodText = split.method === 'cash' ? 'Efectivo' : 'Tarjeta';
    builder.text(`Metodo: ${methodText}`).line();
    
    // Separador entre partes (excepto la última)
    if (index < order.splitPayments.length - 1) {
      builder.text('-'.repeat(width)).line();
    }
  });

  builder.blankLines(2);

  // === FOOTER ===
  builder
    .alignCenter()
    .text('Gracias por su visita!')
    .line()
    .text('Vuelva pronto')
    .line()
    .blankLines(3);

  if (settings.cutPaper) {
    builder.cut();
  }

  const commandString = builder.build();
  return encodeToCP437(commandString);
}

function formatDiscountSection(builder: CommandBuilder, order: Order, width: number): void {
  if (!order.discount) return;

  const discount = order.discount;

  if (discount.type === 'remove_service') {
    builder
      .text(createTwoColumnLine(
        'Servicio (10%):',
        normalizeCurrency(order.serviceCharge, 'CRC'),
        width
      ))
      .line()
      .text(createTwoColumnLine(
        '** SIN SERVICIO **',
        `-${normalizeCurrency(discount.amount, 'CRC')}`,
        width
      ))
      .line();
  } else {
    builder
      .text(createTwoColumnLine(
        'Servicio (10%):',
        normalizeCurrency(order.serviceCharge, 'CRC'),
        width
      ))
      .line();
    
    const discountLabel = getDiscountLabel(discount.type);
    builder
      .text(createTwoColumnLine(
        `Descuento (${discountLabel}):`,
        `-${normalizeCurrency(discount.amount, 'CRC')}`,
        width
      ))
      .line();
  }

  if (discount.reason) {
    builder
      .text(`Razon: ${sanitizeText(truncateText(discount.reason, width - 7))}`)
      .line();
  }

  if (discount.authorizedBy) {
    builder
      .text(`Autorizado: ${discount.authorizedBy.substring(0, 4)}`)
      .line();
  }

  builder.blankLines(1);
}

function formatPaymentSection(builder: CommandBuilder, payment: Payment, width: number): void {
  builder
    .bold()
    .text('PAGO')
    .line()
    .bold(false)
    .divider(width);

  const methodText = payment.method === 'cash' ? 'Efectivo' : 'Tarjeta';
  const currencySymbol = payment.currency === 'USD' ? '$' : '₡';
  
  builder
    .text(createTwoColumnLine(
      `Metodo: ${methodText} (${payment.currency})`,
      '',
      width
    ))
    .line();
  
  builder
    .text(createTwoColumnLine(
      'Monto:',
      `${currencySymbol}${Math.round(payment.amount)}`,
      width
    ))
    .line();
  
  if (payment.method === 'cash' && payment.received && payment.change !== undefined) {
    builder
      .text(createTwoColumnLine(
        'Recibido:',
        `${currencySymbol}${Math.round(payment.received)}`,
        width
      ))
      .line();
    
    if (payment.change > 0) {
      builder
        .bold()
        .text(createTwoColumnLine(
          'Cambio:',
          `${currencySymbol}${Math.round(payment.change)}`,
          width
        ))
        .line()
        .bold(false);
    }
  }
  
  builder.blankLines(1);
}

function getDiscountLabel(type: OrderDiscount['type']): string {
  switch (type) {
    case 'remove_service': return '10% Servicio';
    case 'percent_10': return '10%';
    case 'percent_12': return '12%';
    case 'percent_15': return '15%';
    default: return 'N/A';
  }
}

export function generateReceipt(options: ReceiptFormatOptions): Uint8Array[] {
  if (options.order.splitPayments && options.order.splitPayments.length > 0) {
    return formatSplitReceipts(options);
  }
  return [formatStandardReceipt(options)];
}

export function generateReceiptPreview(options: ReceiptFormatOptions): string {
  const { company, order, payment, receiptNumber, timestamp } = options;
  
  let preview = '';
  preview += '================================\n';
  preview += `${company.name}\n`;
  preview += `${company.address}\n`;
  if (company.phone) preview += `Tel: ${company.phone}\n`;
  preview += '================================\n\n';
  
  // Indicador si es cuenta dividida
  if (order.splitPayments && order.splitPayments.length > 0) {
    preview += '*** CUENTA DIVIDIDA ***\n\n';
  }
  
  preview += `Recibo #: ${receiptNumber}\n`;
  preview += `Mesa: ${order.tableNumber}\n`;
  preview += `Fecha: ${timestamp.toLocaleDateString('es-CR')}\n`;
  preview += `Hora: ${timestamp.toLocaleTimeString('es-CR')}\n\n`;
  
  preview += 'PRODUCTOS\n';
  preview += '--------------------------------\n';
  
  order.items?.forEach((item: any) => {
    const name = item.product?.name || item.menuItem?.name || 'Producto';
    preview += `${name}\n`;
    preview += `  ${item.quantity} x ₡${item.subtotal / item.quantity} = ₡${item.subtotal}\n`;
    if (item.notes) preview += `  ${item.notes}\n`;
  });
  
  preview += '--------------------------------\n';
  preview += `Subtotal: ₡${Math.round(order.subtotal)}\n`;
  
  if (order.discount) {
    if (order.discount.type === 'remove_service') {
      preview += `Servicio (10%): ₡${Math.round(order.serviceCharge)}\n`;
      preview += `** SIN SERVICIO **: -₡${Math.round(order.discount.amount)}\n`;
    } else {
      preview += `Servicio (10%): ₡${Math.round(order.serviceCharge)}\n`;
      preview += `Descuento: -₡${Math.round(order.discount.amount)}\n`;
    }
    if (order.discount.reason) {
      preview += `Razon: ${order.discount.reason}\n`;
    }
  } else {
    preview += `Servicio (10%): ₡${Math.round(order.serviceCharge)}\n`;
  }
  
  preview += `\nTOTAL: ₡${Math.round(order.total)}\n\n`;
  
  // Si hay splits, mostrar división
  if (order.splitPayments && order.splitPayments.length > 0) {
    preview += '================================\n';
    preview += 'DIVISION DE LA CUENTA\n';
    preview += '================================\n\n';
    
    order.splitPayments.forEach((split: any) => {
      preview += `PARTE ${split.personNumber} DE ${order.splitPayments.length}\n`;
      preview += `Monto a pagar: ₡${Math.round(split.amount)}\n`;
      preview += `Metodo: ${split.method === 'cash' ? 'Efectivo' : 'Tarjeta'}\n`;
      preview += '--------------------------------\n';
    });
  } else {
    // Pago normal
    preview += 'PAGO\n';
    preview += '--------------------------------\n';
    const method = payment.method === 'cash' ? 'Efectivo' : 'Tarjeta';
    preview += `Metodo: ${method} (${payment.currency})\n`;
    preview += `Monto: ${payment.currency === 'USD' ? '$' : '₡'}${Math.round(payment.amount)}\n`;
    
    if (payment.method === 'cash' && payment.received) {
      preview += `Recibido: ${payment.currency === 'USD' ? '$' : '₡'}${Math.round(payment.received)}\n`;
      if (payment.change && payment.change > 0) {
        preview += `Cambio: ${payment.currency === 'USD' ? '$' : '₡'}${Math.round(payment.change)}\n`;
      }
    }
  }
  
  preview += '\n================================\n';
  preview += 'Gracias por su visita!\n';
  preview += 'Vuelva pronto\n';
  preview += '================================\n';
  
  return preview;
}