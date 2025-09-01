// contexts/PrinterContext.tsx - VERSIÓN CORREGIDA PROFESIONAL
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { BluetoothPrinter, CompanyInfo, ReceiptData, PrinterSettings } from '../types';

// COMANDOS ESC/POS OPTIMIZADOS PARA MPR-300
const ESC_POS_COMMANDS = {
  INIT: '\x1B\x40',
  LF: '\x0A',
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_CENTER: '\x1B\x61\x01',
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  CUT: '\x1D\x56\x00',
  DENSITY: (level: number) => `\x1D\x7C${String.fromCharCode(Math.max(1, Math.min(5, level)))}`,
} as const;

// CONFIGURACIÓN BLUETOOTH
const BLUETOOTH_CONFIG = {
  SCAN_TIMEOUT: 30000,
  CONNECTION_TIMEOUT: 15000,
  CHUNK_SIZE: 20,
  CHUNK_DELAY: 10,
  MAX_RETRIES: 3,
  SERVICES: [
    '000018f0-0000-1000-8000-00805f9b34fb', // Serial port service
    '00001101-0000-1000-8000-00805f9b34fb', // SPP
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Custom service
  ]
} as const;

// STORAGE KEYS
const STORAGE_KEYS = {
  PRINTERS: 'fischer_bluetooth_printers',
  RECEIPT_COUNTER: 'fischer_receipt_counter',
} as const;

// INTERFACES
interface PrinterContextType {
  connectedPrinters: BluetoothPrinter[];
  isScanning: boolean;
  isPrinting: boolean;
  lastError: string | null;
  checkBluetoothSupport: () => boolean;
  scanForPrinters: () => Promise<BluetoothPrinter[]>;
  connectToPrinter: (printerId: string) => Promise<boolean>;
  disconnectPrinter: (printerId: string) => Promise<void>;
  printReceipt: (printerId: string, receiptData: ReceiptData) => Promise<boolean>;
  createReceiptData: (order: any, payment: any, table: any, companyInfo?: CompanyInfo) => ReceiptData;
  clearError: () => void;
  getDefaultPrinter: () => BluetoothPrinter | null;
  printWithDefaultPrinter: (receiptData: ReceiptData) => Promise<boolean>;
  resetAllPrinters: () => void;
}

// CONTEXTO
const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

// CONFIGURACIÓN POR DEFECTO
const defaultSettings: PrinterSettings = {
  paperWidth: 72,
  fontSize: 'normal',
  density: 3,
  cutPaper: true,
  cashDrawer: false,
  encoding: 'utf8'
};

