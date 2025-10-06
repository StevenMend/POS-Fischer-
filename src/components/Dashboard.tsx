import React, { useState } from 'react';
import { 
  Coffee, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Settings, 
  FileText,
  Plus,
  Clock
} from 'lucide-react';

interface DashboardProps {
  tables: any[];
  cashRegister: any;
  todaysOrders: any[];
  onTableClick: (table: any) => void;
  onViewOrder: (table: any) => void;
  onPayOrder: (table: any) => void;
  onOpenCash: () => void;
  onGoToMenuManager: () => void;
  onGoToReports: () => void;
  onGoToClosureHistory: () => void;
  onShowSettings: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  tables,
  cashRegister,
  todaysOrders,
  onTableClick,
  onViewOrder,
  onPayOrder,
  onOpenCash,
  onGoToMenuManager,
  onGoToReports,
  onGoToClosureHistory,
  onShowSettings
}) => {
  const availableTables = tables.filter(t => t.status === 'available');
  const occupiedTables = tables.filter(t => t.status === 'occupied');

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700';
      case 'occupied': return 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700';
      case 'reserved': return 'bg-gradient-to-br from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700';
      case 'cleaning': return 'bg-gradient-to-br from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700';
      default: return 'bg-gradient-to-br from-slate-500 to-gray-600';
    }
  };

  const getTableStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Ocupada';
      case 'reserved': return 'Reservada';
      case 'cleaning': return 'Limpieza';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  // Mostrar mensaje claro si caja cerrada
  if (!cashRegister?.isOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header Premium - Responsivo */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                <div className="p-1.5 sm:p-2 md:p-3 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl md:rounded-2xl shadow-lg">
                  <Coffee className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Restaurante Fischer
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-orange-600 font-medium">
                    Caja cerrada - Abrir para comenzar operaciones
                  </p>
                </div>
              </div>
              
              <div className="hidden sm:block text-right">
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  {new Date().toLocaleDateString('es-CR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
                  {new Date().toLocaleTimeString('es-CR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              
              <button
                onClick={onShowSettings}
                className="p-2 sm:p-3 md:p-4 hover:bg-white/50 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-110 group"
                title="Configuración del Sistema"
              >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-slate-600 group-hover:text-blue-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 md:p-12 text-center max-w-sm md:max-w-md">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <DollarSign className="w-8 h-8 md:w-12 md:h-12 text-red-600" />
            </div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 mb-3 md:mb-4">Caja Cerrada</h2>
            <p className="text-slate-600 mb-6 md:mb-8 text-sm md:text-base lg:text-lg">
              Para comenzar las operaciones del día, necesitas abrir la caja registradora.
            </p>
            <button
              onClick={onOpenCash}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base lg:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Abrir Caja Registradora
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Premium - Mejorado */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <div className="p-1.5 sm:p-2 md:p-3 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl md:rounded-2xl shadow-lg">
                <Coffee className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Restaurante Fischer
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-green-600 font-medium">
                  Sistema operativo
                </p>
              </div>
            </div>
            
            <div className="hidden sm:block text-right">
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                {new Date().toLocaleDateString('es-CR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
                {new Date().toLocaleTimeString('es-CR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            
            <button
              onClick={onShowSettings}
              className="p-2 sm:p-3 md:p-4 hover:bg-white/50 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-110 group"
              title="Configuración del Sistema"
            >
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-slate-600 group-hover:text-blue-600 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
        {/* 🔥 Stats Cards - DISEÑO LIMPIO Y PROFESIONAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          
          {/* 🔥 EFECTIVO FÍSICO TOTAL - DISEÑO MEJORADO */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
                  Efectivo Total
                </p>
                <p className="text-3xl font-black text-emerald-600">
                  {formatCurrency(cashRegister.currentCashCRC)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>
            
            {/* Desglose limpio */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Base inicial</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatCurrency(cashRegister.openingCashCRC)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Ventas efectivo</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(cashRegister.cashPaymentsCRC)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Estado</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  Math.abs((cashRegister.openingCashCRC + cashRegister.cashPaymentsCRC) - cashRegister.currentCashCRC) < 1 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {(cashRegister.openingCashCRC + cashRegister.cashPaymentsCRC) === cashRegister.currentCashCRC 
                    ? 'Cuadra' 
                    : 'Diferencia'}
                </span>
              </div>
            </div>
          </div>
{/* 
          🔥 VENTAS DEL DÍA - DISEÑO MEJORADO */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
                  Ventas del Día
                </p>
                <p className="text-3xl font-black text-blue-600">
                  {formatCurrency(cashRegister.totalSalesCRC)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
            
            {/* Desglose limpio */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Pagos efectivo</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(cashRegister.cashPaymentsCRC)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Pagos tarjeta</span>
                <span className="text-sm font-bold text-purple-600">
                  {formatCurrency(cashRegister.cardPaymentsCRC)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Verificación</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  (cashRegister.cashPaymentsCRC + cashRegister.cardPaymentsCRC) === cashRegister.totalSalesCRC
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {(cashRegister.cashPaymentsCRC + cashRegister.cardPaymentsCRC) === cashRegister.totalSalesCRC
                    ? 'Correcto'
                    : 'Revisar'}
                </span>
              </div>
            </div>
          </div>

          {/* Órdenes procesadas - DISEÑO MEJORADO */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
                  Órdenes Procesadas
                </p>
                <p className="text-3xl font-black text-purple-600">
                  {cashRegister.totalOrders}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Promedio por orden</span>
                <span className="text-sm font-bold text-slate-800">
                  {cashRegister.totalOrders > 0 
                    ? formatCurrency(cashRegister.totalSalesCRC / cashRegister.totalOrders)
                    : '₡0'}
                </span>
              </div>
            </div>
          </div>

          {/* Estado de mesas - DISEÑO MEJORADO */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
                  Estado Mesas
                </p>
                <p className="text-3xl font-black text-green-600">
                  {occupiedTables.length}/{tables.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Ocupación</span>
                <span className="text-sm font-bold text-slate-800">
                  {tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 Tables Grid - PERFECTAMENTE RESPONSIVO */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 md:p-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 md:mb-8 flex items-center">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mr-2 md:mr-3 text-blue-600" />
            Estado de Mesas
          </h2>
          
          {/* 🎯 GRID ADAPTATIVO - 3 en móvil, 4 en tablet, 5 en desktop */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {tables.map((table) => (
              <div key={table.id} className="relative group">
                <div
                  className={`${getTableStatusColor(table.status)} text-white rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 md:hover:scale-110 shadow-xl hover:shadow-2xl backdrop-blur-sm`}
                  onClick={() => onTableClick(table)}
                >
                  <div className="text-center">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold mb-1 md:mb-2">
                      Mesa {table.number}
                    </div>
                    <div className="text-xs md:text-sm opacity-90 font-medium">
                      {getTableStatusText(table.status)}
                    </div>
                    <div className="text-xs opacity-75 mt-1 md:mt-2 flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                      <span className="text-xs">{table.seats} personas</span>
                    </div>
                    
                    {table.currentOrder && (
                      <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-white/30">
                        <div className="text-xs md:text-sm font-bold">
                          {formatCurrency(table.currentOrder.total)}
                        </div>
                        <div className="text-xs opacity-75 flex items-center justify-center mt-1">
                          <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                          {new Date(table.currentOrder.createdAt).toLocaleTimeString('es-CR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons - Solo desktop */}
                {table.status === 'occupied' && table.currentOrder && (
                  <div className="absolute -bottom-2 md:-bottom-3 left-1/2 transform -translate-x-1/2 hidden md:flex space-x-1 lg:space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewOrder(table);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-1.5 lg:px-2 xl:px-3 py-1 rounded text-xs font-bold transition-colors shadow-lg"
                    >
                      Ver
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPayOrder(table);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-1.5 lg:px-2 xl:px-3 py-1 rounded text-xs font-bold transition-colors shadow-lg"
                    >
                      Cobrar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;