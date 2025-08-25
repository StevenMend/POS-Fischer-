import React, { useState } from 'react';
import { ArrowLeft, CreditCard, DollarSign, Calculator, CheckCircle, Edit3, Trash2 } from 'lucide-react';

// 🔥 PROPS ACTUALIZADAS (agregando las nuevas)
interface PaymentProps {
  order: any;
  table: any;
  onBack: () => void;
  onProcessPayment: (paymentData: any) => void;
  onEditOrder?: () => void;        // 🔥 NUEVO
  onCancelOrder?: () => void;      // 🔥 NUEVO
}

const Payment: React.FC<PaymentProps> = ({
  order,
  table,
  onBack,
  onProcessPayment,
  onEditOrder,        // 🔥 NUEVO
  onCancelOrder       // 🔥 NUEVO
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [currency, setCurrency] = useState<'CRC' | 'USD'>('CRC');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 🔥 FUNCIÓN DE REDONDEO PRECISO
  const roundToTwo = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  const formatCurrency = (amount: number, curr: string = 'CRC') => {
    if (curr === 'USD') {
      return `$${roundToTwo(amount).toFixed(2)}`;
    }
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const exchangeRate = 520; // 1 USD = 520 CRC (aproximado)

  // 🔥 CONVERSIÓN CON REDONDEO PRECISO
  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return roundToTwo(amount);
    
    if (fromCurrency === 'CRC' && toCurrency === 'USD') {
      const converted = amount / exchangeRate;
      return roundToTwo(converted);
    }
    
    if (fromCurrency === 'USD' && toCurrency === 'CRC') {
      const converted = amount * exchangeRate;
      return roundToTwo(converted);
    }
    
    return roundToTwo(amount);
  };

  // 🔥 TOTAL CALCULADO CON PRECISIÓN
  const getOrderTotal = (): number => {
    if (currency === 'USD') {
      return convertAmount(order.total, 'CRC', 'USD');
    }
    return roundToTwo(order.total);
  };

  // 🔥 CAMBIO CALCULADO CON PRECISIÓN
  const getChange = (): number => {
    const received = roundToTwo(parseFloat(amountReceived) || 0);
    const total = getOrderTotal();
    const change = received - total;
    return roundToTwo(Math.max(0, change));
  };

  // 🔥 VALIDACIÓN PRECISA
  const canProcessPayment = (): boolean => {
    if (paymentMethod === 'card') return true;
    
    const received = roundToTwo(parseFloat(amountReceived) || 0);
    const total = getOrderTotal();
    
    // Usar tolerancia de 1 centavo para evitar problemas de precisión
    return received >= (total - 0.01);
  };

  // 🔥 INPUT HANDLER CON REDONDEO
  const handleAmountChange = (value: string): void => {
    // Solo permitir números y un punto decimal
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Evitar múltiples puntos decimales
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limitar a 2 decimales
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
    }
    
    const finalValue = parts.join('.');
    setAmountReceived(finalValue);
  };

  const handleProcessPayment = async () => {
    if (!canProcessPayment()) return;

    setIsProcessing(true);

    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 🔥 DATOS DE PAGO CON PRECISIÓN
    const total = getOrderTotal();
    const received = roundToTwo(parseFloat(amountReceived) || 0);
    const change = getChange();

    const paymentData = {
      method: paymentMethod,
      currency,
      amount: total, // Siempre usar el total exacto
      received: paymentMethod === 'cash' ? received : total,
      total: total,
      change: paymentMethod === 'cash' ? change : 0,
      orderId: order.id,
      tableNumber: table.number
    };

    console.log('💳 Datos de pago enviados:', paymentData);
    onProcessPayment(paymentData);
    setIsProcessing(false);
  };

  const quickAmounts = currency === 'CRC' 
    ? [1000, 2000, 5000, 10000, 20000]
    : [5, 10, 20, 50, 100];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
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
                <h1 className="text-xl tablet:text-2xl font-bold text-slate-800">
                  Procesar Pago - Mesa {table?.number}
                </h1>
                <p className="text-sm tablet:text-base text-slate-500">
                  {order?.items?.length || 0} productos • Total: {formatCurrency(getOrderTotal(), currency)}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-lg tablet:text-xl font-bold text-emerald-600">
                {formatCurrency(getOrderTotal(), currency)}
              </p>
              <p className="text-sm text-slate-500">
                Total a cobrar
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 tablet:p-6">
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <CheckCircle className="w-6 h-6 mr-3 text-emerald-600" />
              Resumen de Orden
            </h2>

            <div className="space-y-4 mb-6">
              {order?.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-200">
                  <div>
                    <span className="font-medium text-slate-800">{item.menuItem.name}</span>
                    <span className="text-slate-500 ml-2">x{item.quantity}</span>
                    {item.notes && (
                      <p className="text-xs text-slate-400 mt-1">{item.notes}</p>
                    )}
                  </div>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(convertAmount(item.subtotal, 'CRC', currency), currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-300 pt-4 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(convertAmount(order.subtotal, 'CRC', currency), currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Servicio (10%):</span>
                <span>{formatCurrency(convertAmount(order.serviceCharge, 'CRC', currency), currency)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-slate-800 border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(getOrderTotal(), currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <DollarSign className="w-6 h-6 mr-3 text-blue-600" />
              Método de Pago
              <span className="ml-4 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                🔥 Precisión Corregida
              </span>
            </h2>

            {/* 🔥 NUEVOS BOTONES DE EDICIÓN (AGREGADOS AQUÍ) */}
            {(onEditOrder || onCancelOrder) && (
              <div className="flex space-x-3 mb-6">
                {onEditOrder && (
                  <button
                    onClick={onEditOrder}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit3 className="w-5 h-5" />
                    <span>Editar Orden</span>
                  </button>
                )}
                
                {onCancelOrder && (
                  <button
                    onClick={onCancelOrder}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Cancelar Orden</span>
                  </button>
                )}
              </div>
            )}

            {/* Currency Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">Moneda</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCurrency('CRC')}
                  className={`p-3 rounded-xl font-medium transition-all duration-300 ${
                    currency === 'CRC'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg'
                      : 'bg-white/50 text-slate-600 hover:bg-white/80'
                  }`}
                >
                  Colones (₡)
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`p-3 rounded-xl font-medium transition-all duration-300 ${
                    currency === 'USD'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg'
                      : 'bg-white/50 text-slate-600 hover:bg-white/80'
                  }`}
                >
                  Dólares ($)
                </button>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">Método de Pago</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center space-x-2 p-4 rounded-xl font-medium transition-all duration-300 ${
                    paymentMethod === 'cash'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-lg'
                      : 'bg-white/50 text-slate-600 hover:bg-white/80'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Efectivo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center space-x-2 p-4 rounded-xl font-medium transition-all duration-300 ${
                    paymentMethod === 'card'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-lg'
                      : 'bg-white/50 text-slate-600 hover:bg-white/80'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Tarjeta</span>
                </button>
              </div>
            </div>

            {/* Cash Payment Form */}
            {paymentMethod === 'cash' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Monto Recibido
                </label>
                <input
                  type="text"
                  value={amountReceived}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder={`Ingrese monto en ${currency}`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-lg font-medium"
                />

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setAmountReceived(amount.toString())}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      {formatCurrency(amount, currency)}
                    </button>
                  ))}
                </div>

                {/* Change Calculation */}
                {amountReceived && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Cambio:</span>
                      <span className="text-xl font-bold text-emerald-600">
                        {formatCurrency(getChange(), currency)}
                      </span>
                    </div>
                    {/* 🔥 DEBUG INFO TEMPORAL - REMOVER EN PRODUCCIÓN */}
                    <div className="mt-2 text-xs text-slate-400 space-y-1">
                      <div>Recibido: {roundToTwo(parseFloat(amountReceived) || 0)}</div>
                      <div>Total: {getOrderTotal()}</div>
                      <div>Cambio calculado: {getChange()}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Process Payment Button */}
            <button
              onClick={handleProcessPayment}
              disabled={!canProcessPayment() || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                canProcessPayment() && !isProcessing
                  ? 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-lg hover:scale-105'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  <span>Procesar Pago</span>
                </>
              )}
            </button>

            {paymentMethod === 'cash' && !canProcessPayment() && amountReceived && (
              <p className="text-red-500 text-sm mt-2 text-center">
                El monto recibido debe ser mayor o igual al total
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;