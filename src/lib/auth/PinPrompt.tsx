import React, { useState, useEffect } from 'react';
import { Lock, AlertTriangle, Clock } from 'lucide-react';
import { verifyPin, isLocked, getFailedAttempts } from './pinManager';

interface PinPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

const PinPrompt: React.FC<PinPromptProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Autenticación Requerida',
  description = 'Ingresa tu PIN de administrador para continuar'
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setLocked(isLocked());
    }
  }, [isOpen]);

  const handlePinInput = (value: string) => {
    // Solo números, máximo 4 dígitos
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setPin(cleaned);
    setError('');
    
    // Auto-submit cuando tenga 4 dígitos
    if (cleaned.length === 4) {
      handleVerify(cleaned);
    }
  };

  const handleVerify = async (pinToVerify: string) => {
    setIsVerifying(true);
    setError('');
    
    try {
      const isValid = verifyPin(pinToVerify);
      
      if (isValid) {
        // PIN correcto
        onSuccess();
        onClose();
      } else {
        // PIN incorrecto
        const attempts = getFailedAttempts();
        setError(`PIN incorrecto. Intento ${attempts}/3`);
        setPin('');
      }
    } catch (err: any) {
      setError(err.message);
      setPin('');
      
      if (err.message.includes('bloqueado')) {
        setLocked(true);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl border-2 border-blue-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-t-3xl">
          <div className="flex items-center space-x-3 mb-2">
            <Lock className="w-6 h-6" />
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <p className="text-blue-100 text-sm">{description}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* PIN Display */}
          <div className="flex justify-center space-x-3 mb-6">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
                  pin.length > index
                    ? 'bg-gradient-to-br from-blue-600 to-purple-700 text-white scale-110 shadow-lg'
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                {pin.length > index ? '●' : ''}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Locked State */}
          {locked && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start space-x-3">
              <Clock className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-orange-800 font-bold mb-1">
                  Sistema Bloqueado
                </p>
                <p className="text-xs text-orange-700">
                  Por seguridad, el sistema está bloqueado por 5 minutos debido a múltiples intentos fallidos.
                </p>
              </div>
            </div>
          )}

          {/* Numpad */}
          {!locked && (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinInput(pin + num)}
                  disabled={isVerifying || pin.length >= 4}
                  className="h-16 bg-gradient-to-br from-slate-100 to-slate-200 hover:from-blue-100 hover:to-purple-100 disabled:opacity-50 rounded-xl text-2xl font-bold text-slate-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                >
                  {num}
                </button>
              ))}
              
              <button
                onClick={onClose}
                className="h-16 bg-gradient-to-br from-red-100 to-rose-200 hover:from-red-200 hover:to-rose-300 rounded-xl text-sm font-bold text-red-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
              >
                Cancelar
              </button>
              
              <button
                onClick={() => handlePinInput(pin + '0')}
                disabled={isVerifying || pin.length >= 4}
                className="h-16 bg-gradient-to-br from-slate-100 to-slate-200 hover:from-blue-100 hover:to-purple-100 disabled:opacity-50 rounded-xl text-2xl font-bold text-slate-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
              >
                0
              </button>
              
              <button
                onClick={handleBackspace}
                disabled={isVerifying || pin.length === 0}
                className="h-16 bg-gradient-to-br from-slate-100 to-slate-200 hover:from-yellow-100 hover:to-amber-100 disabled:opacity-50 rounded-xl text-sm font-bold text-slate-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
              >
                ←
              </button>
            </div>
          )}

          {/* Help Text */}
          <div className="text-center text-xs text-slate-500 space-y-1">
            <p>Ingresa tu PIN de 4 dígitos para continuar</p>
            {!locked && <p>Se bloqueará después de 3 intentos fallidos</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinPrompt;