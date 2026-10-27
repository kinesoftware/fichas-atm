export const REQUIRED_FIELDS = [
  ["nombre", "el nombre completo"],
  ["dni", "el DNI / Pasaporte"],
  ["fechaSesion", "la fecha de la sesión"],
  ["nacimiento", "la fecha de nacimiento"],
  ["edad", "la edad"],
  ["motivo", "el motivo de consulta"],
  ["antecedentes", "los antecedentes clínicos"],
];

export const CLINICIANS = {
  profesional: "Profesional",
};

export const CLINICIAN_DETAILS = {
  default: {
    nombre: "Profesional tratante",
    titulo: "Kinesiólogo/a - Fisioterapeuta",
    matricula: "",
    signatureFile: "",
  },
};

export function missingFieldKeys(data) {
  return REQUIRED_FIELDS
    .filter(([key]) => {
      if (key === "dni" && data?.sinDocumento) return false;
      return !String(data?.[key] ?? "").trim();
    })
    .map(([key]) => key);
}

export function missingFields(data) {
  return REQUIRED_FIELDS
    .filter(([key]) => {
      if (key === "dni" && data?.sinDocumento) return false;
      return !String(data?.[key] ?? "").trim();
    })
    .map(([, label]) => label);
}

/**
 * Valida tipos y rangos de un campo individual según las reglas clínicas de la ficha de ATM.
 * @param {string} key Nombre del campo
 * @param {*} value Valor a verificar
 * @param {object} [allData={}] Contexto completo de la ficha para correlaciones
 * @returns {string|null} Mensaje de error o null si es válido
 */
export function validateField(key, value, allData = {}) {
  const str = String(value ?? "").trim();

  switch (key) {
    case "edad": {
      if (!str) return "Falta completar la edad";
      if (!/^\d+$/.test(str)) {
        return "La edad no permite texto: debe ser un número entero entre 1 y 120";
      }
      const n = Number(str);
      if (!Number.isInteger(n) || n < 1 || n > 120) {
        return "La edad debe ser un número entero entre 1 y 120";
      }
      return null;
    }
    case "nombre": {
      if (!str) return "Falta completar el nombre completo";
      if (/\d/.test(str)) return "El nombre no puede contener números";
      if (str.length < 2) return "El nombre completo debe tener al menos 2 letras";
      return null;
    }
    case "dni": {
      if (allData?.sinDocumento) return null;
      if (!str) return "Falta completar el DNI / Pasaporte";
      const alphanum = str.replace(/[^a-zA-Z0-9]/g, "");
      if (alphanum.length < 3) return "El DNI / Pasaporte debe tener al menos 3 caracteres";
      return null;
    }
    case "fechaSesion": {
      if (!str) return "Falta completar la fecha de la sesión";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return "La fecha de la sesión debe ser válida (AAAA-MM-DD)";
      return null;
    }
    case "nacimiento": {
      if (!str) return "Falta completar la fecha de nacimiento";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return "La fecha de nacimiento debe ser válida (AAAA-MM-DD)";
      const session = String(allData.fechaSesion || "").slice(0, 10);
      if (session && /^\d{4}-\d{2}-\d{2}$/.test(session) && str > session) {
        return "La fecha de nacimiento no puede ser posterior a la fecha de la sesión";
      }
      return null;
    }
    case "lugarNac":
    case "anotaciones":
    case "fotoUrl":
    case "fotosUrls": {
      return null;
    }
    case "motivo": {
      if (!str) return "Falta seleccionar el motivo de consulta";
      return null;
    }
    case "antecedentes": {
      if (!str) return "Falta completar los antecedentes clínicos";
      return null;
    }
    case "aperturaLibre":
    case "aperturaDolor":
    case "aperturaLibrePost":
    case "aperturaDolorPost": {
      if (!str) return null;
      const clean = str.replace(",", ".");
      if (/[a-zA-Z]/.test(clean) || !/^\d+(\.\d+)?$/.test(clean)) {
        return "Este campo no permite texto: debe ser un número en milímetros";
      }
      const n = Number(clean);
      if (Number.isNaN(n) || n < 0 || n > 500) {
        return "El valor de apertura debe estar entre 0 y 500 mm";
      }
      return null;
    }
    case "protrusion":
    case "latIzq":
    case "latDer":
    case "protrusionPost":
    case "latIzqPost":
    case "latDerPost": {
      if (!str) return null;
      const clean = str.replace(",", ".");
      if (/[a-zA-Z]/.test(clean) || !/^\d+(\.\d+)?$/.test(clean)) {
        return "Este campo no permite texto: debe ser un número en milímetros";
      }
      const n = Number(clean);
      if (Number.isNaN(n) || n < 0 || n > 500) {
        return "El valor debe estar entre 0 y 500 mm";
      }
      return null;
    }
    case "ruidos":
    case "ruidosIzq":
    case "ruidosDer": {
      const isSi = str === "Sí" || allData.ruidos === "Sí";
      if (isSi && !allData.ruidosIzq && !allData.ruidosDer) {
        return "Debe indicar el lado (izquierdo y/o derecho) en los ruidos articulares";
      }
      return null;
    }
    case "dolorCondilar":
    case "condilarIzq":
    case "condilarDer": {
      const isSi = str === "Sí" || allData.dolorCondilar === "Sí";
      if (isSi && !allData.condilarIzq && !allData.condilarDer) {
        return "Debe indicar el lado (izquierdo y/o derecho) en el dolor condilar a la palpación";
      }
      return null;
    }
    case "desviacion":
    case "desvIzq":
    case "desvDer": {
      const isSi = str === "Sí" || allData.desviacion === "Sí";
      if (isSi && !allData.desvIzq && !allData.desvDer) {
        return "Debe indicar el lado (izquierdo y/o derecho) en la desviación lateral de la trayectoria";
      }
      return null;
    }
    case "desviacionPost":
    case "desvIzqPost":
    case "desvDerPost": {
      const isSi = str === "Sí" || allData.desviacionPost === "Sí";
      if (isSi && !allData.desvIzqPost && !allData.desvDerPost) {
        return "Debe indicar el lado (izquierdo y/o derecho) en la desviación lateral al finalizar la sesión";
      }
      return null;
    }
    case "eva": {
      if (value === "" || value === null || value === undefined) return null;
      const n = Number(value);
      if (Number.isNaN(n) || n < 0 || n > 10) return "La escala EVA debe ser un valor entre 0 y 10";
      return null;
    }
    default:
      return null;
  }
}

