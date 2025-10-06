// components/SplitByItemsModal.tsx - VERSIÓN MINIMALISTA
import React, { useState, useEffect } from 'react';
import { Users, X, AlertCircle, Package, Plus, Minus, CheckCircle } from 'lucide-react';
import PinPrompt from '../lib/auth/PinPrompt';
import { hasPinConfigured } from '../lib/auth/pinManager';
import type { ItemAssignment, PersonAccount } from '../types';

interface SplitByItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onConfirmSplit: (manualSplit: any) => void;
}

interface ProductInPool {
  id: string;
  name: string;
  price: number;
  totalQuantity: number;
  assignedQuantity: number;
  availableQuantity: number;
}

interface AssignedProduct {
  itemId: string;
  itemName: string;
  quantity: number;
  pricePerUnit: number;
}

const SplitByItemsModal: React.FC<SplitByItemsModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmSplit
}) => {
  const [peopleCount, setPeopleCount] = useState(2);
  const [personAssignments, setPersonAssignments] = useState<Map<number, AssignedProduct[]>>(new Map());
  const [productPool, setProductPool] = useState<ProductInPool[]>([]);
  const [showPinPrompt, setShowPinPrompt] = useState(false);

  useEffect(() => {
    if (isOpen && order?.items) {
      initializeData();
    }
  }, [isOpen, order]);

  useEffect(() => {
    if (isOpen) {
      // Reset assignments when people count changes
      const newAssignments = new Map<number, AssignedProduct[]>();
      for (let i = 1; i <= peopleCount; i++) {
        newAssignments.set(i, personAssignments.get(i) || []);
      }
      setPersonAssignments(newAssignments);
    }
  }, [peopleCount]);

  const initializeData = () => {
    // Initialize product pool
    const pool: ProductInPool[] = order.items.map((item: any) => ({
      id: item.id,
      name: item.menuItem.name,
      price: item.menuItem.price,
      totalQuantity: item.quantity,
      assignedQuantity: 0,
      availableQuantity: item.quantity
    }));
    setProductPool(pool);

    // Initialize empty assignments
    const assignments = new Map<number, AssignedProduct[]>();
    for (let i = 1; i <= peopleCount; i++) {
      assignments.set(i, []);
    }
    setPersonAssignments(assignments);
  };

  const formatCurrency = (amount: number) => {
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const assignProductToPerson = (personNumber: number, productId: string) => {
    const product = productPool.find(p => p.id === productId);
    if (!product || product.availableQuantity <= 0) return;

    const personProducts = personAssignments.get(personNumber) || [];
    const existingProduct = personProducts.find(p => p.itemId === productId);

    let newPersonProducts: AssignedProduct[];
    if (existingProduct) {
      newPersonProducts = personProducts.map(p =>
        p.itemId === productId
          ? { ...p, quantity: p.quantity + 1 }
          : p
      );
    } else {
      newPersonProducts = [
        ...personProducts,
        {
          itemId: productId,
          itemName: product.name,
          quantity: 1,
          pricePerUnit: product.price
        }
      ];
    }

    const newAssignments = new Map(personAssignments);
    newAssignments.set(personNumber, newPersonProducts);
    setPersonAssignments(newAssignments);

    // Update pool
    setProductPool(productPool.map(p =>
      p.id === productId
        ? {
            ...p,
            assignedQuantity: p.assignedQuantity + 1,
            availableQuantity: p.availableQuantity - 1
          }
        : p
    ));
  };

  const removeProductFromPerson = (personNumber: number, productId: string) => {
    const personProducts = personAssignments.get(personNumber) || [];
    const product = personProducts.find(p => p.itemId === productId);
    if (!product) return;

    let newPersonProducts: AssignedProduct[];
    if (product.quantity > 1) {
      newPersonProducts = personProducts.map(p =>
        p.itemId === productId
          ? { ...p, quantity: p.quantity - 1 }
          : p
      );
    } else {
      newPersonProducts = personProducts.filter(p => p.itemId !== productId);
    }

    const newAssignments = new Map(personAssignments);
    newAssignments.set(personNumber, newPersonProducts);
    setPersonAssignments(newAssignments);

    // Update pool
    setProductPool(productPool.map(p =>
      p.id === productId
        ? {
            ...p,
            assignedQuantity: p.assignedQuantity - 1,
            availableQuantity: p.availableQuantity + 1
          }
        : p
    ));
  };

  const calculatePersonTotal = (personNumber: number): number => {
    const products = personAssignments.get(personNumber) || [];
    const subtotal = products.reduce((sum, p) => sum + (p.quantity * p.pricePerUnit), 0);
    return subtotal * 1.10;
  };

  const isFullyAssigned = (): boolean => {
    return productPool.every(p => p.availableQuantity === 0);
  };

  const handleConfirm = () => {
    if (!hasPinConfigured()) {
      alert('⚠️ No hay PIN configurado.');
      return;
    }

    if (!isFullyAssigned()) {
      alert('⚠️ Debes asignar todos los productos');
      return;
    }

    setShowPinPrompt(true);
  };

  const handlePinSuccess = () => {
    const assignments: ItemAssignment[] = [];
    const personAccounts: PersonAccount[] = [];

    personAssignments.forEach((products, personNumber) => {
      if (products.length === 0) return;

      const subtotal = products.reduce((sum, p) => sum + (p.quantity * p.pricePerUnit), 0);
      const serviceCharge = subtotal * 0.10;
      const total = subtotal + serviceCharge;

      products.forEach(product => {
        assignments.push({
          itemId: product.itemId,
          itemName: product.itemName,
          personNumber,
          quantity: product.quantity,
          pricePerUnit: product.pricePerUnit,
          subtotal: product.quantity * product.pricePerUnit
        });
      });

      personAccounts.push({
        personNumber,
        items: products.map(p => ({
          itemId: p.itemId,
          itemName: p.itemName,
          personNumber,
          quantity: p.quantity,
          pricePerUnit: p.pricePerUnit,
          subtotal: p.quantity * p.pricePerUnit
        })),
        subtotal,
        serviceCharge,
        total,
        paid: false
      });
    });

    const manualSplit = {
      type: 'manual',
      totalPeople: peopleCount,
      assignments,
      personAccounts,
      createdAt: new Date(),
      allPaid: false
    };

    console.log('✅ División manual confirmada:', manualSplit);
    onConfirmSplit(manualSplit);
    handleClose();
  };

  const handleClose = () => {
    setPeopleCount(2);
    setPersonAssignments(new Map());
    setProductPool([]);
    setShowPinPrompt(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Dividir por Artículos</h3>
              <p className="text-sm text-slate-500">Mesa {order?.tableNumber}</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-xl">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* People Count */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Personas:</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => peopleCount > 2 && setPeopleCount(peopleCount - 1)}
                  className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-bold w-12 text-center">{peopleCount}</span>
                <button
                  onClick={() => peopleCount < 10 && setPeopleCount(peopleCount + 1)}
                  className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Person Containers */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: peopleCount }, (_, i) => i + 1).map(personNumber => {
                const products = personAssignments.get(personNumber) || [];
                const total = calculatePersonTotal(personNumber);

                return (
                  <div
                    key={personNumber}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-4 min-h-[200px]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {personNumber}
                        </div>
                        <span className="font-bold text-sm">P{personNumber}</span>
                      </div>
                      <span className="text-lg font-bold text-blue-700">
                        {formatCurrency(total)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {products.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <p className="text-xs">Vacío</p>
                        </div>
                      ) : (
                        products.map((product, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg p-2 flex justify-between items-center group"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-800 truncate">
                                {product.itemName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {product.quantity}x {formatCurrency(product.pricePerUnit)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeProductFromPerson(personNumber, product.itemId)}
                              className="opacity-0 group-hover:opacity-100 p-1 bg-red-100 hover:bg-red-200 rounded transition-all"
                            >
                              <Minus className="w-3 h-3 text-red-700" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Product Pool */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-800">Productos Disponibles</h4>
                {isFullyAssigned() && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-bold">Todo asignado</span>
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                {productPool.filter(p => p.availableQuantity > 0).length === 0 ? (
                  <div className="text-center py-8 text-green-600">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                    <p className="font-bold">Todos los productos asignados</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {productPool.filter(p => p.availableQuantity > 0).map(product => (
                      <div
                        key={product.id}
                        className="bg-white rounded-xl p-4 border border-slate-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h5 className="font-bold text-slate-800">{product.name}</h5>
                            <p className="text-sm text-slate-500">
                              {formatCurrency(product.price)} c/u
                            </p>
                          </div>
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg text-xs font-bold">
                            {product.availableQuantity} disponible
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Array.from({ length: peopleCount }, (_, i) => i + 1).map(personNumber => (
                            <button
                              key={personNumber}
                              onClick={() => assignProductToPerson(personNumber, product.id)}
                              className="py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                            >
                              → P{personNumber}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-6 bg-slate-50 flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isFullyAssigned()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold"
            >
              Confirmar División
            </button>
          </div>
        </div>
      </div>

      <PinPrompt
        isOpen={showPinPrompt}
        onClose={() => setShowPinPrompt(false)}
        onSuccess={handlePinSuccess}
        title="Autorizar División por Artículos"
        description={`Dividiendo entre ${peopleCount} personas`}
      />
    </>
  );
};

export default SplitByItemsModal;