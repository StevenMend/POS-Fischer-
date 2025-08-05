// Constantes del sistema
export const EXCHANGE_RATE = 520; // 1 USD = 520 CRC
export const SERVICE_CHARGE_RATE = 0.10; // 10%
export const TAX_RATE = 0.13; // 13% IVA

export const CURRENCY_SYMBOLS = {
  CRC: '₡',
  USD: '$'
} as const;

export const TABLE_STATUSES = {
  available: { color: 'bg-green-500', text: 'Disponible' },
  occupied: { color: 'bg-red-500', text: 'Ocupada' },
  reserved: { color: 'bg-yellow-500', text: 'Reservada' },
  cleaning: { color: 'bg-gray-500', text: 'Limpieza' }
} as const;

export const ORDER_STATUSES = {
  pending: { color: 'bg-yellow-500', text: 'Pendiente' },
  confirmed: { color: 'bg-blue-500', text: 'Confirmada' },
  preparing: { color: 'bg-orange-500', text: 'Preparando' },
  ready: { color: 'bg-purple-500', text: 'Lista' },
  served: { color: 'bg-green-500', text: 'Servida' },
  paid: { color: 'bg-gray-500', text: 'Pagada' }
} as const;

export const MENU_CATEGORIES = [
  'Comidas Rápidas',
  'Bebidas Calientes',
  'Desayunos',
  'Arma tu Pinto',
  'Casados',
  'Mariscos',
  'Platillos',
  'Bebidas Frías'
] as const;

