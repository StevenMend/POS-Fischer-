
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-lg shadow-2xl border border-white/20">
        <div className="flex items-center justify-between p-8 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Configuración del Sistema</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Cash Register Status */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
            <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
              Estado de Caja
            </h4>
            
            {cashRegister?.isOpen ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Estado:</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                    ABIERTA
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Efectivo CRC:</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(cashRegister.currentCashCRC)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Efectivo USD:</span>
                  <span className="font-bold text-slate-800">
                    ${(cashRegister.currentCashUSD || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Órdenes Procesadas:</span>
                  <span className="font-bold text-slate-800">
                    {cashRegister.totalOrders || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-slate-600 font-medium">Caja Cerrada</p>
                <p className="text-sm text-slate-500">Debe abrir la caja para operar</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Cash Management */}
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-slate-800">Gestión de Caja</h4>
              
              {!cashRegister?.isOpen ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCash();
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  <Plus className="w-6 h-6" />
                  <span>Abrir Caja</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onCloseCash();
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  <Clock className="w-6 h-6" />
                  <span>Cerrar Caja</span>
                </button>
              )}
            </div>

            {/* System Management */}
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-slate-800">Gestión del Sistema</h4>
              
              <button
                onClick={() => {
                  onClose();
                  onGoToMenuManager();
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <SettingsIcon className="w-6 h-6" />
                <span>Gestionar Menú</span>
              </button>
              
              <button
                onClick={() => {
                  onClose();
                  onGoToReports();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <TrendingUp className="w-6 h-6" />
                <span>Reportes y Cierre</span>
              </button>
              
              <button
                onClick={() => {
                  onClose();
                  onGoToClosureHistory();
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <Calendar className="w-6 h-6" />
                <span>Historial de Cierres</span>
              </button>
              
              <button
                onClick={() => {
                  onClose();
                  onGoToExpenses();
                }}
                className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <Receipt className="w-6 h-6" />
                <span>Gestión de Gastos</span>
              </button>
              
              <button
                onClick={() => {
                  onClose();
                  onGoToFinancialReports();
                }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <BarChart3 className="w-6 h-6" />
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