/**
 * Valida integralmente la ficha clínica y retorna mapa de errores y estado.
 * @param {object} data Datos de la ficha
 * @returns {{isValid: boolean, errors: Object<string, string>, errorList: string[], firstErrorKey: string|null, firstError: string|null}}
 */
export function validateFicha(data = {}) {
  data = data || {};
  const errors = {};
  const errorList = [];
  const fieldsToCheck = [
    "nombre",
    "dni",
    "fechaSesion",
    "nacimiento",
    "edad",
    "lugarNac",
    "motivo",
    "antecedentes",
    "ruidos",
    "dolorCondilar",
    "aperturaLibre",
    "aperturaDolor",
    "desviacion",
    "protrusion",
    "latIzq",
    "latDer",
    "aperturaLibrePost",
    "aperturaDolorPost",
    "desviacionPost",
    "protrusionPost",
    "latIzqPost",
    "latDerPost",
    "eva",
  ];

  for (const field of fieldsToCheck) {
    const err = validateField(field, data[field], data);
    if (err) {
      errors[field] = err;
      errorList.push(err);
    }
  }

  return {
    isValid: errorList.length === 0,
    errors,
    errorList,
    firstErrorKey: Object.keys(errors)[0] || null,
    firstError: errorList[0] || null,
  };
}

/**
 * Valida los campos correspondientes a un paso específico del formulario.
 * @param {number} stepNumber Número de paso (0 a 4)
 * @param {object} data Datos del formulario
 * @returns {{isValid: boolean, errors: Object<string, string>, errorList: string[], firstErrorKey: string|null, firstError: string|null}}
 */
