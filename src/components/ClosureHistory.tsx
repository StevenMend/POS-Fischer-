import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  FileText,
  Filter,
  Eye,
  BarChart3,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  RotateCcw
} from 'lucide-react';

// 🔥 PROPS ACTUALIZADAS CON MÉTODOS CRUD
interface ClosureHistoryProps {
  onBack: () => void;
  closureHistory?: any[];
  getClosureHistory?: () => any[];
  // 🔥 NUEVOS MÉTODOS CRUD
  editClosureRecord?: (closureId: string, editData: ClosureEditData) => ClosureOperationResult;
  deleteClosureRecord?: (closureId: string, reason?: string) => ClosureOperationResult;
  getDeletedClosures?: () => any[];
  restoreClosureRecord?: (deletedClosureId: string) => ClosureOperationResult;
}

interface DailyRecord {
  id: string;
  date: string;
  openingCashCRC: number;
  openingCashUSD: number;
  closingCashCRC: number;
  closingCashUSD: number;
  totalSalesCRC: number;
  totalSalesUSD: number;
  totalOrders: number;
  cashPaymentsCRC: number;
  cashPaymentsUSD: number;
  cardPaymentsCRC: number;
  cardPaymentsUSD: number;
  averageOrderValue: number;
  openedAt: string;
  closedAt: string;
  editHistory?: Array<{
    timestamp: string;
    changes: any;
    reason: string;
  }>;
  // 🔥 AGREGAR ESTA LÍNEA:
  ordersDetails?: Array<{
    orderId: string;
    tableNumber: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    createdAt: string;
    paymentMethod: 'cash' | 'card';
  }>;
}

interface ClosureEditData {
  id: string;
  openingCashCRC?: number;
  openingCashUSD?: number;
  closingCashCRC?: number;
  closingCashUSD?: number;
  notes?: string;
}

interface ClosureOperationResult {
  success: boolean;
  message: string;
  updatedRecord?: DailyRecord;
}

