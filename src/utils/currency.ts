// Utilidades para manejo de monedas
export const EXCHANGE_RATE = 520; // 1 USD = 520 CRC (actualizable)

export const formatCurrency = (amount: number, currency: 'USD' | 'CRC'): string => {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  }
  return `₡${amount.toFixed(0)}`;
};

export const convertCurrency = (amount: number, from: 'USD' | 'CRC', to: 'USD' | 'CRC'): number => {
  if (from === to) return amount;
  
  if (from === 'USD' && to === 'CRC') {
    return amount * EXCHANGE_RATE;
  }
  
  if (from === 'CRC' && to === 'USD') {
    return amount / EXCHANGE_RATE;
  }
  
  return amount;
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};