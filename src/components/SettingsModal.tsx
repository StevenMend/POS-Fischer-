import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Settings as SettingsIcon, 
  TrendingUp,
  DollarSign,
  Clock,
  Calendar,
  Receipt,
  BarChart3,
  Building2,
  Printer,
  Bluetooth,
  Save,
  Edit3
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
  // 🖨️ NUEVO PROP
  onShowPrinterManager: () => void;
}

// Configuración por defecto de la empresa
const DEFAULT_COMPANY_INFO = {
  name: 'Soda Fischer',
  phone: '+506 8787 6138',
  address: '27 de Abril Santa Cruz Guanacaste',
  taxId: '',
  email: '',
  website: '',
  logoBase64: ''
};

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
  onGoToFinancialReports,
  // 🖨️ NUEVO PROP
  onShowPrinterManager
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'company' | 'printers'>('main');
  const [companyInfo, setCompanyInfo] = useState(() => {
    const saved = localStorage.getItem('fischer_company_info');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_INFO;
  });
  const [editingCompany, setEditingCompany] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const saveCompanyInfo = () => {
    localStorage.setItem('fischer_company_info', JSON.stringify(companyInfo));
    setEditingCompany(false);
    console.log('✅ Información de empresa guardada');
  };

  const handleCompanyChange = (field: string, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderMainTab = () => (
    <>
      {/* Cash Register Status */}
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

      {/* System Management */}
      <div className="space-y-2 md:space-y-3">
        <h4 className="text-base md:text-lg font-bold text-slate-800">Gestión del Sistema</h4>
        
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
    </>
  );

  const renderCompanyTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-bold text-slate-800 flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-blue-600" />
          Información de Empresa
        </h4>
        <button
          onClick={() => setEditingCompany(!editingCompany)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {editingCompany ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre del Negocio
            </label>
            <input
              type="text"
              value={companyInfo.name}
              onChange={(e) => handleCompanyChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Teléfono
            </label>
            <input
              type="text"
              value={companyInfo.phone}
              onChange={(e) => handleCompanyChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dirección
            </label>
            <textarea
              value={companyInfo.address}
              onChange={(e) => handleCompanyChange('address', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cédula Jurídica (Opcional)
            </label>
            <input
              type="text"
              value={companyInfo.taxId}
              onChange={(e) => handleCompanyChange('taxId', e.target.value)}
              placeholder="3-101-XXXXXX"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Correo Electrónico (Opcional)
            </label>
            <input
              type="email"
              value={companyInfo.email}
              onChange={(e) => handleCompanyChange('email', e.target.value)}
              placeholder="contacto@sodafischer.cr"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sitio Web (Opcional)
            </label>
            <input
              type="text"
              value={companyInfo.website}
              onChange={(e) => handleCompanyChange('website', e.target.value)}
              placeholder="www.sodafischer.cr"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={saveCompanyInfo}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>Guardar Información</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Negocio:</span>
            <span className="font-bold text-slate-800">{companyInfo.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Teléfono:</span>
            <span className="font-bold text-slate-800">{companyInfo.phone}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-slate-600">Dirección:</span>
            <span className="font-bold text-slate-800 text-right max-w-48">
              {companyInfo.address}
            </span>
          </div>
          {companyInfo.taxId && (
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Cédula Jurídica:</span>
              <span className="font-bold text-slate-800">{companyInfo.taxId}</span>
            </div>
          )}
          {companyInfo.email && (
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Email:</span>
              <span className="font-bold text-slate-800">{companyInfo.email}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderPrintersTab = () => (
    <div className="space-y-4">
      <h4 className="text-lg font-bold text-slate-800 flex items-center">
        <Printer className="w-5 h-5 mr-2 text-blue-600" />
        Gestión de Impresoras
      </h4>
      
      <div className="bg-slate-50 rounded-xl p-4 text-center">
        <Bluetooth className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium mb-2">Sistema de Impresión Bluetooth</p>
        <p className="text-sm text-slate-500 mb-4">
          Configure impresoras térmicas MPR-300 para tickets automáticos
        </p>
        <button className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105"
          onClick={() => {
            onClose();
            onShowPrinterManager();
          }}>
          Configurar Impresoras
        </button>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-yellow-400 rounded-full flex-shrink-0 mt-0.5"></div>
          <div>
            <h5 className="font-bold text-yellow-800 mb-1">Próximamente</h5>
            <p className="text-sm text-yellow-700">
              • Detección automática de impresoras Bluetooth<br/>
              • Impresión de tickets después del pago<br/>
              • Configuración de formato de recibos<br/>
              • Soporte para múltiples impresoras
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl w-full max-w-sm md:max-w-md lg:max-w-lg shadow-2xl border border-white/20 max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header con Tabs */}
        <div className="flex items-center justify-between p-4 md:p-6 lg:p-8 border-b border-white/20 flex-shrink-0">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg md:rounded-xl">
              <SettingsIcon className="w-4 h-4 md:w-5 lg:w-6 md:h-5 lg:h-6 text-white" />
            </div>
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
              Configuración
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 hover:bg-slate-100 rounded-lg md:rounded-xl transition-colors"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-slate-500" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-200 px-4 md:px-6 lg:px-8">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'main'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Principal
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`flex-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'company'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Empresa
          </button>
          <button
            onClick={() => setActiveTab('printers')}
            className={`flex-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'printers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Impresoras
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 overflow-y-auto flex-1">
          {activeTab === 'main' && renderMainTab()}
          {activeTab === 'company' && renderCompanyTab()}
          {activeTab === 'printers' && renderPrintersTab()}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;