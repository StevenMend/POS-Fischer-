// components/SplitPaymentFlow.tsx
import React, { useState } from 'react';
import { ArrowLeft, CreditCard, DollarSign, CheckCircle, Clock, User } from 'lucide-react';
import type { PersonAccount } from '../types';

interface SplitPaymentFlowProps {
  order: any;
  table: any;
  manualSplit: any;
  onBack: () => void;
  onProcessPersonPayment: (personAccount: PersonAccount, paymentData: any) => void;
  updateOrder: (order: any) => void;
}

const SplitPaymentFlow: React.FC<SplitPaymentFlowProps> = ({
  order,
  table,
  manualSplit,
  onBack,
  onProcessPersonPayment,
  updateOrder
}) => {
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [currency, setCurrency] = useState<'CRC' | 'USD'>('CRC');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (amount: number, curr: string = 'CRC') => {
    if (curr === 'USD') {
      return `$${Math.round(amount / 520).toFixed(2)}`;
    }
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const getPersonAccount = (personNumber: number): PersonAccount | undefined => {
    return manualSplit.personAccounts.find((p: PersonAccount) => p.personNumber === personNumber);
  };

  const currentPerson = selectedPerson ? getPersonAccount(selectedPerson) : null;

  const handleAmountChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
    }
    
    setAmountReceived(parts.join('.'));
  };

  const getChange = (): number => {
    if (!currentPerson) return 0;
    const received = parseFloat(amountReceived) || 0;
    const total = currency === 'USD' ? currentPerson.total / 520 : currentPerson.total;
    return Math.max(0, received - total);
  };

  const canProcessPayment = (): boolean => {
    if (!currentPerson) return false;
    if (paymentMethod === 'card') return true;
    
    const received = parseFloat(amountReceived) || 0;
    const total = currency === 'USD' ? currentPerson.total / 520 : currentPerson.total;
    
    return received >= (total - 0.01);
  };

  const handleProcessPayment = async () => {
    if (!currentPerson || !canProcessPayment()) return;

    setIsProcessing(true);

    const total = currency === 'USD' ? currentPerson.total / 520 : currentPerson.total;
    const received = parseFloat(amountReceived) || 0;
    const change = getChange();

    const paymentData = {
      method: paymentMethod,
      currency,
      amount: total,
      received: paymentMethod === 'cash' ? received : total,
      total: total,
      change: paymentMethod === 'cash' ? change : 0,
      orderId: order.id,
      tableNumber: table.number
    };

    console.log(`💳 Procesando pago Persona ${selectedPerson}:`, paymentData);

    // Actualizar personAccount como pagada
    const updatedPersonAccount = {
      ...currentPerson,
      paid: true,
      paidAt: new Date(),
      paymentMethod,
      paymentCurrency: currency
    };

    // Procesar pago
    onProcessPersonPayment(updatedPersonAccount, paymentData);

    // Resetear form
    setSelectedPerson(null);
    setAmountReceived('');
    setIsProcessing(false);
  };

  const pendingPersons = manualSplit.personAccounts.filter((p: PersonAccount) => !p.paid);
  const paidPersons = manualSplit.personAccounts.filter((p: PersonAccount) => p.paid);
  const allPaid = pendingPersons.length === 0;

  const quickAmounts = currency === 'CRC' 
    ? [1000, 2000, 5000, 10000, 20000]
    : [5, 10, 20, 50, 100];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
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
                  Cobro por Persona - Mesa {table?.number}
                </h1>
                <p className="text-sm tablet:text-base text-slate-500">
                  {pendingPersons.length} pendientes • {paidPersons.length} pagadas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 tablet:p-6">
        {!selectedPerson ? (
          // Lista de personas
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
            {/* Pendientes */}
            {pendingPersons.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-yellow-600" />
                  Pendientes de Pago
                </h2>
                
                {pendingPersons.map((person: PersonAccount) => (
                  <div
                    key={person.personNumber}
                    className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => setSelectedPerson(person.personNumber)}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">Persona {person.personNumber}</h3>
                          <p className="text-sm text-slate-500">{person.items.length} productos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(person.total)}</p>
                      </div>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                      {person.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-600">{item.quantity}x {item.itemName}</span>
                          <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagadas */}
            {paidPersons.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                  Ya Pagadas
                </h2>
                
                {paidPersons.map((person: PersonAccount) => (
                  <div
                    key={person.personNumber}
                    className="bg-green-50/70 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-green-200 p-6 opacity-75"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div>
                          <h3 className="text-lg font-bold text-green-800">Persona {person.personNumber}</h3>
                          <p className="text-sm text-green-600">
                            {person.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'} • {person.paymentCurrency}
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-green-700">{formatCurrency(person.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {allPaid && (
              <div className="col-span-2 bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 text-center text-white">
                <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">¡Cuenta Completa!</h2>
                <p className="text-lg opacity-90">Todas las personas han pagado</p>
              </div>
            )}
          </div>
        ) : (
          // Formulario de pago individual
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Persona {selectedPerson}</h2>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Volver
                </button>
              </div>

              {/* Items de esta persona */}
              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <h3 className="font-bold text-slate-700 mb-3">Productos:</h3>
                {currentPerson?.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2">
                    <span>{item.quantity}x {item.itemName}</span>
                    <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(currentPerson?.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Servicio (10%):</span>
                    <span>{formatCurrency(currentPerson?.serviceCharge || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-purple-700">
                    <span>Total:</span>
                    <span>{formatCurrency(currentPerson?.total || 0, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Moneda */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">Moneda</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCurrency('CRC')}
                    className={`p-3 rounded-xl font-medium transition-all ${
                      currency === 'CRC'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg'
                        : 'bg-white/50 text-slate-600 hover:bg-white/80'
                    }`}
                  >
                    Colones (₡)
                  </button>
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`p-3 rounded-xl font-medium transition-all ${
                      currency === 'USD'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg'
                        : 'bg-white/50 text-slate-600 hover:bg-white/80'
                    }`}
                  >
                    Dólares ($)
                  </button>
                </div>
              </div>

              {/* Método */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">Método de Pago</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center justify-center space-x-2 p-4 rounded-xl font-medium transition-all ${
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
                    className={`flex items-center justify-center space-x-2 p-4 rounded-xl font-medium transition-all ${
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

              {/* Monto recibido (solo efectivo) */}
              {paymentMethod === 'cash' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Monto Recibido</label>
                  <input
                    type="text"
                    value={amountReceived}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder={`Ingrese monto en ${currency}`}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-lg font-medium"
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

              {/* Botón procesar */}
              <button
                onClick={handleProcessPayment}
                disabled={!canProcessPayment() || isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                  (canProcessPayment() && !isProcessing)
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-lg hover:scale-105'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <span>Procesar Pago</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitPaymentFlow;