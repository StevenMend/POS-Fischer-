import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

interface PaymentSuccessProps {
  isVisible: boolean;
  table: any;
  paymentData: any;
  onComplete: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  isVisible,
  table,
  paymentData,
  onComplete
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const formatCurrency = (amount: number, currency: 'CRC' | 'USD' = 'CRC') => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-12 text-center max-w-md mx-4 animate-pulse">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
          <Check className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-3xl font-bold text-slate-800 mb-4">¡Pago Procesado!</h2>
        <p className="text-slate-600 mb-8 text-lg">
          El pago de la Mesa {table?.number} ha sido procesado exitosamente.
        </p>
        
        {paymentData?.method === 'cash' && paymentData?.change > 0 && (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6 mb-8">
            <p className="text-sm text-yellow-800 mb-2 font-medium">Cambio a entregar:</p>
            <p className="text-3xl font-bold text-yellow-900">
              {formatCurrency(paymentData.change, paymentData.currency)}
            </p>
          </div>
        )}
        
        <div className="text-sm text-slate-500">
          Redirigiendo al dashboard en 3 segundos...
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;