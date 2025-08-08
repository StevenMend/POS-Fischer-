import React, { useState } from 'react';
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

// 🔥 HOOK UNIFICADO - SINGLE SOURCE OF TRUTH
import { useRestaurant } from './hooks/useRestaurant';

const App: React.FC = () => {
  // 🔥 HOOK COMPLETAMENTE INTEGRADO - INCLUYE EXPENSES
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
    // 🔥 NUEVOS - MÉTODOS DE GASTOS
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    getExpensesByType,
    getTodaysExpenses,
    getExpensesInPeriod,
    // 🔥 NUEVOS - ESTADÍSTICAS FINANCIERAS
    getDailySummary,
    getFinancialStats,
    refreshData
  } = useRestaurant();

  // Estados para navegación y modales
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-slate-700 text-xl font-semibold">Cargando Restaurante Fischer...</p>
          <p className="text-slate-500 text-sm mt-2">🔥 Ecosistema Unificado Completo</p>
        </div>
      </div>
    );
  }

  // Calculate totals helper (mantener para compatibilidad)
  const calculateOrderTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const serviceCharge = subtotal * 0.10; // 10%
    const total = subtotal + serviceCharge;
    return { subtotal, serviceCharge, total };
  };

  // Dashboard handlers
  const handleTableClick = (table: any) => {
    if (table.status === 'available') {
      console.log('🍽️ Creando orden para mesa:', table.number);
      const newOrder = createOrder(table.number);
      setSelectedTable(table);
      setSelectedOrder(newOrder);
      setCurrentView('pos');
    } else if (table.status === 'occupied' && table.currentOrder) {
      console.log('💰 Ir a pago para mesa:', table.number);
      setSelectedTable(table);
      setSelectedOrder(table.currentOrder);
      setCurrentView('payment');
    }
  };

  const handleViewOrder = (table: any) => {
    if (table.currentOrder) {
      console.log('👀 Ver orden de mesa:', table.number);
      setSelectedTable(table);
      setSelectedOrder(table.currentOrder);
      setCurrentView('pos');
    }
  };

  const handlePayOrder = (table: any) => {
    if (table.currentOrder) {
      console.log('💳 Cobrar mesa:', table.number);
      setSelectedTable(table);
      setSelectedOrder(table.currentOrder);
      setCurrentView('payment');
    }
  };

  const handleOpenCash = (crcAmount: number, usdAmount: number) => {
    console.log('🏦 Abriendo caja desde App:', { crcAmount, usdAmount });
    openCashRegister(crcAmount, usdAmount);
  };

  const handleCloseCash = () => {
    console.log('🔒 Cerrando caja desde App');
    const record = closeCashRegister();
    console.log('✅ Caja cerrada exitosamente:', record.id);
    alert('✅ Caja cerrada exitosamente. El registro se ha guardado en el Historial de Cierres.');
  };

  // POS handlers
  const handleAddItem = (menuItem: any) => {
    if (!selectedOrder) return;

    console.log('➕ Agregando item:', menuItem.name);
    
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

  // Payment handlers
  const handleProcessPayment = async (paymentData: any) => {
    if (!selectedOrder || !selectedTable) return;

    console.log('💳 Procesando pago:', paymentData);

    try {
      const payment = processPayment(
        selectedOrder.id,
        paymentData.amount,
        paymentData.currency,
        paymentData.method,
        paymentData.received
      );

      console.log('✅ Pago procesado:', payment);

      setPaymentSuccessData({ ...paymentData, table: selectedTable });
      setShowPaymentSuccess(true);
      
    } catch (error) {
      console.error('❌ Error procesando pago:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentSuccess(false);
    setPaymentSuccessData(null);
    setSelectedTable(null);
    setSelectedOrder(null);
    setCurrentView('dashboard');
  };

  // Menu management handlers
  const handleAddMenuItem = (item: any) => {
    console.log('➕ Agregando item al menú:', item.name);
    addMenuItem(item);
  };

  const handleUpdateMenuItem = (updatedItem: any) => {
    console.log('✏️ Actualizando item del menú:', updatedItem.name);
    updateMenuItem(updatedItem);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    console.log('🗑️ Eliminando item del menú:', itemId);
    deleteMenuItem(itemId);
  };

  // Navigation handlers
  const goBack = () => {
    setCurrentView('dashboard');
    setSelectedTable(null);
    setSelectedOrder(null);
  };

  // Render current view
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
          />
        );

      // 🔥 EXPENSES MANAGER COMPLETAMENTE CONECTADO
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

      // 🔥 FINANCIAL REPORTS YA FUNCIONA - LEE DEL ECOSISTEMA UNIFICADO
      case 'financial-reports':
        return (
          <FinancialReports
            onBack={goBack}
            cashRegister={cashRegister}
            todaysOrders={getTodaysOrders()}
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
            onGoToReports={() => setCurrentView('reports')}
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

      {/* 🔥 SETTINGS MODAL CON TODAS LAS FUNCIONES INTEGRADAS */}
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
          setCurrentView('reports');
        }}
        onGoToMenuManager={() => {
          setShowSettings(false);
          setCurrentView('menu-manager');
        }}
        onGoToReports={() => {
          setShowSettings(false);
          setCurrentView('reports');
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
      />

      {/* 🔥 INDICATOR DEL ECOSISTEMA UNIFICADO */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">🔥 Ecosistema Integrado</span>
        </div>
      </div>
    </>
  );
};

export default App;