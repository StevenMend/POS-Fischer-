// Constantes del sistema
const EXCHANGE_RATE = 520; // 1 USD = 520 CRC
const SERVICE_CHARGE_RATE = 0.10; // 10%

const CURRENCY_SYMBOLS = {
  CRC: '₡',
  USD: '$'
} as const;

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

// Formatear fecha
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Formatear hora
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-CR', {
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