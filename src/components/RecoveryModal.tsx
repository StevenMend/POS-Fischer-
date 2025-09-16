import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Edit3, CheckCircle, XCircle } from 'lucide-react';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectInconsistentStates: () => Array<{
    type: 'empty_order' | 'orphan_table' | 'missing_order';
    tableNumber: number;
    orderId?: string;
    table?: any;
    order?: any;
    message: string;
  }>;
  repairInconsistentStates: () => { fixed: number; actions: string[] };
  freeTable: (tableNumber: number) => void;
  cancelOrderAndFreeTable: (orderId: string) => boolean;
  resetOrder: (orderId: string) => any;
  onContinueOrder?: (tableNumber: number, orderId: string) => void;
}

const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  onClose,
  detectInconsistentStates,
  repairInconsistentStates,
  freeTable,
  cancelOrderAndFreeTable,
  resetOrder,
  onContinueOrder
}) => {
  const [issues, setIssues] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [repairResults, setRepairResults] = useState<{ fixed: number; actions: string[] } | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>('');

  // 🔍 DETECCIÓN INICIAL AL ABRIR MODAL
  useEffect(() => {
    if (isOpen) {
      console.log('🛡️ RecoveryModal: Iniciando escaneo de problemas...');
      scanForIssues();
    }
  }, [isOpen]);

  const scanForIssues = async () => {
    setIsScanning(true);
    setRepairResults(null);
    
    try {
      // Simular análisis (para UX)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const detectedIssues = detectInconsistentStates();
      setIssues(detectedIssues);
      
      console.log(`🔍 RecoveryModal: ${detectedIssues.length} problemas detectados:`, 
        detectedIssues.map(i => `${i.type} - Mesa ${i.tableNumber}`)
      );
      
    } catch (error) {
      console.error('❌ RecoveryModal: Error en detección:', error);
      setIssues([]);
    } finally {
      setIsScanning(false);
    }
  };

  // 🔧 REPARACIÓN AUTOMÁTICA
  const handleAutoRepair = async () => {
    console.log('🔧 RecoveryModal: Iniciando reparación automática...');
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const results = repairInconsistentStates();
      setRepairResults(results);
      
      console.log(`✅ RecoveryModal: Reparación completa - ${results.fixed} problemas corregidos:`, results.actions);
      
      // Re-escanear después de reparar
      if (results.fixed > 0) {
        await scanForIssues();
      }
      
    } catch (error) {
      console.error('❌ RecoveryModal: Error en reparación automática:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 🎯 ACCIONES MANUALES ESPECÍFICAS
  const handleManualAction = async (issue: any, action: string) => {
    console.log(`🎯 RecoveryModal: Acción manual [${action}] para Mesa ${issue.tableNumber}`);
    setIsProcessing(true);
    setSelectedAction(`${action}-${issue.tableNumber}`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      switch (action) {
        case 'continue':
          if (issue.orderId && onContinueOrder) {
            console.log(`▶️ RecoveryModal: Continuando orden ${issue.orderId} en Mesa ${issue.tableNumber}`);
            onContinueOrder(issue.tableNumber, issue.orderId);
            onClose();
            return;
          }
          break;
          
        case 'reset':
          if (issue.orderId) {
            const newOrder = resetOrder(issue.orderId);
            console.log(`🔄 RecoveryModal: Orden reseteada - Nueva: ${newOrder?.id}`);
          }
          break;
          
        case 'free':
          freeTable(issue.tableNumber);
          console.log(`🆓 RecoveryModal: Mesa ${issue.tableNumber} liberada`);
          break;
          
        case 'cancel':
          if (issue.orderId) {
            const success = cancelOrderAndFreeTable(issue.orderId);
            console.log(`🗑️ RecoveryModal: Orden cancelada - Success: ${success}`);
          }
          break;
      }
      
      // Re-escanear después de la acción
      await scanForIssues();
      
    } catch (error) {
      console.error(`❌ RecoveryModal: Error en acción ${action}:`, error);
    } finally {
      setIsProcessing(false);
      setSelectedAction('');
    }
  };

  // 📊 CLASIFICAR PROBLEMAS POR TIPO
  const emptyOrders = issues.filter(i => i.type === 'empty_order');
  const orphanTables = issues.filter(i => i.type === 'orphan_table');
  const missingOrders = issues.filter(i => i.type === 'missing_order');

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'empty_order': return <Edit3 className="w-5 h-5 text-yellow-600" />;
      case 'orphan_table': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'missing_order': return <XCircle className="w-5 h-5 text-orange-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'empty_order': return 'border-yellow-200 bg-yellow-50';
      case 'orphan_table': return 'border-red-200 bg-red-50';
      case 'missing_order': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Sistema de Recuperación</h2>
                <p className="text-blue-100">Detectar y corregir problemas del sistema</p>
              </div>
            </div>
            {!isScanning && !isProcessing && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Estado de Escaneo */}
          {isScanning && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Analizando Sistema...</h3>
                <p className="text-slate-500">Detectando problemas de consistencia</p>
              </div>
            </div>
          )}

          {/* Resultados de Reparación Automática */}
          {repairResults && repairResults.fixed > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="font-bold text-green-800">
                  Reparación Automática Completada
                </h3>
              </div>
              <p className="text-green-700 mb-2">
                {repairResults.fixed} problemas corregidos automáticamente:
              </p>
              <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
                {repairResults.actions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {/* No hay problemas */}
          {!isScanning && issues.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Sistema Limpio</h3>
              <p className="text-slate-500 mb-6">
                No se detectaron problemas de consistencia
              </p>
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3 rounded-xl font-medium hover:from-green-700 hover:to-emerald-800 transition-all"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Problemas Detectados */}
          {!isScanning && issues.length > 0 && (
            <div className="space-y-6">
              {/* Botón de Reparación Automática */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">
                  {issues.length} problema(s) detectado(s)
                </h3>
                <div className="flex space-x-3">
                  <button
                    onClick={scanForIssues}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Re-escanear</span>
                  </button>
                  <button
                    onClick={handleAutoRepair}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Reparar Auto</span>
                  </button>
                </div>
              </div>

              {/* Lista de Problemas */}
              <div className="space-y-4">
                {issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`border rounded-xl p-4 ${getIssueColor(issue.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getIssueIcon(issue.type)}
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 mb-1">
                            Mesa {issue.tableNumber}
                          </h4>
                          <p className="text-sm text-slate-600 mb-3">
                            {issue.message}
                          </p>
                          
                          {/* Acciones Específicas por Tipo */}
                          <div className="flex flex-wrap gap-2">
                            {issue.type === 'empty_order' && (
                              <>
                                <button
                                  onClick={() => handleManualAction(issue, 'continue')}
                                  disabled={isProcessing}
                                  className={`flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    selectedAction === `continue-${issue.tableNumber}` ? 'opacity-50' : ''
                                  }`}
                                >
                                  <Edit3 className="w-4 h-4" />
                                  <span>Continuar Orden</span>
                                </button>
                                <button
                                  onClick={() => handleManualAction(issue, 'reset')}
                                  disabled={isProcessing}
                                  className={`flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    selectedAction === `reset-${issue.tableNumber}` ? 'opacity-50' : ''
                                  }`}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  <span>Resetear Orden</span>
                                </button>
                                <button
                                  onClick={() => handleManualAction(issue, 'cancel')}
                                  disabled={isProcessing}
                                  className={`flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    selectedAction === `cancel-${issue.tableNumber}` ? 'opacity-50' : ''
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Cancelar y Liberar</span>
                                </button>
                              </>
                            )}
                            
                            {issue.type === 'orphan_table' && (
                              <button
                                onClick={() => handleManualAction(issue, 'free')}
                                disabled={isProcessing}
                                className={`flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  selectedAction === `free-${issue.tableNumber}` ? 'opacity-50' : ''
                                }`}
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Liberar Mesa</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="text-slate-600 hover:text-slate-800 font-medium transition-colors disabled:opacity-50"
                >
                  Cerrar sin cambios
                </button>
                <p className="text-sm text-slate-500">
                  Los cambios se guardan automáticamente
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecoveryModal;