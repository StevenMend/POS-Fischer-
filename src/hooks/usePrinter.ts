import { useState, useCallback, useRef } from 'react';
import { BluetoothPrinter, CompanyInfo, ReceiptData, PrinterSettings } from '../types';

// ESC/POS Commands para MPR-300
const ESC_POS = {
  // Comandos básicos
  ESC: '\x1B',
  GS: '\x1D',
  
  // Inicialización
  INIT: '\x1B\x40',
  
  // Alineación
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_RIGHT: '\x1B\x61\x02',
  
  // Formato de texto
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  UNDERLINE_ON: '\x1B\x2D\x01',
  UNDERLINE_OFF: '\x1B\x2D\x00',
  DOUBLE_HEIGHT: '\x1B\x21\x10',
  NORMAL_SIZE: '\x1B\x21\x00',
  
  // Tamaños de fuente
  FONT_A: '\x1B\x4D\x00',  // 12x24
  FONT_B: '\x1B\x4D\x01',  // 9x17
  
  // Avance de papel
  LINE_FEED: '\x0A',
  FORM_FEED: '\x0C',
  PAPER_CUT: '\x1D\x56\x00',      // Corte completo
  PARTIAL_CUT: '\x1D\x56\x01',    // Corte parcial
  
  // Cajón de dinero
  CASH_DRAWER: '\x1B\x70\x00\x19\x19',
  
  // Densidad de impresión (1-5)
  DENSITY: (level: number) => `\x1D\x7C${String.fromCharCode(level)}`,
};

