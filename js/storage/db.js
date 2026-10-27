/**
 * Fichas ATM - Adaptador de Almacenamiento Local-First (IndexedDB con fallback a LocalStorage)
 * Persiste historias clínicas y configuración del profesional directamente en el navegador del cliente.
 * Sin dependencias externas ni conexión a servidor.
 */

import { coerceFicha } from "../core/ficha-rules.mjs";

const DB_NAME = "fichas_atm_db";
const DB_VERSION = 1;
const LS_FICHAS_KEY = "fichas_atm_local_store";
const LS_SETTINGS_KEY = "fichas_atm_settings_store";

let dbInstance = null;
let useLocalStorageFallback = false;

/**
 * Inicializa y devuelve la conexión a IndexedDB o activa el fallback a LocalStorage.
 * @returns {Promise<IDBDatabase|null>}
 */
export function initDb() {
  if (useLocalStorageFallback) return Promise.resolve(null);
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") {
        console.warn("IndexedDB no disponible, activando LocalStorage");
        useLocalStorageFallback = true;
        return resolve(null);
      }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = req.result;

        if (!db.objectStoreNames.contains("fichas")) {
          const store = db.createObjectStore("fichas", { keyPath: "id" });
          store.createIndex("dni", "dni", { unique: false });
          store.createIndex("fechaSesion", "fechaSesion", { unique: false });
          store.createIndex("nombre", "nombre", { unique: false });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
      };

      req.onsuccess = () => {
        dbInstance = req.result;
        resolve(dbInstance);
      };

      req.onerror = () => {
        console.warn("Error al abrir IndexedDB, usando LocalStorage como respaldo");
        useLocalStorageFallback = true;
        resolve(null);
      };

      req.onblocked = () => {
        console.warn("IndexedDB bloqueado, usando LocalStorage");
        useLocalStorageFallback = true;
        resolve(null);
      };
    } catch (err) {
      console.warn("Excepción al acceder a IndexedDB, usando LocalStorage:", err);
      useLocalStorageFallback = true;
      resolve(null);
    }
  });
}

function lsGetFichas() {
  try {
    const raw = localStorage.getItem(LS_FICHAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function lsSetFichas(list) {
  try {
    localStorage.setItem(LS_FICHAS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Error guardando en LocalStorage:", err);
  }
}

function lsGetSettings() {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function lsSetSettings(obj) {
  try {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(obj));
  } catch (err) {
    console.error("Error guardando settings en LocalStorage:", err);
  }
}

/**
 * Guarda o actualiza una ficha.
 * @param {object} rawFicha
 * @returns {Promise<object>} Ficha guardada normalizada
 */
export async function saveFicha(rawFicha) {
  const db = await initDb();
  const ficha = coerceFicha(rawFicha);

  if (!ficha.id) {
    ficha.id = `ficha_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  ficha.updatedAt = new Date().toISOString();

  if (useLocalStorageFallback || !db) {
    const list = lsGetFichas();
    const idx = list.findIndex((f) => f.id === ficha.id);
    if (idx >= 0) list[idx] = ficha;
    else list.push(ficha);
    lsSetFichas(list);
    return ficha;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction("fichas", "readwrite");
    const store = tx.objectStore("fichas");
    const req = store.put(ficha);

    req.onsuccess = () => resolve(ficha);
    req.onerror = () => reject(req.error || new Error("Error al guardar la ficha"));
  });
}

/**
 * Obtiene una ficha por su ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getFicha(id) {
  const db = await initDb();

  if (useLocalStorageFallback || !db) {
    const list = lsGetFichas();
    const found = list.find((f) => f.id === id);
    return found ? coerceFicha(found) : null;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction("fichas", "readonly");
    const store = tx.objectStore("fichas");
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result ? coerceFicha(req.result) : null);
    req.onerror = () => reject(req.error || new Error("Error al leer la ficha"));
  });
}

/**
 * Lista todas las fichas registradas, ordenadas cronológicamente (más recientes primero).
 * @returns {Promise<Array<object>>}
 */
export async function listFichas() {
  const db = await initDb();

  if (useLocalStorageFallback || !db) {
    const list = lsGetFichas().map(coerceFicha);
    list.sort((a, b) => {
      const dateA = a.fechaSesion || a.updatedAt || "";
      const dateB = b.fechaSesion || b.updatedAt || "";
      return dateB.localeCompare(dateA);
    });
    return list;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction("fichas", "readonly");
    const store = tx.objectStore("fichas");
    const req = store.getAll();

    req.onsuccess = () => {
      const list = (req.result || []).map(coerceFicha);
      list.sort((a, b) => {
        const dateA = a.fechaSesion || a.updatedAt || "";
        const dateB = b.fechaSesion || b.updatedAt || "";
        return dateB.localeCompare(dateA);
      });
      resolve(list);
    };
    req.onerror = () => reject(req.error || new Error("Error al listar las fichas"));
  });
}

/**
 * Elimina una ficha por su ID.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteFicha(id) {
  const db = await initDb();

  if (useLocalStorageFallback || !db) {
    const list = lsGetFichas().filter((f) => f.id !== id);
    lsSetFichas(list);
    return true;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction("fichas", "readwrite");
    const store = tx.objectStore("fichas");
    const req = store.delete(id);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error || new Error("Error al eliminar la ficha"));
  });
}

/**
 * Guarda un valor en la configuración del usuario (perfil profesional, firma, etc.).
 * @param {string} key
 * @param {any} value
 * @returns {Promise<void>}
 */
export async function saveSetting(key, value) {
  const db = await initDb();

  if (useLocalStorageFallback || !db) {
    const settings = lsGetSettings();
    settings[key] = { key, value, updatedAt: new Date().toISOString() };
    lsSetSettings(settings);
    return;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    const store = tx.objectStore("settings");
    const req = store.put({ key, value, updatedAt: new Date().toISOString() });

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error("Error al guardar la configuración"));
  });
}

/**
 * Obtiene un valor de la configuración.
 * @param {string} key
 * @param {any} defaultValue
 * @returns {Promise<any>}
 */
export async function getSetting(key, defaultValue = null) {
  const db = await initDb();

  if (useLocalStorageFallback || !db) {
    const settings = lsGetSettings();
    if (settings[key] && typeof settings[key].value !== "undefined") {
      return settings[key].value;
    }
    return defaultValue;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const store = tx.objectStore("settings");
    const req = store.get(key);

    req.onsuccess = () => {
      if (req.result && typeof req.result.value !== "undefined") {
        resolve(req.result.value);
      } else {
        resolve(defaultValue);
      }
    };
    req.onerror = () => reject(req.error || new Error("Error al obtener la configuración"));
  });
}

export function sanitizeFilename(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40) || "ficha";
}

export function downloadJsonFile(filename, data) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta una sola ficha clínica individual en archivo JSON.
 */
export async function exportSingleFicha(ficha) {
  if (!ficha) return;
  const nameSlug = sanitizeFilename(ficha.nombre || "paciente");
  const dateStr = ficha.fechaSesion ? ficha.fechaSesion.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const filename = `ficha-atm_${nameSlug}_${dateStr}.json`;

  const payload = {
    app: "Fichas-ATM",
    tipo: "ficha_individual",
    version: 1,
    exportedAt: new Date().toISOString(),
    paciente: ficha.nombre || "Sin nombre",
    totalFichas: 1,
    fichas: [ficha],
    ...ficha,
  };

  downloadJsonFile(filename, payload);
}

/**
 * Exporta todas las fichas de un paciente específico en archivo JSON.
 */
export async function exportPatientFichas(patientName, sessions) {
  if (!Array.isArray(sessions) || !sessions.length) return;
  const nameSlug = sanitizeFilename(patientName || sessions[0]?.nombre || "paciente");
  const filename = `fichas-atm_${nameSlug}_${sessions.length}_sesiones.json`;

  const payload = {
    app: "Fichas-ATM",
    tipo: "paciente",
    version: 1,
    exportedAt: new Date().toISOString(),
    paciente: patientName || sessions[0]?.nombre || "Sin nombre",
    totalFichas: sessions.length,
    fichas: sessions,
  };

  downloadJsonFile(filename, payload);
}

/**
 * Exporta un grupo de fichas seleccionadas o filtradas en archivo JSON.
 */
export async function exportGroupFichas(fichas, label = "seleccion") {
  if (!Array.isArray(fichas) || !fichas.length) return;
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `fichas-atm_${sanitizeFilename(label)}_${fichas.length}_fichas_${dateStr}.json`;

  const payload = {
    app: "Fichas-ATM",
    tipo: "grupo_fichas",
    version: 1,
    exportedAt: new Date().toISOString(),
    totalFichas: fichas.length,
    fichas,
  };

  downloadJsonFile(filename, payload);
}

/**
 * Exporta un respaldo íntegro en archivo JSON descargable con todas las fichas y datos del profesional.
 */
export async function exportBackup() {
  const [fichas, clinician] = await Promise.all([
    listFichas(),
    getSetting("clinician", null),
  ]);

  const payload = {
    app: "Fichas-ATM",
    tipo: "respaldo_completo",
    version: 1,
    exportedAt: new Date().toISOString(),
    clinician,
    totalFichas: fichas.length,
    fichas,
  };

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadJsonFile(`backup-fichas-atm-${dateStr}.json`, payload);
}

/**
 * Importa fichas desde un archivo o cadena JSON de respaldo.
 * @param {string|File} source
 * @returns {Promise<{ importedCount: number, clinicianImported: boolean }>}
 */
export async function importBackup(source) {
  let content = "";
  if (typeof source === "string") {
    content = source;
  } else if (source instanceof Blob || source instanceof File) {
    content = await source.text();
  } else {
    throw new Error("Fuente de datos de importación no válida");
  }

  const parsed = JSON.parse(content);
  let rawFichas = [];

  if (Array.isArray(parsed)) {
    rawFichas = parsed;
  } else if (parsed && Array.isArray(parsed.fichas)) {
    rawFichas = parsed.fichas;
  } else if (parsed && typeof parsed === "object" && (parsed.paciente || parsed.nombre || parsed.id || parsed.fechaSesion)) {
    rawFichas = [parsed];
  } else {
    throw new Error("El archivo no tiene un formato válido de fichas de ATM");
  }

  const db = await initDb();
  let importedCount = 0;

  if (useLocalStorageFallback || !db) {
    const current = lsGetFichas();
    const map = new Map(current.map((f) => [f.id, f]));
    for (const item of rawFichas) {
      if (!item || typeof item !== "object") continue;
      const coerced = coerceFicha(item);
      if (!coerced.id) {
        coerced.id = `ficha_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      }
      if (!coerced.updatedAt) coerced.updatedAt = new Date().toISOString();
      map.set(coerced.id, coerced);
      importedCount++;
    }
    lsSetFichas([...map.values()]);
  } else {
    await new Promise((resolve, reject) => {
      const tx = db.transaction("fichas", "readwrite");
      const store = tx.objectStore("fichas");

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Error durante la importación"));

      for (const item of rawFichas) {
        if (!item || typeof item !== "object") continue;
        const coerced = coerceFicha(item);
        if (!coerced.id) {
          coerced.id = `ficha_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        }
        if (!coerced.updatedAt) coerced.updatedAt = new Date().toISOString();
        store.put(coerced);
        importedCount++;
      }
    });
  }

  let clinicianImported = false;
  if (parsed.clinician && typeof parsed.clinician === "object") {
    await saveSetting("clinician", parsed.clinician);
    clinicianImported = true;
  }

  return { importedCount, clinicianImported };
}
