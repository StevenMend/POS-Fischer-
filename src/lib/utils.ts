// Constantes del sistema
const EXCHANGE_RATE = 490; // 1 USD = 520 CRC
const SERVICE_CHARGE_RATE = 0.10; // 10%

const CURRENCY_SYMBOLS = {
  CRC: '₡',
  USD: '$'
} as const;

// 🔥 TIMEZONE DE COSTA RICA
const CR_TIMEZONE = 'America/Costa_Rica';

// Formateo de moneda
export const formatCurrency = (amount: number, currency: 'CRC' | 'USD'): string => {
  const symbol = CURRENCY_SYMBOLS[currency];
  if (currency === 'USD') {
    return `${symbol}${amount.toFixed(2)}`;
  }
  return `${symbol}${Math.round(amount).toLocaleString('es-CR')}`;
};

// Conversión de moneda
export const convertCurrency = (amount: number, from: 'CRC' | 'USD', to: 'CRC' | 'USD'): number => {
  if (from === to) return amount;
  
  if (from === 'USD' && to === 'CRC') {
    return amount * EXCHANGE_RATE;
  }
  
  if (from === 'CRC' && to === 'USD') {
    return amount / EXCHANGE_RATE;
  }
  
  return amount;
};

// Generar ID único
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Calcular cargo por servicio
export const calculateServiceCharge = (subtotal: number): number => {
  return subtotal * SERVICE_CHARGE_RATE;
};

// Calcular total con servicio
export const calculateTotal = (subtotal: number): number => {
  return subtotal + calculateServiceCharge(subtotal);
};

// 🔥 SOLUCION DEFINITIVA: Fecha actual Costa Rica en formato YYYY-MM-DD
export const getClosureDateString = (): string => {
  // Crear fecha actual en timezone Costa Rica
  const now = new Date();
  
  // 🔥 SOLUCIÓN: Usar toLocaleDateString con timezone correcto
  const today = now.toLocaleDateString('en-CA', {
    timeZone: CR_TIMEZONE
  });
  
  // Verificar que sea hoy (miércoles 13 agosto 2025)
  console.log('📅 Fecha de cierre:', today);
  return today; // Formato YYYY-MM-DD automático con 'en-CA'
};

// 🔥 FORMATEAR FECHA PARA MOSTRAR (timezone Costa Rica)
export const formatDateCR = (dateString: string): string => {
  // Convertir YYYY-MM-DD a fecha local
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('es-CR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 🔥 LIMPIAR: Solo las funciones que realmente necesitamos
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-CR', {
    timeZone: CR_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calcular cambio
export const calculateChange = (total: number, received: number): number => {
  return Math.max(0, received - total);
};

// Validar cantidad de dinero
export const isValidAmount = (amount: number): boolean => {
  return amount > 0 && Number.isFinite(amount);
};

// 🔥 UTILIDADES PARA PERÍODOS (reportes)
export const getPeriodDates = (period: 'week' | 'month'): { startDate: string; endDate: string } => {
  const endDate = getClosureDateString(); // Hoy
  
  let startDate: string;
  
  if (period === 'week') {
    // Hace 7 días
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    startDate = weekAgo.toLocaleDateString('en-CA', { timeZone: CR_TIMEZONE });
  } else {
    // Primer día del mes actual
    const firstDay = new Date();
    firstDay.setDate(1);
    startDate = firstDay.toLocaleDateString('en-CA', { timeZone: CR_TIMEZONE });
  }
  
  return { startDate, endDate };
};