export const usePrinter = () => {
  const [connectedPrinters, setConnectedPrinters] = useState<BluetoothPrinter[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const scanTimeoutRef = useRef<NodeJS.Timeout>();

  // Configuración específica MPR-300
  const defaultSettings: PrinterSettings = {
    paperWidth: 72, // MPR-300: 72mm exact
    fontSize: 'normal',
    density: 3, // MPR-300: 1-5 range
    cutPaper: true,
    cashDrawer: false,
    encoding: 'utf8'
  };

  // MPR-300 Specific Constants
  const MPR300_SPECS = {
    PAPER_WIDTH_MM: 72,
    RESOLUTION_DPI: 203,
    LINE_SPACING_MM: 3.75,
    MAX_CHARS_PER_LINE: 32, // 72mm @ 203 DPI with standard font
    MAX_PRINT_SPEED: 70, // mm/s
    BUFFER_SIZE: 128 * 1024 // 128KB
  };

  // Verificar compatibilidad Web Bluetooth
  const checkBluetoothSupport = useCallback((): boolean => {
    console.log('🔍 [PRINTER] Verificando soporte Bluetooth...');
    
    if (!navigator.bluetooth) {
      const error = 'Web Bluetooth API no soportada en este navegador';
      console.error('❌ [PRINTER]', error);
      setLastError(error);
      return false;
    }
    
    console.log('✅ [PRINTER] Web Bluetooth API disponible');
    return true;
  }, []);

  // Escanear dispositivos Bluetooth cercanos
  const scanForPrinters = useCallback(async (): Promise<BluetoothPrinter[]> => {
    console.log('📡 [PRINTER] Iniciando escaneo de impresoras...');
    
    if (!checkBluetoothSupport()) {
      return [];
    }

    setIsScanning(true);
    setLastError(null);

    try {
      // Filtros específicos para impresoras térmicas
      const options = {
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Serial port service
          '00001101-0000-1000-8000-00805f9b34fb', // SPP
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Custom service
        ]
      };

      console.log('🔍 [PRINTER] Solicitando dispositivo Bluetooth...');
      const device = await navigator.bluetooth.requestDevice(options);
      
      if (device) {
        console.log('📱 [PRINTER] Dispositivo encontrado:', {
          name: device.name,
          id: device.id,
          connected: device.gatt?.connected || false
        });

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
            console.log('🔄 [PRINTER] Actualizando dispositivo existente');
            return prev.map(p => p.id === device.id ? printer : p);
          } else {
            console.log('➕ [PRINTER] Agregando nuevo dispositivo');
            return [...prev, printer];
          }
        });

        return [printer];
      }

    } catch (error: any) {
      console.error('❌ [PRINTER] Error en escaneo:', error);
      
      if (error.name === 'NotFoundError') {
        setLastError('No se seleccionó ningún dispositivo');
      } else if (error.name === 'SecurityError') {
        setLastError('Permisos de Bluetooth denegados');
      } else {
        setLastError(`Error de escaneo: ${error.message}`);
      }
    } finally {
      setIsScanning(false);
      console.log('📡 [PRINTER] Escaneo finalizado');
    }

    return [];
  }, [checkBluetoothSupport]);

  // Conectar a impresora específica
  const connectToPrinter = useCallback(async (printerId: string): Promise<boolean> => {
    console.log(`🔌 [PRINTER] Conectando a impresora: ${printerId}`);
    
    const printer = connectedPrinters.find(p => p.id === printerId);
    if (!printer || !printer.device) {
      const error = 'Impresora no encontrada';
      console.error('❌ [PRINTER]', error);
      setLastError(error);
      return false;
    }

    try {
      console.log('🔗 [PRINTER] Conectando GATT...');
      const server = await printer.device.gatt!.connect();
      
      console.log('🔍 [PRINTER] Buscando servicios...');
      const services = await server.getPrimaryServices();
      
      console.log(`📋 [PRINTER] Servicios encontrados: ${services.length}`);
      services.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.uuid}`);
      });

      // Buscar servicio de impresión (típicamente SPP o servicio personalizado)
      let targetService;
      for (const service of services) {
        try {
          console.log(`🔍 [PRINTER] Verificando servicio: ${service.uuid}`);
          const characteristics = await service.getCharacteristics();
          
          for (const char of characteristics) {
            console.log(`   📝 Característica: ${char.uuid}`);
            console.log(`   📤 Write: ${char.properties.write}`);
            console.log(`   📥 Notify: ${char.properties.notify}`);
            
            // Buscar característica que permita escribir
            if (char.properties.write || char.properties.writeWithoutResponse) {
              console.log('✅ [PRINTER] Característica de escritura encontrada');
              targetService = service;
              printer.characteristic = char;
              break;
            }
          }
          
          if (targetService) break;
        } catch (charError: any) {
          console.warn(`⚠️ [PRINTER] Error accediendo características del servicio ${service.uuid}:`, charError.message);
        }
      }

      if (!printer.characteristic) {
        throw new Error('No se encontró característica de escritura compatible');
      }

      // Actualizar estado
      printer.connected = true;
      setConnectedPrinters(prev => 
        prev.map(p => p.id === printerId ? printer : p)
      );
      
      console.log('🎉 [PRINTER] Conexión exitosa!');
      setLastError(null);
      return true;

    } catch (error: any) {
      console.error('❌ [PRINTER] Error de conexión:', error);
      setLastError(`Error de conexión: ${error.message}`);
      return false;
    }
  }, [connectedPrinters]);

  // Desconectar impresora
  const disconnectPrinter = useCallback(async (printerId: string): Promise<void> => {
    console.log(`🔌 [PRINTER] Desconectando impresora: ${printerId}`);
    
    const printer = connectedPrinters.find(p => p.id === printerId);
    if (printer?.device?.gatt?.connected) {
      try {
        await printer.device.gatt.disconnect();
        console.log('✅ [PRINTER] Desconectado exitosamente');
      } catch (error: any) {
        console.error('❌ [PRINTER] Error desconectando:', error.message);
      }
    }

    // Actualizar estado
    setConnectedPrinters(prev =>
      prev.map(p => 
        p.id === printerId 
          ? { ...p, connected: false, characteristic: undefined }
          : p
      )
    );
  }, [connectedPrinters]);

  // Función para limpiar caracteres problemáticos para MPR-300
  const cleanTextForPrinter = useCallback((text: string): string => {
    return text
      .replace(/₡/g, 'C')           // Colón símbolo → C
      .replace(/á/g, 'a')           // á → a
      .replace(/é/g, 'e')           // é → e  
      .replace(/í/g, 'i')           // í → i
      .replace(/ó/g, 'o')           // ó → o
      .replace(/ú/g, 'u')           // ú → u
      .replace(/ñ/g, 'n')           // ñ → n
      .replace(/Á/g, 'A')           // Á → A
      .replace(/É/g, 'E')           // É → E
      .replace(/Í/g, 'I')           // Í → I
      .replace(/Ó/g, 'O')           // Ó → O
      .replace(/Ú/g, 'U')           // Ú → U
      .replace(/Ñ/g, 'N')           // Ñ → N
      .replace(/[^\x00-\x7F]/g, '?'); // Otros caracteres no ASCII → ?
  }, []);

  // Generar comandos ESC/POS para recibo con formato MPR-300
  const generateReceiptCommands = useCallback((receiptData: ReceiptData): Uint8Array => {
    console.log('📝 [PRINTER] Generando comandos ESC/POS para MPR-300...');
    
    const { company, order, payment, receiptNumber, timestamp, settings } = receiptData;
    let commands = '';

    // Inicializar impresora MPR-300
    commands += ESC_POS.INIT;
    commands += ESC_POS.DENSITY(settings.density);
    commands += ESC_POS.FONT_A; // Fuente estándar MPR-300

    console.log('🏢 [PRINTER] Agregando header (32 chars max)...');
    
    // Header - Centrado para 32 caracteres
    commands += ESC_POS.ALIGN_CENTER;
    commands += ESC_POS.BOLD_ON;
    commands += ESC_POS.DOUBLE_HEIGHT;
    commands += `${cleanTextForPrinter(company.name).substring(0, 16)}\n`; // Max 16 chars para doble altura
    commands += ESC_POS.NORMAL_SIZE;
    commands += ESC_POS.BOLD_OFF;
    
    // Dirección ajustada a 32 chars
    const addressLines = cleanTextForPrinter(company.address).match(/.{1,32}/g) || [company.address];
    addressLines.forEach(line => {
      commands += `${line.trim()}\n`;
    });
    
    if (company.phone) commands += `Tel: ${cleanTextForPrinter(company.phone)}\n`;
    if (company.email && company.email.length <= 32) commands += `${cleanTextForPrinter(company.email)}\n`;
    if (company.taxId) commands += `Ced: ${cleanTextForPrinter(company.taxId)}\n`;
    
    commands += ESC_POS.LINE_FEED;

    // Separador exacto 32 chars
    commands += ESC_POS.ALIGN_LEFT;
    commands += '='.repeat(32) + '\n';
    commands += ESC_POS.ALIGN_CENTER;
    commands += ESC_POS.BOLD_ON;
    commands += 'RECIBO DE COMPRA\n';
    commands += ESC_POS.BOLD_OFF;
    commands += '='.repeat(32) + '\n';
    commands += ESC_POS.LINE_FEED;

    console.log('📋 [PRINTER] Información orden (formato 32 chars)...');
    
    // Información de la orden - formato optimizado
    commands += ESC_POS.ALIGN_LEFT;
    commands += `Recibo #: ${receiptNumber}\n`;
    commands += `Mesa: ${order.tableNumber.toString().padEnd(25)} \n`;
    commands += `Fecha: ${timestamp.toLocaleDateString('es-CR')}\n`;
    commands += `Hora: ${timestamp.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}\n`;
    commands += ESC_POS.LINE_FEED;

    // Items con formato optimizado para 32 chars
    commands += '-'.repeat(32) + '\n';
    commands += ESC_POS.BOLD_ON;
    commands += 'PRODUCTOS\n';
    commands += ESC_POS.BOLD_OFF;
    commands += '-'.repeat(32) + '\n';

    console.log(`🛒 [PRINTER] ${order.items?.length || 0} productos (32 chars format)...`);
    
    order.items?.forEach((item, index) => {
      const name = item.product?.name || item.menuItem?.name || 'Producto';
      const qty = item.quantity;
      const price = item.product?.price || item.menuItem?.price || 0;
      const subtotal = item.subtotal;

      console.log(`   ${index + 1}. ${name} x${qty} = C${subtotal}`);
      
      // Nombre producto - máximo 32 chars y limpiado
      const productName = cleanTextForPrinter(name);
      const displayName = productName.length > 32 ? productName.substring(0, 32) : productName;
      commands += `${displayName}\n`;
      
      // Línea de cantidad y precio - formato exacto 32 chars
      const qtyText = `  ${qty} x `;
      const priceText = `C${price.toLocaleString('es-CR')}`;
      const subtotalText = `C${subtotal.toLocaleString('es-CR')}`;
      
      // Calcular espacios para alineación exacta a 32 chars
      const usedChars = qtyText.length + priceText.length + subtotalText.length;
      const spaces = Math.max(1, 32 - usedChars);
      
      commands += qtyText + priceText + ' '.repeat(spaces) + subtotalText + '\n';
      
      // Notas si las hay
      if (item.notes && item.notes.length > 0) {
        const cleanNotes = cleanTextForPrinter(item.notes);
        const notesLine = `  ${cleanNotes}`;
        commands += notesLine.substring(0, 32) + '\n';
      }
    });

    console.log('💰 [PRINTER] Totales con alineación exacta...');
    
    // Totales con alineación perfecta a 32 chars
    commands += '-'.repeat(32) + '\n';
    
    // Subtotal
    const subtotalLabel = 'Subtotal:';
    const subtotalAmount = `C${order.subtotal?.toLocaleString('es-CR') || '0'}`;
    const subtotalSpaces = 32 - subtotalLabel.length - subtotalAmount.length;
    commands += subtotalLabel + ' '.repeat(Math.max(1, subtotalSpaces)) + subtotalAmount + '\n';
    
    // Servicio
    const serviceLabel = 'Servicio (10%):';
    const serviceAmount = `C${order.serviceCharge?.toLocaleString('es-CR') || '0'}`;
    const serviceSpaces = 32 - serviceLabel.length - serviceAmount.length;
    commands += serviceLabel + ' '.repeat(Math.max(1, serviceSpaces)) + serviceAmount + '\n';
    
    commands += '='.repeat(32) + '\n';
    
    // Total
    const totalLabel = 'TOTAL:';
    const totalAmount = `C${order.total?.toLocaleString('es-CR') || '0'}`;
    const totalSpaces = 32 - totalLabel.length - totalAmount.length;
    commands += ESC_POS.BOLD_ON;
    commands += totalLabel + ' '.repeat(Math.max(1, totalSpaces)) + totalAmount + '\n';
    commands += ESC_POS.BOLD_OFF;
    
    commands += '='.repeat(32) + '\n';
    commands += ESC_POS.LINE_FEED;

    console.log('💳 [PRINTER] Info pago (32 chars format)...');
    
    // Información de pago
    commands += ESC_POS.BOLD_ON;
    commands += 'PAGO\n';
    commands += ESC_POS.BOLD_OFF;
    commands += '-'.repeat(32) + '\n';
    
    const methodText = payment.method === 'cash' ? 'Efectivo' : 'Tarjeta';
    const currencySymbol = payment.currency === 'USD' ? '$' : 'C'; // FIXED: Completed the ternary operator
    
    commands += `Metodo: ${methodText} (${payment.currency})\n`;
    
    const amountLabel = 'Monto:';
    const amountValue = `${currencySymbol}${payment.amount?.toLocaleString('es-CR') || '0'}`;
    const amountSpaces = 32 - amountLabel.length - amountValue.length;
    commands += amountLabel + ' '.repeat(Math.max(1, amountSpaces)) + amountValue + '\n';
    
    if (payment.method === 'cash' && payment.received && payment.change !== undefined) {
      const receivedLabel = 'Recibido:';
      const receivedValue = `${currencySymbol}${payment.received.toLocaleString('es-CR')}`;
      const receivedSpaces = 32 - receivedLabel.length - receivedValue.length;
      commands += receivedLabel + ' '.repeat(Math.max(1, receivedSpaces)) + receivedValue + '\n';
      
      if (payment.change > 0) {
        const changeLabel = 'Cambio:';
        const changeValue = `${currencySymbol}${payment.change.toLocaleString('es-CR')}`;
        const changeSpaces = 32 - changeLabel.length - changeValue.length;
        commands += ESC_POS.BOLD_ON;
        commands += changeLabel + ' '.repeat(Math.max(1, changeSpaces)) + changeValue + '\n';
        commands += ESC_POS.BOLD_OFF;
      }
    }
    
    commands += ESC_POS.LINE_FEED;

    // Footer centrado
    commands += ESC_POS.ALIGN_CENTER;
    commands += 'Gracias por su visita!\n';
    commands += 'Vuelva pronto\n';
    commands += ESC_POS.LINE_FEED;
    commands += ESC_POS.LINE_FEED;

    // MPR-300 specific: Ajustar line spacing
    commands += '\x1B\x33' + String.fromCharCode(Math.floor(3.75 * 8)); // 3.75mm spacing

    // Cortar papel con comando específico MPR-300
    if (settings.cutPaper) {
      console.log('✂️ [PRINTER] Comando corte MPR-300');
      commands += ESC_POS.PAPER_CUT;
    }

    // MPR-300: Cash drawer si está habilitado
    if (settings.cashDrawer) {
      console.log('💰 [PRINTER] Apertura cajón MPR-300');
      commands += ESC_POS.CASH_DRAWER;
    }

    // ENCODING OPTIMIZADO: Limpiar todo el string antes de convertir a bytes
    const cleanCommands = cleanTextForPrinter(commands);
    const commandsArray = new Uint8Array(cleanCommands.length);
    for (let i = 0; i < cleanCommands.length; i++) {
      commandsArray[i] = cleanCommands.charCodeAt(i);
    }
    
    console.log(`📤 [PRINTER] Comandos MPR-300: ${commandsArray.length} bytes`);
    console.log(`📏 [PRINTER] Optimizado para 32 chars/línea @ 72mm`);
    console.log(`🔧 [PRINTER] Encoding limpiado - ₡ → C, acentos removidos`);
    
    // DEBUG: Preview del recibo generado
    console.log('📄 [DEBUG] Preview del recibo (primeros 200 chars):');
    console.log(cleanCommands.substring(0, 200).replace(/\x1B/g, '[ESC]').replace(/\x1D/g, '[GS]').replace(/\x0A/g, '[LF]\n'));
    
    return commandsArray;
  }, [cleanTextForPrinter]);

  // Imprimir recibo
  const printReceipt = useCallback(async (
    printerId: string, 
    receiptData: ReceiptData
  ): Promise<boolean> => {
    console.log(`🖨️ [PRINTER] Iniciando impresión en: ${printerId}`);
    
    const printer = connectedPrinters.find(p => p.id === printerId && p.connected);
    if (!printer?.characteristic) {
      const error = 'Impresora no conectada o característica no disponible';
      console.error('❌ [PRINTER]', error);
      setLastError(error);
      return false;
    }

    setIsPrinting(true);
    setLastError(null);

    try {
      console.log('📝 [PRINTER] Generando datos del recibo...');
      const commands = generateReceiptCommands(receiptData);
      
      console.log('📤 [PRINTER] Enviando comandos a la impresora...');
      console.log(`   Tamaño: ${commands.length} bytes`);
      console.log(`   Primeros 50 bytes:`, Array.from(commands.slice(0, 50)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));
      
      // DEBUG: Información de la característica
      console.log('🔌 [DEBUG] Printer characteristic details:', {
        uuid: printer.characteristic.uuid,
        writeWithoutResponse: printer.characteristic.properties.writeWithoutResponse,
        write: printer.characteristic.properties.write,
        notify: printer.characteristic.properties.notify
      });
      
      // Enviar comandos por chunks optimizados para MPR-300
      const CHUNK_SIZE = 20; // 20 bytes - balance entre velocidad y compatibilidad
      console.log(`🔧 [PRINTER] Usando chunks de ${CHUNK_SIZE} bytes para MPR-300`);
      
      for (let i = 0; i < commands.length; i += CHUNK_SIZE) {
        const chunk = commands.slice(i, i + CHUNK_SIZE);
        const chunkNum = Math.floor(i/CHUNK_SIZE) + 1;
        const totalChunks = Math.ceil(commands.length/CHUNK_SIZE);
        
        console.log(`📦 [PRINTER] Enviando chunk ${chunkNum}/${totalChunks}: bytes ${i}-${i+chunk.length-1} (${chunk.length} bytes)`);
        
        try {
          await printer.characteristic.writeValue(chunk);
          console.log(`✅ [PRINTER] Chunk ${chunkNum} enviado exitosamente`);
        } catch (chunkError: any) {
          console.error(`❌ [PRINTER] Error enviando chunk ${chunkNum}:`, chunkError);
          throw chunkError;
        }
        
        // Pausa corta entre chunks para MPR-300
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Log de progreso cada 10 chunks
        if (chunkNum > 0 && chunkNum % 10 === 0) {
          console.log(`📊 [PRINTER] Progreso: ${i}/${commands.length} bytes (${Math.round(i/commands.length*100)}%)`);
        }
      }
      
      console.log('🎉 [PRINTER] Impresión enviada exitosamente!');
      return true;

    } catch (error: any) {
      console.error('❌ [PRINTER] Error imprimiendo:', error);
      setLastError(`Error de impresión: ${error.message}`);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [connectedPrinters, generateReceiptCommands]);

  // Función helper para crear datos de recibo desde orden y pago
  const createReceiptData = useCallback((
    order: any, 
    payment: any, 
    table: any,
    companyInfo?: CompanyInfo
  ): ReceiptData => {
    console.log('📋 [PRINTER] Creando datos de recibo...');
    
    const company = companyInfo || {
      name: 'Soda Fischer',
      phone: '+506 8787 6138',
      address: '27 de Abril Santa Cruz Guanacaste',
      taxId: '',
      email: '',
      website: ''
    };

    const receiptData: ReceiptData = {
      company,
      order,
      payment,
      receiptNumber: `${Date.now().toString().slice(-6)}`,
      timestamp: new Date(),
      settings: defaultSettings
    };

    console.log('📋 [PRINTER] Datos de recibo creados:', {
      receiptNumber: receiptData.receiptNumber,
      orderItems: order.items?.length || 0,
      total: order.total,
      paymentMethod: payment.method
    });

    return receiptData;
  }, [defaultSettings]);

  return {
    // Estado
    connectedPrinters,
    isScanning,
    isPrinting,
    lastError,
    
    // Funciones
    checkBluetoothSupport,
    scanForPrinters,
    connectToPrinter,
    disconnectPrinter,
    printReceipt,
    createReceiptData,
    
    // Utilidades
    clearError: () => setLastError(null)
  };
};