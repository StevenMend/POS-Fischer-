// lib/printing/CharacterEncoding.ts
/**
 * Sistema de codificación de caracteres para impresoras térmicas ESC/POS
 * Soluciona problemas con: ñ, á, é, í, ó, ú, ¢ y otros caracteres especiales
 * 
 * PROBLEMA: Las impresoras térmicas MPR-300 usan Code Page 437 (CP437) o Latin-1
 * pero JavaScript usa UTF-8, causando caracteres corruptos.
 * 
 * SOLUCIÓN: Mapear caracteres UTF-8 a sus equivalentes en CP437/Latin-1
 */

// Mapa de caracteres especiales españoles a CP437/Latin-1
const CP437_MAP: Record<string, number> = {
  // Vocales con tilde
  'á': 0xA0, 'é': 0x82, 'í': 0xA1, 'ó': 0xA2, 'ú': 0xA3,
  'Á': 0xB5, 'É': 0x90, 'Í': 0xD6, 'Ó': 0xE0, 'Ú': 0xE9,
  
  // Ñ/ñ
  'ñ': 0xA4, 'Ñ': 0xA5,
  
  // Símbolo de colón costarricense (usamos ¢ = cent)
  '₡': 0x9B, // Cent en CP437
  '¢': 0x9B,
  ',': 0x2C,
  '.': 0x2E,
  
  // Otros caracteres útiles
  '¿': 0xA8, '¡': 0xAD,
  'ü': 0x81, 'Ü': 0x9A,
  
  // Símbolos de moneda
  '$': 0x24, // Dólar (ASCII estándar)
};

// Fallback: reemplazos ASCII seguros si no se puede mapear
const ASCII_FALLBACK: Record<string, string> = {
  'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
  'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
  'ñ': 'n', 'Ñ': 'N',
  'ü': 'u', 'Ü': 'U',
  '₡': 'C', '¢': 'C',
  '¿': '?', '¡': '!',
};

/**
 * Codifica texto UTF-8 a bytes CP437 para impresoras térmicas
 * USO: Antes de enviar texto a la impresora
 */
export function encodeToCP437(text: string): Uint8Array {
  const bytes: number[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = char.charCodeAt(0);
    
    // ASCII básico (0-127) pasa directo
    if (charCode < 128) {
      bytes.push(charCode);
      continue;
    }
    
    // Caracteres especiales mapeados
    if (CP437_MAP[char] !== undefined) {
      bytes.push(CP437_MAP[char]);
      continue;
    }
    
    // Fallback: reemplazar por ASCII
    const fallback = ASCII_FALLBACK[char];
    if (fallback) {
      for (let j = 0; j < fallback.length; j++) {
        bytes.push(fallback.charCodeAt(j));
      }
      continue;
    }
    
    // Último recurso: ignorar o usar '?'
    bytes.push(0x3F); // '?'
  }
  
  return new Uint8Array(bytes);
}

/**
 * Limpia texto eliminando caracteres no imprimibles
 * USO: Sanitizar texto antes de codificar
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Control chars
    .replace(/\s+/g, ' ') // Multiple spaces
    .trim();
}

/**
 * Normaliza moneda para impresión
 * Convierte ₡ y $ a formato seguro
 */
export function normalizeCurrency(amount: number, currency: 'CRC' | 'USD'): string {
  const symbol = currency === 'USD' ? '$' : '₡';
  const rounded = Math.round(amount);
  
  // 🔥 FIX: Formatear sin comas para evitar problemas de encoding
  // En impresoras térmicas es mejor sin separadores
  return `${symbol}${rounded}`;
}

/**
 * Trunca texto a ancho específico (en caracteres)
 * USO: Asegurar que líneas no excedan ancho del papel
 */
export function truncateText(text: string, maxWidth: number, ellipsis = '...'): string {
  if (text.length <= maxWidth) return text;
  return text.substring(0, maxWidth - ellipsis.length) + ellipsis;
}

/**
 * Pad texto para alineación (izq/der)
 * USO: Crear columnas alineadas en recibos
 */
export function padText(text: string, width: number, align: 'left' | 'right' = 'left'): string {
  if (text.length >= width) return truncateText(text, width);
  
  const padding = ' '.repeat(width - text.length);
  return align === 'left' ? text + padding : padding + text;
}

/**
 * Crea línea de dos columnas (nombre - precio)
 * USO: Items de recibo con precio alineado a la derecha
 */
export function createTwoColumnLine(left: string, right: string, width: number): string {
  const rightWidth = right.length;
  const leftWidth = width - rightWidth - 1; // -1 para espacio
  
  if (left.length > leftWidth) {
    left = truncateText(left, leftWidth);
  }
  
  return padText(left, leftWidth) + ' ' + right;
}

/**
 * Comando ESC/POS para configurar Code Page
 * Enviar ANTES de cualquier texto con caracteres especiales
 */
export function getCodePageCommand(): Uint8Array {
  // ESC t n - Seleccionar Code Page
  // n = 0: CP437 (USA, Standard Europe)
  // n = 3: PC850 (Multilingual)
  return new Uint8Array([0x1B, 0x74, 0x00]); // CP437
}

/**
 * Test de compatibilidad de caracteres
 * USO: Debug - verificar qué caracteres se pueden imprimir
 */
export function getCharacterCompatibilityTest(): string {
  return [
    'TEST DE CARACTERES ESPECIALES',
    '================================',
    'Vocales: á é í ó ú',
    'Mayúsculas: Á É Í Ó Ú',
    'Eñe: ñ Ñ',
    'Colones: ₡1000 ¢500',
    'Dólares: $10 $25.50',
    'Símbolos: ¿Hola? ¡Pura vida!',
    'Números: 1234567890',
    'Especiales: @ # % & * ( )',
    '================================',
  ].join('\n');
}