import { useState, useCallback } from 'react';
import { ViewType } from '../types';

export const useNavigation = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Navegar a una vista específica
  const navigateTo = useCallback((view: ViewType, tableId?: string, orderId?: string) => {
    setCurrentView(view);
    if (tableId) setSelectedTableId(tableId);
    if (orderId) setSelectedOrderId(orderId);
  }, []);

  // Navegar al dashboard
  const goToDashboard = useCallback(() => {
    setCurrentView('dashboard');
    setSelectedTableId(null);
    setSelectedOrderId(null);
  }, []);

  // Navegar al POS para una mesa específica
  const goToPOS = useCallback((tableId: string) => {
    setCurrentView('pos');
    setSelectedTableId(tableId);
    setSelectedOrderId(null);
  }, []);

  // Navegar al pago para una orden específica
  const goToPayment = useCallback((orderId: string, tableId?: string) => {
    setCurrentView('payment');
    setSelectedOrderId(orderId);
    if (tableId) setSelectedTableId(tableId);
  }, []);

  // Navegar al gestor de menú
  const goToMenuManager = useCallback(() => {
    setCurrentView('menu-manager');
    setSelectedTableId(null);
    setSelectedOrderId(null);
  }, []);

  // Navegar a reportes
  const goToReports = useCallback(() => {
    setCurrentView('reports');
    setSelectedTableId(null);
    setSelectedOrderId(null);
  }, []);

  // Limpiar selecciones
  const clearSelections = useCallback(() => {
    setSelectedTableId(null);
    setSelectedOrderId(null);
  }, []);

  return {
    // Estado actual
    currentView,
    selectedTableId,
    selectedOrderId,
    
    // Navegación genérica
    navigateTo,
    
    // Navegación específica
    goToDashboard,
    goToPOS,
    goToPayment,
    goToMenuManager,
    goToReports,
    
    // Utilidades
    clearSelections
  };
};