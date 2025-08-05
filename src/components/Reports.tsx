import React, { useState } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Users, 
  FileText,
  Clock,
  CreditCard,
  Banknote,
  Calendar,
  Download
} from 'lucide-react';

interface ReportsProps {
  cashRegister: any;
  todaysOrders: any[];
  tables: any[];
  onBack: () => void;
  onCloseCash: () => void;
}

const Reports: React.FC<ReportsProps> = ({
  cashRegister,
  todaysOrders,
  tables,
  onBack,
  onCloseCash
}) => {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const paidOrders = todaysOrders.filter(order => order.status === 'paid');
  const totalSalesCRC = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = paidOrders.length > 0 ? totalSalesCRC / paidOrders.length : 0;
  
  // Datos reales de métodos de pago
  const cashPayments = paidOrders.filter(order => order.paymentMethod === 'cash');
  const cardPayments = paidOrders.filter(order => order.paymentMethod === 'card');
  
  const cashSalesCRC = cashPayments.reduce((sum, order) => sum + (order.paymentAmount || order.total), 0);
  const cardSalesCRC = cardPayments.reduce((sum, order) => sum + (order.paymentAmount || order.total), 0);

  const formatCurrency = (amount: number) => {
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const handleCloseCash = () => {
    if (window.confirm('¿Estás seguro de cerrar la caja? Esta acción generará el reporte final del día y lo guardará en el historial.')) {
      onCloseCash();
      alert('✅ Caja cerrada exitosamente. El registro se ha guardado en el Historial de Cierres.');
      onBack();
    }
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
                  Reportes del Día
                </h1>
                <p className="text-slate-500 font-medium">
                  {new Date().toLocaleDateString('es-CR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            {cashRegister?.isOpen && (
              <button
                onClick={handleCloseCash}
                className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-3 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <Clock className="w-6 h-6" />
                <span>Cerrar Caja</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Summary Cards Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Ventas Totales</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {formatCurrency(totalSalesCRC)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Órdenes Pagadas</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{paidOrders.length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Promedio Orden</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {formatCurrency(averageOrderValue)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Mesas Activas</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {tables.filter(t => t.status === 'occupied').length}/{tables.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Methods */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center">
              <CreditCard className="w-7 h-7 mr-3 text-blue-600" />
              Métodos de Pago
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-500 rounded-xl">
                    <Banknote className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Efectivo</p>
                    <p className="text-sm text-slate-500">{cashPayments.length} transacciones</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(cashSalesCRC)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {paidOrders.length > 0 ? Math.round((cashPayments.length / paidOrders.length) * 100) : 0}% del total
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Tarjeta</p>
                    <p className="text-sm text-slate-500">{cardPayments.length} transacciones</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(cardSalesCRC)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {paidOrders.length > 0 ? Math.round((cardPayments.length / paidOrders.length) * 100) : 0}% del total
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Register Status */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center">
              <DollarSign className="w-7 h-7 mr-3 text-green-600" />
              Estado de Caja
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="text-slate-600 font-medium">Apertura CRC:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(cashRegister?.openingCashCRC || 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="text-slate-600 font-medium">Apertura USD:</span>
                <span className="font-bold text-slate-800">
                  ${(cashRegister?.openingCashUSD || 0).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="text-slate-600 font-medium">Actual CRC:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(cashRegister?.currentCashCRC || 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="text-slate-600 font-medium">Actual USD:</span>
                <span className="font-bold text-green-600">
                  ${(cashRegister?.currentCashUSD || 0).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-4 bg-gradient-to-br from-green-50 to-emerald-50 px-4 rounded-2xl border border-green-200 mt-6">
                <span className="font-bold text-green-800">Diferencia del Día:</span>
                <span className="font-bold text-green-900 text-xl">
                  {formatCurrency((cashRegister?.currentCashCRC || 0) - (cashRegister?.openingCashCRC || 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center">
            <FileText className="w-7 h-7 mr-3 text-purple-600" />
            Órdenes del Día
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {paidOrders.slice().reverse().map((order) => (
              <div key={order.id} className="flex justify-between items-center py-4 px-6 bg-slate-50/80 rounded-2xl hover:bg-slate-100/80 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Mesa {order.tableNumber}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleTimeString('es-CR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {order.items.length} productos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 text-lg">
                    {formatCurrency(order.total)}
                  </p>
                  <p className="text-sm text-green-600 font-medium">Pagada</p>
                </div>
              </div>
            ))}
            
            {paidOrders.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay órdenes pagadas hoy</p>
                <p className="text-sm">Las órdenes aparecerán aquí cuando se procesen pagos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;