import React, { useState } from 'react';
import { Tag, AlertCircle, X } from 'lucide-react';
import PinPrompt from '../lib/auth/PinPrompt';
import { hasPinConfigured } from '../lib/auth/pinManager';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onApplyDiscount: (discountType: DiscountType, reason: string) => void;
}

type DiscountType = 'remove_service' | 'percent_10' | 'percent_12' | 'percent_15';

interface DiscountOption {
  type: DiscountType;
  label: string;
  description: string;
  calculation: (subtotal: number) => { total: number; discount: number };
  color: string;
}

const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  order,
  onApplyDiscount
}) => {
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountType | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const formatCurrency = (amount: number) => {
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const discountOptions: DiscountOption[] = [
    {
      type: 'remove_service',
      label: 'Quitar Servicio (10%)',
      description: 'Elimina el cargo de servicio',
      calculation: (subtotal) => ({
        total: subtotal,
        discount: subtotal * 0.10
      }),
      color: 'from-blue-500 to-indigo-600'
    },
    {
      type: 'percent_10',
      label: 'Descuento 10%',
      description: 'Descuento adicional del 10%',
      calculation: (subtotal) => {
        const withService = subtotal * 1.10;
        const discount = withService * 0.10;
        return {
          total: withService - discount,
          discount
        };
      },
      color: 'from-green-500 to-emerald-600'
    },
    {
      type: 'percent_12',
      label: 'Descuento 12%',
      description: 'Descuento adicional del 12%',
      calculation: (subtotal) => {
        const withService = subtotal * 1.10;
        const discount = withService * 0.12;
        return {
          total: withService - discount,
          discount
        };
      },
      color: 'from-yellow-500 to-orange-600'
    },
    {
      type: 'percent_15',
      label: 'Descuento 15%',
      description: 'Descuento adicional del 15%',
      calculation: (subtotal) => {
        const withService = subtotal * 1.10;
        const discount = withService * 0.15;
        return {
          total: withService - discount,
          discount
        };
      },
      color: 'from-red-500 to-rose-600'
    }
  ];

  const reasons = [
    'Cortesía',
    'Promoción',
    'Error en la orden',
    'Cliente frecuente',
    'Compensación',
    'Otro'
  ];

  const handleSelectDiscount = (type: DiscountType) => {
    if (!hasPinConfigured()) {
      alert('⚠️ No hay PIN configurado. Contacta al administrador.');
      return;
    }
    
    setSelectedDiscount(type);
  };

  const handleSelectReason = (reason: string) => {
    setSelectedReason(reason);
    if (reason !== 'Otro') {
      setCustomReason('');
    }
  };

  const handleApply = () => {
    if (!selectedDiscount) {
      alert('Selecciona un tipo de descuento');
      return;
    }
    
    if (!selectedReason) {
      alert('Selecciona una razón para el descuento');
      return;
    }
    
    if (selectedReason === 'Otro' && !customReason.trim()) {
      alert('Especifica la razón del descuento');
      return;
    }
    
    // Solicitar PIN
    setShowPinPrompt(true);
  };

  const handlePinSuccess = () => {
    if (!selectedDiscount || !selectedReason) return;
    
    const finalReason = selectedReason === 'Otro' ? customReason : selectedReason;
    
    console.log('✅ PIN verificado. Aplicando descuento:', {
      type: selectedDiscount,
      reason: finalReason
    });
    
    onApplyDiscount(selectedDiscount, finalReason);
    handleClose();
  };

  const handleClose = () => {
    setSelectedDiscount(null);
    setSelectedReason('');
    setCustomReason('');
    setShowPinPrompt(false);
    onClose();
  };

  if (!isOpen) return null;

  const subtotal = order?.subtotal || 0;
  const currentTotal = order?.total || 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Aplicar Descuento</h3>
                <p className="text-sm text-slate-500">Mesa {order?.tableNumber} • Subtotal: {formatCurrency(subtotal)}</p>
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
            
            {/* Current Total */}
            <div className="bg-gradient-to-br from-slate-100 to-blue-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Total Actual:</span>
                <span className="text-2xl font-bold text-slate-800">{formatCurrency(currentTotal)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Incluye servicio del 10%</p>
            </div>

            {/* Discount Options */}
            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-4">Tipo de Descuento</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {discountOptions.map((option) => {
                  const { total, discount } = option.calculation(subtotal);
                  const isSelected = selectedDiscount === option.type;
                  
                  return (
                    <button
                      key={option.type}
                      onClick={() => handleSelectDiscount(option.type)}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                          : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${option.color} mb-2`}>
                        {option.label}
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{option.description}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Descuento:</span>
                          <span className="font-bold text-red-600">-{formatCurrency(discount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-700 font-medium">Nuevo Total:</span>
                          <span className="font-bold text-green-600 text-lg">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reason Selection */}
            {selectedDiscount && (
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-4">Razón del Descuento</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {reasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => handleSelectReason(reason)}
                      className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        selectedReason === reason
                          ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg scale-105'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                {selectedReason === 'Otro' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Especifica la razón..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    maxLength={100}
                  />
                )}
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Autenticación Requerida</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Se solicitará el PIN de administrador para aplicar el descuento.
                  Esta acción quedará registrada en el sistema.
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
                disabled={!selectedDiscount || !selectedReason || (selectedReason === 'Otro' && !customReason.trim())}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Aplicar Descuento
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
        title="Autorizar Descuento"
        description={`Aplicando ${discountOptions.find(o => o.type === selectedDiscount)?.label}`}
      />
    </>
  );
};

export default DiscountModal;