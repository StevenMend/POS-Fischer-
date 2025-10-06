import React, { useState, useEffect } from 'react';

import { Users, X, AlertCircle, Calculator } from 'lucide-react';

import PinPrompt from '../lib/auth/PinPrompt';

import { hasPinConfigured } from '../lib/auth/pinManager';

interface SplitBillModalProps {

  isOpen: boolean;

  onClose: () => void;

  order: any;

  onSplitConfirm: (splits: SplitPayment[]) => void;

}

interface SplitPayment {

  personNumber: number;

  amount: number;

}

const SplitBillModal: React.FC<SplitBillModalProps> = ({

  isOpen,

  onClose,

  order,

  onSplitConfirm

}) => {

  const [mode, setMode] = useState<'equal' | 'custom'>('equal');

  const [peopleCount, setPeopleCount] = useState(2);

  const [customAmounts, setCustomAmounts] = useState<number[]>([]);

  const [showPinPrompt, setShowPinPrompt] = useState(false);

  const total = order?.total || 0;

  useEffect(() => {

    if (isOpen) {

      setPeopleCount(2);

      setMode('equal');

      setCustomAmounts([]);

    }

  }, [isOpen]);

  useEffect(() => {

    if (mode === 'custom') {

      // Inicializar con montos vacíos

      setCustomAmounts(Array(peopleCount).fill(0));

    }

  }, [mode, peopleCount]);

  const formatCurrency = (amount: number) => {

    return `₡${Math.round(amount).toLocaleString('es-CR')}`;

  };

  const getEqualSplit = (): number => {

    return Math.round(total / peopleCount);

  };

  const getCustomTotal = (): number => {

    return customAmounts.reduce((sum, amount) => sum + amount, 0);

  };

  const getRemaining = (): number => {

    return total - getCustomTotal();

  };

  const handleCustomAmountChange = (index: number, value: string) => {

    const numValue = parseInt(value.replace(/\D/g, '')) || 0;

    const newAmounts = [...customAmounts];

    newAmounts[index] = numValue;

    setCustomAmounts(newAmounts);

  };

  const handleApply = () => {

    if (!hasPinConfigured()) {

      alert('⚠️ No hay PIN configurado. Contacta al administrador.');

      return;

    }

    if (mode === 'custom') {

      const remaining = getRemaining();

      if (Math.abs(remaining) > 1) {

        alert(`⚠️ Falta asignar ${formatCurrency(Math.abs(remaining))}`);

        return;

      }

    }

    // Solicitar PIN

    setShowPinPrompt(true);

  };

  const handlePinSuccess = () => {

    const splits: SplitPayment[] = [];

    if (mode === 'equal') {

      const equalAmount = getEqualSplit();

      const remainder = total - (equalAmount * peopleCount);

      

      for (let i = 0; i < peopleCount; i++) {

        splits.push({

          personNumber: i + 1,

          amount: i === 0 ? equalAmount + remainder : equalAmount

        });

      }

    } else {

      customAmounts.forEach((amount, index) => {

        if (amount > 0) {

          splits.push({

            personNumber: index + 1,

            amount

          });

        }

      });

    }

    console.log('✅ División de cuenta aprobada:', splits);

    onSplitConfirm(splits);

    handleClose();

  };

  const handleClose = () => {

    setPeopleCount(2);

    setMode('equal');

    setCustomAmounts([]);

    setShowPinPrompt(false);

    onClose();

  };

  if (!isOpen) return null;

  return (

    <>

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">

          

          {/* Header */}

          <div className="flex items-center justify-between p-6 border-b border-slate-200">

            <div className="flex items-center space-x-3">              <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Dividir Cuenta</h3>
                <p className="text-sm text-slate-500">Mesa {order?.tableNumber} • Total: {formatCurrency(total)}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Total Display */}
            <div className="bg-gradient-to-br from-emerald-100 to-green-50 rounded-2xl p-4 border border-emerald-200">
              <div className="flex justify-between items-center">
                <span className="text-emerald-800 font-medium">Total a Dividir:</span>
                <span className="text-3xl font-bold text-emerald-900">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Mode Selection */}
            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-4">Método de División</h4>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('equal')}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                    mode === 'equal'
                      ? 'border-green-600 bg-green-50 shadow-lg'
                      : 'border-slate-200 bg-white hover:border-green-300'
                  }`}
                >
                  <Calculator className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-bold text-slate-800">Partes Iguales</p>
                  <p className="text-sm text-slate-500 mt-1">Dividir equitativamente</p>
                </button>

                <button
                  onClick={() => setMode('custom')}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                    mode === 'custom'
                      ? 'border-green-600 bg-green-50 shadow-lg'
                      : 'border-slate-200 bg-white hover:border-green-300'
                  }`}
                >
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-bold text-slate-800">Montos Distintos</p>
                  <p className="text-sm text-slate-500 mt-1">Personalizar por persona</p>
                </button>
              </div>
            </div>

            {/* People Count Selector */}
            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-4">¿Entre cuántas personas?</h4>
              <div className="grid grid-cols-5 gap-3">
                {[2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => setPeopleCount(count)}
                    className={`py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                      peopleCount === count
                        ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg scale-110'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Equal Split Display */}
            {mode === 'equal' && (
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <h4 className="text-lg font-bold text-slate-800 mb-4">División Equitativa</h4>
                <div className="space-y-3">
                  {Array.from({ length: peopleCount }, (_, i) => {
                    const amount = i === 0 
                      ? getEqualSplit() + (total - (getEqualSplit() * peopleCount))
                      : getEqualSplit();
                    
                    return (
                      <div key={i} className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
                        <span className="font-medium text-slate-700">Persona {i + 1}</span>
                        <span className="text-xl font-bold text-green-600">{formatCurrency(amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Split Input */}
            {mode === 'custom' && (
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-slate-800">Montos Personalizados</h4>
                  <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                    Math.abs(getRemaining()) < 1
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    Restante: {formatCurrency(getRemaining())}
                  </div>
                </div>

                <div className="space-y-3">
                  {Array.from({ length: peopleCount }, (_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-24 text-right">
                        <span className="font-medium text-slate-700">Persona {i + 1}:</span>
                      </div>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₡</span>
                        <input
                          type="text"
                          value={customAmounts[i] || ''}
                          onChange={(e) => handleCustomAmountChange(i, e.target.value)}
                          placeholder="0"
                          className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-right font-bold"
                        />
                      </div>
                      <div className="w-32 text-left">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(customAmounts[i] || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Check */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">Total Asignado:</span>
                    <span className={`text-xl font-bold ${
                      Math.abs(getRemaining()) < 1 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(getCustomTotal())}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Autenticación Requerida</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Se solicitará el PIN de administrador para dividir la cuenta.
                  Cada persona pagará su parte por separado.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-6 bg-slate-50">
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={mode === 'custom' && Math.abs(getRemaining()) > 1}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Dividir Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PIN Prompt */}
      <PinPrompt
        isOpen={showPinPrompt}
        onClose={() => setShowPinPrompt(false)}
        onSuccess={handlePinSuccess}
        title="Autorizar División de Cuenta"
        description={`Dividiendo entre ${peopleCount} personas`}
      />
    </>
  );
};

export default SplitBillModal;