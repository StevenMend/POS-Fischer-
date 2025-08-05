import { Order as IOrder, OrderItem, MenuItem } from '../../types';
import { generateId, calculateServiceCharge, calculateTotal } from '../utils';

export class Order implements IOrder {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  subtotal: number;
  serviceCharge: number;
  total: number;
  status: IOrder['status'];
  createdAt: Date;
  updatedAt: Date;
  notes?: string;

  constructor(tableNumber: number, notes?: string) {
    this.id = generateId();
    this.tableNumber = tableNumber;
    this.items = [];
    this.subtotal = 0;
    this.serviceCharge = 0;
    this.total = 0;
    this.status = 'pending';
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.notes = notes;
  }

  // Agregar item a la orden
  addItem(menuItem: MenuItem, quantity: number = 1, notes?: string): void {
    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    if (!menuItem.available) {
      throw new Error('Este producto no está disponible');
    }

    // Buscar si el item ya existe
    const existingItemIndex = this.items.findIndex(
      item => item.menuItem.id === menuItem.id && item.notes === notes
    );

    if (existingItemIndex >= 0) {
      // Si existe, aumentar cantidad
      this.items[existingItemIndex].quantity += quantity;
      this.items[existingItemIndex].subtotal = 
        this.items[existingItemIndex].quantity * menuItem.price;
    } else {
      // Si no existe, crear nuevo item
      const newItem: OrderItem = {
        id: generateId(),
        menuItem,
        quantity,
        notes,
        subtotal: quantity * menuItem.price
      };
      this.items.push(newItem);
    }

    this.recalculateTotal();
    this.updatedAt = new Date();
  }

  // Remover item de la orden
  removeItem(itemId: string): void {
    this.items = this.items.filter(item => item.id !== itemId);
    this.recalculateTotal();
    this.updatedAt = new Date();
  }

  // Actualizar cantidad de un item
  updateItemQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    const item = this.items.find(item => item.id === itemId);
    if (item) {
      item.quantity = quantity;
      item.subtotal = quantity * item.menuItem.price;
      this.recalculateTotal();
      this.updatedAt = new Date();
    }
  }

  // Actualizar notas de un item
  updateItemNotes(itemId: string, notes: string): void {
    const item = this.items.find(item => item.id === itemId);
    if (item) {
      item.notes = notes;
      this.updatedAt = new Date();
    }
  }

  // Recalcular totales
  private recalculateTotal(): void {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.serviceCharge = calculateServiceCharge(this.subtotal);
    this.total = calculateTotal(this.subtotal);
  }

  // Cambiar estado de la orden
  updateStatus(newStatus: IOrder['status']): void {
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  // Confirmar orden
  confirm(): void {
    if (this.items.length === 0) {
      throw new Error('No se puede confirmar una orden vacía');
    }
    this.updateStatus('confirmed');
  }

  // Limpiar orden
  clear(): void {
    this.items = [];
    this.recalculateTotal();
    this.updatedAt = new Date();
  }

  // Obtener resumen de la orden
  getSummary(): string {
    return this.items
      .map(item => `${item.menuItem.name} x${item.quantity}`)
      .join(', ');
  }

  // Validar orden
  validate(): boolean {
    return this.items.length > 0 && this.items.every(item => 
      item.quantity > 0 && item.menuItem.available
    );
  }

  // Convertir a objeto plano
  toJSON(): IOrder {
    return {
      id: this.id,
      tableNumber: this.tableNumber,
      items: this.items,
      subtotal: this.subtotal,
      serviceCharge: this.serviceCharge,
      total: this.total,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      notes: this.notes
    };
  }

  // Crear desde objeto plano
  static fromJSON(data: IOrder): Order {
    const order = new Order(data.tableNumber, data.notes);
    order.id = data.id;
    order.items = data.items;
    order.subtotal = data.subtotal;
    order.serviceCharge = data.serviceCharge;
    order.total = data.total;
    order.status = data.status;
    order.createdAt = new Date(data.createdAt);
    order.updatedAt = new Date(data.updatedAt);
    return order;
  }
}