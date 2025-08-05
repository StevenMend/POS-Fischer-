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

// MENÚ REAL DEL RESTAURANTE FISCHER
const REAL_MENU_ITEMS = [
  // Comidas Rápidas
  { id: '1', name: 'Hamburguesa', price: 3000, category: 'Comidas Rápidas', available: true, description: 'Hamburguesa completa' },
  { id: '2', name: 'Sandwich Carne', price: 2500, category: 'Comidas Rápidas', available: true, description: 'Sandwich de carne' },
  { id: '3', name: 'Sandwich Pollo', price: 2500, category: 'Comidas Rápidas', available: true, description: 'Sandwich de pollo' },
  { id: '4', name: 'Sandwich Jamón y Queso', price: 2000, category: 'Comidas Rápidas', available: true, description: 'Sandwich jamón y queso' },
  { id: '5', name: 'Nachos', price: 4000, category: 'Comidas Rápidas', available: true, description: 'Nachos con queso y jalapeños' },
  { id: '6', name: 'French Fries', price: 2000, category: 'Comidas Rápidas', available: true, description: 'Papas fritas crujientes' },

  // Bebidas Calientes
  { id: '7', name: 'Café Negro', price: 1000, category: 'Bebidas Calientes', available: true, description: 'Café negro tradicional' },
  { id: '8', name: 'Café con Leche', price: 1000, category: 'Bebidas Calientes', available: true, description: 'Café con leche' },
  { id: '9', name: 'Agua Dulce', price: 800, category: 'Bebidas Calientes', available: true, description: 'Agua dulce de tapa de dulce' },
  { id: '10', name: 'Chocolate', price: 1000, category: 'Bebidas Calientes', available: true, description: 'Chocolate caliente' },

  // Desayunos
  { id: '11', name: 'Pinto Fischer', price: 4500, category: 'Desayunos', available: true, description: 'Gallo pinto especial Fischer' },
  { id: '12', name: 'Pinto Completo', price: 3000, category: 'Desayunos', available: true, description: 'Gallo pinto completo' },
  { id: '13', name: 'Pinto Huevos Rancheros', price: 3000, category: 'Desayunos', available: true, description: 'Pinto con huevos rancheros' },
  { id: '14', name: 'Tortilla Aliñada', price: 3000, category: 'Desayunos', available: true, description: 'Tortilla aliñada tradicional' },
  { id: '15', name: 'Omelette', price: 2800, category: 'Desayunos', available: true, description: 'Omelette de huevos' },
  { id: '16', name: 'Maduro con Queso', price: 1800, category: 'Desayunos', available: true, description: 'Plátano maduro con queso' },

  // Arma tu Pinto
  { id: '17', name: 'Pinto Base', price: 1000, category: 'Arma tu Pinto', available: true, description: 'Gallo pinto base' },
  { id: '18', name: 'Huevos', price: 1200, category: 'Arma tu Pinto', available: true, description: 'Huevos preparados' },
  { id: '19', name: 'Queso', price: 700, category: 'Arma tu Pinto', available: true, description: 'Queso fresco' },
  { id: '20', name: 'Natilla', price: 700, category: 'Arma tu Pinto', available: true, description: 'Natilla casera' },
  { id: '21', name: 'Carne en Salsa', price: 1500, category: 'Arma tu Pinto', available: true, description: 'Carne en salsa' },
  { id: '22', name: 'Pollo en Salsa', price: 1500, category: 'Arma tu Pinto', available: true, description: 'Pollo en salsa' },
  { id: '23', name: 'Salchichón', price: 700, category: 'Arma tu Pinto', available: true, description: 'Salchichón frito' },
  { id: '24', name: 'Tortilla Palmeada', price: 700, category: 'Arma tu Pinto', available: true, description: 'Tortilla palmeada' },

  // Casados
  { id: '25', name: 'Casado Pollo', price: 3500, category: 'Casados', available: true, description: 'Casado con pollo' },
  { id: '26', name: 'Casado Pescado', price: 3500, category: 'Casados', available: true, description: 'Casado con pescado' },
  { id: '27', name: 'Casado Camarones', price: 4500, category: 'Casados', available: true, description: 'Casado con camarones' },
  { id: '28', name: 'Casado Hígado', price: 3500, category: 'Casados', available: true, description: 'Casado con hígado' },
  { id: '29', name: 'Casado Chicharrón', price: 4500, category: 'Casados', available: true, description: 'Casado con chicharrón' },
  { id: '30', name: 'Casado Bistec Res', price: 4500, category: 'Casados', available: true, description: 'Casado con bistec de res' },
  { id: '31', name: 'Casado Chuleta', price: 3500, category: 'Casados', available: true, description: 'Casado con chuleta' },
  { id: '32', name: 'Casado Carne Salsa', price: 3500, category: 'Casados', available: true, description: 'Casado con carne en salsa' },
  { id: '33', name: 'Casado Pollo Salsa', price: 3000, category: 'Casados', available: true, description: 'Casado con pollo en salsa' },
  { id: '34', name: 'Casado Vegetariano', price: 3500, category: 'Casados', available: true, description: 'Casado vegetariano' },

  // Mariscos
  { id: '35', name: 'Arroz con Mariscos', price: 4500, category: 'Mariscos', available: true, description: 'Arroz con mariscos variados' },
  { id: '36', name: 'Arroz con Camarones', price: 4500, category: 'Mariscos', available: true, description: 'Arroz con camarones' },
  { id: '37', name: 'Camarones Empanizados', price: 6000, category: 'Mariscos', available: true, description: 'Camarones empanizados crujientes' },
  { id: '38', name: 'Pescado al Ajillo', price: 4500, category: 'Mariscos', available: true, description: 'Pescado al ajillo' },
  { id: '39', name: 'Pescado con Coco', price: 5000, category: 'Mariscos', available: true, description: 'Pescado en salsa de coco' },
  { id: '40', name: 'Ceviche', price: 4000, category: 'Mariscos', available: true, description: 'Ceviche fresco del día' },
  { id: '41', name: 'Dedos de Pescado', price: 5000, category: 'Mariscos', available: true, description: 'Dedos de pescado empanizados' },
  { id: '42', name: 'Sopa de Mariscos', price: 5000, category: 'Mariscos', available: true, description: 'Sopa de mariscos variados' },

  // Platillos
  { id: '43', name: 'Arroz con Pollo', price: 4000, category: 'Platillos', available: true, description: 'Arroz con pollo tradicional' },
  { id: '44', name: 'Arroz Fischer', price: 4500, category: 'Platillos', available: true, description: 'Arroz especial Fischer' },
  { id: '45', name: 'Filet de Pollo a la Plancha', price: 4500, category: 'Platillos', available: true, description: 'Filet de pollo a la plancha' },
  { id: '46', name: 'Dedos de Pollo', price: 4500, category: 'Platillos', available: true, description: 'Dedos de pollo empanizados' },
  { id: '47', name: 'Fajitas de Pollo', price: 4500, category: 'Platillos', available: true, description: 'Fajitas de pollo con vegetales' },
  { id: '48', name: 'Fajitas de Res', price: 4500, category: 'Platillos', available: true, description: 'Fajitas de res con vegetales' },
  { id: '49', name: 'Chicharrones', price: 5000, category: 'Platillos', available: true, description: 'Chicharrones crujientes' },
  { id: '50', name: 'Chifrijo', price: 4500, category: 'Platillos', available: true, description: 'Chifrijo tradicional costarricense' },

  // Bebidas Frías
  { id: '51', name: 'Cerveza', price: 1300, category: 'Bebidas Frías', available: true, description: 'Cerveza fría' },
  { id: '52', name: 'Sodas', price: 1000, category: 'Bebidas Frías', available: true, description: 'Sodas variadas' },
  { id: '53', name: 'Frescos Naturales', price: 800, category: 'Bebidas Frías', available: true, description: 'Frescos naturales de frutas' },
  { id: '54', name: 'Batido en Agua', price: 1500, category: 'Bebidas Frías', available: true, description: 'Batido de frutas en agua' },
  { id: '55', name: 'Batido en Leche', price: 2000, category: 'Bebidas Frías', available: true, description: 'Batido de frutas en leche' },
  { id: '56', name: 'Batido Mixto', price: 2200, category: 'Bebidas Frías', available: true, description: 'Batido mixto de frutas' }
];

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'pos' | 'payment' | 'menu-manager' | 'reports' | 'closure-history'>('dashboard');
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOpenCash, setShowOpenCash] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);

  // State
  const [tables, setTables] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>(REAL_MENU_ITEMS);
  const [cashRegister, setCashRegister] = useState<any>({
    isOpen: false,
    openingCashCRC: 0,
    openingCashUSD: 0,
    currentCashCRC: 0,
    currentCashUSD: 0,
    totalSalesCRC: 0,
    totalSalesUSD: 0,
    totalOrders: 0
  });

  // Initialize tables
  useEffect(() => {
    const initialTables = [];
    for (let i = 1; i <= 15; i++) {
      const seats = i <= 4 ? 2 : i <= 8 ? 4 : i <= 12 ? 6 : 8;
      initialTables.push({
        id: generateId(),
        number: i,
        seats,
        status: 'available',
        currentOrder: null
      });
    }
    setTables(initialTables);
  }, []);

  // Get today's orders
  const getTodaysOrders = () => {
    const today = new Date().toDateString();
    return orders.filter(order => 
      new Date(order.createdAt).toDateString() === today && !order.archived
    );
  };

  // Create order
  const createOrder = (tableNumber: number) => {
    const newOrder = {
      id: generateId(),
      tableNumber,
      items: [],
      subtotal: 0,
      serviceCharge: 0,
      total: 0,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setOrders(prev => [...prev, newOrder]);
    
    // Update table status
    setTables(prev => prev.map(table => 
      table.number === tableNumber 
        ? { ...table, status: 'occupied', currentOrder: newOrder }
        : table
    ));

    return newOrder;
  };

  // Update order
  const updateOrder = (updatedOrder: any) => {
    setOrders(prev => prev.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ));

    // Update table
    setTables(prev => prev.map(table => 
      table.currentOrder?.id === updatedOrder.id 
        ? { ...table, currentOrder: updatedOrder }
        : table
    ));
  };

  // Calculate totals
  const calculateOrderTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const serviceCharge = subtotal * 0.10; // 10%
    const total = subtotal + serviceCharge;
    return { subtotal, serviceCharge, total };
  };

  // Dashboard handlers
  const handleTableClick = (table: any) => {
    if (table.status === 'available') {
      // Create new order and go to POS
      const newOrder = createOrder(table.number);
      setSelectedTable(table);
      setSelectedOrder(newOrder);
      setCurrentView('pos');
    } else if (table.status === 'occupied' && table.currentOrder) {
      // Go to payment for existing order
      setSelectedTable(table);
      setSelectedOrder(table.currentOrder);
      setCurrentView('payment');
    }
  };

  const handleViewOrder = (table: any) => {
    if (table.currentOrder) {
      setSelectedTable(table);
      setSelectedOrder(table.currentOrder);
      setCurrentView('pos');
    }
  };

  const handlePayOrder = (table: any) => {
    if (table.currentOrder) {
      setSelectedTable(table);
      setSelectedOrder(table.currentOrder);
      setCurrentView('payment');
    }
  };

  const handleOpenCash = (crcAmount: number, usdAmount: number) => {
    setCashRegister({
      ...cashRegister,
      isOpen: true,
      openingCashCRC: crcAmount,
      openingCashUSD: usdAmount,
      currentCashCRC: crcAmount,
      currentCashUSD: usdAmount,
      openedAt: new Date()
    });
  };

  const handleCloseCash = () => {
    const paidOrders = getTodaysOrders().filter(order => order.status === 'paid');
    
    // Guardar registro de cierre en historial
    const closureRecord = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      openingCashCRC: cashRegister.openingCashCRC,
      openingCashUSD: cashRegister.openingCashUSD,
      closingCashCRC: cashRegister.currentCashCRC,
      closingCashUSD: cashRegister.currentCashUSD,
      totalSalesCRC: cashRegister.totalSalesCRC,
      totalSalesUSD: cashRegister.totalSalesUSD,
      totalOrders: cashRegister.totalOrders,
      cashPaymentsCRC: paidOrders.filter(o => o.paymentMethod === 'cash' && (o.paymentCurrency === 'CRC' || !o.paymentCurrency)).reduce((sum, o) => sum + (o.paymentAmount || o.total), 0),
      cashPaymentsUSD: paidOrders.filter(o => o.paymentMethod === 'cash' && o.paymentCurrency === 'USD').reduce((sum, o) => sum + (o.paymentAmount || o.total), 0),
      cardPaymentsCRC: paidOrders.filter(o => o.paymentMethod === 'card' && (o.paymentCurrency === 'CRC' || !o.paymentCurrency)).reduce((sum, o) => sum + (o.paymentAmount || o.total), 0),
      cardPaymentsUSD: paidOrders.filter(o => o.paymentMethod === 'card' && o.paymentCurrency === 'USD').reduce((sum, o) => sum + (o.paymentAmount || o.total), 0),
      averageOrderValue: cashRegister.totalOrders > 0 ? cashRegister.totalSalesCRC / cashRegister.totalOrders : 0,
      openedAt: cashRegister.openedAt?.toISOString() || new Date().toISOString(),
      closedAt: new Date().toISOString()
    };

    // Guardar en historial
    const existingHistory = JSON.parse(localStorage.getItem('fischer_closure_history') || '[]');
    existingHistory.push(closureRecord);
    localStorage.setItem('fischer_closure_history', JSON.stringify(existingHistory));

    // Mostrar confirmación de guardado
    console.log('💾 Registro de cierre guardado:', closureRecord);
    
    // Resetear completamente la caja para el nuevo día
    setCashRegister({
      isOpen: false,
      openingCashCRC: 0,
      openingCashUSD: 0,
      currentCashCRC: 0,
      currentCashUSD: 0,
      totalSalesCRC: 0,
      totalSalesUSD: 0,
      totalOrders: 0,
      closedAt: new Date()
    });

    // Limpiar órdenes del día anterior (opcional, mantener historial pero resetear contadores)
    // Esto asegura que getTodaysOrders() devuelva 0 para el nuevo día
    setOrders(prev => prev.map(order => ({
      ...order,
      // Marcar órdenes como archivadas o del día anterior
      archived: order.status === 'paid'
    })));

    // Liberar todas las mesas ocupadas (nuevo día, nuevo inicio)
    setTables(prev => prev.map(table => ({
      ...table,
      status: 'available',
      currentOrder: null
    })));
  };

  // POS handlers
  const handleAddItem = (menuItem: any) => {
    if (!selectedOrder) return;

    const existingItemIndex = selectedOrder.items.findIndex(
      (item: any) => item.menuItem.id === menuItem.id
    );

    let updatedItems;
    if (existingItemIndex >= 0) {
      // Update existing item
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
      // Add new item
      const newItem = {
        id: generateId(),
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

    // Update cash register
    const updatedCashRegister = { ...cashRegister };
    if (paymentData.currency === 'CRC') {
      updatedCashRegister.totalSalesCRC += paymentData.amount;
      if (paymentData.method === 'cash') {
        updatedCashRegister.currentCashCRC += paymentData.amount;
      }
    } else {
      updatedCashRegister.totalSalesUSD += paymentData.amount;
      if (paymentData.method === 'cash') {
        updatedCashRegister.currentCashUSD += paymentData.amount;
      }
    }
    updatedCashRegister.totalOrders += 1;
    setCashRegister(updatedCashRegister);

    // Mark order as paid
    const paidOrder = {
      ...selectedOrder,
      status: 'paid',
      paymentMethod: paymentData.method,
      paymentCurrency: paymentData.currency,
      paymentAmount: paymentData.amount,
      updatedAt: new Date()
    };
    updateOrder(paidOrder);

    // Free table
    setTables(prev => prev.map(table => 
      table.id === selectedTable.id 
        ? { ...table, status: 'available', currentOrder: null }
        : table
    ));

    // Show success and redirect
    setPaymentSuccessData({ ...paymentData, table: selectedTable });
    setShowPaymentSuccess(true);
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
    const newItem = {
      ...item,
      id: generateId()
    };
    setMenuItems(prev => [...prev, newItem]);
  };

  const handleUpdateMenuItem = (updatedItem: any) => {
    setMenuItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
  };

  const handleDeleteMenuItem = (itemId: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
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
            onGoToReports={() => {}} // TODO: Implement reports
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
      />
    </>
  );
};

export default App;