export function validateStep(stepNumber, data = {}) {
  data = data || {};
  const stepFields = {
    0: ["nombre", "dni", "fechaSesion", "nacimiento", "edad", "motivo", "antecedentes"],
    1: [
      "ruidos",
      "dolorCondilar",
      "aperturaLibre",
      "aperturaDolor",
      "desviacion",
      "protrusion",
      "latIzq",
      "latDer",
      "aperturaLibrePost",
      "aperturaDolorPost",
      "desviacionPost",
      "protrusionPost",
      "latIzqPost",
      "latDerPost",
    ],
    2: [],
    3: ["eva"],
    4: [],
    5: ["anotaciones", "fotoUrl", "fotosUrls"],
  };
  const fields = stepFields[stepNumber] || [];
  const errors = {};
  const errorList = [];
  for (const f of fields) {
    const err = validateField(f, data[f], data);
    if (err) {
      errors[f] = err;
      errorList.push(err);
    }
  }
  return {
    isValid: errorList.length === 0,
    errors,
    errorList,
    firstErrorKey: Object.keys(errors)[0] || null,
    firstError: errorList[0] || null,
  };
}

export function normalizeDni(dni) {
  const digits = String(dni || "").replace(/\D/g, "");
  if (digits.length >= 4 && !/[a-zA-Z]/.test(String(dni || ""))) {
    return digits;
  }
  return String(dni || "").trim().toLowerCase();
}

