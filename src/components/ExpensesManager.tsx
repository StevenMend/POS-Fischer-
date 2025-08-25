import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Edit3,
  Trash2,
  Save,
  X,
  Receipt,
  ShoppingCart,
  Utensils,
  Zap,
  Car,
  Users,
  Building,
  Filter,
  BarChart3
} from 'lucide-react';
import { Expense } from '../types';

interface ExpensesManagerProps {
  onBack: () => void;
  // 🔥 CONECTADO AL HOOK - NO MÁS LOCALSTORAGE DIRECTO
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Expense; // 🔥 SIGNATURE CORREGIDA
  updateExpense: (expense: Expense) => void;
  deleteExpense: (expenseId: string) => void;
  getExpensesByCategory: (expenses?: Expense[]) => Record<string, number>;
  getExpensesByType: (expenses?: Expense[]) => { gastos: number; inversiones: number };
  getTodaysExpenses: () => Expense[];
}

const ExpensesManager: React.FC<ExpensesManagerProps> = ({ 
  onBack,
  expenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpensesByCategory,
  getExpensesByType,
  getTodaysExpenses
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: 'CRC' as 'CRC' | 'USD',
    category: '',
    date: new Date().toISOString().split('T')[0],
    type: 'gasto' as 'gasto' | 'inversion'
  });

  const categories = [
    { id: 'ingredientes', name: 'Ingredientes', icon: Utensils, color: 'from-green-500 to-emerald-600' },
    { id: 'servicios', name: 'Servicios', icon: Zap, color: 'from-blue-500 to-indigo-600' },
    { id: 'transporte', name: 'Transporte', icon: Car, color: 'from-purple-500 to-pink-600' },
    { id: 'personal', name: 'Personal', icon: Users, color: 'from-orange-500 to-red-600' },
    { id: 'alquiler', name: 'Alquiler', icon: Building, color: 'from-slate-500 to-gray-600' },
    { id: 'equipos', name: 'Equipos', icon: ShoppingCart, color: 'from-yellow-500 to-amber-600' },
    { id: 'otros', name: 'Otros', icon: Receipt, color: 'from-teal-500 to-cyan-600' }
  ];

  const formatCurrency = (amount: number, currency: 'CRC' | 'USD' = 'CRC') => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      currency: 'CRC',
      category: categories[0].id,
      date: new Date().toISOString().split('T')[0],
      type: 'gasto'
    });
    setShowAddForm(false);
    setEditingExpense(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('El monto debe ser un número válido mayor a 0');
      return;
    }

    if (!formData.description.trim() || !formData.category) {
      alert('La descripción y categoría son obligatorias');
      return;
    }

    // 🔥 PREPARAR DATOS SEGÚN NUEVA SIGNATURE (sin 'id' ni 'createdAt')
    const expenseData: Omit<Expense, 'id' | 'createdAt'> = {
      description: formData.description.trim(),
      amount,
      currency: formData.currency,
      category: formData.category,
      date: formData.date,
      type: formData.type,
      // updatedAt es opcional según la interface
    };

    if (editingExpense) {
      // 🔥 PARA EDICIÓN: usar el expense completo con id y createdAt existentes
      const updatedExpense: Expense = {
        ...editingExpense, // Mantiene id y createdAt originales
        ...expenseData,    // Actualiza los campos modificables
        updatedAt: new Date().toISOString() // Marca como actualizado
      };
      updateExpense(updatedExpense);
      console.log('✅ Expense actualizado:', updatedExpense.id);
    } else {
      // 🔥 PARA CREACIÓN: usar la signature correcta (sin id ni createdAt)
      const newExpense = addExpense(expenseData);
      console.log('✅ Expense agregado:', newExpense.id);
    }

    resetForm();
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      currency: expense.currency,
      category: expense.category,
      date: expense.date,
      type: expense.type
    });
    setShowAddForm(true);
  };

  const handleDelete = (expense: Expense) => {
    if (window.confirm(`¿Estás seguro de eliminar "${expense.description}"?`)) {
      deleteExpense(expense.id);
      console.log('✅ Expense eliminado:', expense.id);
    }
  };

  // 🔥 FILTRAR USANDO LOS GASTOS DEL HOOK (CON DEFENSIVE CODING)
  const filteredExpenses = (expenses || []).filter(expense => {
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    const matchesType = selectedType === 'all' || expense.type === selectedType;
    const matchesDate = !dateFilter || expense.date.includes(dateFilter);
    return matchesCategory && matchesType && matchesDate;
  });

  // 🔥 CALCULAR ESTADÍSTICAS USANDO LOS MÉTODOS DEL HOOK (CON DEFENSIVE CODING)
  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const todayExpenses = getTodaysExpenses() || [];
    const monthExpenses = (expenses || []).filter(exp => exp.date.startsWith(currentMonth));
    
    const todayTotal = todayExpenses.reduce((sum, exp) => 
      sum + (exp.currency === 'CRC' ? exp.amount : exp.amount * 520), 0
    );
    
    const monthTotal = monthExpenses.reduce((sum, exp) => 
      sum + (exp.currency === 'CRC' ? exp.amount : exp.amount * 520), 0
    );

    const expensesByType = getExpensesByType() || { gastos: 0, inversiones: 0 };

    return {
      todayTotal,
      monthTotal,
      totalGastos: expensesByType.gastos,
      totalInversiones: expensesByType.inversiones,
      todayCount: todayExpenses.length,
      monthCount: monthExpenses.length
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Premium */}
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
                <h1 className="text-xl tablet:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Gestión de Gastos e Inversiones
                </h1>
                <p className="text-sm tablet:text-base text-slate-500 font-medium">
                  Sistema unificado con persistencia histórica
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white px-4 tablet:px-8 py-3 tablet:py-4 rounded-2xl font-bold flex items-center space-x-2 tablet:space-x-3 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <Plus className="w-5 tablet:w-6 h-5 tablet:h-6" />
              <span className="text-sm tablet:text-base">Agregar Gasto</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 tablet:p-6">
        {/* Stats Cards Premium */}
        <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4 tablet:gap-6 mb-6 tablet:mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">Gastos Hoy</p>
                <p className="text-lg tablet:text-3xl font-bold text-red-600 mt-1">
                  {formatCurrency(stats.todayTotal)}
                </p>
                <p className="text-xs tablet:text-sm text-slate-500">{stats.todayCount} registros</p>
              </div>
              <div className="p-2 tablet:p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl">
                <TrendingDown className="w-5 tablet:w-8 h-5 tablet:h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">Gastos Mes</p>
                <p className="text-lg tablet:text-3xl font-bold text-orange-600 mt-1">
                  {formatCurrency(stats.monthTotal)}
                </p>
                <p className="text-xs tablet:text-sm text-slate-500">{stats.monthCount} registros</p>
              </div>
              <div className="p-2 tablet:p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                <Calendar className="w-5 tablet:w-8 h-5 tablet:h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Gastos</p>
                <p className="text-lg tablet:text-3xl font-bold text-red-700 mt-1">
                  {formatCurrency(stats.totalGastos)}
                </p>
              </div>
              <div className="p-2 tablet:p-3 bg-gradient-to-br from-red-600 to-rose-700 rounded-xl">
                <Receipt className="w-5 tablet:w-8 h-5 tablet:h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">Inversiones</p>
                <p className="text-lg tablet:text-3xl font-bold text-blue-600 mt-1">
                  {formatCurrency(stats.totalInversiones)}
                </p>
              </div>
              <div className="p-2 tablet:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <BarChart3 className="w-5 tablet:w-8 h-5 tablet:h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros Premium */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-4 tablet:p-6 mb-6 tablet:mb-8">
          <div className="flex flex-wrap items-center gap-3 tablet:gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 tablet:w-5 h-4 tablet:h-5 text-slate-500" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 tablet:px-4 py-2 tablet:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 text-sm tablet:text-base"
              >
                <option value="all">Todos los tipos</option>
                <option value="gasto">Solo Gastos</option>
                <option value="inversion">Solo Inversiones</option>
              </select>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 tablet:px-4 py-2 tablet:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 text-sm tablet:text-base"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 tablet:px-4 py-2 tablet:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 text-sm tablet:text-base"
            />

            {(selectedCategory !== 'all' || selectedType !== 'all' || dateFilter) && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedType('all');
                  setDateFilter('');
                }}
                className="px-3 tablet:px-4 py-2 tablet:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-sm tablet:text-base"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Lista de Gastos Premium */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-4 tablet:p-8">
          <h2 className="text-lg tablet:text-2xl font-bold text-slate-800 mb-6 tablet:mb-8 flex items-center">
            <Receipt className="w-5 tablet:w-7 h-5 tablet:h-7 mr-3 text-red-600" />
            Registros de Gastos ({filteredExpenses.length})
            <span className="ml-4 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
              Persistencia histórica
            </span>
          </h2>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 tablet:py-16">
              <div className="p-6 tablet:p-8 bg-slate-100/50 rounded-3xl mb-4 tablet:mb-6 inline-block">
                <Receipt className="w-12 tablet:w-16 h-12 tablet:h-16 text-slate-400 mx-auto" />
              </div>
              <p className="text-slate-500 mb-4 tablet:mb-6 text-base tablet:text-lg">No hay gastos registrados</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white px-6 tablet:px-8 py-3 tablet:py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Agregar Primer Gasto
              </button>
            </div>
          ) : (
            <div className="space-y-3 tablet:space-y-4 max-h-96 overflow-y-auto">
              {filteredExpenses.slice().reverse().map((expense) => {
                const category = categories.find(cat => cat.id === expense.category);
                const Icon = category?.icon || Receipt;
                
                return (
                  <div 
                    key={expense.id} 
                    className="flex justify-between items-center py-4 tablet:py-6 px-4 tablet:px-6 bg-slate-50/80 rounded-2xl hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center space-x-3 tablet:space-x-4">
                      <div className={`p-2 tablet:p-3 bg-gradient-to-br ${category?.color || 'from-slate-500 to-gray-600'} rounded-xl`}>
                        <Icon className="w-4 tablet:w-6 h-4 tablet:h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm tablet:text-lg">{expense.description}</p>
                        <div className="flex items-center space-x-2 tablet:space-x-4 text-xs tablet:text-sm text-slate-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            expense.type === 'gasto' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {expense.type === 'gasto' ? 'Gasto' : 'Inversión'}
                          </span>
                          <span>{category?.name}</span>
                          <span>{new Date(expense.date).toLocaleDateString('es-CR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 tablet:space-x-4">
                      <div className="text-right">
                        <p className="font-bold text-red-600 text-base tablet:text-xl">
                          -{formatCurrency(expense.amount, expense.currency)}
                        </p>
                      </div>
                      
                      <div className="flex space-x-1 tablet:space-x-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3 tablet:w-4 h-3 tablet:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3 tablet:w-4 h-3 tablet:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Agregar/Editar Gasto Premium */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl border border-white/20">
            <div className="flex items-center justify-between p-6 tablet:p-8 border-b border-white/20">
              <h3 className="text-xl tablet:text-2xl font-bold text-slate-800">
                {editingExpense ? 'Editar Gasto' : 'Agregar Gasto'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 tablet:w-6 h-5 tablet:h-6 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 tablet:p-8 space-y-4 tablet:space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Tipo *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'gasto' })}
                    className={`p-3 rounded-xl font-medium transition-all duration-300 ${
                      formData.type === 'gasto'
                        ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg'
                        : 'bg-white/50 text-slate-600 hover:bg-white/80'
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'inversion' })}
                    className={`p-3 rounded-xl font-medium transition-all duration-300 ${
                      formData.type === 'inversion'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg'
                        : 'bg-white/50 text-slate-600 hover:bg-white/80'
                    }`}
                  >
                    Inversión
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Descripción *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  placeholder="Ej: Compra de ingredientes"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Monto *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Moneda *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'CRC' | 'USD' })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                    required
                  >
                    <option value="CRC">Colones (₡)</option>
                    <option value="USD">Dólares ($)</option>
                  </select>
                </div>
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
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  required
                />
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingExpense ? 'Actualizar' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesManager;