import { Table as ITable, Order } from '../../types';
import { generateId } from '../utils';

export class Table implements ITable {
  id: string;
  number: number;
  seats: number;
  status: ITable['status'];
  currentOrder?: Order;
  x?: number;
  y?: number;

  constructor(number: number, seats: number = 4, x?: number, y?: number) {
    this.id = generateId();
    this.number = number;
    this.seats = seats;
    this.status = 'available';
    this.x = x;
    this.y = y;
  }

  // Ocupar mesa con una orden
  occupy(order: Order): void {
    if (this.status !== 'available') {
      throw new Error(`Mesa ${this.number} no está disponible`);
    }
    this.status = 'occupied';
    this.currentOrder = order;
  }

  // Liberar mesa
  free(): void {
    this.status = 'available';
    this.currentOrder = undefined;
  }

  // Reservar mesa
  reserve(): void {
    if (this.status !== 'available') {
      throw new Error(`Mesa ${this.number} no está disponible para reservar`);
    }
    this.status = 'reserved';
  }

  // Marcar mesa para limpieza
  markForCleaning(): void {
    this.status = 'cleaning';
    this.currentOrder = undefined;
  }

  // Cambiar estado de la mesa
  updateStatus(newStatus: ITable['status']): void {
    this.status = newStatus;
    if (newStatus === 'available' || newStatus === 'cleaning') {
      this.currentOrder = undefined;
    }
  }

  // Verificar si la mesa está disponible
  isAvailable(): boolean {
    return this.status === 'available';
  }

  // Verificar si la mesa está ocupada
  isOccupied(): boolean {
    return this.status === 'occupied';
  }

  // Obtener información de la orden actual
  getCurrentOrderSummary(): string {
    if (!this.currentOrder) {
      return 'Sin orden';
    }
    return this.currentOrder.getSummary();
  }

  // Obtener total de la orden actual
  getCurrentOrderTotal(): number {
    return this.currentOrder?.total || 0;
  }

  // Validar mesa
  validate(): boolean {
    return (
      this.number > 0 &&
      this.seats > 0 &&
      ['available', 'occupied', 'reserved', 'cleaning'].includes(this.status)
    );
  }

  // Convertir a objeto plano
  toJSON(): ITable {
    return {
      id: this.id,
      number: this.number,
      seats: this.seats,
      status: this.status,
      currentOrder: this.currentOrder,
      x: this.x,
      y: this.y
    };
  }

  // Crear desde objeto plano
  static fromJSON(data: ITable): Table {
    const table = new Table(data.number, data.seats, data.x, data.y);
    table.id = data.id;
    table.status = data.status;
    table.currentOrder = data.currentOrder;
    return table;
  }
}