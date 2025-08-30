// contexts/PrinterContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { BluetoothPrinter, CompanyInfo, ReceiptData, PrinterSettings } from '../types';

// ESC/POS Commands optimizados para MPR-300
const ESC_POS = {
  ESC: '\x1B',
  GS: '\x1D',
  INIT: '\x1B\x40',
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_RIGHT: '\x1B\x61\x02',
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  DOUBLE_HEIGHT: '\x1B\x21\x10',
  NORMAL_SIZE: '\x1B\x21\x00',
  FONT_A: '\x1B\x4D\x00',
  LINE_FEED: '\x0A',
  PAPER_CUT: '\x1D\x56\x00',
  CASH_DRAWER: '\x1B\x70\x00\x19\x19',
  DENSITY: (level: number) => `\x1D\x7C${String.fromCharCode(level)}`,
};

interface PrinterContextType {
  // Estado
  connectedPrinters: BluetoothPrinter[];
  isScanning: boolean;
  isPrinting: boolean;
  lastError: string | null;
  
  // Funciones principales
  checkBluetoothSupport: () => boolean;
  scanForPrinters: () => Promise<BluetoothPrinter[]>;
  connectToPrinter: (printerId: string) => Promise<boolean>;
  disconnectPrinter: (printerId: string) => Promise<void>;
  printReceipt: (printerId: string, receiptData: ReceiptData) => Promise<boolean>;
  createReceiptData: (order: any, payment: any, table: any, companyInfo?: CompanyInfo) => ReceiptData;
  
  // Utilidades
  clearError: () => void;
  getDefaultPrinter: () => BluetoothPrinter | null;
  printWithDefaultPrinter: (receiptData: ReceiptData) => Promise<boolean>;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

// Configuración optimizada MPR-300
const defaultSettings: PrinterSettings = {
  paperWidth: 72,
  fontSize: 'normal',
  density: 3,
  cutPaper: true,
  cashDrawer: false,
  encoding: 'utf8'
};

// Clave para persistencia
const PRINTER_STORAGE_KEY = 'fischer_printer_connections';

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedPrinters, setConnectedPrinters] = useState<BluetoothPrinter[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const scanTimeoutRef = useRef<NodeJS.Timeout>();

  // PERSISTENCIA: Cargar conexiones guardadas al iniciar
  useEffect(() => {
    const loadSavedPrinters = () => {
      try {
        const saved = localStorage.getItem(PRINTER_STORAGE_KEY);
        if (saved) {
          const printers = JSON.parse(saved);
          console.log('📂 [PRINTER_CONTEXT] Cargando impresoras guardadas:', printers.length);
          setConnectedPrinters(printers.map((p: any) => ({
            ...p,
            device: undefined, // No podemos serializar BluetoothDevice
            characteristic: undefined,
            connected: false // Requiere reconexión manual
          })));
        }
      } catch (error) {
        console.error('❌ [PRINTER_CONTEXT] Error cargando impresoras:', error);
      }
    };

    loadSavedPrinters();
  }, []);

  // PERSISTENCIA: Guardar cambios en connectedPrinters
  useEffect(() => {
    if (connectedPrinters.length > 0) {
      try {
        // Solo guardar datos serializables
        const serializable = connectedPrinters.map(p => ({
          id: p.id,
          name: p.name,
          model: p.model,
          lastSeen: p.lastSeen,
          connected: p.connected
        }));
        localStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(serializable));
        console.log('💾 [PRINTER_CONTEXT] Estado de impresoras guardado');
      } catch (error) {
        console.error('❌ [PRINTER_CONTEXT] Error guardando estado:', error);
      }
    }
  }, [connectedPrinters]);

  // Función de limpieza optimizada para MPR-300
  const cleanTextForPrinter = useCallback((text: string): string => {
    return text
      .replace(/₡/g, 'C')
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[ÁÀÄÂ]/g, 'A')
      .replace(/[ÉÈËÊ]/g, 'E')
      .replace(/[ÍÌÏÎ]/g, 'I')
      .replace(/[ÓÒÖÔ]/g, 'O')
      .replace(/[ÚÙÜÛ]/g, 'U')
      .replace(/Ñ/g, 'N')
      .replace(/[^\x00-\x7F]/g, '?');
  }, []);

  // Verificar soporte Bluetooth
  const checkBluetoothSupport = useCallback((): boolean => {
    if (!navigator.bluetooth) {
      const error = 'Web Bluetooth API no soportada en este navegador';
      console.error('❌ [PRINTER_CONTEXT]', error);
      setLastError(error);
      return false;
    }
    return true;
  }, []);

  // Escanear impresoras
  const scanForPrinters = useCallback(async (): Promise<BluetoothPrinter[]> => {
    console.log('📡 [PRINTER_CONTEXT] Escaneando impresoras...');
    
    if (!checkBluetoothSupport()) return [];

    setIsScanning(true);
    setLastError(null);

    try {
      const options = {
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '00001101-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        ]
      };

      const device = await navigator.bluetooth.requestDevice(options);
      
      if (device) {
        const printer: BluetoothPrinter = {
          id: device.id,
          name: device.name || 'Dispositivo Desconocido',
          connected: false,
          device: device,
          lastSeen: new Date(),
          model: device.name?.includes('MPR') ? 'MPR-300' : undefined
        };

        setConnectedPrinters(prev => {
          const existing = prev.find(p => p.id === device.id);
          if (existing) {
            return prev.map(p => p.id === device.id ? { ...p, device, lastSeen: new Date() } : p);
          } else {
            return [...prev, printer];
          }
        });

        console.log('✅ [PRINTER_CONTEXT] Impresora agregada:', device.name);
        return [printer];
      }
    } catch (error: any) {
      console.error('❌ [PRINTER_CONTEXT] Error en escaneo:', error);
      setLastError(`Error de escaneo: ${error.message}`);
    } finally {
      setIsScanning(false);
    }

    return [];
  }, [checkBluetoothSupport]);

  // Conectar a impresora
  const connectToPrinter = useCallback(async (printerId: string): Promise<boolean> => {
    console.log(`🔌 [PRINTER_CONTEXT] Conectando: ${printerId}`);
    
    const printer = connectedPrinters.find(p => p.id === printerId);
    if (!printer?.device) {
      setLastError('Impresora no encontrada');
      return false;
    }

    try {
      const server = await printer.device.gatt!.connect();
      const services = await server.getPrimaryServices();
      
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              printer.characteristic = char;
              printer.connected = true;
              
              setConnectedPrinters(prev =>
                prev.map(p => p.id === printerId ? printer : p)
              );
              
              console.log('🎉 [PRINTER_CONTEXT] Conectado exitosamente!');
              setLastError(null);
              return true;
            }
          }
        } catch (charError) {
          console.warn('⚠️ [PRINTER_CONTEXT] Error accediendo características:', charError);
        }
      }

      throw new Error('No se encontró característica de escritura');
    } catch (error: any) {
      console.error('❌ [PRINTER_CONTEXT] Error conectando:', error);
      setLastError(`Error de conexión: ${error.message}`);
      return false;
    }
  }, [connectedPrinters]);

  // Desconectar impresora
  const disconnectPrinter = useCallback(async (printerId: string): Promise<void> => {
    const printer = connectedPrinters.find(p => p.id === printerId);
    if (printer?.device?.gatt?.connected) {
      try {
        await printer.device.gatt.disconnect();
      } catch (error) {
        console.error('❌ [PRINTER_CONTEXT] Error desconectando:', error);
      }
    }

    setConnectedPrinters(prev =>
      prev.map(p => 
        p.id === printerId 
          ? { ...p, connected: false, characteristic: undefined }
          : p
      )
    );
    
    console.log('✅ [PRINTER_CONTEXT] Desconectado:', printerId);
  }, [connectedPrinters]);

  // Generar comandos optimizados con formato corregido
  const generateReceiptCommands = useCallback((receiptData: ReceiptData): Uint8Array => {
    const { company, order, payment, receiptNumber, timestamp, settings } = receiptData;
    let commands = '';

    // Inicialización optimizada
    commands += ESC_POS.INIT;
    commands += ESC_POS.DENSITY(settings.density);
    commands += ESC_POS.FONT_A;

    // Header corregido - 16 chars max para doble altura
    commands += ESC_POS.ALIGN_CENTER;
    commands += ESC_POS.BOLD_ON;
    commands += ESC_POS.DOUBLE_HEIGHT;
    const companyName = cleanTextForPrinter(company.name);
    commands += `${companyName.length > 16 ? companyName.substring(0, 16) : companyName}\n`;
    commands += ESC_POS.NORMAL_SIZE;
    commands += ESC_POS.BOLD_OFF;
    
    // Dirección CORREGIDA - dividir en líneas de 32 chars máximo
    const address = cleanTextForPrinter(company.address);
    if (address.length <= 32) {
      commands += `${address}\n`;
    } else {
      // Dividir inteligentemente
      const words = address.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        if ((currentLine + word).length <= 32) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) commands += `${currentLine}\n`;
          currentLine = word.length <= 32 ? word : word.substring(0, 32);
        }
      }
      if (currentLine) commands += `${currentLine}\n`;
    }
    
    if (company.phone) commands += `Tel: ${cleanTextForPrinter(company.phone)}\n`;
    commands += ESC_POS.LINE_FEED;

    // Resto del recibo (productos, totales, etc.)
    commands += ESC_POS.ALIGN_LEFT;
    commands += '='.repeat(32) + '\n';
    commands += ESC_POS.ALIGN_CENTER + ESC_POS.BOLD_ON + 'RECIBO DE COMPRA\n' + ESC_POS.BOLD_OFF;
    commands += '='.repeat(32) + '\n' + ESC_POS.LINE_FEED;
    
    commands += ESC_POS.ALIGN_LEFT;
    commands += `Recibo #: ${receiptNumber}\n`;
    commands += `Mesa: ${order.tableNumber}\n`;
    commands += `Fecha: ${timestamp.toLocaleDateString('es-CR')}\n`;
    commands += `Hora: ${timestamp.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}\n`;
    commands += ESC_POS.LINE_FEED;

    // Productos
    commands += '-'.repeat(32) + '\n';
    commands += ESC_POS.BOLD_ON + 'PRODUCTOS\n' + ESC_POS.BOLD_OFF;
    commands += '-'.repeat(32) + '\n';
    
    order.items?.forEach((item: any) => {
      const name = item.product?.name || item.menuItem?.name || 'Producto';
      const qty = item.quantity;
      const subtotal = item.subtotal;

      const cleanName = cleanTextForPrinter(name);
      const displayName = cleanName.length > 32 ? cleanName.substring(0, 32) : cleanName;
      commands += `${displayName}\n`;
      
      const qtyLine = `  ${qty} x C${subtotal.toLocaleString('es-CR')}`;
      commands += `${qtyLine}\n`;
      
      if (item.notes) {
        const notes = cleanTextForPrinter(item.notes);
        commands += `  ${notes.substring(0, 30)}\n`;
      }
    });

    // Totales
    commands += '-'.repeat(32) + '\n';
    const subtotalLine = `Subtotal: ${' '.repeat(32 - 10 - order.subtotal.toLocaleString('es-CR').length - 1)}C${order.subtotal.toLocaleString('es-CR')}`;
    commands += subtotalLine.substring(0, 32) + '\n';
    
    const serviceLine = `Servicio: ${' '.repeat(32 - 10 - order.serviceCharge.toLocaleString('es-CR').length - 1)}C${order.serviceCharge.toLocaleString('es-CR')}`;
    commands += serviceLine.substring(0, 32) + '\n';
    
    commands += '='.repeat(32) + '\n';
    commands += ESC_POS.BOLD_ON;
    const totalLine = `TOTAL: ${' '.repeat(32 - 7 - order.total.toLocaleString('es-CR').length - 1)}C${order.total.toLocaleString('es-CR')}`;
    commands += totalLine.substring(0, 32) + '\n';
    commands += ESC_POS.BOLD_OFF;
    commands += ESC_POS.LINE_FEED;

    // Footer
    commands += ESC_POS.ALIGN_CENTER;
    commands += 'Gracias por su visita!\n';
    commands += 'Vuelva pronto\n';
    commands += ESC_POS.LINE_FEED + ESC_POS.LINE_FEED;
    
    if (settings.cutPaper) commands += ESC_POS.PAPER_CUT;

    // Conversión optimizada a bytes
    const cleanCommands = cleanTextForPrinter(commands);
    const commandsArray = new Uint8Array(cleanCommands.length);
    for (let i = 0; i < cleanCommands.length; i++) {
      commandsArray[i] = cleanCommands.charCodeAt(i);
    }
    
    console.log(`📤 [PRINTER_CONTEXT] Comandos generados: ${commandsArray.length} bytes`);
    return commandsArray;
  }, [cleanTextForPrinter]);

  // Imprimir recibo OPTIMIZADO
  const printReceipt = useCallback(async (
    printerId: string, 
    receiptData: ReceiptData
  ): Promise<boolean> => {
    const printer = connectedPrinters.find(p => p.id === printerId && p.connected);
    if (!printer?.characteristic) {
      setLastError('Impresora no conectada');
      return false;
    }

    setIsPrinting(true);
    setLastError(null);

    try {
      const commands = generateReceiptCommands(receiptData);
      
      // OPTIMIZACIÓN CRÍTICA: Chunks más grandes y delay reducido
      const CHUNK_SIZE = 64; // Aumentado de 20 a 64 bytes
      const DELAY = 5; // Reducido de 10ms a 5ms
      
      console.log(`🚀 [PRINTER_CONTEXT] Impresión RÁPIDA: ${CHUNK_SIZE} bytes chunks, ${DELAY}ms delay`);
      
      for (let i = 0; i < commands.length; i += CHUNK_SIZE) {
        const chunk = commands.slice(i, i + CHUNK_SIZE);
        await printer.characteristic.writeValue(chunk);
        
        if (i + CHUNK_SIZE < commands.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY));
        }
        
        // Log cada 20 chunks para no spamear
        if (Math.floor(i / CHUNK_SIZE) % 20 === 0) {
          const progress = Math.round((i / commands.length) * 100);
          console.log(`📊 [PRINTER_CONTEXT] Progreso: ${progress}%`);
        }
      }
      
      console.log('🎉 [PRINTER_CONTEXT] Impresión completada!');
      return true;
    } catch (error: any) {
      console.error('❌ [PRINTER_CONTEXT] Error imprimiendo:', error);
      setLastError(`Error de impresión: ${error.message}`);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [connectedPrinters, generateReceiptCommands]);

  // Helper para crear datos de recibo
  const createReceiptData = useCallback((
    order: any, 
    payment: any, 
    table: any,
    companyInfo?: CompanyInfo
  ): ReceiptData => {
    const company = companyInfo || JSON.parse(
      localStorage.getItem('fischer_company_info') || 
      JSON.stringify({
        name: 'Soda Fischer',
        phone: '+506 8787 6138',
        address: '27 de Abril Santa Cruz Guanacaste',
        taxId: '',
        email: '',
        website: ''
      })
    );

    return {
      company,
      order,
      payment,
      receiptNumber: `${Date.now().toString().slice(-6)}`,
      timestamp: new Date(),
      settings: defaultSettings
    };
  }, []);

  // Utilidades adicionales
  const clearError = useCallback(() => setLastError(null), []);
  
  const getDefaultPrinter = useCallback((): BluetoothPrinter | null => {
    return connectedPrinters.find(p => p.connected) || null;
  }, [connectedPrinters]);

  const printWithDefaultPrinter = useCallback(async (receiptData: ReceiptData): Promise<boolean> => {
    const defaultPrinter = getDefaultPrinter();
    if (!defaultPrinter) {
      console.warn('⚠️ [PRINTER_CONTEXT] No hay impresora por defecto');
      setLastError('No hay impresoras conectadas');
      return false;
    }
    
    return await printReceipt(defaultPrinter.id, receiptData);
  }, [getDefaultPrinter, printReceipt]);

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
  };

  return (
    <PrinterContext.Provider value={contextValue}>
      {children}
    </PrinterContext.Provider>
  );
};

// Hook para usar el contexto
export const usePrinter = (): PrinterContextType => {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error('usePrinter debe usarse dentro de PrinterProvider');
  }
  return context;
};