// Sistema de envío de reportes por email
export interface EmailReport {
  to: string;
  subject: string;
  body: string;
  attachments?: string[];
}

// Generar reporte diario en formato texto
export const generateDailyReport = (data: {
  date: string;
  totalSales: number;
  totalOrders: number;
  cashCRC: number;
  cashUSD: number;
  cardCRC: number;
  cardUSD: number;
}): string => {
  return `
REPORTE DIARIO - RESTAURANTE FISCHER
=====================================
Fecha: ${data.date}

RESUMEN DE VENTAS:
- Total de Órdenes: ${data.totalOrders}
- Venta Total: ₡${data.totalSales.toLocaleString('es-CR')}

MÉTODOS DE PAGO:
- Efectivo CRC: ₡${data.cashCRC.toLocaleString('es-CR')}
- Efectivo USD: $${data.cashUSD.toFixed(2)}
- Tarjeta CRC: ₡${data.cardCRC.toLocaleString('es-CR')}
- Tarjeta USD: $${data.cardUSD.toFixed(2)}

PROMEDIO POR ORDEN: ₡${Math.round(data.totalSales / data.totalOrders).toLocaleString('es-CR')}

=====================================
Generado automáticamente por Sistema POS Fischer
  `;
};

// Simular envío de email (en producción se conectaría a un servicio real)
export const sendEmailReport = async (report: EmailReport): Promise<boolean> => {
  try {
    // En un entorno real, aquí se conectaría a un servicio de email
    // como SendGrid, Mailgun, o el servicio SMTP del restaurante
    console.log('📧 Enviando reporte por email...');
    console.log('Para:', report.to);
    console.log('Asunto:', report.subject);
    console.log('Contenido:', report.body);
    
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular éxito (en producción manejaría errores reales)
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
};

// Configuración de email por defecto
export const DEFAULT_EMAIL_CONFIG = {
  adminEmail: 'admin@fischer.com',
  reportSubject: 'Reporte Diario - Restaurante Fischer',
  backupEmail: 'backup@fischer.com'
};