export const SAMPLE_MENU_ITEMS = [
  // Comidas Rápidas
  { id: '1', name: 'Hamburguesa', price: 3000, category: 'Comidas Rápidas', available: true, description: 'Hamburguesa completa' },
  { id: '2', name: 'Sandwich Carne', price: 2500, category: 'Comidas Rápidas', available: true, description: 'Sandwich de carne' },
  { id: '3', name: 'Sandwich Pollo', price: 2500, category: 'Comidas Rápidas', available: true, description: 'Sandwich de pollo' },
  { id: '4', name: 'Sandwich Jamón y Queso', price: 2000, category: 'Comidas Rápidas', available: true, description: 'Sandwich jamón y queso' },
  { id: '5', name: 'Nachos', price: 4000, category: 'Comidas Rápidas', available: true, description: 'Nachos con queso y jalapeños' },
  { id: '6', name: 'French Fries', price: 2000, category: 'Comidas Rápidas', available: true, description: 'Papas fritas crujientes' },

  // Bebidas Calientes
  { id: '7', name: 'Café Negro', price: 1000, category: 'Bebidas Calientes', available: true, description: 'Café negro tradicional' },
  { id: '8', name: 'Café con Leche', price: 1000, category: 'Bebidas Calientes', available: true, description: 'Café con leche' },
  { id: '9', name: 'Agua Dulce', price: 800, category: 'Bebidas Calientes', available: true, description: 'Agua dulce de tapa de dulce' },
  { id: '10', name: 'Chocolate', price: 1000, category: 'Bebidas Calientes', available: true, description: 'Chocolate caliente' },

  // Desayunos
  { id: '11', name: 'Pinto Fischer', price: 4500, category: 'Desayunos', available: true, description: 'Gallo pinto especial Fischer' },
  { id: '12', name: 'Pinto Completo', price: 3000, category: 'Desayunos', available: true, description: 'Gallo pinto completo' },
  { id: '13', name: 'Pinto Huevos Rancheros', price: 3000, category: 'Desayunos', available: true, description: 'Pinto con huevos rancheros' },
  { id: '14', name: 'Tortilla Aliñada', price: 3000, category: 'Desayunos', available: true, description: 'Tortilla aliñada tradicional' },
  { id: '15', name: 'Omelette', price: 2800, category: 'Desayunos', available: true, description: 'Omelette de huevos' },
  { id: '16', name: 'Maduro con Queso', price: 1800, category: 'Desayunos', available: true, description: 'Plátano maduro con queso' },

  // Arma tu Pinto
  { id: '17', name: 'Pinto Base', price: 1000, category: 'Arma tu Pinto', available: true, description: 'Gallo pinto base' },
  { id: '18', name: 'Huevos', price: 1200, category: 'Arma tu Pinto', available: true, description: 'Huevos preparados' },
  { id: '19', name: 'Queso', price: 700, category: 'Arma tu Pinto', available: true, description: 'Queso fresco' },
  { id: '20', name: 'Natilla', price: 700, category: 'Arma tu Pinto', available: true, description: 'Natilla casera' },
  { id: '21', name: 'Carne en Salsa', price: 1500, category: 'Arma tu Pinto', available: true, description: 'Carne en salsa' },
  { id: '22', name: 'Pollo en Salsa', price: 1500, category: 'Arma tu Pinto', available: true, description: 'Pollo en salsa' },
  { id: '23', name: 'Salchichón', price: 700, category: 'Arma tu Pinto', available: true, description: 'Salchichón frito' },
  { id: '24', name: 'Tortilla Palmeada', price: 700, category: 'Arma tu Pinto', available: true, description: 'Tortilla palmeada' },

  // Casados
  { id: '25', name: 'Casado Pollo', price: 3500, category: 'Casados', available: true, description: 'Casado con pollo' },
  { id: '26', name: 'Casado Pescado', price: 3500, category: 'Casados', available: true, description: 'Casado con pescado' },
  { id: '27', name: 'Casado Camarones', price: 4500, category: 'Casados', available: true, description: 'Casado con camarones' },
  { id: '28', name: 'Casado Hígado', price: 3500, category: 'Casados', available: true, description: 'Casado con hígado' },
  { id: '29', name: 'Casado Chicharrón', price: 4500, category: 'Casados', available: true, description: 'Casado con chicharrón' },
  { id: '30', name: 'Casado Bistec Res', price: 4500, category: 'Casados', available: true, description: 'Casado con bistec de res' },
  { id: '31', name: 'Casado Chuleta', price: 3500, category: 'Casados', available: true, description: 'Casado con chuleta' },
  { id: '32', name: 'Casado Carne Salsa', price: 3500, category: 'Casados', available: true, description: 'Casado con carne en salsa' },
  { id: '33', name: 'Casado Pollo Salsa', price: 3000, category: 'Casados', available: true, description: 'Casado con pollo en salsa' },
  { id: '34', name: 'Casado Vegetariano', price: 3500, category: 'Casados', available: true, description: 'Casado vegetariano' },

  // Mariscos
  { id: '35', name: 'Arroz con Mariscos', price: 4500, category: 'Mariscos', available: true, description: 'Arroz con mariscos variados' },
  { id: '36', name: 'Arroz con Camarones', price: 4500, category: 'Mariscos', available: true, description: 'Arroz con camarones' },
  { id: '37', name: 'Camarones Empanizados', price: 6000, category: 'Mariscos', available: true, description: 'Camarones empanizados crujientes' },
  { id: '38', name: 'Pescado al Ajillo', price: 4500, category: 'Mariscos', available: true, description: 'Pescado al ajillo' },
  { id: '39', name: 'Pescado con Coco', price: 5000, category: 'Mariscos', available: true, description: 'Pescado en salsa de coco' },
  { id: '40', name: 'Ceviche', price: 4000, category: 'Mariscos', available: true, description: 'Ceviche fresco del día' },
  { id: '41', name: 'Dedos de Pescado', price: 5000, category: 'Mariscos', available: true, description: 'Dedos de pescado empanizados' },
  { id: '42', name: 'Sopa de Mariscos', price: 5000, category: 'Mariscos', available: true, description: 'Sopa de mariscos variados' },

  // Platillos
  { id: '43', name: 'Arroz con Pollo', price: 4000, category: 'Platillos', available: true, description: 'Arroz con pollo tradicional' },
  { id: '44', name: 'Arroz Fischer', price: 4500, category: 'Platillos', available: true, description: 'Arroz especial Fischer' },
  { id: '45', name: 'Filet de Pollo a la Plancha', price: 4500, category: 'Platillos', available: true, description: 'Filet de pollo a la plancha' },
  { id: '46', name: 'Dedos de Pollo', price: 4500, category: 'Platillos', available: true, description: 'Dedos de pollo empanizados' },
  { id: '47', name: 'Fajitas de Pollo', price: 4500, category: 'Platillos', available: true, description: 'Fajitas de pollo con vegetales' },
  { id: '48', name: 'Fajitas de Res', price: 4500, category: 'Platillos', available: true, description: 'Fajitas de res con vegetales' },
  { id: '49', name: 'Chicharrones', price: 5000, category: 'Platillos', available: true, description: 'Chicharrones crujientes' },
  { id: '50', name: 'Chifrijo', price: 4500, category: 'Platillos', available: true, description: 'Chifrijo tradicional costarricense' },

  // Bebidas Frías
  { id: '51', name: 'Cerveza', price: 1300, category: 'Bebidas Frías', available: true, description: 'Cerveza fría' },
  { id: '52', name: 'Sodas', price: 1000, category: 'Bebidas Frías', available: true, description: 'Sodas variadas' },
  { id: '53', name: 'Frescos Naturales', price: 800, category: 'Bebidas Frías', available: true, description: 'Frescos naturales de frutas' },
  { id: '54', name: 'Batido en Agua', price: 1500, category: 'Bebidas Frías', available: true, description: 'Batido de frutas en agua' },
  { id: '55', name: 'Batido en Leche', price: 2000, category: 'Bebidas Frías', available: true, description: 'Batido de frutas en leche' },
  { id: '56', name: 'Batido Mixto', price: 2200, category: 'Bebidas Frías', available: true, description: 'Batido mixto de frutas' }
];