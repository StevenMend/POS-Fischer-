// 🔥 SISTEMA DE ALMACENAMIENTO UNIFICADO - VERSIÓN 2.0

// 🗂️ KEYS UNIFICADAS - Todo en Restaurant Data
const STORAGE_KEYS = {
  // 🏠 DATOS PRINCIPALES - TODO EN UNO
  RESTAURANT_DATA: 'fischer_pos_restaurant_data', // ✅ Incluye: tables, orders, menu, cashRegister, payments, expenses
  
  // 📊 HISTORIALES SEPARADOS (solo lectura/escritura de cierres)
  CLOSURE_HISTORY: 'fischer_closure_history',    // ✅ Historial de cierres diarios
  
  // ⚙️ CONFIGURACIONES
  SETTINGS: 'fischer_pos_settings',               // ✅ Configuraciones generales
  
  // 🗑️ DEPRECATED - Ya no se usan (para limpiar si existen)
  LEGACY_EXPENSES: 'fischer_expenses',            // ❌ ELIMINAR - expenses ahora van en RESTAURANT_DATA
  LEGACY_CASH_REGISTER: 'fischer_pos_cash_register', // ❌ ELIMINAR - cashRegister ahora va en RESTAURANT_DATA
  LEGACY_DAILY_SUMMARY: 'fischer_pos_daily_summary', // ❌ ELIMINAR - no se usa
  LEGACY_MENU_ITEMS: 'fischer_pos_menu_items'    // ❌ ELIMINAR - menu ahora va en RESTAURANT_DATA
} as const;

// 🧹 MIGRACIÓN AUTOMÁTICA - Limpiar keys obsoletas
export const cleanLegacyStorage = (): void => {
  console.log('🧹 Limpiando storage obsoleto...');
  
  try {
    // Eliminar keys que ya no se usan
    localStorage.removeItem(STORAGE_KEYS.LEGACY_EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_CASH_REGISTER);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_DAILY_SUMMARY);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_MENU_ITEMS);
    
    console.log('✅ Storage legacy limpiado');
  } catch (error) {
    console.error('❌ Error limpiando storage legacy:', error);
  }
};

// 💾 GUARDAR datos en localStorage
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    
    // Log solo para datos principales (no spam de closure history)
    if (key === STORAGE_KEYS.RESTAURANT_DATA) {
      console.log('💾 Datos principales guardados exitosamente');
    }
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
    throw new Error(`Failed to save data to ${key}`);
  }
};

// 📂 CARGAR datos desde localStorage
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    
    const parsedData = JSON.parse(serializedData);
    
    // Log solo para datos principales
    if (key === STORAGE_KEYS.RESTAURANT_DATA && parsedData) {
      console.log('📂 Datos principales cargados desde localStorage');
    }
    
    return parsedData;
  } catch (error) {
    console.error('❌ Error loading from localStorage:', error);
    return defaultValue;
  }
};

// 🗑️ ELIMINAR datos específicos del localStorage
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
    console.log(`🗑️ Eliminado: ${key}`);
  } catch (error) {
    console.error('❌ Error removing from localStorage:', error);
  }
};

// 🧹 LIMPIAR todo el almacenamiento (RESET TOTAL)
export const clearAllStorage = (): void => {
  console.log('🧹 LIMPIEZA TOTAL del localStorage...');
  
  try {
    // Limpiar datos principales
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('✅ Todo el storage limpiado');
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
  }
};

// 🔄 AUTO-SAVE con debounce (para performance)
let saveTimeout: NodeJS.Timeout;

export const autoSave = <T>(key: string, data: T, delay: number = 1000): void => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveToStorage(key, data);
  }, delay);
};

// 📊 UTILIDADES ESPECÍFICAS PARA EL SISTEMA

// 💰 Guardar registro de cierre (método específico)
export const saveClosureRecord = (record: any): void => {
  try {
    const existingHistory = loadFromStorage(STORAGE_KEYS.CLOSURE_HISTORY, []);
    existingHistory.push(record);
    saveToStorage(STORAGE_KEYS.CLOSURE_HISTORY, existingHistory);
    console.log('💰 Registro de cierre guardado:', record.id);
  } catch (error) {
    console.error('❌ Error guardando cierre:', error);
    throw new Error('Failed to save closure record');
  }
};

// 📋 Cargar historial de cierres
export const loadClosureHistory = (): any[] => {
  return loadFromStorage(STORAGE_KEYS.CLOSURE_HISTORY, []);
};