export function stripAccents(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function matchFichaSearch(item, query) {
  const q = String(query || "").trim();
  if (!q) return true;

  const rawNombre = String(item?.nombre || "");
  const normNombre = stripAccents(rawNombre);
  const rawDni = String(item?.dni || "");
  const dniDigits = rawDni.replace(/\D/g, "");

  const normQ = stripAccents(q);
  // Coincidencia de texto continuo en nombre o DNI tal como se guardó
  if (normNombre.includes(normQ) || rawDni.toLowerCase().includes(normQ)) {
    return true;
  }

  // Búsqueda orientada a DNI: tolera puntos, espacios y guiones en el filtro o en el registro
  const qDigits = q.replace(/\D/g, "");
  if (/^[\d.\s-]+$/.test(q) && qDigits.length > 0) {
    return dniDigits.includes(qDigits);
  }

  // Búsqueda combinada por términos (ej: "Carolina 34.205" o "Méndez 34.205.109")
  const terms = q.split(/\s+/).filter(Boolean);
  return terms.every((term) => {
    const normTerm = stripAccents(term);
    if (normNombre.includes(normTerm)) return true;
    if (rawDni.toLowerCase().includes(normTerm)) return true;
    const termDigits = term.replace(/\D/g, "");
    if (termDigits.length > 0 && dniDigits.includes(termDigits)) {
      return true;
    }
    return false;
  });
}

export function patientKey(item) {
  const dni = normalizeDni(item?.dni);
  if (dni) return `doc:${dni}`;
  const nombre = String(item?.nombre || "").trim().toLowerCase();
  if (!nombre) return "";
  return `nombre:${nombre}`;
}

export function personNameKey(nombre) {
  return stripAccents(nombre).replace(/\s+/g, " ").trim();
}

/**
 * El documento ya está usado por otra persona si el nombre no coincide.
 * ownKey es la clave del paciente que se está editando: sus sesiones no cuentan.
 * @returns {object|null} Ficha existente en conflicto
 */
export function dniNameConflict(data, allFichas = [], ownKey = "") {
  const key = patientKey(data);
  if (!key.startsWith("doc:")) return null;
  const incoming = personNameKey(data?.nombre);
  if (!incoming) return null;
  const other = (allFichas || []).find((ficha) => {
    if (!ficha || ficha.id === data?.id) return false;
    if (ownKey && patientKey(ficha) === ownKey) return false;
    if (patientKey(ficha) !== key) return false;
    const name = personNameKey(ficha.nombre);
    return Boolean(name) && name !== incoming;
  });
  return other || null;
}

export function ownsFicha(item, username) {
  return (item?.profesional || "") === username;
}

function isRealDate([y, m, d]) {
  if (!y || !m || !d || m > 12 || d > 31) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function ageOn(nacimiento, onDate) {
  const birth = String(nacimiento || "").slice(0, 10).split("-").map(Number);
  const on = String(onDate || "").slice(0, 10).split("-").map(Number);
  if (birth.length !== 3 || on.length !== 3 || !isRealDate(birth) || !isRealDate(on)) return "";
  let age = on[0] - birth[0];
  if (on[1] < birth[1] || (on[1] === birth[1] && on[2] < birth[2])) age -= 1;
  return age >= 0 ? String(age) : "";
}

export const PATIENT_FIELDS = [
  "nombre",
  "dni",
  "nacimiento",
  "lugarNac",
  "motivo",
  "antecedentes",
  "habitoApretamiento",
  "habitoBruxismo",
  "habitoMasticacionUni",
  "habitoOnicofagia",
];

export function nextSession(item, fechaSesion) {
  const copy = emptyFicha();
  for (const key of PATIENT_FIELDS) copy[key] = item?.[key] ?? copy[key];
  copy.sinDocumento = Boolean(item?.sinDocumento);
  copy.fechaSesion = fechaSesion || "";
  copy.edad = ageOn(item?.nacimiento, fechaSesion);
  if (CLINICIANS[item?.profesional]) copy.profesional = item.profesional;
  return copy;
}

export function getUniquePatients(allFichas = []) {
  const map = new Map();
  for (const f of allFichas) {
    const key = patientKey(f);
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, {
        key,
        nombre: f.nombre || "Sin nombre",
        dni: f.dni || "",
        nacimiento: f.nacimiento || "",
        lugarNac: f.lugarNac || "",
        motivo: f.motivo || "",
        habitoApretamiento: Boolean(f.habitoApretamiento),
        habitoBruxismo: Boolean(f.habitoBruxismo),
        habitoMasticacionUni: Boolean(f.habitoMasticacionUni),
        habitoOnicofagia: Boolean(f.habitoOnicofagia),
        antecedentes: f.antecedentes || "",
        sessions: [f],
      });
    } else {
      const p = map.get(key);
      p.sessions.push(f);
      if (!p.nacimiento && f.nacimiento) p.nacimiento = f.nacimiento;
      if (!p.lugarNac && f.lugarNac) p.lugarNac = f.lugarNac;
      if (!p.motivo && f.motivo) p.motivo = f.motivo;
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
  );
}

export function getSessionIndex(item, allFichas = []) {
  if (!item) return 1;
  const key = patientKey(item);
  const pSessions = (allFichas || [])
    .filter((f) => patientKey(f) === key)
    .sort((a, b) => (a.fechaSesion || "").localeCompare(b.fechaSesion || ""));
  if (!pSessions.length) return 1;
  const idx = pSessions.findIndex((s) => s.id === item.id);
  if (idx >= 0) return idx + 1;
  return pSessions.length + 1;
}

export function formatSessionBadgeText(sessionIndex = 1, totalSessions = 1) {
  if (sessionIndex === 1 && totalSessions === 1) return "Evaluación inicial";
  return `Sesión N° ${sessionIndex}${totalSessions > 1 ? ` de ${totalSessions}` : ""}`;
}

export function shouldOmitInvariableFields(sessionIndex = 1, totalSessions = 1) {
  return totalSessions > 1 && sessionIndex > 1;
}

export function assignProfesional(username, previous, requested) {
  if (requested) return String(requested);
  if (previous) return String(previous);
  return username || "default";
}

export function emptyFicha() {
  return {
    nombre: "",
    dni: "",
    sinDocumento: false,
    fechaSesion: "",
    nacimiento: "",
    edad: "",
    lugarNac: "",
    anotaciones: "",
    fotoUrl: "",
    fotosUrls: [],
    motivo: "",
    // FEATURE-OPTIONAL: habitos-bruxismo
    habitoApretamiento: false,
    habitoBruxismo: false,
    habitoMasticacionUni: false,
    habitoOnicofagia: false,
    // /FEATURE-OPTIONAL: habitos-bruxismo
    antecedentes: "",
    ruidos: "",
    ruidosIzq: false,
    ruidosDer: false,
    faseApertura: false,
    faseCierre: false,
    // FEATURE-OPTIONAL: tipo-ruido
    ruidoClic: false,
    ruidoCrep: false,
    // /FEATURE-OPTIONAL: tipo-ruido
    dolorCondilar: "",
    condilarIzq: false,
    condilarDer: false,
    aperturaLibre: "",
    aperturaDolor: "",
    desviacion: "",
    desvIzq: false,
    desvDer: false,
    // FEATURE-OPTIONAL: patron-desviacion
    desvCorregida: false,
    deflexion: false,
    // /FEATURE-OPTIONAL: patron-desviacion
    protrusion: "",
    latIzq: "",
    latDer: "",
    aperturaLibrePost: "",
    aperturaDolorPost: "",
    desviacionPost: "",
    desvIzqPost: false,
    desvDerPost: false,
    // FEATURE-OPTIONAL: patron-desviacion
    desvCorregidaPost: false,
    deflexionPost: false,
    // /FEATURE-OPTIONAL: patron-desviacion
    protrusionPost: "",
    latIzqPost: "",
    latDerPost: "",
    maseteroIzq: false,
    maseteroDer: false,
    temporalIzq: false,
    temporalDer: false,
    pterMedIzq: false,
    pterMedDer: false,
    pterLatIzq: false,
    pterLatDer: false,
    discoConIzq: false,
    discoConDer: false,
    discoSinIzq: false,
    discoSinDer: false,
    // FEATURE-OPTIONAL: correlacion-cervical
    trapecioIzq: false,
    trapecioDer: false,
    ecomIzq: false,
    ecomDer: false,
    suboccipitalIzq: false,
    suboccipitalDer: false,
    obsCervical: "",
    // /FEATURE-OPTIONAL: correlacion-cervical
    eva: 0,
    zona: "",
    caracteristicas: "",
    factores: "",
    contacto: "",
    estabilidad: "",
    angle: "",
    esqueletal: "",
    cdi: [],
    observaciones: "",
    plan: "",
  };
}

export function coerceFicha(input = {}) {
  const template = emptyFicha();
  const out = {};
  for (const [key, defaultVal] of Object.entries(template)) {
    const val = input?.[key];
    if (typeof defaultVal === "boolean") {
      out[key] = Boolean(val);
    } else if (typeof defaultVal === "number") {
      const num = Number(val);
      out[key] = Number.isFinite(num) ? num : defaultVal;
    } else if (Array.isArray(defaultVal)) {
      out[key] = Array.isArray(val) ? val.filter((x) => typeof x === "string") : [];
    } else {
      out[key] = val != null ? String(val).trim() : "";
    }
  }
  out.eva = Math.max(0, Math.min(10, Math.round(out.eva || 0)));

  // Sanitizar edad como entero entre 1 y 120 (sin texto)
  if (out.edad) {
    const cleanEdad = String(out.edad).replace(/\D/g, "");
    const edadNum = parseInt(cleanEdad, 10);
    out.edad = Number.isInteger(edadNum) && edadNum >= 1 && edadNum <= 120 ? String(edadNum) : "";
  }

  // Sanitizar mediciones de ATM: números no negativos en milímetros (sin texto)
  for (const mKey of [
    "aperturaLibre", "aperturaDolor", "protrusion", "latIzq", "latDer",
    "aperturaLibrePost", "aperturaDolorPost", "protrusionPost", "latIzqPost", "latDerPost",
  ]) {
    if (out[mKey]) {
      const cleanVal = String(out[mKey]).replace(",", ".").replace(/[^\d.]/g, "");
      const numVal = Number(cleanVal);
      out[mKey] = Number.isFinite(numVal) && numVal >= 0 ? cleanVal : "";
    }
  }

  if (input?.id) out.id = String(input.id);
  if (input?.savedAt) out.savedAt = String(input.savedAt);
  if (input?.profesional) out.profesional = String(input.profesional);
  if (input?.profesionalNombre) out.profesionalNombre = String(input.profesionalNombre);

  // Compatibilidad bidireccional fotoUrl <-> fotosUrls
  if (out.fotoUrl && out.fotosUrls.length === 0) {
    out.fotosUrls = [out.fotoUrl];
  } else if (!out.fotoUrl && out.fotosUrls.length > 0) {
    out.fotoUrl = out.fotosUrls[0];
  }

  return out;
}

export const DEMO_PHOTO_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%23f8fafc"/>
      <stop offset="100%" stop-color="%23e2e8f0"/>
    </linearGradient>
    <linearGradient id="tooth1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%23ffffff"/>
      <stop offset="100%" stop-color="%23f1f5f9"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(%23bg1)"/>
  <rect x="30" y="25" width="740" height="50" rx="8" fill="%230f172a"/>
  <text x="50" y="56" fill="%23ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="15" font-weight="700" letter-spacing="1">REGISTRO FOTOGRÁFICO · CONTROL PRE-TRATAMIENTO</text>
  <rect x="610" y="37" width="145" height="26" rx="4" fill="%23ea580c"/>
  <text x="682" y="54" fill="%23ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="700" text-anchor="middle">APERTURA 35 mm</text>
  <rect x="80" y="100" width="640" height="420" rx="12" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/>
  <path d="M 120 150 H 680 M 120 200 H 680 M 120 250 H 680 M 120 300 H 680 M 120 350 H 680 M 120 400 H 680 M 120 450 H 680" stroke="%23f1f5f9" stroke-width="1.5"/>
  <path d="M 200 120 V 500 M 300 120 V 500 M 400 120 V 500 M 500 120 V 500 M 600 120 V 500" stroke="%23f1f5f9" stroke-width="1.5"/>
  <line x1="400" y1="115" x2="400" y2="505" stroke="%23ef4444" stroke-width="2" stroke-dasharray="6,4"/>
  <text x="408" y="135" fill="%23ef4444" font-family="sans-serif" font-size="11" font-weight="bold">LÍNEA MEDIA TEÓRICA</text>
  <path d="M 320 210 C 330 235, 385 235, 395 210 Z" fill="url(%23tooth1)" stroke="%2364748b" stroke-width="2"/>
  <path d="M 405 210 C 415 235, 470 235, 480 210 Z" fill="url(%23tooth1)" stroke="%2364748b" stroke-width="2"/>
  <path d="M 265 215 C 275 232, 310 232, 318 215 Z" fill="url(%23tooth1)" stroke="%2394a3b8" stroke-width="1.5"/>
  <path d="M 482 215 C 490 232, 525 232, 535 215 Z" fill="url(%23tooth1)" stroke="%2394a3b8" stroke-width="1.5"/>
  <path d="M 305 380 C 315 355, 370 355, 378 380 Z" fill="url(%23tooth1)" stroke="%2364748b" stroke-width="2"/>
  <path d="M 382 380 C 390 355, 445 355, 455 380 Z" fill="url(%23tooth1)" stroke="%2364748b" stroke-width="2"/>
  <path d="M 255 375 C 265 358, 298 358, 303 375 Z" fill="url(%23tooth1)" stroke="%2394a3b8" stroke-width="1.5"/>
  <path d="M 457 375 C 465 358, 498 358, 505 375 Z" fill="url(%23tooth1)" stroke="%2394a3b8" stroke-width="1.5"/>
  <line x1="535" y1="230" x2="535" y2="360" stroke="%23ea580c" stroke-width="3"/>
  <polygon points="535,222 529,233 541,233" fill="%23ea580c"/>
  <polygon points="535,368 529,357 541,357" fill="%23ea580c"/>
  <rect x="548" y="280" width="75" height="28" rx="4" fill="%23ea580c"/>
  <text x="585" y="299" fill="%23ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" text-anchor="middle">35 mm</text>
  <rect x="110" y="435" width="360" height="60" rx="6" fill="%23fff7ed" stroke="%23fdba74" stroke-width="1.5"/>
  <text x="125" y="458" fill="%239a3412" font-family="sans-serif" font-size="13" font-weight="700">⚠️ Apertura Limitada: 35 mm (EVA 6/10)</text>
  <text x="125" y="478" fill="%23c2410c" font-family="sans-serif" font-size="11.5">Desviación en &quot;S&quot; con clic articular en apertura activa.</text>
  <text x="400" y="555" fill="%2364748b" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" text-anchor="middle">Foto 1/2 · Registro clínico pre-tratamiento · Fichas ATM</text>
</svg>`;

export const DEMO_PHOTO_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%23f8fafc"/>
      <stop offset="100%" stop-color="%23e2e8f0"/>
    </linearGradient>
    <linearGradient id="tooth2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%23ffffff"/>
      <stop offset="100%" stop-color="%23f1f5f9"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(%23bg2)"/>
  <rect x="30" y="25" width="740" height="50" rx="8" fill="%230f172a"/>
  <text x="50" y="56" fill="%23ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="15" font-weight="700" letter-spacing="1">REGISTRO FOTOGRÁFICO · CONTROL POST-TRATAMIENTO</text>
  <rect x="605" y="37" width="150" height="26" rx="4" fill="%2316a34a"/>
  <text x="680" y="54" fill="%23ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="700" text-anchor="middle">APERTURA 42 mm</text>
  <rect x="80" y="100" width="640" height="420" rx="12" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/>
  <path d="M 120 150 H 680 M 120 200 H 680 M 120 250 H 680 M 120 300 H 680 M 120 350 H 680 M 120 400 H 680 M 120 450 H 680" stroke="%23f1f5f9" stroke-width="1.5"/>
  <path d="M 200 120 V 500 M 300 120 V 500 M 400 120 V 500 M 500 120 V 500 M 600 120 V 500" stroke="%23f1f5f9" stroke-width="1.5"/>
  <line x1="400" y1="115" x2="400" y2="505" stroke="%2316a34a" stroke-width="2" stroke-dasharray="6,4"/>
  <text x="408" y="135" fill="%2316a34a" font-family="sans-serif" font-size="11" font-weight="bold">LÍNEA MEDIA CENTRADA</text>
  <path d="M 320 200 C 330 225, 385 225, 395 200 Z" fill="url(%23tooth2)" stroke="%2364748b" stroke-width="2"/>
  <path d="M 405 200 C 415 225, 470 225, 480 200 Z" fill="url(%23tooth2)" stroke="%2364748b" stroke-width="2"/>
  <path d="M 265 205 C 275 222, 310 222, 318 205 Z" fill="url(%23tooth2)" stroke="%2394a3b8" stroke-width="1.5"/>
  <path d="M 482 205 C 490 222, 525 222, 535 205 Z" fill="url(%23tooth2)" stroke="%2394a3b8" stroke-width="1.5"/>
  <path d="M 323 410 C 333 385, 388 385, 396 410 Z" fill="url(%23tooth2)" stroke="%2364748b" stroke-width="2"/>
  <path d="M 404 410 C 412 385, 467 385, 477 410 Z" fill="url(%23tooth2)" stroke="%2364748b" stroke-width="2"/>
  <path d="M 273 405 C 283 388, 316 388, 321 405 Z" fill="url(%23tooth2)" stroke="%2394a3b8" stroke-width="1.5"/>
  <path d="M 479 405 C 487 388, 520 388, 527 405 Z" fill="url(%23tooth2)" stroke="%2394a3b8" stroke-width="1.5"/>
  <line x1="535" y1="220" x2="535" y2="390" stroke="%2316a34a" stroke-width="3"/>
  <polygon points="535,212 529,223 541,223" fill="%2316a34a"/>
  <polygon points="535,398 529,387 541,387" fill="%2316a34a"/>
  <rect x="548" y="295" width="75" height="28" rx="4" fill="%2316a34a"/>
  <text x="585" y="314" fill="%23ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" text-anchor="middle">42 mm</text>
  <rect x="110" y="435" width="360" height="60" rx="6" fill="%23f0fdf4" stroke="%2386efac" stroke-width="1.5"/>
  <text x="125" y="458" fill="%23166534" font-family="sans-serif" font-size="13" font-weight="700">✓ Rango Normal Recuperado: 42 mm</text>
  <text x="125" y="478" fill="%2315803d" font-family="sans-serif" font-size="11.5">Sin dolor (EVA 1/10). Apertura en trayectoria recta libre.</text>
  <text x="400" y="555" fill="%2364748b" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" text-anchor="middle">Foto 2/2 · Registro post-tratamiento de kinesiología ATM · Fichas ATM</text>
</svg>`;

export function exampleFicha() {
  return {
    nombre: "Carolina Méndez",
    dni: "34.205.109",
    sinDocumento: false,
    fechaSesion: "2026-10-10",
    nacimiento: "1992-03-14",
    edad: "34",
    lugarNac: "Córdoba",
    anotaciones: "Paciente refiere alivio tras terapia manual descompresiva. Mejoría en el rango de apertura y desaparición de ruidos articulares.",
    fotoUrl: DEMO_PHOTO_1,
    fotosUrls: [DEMO_PHOTO_1, DEMO_PHOTO_2],
    motivo: "No Traumático",
    // FEATURE-OPTIONAL: habitos-bruxismo
    habitoApretamiento: true,
    habitoBruxismo: true,
    habitoMasticacionUni: true,
    habitoOnicofagia: false,
    // /FEATURE-OPTIONAL: habitos-bruxismo
    antecedentes: "Dolor en la sien y delante del oído desde hace 8 meses, sin golpe ni cirugía. Apretamiento nocturno y masticación unilateral. Empeora con chicle y pan duro.",
    ruidos: "Sí",
    ruidosIzq: true,
    ruidosDer: false,
    faseApertura: true,
    faseCierre: false,
    // FEATURE-OPTIONAL: tipo-ruido
    ruidoClic: true,
    ruidoCrep: false,
    // /FEATURE-OPTIONAL: tipo-ruido
    dolorCondilar: "Sí",
    condilarIzq: false,
    condilarDer: true,
    aperturaLibre: "35",
    aperturaDolor: "46",
    desviacion: "Sí",
    desvIzq: true,
    desvDer: false,
    // FEATURE-OPTIONAL: patron-desviacion
    desvCorregida: true,
    deflexion: false,
    // /FEATURE-OPTIONAL: patron-desviacion
    protrusion: "8",
    latIzq: "10",
    latDer: "10",
    aperturaLibrePost: "42",
    aperturaDolorPost: "48",
    desviacionPost: "No",
    desvIzqPost: false,
    desvDerPost: false,
    // FEATURE-OPTIONAL: patron-desviacion
    desvCorregidaPost: false,
    deflexionPost: false,
    // /FEATURE-OPTIONAL: patron-desviacion
    protrusionPost: "9",
    latIzqPost: "11",
    latDerPost: "11",
    maseteroIzq: true,
    maseteroDer: true,
    temporalIzq: true,
    temporalDer: false,
    pterMedIzq: false,
    pterMedDer: true,
    pterLatIzq: true,
    pterLatDer: false,
    discoConIzq: true,
    discoConDer: false,
    discoSinIzq: false,
    discoSinDer: false,
    // FEATURE-OPTIONAL: correlacion-cervical
    trapecioIzq: true,
    trapecioDer: false,
    ecomIzq: true,
    ecomDer: false,
    suboccipitalIzq: true,
    suboccipitalDer: true,
    obsCervical: "Rectificación cervical con sobrecarga bilateral suboccipital.",
    // /FEATURE-OPTIONAL: correlacion-cervical
    eva: 6,
    zona: "Fosa temporal anterior e intraauricular",
    caracteristicas: "Sordo, opresivo, continuo, punzante",
    factores: "Aumenta al masticar chicles, pan duro. Disminuye al usar calor local o relajación muscular.",
    contacto: "Prematuro",
    estabilidad: "Irregular",
    angle: "Clase II",
    esqueletal: "Retrognata",
    cdi: ["I.a", "II.a"],
    observaciones: "Dolor miofascial con clic recíproco a la apertura del lado izquierdo. Sin limitación marcada de la apertura.",
    plan: "Terapia manual de masetero y temporal, ejercicios de control motor y pauta de no masticar chicle. Valorar férula y control en 4 semanas.",
  };
}


// Re-exportar utilidades de comparación desde ficha-compare.mjs para retrocompatibilidad total
export {
  sideText,
  formatSide,
  daysBetween,
  compareFichas,
} from "./ficha-compare.mjs";
