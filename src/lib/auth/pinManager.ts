// Sistema simple de gestión de PIN administrativo
// Sin sobre-ingeniería: localStorage con hash básico

const PIN_STORAGE_KEY = 'fischer_admin_pin';
const PIN_ATTEMPTS_KEY = 'fischer_pin_attempts';
const PIN_LOCKOUT_KEY = 'fischer_pin_lockout';

// Hash simple (en producción real, usar bcrypt en backend)
const simpleHash = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
};

// Configuración del PIN por primera vez
export const setupPin = (pin: string): void => {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('El PIN debe ser de 4 dígitos numéricos');
  }
  
  const hashed = simpleHash(pin);
  localStorage.setItem(PIN_STORAGE_KEY, hashed);
  console.log('✅ PIN configurado exitosamente');
};

// Verificar si existe un PIN configurado
export const hasPinConfigured = (): boolean => {
  return localStorage.getItem(PIN_STORAGE_KEY) !== null;
};

// Verificar si el sistema está bloqueado
export const isLocked = (): boolean => {
  const lockoutUntil = localStorage.getItem(PIN_LOCKOUT_KEY);
  if (!lockoutUntil) return false;
  
  const now = Date.now();
  const lockTime = parseInt(lockoutUntil, 10);
  
  if (now < lockTime) {
    const remainingMinutes = Math.ceil((lockTime - now) / 60000);
    console.warn(`⏱️ Sistema bloqueado por ${remainingMinutes} minutos más`);
    return true;
  }
  
  // Lockout expiró, limpiar
  localStorage.removeItem(PIN_LOCKOUT_KEY);
  localStorage.removeItem(PIN_ATTEMPTS_KEY);
  return false;
};

// Obtener intentos fallidos
export const getFailedAttempts = (): number => {
  const attempts = localStorage.getItem(PIN_ATTEMPTS_KEY);
  return attempts ? parseInt(attempts, 10) : 0;
};

// Verificar PIN
export const verifyPin = (pin: string): boolean => {
  if (isLocked()) {
    throw new Error('Sistema bloqueado. Intenta en 5 minutos.');
  }
  
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('PIN inválido. Debe ser de 4 dígitos.');
  }
  
  const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
  if (!storedHash) {
    throw new Error('No hay PIN configurado');
  }
  
  const inputHash = simpleHash(pin);
  const isCorrect = inputHash === storedHash;
  
  if (isCorrect) {
    // PIN correcto: resetear intentos
    localStorage.removeItem(PIN_ATTEMPTS_KEY);
    console.log('✅ PIN verificado correctamente');
    return true;
  } else {
    // PIN incorrecto: incrementar intentos
    const attempts = getFailedAttempts() + 1;
    localStorage.setItem(PIN_ATTEMPTS_KEY, attempts.toString());
    
    console.warn(`❌ PIN incorrecto. Intento ${attempts}/3`);
    
    if (attempts >= 3) {
      // Bloquear por 5 minutos
      const lockoutUntil = Date.now() + (5 * 60 * 1000);
      localStorage.setItem(PIN_LOCKOUT_KEY, lockoutUntil.toString());
      localStorage.removeItem(PIN_ATTEMPTS_KEY);
      
      console.error('🔒 Sistema bloqueado por 3 intentos fallidos');
      throw new Error('3 intentos fallidos. Sistema bloqueado por 5 minutos.');
    }
    
    return false;
  }
};

// Cambiar PIN (requiere PIN actual)
export const changePin = (currentPin: string, newPin: string): void => {
  if (!verifyPin(currentPin)) {
    throw new Error('PIN actual incorrecto');
  }
  
  setupPin(newPin);
  console.log('✅ PIN cambiado exitosamente');
};

// Reset PIN (solo para desarrollo/emergencia - llamar desde consola)
export const resetPin = (newPin: string = '1234'): void => {
  console.warn('⚠️ RESETEANDO PIN - Solo usar en emergencias');
  localStorage.removeItem(PIN_STORAGE_KEY);
  localStorage.removeItem(PIN_ATTEMPTS_KEY);
  localStorage.removeItem(PIN_LOCKOUT_KEY);
  setupPin(newPin);
  console.log('✅ PIN reseteado a:', newPin);
};

// Exponer resetPin globalmente para emergencias
if (typeof window !== 'undefined') {
  (window as any).resetAdminPin = resetPin;
}