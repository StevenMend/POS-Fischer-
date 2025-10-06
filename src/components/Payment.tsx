// Payment.tsx - VERSIÓN PROFESIONAL CON SPLITS COMPLETOS
import React, { useState } from 'react';
import { ArrowLeft, CreditCard, DollarSign, Calculator, CheckCircle, Edit3, Trash2, Tag, Users, Package } from 'lucide-react';
import DiscountModal from './DiscountModal';
import SplitBillModal from './SplitBillModal';
import SplitByItemsModal from './SplitByItemsModal';
import type { SplitPayment } from '../types';

interface PaymentProps {
  order: any;
  table: any;
  onBack: () => void;
  onProcessPayment: (paymentData: any) => void;
  onEditOrder?: () => void;
  onCancelOrder?: () => void;
  updateOrder?: (order: any) => void;
}

const Payment: React.FC<PaymentProps> = ({
  order,
  table,
  onBack,
  onProcessPayment,
  onEditOrder,
  onCancelOrder,
  updateOrder
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [currency, setCurrency] = useState<'CRC' | 'USD'>('CRC');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSplitByItemsModal, setShowSplitByItemsModal] = useState(false);
  const [hasManualSplit, setHasManualSplit] = useState(false);
  
  // Estados de descuentos y splits
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    type: string;
    reason: string;
    originalTotal: number;
    discountAmount: number;
  } | null>(null);
  
  // Estado para splits activos
  const [activeSplits, setActiveSplits] = useState<Array<{ personNumber: number; amount: number }> | null>(null);

  const roundToTwo = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  const formatCurrency = (amount: number, curr: string = 'CRC') => {
    if (curr === 'USD') {
      return `$${roundToTwo(amount).toFixed(2)}`;
    }
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const exchangeRate = 490;

  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return roundToTwo(amount);
    
    if (fromCurrency === 'CRC' && toCurrency === 'USD') {
      return roundToTwo(amount / exchangeRate);
    }
    
    if (fromCurrency === 'USD' && toCurrency === 'CRC') {
      return roundToTwo(amount * exchangeRate);
    }
    
    return roundToTwo(amount);
  };

  const getOrderTotal = (): number => {
    let total = order.total;
    
    if (appliedDiscount) {
      total = appliedDiscount.originalTotal - appliedDiscount.discountAmount;
    }
    
    if (currency === 'USD') {
      return convertAmount(total, 'CRC', 'USD');
    }
    return roundToTwo(total);
  };

  const getChange = (): number => {
    const received = roundToTwo(parseFloat(amountReceived) || 0);
    const total = getOrderTotal();
    const change = received - total;
    return roundToTwo(Math.max(0, change));
  };

  const canProcessPayment = (): boolean => {
    if (paymentMethod === 'card') return true;
    
    const received = roundToTwo(parseFloat(amountReceived) || 0);
    const total = getOrderTotal();
    
    return received >= (total - 0.01);
  };

  const handleAmountChange = (value: string): void => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    
    if (parts.length > 2) return;
    
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
    }
    
    setAmountReceived(parts.join('.'));
  };

  const handleApplyDiscount = (discountType: 'remove_service' | 'percent_10' | 'percent_12' | 'percent_15', reason: string) => {
    const subtotal = order.subtotal;
    let discountAmount = 0;
    
    switch (discountType) {
      case 'remove_service':
        discountAmount = subtotal * 0.10;
        break;
      case 'percent_10':
        discountAmount = (subtotal * 1.10) * 0.10;
        break;
      case 'percent_12':
        discountAmount = (subtotal * 1.10) * 0.12;
        break;
      case 'percent_15':
        discountAmount = (subtotal * 1.10) * 0.15;
        break;
    }
    
    setAppliedDiscount({
      type: discountType,
      reason,
      originalTotal: order.total,
      discountAmount
    });
    
    setShowDiscountModal(false);
    console.log('✅ Descuento aplicado:', { discountType, reason, discountAmount });
  };

  const handleSplitConfirm = (splits: Array<{ personNumber: number; amount: number }>) => {
    console.log('✅ División confirmada:', splits);
    
    // Guardar splits en estado local
    setActiveSplits(splits);
    
    // Crear splitPayments con método y moneda
    const splitPayments: SplitPayment[] = splits.map(split => ({
      personNumber: split.personNumber,
      amount: split.amount,
      method: paymentMethod,
      currency: currency
    }));
    
    // Actualizar orden en el sistema
    if (updateOrder) {
      const updatedOrder = {
        ...order,
        splitPayments: splitPayments
      };
      updateOrder(updatedOrder);
      console.log('📊 Orden actualizada con splits');
    }
    
    setShowSplitModal(false);
  };

  const handleManualSplitConfirm = (manualSplit: any) => {
    console.log('✅ División manual por artículos confirmada:', manualSplit);
    
    // Actualizar orden con la división manual
    if (updateOrder) {
      const updatedOrder = {
        ...order,
        manualSplit: manualSplit
      };
      updateOrder(updatedOrder);
      console.log('📊 Orden actualizada con división manual');
    }
    
    setHasManualSplit(true);
    setShowSplitByItemsModal(false);
  };

  const handleProcessPayment = async () => {
    if (!canProcessPayment() && !activeSplits) return;

    setIsProcessing(true);

    // Pago normal o con splits
    const total = getOrderTotal();
    const received = roundToTwo(parseFloat(amountReceived) || 0);
    const change = getChange();

    const paymentData = {
      method: paymentMethod,
      currency,
      amount: total,
      received: paymentMethod === 'cash' ? received : total,
      total: total,
      change: paymentMethod === 'cash' ? change : 0,
      orderId: order.id,
      tableNumber: table.number,
      discount: appliedDiscount,
      // Si hay splits, incluirlos TODOS en un solo objeto
      splitInfo: activeSplits && activeSplits.length > 0 ? {
        totalParts: activeSplits.length,
        splits: activeSplits
      } : undefined
    };

    console.log('💳 [PAYMENT] Enviando pago:', paymentData);
    
    // UNA SOLA LLAMADA - no importa si tiene splits o no
    onProcessPayment(paymentData);
    
    setIsProcessing(false);
  };

  const quickAmounts = currency === 'CRC' 
    ? [1000, 2000, 5000, 10000, 20000]
    : [5, 10, 20, 50, 100];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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
              {appliedDiscount && (
                <p className="text-xs text-purple-600 font-medium">
                  Descuento aplicado
                </p>
              )}
              {activeSplits && (
                <p className="text-xs text-green-600 font-medium">
                  Dividida en {activeSplits.length} partes
                </p>
              )}
              {hasManualSplit && order.manualSplit && (
                <p className="text-xs text-indigo-600 font-medium">
                  División manual: {order.manualSplit.personAccounts.length} personas
                </p>
              )}
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
              {appliedDiscount && (
                <div className="flex justify-between text-purple-600 font-medium">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(convertAmount(appliedDiscount.discountAmount, 'CRC', currency), currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-slate-800 border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(getOrderTotal(), currency)}</span>
              </div>
            </div>

            {/* MOSTRAR DIVISIÓN ACTIVA */}
            {activeSplits && activeSplits.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 border-2 border-green-500 rounded-xl">
                <h3 className="font-bold text-green-700 mb-2 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Cuenta Dividida
                </h3>
                <p className="text-sm text-green-600 mb-2">
                  Dividida en {activeSplits.length} partes:
                </p>
                <div className="space-y-1">
                  {activeSplits.map((split, idx) => (
                    <div key={idx} className="flex justify-between text-sm font-medium">
                      <span>Persona {split.personNumber}:</span>
                      <span className="text-green-700">{formatCurrency(split.amount, currency)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-green-600 mt-2 italic">
                  Se imprimirá 1 ticket con división
                </p>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <DollarSign className="w-6 h-6 mr-3 text-blue-600" />
              Método de Pago
            </h2>

            {(onEditOrder || onCancelOrder) && (
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  {onEditOrder && (
                    <button
                      onClick={onEditOrder}
                      className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Edit3 className="w-5 h-5" />
                      <span>Editar</span>
                    </button>
                  )}
                  
                  {onCancelOrder && (
                    <button
                      onClick={onCancelOrder}
                      className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setShowDiscountModal(true)}
                    className="py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Tag className="w-5 h-5" />
                    <span>Desc.</span>
                  </button>
                  
                  <button
                    onClick={() => setShowSplitModal(true)}
                    className="py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Users className="w-5 h-5" />
                    <span>Div. $</span>
                  </button>

                  <button
                    onClick={() => setShowSplitByItemsModal(true)}
                    className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Package className="w-5 h-5" />
                    <span>Items</span>
                  </button>
                </div>
              </div>
            )}

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

            {paymentMethod === 'cash' && !activeSplits && (
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

                {amountReceived && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Cambio:</span>
                      <span className="text-xl font-bold text-emerald-600">
                        {formatCurrency(getChange(), currency)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleProcessPayment}
              disabled={(!canProcessPayment() && !activeSplits) || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                ((canProcessPayment() || activeSplits) && !isProcessing)
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
                  <span>
                    {activeSplits 
                      ? `Procesar Pago Dividido` 
                      : 'Procesar Pago'}
                  </span>
                </>
              )}
            </button>

            {paymentMethod === 'cash' && !canProcessPayment() && amountReceived && !activeSplits && (
              <p className="text-red-500 text-sm mt-2 text-center">
                El monto recibido debe ser mayor o igual al total
              </p>
            )}
          </div>
        </div>
      </div>

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        order={order}
        onApplyDiscount={handleApplyDiscount}
      />
      
      <SplitBillModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        order={order}
        onSplitConfirm={handleSplitConfirm}
      />

      <SplitByItemsModal
        isOpen={showSplitByItemsModal}
        onClose={() => setShowSplitByItemsModal(false)}
        order={order}
        onConfirmSplit={handleManualSplitConfirm}
      />
    </div>
  );
};

export default Payment;