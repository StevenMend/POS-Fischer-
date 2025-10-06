// contexts/PrinterContext.tsx - VERSIÓN ACTUALIZADA CON NUEVOS FORMATEADORES
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { BluetoothPrinter, CompanyInfo, ReceiptData, PrinterSettings, DailyRecord, Expense } from '../types';
import { generateReceipt } from '../lib/printing/ReceiptFormatter';
import { formatClosureReport } from '../lib/printing/ClosureFormatter';

// CONFIGURACIÓN BLUETOOTH
const BLUETOOTH_CONFIG = {
  SCAN_TIMEOUT: 30000,
  CONNECTION_TIMEOUT: 15000,
  CHUNK_SIZE: 20,
  CHUNK_DELAY: 10,
  MAX_RETRIES: 3,
  SERVICES: [
    '000018f0-0000-1000-8000-00805f9b34fb',
    '00001101-0000-1000-8000-00805f9b34fb',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455',
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
  printClosureReport: (printerId: string, record: DailyRecord, expenses?: Expense[]) => Promise<boolean>;
  createReceiptData: (order: any, payment: any, table: any, companyInfo?: CompanyInfo) => ReceiptData;
  clearError: () => void;
  getDefaultPrinter: () => BluetoothPrinter | null;
  printWithDefaultPrinter: (receiptData: ReceiptData) => Promise<boolean>;
  printClosureWithDefaultPrinter: (record: DailyRecord, expenses?: Expense[]) => Promise<boolean>;
  resetAllPrinters: () => void;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

// CONFIGURACIÓN POR DEFECTO
const defaultSettings: PrinterSettings = {
  paperWidth: 32,
  fontSize: 'normal',
  density: 3,
  cutPaper: true,
  cashDrawer: false,
  encoding: 'utf8'
};

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedPrinters, setConnectedPrinters] = useState<BluetoothPrinter[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const activeConnections = useRef<Map<string, BluetoothDevice>>(new Map());
  const disconnectListeners = useRef<Map<string, () => void>>(new Map());
  const abortController = useRef<AbortController | null>(null);

  // ===== PERSISTENCIA =====
  
  const savePrintersToStorage = useCallback((printers: BluetoothPrinter[]) => {
    try {
      const serializablePrinters = printers.map(printer => ({
        id: printer.id,
        name: printer.name,
        model: printer.model,
        rssi: printer.rssi,
        lastSeen: printer.lastSeen ? printer.lastSeen.toISOString() : null,
        connected: false
      }));
      
      localStorage.setItem(STORAGE_KEYS.PRINTERS, JSON.stringify(serializablePrinters));
      console.log('💾 [PRINTER] Impresoras guardadas:', serializablePrinters.length);
    } catch (error) {
      console.error('❌ [PRINTER] Error guardando:', error);
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
        connected: false,
        device: undefined,
        characteristic: undefined
      }));
    } catch (error) {
      console.error('❌ [PRINTER] Error cargando:', error);
      return [];
    }
  }, []);

  // ===== LIMPIEZA =====

  const cleanupPrinter = useCallback((printerId: string) => {
    console.log(`🧹 [PRINTER] Limpiando: ${printerId}`);
    
    const device = activeConnections.current.get(printerId);
    if (device?.gatt?.connected) {
      try {
        device.gatt.disconnect();
      } catch (error) {
        console.warn('⚠️ [PRINTER] Error desconectando:', error);
      }
    }
    activeConnections.current.delete(printerId);

    const listener = disconnectListeners.current.get(printerId);
    if (listener) {
      listener();
      disconnectListeners.current.delete(printerId);
    }

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
    console.log('🧹 [PRINTER] Limpieza completa');
    
    activeConnections.current.forEach((device, printerId) => {
      cleanupPrinter(printerId);
    });

    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }

    setIsScanning(false);
    setIsPrinting(false);
  }, [cleanupPrinter]);

  const mergePrinter = useCallback((existingPrinters: BluetoothPrinter[], newPrinter: BluetoothPrinter): BluetoothPrinter[] => {
    const existingIndex = existingPrinters.findIndex(p => 
      p.id === newPrinter.id || 
      (p.name === newPrinter.name && p.name !== 'Dispositivo Desconocido')
    );

    if (existingIndex >= 0) {
      return existingPrinters.map((p, index) => 
        index === existingIndex ? {
          ...p,
          ...newPrinter,
          lastSeen: new Date(),
          connected: p.connected || newPrinter.connected,
          device: newPrinter.device || p.device,
          characteristic: newPrinter.characteristic || p.characteristic
        } : p
      );
    } else {
      return [...existingPrinters, { ...newPrinter, lastSeen: new Date() }];
    }
  }, []);

  // ===== CORE FUNCTIONS =====

  const checkBluetoothSupport = useCallback((): boolean => {
    if (!navigator.bluetooth) {
      setLastError('Web Bluetooth API no disponible');
      return false;
    }
    return true;
  }, []);

  const scanForPrinters = useCallback(async (): Promise<BluetoothPrinter[]> => {
    console.log('🔍 [PRINTER] Escaneando...');
    
    if (!checkBluetoothSupport()) return [];
    
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
          setTimeout(() => reject(new Error('Timeout')), BLUETOOTH_CONFIG.SCAN_TIMEOUT)
        )
      ]);

      if (device && !abortController.current.signal.aborted) {
        console.log('📱 [PRINTER] Encontrado:', device.name);
        
        const newPrinter: BluetoothPrinter = {
          id: device.id,
          name: device.name || 'Dispositivo Desconocido',
          connected: false,
          device: device,
          lastSeen: new Date(),
          model: device.name?.includes('MPR') ? 'MPR-300' : undefined
        };

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
        console.log('🛑 [PRINTER] Cancelado');
        return [];
      }

      console.error('❌ [PRINTER] Error escaneo:', error);
      
      if (error.name === 'NotFoundError') {
        setLastError('No se seleccionó dispositivo');
      } else if (error.name === 'SecurityError') {
        setLastError('Permisos Bluetooth denegados');
      } else {
        setLastError(`Error: ${error.message}`);
      }
      
      return [];
    } finally {
      setIsScanning(false);
      abortController.current = null;
    }
  }, [checkBluetoothSupport, mergePrinter, savePrintersToStorage]);

  const connectToPrinter = useCallback(async (printerId: string): Promise<boolean> => {
    console.log(`🔌 [PRINTER] Conectando: ${printerId}`);
    
    const printer = connectedPrinters.find(p => p.id === printerId);
    if (!printer?.device) {
      setLastError('Dispositivo no válido');
      return false;
    }

    cleanupPrinter(printerId);
    setLastError(null);

    try {
      const connectWithTimeout = async () => {
        const server = await printer.device!.gatt!.connect();
        
        const handleDisconnect = () => {
          console.log(`📡 [PRINTER] Desconectado: ${printerId}`);
          cleanupPrinter(printerId);
        };
        
        printer.device!.addEventListener('gattserverdisconnected', handleDisconnect);
        disconnectListeners.current.set(printerId, () => {
          printer.device!.removeEventListener('gattserverdisconnected', handleDisconnect);
        });

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
            console.warn('⚠️ [PRINTER] Error características:', charError);
          }
        }

        if (!writeCharacteristic) {
          throw new Error('Sin características de escritura');
        }

        return writeCharacteristic;
      };

      const characteristic = await Promise.race([
        connectWithTimeout(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), BLUETOOTH_CONFIG.CONNECTION_TIMEOUT)
        )
      ]);

      activeConnections.current.set(printerId, printer.device);
      
      setConnectedPrinters(prev => 
        prev.map(p => p.id === printerId ? {
          ...p,
          connected: true,
          characteristic: characteristic,
          lastSeen: new Date()
        } : p)
      );

      console.log('✅ [PRINTER] Conectado');
      return true;
    } catch (error: any) {
      console.error('❌ [PRINTER] Error conexión:', error);
      setLastError(`Conexión fallida: ${error.message}`);
      cleanupPrinter(printerId);
      return false;
    }
  }, [connectedPrinters, cleanupPrinter]);

  const disconnectPrinter = useCallback(async (printerId: string): Promise<void> => {
    console.log(`🔌 [PRINTER] Desconectando: ${printerId}`);
    cleanupPrinter(printerId);
    
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

  // ===== NUEVA FUNCIÓN: Enviar bytes a impresora =====
  
  const sendBytesToPrinter = useCallback(async (
    printerId: string,
    bytes: Uint8Array
  ): Promise<boolean> => {
    const printer = connectedPrinters.find(p => p.id === printerId && p.connected);
    if (!printer?.characteristic) {
      setLastError('Impresora no conectada');
      return false;
    }

    console.log(`📤 [PRINTER] Enviando ${bytes.length} bytes...`);

    try {
      for (let attempt = 0; attempt < BLUETOOTH_CONFIG.MAX_RETRIES; attempt++) {
        try {
          for (let i = 0; i < bytes.length; i += BLUETOOTH_CONFIG.CHUNK_SIZE) {
            const chunk = bytes.slice(i, i + BLUETOOTH_CONFIG.CHUNK_SIZE);
            await printer.characteristic.writeValue(chunk);
            
            if (i + BLUETOOTH_CONFIG.CHUNK_SIZE < bytes.length) {
              await new Promise(resolve => setTimeout(resolve, BLUETOOTH_CONFIG.CHUNK_DELAY));
            }
          }
          
          console.log('✅ [PRINTER] Enviado exitosamente');
          return true;
        } catch (chunkError) {
          console.warn(`⚠️ [PRINTER] Intento ${attempt + 1} fallido:`, chunkError);
          if (attempt === BLUETOOTH_CONFIG.MAX_RETRIES - 1) throw chunkError;
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }

      return false;
    } catch (error: any) {
      console.error('❌ [PRINTER] Error envío:', error);
      setLastError(`Error: ${error.message}`);
      
      if (error.name === 'NetworkError' || error.message.includes('GATT')) {
        cleanupPrinter(printerId);
      }
      
      return false;
    }
  }, [connectedPrinters, cleanupPrinter]);

  // ===== IMPRESIÓN DE RECIBOS (CON NUEVOS FORMATEADORES) =====

  const printReceipt = useCallback(async (
    printerId: string, 
    receiptData: ReceiptData
  ): Promise<boolean> => {
    console.log(`🖨️ [PRINTER] Imprimiendo recibo...`);
    
    setIsPrinting(true);
    setLastError(null);

    try {
      const receipts = generateReceipt({
        company: receiptData.company,
        order: receiptData.order,
        payment: receiptData.payment,
        receiptNumber: receiptData.receiptNumber,
        timestamp: receiptData.timestamp,
        settings: receiptData.settings
      });

      for (const receiptBytes of receipts) {
        const success = await sendBytesToPrinter(printerId, receiptBytes);
        if (!success) return false;
        
        if (receipts.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`✅ [PRINTER] ${receipts.length} recibo(s) impreso(s)`);
      return true;
    } catch (error: any) {
      console.error('❌ [PRINTER] Error impresión recibo:', error);
      setLastError(`Error: ${error.message}`);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [sendBytesToPrinter]);

  // ===== NUEVA FUNCIÓN: IMPRESIÓN DE CIERRE =====

  const printClosureReport = useCallback(async (
    printerId: string,
    record: DailyRecord,
    expenses: Expense[] = []
  ): Promise<boolean> => {
    console.log(`🖨️ [PRINTER] Imprimiendo cierre diario...`);
    
    setIsPrinting(true);
    setLastError(null);

    try {
      const closureBytes = formatClosureReport({
        record,
        expenses,
        includeDetailedOrders: false,
        paperWidth: 32
      });

      const success = await sendBytesToPrinter(printerId, closureBytes);
      
      if (success) {
        console.log('✅ [PRINTER] Cierre impreso exitosamente');
      }
      
      return success;
    } catch (error: any) {
      console.error('❌ [PRINTER] Error impresión cierre:', error);
      setLastError(`Error cierre: ${error.message}`);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [sendBytesToPrinter]);

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

  const printClosureWithDefaultPrinter = useCallback(async (
    record: DailyRecord,
    expenses: Expense[] = []
  ): Promise<boolean> => {
    const defaultPrinter = getDefaultPrinter();
    if (!defaultPrinter) {
      setLastError('No hay impresoras conectadas');
      return false;
    }
    return printClosureReport(defaultPrinter.id, record, expenses);
  }, [getDefaultPrinter, printClosureReport]);

  const resetAllPrinters = useCallback(() => {
    console.log('🔄 [PRINTER] Reset completo');
    cleanupAllPrinters();
    setConnectedPrinters([]);
    localStorage.removeItem(STORAGE_KEYS.PRINTERS);
    setLastError(null);
  }, [cleanupAllPrinters]);

  // ===== EFECTOS =====

  useEffect(() => {
    const savedPrinters = loadPrintersFromStorage();
    if (savedPrinters.length > 0) {
      setConnectedPrinters(savedPrinters);
      console.log(`📂 [PRINTER] Cargadas ${savedPrinters.length} impresoras`);
    }
  }, [loadPrintersFromStorage]);

  useEffect(() => {
    return () => {
      console.log('🧹 [PRINTER] Desmontando - Limpieza final');
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
    printClosureReport,
    createReceiptData,
    clearError,
    getDefaultPrinter,
    printWithDefaultPrinter,
    printClosureWithDefaultPrinter,
    resetAllPrinters,
  };

  return (
    <PrinterContext.Provider value={contextValue}>
      {children}
    </PrinterContext.Provider>
  );
};

export const usePrinter = (): PrinterContextType => {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error('usePrinter debe usarse dentro de PrinterProvider');
  }
  return context;
};