import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, ShoppingCart, Coffee, Utensils, Wine, Beef, Fish, Cake } from 'lucide-react';

interface POSProps {
  table: any;
  currentOrder: any;
  menuItems: any[];
  onBack: () => void;
  onAddItem: (menuItem: any) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  onConfirmOrder: () => void;
}

const POS: React.FC<POSProps> = ({
  table,
  currentOrder,
  menuItems,
  onBack,
  onAddItem,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNotes,
  onConfirmOrder
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'Todos', icon: Coffee },
    { id: 'Comidas Rápidas', name: 'Comidas Rápidas', icon: Utensils },
    { id: 'Bebidas Calientes', name: 'Bebidas Calientes', icon: Coffee },
    { id: 'Desayunos', name: 'Desayunos', icon: Cake },
    { id: 'Arma tu Pinto', name: 'Arma tu Pinto', icon: Utensils },
    { id: 'Casados', name: 'Casados', icon: Beef },
    { id: 'Mariscos', name: 'Mariscos', icon: Fish },
    { id: 'Platillos', name: 'Platillos', icon: Utensils },
    { id: 'Bebidas Frías', name: 'Bebidas Frías', icon: Wine }
  ];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  const formatCurrency = (amount: number) => {
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const getItemQuantity = (menuItemId: string) => {
    const orderItem = currentOrder?.items?.find((item: any) => item.menuItem.id === menuItemId);
    return orderItem?.quantity || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 tablet:px-6 py-4 tablet:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 tablet:p-3 hover:bg-white/50 rounded-2xl transition-all duration-300 hover:scale-110"
              >
                <ArrowLeft className="w-6 tablet:w-7 h-6 tablet:h-7 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl tablet:text-2xl font-bold text-slate-800">
                  Mesa {table?.number} - Punto de Venta
                </h1>
                <p className="text-sm tablet:text-base text-slate-500">
                  {table?.seats} personas • {currentOrder?.items?.length || 0} productos
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-lg tablet:text-xl font-bold text-slate-800">
                Total: {formatCurrency(currentOrder?.total || 0)}
              </p>
              <p className="text-sm text-slate-500">
                Servicio incluido (10%)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 tablet:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            {/* Categories */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 mb-6">
              <div className="flex flex-wrap gap-2 tablet:gap-3">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center space-x-2 px-3 tablet:px-4 py-2 tablet:py-3 rounded-xl font-medium transition-all duration-300 ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg'
                          : 'bg-white/50 text-slate-600 hover:bg-white/80'
                      }`}
                    >
                      <Icon className="w-4 tablet:w-5 h-4 tablet:h-5" />
                      <span className="text-sm tablet:text-base">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 mb-6">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            {/* Menu Items */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-6">
                {filteredItems.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-white/80 rounded-xl p-4 tablet:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-800 text-base tablet:text-lg mb-1">
                            {item.name}
                          </h3>
                          <p className="text-sm text-slate-500 mb-2">{item.description}</p>
                          <p className="text-lg tablet:text-xl font-bold text-blue-600">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs tablet:text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                          {item.category}
                        </span>
                        
                        {quantity > 0 ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onUpdateQuantity(currentOrder.items.find((orderItem: any) => orderItem.menuItem.id === item.id)?.id, quantity - 1)}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-lg min-w-[2rem] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(currentOrder.items.find((orderItem: any) => orderItem.menuItem.id === item.id)?.id, quantity + 1)}
                              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onAddItem(item)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Agregar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 sticky top-6">
              <div className="flex items-center space-x-3 mb-6">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-800">Orden Actual</h2>
              </div>

              {currentOrder?.items?.length > 0 ? (
                <>
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {currentOrder.items.map((item: any) => (
                      <div key={item.id} className="bg-white/80 rounded-lg p-4 border border-white/30">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-slate-800">{item.menuItem.name}</h4>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-1 bg-red-500 hover:bg-red-600 text-white rounded"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-medium">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1 bg-green-500 hover:bg-green-600 text-white rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>

                        <textarea
                          placeholder="Notas especiales..."
                          value={item.notes || ''}
                          onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                          className="w-full text-sm p-2 border border-slate-200 rounded resize-none"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-4 space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(currentOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Servicio (10%):</span>
                      <span>{formatCurrency(currentOrder.serviceCharge)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-800 border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(currentOrder.total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={onConfirmOrder}
                    className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Confirmar y Proceder al Pago
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No hay productos en la orden</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Selecciona productos del menú para comenzar
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;