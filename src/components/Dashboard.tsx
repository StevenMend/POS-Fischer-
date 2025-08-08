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
  const paidOrders = todaysOrders.filter(order => order.status === 'paid');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Premium */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 tablet:px-6 py-4 tablet:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 tablet:p-3 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-lg">
                <Coffee className="w-6 tablet:w-8 h-6 tablet:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl tablet:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Restaurante Fischer
                </h1>
                <p className="text-sm tablet:text-base text-slate-500 font-medium">Sistema POS Profesional</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs tablet:text-sm text-slate-500 font-medium">
                {new Date().toLocaleDateString('es-CR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-xl tablet:text-2xl font-bold text-slate-800">
                {new Date().toLocaleTimeString('es-CR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            
            {/* Settings Button */}
            <button
              onClick={onShowSettings}
              className="p-3 tablet:p-4 hover:bg-white/50 rounded-2xl transition-all duration-300 hover:scale-110 group"
              title="Configuración del Sistema"
            >
              <Settings className="w-6 tablet:w-7 h-6 tablet:h-7 text-slate-600 group-hover:text-blue-600 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 tablet:p-6">
        {/* Stats Cards Premium - SEPARACIÓN DE CONCEPTOS */}
        <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4 tablet:gap-6 mb-6 tablet:mb-8">
          
          {/* 💰 DINERO FÍSICO TOTAL (inicial + efectivo de ventas) */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Efectivo Total CRC
                </p>
                <p className="text-xl tablet:text-3xl font-bold text-slate-800 mt-1">
                  {formatCurrency(cashRegister?.currentCashCRC || 0)}
                </p>
                <p className="text-xs text-slate-400">
                  Base: {formatCurrency(cashRegister?.openingCashCRC || 0)}
                </p>
              </div>
              <div className="p-2 tablet:p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                <DollarSign className="w-6 tablet:w-8 h-6 tablet:h-8 text-white" />
              </div>
            </div>
          </div>

          {/* 📊 VENTAS DEL DÍA (separadas del dinero físico) */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Ventas Hoy CRC
                </p>
                <p className="text-xl tablet:text-3xl font-bold text-blue-600 mt-1">
                  {formatCurrency(cashRegister?.totalSalesCRC || 0)}
                </p>
                <p className="text-xs text-blue-400">Solo ingresos por ventas</p>
              </div>
              <div className="p-2 tablet:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <TrendingUp className="w-6 tablet:w-8 h-6 tablet:h-8 text-white" />
              </div>
            </div>
          </div>

          {/* 🍽️ ÓRDENES PROCESADAS HOY */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Órdenes Procesadas
                </p>
                <p className="text-xl tablet:text-3xl font-bold text-purple-600 mt-1">
                  {cashRegister?.totalOrders || 0}
                </p>
                <p className="text-xs text-purple-400">
                  Promedio: {cashRegister?.totalOrders > 0 
                    ? formatCurrency((cashRegister?.totalSalesCRC || 0) / cashRegister.totalOrders)
                    : '₡0'}
                </p>
              </div>
              <div className="p-2 tablet:p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <FileText className="w-6 tablet:w-8 h-6 tablet:h-8 text-white" />
              </div>
            </div>
          </div>

          {/* 🍽️ ESTADO OPERATIVO */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Estado
                </p>
                <p className={`text-xl tablet:text-2xl font-bold mt-1 ${
                  cashRegister?.isOpen ? 'text-green-600' : 'text-red-600'
                }`}>
                  {cashRegister?.isOpen ? 'OPERANDO' : 'CERRADO'}
                </p>
                <p className="text-xs text-slate-400">
                  {occupiedTables.length}/{tables.length} mesas ocupadas
                </p>
              </div>
              <div className={`p-2 tablet:p-3 rounded-xl ${
                cashRegister?.isOpen 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-red-500 to-rose-600'
              }`}>
                <Users className="w-6 tablet:w-8 h-6 tablet:h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tables Grid Premium */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 tablet:p-8">
          <h2 className="text-xl tablet:text-2xl font-bold text-slate-800 mb-6 tablet:mb-8 flex items-center">
            <Users className="w-6 tablet:w-7 h-6 tablet:h-7 mr-3 text-blue-600" />
            Estado de Mesas
          </h2>
          
          <div className="grid grid-cols-3 tablet:grid-cols-5 gap-4 tablet:gap-6">
            {tables.map((table) => (
              <div key={table.id} className="relative group">
                <div
                  className={`${getTableStatusColor(table.status)} text-white rounded-2xl p-4 tablet:p-6 cursor-pointer transition-all duration-300 transform hover:scale-110 shadow-xl hover:shadow-2xl backdrop-blur-sm`}
                  onClick={() => onTableClick(table)}
                >
                  <div className="text-center">
                    <div className="text-xl tablet:text-2xl font-bold mb-2">Mesa {table.number}</div>
                    <div className="text-xs tablet:text-sm opacity-90 font-medium">{getTableStatusText(table.status)}</div>
                    <div className="text-xs opacity-75 mt-2 flex items-center justify-center">
                      <Users className="w-3 h-3 mr-1" />
                      {table.seats} personas
                    </div>
                    
                    {table.currentOrder && (
                      <div className="mt-4 pt-4 border-t border-white/30">
                        <div className="text-xs tablet:text-sm font-bold">
                          {formatCurrency(table.currentOrder.total)}
                        </div>
                        <div className="text-xs opacity-75 flex items-center justify-center mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(table.currentOrder.createdAt).toLocaleTimeString('es-CR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons for Occupied Tables */}
                {table.status === 'occupied' && table.currentOrder && (
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1 tablet:space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewOrder(table);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 tablet:px-3 py-1 rounded-lg text-xs font-bold transition-colors shadow-lg"
                    >
                      Ver
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPayOrder(table);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 tablet:px-3 py-1 rounded-lg text-xs font-bold transition-colors shadow-lg"
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