// PROVIDER COMPONENT
export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ESTADO PRINCIPAL
  const [connectedPrinters, setConnectedPrinters] = useState<BluetoothPrinter[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // REFERENCIAS PARA LIMPIEZA
  const activeConnections = useRef<Map<string, BluetoothDevice>>(new Map());
  const disconnectListeners = useRef<Map<string, () => void>>(new Map());
  const abortController = useRef<AbortController | null>(null);

  // ===== UTILIDADES DE PERSISTENCIA =====
  
  const savePrintersToStorage = useCallback((printers: BluetoothPrinter[]) => {
    try {
      // SOLO SERIALIZAR DATOS SEGUROS - SIN DEVICE/CHARACTERISTIC
      const serializablePrinters = printers.map(printer => ({
        id: printer.id,
        name: printer.name,
        model: printer.model,
        rssi: printer.rssi,
        lastSeen: printer.lastSeen ? printer.lastSeen.toISOString() : null,
        connected: false // SIEMPRE FALSE EN STORAGE
      }));
      
      localStorage.setItem(STORAGE_KEYS.PRINTERS, JSON.stringify(serializablePrinters));
      console.log('💾 [PRINTER] Impresoras guardadas:', serializablePrinters.length);
    } catch (error) {
      console.error('❌ [PRINTER] Error guardando impresoras:', error);
    }
  }, []);

  const loadPrintersFromStorage = useCallback((): BluetoothPrinter[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRINTERS);
      if (!stored) return [];

      const printers = JSON.parse(stored);
      return printers.map((printer: any) => ({
        ...printer,
        lastSeen: printer.lastSeen ? new Date(printer.lastSeen) : new Date(),
        connected: false, // NUNCA CONECTADAS AL CARGAR
        device: undefined,
        characteristic: undefined
      }));
    } catch (error) {
      console.error('❌ [PRINTER] Error cargando impresoras:', error);
      return [];
    }
  }, []);

  // ===== LIMPIEZA Y MANTENIMIENTO =====

  const cleanupPrinter = useCallback((printerId: string) => {
    console.log(`🧹 [PRINTER] Limpiando impresora: ${printerId}`);
    
    // Remover device activo
    const device = activeConnections.current.get(printerId);
    if (device?.gatt?.connected) {
      try {
        device.gatt.disconnect();
      } catch (error) {
        console.warn('⚠️ [PRINTER] Error desconectando device:', error);
      }
    }
    activeConnections.current.delete(printerId);

    // Remover listener de desconexión
    const listener = disconnectListeners.current.get(printerId);
    if (listener) {
      listener(); // Ejecutar cleanup del listener
      disconnectListeners.current.delete(printerId);
    }

    // Actualizar estado
    setConnectedPrinters(prev => 
      prev.map(p => p.id === printerId ? {
        ...p,
        connected: false,
        device: undefined,
        characteristic: undefined
      } : p)
    );
  }, []);

  const cleanupAllPrinters = useCallback(() => {
    console.log('🧹 [PRINTER] Limpieza completa de impresoras');
    
    // Limpiar todas las conexiones activas
    activeConnections.current.forEach((device, printerId) => {
      cleanupPrinter(printerId);
    });

    // Cancelar escaneo si está activo
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }

    setIsScanning(false);
    setIsPrinting(false);
  }, [cleanupPrinter]);

  // ===== GESTIÓN DE DISPOSITIVOS DUPLICADOS =====

  const mergePrinter = useCallback((existingPrinters: BluetoothPrinter[], newPrinter: BluetoothPrinter): BluetoothPrinter[] => {
    const existingIndex = existingPrinters.findIndex(p => 
      p.id === newPrinter.id || 
      (p.name === newPrinter.name && p.name !== 'Dispositivo Desconocido')
    );

    if (existingIndex >= 0) {
      // ACTUALIZAR EXISTENTE
      return existingPrinters.map((p, index) => 
        index === existingIndex ? {
          ...p,
          ...newPrinter,
          lastSeen: new Date(),
          // MANTENER ESTADO DE CONEXIÓN EXISTENTE SI YA ESTÁ CONECTADO
          connected: p.connected || newPrinter.connected,
          device: newPrinter.device || p.device,
          characteristic: newPrinter.characteristic || p.characteristic
        } : p
      );
    } else {
      // AGREGAR NUEVO
      return [...existingPrinters, { ...newPrinter, lastSeen: new Date() }];
    }
  }, []);

  // ===== CORE FUNCTIONS =====

  const checkBluetoothSupport = useCallback((): boolean => {
    if (!navigator.bluetooth) {
      setLastError('Web Bluetooth API no está disponible en este navegador');
      return false;
    }
    return true;
  }, []);

  const scanForPrinters = useCallback(async (): Promise<BluetoothPrinter[]> => {
    console.log('🔍 [PRINTER] Iniciando escaneo profesional...');
    
    if (!checkBluetoothSupport()) return [];
    
    // Cancelar escaneo previo
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    setIsScanning(true);
    setLastError(null);

    try {
      const device = await Promise.race([
        navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: BLUETOOTH_CONFIG.SERVICES
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout de escaneo')), BLUETOOTH_CONFIG.SCAN_TIMEOUT)
        )
      ]);

      if (device && !abortController.current.signal.aborted) {
        console.log('📱 [PRINTER] Dispositivo encontrado:', device.name, device.id);
        
        const newPrinter: BluetoothPrinter = {
          id: device.id,
          name: device.name || 'Dispositivo Desconocido',
          connected: false,
          device: device,
          lastSeen: new Date(),
          model: device.name?.includes('MPR') ? 'MPR-300' : undefined
        };

        // FUSIONAR CON IMPRESORAS EXISTENTES
        setConnectedPrinters(prev => {
          const updated = mergePrinter(prev, newPrinter);
          savePrintersToStorage(updated);
          return updated;
        });

        return [newPrinter];
      }

      return [];

    } catch (error: any) {
      if (abortController.current?.signal.aborted) {
        console.log('🛑 [PRINTER] Escaneo cancelado');
        return [];
      }

      console.error('❌ [PRINTER] Error en escaneo:', error);
      
      if (error.name === 'NotFoundError') {
        setLastError('No se seleccionó ningún dispositivo');
      } else if (error.name === 'SecurityError') {
        setLastError('Permisos Bluetooth denegados');
      } else {
        setLastError(`Error de escaneo: ${error.message}`);
      }
      
      return [];
    } finally {
      setIsScanning(false);
      abortController.current = null;
    }
  }, [checkBluetoothSupport, mergePrinter, savePrintersToStorage]);

  const connectToPrinter = useCallback(async (printerId: string): Promise<boolean> => {
    console.log(`🔌 [PRINTER] Conectando profesionalmente: ${printerId}`);
    
    const printer = connectedPrinters.find(p => p.id === printerId);
    if (!printer?.device) {
      setLastError('Dispositivo no válido para conexión');
      return false;
    }

    // Limpiar conexión previa si existe
    cleanupPrinter(printerId);
    setLastError(null);

    try {
      // TIMEOUT DE CONEXIÓN
      const connectWithTimeout = async () => {
        const server = await printer.device!.gatt!.connect();
        
        // CONFIGURAR LISTENER DE DESCONEXIÓN
        const handleDisconnect = () => {
          console.log(`📡 [PRINTER] Desconectado automáticamente: ${printerId}`);
          cleanupPrinter(printerId);
        };
        
        printer.device!.addEventListener('gattserverdisconnected', handleDisconnect);
        disconnectListeners.current.set(printerId, () => {
          printer.device!.removeEventListener('gattserverdisconnected', handleDisconnect);
        });

        // BUSCAR CARACTERÍSTICAS
        const services = await server.getPrimaryServices();
        let writeCharacteristic: BluetoothRemoteGATTCharacteristic | undefined;

        for (const service of services) {
          try {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                writeCharacteristic = char;
                break;
              }
            }
            if (writeCharacteristic) break;
          } catch (charError) {
            console.warn('⚠️ [PRINTER] Error accediendo características:', charError);
          }
        }

        if (!writeCharacteristic) {
          throw new Error('No se encontraron características de escritura');
        }

        return writeCharacteristic;
      };

      // EJECUTAR CONEXIÓN CON TIMEOUT
      const characteristic = await Promise.race([
        connectWithTimeout(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout de conexión')), BLUETOOTH_CONFIG.CONNECTION_TIMEOUT)
        )
      ]);

      // ÉXITO - ACTUALIZAR ESTADO
      activeConnections.current.set(printerId, printer.device);
      
      setConnectedPrinters(prev => 
        prev.map(p => p.id === printerId ? {
          ...p,
          connected: true,
          characteristic: characteristic,
          lastSeen: new Date()
        } : p)
      );

      console.log('✅ [PRINTER] Conexión exitosa y profesional');
      return true;

    } catch (error: any) {
      console.error('❌ [PRINTER] Error de conexión:', error);
      setLastError(`Conexión fallida: ${error.message}`);
      cleanupPrinter(printerId);
      return false;
    }
  }, [connectedPrinters, cleanupPrinter]);

  const disconnectPrinter = useCallback(async (printerId: string): Promise<void> => {
    console.log(`🔌 [PRINTER] Desconectando profesionalmente: ${printerId}`);
    cleanupPrinter(printerId);
    
    // Actualizar storage
    setConnectedPrinters(prev => {
      const updated = prev.map(p => p.id === printerId ? {
        ...p,
        connected: false,
        device: undefined,
        characteristic: undefined
      } : p);
      savePrintersToStorage(updated);
      return updated;
    });
  }, [cleanupPrinter, savePrintersToStorage]);

  // ===== GENERACIÓN Y IMPRESIÓN DE RECIBOS =====

  const cleanTextForPrinter = useCallback((text: string): string => {
    return text
      .replace(/₡/g, 'C')
      .replace(/[áàâãäå]/gi, 'a')
      .replace(/[éèêë]/gi, 'e')
      .replace(/[íìîï]/gi, 'i')
      .replace(/[óòôõö]/gi, 'o')
      .replace(/[úùûü]/gi, 'u')
      .replace(/[ñ]/gi, 'n')
      .replace(/[^\x20-\x7E]/g, '') // Solo ASCII
      .trim();
  }, []);

  const generateReceiptCommands = useCallback((receiptData: ReceiptData): Uint8Array => {
    console.log('📝 [PRINTER] Generando recibo profesional...');
    
    const { company, order, payment, receiptNumber, timestamp, settings } = receiptData;
    let commands = '';

    // Inicializar impresora
    commands += ESC_POS_COMMANDS.INIT;
    commands += ESC_POS_COMMANDS.DENSITY(settings.density);

    // Header centrado
    commands += ESC_POS_COMMANDS.ALIGN_CENTER;
    commands += ESC_POS_COMMANDS.BOLD_ON;
    commands += cleanTextForPrinter(company.name) + ESC_POS_COMMANDS.LF;
    commands += ESC_POS_COMMANDS.BOLD_OFF;
    commands += cleanTextForPrinter(company.address) + ESC_POS_COMMANDS.LF;
    if (company.phone) commands += 'Tel: ' + cleanTextForPrinter(company.phone) + ESC_POS_COMMANDS.LF;
    commands += ESC_POS_COMMANDS.LF;

    // Info del recibo
    commands += ESC_POS_COMMANDS.ALIGN_LEFT;
    commands += 'Recibo #: ' + receiptNumber + ESC_POS_COMMANDS.LF;
    commands += 'Mesa: ' + order.tableNumber + ESC_POS_COMMANDS.LF;
    commands += 'Fecha: ' + timestamp.toLocaleDateString('es-CR') + ESC_POS_COMMANDS.LF;
    commands += 'Hora: ' + timestamp.toLocaleTimeString('es-CR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) + ESC_POS_COMMANDS.LF;
    commands += ESC_POS_COMMANDS.LF;

    // Productos
    commands += ESC_POS_COMMANDS.BOLD_ON;
    commands += 'PRODUCTOS' + ESC_POS_COMMANDS.LF;
    commands += ESC_POS_COMMANDS.BOLD_OFF;
    commands += '-'.repeat(32) + ESC_POS_COMMANDS.LF;

    order.items?.forEach((item: any) => {
      const name = item.product?.name || item.menuItem?.name || 'Producto';
      const qty = item.quantity;
      const subtotal = item.subtotal;

      commands += cleanTextForPrinter(name).substring(0, 32) + ESC_POS_COMMANDS.LF;
      commands += `  ${qty} x C${Math.round(subtotal)}` + ESC_POS_COMMANDS.LF;
      
      if (item.notes) {
        commands += '  ' + cleanTextForPrinter(item.notes).substring(0, 30) + ESC_POS_COMMANDS.LF;
      }
    });

    // Totales
    commands += '-'.repeat(32) + ESC_POS_COMMANDS.LF;
    commands += `Subtotal: C${Math.round(order.subtotal)}` + ESC_POS_COMMANDS.LF;
    commands += `Servicio (10%): C${Math.round(order.serviceCharge)}` + ESC_POS_COMMANDS.LF;
    commands += ESC_POS_COMMANDS.BOLD_ON;
    commands += `TOTAL: C${Math.round(order.total)}` + ESC_POS_COMMANDS.LF;
    commands += ESC_POS_COMMANDS.BOLD_OFF;
    commands += ESC_POS_COMMANDS.LF;

    // Pago
    if (payment) {
      commands += 'PAGO' + ESC_POS_COMMANDS.LF;
      const methodText = payment.method === 'cash' ? 'Efectivo' : 'Tarjeta';
      const currencySymbol = payment.currency === 'USD' ? '$' : 'C';
      
      commands += `Metodo: ${methodText} (${payment.currency})` + ESC_POS_COMMANDS.LF;
      commands += `Monto: ${currencySymbol}${Math.round(payment.amount)}` + ESC_POS_COMMANDS.LF;
      
      if (payment.method === 'cash' && payment.received && payment.change !== undefined) {
        commands += `Recibido: ${currencySymbol}${Math.round(payment.received)}` + ESC_POS_COMMANDS.LF;
        if (payment.change > 0) {
          commands += `Cambio: ${currencySymbol}${Math.round(payment.change)}` + ESC_POS_COMMANDS.LF;
        }
      }
      commands += ESC_POS_COMMANDS.LF;
    }

    // Footer
    commands += ESC_POS_COMMANDS.ALIGN_CENTER;
    commands += 'Gracias por su visita!' + ESC_POS_COMMANDS.LF;
    commands += 'Vuelva pronto' + ESC_POS_COMMANDS.LF;
    commands += ESC_POS_COMMANDS.LF + ESC_POS_COMMANDS.LF;

    // Cortar papel
    if (settings.cutPaper) {
      commands += ESC_POS_COMMANDS.CUT;
    }

    // Convertir a bytes
    const encoder = new TextEncoder();
    return encoder.encode(commands);
  }, [cleanTextForPrinter]);

  const printReceipt = useCallback(async (
    printerId: string, 
    receiptData: ReceiptData
  ): Promise<boolean> => {
    console.log(`🖨️ [PRINTER] Imprimiendo profesionalmente: ${printerId}`);
    
    const printer = connectedPrinters.find(p => p.id === printerId && p.connected);
    if (!printer?.characteristic) {
      setLastError('Impresora no conectada');
      return false;
    }

    setIsPrinting(true);
    setLastError(null);

    try {
      const commands = generateReceiptCommands(receiptData);
      console.log(`📤 [PRINTER] Enviando ${commands.length} bytes...`);

      // Envío por chunks con retry
      for (let attempt = 0; attempt < BLUETOOTH_CONFIG.MAX_RETRIES; attempt++) {
        try {
          for (let i = 0; i < commands.length; i += BLUETOOTH_CONFIG.CHUNK_SIZE) {
            const chunk = commands.slice(i, i + BLUETOOTH_CONFIG.CHUNK_SIZE);
            await printer.characteristic.writeValue(chunk);
            
            if (i + BLUETOOTH_CONFIG.CHUNK_SIZE < commands.length) {
              await new Promise(resolve => setTimeout(resolve, BLUETOOTH_CONFIG.CHUNK_DELAY));
            }
          }
          
          console.log('✅ [PRINTER] Recibo enviado exitosamente');
          return true;
        } catch (chunkError) {
          console.warn(`⚠️ [PRINTER] Intento ${attempt + 1} fallido:`, chunkError);
          if (attempt === BLUETOOTH_CONFIG.MAX_RETRIES - 1) throw chunkError;
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }

      return false;
    } catch (error: any) {
      console.error('❌ [PRINTER] Error de impresión:', error);
      setLastError(`Error impresión: ${error.message}`);
      
      // Si es error de conexión, limpiar impresora
      if (error.name === 'NetworkError' || error.message.includes('GATT')) {
        cleanupPrinter(printerId);
      }
      
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [connectedPrinters, generateReceiptCommands, cleanupPrinter]);

  // ===== UTILIDADES =====

  const getNextReceiptNumber = useCallback((): string => {
    try {
      const current = parseInt(localStorage.getItem(STORAGE_KEYS.RECEIPT_COUNTER) || '0');
      const next = current + 1;
      localStorage.setItem(STORAGE_KEYS.RECEIPT_COUNTER, next.toString());
      return next.toString().padStart(4, '0');
    } catch {
      return Date.now().toString().slice(-4);
    }
  }, []);

  const createReceiptData = useCallback((
    order: any, 
    payment: any, 
    table: any,
    companyInfo?: CompanyInfo
  ): ReceiptData => {
    const company = companyInfo || {
      name: 'Soda Fischer',
      phone: '+506 8787 6138',
      address: '27 de Abril Santa Cruz Guanacaste',
      taxId: '',
      email: '',
      website: ''
    };

    return {
      company,
      order,
      payment,
      receiptNumber: getNextReceiptNumber(),
      timestamp: new Date(),
      settings: defaultSettings
    };
  }, [getNextReceiptNumber]);

  const clearError = useCallback(() => setLastError(null), []);
  
  const getDefaultPrinter = useCallback((): BluetoothPrinter | null => {
    return connectedPrinters.find(p => p.connected) || null;
  }, [connectedPrinters]);

  const printWithDefaultPrinter = useCallback(async (receiptData: ReceiptData): Promise<boolean> => {
    const defaultPrinter = getDefaultPrinter();
    if (!defaultPrinter) {
      setLastError('No hay impresoras conectadas');
      return false;
    }
    return printReceipt(defaultPrinter.id, receiptData);
  }, [getDefaultPrinter, printReceipt]);

  const resetAllPrinters = useCallback(() => {
    console.log('🔄 [PRINTER] Reset completo del sistema');
    cleanupAllPrinters();
    setConnectedPrinters([]);
    localStorage.removeItem(STORAGE_KEYS.PRINTERS);
    setLastError(null);
  }, [cleanupAllPrinters]);

  // ===== EFECTOS =====

  // Cargar impresoras al inicializar
  useEffect(() => {
    const savedPrinters = loadPrintersFromStorage();
    if (savedPrinters.length > 0) {
      setConnectedPrinters(savedPrinters);
      console.log(`📂 [PRINTER] Cargadas ${savedPrinters.length} impresoras del storage`);
    }
  }, [loadPrintersFromStorage]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      console.log('🧹 [PRINTER] Desmontando Provider - Limpieza final');
      cleanupAllPrinters();
    };
  }, [cleanupAllPrinters]);

  // ===== CONTEXT VALUE =====

  const contextValue: PrinterContextType = {
    connectedPrinters,
    isScanning,
    isPrinting,
    lastError,
    checkBluetoothSupport,
    scanForPrinters,
    connectToPrinter,
    disconnectPrinter,
    printReceipt,
    createReceiptData,
    clearError,
    getDefaultPrinter,
    printWithDefaultPrinter,
    resetAllPrinters,
  };

  return (
    <PrinterContext.Provider value={contextValue}>
      {children}
    </PrinterContext.Provider>
  );
};

// HOOK PARA USAR EL CONTEXTO
export const usePrinter = (): PrinterContextType => {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error('usePrinter debe usarse dentro de PrinterProvider');
  }
  return context;
};