// import React, { useState, useEffect } from 'react';
// import { 
//   Bluetooth, 
//   Printer, 
//   Wifi, 
//   WifiOff,
//   RefreshCw,
//   Settings as SettingsIcon,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Zap,
//   Battery,
//   Signal
// } from 'lucide-react';
// import { usePrinter } from '../contexts/PrinterContext';

// interface PrinterManagerProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const PrinterManager: React.FC<PrinterManagerProps> = ({ isOpen, onClose }) => {
//   const {
//     connectedPrinters,
//     isScanning,
//     isPrinting,
//     lastError,
//     checkBluetoothSupport,
//     scanForPrinters,
//     connectToPrinter,
//     disconnectPrinter,
//     printReceipt,
//     clearError
//   } = usePrinter();

//   const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
//   const [showAdvanced, setShowAdvanced] = useState(false);

//   // Log del estado inicial
//   useEffect(() => {
//     if (isOpen) {
//       console.log('🖨️ [PrinterManager] Abriendo gestor de impresoras');
//       console.log('📊 [PrinterManager] Estado inicial:', {
//         printersCount: connectedPrinters.length,
//         isScanning,
//         isPrinting,
//         hasError: !!lastError,
//         bluetoothSupported: checkBluetoothSupport()
//       });
//     }
//   }, [isOpen, connectedPrinters.length, isScanning, isPrinting, lastError, checkBluetoothSupport]);

//   // Función para manejar escaneo
//   const handleScan = async () => {
//     console.log('🔍 [PrinterManager] Usuario inició escaneo');
//     clearError();
    
//     try {
//       const foundPrinters = await scanForPrinters();
//       console.log(`✅ [PrinterManager] Escaneo completado. Encontradas: ${foundPrinters.length} impresoras`);
      
//       if (foundPrinters.length > 0 && !selectedPrinterId) {
//         setSelectedPrinterId(foundPrinters[0].id);
//         console.log(`🎯 [PrinterManager] Auto-seleccionada impresora: ${foundPrinters[0].name}`);
//       }
//     } catch (error: any) {
//       console.error('❌ [PrinterManager] Error en escaneo:', error);
//     }
//   };

//   // Función para conectar
//   const handleConnect = async (printerId: string) => {
//     console.log(`🔌 [PrinterManager] Usuario conectando a: ${printerId}`);
    
//     const printer = connectedPrinters.find(p => p.id === printerId);
//     if (printer) {
//       console.log(`🔌 [PrinterManager] Conectando a ${printer.name} (${printer.model || 'Modelo desconocido'})`);
      
//       const success = await connectToPrinter(printerId);
//       if (success) {
//         console.log('🎉 [PrinterManager] Conexión exitosa!');
//         setSelectedPrinterId(printerId);
//       } else {
//         console.error('❌ [PrinterManager] Fallo la conexión');
//       }
//     }
//   };

//   // Función para desconectar
//   const handleDisconnect = async (printerId: string) => {
//     console.log(`🔌 [PrinterManager] Usuario desconectando: ${printerId}`);
    
//     await disconnectPrinter(printerId);
//     if (selectedPrinterId === printerId) {
//       setSelectedPrinterId('');
//       console.log('🎯 [PrinterManager] Deseleccionada impresora actual');
//     }
//   };

//   // Función para probar impresión - AHORA IMPRIME REALMENTE
//   const handleTestPrint = async (printerId: string) => {
//     console.log(`🧪 [PrinterManager] Usuario solicitó prueba de impresión: ${printerId}`);
    
//     // Datos de prueba para recibo real
//     const testReceiptData = {
//       company: {
//         name: 'Soda Fischer',
//         phone: '+506 8787 6138',
//         address: '27 de Abril Santa Cruz Guanacaste',
//         taxId: '',
//         email: '',
//         website: ''
//       },
//       order: {
//         tableNumber: 99,
//         items: [
//           {
//             id: 'test-1',
//             menuItem: { name: 'Café con Leche - PRUEBA', price: 1000 },
//             quantity: 1,
//             subtotal: 1000,
//             notes: 'Recibo de prueba del sistema'
//           }
//         ],
//         subtotal: 1000,
//         serviceCharge: 100,
//         total: 1100,
//         createdAt: new Date()
//       },
//       payment: {
//         method: 'cash' as const,
//         currency: 'CRC' as const,
//         amount: 1100,
//         received: 2000,
//         change: 900
//       },
//       receiptNumber: `TEST-${Date.now().toString().slice(-4)}`,
//       timestamp: new Date(),
//       settings: {
//         paperWidth: 72,
//         fontSize: 'normal' as const,
//         density: 3,
//         cutPaper: true,
//         cashDrawer: false,
//         encoding: 'utf8' as const
//       }
//     };

