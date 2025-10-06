import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Payment from './components/Payment';
import MenuManager from './components/MenuManager';
import OpenCashModal from './components/OpenCashModal';
import PaymentSuccess from './components/PaymentSuccess';
import SettingsModal from './components/SettingsModal';
import Reports from './components/Reports';
import ClosureHistory from './components/ClosureHistory';
import ExpensesManager from './components/ExpensesManager';
import FinancialReports from './components/FinancialReports';
import RecoveryModal from './components/RecoveryModal';
import PrinterManager from './components/PrinterManager';

import { useRestaurant } from './hooks/useRestaurant';
import { usePrinter, PrinterProvider } from './contexts/PrinterContext';

const AppContent: React.FC = () => {
  console.log('🚀 [APP] Iniciando aplicación Fischer...');
  
  const {
    tables,
    menuItems,
    cashRegister,
    expenses,
    loading,
    openCashRegister,
    closeCashRegister,
    createOrder,
    updateOrder,
    processPayment,
    getOrder,
    getTodaysOrders,
    getTableByNumber,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    getExpensesByType,
    getTodaysExpenses,
    getExpensesInPeriod,
    getDailySummary,
    getFinancialStats,
    getClosureHistory,
    refreshData,
    detectInconsistentStates,
    repairInconsistentStates,
    freeTable,
    cancelOrderAndFreeTable,
    resetOrder,
    editClosureRecord,
    deleteClosureRecord,
    getDeletedClosures,
    restoreClosureRecord
  } = useRestaurant();

  const {
    connectedPrinters,
    isScanning,
    isPrinting,
    lastError,
    printWithDefaultPrinter,
    printClosureWithDefaultPrinter,
    createReceiptData,
    clearError
  } = usePrinter();

  const [currentView, setCurrentView] = useState<
    'dashboard' | 
    'pos' | 
    'payment' | 
    'menu-manager' | 
    'reports' | 
    'closure-history' |
    'expenses' |
    'financial-reports'
  >('dashboard');
  
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOpenCash, setShowOpenCash] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [navigationState, setNavigationState] = useState(null);
  const [showPrinterManager, setShowPrinterManager] = useState(false);

  // Sistema de recuperación
  useEffect(() => {
    console.log('🔍 [APP] Verificando estado del sistema...');
    
    const issues = detectInconsistentStates();
    if (issues.length > 0) {
      console.warn('⚠️ [APP] Problemas detectados:', issues.length);
      setShowRecoveryModal(true);
    }
    
    attemptNavigationRecovery();
  }, []);

  // 🔥 CONFIGURACIÓN INICIAL DEL PIN
  useEffect(() => {
    import('./lib/auth/pinManager').then(({ hasPinConfigured, setupPin }) => {
      if (!hasPinConfigured()) {
        console.log('⚠️ No hay PIN configurado. Configurando PIN por defecto: 1234');
        setupPin('1234');
        console.log('✅ PIN configurado: 1234');
        console.log('💡 Cambiar desde consola: window.resetAdminPin("NUEVO_PIN")');
      } else {
        console.log('✅ PIN ya configurado');
      }
    });
  }, []);

  const handleContinueOrder = (tableNumber: number, orderId: string) => {
    console.log(`🔄 [APP] Continuando orden: Mesa ${tableNumber}, Orden ${orderId}`);
    
    const table = getTableByNumber(tableNumber);
    const order = getOrder(orderId);
    
    if (table && order) {
      setSelectedTable(table);
      setSelectedOrder(order);
      setCurrentView('pos');
    }
  };

  const attemptNavigationRecovery = () => {
    // Recovery logic
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-slate-700 text-xl font-semibold">Cargando Restaurante Fischer...</p>
          <p className="text-slate-500 text-sm mt-2">Inicializando sistema</p>
        </div>
      </div>
    );
  }

  const calculateOrderTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const serviceCharge = subtotal * 0.10;
    const total = subtotal + serviceCharge;
    return { subtotal, serviceCharge, total };
  };

  const handleTableClick = (table: any) => {
    console.log(`🍽️ [APP] Click en mesa ${table.number} - Estado: ${table.status}`);
    
    if (table.status === 'available') {
      console.log('🆕 [APP] Creando nueva orden...');
      const newOrder = createOrder(table.number);
      setSelectedTable(table);
      setSelectedOrder(newOrder);
      setCurrentView('pos');
    } else if (table.status === 'occupied' && table.currentOrder) {
      console.log('💰 [APP] Ir a pago directo...');
      setSelectedTable(table);
      setSelectedOrder(table.currentOrder);
      setCurrentView('payment');
    }
  };

  const handleViewOrder = (table: any) => {
    if (table.currentOrder) {
      console.log(`👀 [APP] Ver orden de mesa ${table.number}`);
      setSelectedTable(table);
      setSelectedOrder(table.currentOrder);
      setCurrentView('pos');
    }
  };

  const handlePayOrder = (table: any) => {
    if (table.currentOrder) {
      console.log(`💳 [APP] Cobrar mesa ${table.number}`);
      setSelectedTable(table);
      setSelectedOrder(table.currentOrder);
      setCurrentView('payment');
    }
  };

  const handleOpenCash = (crcAmount: number, usdAmount: number) => {
    console.log('🏦 [APP] Abriendo caja:', { crcAmount, usdAmount });
    openCashRegister(crcAmount, usdAmount);
  };

  const handleCloseCash = async () => {
  console.log('🔒 [APP] Cerrando caja...');
  
  try {
    // 1. Cerrar caja y obtener registro
    const record = closeCashRegister();
    console.log('✅ [APP] Caja cerrada exitosamente:', record.id);
    
    // 2. Intentar imprimir cierre automáticamente
    const hasConnectedPrinters = connectedPrinters.some(p => p.connected);
    
    if (hasConnectedPrinters) {
      console.log('🖨️ [APP] Imprimiendo cierre automáticamente...');
      
      // Obtener expenses del día (filtrar por fecha del cierre)
      const closureDate = record.date; // YYYY-MM-DD
      const todaysExpenses = Array.from(expenses || []).filter(
        expense => expense.date === closureDate
      );
      
      console.log(`📊 [APP] Imprimiendo con ${todaysExpenses.length} gastos del día`);
      
      // Imprimir de forma asíncrona (no bloquea el flujo)
      printClosureWithDefaultPrinter(record, todaysExpenses)
        .then(() => {
          console.log('✅ [APP] Cierre impreso exitosamente');
        })
        .catch(err => {
          console.error('❌ [APP] Error imprimiendo cierre:', err);
        });
    } else {
      console.warn('⚠️ [APP] No hay impresoras conectadas - Cierre sin imprimir');
    }
    
    // 3. Navegar a historial de cierres
    setCurrentView('closure-history');
    alert('✅ Caja cerrada exitosamente. Datos guardados en el Historial de Cierres.');
    
  } catch (error) {
    console.error('❌ [APP] Error cerrando caja:', error);
    alert('❌ Error cerrando la caja. Inténtelo nuevamente.');
  }
};

  const handleGoToReports = () => {
    if (cashRegister?.isOpen) {
      setCurrentView('reports');
    } else {
      setCurrentView('closure-history');
    }
  };

  const handleAddItem = (menuItem: any) => {
    if (!selectedOrder) return;

    console.log('➕ [APP] Agregando item:', menuItem.name);
    
    const existingItemIndex = selectedOrder.items.findIndex(
      (item: any) => item.menuItem.id === menuItem.id
    );

    let updatedItems;
    if (existingItemIndex >= 0) {
      updatedItems = selectedOrder.items.map((item: any, index: number) => 
        index === existingItemIndex 
          ? { 
              ...item, 
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * menuItem.price
            }
          : item
      );
    } else {
      const newItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        menuItem,
        quantity: 1,
        notes: '',
        subtotal: menuItem.price
      };
      updatedItems = [...selectedOrder.items, newItem];
    }

    const totals = calculateOrderTotals(updatedItems);
    const updatedOrder = {
      ...selectedOrder,
      items: updatedItems,
      ...totals,
      updatedAt: new Date()
    };

    setSelectedOrder(updatedOrder);
    updateOrder(updatedOrder);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (!selectedOrder) return;

    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    const updatedItems = selectedOrder.items.map((item: any) => 
      item.id === itemId 
        ? { 
            ...item, 
            quantity,
            subtotal: quantity * item.menuItem.price
          }
        : item
    );

    const totals = calculateOrderTotals(updatedItems);
    const updatedOrder = {
      ...selectedOrder,
      items: updatedItems,
      ...totals,
      updatedAt: new Date()
    };

    setSelectedOrder(updatedOrder);
    updateOrder(updatedOrder);
  };

  const handleRemoveItem = (itemId: string) => {
    if (!selectedOrder) return;

    const updatedItems = selectedOrder.items.filter((item: any) => item.id !== itemId);
    const totals = calculateOrderTotals(updatedItems);
    const updatedOrder = {
      ...selectedOrder,
      items: updatedItems,
      ...totals,
      updatedAt: new Date()
    };

    setSelectedOrder(updatedOrder);
    updateOrder(updatedOrder);
  };

  const handleUpdateNotes = (itemId: string, notes: string) => {
    if (!selectedOrder) return;

    const updatedItems = selectedOrder.items.map((item: any) => 
      item.id === itemId ? { ...item, notes } : item
    );

    const updatedOrder = {
      ...selectedOrder,
      items: updatedItems,
      updatedAt: new Date()
    };

    setSelectedOrder(updatedOrder);
    updateOrder(updatedOrder);
  };

  const handleConfirmOrder = () => {
    if (selectedOrder && selectedOrder.items.length > 0) {
      console.log('✅ [APP] Confirmando orden para pago...');
      const updatedOrder = {
        ...selectedOrder,
        status: 'confirmed',
        updatedAt: new Date()
      };
      setSelectedOrder(updatedOrder);
      updateOrder(updatedOrder);
      setCurrentView('payment');
    }
  };

 const handleProcessPayment = async (paymentData: any) => {
  if (!selectedOrder || !selectedTable) return;

  console.log('💳 [APP] Procesando pago:', paymentData);

  try {
    const payment = processPayment(
      selectedOrder.id,
      paymentData.amount,
      paymentData.currency,
      paymentData.method,
      paymentData.received
    );

    console.log('✅ [APP] Pago procesado exitosamente:', payment);

    const hasConnectedPrinters = connectedPrinters.some(p => p.connected);
    
    if (!hasConnectedPrinters) {
      console.warn('⚠️ [APP] No hay impresoras conectadas');
      setPaymentSuccessData({ ...paymentData, table: selectedTable });
      setShowPaymentSuccess(true);
      return;
    }

    console.log('🖨️ [APP] Iniciando impresión automática...');

    // Preparar orden para impresión
    let orderToPrint = selectedOrder;
    
    // Si hay descuento, agregarlo
    if (paymentData.discount) {
      orderToPrint = {
        ...selectedOrder,
        discount: {
          type: paymentData.discount.type,
          amount: paymentData.discount.discountAmount,
          reason: paymentData.discount.reason,
          authorizedBy: 'ADM',
          appliedAt: new Date()
        },
        total: paymentData.discount.originalTotal - paymentData.discount.discountAmount
      };
    }

    const receiptData = createReceiptData(
      orderToPrint,
      { ...payment, ...paymentData },
      selectedTable
    );

    await printWithDefaultPrinter(receiptData);
    console.log('✅ [APP] Ticket impreso exitosamente');

    setPaymentSuccessData({ ...paymentData, table: selectedTable });
    setShowPaymentSuccess(true);
    
  } catch (error) {
    console.error('❌ [APP] Error procesando pago:', error);
    alert('Error procesando el pago. Inténtelo nuevamente.');
  }
};

  const handleAutomaticPrinting = async (paymentData: any, payment: any) => {
    try {
      const hasConnectedPrinters = connectedPrinters.some(p => p.connected);
      
      if (!hasConnectedPrinters) {
        console.warn('⚠️ [APP] No hay impresoras conectadas - Saltando impresión automática');
        return;
      }

      console.log(`🖨️ [APP] Impresoras conectadas encontradas: ${connectedPrinters.filter(p => p.connected).length}`);

      const receiptData = createReceiptData(
        selectedOrder,
        { ...payment, ...paymentData },
        selectedTable
      );

      console.log('📄 [APP] Datos del recibo creados:', {
        receiptNumber: receiptData.receiptNumber,
        items: receiptData.order.items?.length || 0,
        total: receiptData.order.total
      });

      const printSuccess = await printWithDefaultPrinter(receiptData);
      
      if (printSuccess) {
        console.log('🎉 [APP] Recibo impreso automáticamente!');
      } else {
        console.warn('⚠️ [APP] Error en impresión automática - Continuando sin ticket');
      }

    } catch (error: any) {
      console.error('❌ [APP] Error en impresión automática:', error);
    }
  };

  const handleEditOrder = () => {
    console.log('✏️ [APP] Editando orden - Volver al POS');
    setCurrentView('pos');
  };

  const handleCancelOrder = () => {
    if (selectedOrder && confirm('¿Seguro que quieres cancelar esta orden?')) {
      console.log('🗑️ [APP] Cancelando orden completa');
      cancelOrderAndFreeTable(selectedOrder.id);
      setCurrentView('dashboard');
      setSelectedTable(null);
      setSelectedOrder(null);
    }
  };

  const handlePaymentSuccess = () => {
    console.log('🎉 [APP] Pago completado - Regresando al dashboard');
    setShowPaymentSuccess(false);
    setPaymentSuccessData(null);
    setSelectedTable(null);
    setSelectedOrder(null);
    setCurrentView('dashboard');
  };

  const handleAddMenuItem = (item: any) => {
    console.log('➕ [APP] Agregando item al menú:', item.name);
    addMenuItem(item);
  };

  const handleUpdateMenuItem = (updatedItem: any) => {
    console.log('✏️ [APP] Actualizando item del menú:', updatedItem.name);
    updateMenuItem(updatedItem);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    console.log('🗑️ [APP] Eliminando item del menú:', itemId);
    deleteMenuItem(itemId);
  };

  const goBack = () => {
    console.log('🔙 [APP] Regresando al dashboard');
    setCurrentView('dashboard');
    setSelectedTable(null);
    setSelectedOrder(null);
  };

  const handleShowPrinterManager = () => {
    console.log('🖨️ [APP] Abriendo gestor de impresoras');
    setShowSettings(false);
    setShowPrinterManager(true);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'pos':
        return (
          <POS
            table={selectedTable}
            currentOrder={selectedOrder}
            menuItems={menuItems}
            onBack={goBack}
            onAddItem={handleAddItem}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onUpdateNotes={handleUpdateNotes}
            onConfirmOrder={handleConfirmOrder}
          />
        );

      case 'payment':
        return (
          <Payment
            order={selectedOrder}
            table={selectedTable}
            onBack={goBack}
            onProcessPayment={handleProcessPayment}
            onEditOrder={handleEditOrder}
            onCancelOrder={handleCancelOrder}
            updateOrder={updateOrder}
          />
        );

      case 'menu-manager':
        return (
          <MenuManager
            menuItems={menuItems}
            onBack={goBack}
            onAddItem={handleAddMenuItem}
            onUpdateItem={handleUpdateMenuItem}
            onDeleteItem={handleDeleteMenuItem}
          />
        );

      case 'reports':
        return (
          <Reports
            cashRegister={cashRegister}
            todaysOrders={getTodaysOrders()}
            tables={tables}
            onBack={goBack}
            onCloseCash={handleCloseCash}
          />
        );

      case 'closure-history':
        return (
          <ClosureHistory
            onBack={goBack}
            getClosureHistory={getClosureHistory}
            editClosureRecord={editClosureRecord}
            deleteClosureRecord={deleteClosureRecord}
            getDeletedClosures={getDeletedClosures}
            restoreClosureRecord={restoreClosureRecord}
          />
        );

      case 'expenses':
        return (
          <ExpensesManager
            onBack={goBack}
            expenses={expenses || []}
            addExpense={addExpense}
            updateExpense={updateExpense}
            deleteExpense={deleteExpense}
            getExpensesByCategory={getExpensesByCategory}
            getExpensesByType={getExpensesByType}
            getTodaysExpenses={getTodaysExpenses}
          />
        );

      case 'financial-reports':
        return (
          <FinancialReports
            onBack={goBack}
            expenses={expenses || []}
            getFinancialStats={getFinancialStats}
            getClosureHistory={getClosureHistory}
          />
        );

      default:
        return (
          <Dashboard
            tables={tables}
            cashRegister={cashRegister}
            todaysOrders={getTodaysOrders()}
            onTableClick={handleTableClick}
            onViewOrder={handleViewOrder}
            onPayOrder={handlePayOrder}
            onOpenCash={() => setShowOpenCash(true)}
            onGoToMenuManager={() => setCurrentView('menu-manager')}
            onGoToReports={() => handleGoToReports()}
            onGoToClosureHistory={() => setCurrentView('closure-history')}
            onShowSettings={() => setShowSettings(true)}
          />
        );
    }
  };

  return (
    <>
      {renderCurrentView()}
      
      <OpenCashModal
        isOpen={showOpenCash}
        onClose={() => setShowOpenCash(false)}
        onOpenCash={handleOpenCash}
      />

      <PaymentSuccess
        isVisible={showPaymentSuccess}
        table={selectedTable}
        paymentData={paymentSuccessData}
        onComplete={handlePaymentSuccess}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        cashRegister={cashRegister}
        onOpenCash={() => {
          setShowSettings(false);
          setShowOpenCash(true);
        }}
        onCloseCash={() => {
          setShowSettings(false);
          handleCloseCash();
        }}
        onGoToMenuManager={() => {
          setShowSettings(false);
          setCurrentView('menu-manager');
        }}
        onGoToReports={() => {
          setShowSettings(false);
          handleGoToReports();
        }}
        onGoToClosureHistory={() => {
          setShowSettings(false);
          setCurrentView('closure-history');
        }}
        onGoToExpenses={() => {
          setShowSettings(false);
          setCurrentView('expenses');
        }}
        onGoToFinancialReports={() => {
          setShowSettings(false);
          setCurrentView('financial-reports');
        }}
        onShowPrinterManager={handleShowPrinterManager}
      />

      <PrinterManager
        isOpen={showPrinterManager}
        onClose={() => setShowPrinterManager(false)}
      />

      <RecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        detectInconsistentStates={detectInconsistentStates}
        repairInconsistentStates={repairInconsistentStates}
        freeTable={freeTable}
        cancelOrderAndFreeTable={cancelOrderAndFreeTable}
        resetOrder={resetOrder}
        onContinueOrder={handleContinueOrder}
      />

      {isPrinting && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 z-50">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Imprimiendo ticket...</span>
        </div>
      )}

      {lastError && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 z-50">
          <span>Error impresión: {lastError}</span>
          <button
            onClick={clearError}
            className="text-white hover:text-red-200 font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <PrinterProvider>
      <AppContent />
    </PrinterProvider>
  );
};

export default App;