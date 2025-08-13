import React, { useState, useMemo } from 'react';
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
  Download,
  AlertTriangle,
  History
} from 'lucide-react';
import { CashRegister, Order, Table, Payment } from '../types';

interface ReportsProps {
  cashRegister: CashRegister | null;
  todaysOrders: Order[];
  tables: Table[];
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
  // 🔥 VALIDACIÓN ESTRICTA: Solo mostrar Reports si caja está ABIERTA
  if (!cashRegister?.isOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-12 text-center max-w-lg">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <History className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Caja Cerrada</h2>
          <p className="text-slate-600 mb-8 text-lg">
            Los reportes en tiempo real solo están disponibles cuando la caja está abierta.
          </p>
          <p className="text-slate-500 mb-8">
            Para ver datos de días anteriores, usa el Historial de Cierres.
          </p>
          <div className="space-y-4">
            <button
              onClick={onBack}
              className="w-full bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Volver al Dashboard
            </button>
            <p className="text-sm text-slate-400">
              💡 Tip: Usa Settings &gt; "Historial de Cierres" para ver datos pasados
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 🔥 REST OF THE CODE - SOLO SE EJECUTA SI CAJA ESTÁ ABIERTA
  // 🔥 ARQUITECTURA PROFESIONAL: Usar cashRegister como SINGLE SOURCE OF TRUTH
  const reportData = useMemo(() => {
    if (!cashRegister) {
      return {
        totalSalesCRC: 0,
        totalSalesUSD: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        cashData: null,
        isValid: false
      };
    }

    // 📊 DATOS PRINCIPALES - Desde Restaurant (fuente única de verdad)
    const totalSalesCRC = cashRegister.totalSalesCRC;
    const totalSalesUSD = cashRegister.totalSalesUSD;
    const totalOrders = cashRegister.totalOrders;
    
    // Promedio calculado desde datos centralizados
    const averageOrderValue = totalOrders > 0 ? totalSalesCRC / totalOrders : 0;
    
    // 💰 DATOS DE EFECTIVO - Desde Restaurant
    const cashData = {
      openingCRC: cashRegister.openingCashCRC,
      openingUSD: cashRegister.openingCashUSD,
      currentCRC: cashRegister.currentCashCRC,
      currentUSD: cashRegister.currentCashUSD,
      differenceCRC: cashRegister.currentCashCRC - cashRegister.openingCashCRC,
      differenceUSD: cashRegister.currentCashUSD - cashRegister.openingCashUSD,
      isOpen: cashRegister.isOpen,
      openedAt: cashRegister.openedAt,
      closedAt: cashRegister.closedAt
    };

    return {
      totalSalesCRC,
      totalSalesUSD,
      totalOrders,
      averageOrderValue,
      cashData,
      isValid: true
    };
  }, [cashRegister]);

  // 🍽️ ANÁLISIS DE ÓRDENES - Solo para detalles adicionales
  const orderAnalysis = useMemo(() => {
    const paidOrders = todaysOrders.filter(order => order.status === 'paid');
    const recentOrders = paidOrders
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10); // Últimas 10 órdenes

    return {
      paidOrders,
      recentOrders,
      totalItems: paidOrders.reduce((sum, order) => sum + order.items.length, 0)
    };
  }, [todaysOrders]);

  // 🏢 ANÁLISIS DE MESAS
  const tableAnalysis = useMemo(() => {
    const occupied = tables.filter(t => t.status === 'occupied').length;
    const available = tables.filter(t => t.status === 'available').length;
    const reserved = tables.filter(t => t.status === 'reserved').length;
    const cleaning = tables.filter(t => t.status === 'cleaning').length;
    const occupancyRate = tables.length > 0 ? Math.round((occupied / tables.length) * 100) : 0;

    return {
      total: tables.length,
      occupied,
      available,
      reserved,
      cleaning,
      occupancyRate
    };
  }, [tables]);

  const formatCurrency = (amount: number) => {
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const formatUSD = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleCloseCash = () => {
    if (!cashRegister?.isOpen) {
      alert('❌ La caja no está abierta');
      return;
    }

    if (window.confirm('¿Estás seguro de cerrar la caja? Esta acción generará el reporte final del día y lo guardará en el historial.')) {
      onCloseCash();
      alert('✅ Caja cerrada exitosamente. El registro se ha guardado en el Historial de Cierres.');
      onBack();
    }
  };

  // 🚨 ERROR HANDLING PROFESIONAL
  if (!reportData.isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-12 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Sistema No Iniciado</h2>
          <p className="text-slate-600 mb-6">
            La caja registradora no está inicializada. Abre la caja para comenzar a generar reportes.
          </p>
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-3 rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

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
            
            <div className="flex items-center space-x-4">
              {/* Status indicator */}
              <div className="flex items-center space-x-2 bg-white/50 backdrop-blur rounded-2xl px-4 py-2">
                <div className={`w-3 h-3 rounded-full ${reportData.cashData?.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium text-slate-700">
                  Caja {reportData.cashData?.isOpen ? 'Abierta' : 'Cerrada'}
                </span>
              </div>

              {reportData.cashData?.isOpen && (
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
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* 📊 SUMMARY CARDS - DATOS DESDE RESTAURANT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Ventas CRC</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {formatCurrency(reportData.totalSalesCRC)}
                </p>
                {reportData.totalSalesUSD > 0 && (
                  <p className="text-sm text-slate-500 mt-1">
                    + {formatUSD(reportData.totalSalesUSD)}
                  </p>
                )}
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Órdenes Totales</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{reportData.totalOrders}</p>
                <p className="text-sm text-green-600 mt-1">
                  {orderAnalysis.totalItems} productos vendidos
                </p>
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
                  {formatCurrency(reportData.averageOrderValue)}
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
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Ocupación</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {tableAnalysis.occupancyRate}%
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {tableAnalysis.occupied}/{tableAnalysis.total} mesas
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 💰 CASH REGISTER STATUS - DATOS REALES */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center">
              <DollarSign className="w-7 h-7 mr-3 text-green-600" />
              Estado de Caja
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <p className="text-sm text-blue-600 font-medium">Apertura CRC</p>
                  <p className="text-xl font-bold text-blue-800">
                    {formatCurrency(reportData.cashData?.openingCRC || 0)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <p className="text-sm text-blue-600 font-medium">Apertura USD</p>
                  <p className="text-xl font-bold text-blue-800">
                    {formatUSD(reportData.cashData?.openingUSD || 0)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-2xl">
                  <p className="text-sm text-green-600 font-medium">Actual CRC</p>
                  <p className="text-xl font-bold text-green-800">
                    {formatCurrency(reportData.cashData?.currentCRC || 0)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-2xl">
                  <p className="text-sm text-green-600 font-medium">Actual USD</p>
                  <p className="text-xl font-bold text-green-800">
                    {formatUSD(reportData.cashData?.currentUSD || 0)}
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl border border-green-200 mt-6">
                <div className="text-center">
                  <p className="text-green-600 font-medium mb-2">Diferencia del Día</p>
                  <p className="text-3xl font-bold text-green-800">
                    {formatCurrency(reportData.cashData?.differenceCRC || 0)}
                  </p>
                  {(reportData.cashData?.differenceUSD || 0) !== 0 && (
                    <p className="text-lg font-bold text-green-700 mt-1">
                      + {formatUSD(reportData.cashData?.differenceUSD || 0)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 🏢 TABLE STATUS */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center">
              <Users className="w-7 h-7 mr-3 text-blue-600" />
              Estado de Mesas
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-2xl text-center">
                  <p className="text-2xl font-bold text-green-800">{tableAnalysis.available}</p>
                  <p className="text-sm text-green-600 font-medium">Disponibles</p>
                </div>
                <div className="bg-red-50 p-4 rounded-2xl text-center">
                  <p className="text-2xl font-bold text-red-800">{tableAnalysis.occupied}</p>
                  <p className="text-sm text-red-600 font-medium">Ocupadas</p>
                </div>
              </div>
              
              {(tableAnalysis.reserved > 0 || tableAnalysis.cleaning > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-yellow-50 p-4 rounded-2xl text-center">
                    <p className="text-2xl font-bold text-yellow-800">{tableAnalysis.reserved}</p>
                    <p className="text-sm text-yellow-600 font-medium">Reservadas</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl text-center">
                    <p className="text-2xl font-bold text-gray-800">{tableAnalysis.cleaning}</p>
                    <p className="text-sm text-gray-600 font-medium">Limpieza</p>
                  </div>
                </div>
              )}
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                <div className="text-center">
                  <p className="text-blue-600 font-medium mb-2">Tasa de Ocupación</p>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-32 h-32 relative">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#3b82f6"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${tableAnalysis.occupancyRate * 2.51} 251`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-800">
                          {tableAnalysis.occupancyRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📋 RECENT ORDERS */}
        <div className="mt-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center">
            <FileText className="w-7 h-7 mr-3 text-purple-600" />
            Órdenes Recientes
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {orderAnalysis.recentOrders.map((order) => (
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
            
            {orderAnalysis.recentOrders.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay órdenes procesadas hoy</p>
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