//     console.log('🧪 [PrinterManager] Datos de prueba creados:', {
//       receiptNumber: testReceiptData.receiptNumber,
//       total: testReceiptData.order.total,
//       items: testReceiptData.order.items.length
//     });

//     try {
//       console.log('🖨️ [PrinterManager] Ejecutando impresión REAL...');
//       const success = await printReceipt(printerId, testReceiptData);
      
//       if (success) {
//         console.log('🎉 [PrinterManager] ¡Prueba de impresión EXITOSA!');
//         alert('✅ Recibo de prueba enviado a la impresora!');
//       } else {
//         console.error('❌ [PrinterManager] Prueba de impresión FALLÓ');
//         alert('❌ Error en la prueba de impresión. Revisa la consola.');
//       }
//     } catch (error: any) {
//       console.error('💥 [PrinterManager] Error ejecutando prueba:', error);
//       alert(`💥 Error: ${error.message}`);
//     }
//   };

//   if (!isOpen) return null;

//   const connectedCount = connectedPrinters.filter(p => p.connected).length;
//   const bluetoothSupported = checkBluetoothSupport();

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white/90 backdrop-blur-xl rounded-2xl w-full max-w-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
        
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-white/20">
//           <div className="flex items-center space-x-3">
//             <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
//               <Printer className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <h3 className="text-xl font-bold text-slate-800">Gestión de Impresoras</h3>
//               <p className="text-sm text-slate-500">
//                 {connectedCount > 0 ? `${connectedCount} conectada(s)` : 'Sin impresoras conectadas'}
//               </p>
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
//           >
//             <XCircle className="w-6 h-6 text-slate-500" />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
//           {/* Bluetooth Status & Scan */}
//           <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
//             <div className="flex items-center justify-between mb-4">
//               <div className="flex items-center space-x-3">
//                 <div className={`p-2 rounded-lg ${bluetoothSupported ? 'bg-green-100' : 'bg-red-100'}`}>
//                   <Bluetooth className={`w-5 h-5 ${bluetoothSupported ? 'text-green-600' : 'text-red-600'}`} />
//                 </div>
//                 <div>
//                   <h4 className="font-bold text-slate-800">Estado Bluetooth</h4>
//                   <p className={`text-sm ${bluetoothSupported ? 'text-green-600' : 'text-red-600'}`}>
//                     {bluetoothSupported ? 'Disponible' : 'No soportado'}
//                   </p>
//                 </div>
//               </div>
              
//               {bluetoothSupported && (
//                 <button
//                   onClick={handleScan}
//                   disabled={isScanning}
//                   className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
//                 >
//                   <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
//                   <span>{isScanning ? 'Escaneando...' : 'Escanear Dispositivos'}</span>
//                 </button>
//               )}
//             </div>

//             {!bluetoothSupported && (
//               <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//                 <div className="flex items-start space-x-2">
//                   <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
//                   <div>
//                     <p className="text-sm text-red-700 font-medium">Bluetooth no disponible</p>
//                     <p className="text-xs text-red-600 mt-1">
//                       Tu navegador no soporta Web Bluetooth API. Prueba en Chrome/Edge en Windows/macOS.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Error Display */}
//           {lastError && (
//             <div className="bg-red-50 border border-red-200 rounded-xl p-4">
//               <div className="flex items-start space-x-3">
//                 <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
//                 <div className="flex-1">
//                   <h5 className="font-bold text-red-800">Error de Impresora</h5>
//                   <p className="text-sm text-red-700 mt-1">{lastError}</p>
//                   <button
//                     onClick={clearError}
//                     className="text-xs text-red-600 hover:text-red-800 mt-2 underline"
//                   >
//                     Limpiar error
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Printers List */}
//           <div>
//             <div className="flex items-center justify-between mb-4">
//               <h4 className="text-lg font-bold text-slate-800">Impresoras Detectadas</h4>
//               <button
//                 onClick={() => setShowAdvanced(!showAdvanced)}
//                 className="text-sm text-slate-500 hover:text-slate-700 flex items-center space-x-1"
//               >
//                 <SettingsIcon className="w-4 h-4" />
//                 <span>Avanzado</span>
//               </button>
//             </div>

//             {connectedPrinters.length === 0 ? (
//               <div className="text-center py-8">
//                 <Printer className="w-16 h-16 text-slate-300 mx-auto mb-4" />
//                 <p className="text-slate-500 font-medium">No hay impresoras detectadas</p>
//                 <p className="text-sm text-slate-400 mt-2">
//                   Presiona "Escanear Dispositivos" para buscar impresoras cercanas
//                 </p>
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {connectedPrinters.map((printer) => (
//                   <div
//                     key={printer.id}
//                     className="bg-white/80 rounded-xl p-4 border border-slate-200 hover:shadow-lg transition-all"
//                   >
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center space-x-3">
//                         <div className={`p-2 rounded-lg ${printer.connected ? 'bg-green-100' : 'bg-slate-100'}`}>
//                           {printer.connected ? (
//                             <Wifi className="w-5 h-5 text-green-600" />
//                           ) : (
//                             <WifiOff className="w-5 h-5 text-slate-400" />
//                           )}
//                         </div>
                        
//                         <div>
//                           <h5 className="font-bold text-slate-800">{printer.name}</h5>
//                           <div className="flex items-center space-x-4 text-sm text-slate-500">
//                             <span>ID: {printer.id.slice(-8)}</span>
//                             {printer.model && (
//                               <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
//                                 {printer.model}
//                               </span>
//                             )}
//                             {printer.lastSeen && (
//                               <span>Visto: {printer.lastSeen.toLocaleTimeString()}</span>
//                             )}
//                           </div>
                          
//                           {showAdvanced && (
//                             <div className="mt-2 text-xs text-slate-400 space-y-1">
//                               <div>Estado: {printer.connected ? 'Conectada' : 'Desconectada'}</div>
//                               {printer.characteristic && (
//                                 <div>Característica: Disponible</div>
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       <div className="flex items-center space-x-2">
//                         {printer.connected ? (
//                           <>
//                             <button
//                               onClick={() => handleTestPrint(printer.id)}
//                               disabled={isPrinting}
//                               className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
//                             >
//                               <Zap className="w-4 h-4" />
//                               <span>Prueba</span>
//                             </button>
//                             <button
//                               onClick={() => handleDisconnect(printer.id)}
//                               className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
//                             >
//                               <WifiOff className="w-4 h-4" />
//                               <span>Desconectar</span>
//                             </button>
//                           </>
//                         ) : (
//                           <button
//                             onClick={() => handleConnect(printer.id)}
//                             className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
//                           >
//                             <Wifi className="w-4 h-4" />
//                             <span>Conectar</span>
//                           </button>
//                         )}
//                       </div>
//                     </div>

//                     {printer.connected && selectedPrinterId === printer.id && (
//                       <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2">
//                         <div className="flex items-center space-x-2">
//                           <CheckCircle className="w-4 h-4 text-green-600" />
//                           <span className="text-sm text-green-700 font-medium">
//                             Impresora principal configurada
//                           </span>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Status Footer */}
//           {isPrinting && (
//             <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
//               <div className="flex items-center space-x-3">
//                 <div className="animate-spin">
//                   <RefreshCw className="w-5 h-5 text-blue-600" />
//                 </div>
//                 <div>
//                   <p className="text-blue-800 font-medium">Imprimiendo...</p>
//                   <p className="text-sm text-blue-600">Enviando datos a la impresora</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Help Section */}
//           <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
//             <h5 className="font-bold text-slate-800 mb-2">Ayuda</h5>
//             <div className="text-sm text-slate-600 space-y-2">
//               <div className="flex items-start space-x-2">
//                 <Battery className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
//                 <span>Asegúrate de que la impresora esté encendida y con batería</span>
//               </div>
//               <div className="flex items-start space-x-2">
//                 <Signal className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
//                 <span>Mantén la impresora cerca del dispositivo durante el emparejamiento</span>
//               </div>
//               <div className="flex items-start space-x-2">
//                 <Printer className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
//                 <span>Compatible con impresoras térmicas MPR-300 y similares</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PrinterManager;
import React, { useState, useEffect } from 'react';
import { 
  Bluetooth, 
  Printer, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Settings as SettingsIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Battery,
  Signal
} from 'lucide-react';
import { usePrinter } from '../contexts/PrinterContext';

interface PrinterManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrinterManager: React.FC<PrinterManagerProps> = ({ isOpen, onClose }) => {
  const {
    connectedPrinters,
    isScanning,
    isPrinting,
    lastError,
    checkBluetoothSupport,
    scanForPrinters,
    connectToPrinter,
    disconnectPrinter,
    printReceipt,
    clearError
  } = usePrinter();

  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Log del estado inicial
  useEffect(() => {
    if (isOpen) {
      console.log('🖨️ [PrinterManager] Abriendo gestor de impresoras');
      console.log('📊 [PrinterManager] Estado inicial:', {
        printersCount: connectedPrinters.length,
        isScanning,
        isPrinting,
        hasError: !!lastError,
        bluetoothSupported: checkBluetoothSupport()
      });
    }
  }, [isOpen, connectedPrinters.length, isScanning, isPrinting, lastError, checkBluetoothSupport]);

  // Función helper para formatear fecha segura
  const formatLastSeen = (lastSeen: Date | string | undefined): string => {
    if (!lastSeen) return 'Nunca';
    
    try {
      // Si ya es un Date object, usarlo directamente
      const dateObj = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
      
      // Verificar que la fecha sea válida
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      
      return dateObj.toLocaleTimeString('es-CR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.warn('⚠️ [PrinterManager] Error formateando fecha:', error);
      return 'Error fecha';
    }
  };

  // Función para manejar escaneo
  const handleScan = async () => {
    console.log('🔍 [PrinterManager] Usuario inició escaneo');
    clearError();
    
    try {
      const foundPrinters = await scanForPrinters();
      console.log(`✅ [PrinterManager] Escaneo completado. Encontradas: ${foundPrinters.length} impresoras`);
      
      if (foundPrinters.length > 0 && !selectedPrinterId) {
        setSelectedPrinterId(foundPrinters[0].id);
        console.log(`🎯 [PrinterManager] Auto-seleccionada impresora: ${foundPrinters[0].name}`);
      }
    } catch (error: any) {
      console.error('❌ [PrinterManager] Error en escaneo:', error);
    }
  };

  // Función para conectar
  const handleConnect = async (printerId: string) => {
    console.log(`🔌 [PrinterManager] Usuario conectando a: ${printerId}`);
    
    const printer = connectedPrinters.find(p => p.id === printerId);
    if (printer) {
      console.log(`🔌 [PrinterManager] Conectando a ${printer.name} (${printer.model || 'Modelo desconocido'})`);
      
      const success = await connectToPrinter(printerId);
      if (success) {
        console.log('🎉 [PrinterManager] Conexión exitosa!');
        setSelectedPrinterId(printerId);
      } else {
        console.error('❌ [PrinterManager] Fallo la conexión');
      }
    }
  };

  // Función para desconectar
  const handleDisconnect = async (printerId: string) => {
    console.log(`🔌 [PrinterManager] Usuario desconectando: ${printerId}`);
    
    await disconnectPrinter(printerId);
    if (selectedPrinterId === printerId) {
      setSelectedPrinterId('');
      console.log('🎯 [PrinterManager] Deseleccionada impresora actual');
    }
  };

  // Función para probar impresión - DATOS DE PRUEBA REALES
  const handleTestPrint = async (printerId: string) => {
    console.log(`🧪 [PrinterManager] Usuario solicitó prueba de impresión: ${printerId}`);
    
    // Datos de prueba para recibo real
    const testReceiptData = {
      company: {
        name: 'Soda Fischer',
        phone: '+506 8787 6138',
        address: '27 de Abril Santa Cruz Guanacaste',
        taxId: '',
        email: '',
        website: ''
      },
      order: {
        tableNumber: 99,
        items: [
          {
            id: 'test-1',
            menuItem: { name: 'Café con Leche - PRUEBA', price: 1000 },
            quantity: 1,
            subtotal: 1000,
            notes: 'Recibo de prueba del sistema'
          }
        ],
        subtotal: 1000,
        serviceCharge: 100,
        total: 1100,
        createdAt: new Date()
      },
      payment: {
        method: 'cash' as const,
        currency: 'CRC' as const,
        amount: 1100,
        received: 2000,
        change: 900
      },
      receiptNumber: `TEST-${Date.now().toString().slice(-4)}`,
      timestamp: new Date(),
      settings: {
        paperWidth: 72,
        fontSize: 'normal' as const,
        density: 3,
        cutPaper: true,
        cashDrawer: false,
        encoding: 'utf8' as const
      }
    };

    console.log('🧪 [PrinterManager] Datos de prueba creados:', {
      receiptNumber: testReceiptData.receiptNumber,
      total: testReceiptData.order.total,
      items: testReceiptData.order.items.length
    });

    try {
      console.log('🖨️ [PrinterManager] Ejecutando impresión REAL...');
      const success = await printReceipt(printerId, testReceiptData);
      
      if (success) {
        console.log('🎉 [PrinterManager] ¡Prueba de impresión EXITOSA!');
        alert('✅ Recibo de prueba enviado a la impresora!');
      } else {
        console.error('❌ [PrinterManager] Prueba de impresión FALLÓ');
        alert('❌ Error en la prueba de impresión. Revisa la consola.');
      }
    } catch (error: any) {
      console.error('💥 [PrinterManager] Error ejecutando prueba:', error);
      alert(`💥 Error: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  const connectedCount = connectedPrinters.filter(p => p.connected).length;
  const bluetoothSupported = checkBluetoothSupport();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl w-full max-w-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Gestión de Impresoras</h3>
              <p className="text-sm text-slate-500">
                {connectedCount > 0 ? `${connectedCount} conectada(s)` : 'Sin impresoras conectadas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XCircle className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Bluetooth Status & Scan */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${bluetoothSupported ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Bluetooth className={`w-5 h-5 ${bluetoothSupported ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Estado Bluetooth</h4>
                  <p className={`text-sm ${bluetoothSupported ? 'text-green-600' : 'text-red-600'}`}>
                    {bluetoothSupported ? 'Disponible' : 'No soportado'}
                  </p>
                </div>
              </div>
              
              {bluetoothSupported && (
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Escaneando...' : 'Escanear Dispositivos'}</span>
                </button>
              )}
            </div>

            {!bluetoothSupported && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-700 font-medium">Bluetooth no disponible</p>
                    <p className="text-xs text-red-600 mt-1">
                      Tu navegador no soporta Web Bluetooth API. Prueba en Chrome/Edge en Windows/macOS.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {lastError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-bold text-red-800">Error de Impresora</h5>
                  <p className="text-sm text-red-700 mt-1">{lastError}</p>
                  <button
                    onClick={clearError}
                    className="text-xs text-red-600 hover:text-red-800 mt-2 underline"
                  >
                    Limpiar error
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Printers List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-slate-800">Impresoras Detectadas</h4>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center space-x-1"
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Avanzado</span>
              </button>
            </div>

            {connectedPrinters.length === 0 ? (
              <div className="text-center py-8">
                <Printer className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No hay impresoras detectadas</p>
                <p className="text-sm text-slate-400 mt-2">
                  Presiona "Escanear Dispositivos" para buscar impresoras cercanas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connectedPrinters.map((printer) => (
                  <div
                    key={printer.id}
                    className="bg-white/80 rounded-xl p-4 border border-slate-200 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${printer.connected ? 'bg-green-100' : 'bg-slate-100'}`}>
                          {printer.connected ? (
                            <Wifi className="w-5 h-5 text-green-600" />
                          ) : (
                            <WifiOff className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        
                        <div>
                          <h5 className="font-bold text-slate-800">{printer.name}</h5>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span>ID: {printer.id.slice(-8)}</span>
                            {printer.model && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {printer.model}
                              </span>
                            )}
                            {/* FIX PRINCIPAL: Usar helper function segura para formatear fecha */}
                            <span>Visto: {formatLastSeen(printer.lastSeen)}</span>
                          </div>
                          
                          {showAdvanced && (
                            <div className="mt-2 text-xs text-slate-400 space-y-1">
                              <div>Estado: {printer.connected ? 'Conectada' : 'Desconectada'}</div>
                              {printer.characteristic && (
                                <div>Característica: Disponible</div>
                              )}
                              <div>Raw lastSeen: {JSON.stringify(printer.lastSeen)}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {printer.connected ? (
                          <>
                            <button
                              onClick={() => handleTestPrint(printer.id)}
                              disabled={isPrinting}
                              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                              <Zap className="w-4 h-4" />
                              <span>Prueba</span>
                            </button>
                            <button
                              onClick={() => handleDisconnect(printer.id)}
                              className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                              <WifiOff className="w-4 h-4" />
                              <span>Desconectar</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleConnect(printer.id)}
                            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Wifi className="w-4 h-4" />
                            <span>Conectar</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {printer.connected && selectedPrinterId === printer.id && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">
                            Impresora principal configurada
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Footer */}
          {isPrinting && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-blue-800 font-medium">Imprimiendo...</p>
                  <p className="text-sm text-blue-600">Enviando datos a la impresora</p>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h5 className="font-bold text-slate-800 mb-2">Ayuda</h5>
            <div className="text-sm text-slate-600 space-y-2">
              <div className="flex items-start space-x-2">
                <Battery className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>Asegúrate de que la impresora esté encendida y con batería</span>
              </div>
              <div className="flex items-start space-x-2">
                <Signal className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>Mantén la impresora cerca del dispositivo durante el emparejamiento</span>
              </div>
              <div className="flex items-start space-x-2">
                <Printer className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>Compatible con impresoras térmicas MPR-300 y similares</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrinterManager;