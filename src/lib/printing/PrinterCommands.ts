// lib/printing/PrinterCommands.ts
/**
 * Comandos ESC/POS para impresoras térmicas
 * Compatibles con MPR-300 y la mayoría de impresoras térmicas estándar
 * 
 * Documentación: https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/
 */

/**
 * COMANDOS BÁSICOS
 */
export const ESC_POS = {
  // Control básico
  INIT: '\x1B\x40',           // Inicializar impresora (reset)
  LF: '\x0A',                 // Line Feed (salto de línea)
  CR: '\x0D',                 // Carriage Return
  FF: '\x0C',                 // Form Feed
  
  // Alineación de texto
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_RIGHT: '\x1B\x61\x02',
  
  // Formato de texto
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  
  UNDERLINE_ON: '\x1B\x2D\x01',
  UNDERLINE_OFF: '\x1B\x2D\x00',
  
  DOUBLE_HEIGHT_ON: '\x1B\x21\x10',
  DOUBLE_WIDTH_ON: '\x1B\x21\x20',
  DOUBLE_SIZE_ON: '\x1B\x21\x30',  // Alto + Ancho
  NORMAL_SIZE: '\x1B\x21\x00',
  
  // Corte de papel
  CUT_FULL: '\x1D\x56\x00',        // Corte completo
  CUT_PARTIAL: '\x1D\x56\x01',     // Corte parcial (deja pestaña)
  
  // Densidad de impresión (0-5, default 3)
  DENSITY: (level: number) => `\x1D\x7C${String.fromCharCode(Math.max(0, Math.min(5, level)))}`,
  
  // Code Page (encoding)
  CODE_PAGE_437: '\x1B\x74\x00',   // USA Standard
  CODE_PAGE_850: '\x1B\x74\x03',   // Multilingual Latin-1
  CODE_PAGE_858: '\x1B\x74\x13',   // Euro
} as const;

/**
 * COMANDOS AVANZADOS
 */
export const ESC_POS_ADVANCED = {
  // Cajón de dinero (cash drawer)
  OPEN_DRAWER: '\x1B\x70\x00\x19\xFA',
  
  // Buzzer/Beeper
  BEEP: '\x1B\x42\x05\x09',
  
  // QR Code (si la impresora lo soporta)
  QR_CODE: (data: string) => {
    const qrData = new TextEncoder().encode(data);
    const pL = qrData.length % 256;
    const pH = Math.floor(qrData.length / 256);
    return `\x1D\x28\x6B\x04\x00\x31\x41\x32\x00` + // Model 2
           `\x1D\x28\x6B\x03\x00\x31\x43\x05` +     // Size 5
           `\x1D\x28\x6B${String.fromCharCode(pL + 3, pH)}\x31\x50\x30${data}` + // Store data
           `\x1D\x28\x6B\x03\x00\x31\x51\x30`;      // Print
  },
  
  // Barcode (Code128)
  BARCODE_CODE128: (data: string) => {
    return `\x1D\x6B\x49${String.fromCharCode(data.length)}${data}`;
  },
} as const;

/**
 * HELPERS PARA CONSTRUCCIÓN DE COMANDOS
 */

/**
 * Crea un divisor de línea (guiones)
 */
export function createDivider(width: number = 32, char: string = '-'): string {
  return char.repeat(width);
}

/**
 * Crea una línea en blanco
 */
export function createBlankLine(count: number = 1): string {
  return ESC_POS.LF.repeat(count);
}

/**
 * Crea encabezado centrado y en negritas
 */
export function createHeader(text: string): string {
  return ESC_POS.ALIGN_CENTER +
         ESC_POS.BOLD_ON +
         text +
         ESC_POS.BOLD_OFF +
         ESC_POS.LF;
}

/**
 * Crea subencabezado centrado normal
 */
export function createSubheader(text: string): string {
  return ESC_POS.ALIGN_CENTER +
         text +
         ESC_POS.LF;
}

/**
 * Crea línea de texto normal (izquierda)
 */
export function createTextLine(text: string): string {
  return ESC_POS.ALIGN_LEFT + text + ESC_POS.LF;
}

/**
 * Crea línea de texto en negritas
 */
export function createBoldLine(text: string): string {
  return ESC_POS.ALIGN_LEFT +
         ESC_POS.BOLD_ON +
         text +
         ESC_POS.BOLD_OFF +
         ESC_POS.LF;
}

/**
 * Crea línea de total en negritas y tamaño doble
 */
export function createTotalLine(text: string): string {
  return ESC_POS.ALIGN_LEFT +
         ESC_POS.BOLD_ON +
         ESC_POS.DOUBLE_SIZE_ON +
         text +
         ESC_POS.NORMAL_SIZE +
         ESC_POS.BOLD_OFF +
         ESC_POS.LF;
}

/**
 * Crea footer centrado
 */
export function createFooter(text: string): string {
  return ESC_POS.ALIGN_CENTER +
         text +
         ESC_POS.LF;
}

/**
 * Builder pattern para comandos complejos
 */
export class CommandBuilder {
  private commands: string = '';

  init(): this {
    this.commands += ESC_POS.INIT;
    return this;
  }

  setCodePage(): this {
    this.commands += ESC_POS.CODE_PAGE_437;
    return this;
  }

  setDensity(level: number): this {
    this.commands += ESC_POS.DENSITY(level);
    return this;
  }

  alignLeft(): this {
    this.commands += ESC_POS.ALIGN_LEFT;
    return this;
  }

  alignCenter(): this {
    this.commands += ESC_POS.ALIGN_CENTER;
    return this;
  }

  alignRight(): this {
    this.commands += ESC_POS.ALIGN_RIGHT;
    return this;
  }

  bold(enable: boolean = true): this {
    this.commands += enable ? ESC_POS.BOLD_ON : ESC_POS.BOLD_OFF;
    return this;
  }

  doubleSize(enable: boolean = true): this {
    this.commands += enable ? ESC_POS.DOUBLE_SIZE_ON : ESC_POS.NORMAL_SIZE;
    return this;
  }

  text(text: string): this {
    this.commands += text;
    return this;
  }

  line(text?: string): this {
    if (text) this.commands += text;
    this.commands += ESC_POS.LF;
    return this;
  }

  divider(width: number = 32): this {
    this.commands += createDivider(width) + ESC_POS.LF;
    return this;
  }

  blankLines(count: number = 1): this {
    this.commands += createBlankLine(count);
    return this;
  }

  cut(partial: boolean = false): this {
    this.commands += partial ? ESC_POS.CUT_PARTIAL : ESC_POS.CUT_FULL;
    return this;
  }

  openDrawer(): this {
    this.commands += ESC_POS_ADVANCED.OPEN_DRAWER;
    return this;
  }

  beep(): this {
    this.commands += ESC_POS_ADVANCED.BEEP;
    return this;
  }

  build(): string {
    return this.commands;
  }

  buildBytes(): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(this.commands);
  }
}

/**
 * Ejemplo de uso:
 * 
 * const receipt = new CommandBuilder()
 *   .init()
 *   .setCodePage()
 *   .setDensity(3)
 *   .alignCenter()
 *   .bold()
 *   .text('SODA FISCHER')
 *   .line()
 *   .bold(false)
 *   .text('27 de Abril, Santa Cruz')
 *   .line()
 *   .divider()
 *   .alignLeft()
 *   .text('Mesa: 5')
 *   .line()
 *   .cut()
 *   .build();
 */