import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface OpenCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCash: (crcAmount: number, usdAmount: number) => void;
}

const OpenCashModal: React.FC<OpenCashModalProps> = ({
  isOpen,
  onClose,
  onOpenCash
}) => {
  const [openingCashCRC, setOpeningCashCRC] = useState('');
  const [openingCashUSD, setOpeningCashUSD] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const crcAmount = parseFloat(openingCashCRC) || 0;
    const usdAmount = parseFloat(openingCashUSD) || 0;
    onOpenCash(crcAmount, usdAmount);
    setOpeningCashCRC('');
    setOpeningCashUSD('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl border border-white/20">
        <div className="flex items-center justify-between p-8 border-b border-white/20">
          <h3 className="text-2xl font-bold text-slate-800">Abrir Caja</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Efectivo inicial en Colones (₡)
            </label>
            <input
              type="number"
              value={openingCashCRC}
              onChange={(e) => setOpeningCashCRC(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              placeholder="0"
              min="0"
              step="100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Efectivo inicial en Dólares ($)
            </label>
            <input
              type="number"
              value={openingCashUSD}
              onChange={(e) => setOpeningCashUSD(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Abrir Caja</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OpenCashModal;