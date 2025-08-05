import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

interface MenuManagerProps {
  menuItems: any[];
  onBack: () => void;
  onAddItem: (item: any) => void;
  onUpdateItem: (item: any) => void;
  onDeleteItem: (itemId: string) => void;
}

const MenuManager: React.FC<MenuManagerProps> = ({
  menuItems,
  onBack,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    available: true
  });

  const categories = [...new Set(menuItems.map(item => item.category))];

  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory('Todos');
    }
  }, [categories, selectedCategory]);

  const filteredItems = selectedCategory === 'Todos' || !selectedCategory
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const formatCurrency = (amount: number) => {
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: categories[0] || '',
      description: '',
      available: true
    });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      alert('El precio debe ser un número válido mayor a 0');
      return;
    }

    if (!formData.name.trim() || !formData.category.trim()) {
      alert('El nombre y la categoría son obligatorios');
      return;
    }

    const itemData = {
      name: formData.name.trim(),
      price,
      category: formData.category.trim(),
      description: formData.description.trim(),
      available: formData.available
    };

    if (editingItem) {
      const updatedItem = { ...editingItem, ...itemData };
      onUpdateItem(updatedItem);
    } else {
      onAddItem(itemData);
    }

    resetForm();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      description: item.description || '',
      available: item.available
    });
    setShowAddForm(true);
  };

  const handleDelete = (item: any) => {
    if (window.confirm(`¿Estás seguro de eliminar "${item.name}"?`)) {
      onDeleteItem(item.id);
    }
  };

  const toggleAvailability = (item: any) => {
    const updatedItem = { ...item, available: !item.available };
    onUpdateItem(updatedItem);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Premium */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-3 hover:bg-white/50 rounded-2xl transition-all duration-300 hover:scale-110"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Gestión de Menú
                </h1>
                <p className="text-slate-500 font-medium">{menuItems.length} productos</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-3 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <Plus className="w-6 h-6" />
              <span>Agregar Producto</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Category Filter Premium */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('Todos')}
              className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg ${
                selectedCategory === 'Todos'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl'
                  : 'bg-white/70 backdrop-blur-xl text-slate-700 hover:bg-white/90 border border-white/20'
              }`}
            >
              Todos ({menuItems.length})
            </button>
            {categories.map((category) => {
              const count = menuItems.filter(item => item.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl'
                      : 'bg-white/70 backdrop-blur-xl text-slate-700 hover:bg-white/90 border border-white/20'
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Grid Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                !item.available ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 mb-2 text-lg">{item.name}</h3>
                  <p className="text-sm text-blue-600 font-medium mb-2">{item.category}</p>
                  {item.description && (
                    <p className="text-sm text-slate-500 mb-4">{item.description}</p>
                  )}
                </div>
                
                <button
                  onClick={() => toggleAvailability(item)}
                  className={`p-2 rounded-xl transition-colors ${
                    item.available 
                      ? 'text-emerald-600 hover:bg-emerald-50' 
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                  title={item.available ? 'Disponible' : 'No disponible'}
                >
                  {item.available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>

              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                {formatCurrency(item.price)}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
                
                <button
                  onClick={() => handleDelete(item)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <div className="p-8 bg-white/50 rounded-3xl mb-6 inline-block">
              <Plus className="w-16 h-16 text-slate-400 mx-auto" />
            </div>
            <p className="text-slate-500 mb-6 text-lg">No hay productos en esta categoría</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Agregar Primer Producto
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal Premium */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl border border-white/20">
            <div className="flex items-center justify-between p-8 border-b border-white/20">
              <h3 className="text-2xl font-bold text-slate-800">
                {editingItem ? 'Editar Producto' : 'Agregar Producto'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  placeholder="Ej: Gallo Pinto Fischer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Precio (₡) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  placeholder="0"
                  min="0"
                  step="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value="Nueva Categoría">+ Nueva Categoría</option>
                </select>
              </div>

              {formData.category === 'Nueva Categoría' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Nombre de la Nueva Categoría *
                  </label>
                  <input
                    type="text"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                    placeholder="Ej: Especialidades"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  placeholder="Descripción opcional del producto"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="available" className="ml-3 text-sm font-medium text-slate-700">
                  Producto disponible
                </label>
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingItem ? 'Actualizar' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;