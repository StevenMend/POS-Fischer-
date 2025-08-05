// Tipos principales del sistema POS
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

export interface CashRegister {
  totalUSD: number;
  totalCRC: number;
  dailySalesUSD: number;
  dailySalesCRC: number;
  ordersCount: number;
}

export interface Currency {
  symbol: string;
  code: 'USD' | 'CRC';
  exchangeRate: number;
}