const ClosureHistory: React.FC<ClosureHistoryProps> = ({ 
  onBack,
  closureHistory,
  getClosureHistory,
  editClosureRecord,
  deleteClosureRecord,
  getDeletedClosures,
  restoreClosureRecord
}) => {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DailyRecord[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<DailyRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'sales' | 'orders'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 🔥 ESTADOS PARA CRUD
  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);
  const [editForm, setEditForm] = useState<ClosureEditData>({} as ClosureEditData);
  const [showDeletedRecords, setShowDeletedRecords] = useState(false);
  const [operationResult, setOperationResult] = useState<ClosureOperationResult | null>(null);

  // Cargar historial y registros eliminados
  useEffect(() => {
    let history: any[] = [];
    let deleted: any[] = [];
    
    // Cargar historial principal
    if (closureHistory && closureHistory.length > 0) {
      history = closureHistory;
    } else if (getClosureHistory) {
      history = getClosureHistory();
    } else {
      const savedHistory = localStorage.getItem('fischer_closure_history');
      if (savedHistory) {
        history = JSON.parse(savedHistory);
      }
    }
    
    // Cargar registros eliminados si hay método disponible
    if (getDeletedClosures) {
      deleted = getDeletedClosures();
    }
    
    setRecords(history);
    setFilteredRecords(history);
    setDeletedRecords(deleted);
  }, [closureHistory, getClosureHistory, getDeletedClosures]);

  // Filtrar registros
  useEffect(() => {
    let filtered = [...records];

    if (dateFilter) {
      filtered = filtered.filter(record => 
        record.date.includes(dateFilter)
      );
    }

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'sales':
          aValue = a.totalSalesCRC + (a.totalSalesUSD * 520);
          bValue = b.totalSalesCRC + (b.totalSalesUSD * 520);
          break;
        case 'orders':
          aValue = a.totalOrders;
          bValue = b.totalOrders;
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredRecords(filtered);
  }, [records, dateFilter, sortBy, sortOrder]);

  // Limpiar resultado de operación después de 5 segundos
  useEffect(() => {
    if (operationResult) {
      const timer = setTimeout(() => {
        setOperationResult(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [operationResult]);

  const formatCurrency = (amount: number) => {
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('es-CR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTrend = (current: number, previous: number) => {
    if (!previous) return { trend: 'neutral', percentage: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change)
    };
  };

  const getStats = () => {
    if (filteredRecords.length === 0) return null;
    
    const totalSales = filteredRecords.reduce((sum, record) => 
      sum + record.totalSalesCRC + (record.totalSalesUSD * 520), 0
    );
    const totalOrders = filteredRecords.reduce((sum, record) => sum + record.totalOrders, 0);
    const averageDailySales = totalSales / filteredRecords.length;
    const bestDay = filteredRecords.reduce((best, record) => {
      const sales = record.totalSalesCRC + (record.totalSalesUSD * 520);
      const bestSales = best.totalSalesCRC + (best.totalSalesUSD * 520);
      return sales > bestSales ? record : best;
    });

    return { totalSales, totalOrders, averageDailySales, bestDay };
  };

  // 🔥 FUNCIONES CRUD
  const handleStartEdit = (record: DailyRecord) => {
    setEditingRecord(record);
    setEditForm({
      id: record.id,
      openingCashCRC: record.openingCashCRC,
      openingCashUSD: record.openingCashUSD,
      closingCashCRC: record.closingCashCRC,
      closingCashUSD: record.closingCashUSD,
      notes: ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editClosureRecord || !editingRecord) return;

    const result = editClosureRecord(editingRecord.id, editForm);
    setOperationResult(result);
    
    if (result.success) {
      // Recargar datos
      if (getClosureHistory) {
        const updatedHistory = getClosureHistory();
        setRecords(updatedHistory);
      }
      setEditingRecord(null);
      setEditForm({} as ClosureEditData);
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditForm({} as ClosureEditData);
  };

  const handleDelete = async (record: DailyRecord) => {
    if (!deleteClosureRecord) return;

    const reason = prompt('Razón para eliminar este cierre (opcional):') || 'Eliminado por usuario';
    
    if (window.confirm(`¿Estás seguro de eliminar el cierre del ${formatDate(record.date)}? Esta acción se puede deshacer.`)) {
      const result = deleteClosureRecord(record.id, reason);
      setOperationResult(result);
      
      if (result.success) {
        // Recargar datos
        if (getClosureHistory) {
          const updatedHistory = getClosureHistory();
          setRecords(updatedHistory);
        }
        if (getDeletedClosures) {
          const updatedDeleted = getDeletedClosures();
          setDeletedRecords(updatedDeleted);
        }
      }
    }
  };

  const handleRestore = async (deletedRecord: DailyRecord) => {
    if (!restoreClosureRecord) return;

    if (window.confirm(`¿Restaurar el cierre del ${formatDate(deletedRecord.date)}?`)) {
      const result = restoreClosureRecord(deletedRecord.id);
      setOperationResult(result);
      
      if (result.success) {
        // Recargar datos
        if (getClosureHistory) {
          const updatedHistory = getClosureHistory();
          setRecords(updatedHistory);
        }
        if (getDeletedClosures) {
          const updatedDeleted = getDeletedClosures();
          setDeletedRecords(updatedDeleted);
        }
      }
    }
  };

  const stats = getStats();

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
                  Historial de Cierres
                </h1>
                <p className="text-slate-500 font-medium">
                  Análisis de tendencias y gestión de cierres
                </p>
                {records.length > 0 && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {records.length} {records.length === 1 ? 'registro' : 'registros'}
                    </span>
                    {deletedRecords.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {deletedRecords.length} eliminados
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Toggle para mostrar eliminados */}
              {deletedRecords.length > 0 && (
                <button
                  onClick={() => setShowDeletedRecords(!showDeletedRecords)}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    showDeletedRecords
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  {showDeletedRecords ? 'Ver Activos' : 'Ver Eliminados'}
                </button>
              )}
              
              <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 NOTIFICACIÓN DE RESULTADO DE OPERACIONES */}
      {operationResult && (
        <div className={`mx-6 mt-4 p-4 rounded-xl border ${
          operationResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {operationResult.success ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 mr-2" />
            )}
            <p className="text-sm font-medium">{operationResult.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {!showDeletedRecords ? (
          <>
            {/* Filtros y Controles */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-8">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-slate-500" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                    placeholder="Filtrar por fecha"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-slate-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  >
                    <option value="date">Ordenar por Fecha</option>
                    <option value="sales">Ordenar por Ventas</option>
                    <option value="orders">Ordenar por Órdenes</option>
                  </select>
                </div>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors flex items-center space-x-2"
                >
                  {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}</span>
                </button>
              </div>
            </div>

            {/* Estadísticas Generales */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Ventas Totales</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">
                        {formatCurrency(stats.totalSales)}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Órdenes Totales</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalOrders}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Promedio Diario</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">
                        {formatCurrency(stats.averageDailySales)}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Mejor Día</p>
                      <p className="text-lg font-bold text-slate-800 mt-1">
                        {formatCurrency(stats.bestDay.totalSalesCRC + (stats.bestDay.totalSalesUSD * 520))}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(stats.bestDay.date)}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Registros con CRUD */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center">
                <Calendar className="w-7 h-7 mr-3 text-purple-600" />
                Registros Diarios ({filteredRecords.length})
              </h2>

              {filteredRecords.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-8 bg-slate-100/50 rounded-3xl mb-6 inline-block">
                    <Calendar className="w-16 h-16 text-slate-400 mx-auto" />
                  </div>
                  <p className="text-slate-500 mb-6 text-lg">No hay registros de cierres</p>
                  <p className="text-sm text-slate-400">Los registros aparecerán cuando se cierren cajas</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredRecords.map((record, index) => {
                    const previousRecord = filteredRecords[index + 1];
                    const salesTrend = previousRecord ? getTrend(
                      record.totalSalesCRC + (record.totalSalesUSD * 520),
                      previousRecord.totalSalesCRC + (previousRecord.totalSalesUSD * 520)
                    ) : { trend: 'neutral', percentage: 0 };

                    const isEditing = editingRecord?.id === record.id;

                    return (
                      <div 
                        key={record.id} 
                        className={`py-6 px-6 rounded-2xl transition-colors ${
                          isEditing 
                            ? 'bg-blue-50/80 border-2 border-blue-200' 
                            : 'bg-slate-50/80 hover:bg-slate-100/80'
                        }`}
                      >
                        {isEditing ? (
                          // 🔥 MODO EDICIÓN
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-bold text-slate-800">
                                Editando: {formatDate(record.date)}
                              </h3>
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleSaveEdit}
                                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                                  title="Guardar cambios"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-colors"
                                  title="Cancelar edición"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                  Apertura CRC
                                </label>
                                <input
                                  type="number"
                                  value={editForm.openingCashCRC || ''}
                                  onChange={(e) => setEditForm({
                                    ...editForm,
                                    openingCashCRC: parseFloat(e.target.value) || 0
                                  })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                  Cierre CRC
                                </label>
                                <input
                                  type="number"
                                  value={editForm.closingCashCRC || ''}
                                  onChange={(e) => setEditForm({
                                    ...editForm,
                                    closingCashCRC: parseFloat(e.target.value) || 0
                                  })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                  Apertura USD
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm.openingCashUSD || ''}
                                  onChange={(e) => setEditForm({
                                    ...editForm,
                                    openingCashUSD: parseFloat(e.target.value) || 0
                                  })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                  Cierre USD
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm.closingCashUSD || ''}
                                  onChange={(e) => setEditForm({
                                    ...editForm,
                                    closingCashUSD: parseFloat(e.target.value) || 0
                                  })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-slate-600 mb-1">
                                Notas de la edición
                              </label>
                              <input
                                type="text"
                                value={editForm.notes || ''}
                                onChange={(e) => setEditForm({
                                  ...editForm,
                                  notes: e.target.value
                                })}
                                placeholder="Razón del cambio (opcional)"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        ) : (
                          // 🔥 MODO VISUALIZACIÓN CON BOTONES CRUD
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                                <Calendar className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-lg">{formatDate(record.date)}</p>
                                <p className="text-sm text-slate-500">
                                  {record.totalOrders} órdenes • Promedio: {formatCurrency(record.averageOrderValue)}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  {salesTrend.trend === 'up' && (
                                    <div className="flex items-center text-green-600 text-xs">
                                      <TrendingUp className="w-3 h-3 mr-1" />
                                      +{salesTrend.percentage.toFixed(1)}%
                                    </div>
                                  )}
                                  {salesTrend.trend === 'down' && (
                                    <div className="flex items-center text-red-600 text-xs">
                                      <TrendingDown className="w-3 h-3 mr-1" />
                                      -{salesTrend.percentage.toFixed(1)}%
                                    </div>
                                  )}
                                  {record.editHistory && record.editHistory.length > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Editado
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="font-bold text-slate-800 text-xl">
                                  {formatCurrency(record.totalSalesCRC + (record.totalSalesUSD * 520))}
                                </p>
                                <div className="text-sm text-slate-500 space-y-1">
                                  <div>Efectivo: {formatCurrency(record.cashPaymentsCRC)}</div>
                                  <div>Tarjeta: {formatCurrency(record.cardPaymentsCRC)}</div>
                                </div>
                              </div>
                              
                              {/* 🔥 BOTONES CRUD */}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setSelectedRecord(record)}
                                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                                  title="Ver detalles"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                
                                {editClosureRecord && (
                                  <button
                                    onClick={() => handleStartEdit(record)}
                                    className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition-colors"
                                    title="Editar cierre"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}
                                
                                {deleteClosureRecord && (
                                  <button
                                    onClick={() => handleDelete(record)}
                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                                    title="Eliminar cierre"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          // 🔥 VISTA DE REGISTROS ELIMINADOS
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-200 p-8">
            <h2 className="text-2xl font-bold text-red-800 mb-8 flex items-center">
              <Trash2 className="w-7 h-7 mr-3 text-red-600" />
              Registros Eliminados ({deletedRecords.length})
            </h2>

            {deletedRecords.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-8 bg-red-100/50 rounded-3xl mb-6 inline-block">
                  <Trash2 className="w-16 h-16 text-red-400 mx-auto" />
                </div>
                <p className="text-red-500 mb-6 text-lg">No hay registros eliminados</p>
                <p className="text-sm text-red-400">Los cierres eliminados aparecerán aquí para posible restauración</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deletedRecords.map((record) => (
                  <div 
                    key={record.id} 
                    className="flex justify-between items-center py-6 px-6 bg-red-50/80 rounded-2xl border border-red-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-red-800 text-lg">{formatDate(record.date)}</p>
                        <p className="text-sm text-red-600">
                          Eliminado: {new Date(record.deletedAt).toLocaleDateString('es-CR')}
                        </p>
                        <p className="text-xs text-red-500">
                          Razón: {record.deleteReason || 'Sin especificar'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-bold text-red-800 text-xl">
                          {formatCurrency(record.totalSalesCRC + (record.totalSalesUSD * 520))}
                        </p>
                        <p className="text-sm text-red-600">
                          {record.totalOrders} órdenes
                        </p>
                      </div>
                      
                      {restoreClosureRecord && (
                        <button
                          onClick={() => handleRestore(record)}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center space-x-2"
                          title="Restaurar cierre"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span className="text-sm">Restaurar</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Detalles - Mejorado CON ÓRDENES DEL DÍA */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-8 border-b border-white/20">
              <h3 className="text-2xl font-bold text-slate-800">
                Detalles del {formatDate(selectedRecord.date)}
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Horarios */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                  <p className="text-sm font-medium text-green-800 mb-1">Apertura</p>
                  <p className="text-lg font-bold text-green-900">
                    {new Date(selectedRecord.openedAt).toLocaleTimeString('es-CR')}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-4 border border-red-200">
                  <p className="text-sm font-medium text-red-800 mb-1">Cierre</p>
                  <p className="text-lg font-bold text-red-900">
                    {new Date(selectedRecord.closedAt).toLocaleTimeString('es-CR')}
                  </p>
                </div>
              </div>

              {/* Caja */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-800">Estado de Caja</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Apertura CRC:</span>
                      <span className="font-bold">{formatCurrency(selectedRecord.openingCashCRC)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cierre CRC:</span>
                      <span className="font-bold text-green-600">{formatCurrency(selectedRecord.closingCashCRC)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold text-slate-800">Diferencia CRC:</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(selectedRecord.closingCashCRC - selectedRecord.openingCashCRC)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Apertura USD:</span>
                      <span className="font-bold">${selectedRecord.openingCashUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cierre USD:</span>
                      <span className="font-bold text-green-600">${selectedRecord.closingCashUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold text-slate-800">Diferencia USD:</span>
                      <span className="font-bold text-blue-600">
                        ${(selectedRecord.closingCashUSD - selectedRecord.openingCashUSD).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ventas */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-800">Resumen de Ventas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-2">Efectivo</p>
                    <p className="text-xl font-bold text-blue-900 mb-1">
                      {formatCurrency(selectedRecord.cashPaymentsCRC)}
                    </p>
                    <p className="text-sm text-blue-700">${selectedRecord.cashPaymentsUSD.toFixed(2)} USD</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
                    <p className="text-sm font-medium text-purple-800 mb-2">Tarjeta</p>
                    <p className="text-xl font-bold text-purple-900 mb-1">
                      {formatCurrency(selectedRecord.cardPaymentsCRC)}
                    </p>
                    <p className="text-sm text-purple-700">${selectedRecord.cardPaymentsUSD.toFixed(2)} USD</p>
                  </div>
                </div>
              </div>

              {/* 🔥 NUEVO: ÓRDENES DEL DÍA */}
              {selectedRecord.ordersDetails && selectedRecord.ordersDetails.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-800">Órdenes del Día</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {selectedRecord.ordersDetails.map((order) => (
                      <div key={order.orderId} className="bg-slate-50 p-3 rounded-xl">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Mesa {order.tableNumber}</span>
                          <span className="font-bold">{formatCurrency(order.total)}</span>
                        </div>
                        <div className="text-sm text-slate-600">
                          {order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(order.createdAt).toLocaleTimeString('es-CR')} • {order.paymentMethod}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historial de Ediciones */}
              {selectedRecord.editHistory && selectedRecord.editHistory.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-800">Historial de Ediciones</h4>
                  <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 max-h-32 overflow-y-auto">
                    {selectedRecord.editHistory.map((edit, index) => (
                      <div key={index} className="text-sm text-yellow-800 mb-2">
                        <p className="font-medium">
                          {new Date(edit.timestamp).toLocaleDateString('es-CR')} - {edit.reason}
                        </p>
                        <p className="text-xs text-yellow-600">
                          Cambios: {JSON.stringify(edit.changes)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-emerald-800 mb-1">Venta Total del Día</p>
                    <p className="text-3xl font-bold text-emerald-900">
                      {formatCurrency(selectedRecord.totalSalesCRC + (selectedRecord.totalSalesUSD * 520))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-700 mb-1">{selectedRecord.totalOrders} órdenes</p>
                    <p className="text-lg font-bold text-emerald-800">
                      Promedio: {formatCurrency(selectedRecord.averageOrderValue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClosureHistory;