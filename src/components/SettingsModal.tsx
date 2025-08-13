import React from 'react';
import { 
  X, 
  Plus, 
  Settings as SettingsIcon, 
  TrendingUp,
  DollarSign,
  Clock,
  Calendar,
  Receipt,
  BarChart3
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashRegister: any;
  onOpenCash: () => void;
  onCloseCash: () => void;
  onGoToMenuManager: () => void;
  onGoToReports: () => void;
  onGoToClosureHistory: () => void;
  onGoToExpenses: () => void;
  onGoToFinancialReports: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  cashRegister,
  onOpenCash,
  onCloseCash,
  onGoToMenuManager,
  onGoToReports,
  onGoToClosureHistory,
  onGoToExpenses,
  onGoToFinancialReports
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
      {/* 🔥 MODAL RESPONSIVO - Tamaños por dispositivo */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl w-full max-w-sm md:max-w-md lg:max-w-lg shadow-2xl border border-white/20 max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header - Compacto en móvil */}
        <div className="flex items-center justify-between p-4 md:p-6 lg:p-8 border-b border-white/20 flex-shrink-0">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg md:rounded-xl">
              <SettingsIcon className="w-4 h-4 md:w-5 lg:w-6 md:h-5 lg:h-6 text-white" />
            </div>
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
              <span className="hidden md:inline">Configuración del Sistema</span>
              <span className="md:hidden">Configuración</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 hover:bg-slate-100 rounded-lg md:rounded-xl transition-colors"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-slate-500" />
          </button>
        </div>

        {/* Content - Con scroll interno */}
        <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 overflow-y-auto flex-1">
          
          {/* Cash Register Status - Más compacto */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-200">
            <h4 className="text-base md:text-lg font-bold text-slate-800 mb-3 md:mb-4 flex items-center">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-600" />
              Estado de Caja
            </h4>
            
            {cashRegister?.isOpen ? (
              <div className="space-y-2 md:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base text-slate-600">Estado:</span>
                  <span className="px-2 md:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs md:text-sm font-bold">
                    ABIERTA
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base text-slate-600">Efectivo CRC:</span>
                  <span className="font-bold text-slate-800 text-sm md:text-base">
                    {formatCurrency(cashRegister.currentCashCRC)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base text-slate-600">Efectivo USD:</span>
                  <span className="font-bold text-slate-800 text-sm md:text-base">
                    ${(cashRegister.currentCashUSD || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base text-slate-600">Órdenes:</span>
                  <span className="font-bold text-slate-800 text-sm md:text-base">
                    {cashRegister.totalOrders || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 md:py-4">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <Clock className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
                </div>
                <p className="text-slate-600 font-medium text-sm md:text-base">Caja Cerrada</p>
                <p className="text-xs md:text-sm text-slate-500">Debe abrir la caja para operar</p>
              </div>
            )}
          </div>

          {/* Action Buttons - Responsivos */}
          <div className="space-y-3 md:space-y-4">
            
            {/* Cash Management */}
            <div className="space-y-2 md:space-y-3">
              <h4 className="text-base md:text-lg font-bold text-slate-800">Gestión de Caja</h4>
              
              {!cashRegister?.isOpen ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCash();
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 md:space-x-3 shadow-xl hover:shadow-2xl hover:scale-105 text-sm md:text-base"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                  <span>Abrir Caja</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onCloseCash();
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 md:space-x-3 shadow-xl hover:shadow-2xl hover:scale-105 text-sm md:text-base"
                >
                  <Clock className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                  <span>Cerrar Caja</span>
                </button>
              )}
            </div>

            {/* System Management - Grid en tablet/desktop */}
            <div className="space-y-2 md:space-y-3">
              <h4 className="text-base md:text-lg font-bold text-slate-800">Gestión del Sistema</h4>
              
              {/* 🔥 BOTONES EN GRID RESPONSIVO */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onGoToMenuManager();
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 md:space-x-3 shadow-xl hover:shadow-2xl hover:scale-105 text-sm md:text-base"
                >
                  <SettingsIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                  <span className="hidden sm:inline">Gestionar Menú</span>
                  <span className="sm:hidden">Menú</span>
                </button>
                
                <button
                  onClick={() => {
                    onClose();
                    onGoToReports();
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 md:space-x-3 shadow-xl hover:shadow-2xl hover:scale-105 text-sm md:text-base"
                >
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                  <span className="hidden sm:inline">Reportes y Cierre</span>
                  <span className="sm:hidden">Reportes</span>
                </button>
                
                <button
                  onClick={() => {
                    onClose();
                    onGoToClosureHistory();
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 md:space-x-3 shadow-xl hover:shadow-2xl hover:scale-105 text-sm md:text-base"
                >
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                  <span className="hidden sm:inline">Historial de Cierres</span>
                  <span className="sm:hidden">Historial</span>
                </button>
                
                <button
                  onClick={() => {
                    onClose();
                    onGoToExpenses();
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 md:space-x-3 shadow-xl hover:shadow-2xl hover:scale-105 text-sm md:text-base"
                >
                  <Receipt className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                  <span className="hidden sm:inline">Gestión de Gastos</span>
                  <span className="sm:hidden">Gastos</span>
                </button>
              </div>
              
              {/* Reportes Financieros - Botón completo abajo */}
              <button
                onClick={() => {
                  onClose();
                  onGoToFinancialReports();
                }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 md:space-x-3 shadow-xl hover:shadow-2xl hover:scale-105 text-sm md:text-base"
              >
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                <span>Reportes Financieros</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;