// 📈 Obtener estadísticas de storage
export const getStorageStats = (): {
  restaurantDataSize: number;
  closureHistorySize: number;
  totalKeys: number;
  usedSpace: string;
} => {
  try {
    const restaurantData = localStorage.getItem(STORAGE_KEYS.RESTAURANT_DATA);
    const closureHistory = localStorage.getItem(STORAGE_KEYS.CLOSURE_HISTORY);
    
    const restaurantDataSize = restaurantData ? new Blob([restaurantData]).size : 0;
    const closureHistorySize = closureHistory ? new Blob([closureHistory]).size : 0;
    const totalKeys = localStorage.length;
    
    // Calcular espacio total usado (aproximado)
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([key + value]).size;
        }
      }
    }
    
    const usedSpace = totalSize < 1024 
      ? `${totalSize} bytes`
      : totalSize < 1024 * 1024 
        ? `${(totalSize / 1024).toFixed(1)} KB`
        : `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
    
    return {
      restaurantDataSize,
      closureHistorySize,
      totalKeys,
      usedSpace
    };
  } catch (error) {
    console.error('Error calculating storage stats:', error);
    return {
      restaurantDataSize: 0,
      closureHistorySize: 0,
      totalKeys: 0,
      usedSpace: '0 bytes'
    };
  }
};

// 🛠️ MIGRACIÓN DE DATOS (ejecutar una vez al cargar la app)
export const migrateDataIfNeeded = (): void => {
  console.log('🔄 Verificando si necesita migración...');
  
  try {
    // Verificar si existen expenses en el formato legacy
    const legacyExpenses = localStorage.getItem(STORAGE_KEYS.LEGACY_EXPENSES);
    
    if (legacyExpenses) {
      console.log('🔄 Detectados expenses en formato legacy, migrando...');
      
      // Cargar datos actuales del restaurant
      const restaurantData = loadFromStorage(STORAGE_KEYS.RESTAURANT_DATA, null);
      
      if (restaurantData && !restaurantData.expenses) {
        // Migrar expenses al formato nuevo
        const parsedExpenses = JSON.parse(legacyExpenses);
        restaurantData.expenses = parsedExpenses;
        
        // Guardar datos migrados
        saveToStorage(STORAGE_KEYS.RESTAURANT_DATA, restaurantData);
        
        console.log('✅ Expenses migrados exitosamente');
      }
    }
    
    // Limpiar datos legacy después de migrar
    cleanLegacyStorage();
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  }
};

// 🔒 BACKUP Y RESTORE

// 💾 Crear backup completo
export const createBackup = (): string => {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      data: {
        restaurant: loadFromStorage(STORAGE_KEYS.RESTAURANT_DATA, null),
        closureHistory: loadFromStorage(STORAGE_KEYS.CLOSURE_HISTORY, []),
        settings: loadFromStorage(STORAGE_KEYS.SETTINGS, {})
      }
    };
    
    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error('❌ Error creando backup:', error);
    throw new Error('Failed to create backup');
  }
};

// 📥 Restaurar desde backup
export const restoreFromBackup = (backupData: string): void => {
  try {
    const backup = JSON.parse(backupData);
    
    if (backup.data) {
      if (backup.data.restaurant) {
        saveToStorage(STORAGE_KEYS.RESTAURANT_DATA, backup.data.restaurant);
      }
      if (backup.data.closureHistory) {
        saveToStorage(STORAGE_KEYS.CLOSURE_HISTORY, backup.data.closureHistory);
      }
      if (backup.data.settings) {
        saveToStorage(STORAGE_KEYS.SETTINGS, backup.data.settings);
      }
      
      console.log('✅ Backup restaurado exitosamente');
    }
  } catch (error) {
    console.error('❌ Error restaurando backup:', error);
    throw new Error('Failed to restore backup');
  }
};

// 🧹 FUNCIÓN DE LIMPIEZA PARA DESARROLLO
export const devCleanAll = (): void => {
  console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE DESARROLLO...');
  
  try {
    // 1. Limpiar todas las keys de Fischer
    const allKeys = Object.keys(localStorage);
    let cleanedCount = 0;
    
    allKeys.forEach(key => {
      if (key.toLowerCase().includes('fischer')) {
        localStorage.removeItem(key);
        console.log(`🗑️ Eliminado: ${key}`);
        cleanedCount++;
      }
    });
    
    // 2. Limpiar keys específicas que podrían quedar
    const additionalKeys = [
      'restaurant_data',
      'closure_history',
      'pos_data',
      'expenses_data'
    ];
    
    additionalKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🗑️ Eliminado extra: ${key}`);
        cleanedCount++;
      }
    });
    
    console.log(`✅ LIMPIEZA COMPLETA - ${cleanedCount} items eliminados`);
    console.log('🔄 Sistema listo para empezar limpio');
    
    // 3. Recargar página para estado fresco
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
  }
};

// 🎯 EXPORTAR todo lo necesario
export { STORAGE_KEYS };

// 🚀 INICIALIZACIÓN AUTOMÁTICA
// Ejecutar migración al importar este módulo
migrateDataIfNeeded();

// 🛠️ EXPONER FUNCIÓN DE LIMPIEZA PARA DESARROLLO
// Solo en desarrollo, exponer función global para limpiar
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).devCleanAll = devCleanAll;
  console.log('🛠️ Función de desarrollo disponible: devCleanAll()');
}