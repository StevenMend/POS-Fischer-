// Sistema de almacenamiento local
const STORAGE_KEYS = {
  RESTAURANT_DATA: 'fischer_pos_restaurant_data',
  CASH_REGISTER: 'fischer_pos_cash_register',
  DAILY_SUMMARY: 'fischer_pos_daily_summary',
  MENU_ITEMS: 'fischer_pos_menu_items',
  SETTINGS: 'fischer_pos_settings'
} as const;

// Guardar datos en localStorage
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Cargar datos desde localStorage
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

// Eliminar datos del localStorage
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Limpiar todo el almacenamiento
export const clearAllStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// Auto-save con debounce
let saveTimeout: NodeJS.Timeout;

export const autoSave = <T>(key: string, data: T, delay: number = 1000): void => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveToStorage(key, data);
  }, delay);
};

// Exportar las claves para uso en otros módulos
export { STORAGE_KEYS };