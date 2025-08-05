import { MenuItem as IMenuItem } from '../../types';
import { generateId } from '../utils';

export class MenuItem implements IMenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  description?: string;
  image?: string;

  constructor(data: Omit<IMenuItem, 'id'> & { id?: string }) {
    this.id = data.id || generateId();
    this.name = data.name;
    this.price = data.price;
    this.category = data.category;
    this.available = data.available;
    this.description = data.description;
    this.image = data.image;
  }

  // Actualizar precio
  updatePrice(newPrice: number): void {
    if (newPrice <= 0) {
      throw new Error('El precio debe ser mayor a 0');
    }
    this.price = newPrice;
  }

  // Cambiar disponibilidad
  toggleAvailability(): void {
    this.available = !this.available;
  }

  // Actualizar información
  update(data: Partial<Omit<IMenuItem, 'id'>>): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.price !== undefined) this.updatePrice(data.price);
    if (data.category !== undefined) this.category = data.category;
    if (data.available !== undefined) this.available = data.available;
    if (data.description !== undefined) this.description = data.description;
    if (data.image !== undefined) this.image = data.image;
  }

  // Validar datos del item
  validate(): boolean {
    return (
      this.name.trim().length > 0 &&
      this.price > 0 &&
      this.category.trim().length > 0
    );
  }

  // Convertir a objeto plano
  toJSON(): IMenuItem {
    return {
      id: this.id,
      name: this.name,
      price: this.price,
      category: this.category,
      available: this.available,
      description: this.description,
      image: this.image
    };
  }

  // Crear desde objeto plano
  static fromJSON(data: IMenuItem): MenuItem {
    return new MenuItem(data);
  }
}