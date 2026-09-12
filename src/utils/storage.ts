// Safe Storage Utilities that never throw exceptions

export function safeGetLocalStorage(key: string): string | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch (e) {
    console.warn(`Failed to read localStorage key "${key}":`, e);
    return null;
  }
}

export function safeSetLocalStorage(key: string, value: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to write localStorage key "${key}":`, e);
  }
}

export function safeRemoveLocalStorage(key: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Failed to remove localStorage key "${key}":`, e);
  }
}

export function safeGetSessionStorage(key: string): string | null {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return null;
    return window.sessionStorage.getItem(key);
  } catch (e) {
    console.warn(`Failed to read sessionStorage key "${key}":`, e);
    return null;
  }
}

export function safeSetSessionStorage(key: string, value: string): void {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    window.sessionStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to write sessionStorage key "${key}":`, e);
  }
}
