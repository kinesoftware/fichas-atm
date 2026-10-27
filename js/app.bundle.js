(() => {
  // js/core/ficha-compare.mjs
  function sideText(left, right) {
    if (left && right) return "Bilateral";
    if (left) return "Izquierdo";
    if (right) return "Derecho";
    return "Sin afectaci\xF3n";
  }
  function daysBetween(dateA, dateB) {
    if (!dateA || !dateB) return null;
    const tA = new Date(String(dateA).slice(0, 10)).getTime();
    const tB = new Date(String(dateB).slice(0, 10)).getTime();
    if (Number.isNaN(tA) || Number.isNaN(tB)) return null;
    return Math.abs(Math.round((tB - tA) / (1e3 * 60 * 60 * 24)));
  }
  function diffText(label, valA, valB) {
    const a = String(valA || "").trim();
    const b = String(valB || "").trim();
    const changed = a !== b;
    return {
      label,
      changed,
      current: b || "\u2014",
      previous: a || "\u2014",
      trend: "same",
      display: changed ? `${a || "\u2014"} \u2794 ${b || "\u2014"}` : b || "\u2014"
    };
  }
  function diffNumber(label, valA, valB, unit = "", lowerIsBetter = false) {
    const hasA = valA !== "" && valA != null && !Number.isNaN(Number(valA));
    const hasB = valB !== "" && valB != null && !Number.isNaN(Number(valB));
    const numA = hasA ? Number(valA) : null;
    const numB = hasB ? Number(valB) : null;
    const changed = numA !== numB;
    let delta = null;
    let trend = "same";
    if (numA != null && numB != null) {
      const diff = numB - numA;
      if (diff !== 0) {
        delta = diff;
        const isPositive = diff > 0;
        trend = isPositive && !lowerIsBetter || !isPositive && lowerIsBetter ? "better" : "worse";
      }
    }
    const deltaText = delta != null ? (delta > 0 ? `+${delta}` : `${delta}`) + (unit ? ` ${unit}` : "") : "";
    const curStr = numB != null ? `${numB}${unit ? ` ${unit}` : ""}` : "\u2014";
    const prevStr = numA != null ? `${numA}${unit ? ` ${unit}` : ""}` : "\u2014";
    return {
      label,
      changed,
      current: curStr,
      previous: prevStr,
      delta,
      deltaText,
      unit,
      trend,
      display: changed && numA != null && numB != null ? `${prevStr} \u2794 ${curStr}` : curStr
    };
  }
  function diffSide(label, aLeft, aRight, bLeft, bRight) {
    const strA = sideText(aLeft, aRight);
    const strB = sideText(bLeft, bRight);
    const changed = strA !== strB;
    let trend = "same";
    if (changed) {
      if (strB === "Sin afectaci\xF3n") trend = "better";
      else if (strA === "Sin afectaci\xF3n") trend = "worse";
      else if (strA === "Bilateral" && strB !== "Bilateral") trend = "better";
      else if (strA !== "Bilateral" && strB === "Bilateral") trend = "worse";
    }
    return {
      label,
      changed,
      current: strB,
      previous: strA,
      trend,
      display: changed ? `${strA} \u2794 ${strB}` : strB
    };
  }
  function compareFichas(sourceA, sourceB) {
    const a = coerceFicha(sourceA);
    const b = coerceFicha(sourceB);
    const days = daysBetween(a.fechaSesion, b.fechaSesion);
    const summarizeRuidos = (item) => {
      if (item.ruidos !== "S\xED") return item.ruidos ? "No" : "Sin registrar";
      const parts = [
        sideText(item.ruidosIzq, item.ruidosDer),
        [item.faseApertura ? "apertura" : "", item.faseCierre ? "cierre" : ""].filter(Boolean).join(" y "),
        [item.ruidoClic ? "clic" : "", item.ruidoCrep ? "crepitaci\xF3n" : ""].filter(Boolean).join(" y ")
      ].filter((p) => p && p !== "Sin afectaci\xF3n");
      return parts.length ? `S\xED (${parts.join(" \xB7 ")})` : "S\xED";
    };
    const ruidosA = summarizeRuidos(a);
    const ruidosB = summarizeRuidos(b);
    const ruidosDiff = {
      label: "Ruidos articulares",
      changed: ruidosA !== ruidosB,
      current: ruidosB,
      previous: ruidosA,
      trend: a.ruidos === "S\xED" && b.ruidos === "No" ? "better" : a.ruidos === "No" && b.ruidos === "S\xED" ? "worse" : "same",
      display: ruidosA !== ruidosB ? `${ruidosA} \u2794 ${ruidosB}` : ruidosB
    };
    const summarizeDesv = (item) => {
      if (item.desviacion !== "S\xED") return item.desviacion ? "No" : "Sin registrar";
      const parts = [
        sideText(item.desvIzq, item.desvDer),
        [item.desvCorregida ? "corregida en S" : "", item.deflexion ? "deflexi\xF3n" : ""].filter(Boolean).join(" \xB7 ")
      ].filter((p) => p && p !== "Sin afectaci\xF3n");
      return parts.length ? `S\xED (${parts.join(" \xB7 ")})` : "S\xED";
    };
    const desvA = summarizeDesv(a);
    const desvB = summarizeDesv(b);
    const desvDiff = {
      label: "Desviaci\xF3n lateral de trayectoria",
      changed: desvA !== desvB,
      current: desvB,
      previous: desvA,
      trend: a.desviacion === "S\xED" && b.desviacion === "No" ? "better" : a.desviacion === "No" && b.desviacion === "S\xED" ? "worse" : "same",
      display: desvA !== desvB ? `${desvA} \u2794 ${desvB}` : desvB
    };
    const listHabits = (item) => [
      item.habitoApretamiento ? "Apretamiento diurno" : "",
      item.habitoBruxismo ? "Bruxismo nocturno" : "",
      item.habitoMasticacionUni ? "Masticaci\xF3n unilateral" : "",
      item.habitoOnicofagia ? "Onicofagia / mordisqueo" : ""
    ].filter(Boolean);
    const habA = listHabits(a);
    const habB = listHabits(b);
    const habChanged = JSON.stringify(habA) !== JSON.stringify(habB);
    const habDiff = {
      label: "H\xE1bitos parafuncionales y bruxismo",
      changed: habChanged,
      current: habB.length ? habB.join(", ") : "Sin h\xE1bitos registrados",
      previous: habA.length ? habA.join(", ") : "Sin h\xE1bitos registrados",
      trend: habB.length < habA.length ? "better" : habB.length > habA.length ? "worse" : "same",
      display: habChanged ? `${habA.join(", ") || "Ninguno"} \u2794 ${habB.join(", ") || "Ninguno"}` : habB.join(", ") || "Ninguno"
    };
    const cdiA = (a.cdi || []).sort();
    const cdiB = (b.cdi || []).sort();
    const cdiChanged = JSON.stringify(cdiA) !== JSON.stringify(cdiB);
    const cdiDiff = {
      label: "Criterios diagn\xF3sticos CDI-TTM",
      changed: cdiChanged,
      current: cdiB.join(", ") || "Sin criterios marcados",
      previous: cdiA.join(", ") || "Sin criterios marcados",
      trend: cdiB.length < cdiA.length ? "better" : cdiB.length > cdiA.length ? "worse" : "same",
      display: cdiChanged ? `${cdiA.join(", ") || "Ninguno"} \u2794 ${cdiB.join(", ") || "Ninguno"}` : cdiB.join(", ") || "Ninguno"
    };
    const evaDiff = diffNumber("Dolor (EVA)", a.eva, b.eva, "/ 10", true);
    const aperturaLibreDiff = diffNumber("Apertura libre de dolor", a.aperturaLibre, b.aperturaLibre, "mm", false);
    const aperturaDolorDiff = diffNumber("Apertura m\xE1xima con dolor", a.aperturaDolor, b.aperturaDolor, "mm", false);
    const desvPostA = a.desviacionPost === "S\xED" ? `S\xED (${[sideText(a.desvIzqPost, a.desvDerPost), [a.desvCorregidaPost ? "corregida en S" : "", a.deflexionPost ? "deflexi\xF3n" : ""].filter(Boolean).join(" \xB7 ")].filter((p) => p && p !== "Sin afectaci\xF3n").join(" \xB7 ") || "S\xED"})` : a.desviacionPost ? "No" : "Sin registrar";
    const desvPostB = b.desviacionPost === "S\xED" ? `S\xED (${[sideText(b.desvIzqPost, b.desvDerPost), [b.desvCorregidaPost ? "corregida en S" : "", b.deflexionPost ? "deflexi\xF3n" : ""].filter(Boolean).join(" \xB7 ")].filter((p) => p && p !== "Sin afectaci\xF3n").join(" \xB7 ") || "S\xED"})` : b.desviacionPost ? "No" : "Sin registrar";
    const desvPostDiff = {
      label: "Desviaci\xF3n lateral (al finalizar)",
      changed: desvPostA !== desvPostB,
      current: desvPostB,
      previous: desvPostA,
      trend: a.desviacionPost === "S\xED" && b.desviacionPost === "No" ? "better" : a.desviacionPost === "No" && b.desviacionPost === "S\xED" ? "worse" : "same",
      display: desvPostA !== desvPostB ? `${desvPostA} \u2794 ${desvPostB}` : desvPostB
    };
    const sections = [
      {
        id: "filiacion",
        title: "1. Filiaci\xF3n y Antecedentes",
        fields: [
          diffText("Motivo de consulta", a.motivo, b.motivo),
          habDiff,
          diffText("Antecedentes cl\xEDnicos", a.antecedentes, b.antecedentes)
        ]
      },
      {
        id: "atm",
        title: "2. ATM: Ruidos, Dolor Condilar y Rangos",
        fields: [
          ruidosDiff,
          diffSide("Dolor condilar a la palpaci\xF3n", a.condilarIzq, a.condilarDer, b.condilarIzq, b.condilarDer),
          aperturaLibreDiff,
          aperturaDolorDiff,
          desvDiff,
          diffNumber("Protrusi\xF3n mandibular", a.protrusion, b.protrusion, "mm", false),
          diffNumber("Lateralidad izquierda", a.latIzq, b.latIzq, "mm", false),
          diffNumber("Lateralidad derecha", a.latDer, b.latDer, "mm", false),
          diffNumber("Apertura libre (al finalizar)", a.aperturaLibrePost, b.aperturaLibrePost, "mm", false),
          diffNumber("Apertura dolor (al finalizar)", a.aperturaDolorPost, b.aperturaDolorPost, "mm", false),
          desvPostDiff,
          diffNumber("Protrusi\xF3n (al finalizar)", a.protrusionPost, b.protrusionPost, "mm", false),
          diffNumber("Lateralidad izq (al finalizar)", a.latIzqPost, b.latIzqPost, "mm", false),
          diffNumber("Lateralidad der (al finalizar)", a.latDerPost, b.latDerPost, "mm", false)
        ]
      },
      {
        id: "musculos",
        title: "3. M\xFAsculos Craneales, Cervicales y Disco",
        fields: [
          diffSide("M\xFAsculo masetero", a.maseteroIzq, a.maseteroDer, b.maseteroIzq, b.maseteroDer),
          diffSide("M\xFAsculo temporal anterior", a.temporalIzq, a.temporalDer, b.temporalIzq, b.temporalDer),
          diffSide("M\xFAsculo pterigoideo medial", a.pterMedIzq, a.pterMedDer, b.pterMedIzq, b.pterMedDer),
          diffSide("Estructura pterigoideo lateral", a.pterLatIzq, a.pterLatDer, b.pterLatIzq, b.pterLatDer),
          diffSide("Desplazamiento con recaptura", a.discoConIzq, a.discoConDer, b.discoConIzq, b.discoConDer),
          diffSide("Desplazamiento sin recaptura", a.discoSinIzq, a.discoSinDer, b.discoSinIzq, b.discoSinDer),
          diffSide("Trapecio superior (cervical)", a.trapecioIzq, a.trapecioDer, b.trapecioIzq, b.trapecioDer),
          diffSide("Esternocleidomastoideo (ECOM)", a.ecomIzq, a.ecomDer, b.ecomIzq, b.ecomDer),
          diffSide("Musculatura suboccipital", a.suboccipitalIzq, a.suboccipitalDer, b.suboccipitalIzq, b.suboccipitalDer),
          diffText("Observaciones cervicales/postura", a.obsCervical, b.obsCervical)
        ]
      },
      {
        id: "dolor",
        title: "4. Dolor (EVA) y Relaciones Oclusales",
        fields: [
          evaDiff,
          diffText("Zona / localizaci\xF3n del dolor", a.zona, b.zona),
          diffText("Caracter\xEDsticas del dolor", a.caracteristicas, b.caracteristicas),
          diffText("Factores modificadores", a.factores, b.factores),
          diffText("Contacto dentario", a.contacto, b.contacto),
          diffText("Estabilidad oclusal", a.estabilidad, b.estabilidad),
          diffText("Clasificaci\xF3n de Angle", a.angle, b.angle),
          diffText("Configuraci\xF3n esqueletal", a.esqueletal, b.esqueletal)
        ]
      },
      {
        id: "cdi",
        title: "5. Diagn\xF3stico CDI-TTM y Plan de Tratamiento",
        fields: [
          cdiDiff,
          diffText("Observaciones cl\xEDnicas", a.observaciones, b.observaciones),
          diffText("Plan de tratamiento / recomendaciones", a.plan, b.plan)
        ]
      },
      {
        id: "anotaciones",
        title: "6. Anotaciones de la sesi\xF3n",
        fields: [
          diffText("Anotaciones de la sesi\xF3n", a.anotaciones, b.anotaciones),
          diffText(
            "Foto cl\xEDnica adjunta",
            Array.isArray(a.fotosUrls) && a.fotosUrls.length > 0 ? `${a.fotosUrls.length} ${a.fotosUrls.length === 1 ? "foto adjunta" : "fotos adjuntas"}` : a.fotoUrl ? "Con foto adjunta" : "Sin foto",
            Array.isArray(b.fotosUrls) && b.fotosUrls.length > 0 ? `${b.fotosUrls.length} ${b.fotosUrls.length === 1 ? "foto adjunta" : "fotos adjuntas"}` : b.fotoUrl ? "Con foto adjunta" : "Sin foto"
          )
        ]
      }
    ];
    const allFields = sections.flatMap((s) => s.fields);
    const totalChanged = allFields.filter((f) => f.changed).length;
    return {
      patient: {
        nombre: b.nombre || a.nombre,
        dni: b.dni || a.dni
      },
      sessionX: {
        id: a.id,
        fechaSesion: a.fechaSesion,
        profesionalNombre: a.profesionalNombre,
        edad: a.edad
      },
      sessionY: {
        id: b.id,
        fechaSesion: b.fechaSesion,
        profesionalNombre: b.profesionalNombre,
        edad: b.edad
      },
      daysBetween: days,
      totalChanged,
      kpis: {
        eva: evaDiff,
        aperturaLibre: aperturaLibreDiff,
        aperturaDolor: aperturaDolorDiff,
        ruidos: ruidosDiff
      },
      sections
    };
  }

  // js/core/ficha-rules.mjs
  var REQUIRED_FIELDS = [
    ["nombre", "el nombre completo"],
    ["dni", "el DNI / Pasaporte"],
    ["fechaSesion", "la fecha de la sesi\xF3n"],
    ["nacimiento", "la fecha de nacimiento"],
    ["edad", "la edad"],
    ["motivo", "el motivo de consulta"],
    ["antecedentes", "los antecedentes cl\xEDnicos"]
  ];
  var CLINICIANS = {
    profesional: "Profesional"
  };
  var CLINICIAN_DETAILS = {
    default: {
      nombre: "Profesional tratante",
      titulo: "Kinesi\xF3logo/a - Fisioterapeuta",
      matricula: "",
      signatureFile: ""
    }
  };
  function missingFieldKeys(data) {
    return REQUIRED_FIELDS.filter(([key]) => {
      if (key === "dni" && data?.sinDocumento) return false;
      return !String(data?.[key] ?? "").trim();
    }).map(([key]) => key);
  }
  function missingFields(data) {
    return REQUIRED_FIELDS.filter(([key]) => {
      if (key === "dni" && data?.sinDocumento) return false;
      return !String(data?.[key] ?? "").trim();
    }).map(([, label]) => label);
  }
  function validateField(key, value, allData = {}) {
    const str = String(value ?? "").trim();
    switch (key) {
      case "edad": {
        if (!str) return "Falta completar la edad";
        if (!/^\d+$/.test(str)) {
          return "La edad no permite texto: debe ser un n\xFAmero entero entre 1 y 120";
        }
        const n = Number(str);
        if (!Number.isInteger(n) || n < 1 || n > 120) {
          return "La edad debe ser un n\xFAmero entero entre 1 y 120";
        }
        return null;
      }
      case "nombre": {
        if (!str) return "Falta completar el nombre completo";
        if (/\d/.test(str)) return "El nombre no puede contener n\xFAmeros";
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
        if (!str) return "Falta completar la fecha de la sesi\xF3n";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return "La fecha de la sesi\xF3n debe ser v\xE1lida (AAAA-MM-DD)";
        return null;
      }
      case "nacimiento": {
        if (!str) return "Falta completar la fecha de nacimiento";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return "La fecha de nacimiento debe ser v\xE1lida (AAAA-MM-DD)";
        const session = String(allData.fechaSesion || "").slice(0, 10);
        if (session && /^\d{4}-\d{2}-\d{2}$/.test(session) && str > session) {
          return "La fecha de nacimiento no puede ser posterior a la fecha de la sesi\xF3n";
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
        if (!str) return "Falta completar los antecedentes cl\xEDnicos";
        return null;
      }
      case "aperturaLibre":
      case "aperturaDolor":
      case "aperturaLibrePost":
      case "aperturaDolorPost": {
        if (!str) return null;
        const clean = str.replace(",", ".");
        if (/[a-zA-Z]/.test(clean) || !/^\d+(\.\d+)?$/.test(clean)) {
          return "Este campo no permite texto: debe ser un n\xFAmero en mil\xEDmetros";
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
          return "Este campo no permite texto: debe ser un n\xFAmero en mil\xEDmetros";
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
        const isSi = str === "S\xED" || allData.ruidos === "S\xED";
        if (isSi && !allData.ruidosIzq && !allData.ruidosDer) {
          return "Debe indicar el lado (izquierdo y/o derecho) en los ruidos articulares";
        }
        return null;
      }
      case "dolorCondilar":
      case "condilarIzq":
      case "condilarDer": {
        const isSi = str === "S\xED" || allData.dolorCondilar === "S\xED";
        if (isSi && !allData.condilarIzq && !allData.condilarDer) {
          return "Debe indicar el lado (izquierdo y/o derecho) en el dolor condilar a la palpaci\xF3n";
        }
        return null;
      }
      case "desviacion":
      case "desvIzq":
      case "desvDer": {
        const isSi = str === "S\xED" || allData.desviacion === "S\xED";
        if (isSi && !allData.desvIzq && !allData.desvDer) {
          return "Debe indicar el lado (izquierdo y/o derecho) en la desviaci\xF3n lateral de la trayectoria";
        }
        return null;
      }
      case "desviacionPost":
      case "desvIzqPost":
      case "desvDerPost": {
        const isSi = str === "S\xED" || allData.desviacionPost === "S\xED";
        if (isSi && !allData.desvIzqPost && !allData.desvDerPost) {
          return "Debe indicar el lado (izquierdo y/o derecho) en la desviaci\xF3n lateral al finalizar la sesi\xF3n";
        }
        return null;
      }
      case "eva": {
        if (value === "" || value === null || value === void 0) return null;
        const n = Number(value);
        if (Number.isNaN(n) || n < 0 || n > 10) return "La escala EVA debe ser un valor entre 0 y 10";
        return null;
      }
      default:
        return null;
    }
  }
  function validateFicha(data = {}) {
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
      "eva"
    ];
    for (const field2 of fieldsToCheck) {
      const err = validateField(field2, data[field2], data);
      if (err) {
        errors[field2] = err;
        errorList.push(err);
      }
    }
    return {
      isValid: errorList.length === 0,
      errors,
      errorList,
      firstErrorKey: Object.keys(errors)[0] || null,
      firstError: errorList[0] || null
    };
  }
  function validateStep(stepNumber, data = {}) {
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
        "latDerPost"
      ],
      2: [],
      3: ["eva"],
      4: [],
      5: ["anotaciones", "fotoUrl", "fotosUrls"]
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
      firstError: errorList[0] || null
    };
  }
  function normalizeDni(dni) {
    const digits = String(dni || "").replace(/\D/g, "");
    if (digits.length >= 4 && !/[a-zA-Z]/.test(String(dni || ""))) {
      return digits;
    }
    return String(dni || "").trim().toLowerCase();
  }
  function stripAccents(str) {
    return String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }
  function matchFichaSearch(item, query) {
    const q = String(query || "").trim();
    if (!q) return true;
    const rawNombre = String(item?.nombre || "");
    const normNombre = stripAccents(rawNombre);
    const rawDni = String(item?.dni || "");
    const dniDigits = rawDni.replace(/\D/g, "");
    const normQ = stripAccents(q);
    if (normNombre.includes(normQ) || rawDni.toLowerCase().includes(normQ)) {
      return true;
    }
    const qDigits = q.replace(/\D/g, "");
    if (/^[\d.\s-]+$/.test(q) && qDigits.length > 0) {
      return dniDigits.includes(qDigits);
    }
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
  function patientKey(item) {
    const dni = normalizeDni(item?.dni);
    if (dni) return `doc:${dni}`;
    const nombre = String(item?.nombre || "").trim().toLowerCase();
    if (!nombre) return "";
    return `nombre:${nombre}`;
  }
  function personNameKey(nombre) {
    return stripAccents(nombre).replace(/\s+/g, " ").trim();
  }
  function dniNameConflict(data, allFichas = [], ownKey = "") {
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
  function isRealDate([y, m, d]) {
    if (!y || !m || !d || m > 12 || d > 31) return false;
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  }
  function ageOn(nacimiento, onDate) {
    const birth = String(nacimiento || "").slice(0, 10).split("-").map(Number);
    const on = String(onDate || "").slice(0, 10).split("-").map(Number);
    if (birth.length !== 3 || on.length !== 3 || !isRealDate(birth) || !isRealDate(on)) return "";
    let age = on[0] - birth[0];
    if (on[1] < birth[1] || on[1] === birth[1] && on[2] < birth[2]) age -= 1;
    return age >= 0 ? String(age) : "";
  }
  var PATIENT_FIELDS = [
    "nombre",
    "dni",
    "nacimiento",
    "lugarNac",
    "motivo",
    "antecedentes",
    "habitoApretamiento",
    "habitoBruxismo",
    "habitoMasticacionUni",
    "habitoOnicofagia"
  ];
  function nextSession(item, fechaSesion) {
    const copy = emptyFicha();
    for (const key of PATIENT_FIELDS) copy[key] = item?.[key] ?? copy[key];
    copy.sinDocumento = Boolean(item?.sinDocumento);
    copy.fechaSesion = fechaSesion || "";
    copy.edad = ageOn(item?.nacimiento, fechaSesion);
    if (CLINICIANS[item?.profesional]) copy.profesional = item.profesional;
    return copy;
  }
  function getUniquePatients(allFichas = []) {
    const map = /* @__PURE__ */ new Map();
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
          sessions: [f]
        });
      } else {
        const p = map.get(key);
        p.sessions.push(f);
        if (!p.nacimiento && f.nacimiento) p.nacimiento = f.nacimiento;
        if (!p.lugarNac && f.lugarNac) p.lugarNac = f.lugarNac;
        if (!p.motivo && f.motivo) p.motivo = f.motivo;
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
    );
  }
  function getSessionIndex(item, allFichas = []) {
    if (!item) return 1;
    const key = patientKey(item);
    const pSessions = (allFichas || []).filter((f) => patientKey(f) === key).sort((a, b) => (a.fechaSesion || "").localeCompare(b.fechaSesion || ""));
    if (!pSessions.length) return 1;
    const idx = pSessions.findIndex((s) => s.id === item.id);
    if (idx >= 0) return idx + 1;
    return pSessions.length + 1;
  }
  function formatSessionBadgeText(sessionIndex = 1, totalSessions = 1) {
    if (sessionIndex === 1 && totalSessions === 1) return "Evaluaci\xF3n inicial";
    return `Sesi\xF3n N\xB0 ${sessionIndex}${totalSessions > 1 ? ` de ${totalSessions}` : ""}`;
  }
  function shouldOmitInvariableFields(sessionIndex = 1, totalSessions = 1) {
    return totalSessions > 1 && sessionIndex > 1;
  }
  function emptyFicha() {
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
      plan: ""
    };
  }
  function coerceFicha(input = {}) {
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
    if (out.edad) {
      const cleanEdad = String(out.edad).replace(/\D/g, "");
      const edadNum = parseInt(cleanEdad, 10);
      out.edad = Number.isInteger(edadNum) && edadNum >= 1 && edadNum <= 120 ? String(edadNum) : "";
    }
    for (const mKey of [
      "aperturaLibre",
      "aperturaDolor",
      "protrusion",
      "latIzq",
      "latDer",
      "aperturaLibrePost",
      "aperturaDolorPost",
      "protrusionPost",
      "latIzqPost",
      "latDerPost"
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
    if (out.fotoUrl && out.fotosUrls.length === 0) {
      out.fotosUrls = [out.fotoUrl];
    } else if (!out.fotoUrl && out.fotosUrls.length > 0) {
      out.fotoUrl = out.fotosUrls[0];
    }
    return out;
  }
  var DEMO_PHOTO_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
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
  <text x="50" y="56" fill="%23ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="15" font-weight="700" letter-spacing="1">REGISTRO FOTOGR\xC1FICO \xB7 CONTROL PRE-TRATAMIENTO</text>
  <rect x="610" y="37" width="145" height="26" rx="4" fill="%23ea580c"/>
  <text x="682" y="54" fill="%23ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="700" text-anchor="middle">APERTURA 35 mm</text>
  <rect x="80" y="100" width="640" height="420" rx="12" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/>
  <path d="M 120 150 H 680 M 120 200 H 680 M 120 250 H 680 M 120 300 H 680 M 120 350 H 680 M 120 400 H 680 M 120 450 H 680" stroke="%23f1f5f9" stroke-width="1.5"/>
  <path d="M 200 120 V 500 M 300 120 V 500 M 400 120 V 500 M 500 120 V 500 M 600 120 V 500" stroke="%23f1f5f9" stroke-width="1.5"/>
  <line x1="400" y1="115" x2="400" y2="505" stroke="%23ef4444" stroke-width="2" stroke-dasharray="6,4"/>
  <text x="408" y="135" fill="%23ef4444" font-family="sans-serif" font-size="11" font-weight="bold">L\xCDNEA MEDIA TE\xD3RICA</text>
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
  <text x="125" y="458" fill="%239a3412" font-family="sans-serif" font-size="13" font-weight="700">\u26A0\uFE0F Apertura Limitada: 35 mm (EVA 6/10)</text>
  <text x="125" y="478" fill="%23c2410c" font-family="sans-serif" font-size="11.5">Desviaci\xF3n en &quot;S&quot; con clic articular en apertura activa.</text>
  <text x="400" y="555" fill="%2364748b" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" text-anchor="middle">Foto 1/2 \xB7 Registro cl\xEDnico pre-tratamiento \xB7 Fichas ATM</text>
</svg>`;
  var DEMO_PHOTO_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
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
  <text x="50" y="56" fill="%23ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="15" font-weight="700" letter-spacing="1">REGISTRO FOTOGR\xC1FICO \xB7 CONTROL POST-TRATAMIENTO</text>
  <rect x="605" y="37" width="150" height="26" rx="4" fill="%2316a34a"/>
  <text x="680" y="54" fill="%23ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="700" text-anchor="middle">APERTURA 42 mm</text>
  <rect x="80" y="100" width="640" height="420" rx="12" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/>
  <path d="M 120 150 H 680 M 120 200 H 680 M 120 250 H 680 M 120 300 H 680 M 120 350 H 680 M 120 400 H 680 M 120 450 H 680" stroke="%23f1f5f9" stroke-width="1.5"/>
  <path d="M 200 120 V 500 M 300 120 V 500 M 400 120 V 500 M 500 120 V 500 M 600 120 V 500" stroke="%23f1f5f9" stroke-width="1.5"/>
  <line x1="400" y1="115" x2="400" y2="505" stroke="%2316a34a" stroke-width="2" stroke-dasharray="6,4"/>
  <text x="408" y="135" fill="%2316a34a" font-family="sans-serif" font-size="11" font-weight="bold">L\xCDNEA MEDIA CENTRADA</text>
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
  <text x="125" y="458" fill="%23166534" font-family="sans-serif" font-size="13" font-weight="700">\u2713 Rango Normal Recuperado: 42 mm</text>
  <text x="125" y="478" fill="%2315803d" font-family="sans-serif" font-size="11.5">Sin dolor (EVA 1/10). Apertura en trayectoria recta libre.</text>
  <text x="400" y="555" fill="%2364748b" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" text-anchor="middle">Foto 2/2 \xB7 Registro post-tratamiento de kinesiolog\xEDa ATM \xB7 Fichas ATM</text>
</svg>`;
  function exampleFicha() {
    return {
      nombre: "Carolina M\xE9ndez",
      dni: "34.205.109",
      sinDocumento: false,
      fechaSesion: "2026-10-10",
      nacimiento: "1992-03-14",
      edad: "34",
      lugarNac: "C\xF3rdoba",
      anotaciones: "Paciente refiere alivio tras terapia manual descompresiva. Mejor\xEDa en el rango de apertura y desaparici\xF3n de ruidos articulares.",
      fotoUrl: DEMO_PHOTO_1,
      fotosUrls: [DEMO_PHOTO_1, DEMO_PHOTO_2],
      motivo: "No Traum\xE1tico",
      // FEATURE-OPTIONAL: habitos-bruxismo
      habitoApretamiento: true,
      habitoBruxismo: true,
      habitoMasticacionUni: true,
      habitoOnicofagia: false,
      // /FEATURE-OPTIONAL: habitos-bruxismo
      antecedentes: "Dolor en la sien y delante del o\xEDdo desde hace 8 meses, sin golpe ni cirug\xEDa. Apretamiento nocturno y masticaci\xF3n unilateral. Empeora con chicle y pan duro.",
      ruidos: "S\xED",
      ruidosIzq: true,
      ruidosDer: false,
      faseApertura: true,
      faseCierre: false,
      // FEATURE-OPTIONAL: tipo-ruido
      ruidoClic: true,
      ruidoCrep: false,
      // /FEATURE-OPTIONAL: tipo-ruido
      dolorCondilar: "S\xED",
      condilarIzq: false,
      condilarDer: true,
      aperturaLibre: "35",
      aperturaDolor: "46",
      desviacion: "S\xED",
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
      obsCervical: "Rectificaci\xF3n cervical con sobrecarga bilateral suboccipital.",
      // /FEATURE-OPTIONAL: correlacion-cervical
      eva: 6,
      zona: "Fosa temporal anterior e intraauricular",
      caracteristicas: "Sordo, opresivo, continuo, punzante",
      factores: "Aumenta al masticar chicles, pan duro. Disminuye al usar calor local o relajaci\xF3n muscular.",
      contacto: "Prematuro",
      estabilidad: "Irregular",
      angle: "Clase II",
      esqueletal: "Retrognata",
      cdi: ["I.a", "II.a"],
      observaciones: "Dolor miofascial con clic rec\xEDproco a la apertura del lado izquierdo. Sin limitaci\xF3n marcada de la apertura.",
      plan: "Terapia manual de masetero y temporal, ejercicios de control motor y pauta de no masticar chicle. Valorar f\xE9rula y control en 4 semanas."
    };
  }

  // js/storage/db.js
  var DB_NAME = "fichas_atm_db";
  var DB_VERSION = 1;
  var LS_FICHAS_KEY = "fichas_atm_local_store";
  var LS_SETTINGS_KEY = "fichas_atm_settings_store";
  var dbInstance = null;
  var useLocalStorageFallback = false;
  function initDb() {
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
        console.warn("Excepci\xF3n al acceder a IndexedDB, usando LocalStorage:", err);
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
  async function saveFicha(rawFicha) {
    const db = await initDb();
    const ficha = coerceFicha(rawFicha);
    if (!ficha.id) {
      ficha.id = `ficha_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    ficha.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
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
  async function listFichas() {
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
  async function deleteFicha(id) {
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
  async function saveSetting(key, value) {
    const db = await initDb();
    if (useLocalStorageFallback || !db) {
      const settings = lsGetSettings();
      settings[key] = { key, value, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      lsSetSettings(settings);
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction("settings", "readwrite");
      const store = tx.objectStore("settings");
      const req = store.put({ key, value, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error("Error al guardar la configuraci\xF3n"));
    });
  }
  async function getSetting(key, defaultValue = null) {
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
      req.onerror = () => reject(req.error || new Error("Error al obtener la configuraci\xF3n"));
    });
  }
  function sanitizeFilename(str) {
    return String(str || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_").slice(0, 40) || "ficha";
  }
  function downloadJsonFile(filename, data) {
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
  async function exportSingleFicha(ficha) {
    if (!ficha) return;
    const nameSlug = sanitizeFilename(ficha.nombre || "paciente");
    const dateStr = ficha.fechaSesion ? ficha.fechaSesion.slice(0, 10) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const filename = `ficha-atm_${nameSlug}_${dateStr}.json`;
    const payload = {
      app: "Fichas-ATM",
      tipo: "ficha_individual",
      version: 1,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      paciente: ficha.nombre || "Sin nombre",
      totalFichas: 1,
      fichas: [ficha],
      ...ficha
    };
    downloadJsonFile(filename, payload);
  }
  async function exportPatientFichas(patientName, sessions) {
    if (!Array.isArray(sessions) || !sessions.length) return;
    const nameSlug = sanitizeFilename(patientName || sessions[0]?.nombre || "paciente");
    const filename = `fichas-atm_${nameSlug}_${sessions.length}_sesiones.json`;
    const payload = {
      app: "Fichas-ATM",
      tipo: "paciente",
      version: 1,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      paciente: patientName || sessions[0]?.nombre || "Sin nombre",
      totalFichas: sessions.length,
      fichas: sessions
    };
    downloadJsonFile(filename, payload);
  }
  async function exportGroupFichas(fichas, label = "seleccion") {
    if (!Array.isArray(fichas) || !fichas.length) return;
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const filename = `fichas-atm_${sanitizeFilename(label)}_${fichas.length}_fichas_${dateStr}.json`;
    const payload = {
      app: "Fichas-ATM",
      tipo: "grupo_fichas",
      version: 1,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      totalFichas: fichas.length,
      fichas
    };
    downloadJsonFile(filename, payload);
  }
  async function exportBackup() {
    const [fichas, clinician] = await Promise.all([
      listFichas(),
      getSetting("clinician", null)
    ]);
    const payload = {
      app: "Fichas-ATM",
      tipo: "respaldo_completo",
      version: 1,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      clinician,
      totalFichas: fichas.length,
      fichas
    };
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    downloadJsonFile(`backup-fichas-atm-${dateStr}.json`, payload);
  }
  async function importBackup(source) {
    let content = "";
    if (typeof source === "string") {
      content = source;
    } else if (source instanceof Blob || source instanceof File) {
      content = await source.text();
    } else {
      throw new Error("Fuente de datos de importaci\xF3n no v\xE1lida");
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
      throw new Error("El archivo no tiene un formato v\xE1lido de fichas de ATM");
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
        if (!coerced.updatedAt) coerced.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        map.set(coerced.id, coerced);
        importedCount++;
      }
      lsSetFichas([...map.values()]);
    } else {
      await new Promise((resolve, reject) => {
        const tx = db.transaction("fichas", "readwrite");
        const store = tx.objectStore("fichas");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error("Error durante la importaci\xF3n"));
        for (const item of rawFichas) {
          if (!item || typeof item !== "object") continue;
          const coerced = coerceFicha(item);
          if (!coerced.id) {
            coerced.id = `ficha_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
          }
          if (!coerced.updatedAt) coerced.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
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

  // js/modules/dom.js
  function escapeHtml(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function formatDate(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "\u2014";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  function node(tag, className = "", text = "") {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== "" && text !== null && text !== void 0) el.textContent = String(text);
    return el;
  }
  function field(label, value) {
    const box = node("div", "pf-field");
    box.append(node("span", "pf-k", label), node("span", "pf-v", value || "\u2014"));
    return box;
  }
  function side(left, right) {
    const isLeft = Boolean(left && left !== "No" && left !== "0" && left !== "false");
    const isRight = Boolean(right && right !== "No" && right !== "0" && right !== "false");
    if (isLeft && isRight) return "Bilateral";
    if (isLeft) return "Izquierda";
    if (isRight) return "Derecha";
    return "";
  }
  function section(title) {
    const sec = node("section", "pf-section");
    sec.append(node("h2", "", title));
    return sec;
  }
  function grid(fields) {
    const g = node("div", "pf-grid");
    for (const [k, v] of fields) {
      if (v !== void 0 && v !== null && v !== "") {
        g.append(field(k, v));
      }
    }
    return g.childElementCount > 0 ? g : null;
  }
  function prose(label, value) {
    if (!value) return null;
    const box = node("div", "pf-prose");
    box.append(node("span", "pf-k", label), node("p", "", value));
    return box;
  }
  function formatParts(parts, sep = " \xB7 ") {
    return parts.filter(Boolean).join(sep);
  }
  function add(parent, child) {
    if (child) parent.append(child);
  }
  var dialogQueue = Promise.resolve();
  function enqueueDialog(task) {
    const run = dialogQueue.then(task, task);
    dialogQueue = run.then(() => {
    }, () => {
    });
    return run;
  }
  function dialogAlert(message, options = {}) {
    const msgStr = String(message ?? "");
    const inferredSuccess = options.type === "success" || /(éxito|correctamente|restauraron|guardados|guardado|importó|importaron)/i.test(msgStr);
    const inferredDanger = options.type === "danger" || !inferredSuccess && /(error|falló|supera|inválido|no es|no se pudo|falta)/i.test(msgStr);
    const finalType = options.type || (inferredSuccess ? "success" : inferredDanger ? "danger" : "info");
    return enqueueDialog(() => openDialog({ message: msgStr, confirm: false, alertType: finalType }));
  }
  function dialogConfirm(message, options = {}) {
    return enqueueDialog(
      () => openDialog({
        message,
        confirm: true,
        danger: Boolean(options.danger),
        okText: options.okText,
        cancelText: options.cancelText
      })
    );
  }
  function openDialog({ message, confirm, danger, okText, cancelText, alertType }) {
    return new Promise((resolve) => {
      const root = document.createElement("div");
      root.className = "app-dialog";
      root.setAttribute("role", "presentation");
      const card = document.createElement("div");
      let cardClasses = "app-dialog-card";
      if (confirm && danger) {
        cardClasses += " is-danger";
      } else if (!confirm) {
        if (alertType === "success") cardClasses += " is-success";
        else if (alertType === "danger") cardClasses += " is-danger";
      }
      card.className = cardClasses;
      card.setAttribute("role", confirm ? "dialog" : "alertdialog");
      card.setAttribute("aria-modal", "true");
      const text = document.createElement("p");
      text.className = "app-dialog-text";
      text.textContent = String(message ?? "");
      const actions = document.createElement("div");
      actions.className = "app-dialog-actions";
      const ok = document.createElement("button");
      ok.type = "button";
      if (confirm) {
        ok.className = danger ? "btn danger" : "btn green";
        ok.textContent = okText || (danger ? "Quitar" : "Confirmar");
      } else {
        ok.className = alertType === "danger" ? "btn danger" : "btn green";
        ok.textContent = okText || "Entendido";
      }
      let cancel = null;
      if (confirm) {
        cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "btn light";
        cancel.textContent = cancelText || "Cancelar";
        actions.append(cancel);
      }
      actions.append(ok);
      card.append(text, actions);
      root.append(card);
      document.body.append(root);
      const finish = (value) => {
        document.removeEventListener("keydown", onKey);
        root.remove();
        resolve(value);
      };
      const onKey = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          finish(confirm ? false : void 0);
        } else if (event.key === "Enter") {
          event.preventDefault();
          finish(confirm ? true : void 0);
        }
      };
      cancel?.addEventListener("click", () => finish(false));
      ok.addEventListener("click", () => finish(confirm ? true : void 0));
      root.addEventListener("click", (event) => {
        if (event.target === root) finish(confirm ? false : void 0);
      });
      document.addEventListener("keydown", onKey);
      ok.focus();
    });
  }
  function debounce(fn, delay = 150) {
    let timer = null;
    return (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // js/modules/form-image.js
  async function compressImage(file, {
    maxDimension = 1920,
    quality = 0.85,
    maxSizeBytes = 5 * 1024 * 1024,
    preserveTransparency = false
  } = {}) {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Formato de imagen no compatible. Us\xE1 JPG, PNG o WebP.");
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("No se pudo leer el archivo de imagen."));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error("El archivo no es una imagen v\xE1lida o est\xE1 da\xF1ado."));
        img.onload = () => {
          try {
            let { width, height } = img;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round(height * maxDimension / width);
                width = maxDimension;
              } else {
                width = Math.round(width * maxDimension / height);
                height = maxDimension;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              if (file.size > maxSizeBytes) {
                reject(new Error("La imagen supera los 5 MB permitidos."));
                return;
              }
              resolve(file);
              return;
            }
            const isPng = file.type === "image/png";
            const keepAlpha = preserveTransparency || isPng && preserveTransparency !== false;
            if (!keepAlpha) {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, width, height);
            }
            ctx.drawImage(img, 0, 0, width, height);
            let outputType = "image/jpeg";
            let ext = "jpg";
            if (keepAlpha && isPng) {
              outputType = "image/png";
              ext = "png";
            } else if (file.type === "image/webp") {
              outputType = "image/webp";
              ext = "webp";
            }
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  if (file.size > maxSizeBytes) {
                    reject(new Error("La imagen supera los 5 MB permitidos."));
                    return;
                  }
                  resolve(file);
                  return;
                }
                if (blob.size > maxSizeBytes) {
                  reject(new Error("La imagen optimizada supera el l\xEDmite de 5 MB. Prob\xE1 con una imagen m\xE1s liviana."));
                  return;
                }
                const optimized = new File([blob], `adjunto.${ext}`, {
                  type: outputType,
                  lastModified: Date.now()
                });
                resolve(optimized);
              },
              outputType,
              quality
            );
          } catch (err) {
            reject(err);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
  async function makeWhiteTransparent(dataUrl, threshold = 215) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onerror = () => reject(new Error("No se pudo procesar la imagen para transparencia."));
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            if (r >= threshold && g >= threshold && b >= threshold) {
              d[i + 3] = 0;
            } else if (r >= threshold - 35 && g >= threshold - 35 && b >= threshold - 35) {
              const brightness = (r + g + b) / 3;
              const factor = Math.max(0, Math.min(1, (255 - brightness) / 45));
              d[i + 3] = Math.round(d[i + 3] * factor);
            }
          }
          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          reject(err);
        }
      };
      img.src = dataUrl;
    });
  }
  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Error al convertir imagen"));
      reader.readAsDataURL(blob);
    });
  }

  // js/modules/form-restrictions.js
  function setupInputRestrictions(formEl) {
    if (!formEl) return;
    const edadInput = formEl.elements.edad;
    if (edadInput) {
      edadInput.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" || e.key === "Delete" || e.key === "Tab" || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Home" || e.key === "End" || e.key === "Enter" || e.ctrlKey || e.metaKey) {
          return;
        }
        if (!/^\d$/.test(e.key)) {
          e.preventDefault();
        }
      });
      edadInput.addEventListener("input", () => {
        let clean = edadInput.value.replace(/\D/g, "");
        if (clean.length > 3) clean = clean.slice(0, 3);
        if (edadInput.value !== clean) {
          edadInput.value = clean;
        }
        if (clean) {
          const n = Number(clean);
          const valid = Number.isInteger(n) && n >= 1 && n <= 120;
          edadInput.classList.toggle("input-error", !valid);
          edadInput.title = valid ? "" : "La edad debe ser un n\xFAmero entero entre 1 y 120";
        } else {
          edadInput.title = "";
        }
      });
    }
    const measurementNames = [
      "aperturaLibre",
      "aperturaDolor",
      "protrusion",
      "latIzq",
      "latDer",
      "aperturaLibrePost",
      "aperturaDolorPost",
      "protrusionPost",
      "latIzqPost",
      "latDerPost"
    ];
    measurementNames.forEach((name) => {
      const el = formEl.elements[name];
      if (!el) return;
      el.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" || e.key === "Delete" || e.key === "Tab" || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Home" || e.key === "End" || e.key === "Enter" || e.ctrlKey || e.metaKey) {
          return;
        }
        if (e.key === "." || e.key === ",") {
          if (el.value.includes(".") || el.value.includes(",")) {
            e.preventDefault();
          }
          return;
        }
        if (!/^\d$/.test(e.key)) {
          e.preventDefault();
        }
      });
      el.addEventListener("input", () => {
        let val = el.value.replace(",", ".");
        val = val.replace(/[^\d.]/g, "");
        const parts = val.split(".");
        if (parts.length > 2) {
          val = parts[0] + "." + parts.slice(1).join("");
        }
        if (el.value !== val) {
          el.value = val;
        }
        if (val) {
          const maxVal = 500;
          const n = Number(val);
          const valid = !Number.isNaN(n) && n >= 0 && n <= maxVal;
          el.classList.toggle("input-error", !valid);
          el.title = valid ? "" : "Debe ser un n\xFAmero entre 0 y 500 mm";
        } else {
          el.title = "";
        }
      });
    });
    const dniInput = formEl.elements.dni;
    if (dniInput) {
      dniInput.addEventListener("input", () => {
        const clean = dniInput.value.replace(/[^a-zA-Z0-9.\s-]/g, "");
        if (dniInput.value !== clean) {
          dniInput.value = clean;
        }
      });
    }
    const nombreInput = formEl.elements.nombre;
    if (nombreInput) {
      nombreInput.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" || e.key === "Delete" || e.key === "Tab" || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End" || e.key === "Enter" || e.ctrlKey || e.metaKey) {
          return;
        }
        if (/^\d$/.test(e.key)) {
          e.preventDefault();
        }
      });
      nombreInput.addEventListener("input", () => {
        const clean = nombreInput.value.replace(/\d/g, "");
        if (nombreInput.value !== clean) {
          nombreInput.value = clean;
        }
      });
    }
  }

  // js/modules/form.js
  var form = document.querySelector("#ficha");
  var formView = document.querySelector("#view-form");
  var evaInput = form ? form.elements.eva : null;
  var evaValue = document.querySelector("#eva-value");
  var compareFormBtn = document.querySelector("#btn-compare-form");
  var btnPdfHistory = document.querySelector("#btn-pdf-history");
  var btnBack = document.querySelector("#btn-back");
  var btnPrev = document.querySelector("#btn-prev");
  var btnNext = document.querySelector("#btn-next");
  var fotoInput = document.querySelector("#foto-input");
  var fieldFotoUrl = document.querySelector("#field-foto-url");
  var fotoDropzone = document.querySelector("#foto-dropzone");
  var fotoLoading = document.querySelector("#foto-loading");
  var fotoLoadingText = document.querySelector("#foto-loading-text");
  var fotoPreviewContainer = document.querySelector("#foto-preview-container");
  var fotoPreviewImg = document.querySelector("#foto-preview-img");
  var btnFotoSelect = document.querySelector("#btn-foto-select");
  var btnFotoChange = document.querySelector("#btn-foto-change");
  var btnFotoRemove = document.querySelector("#btn-foto-remove");
  var btnFotoRemoveCurrent = document.querySelector("#btn-foto-remove-current");
  var btnFotoView = document.querySelector("#btn-foto-view");
  var fotoGalleryGrid = document.querySelector("#foto-gallery-grid");
  var fotoPreviewStatus = document.querySelector("#foto-preview-status");
  var step = 0;
  var currentId = null;
  var formBaseline = "";
  var singles = {};
  var activeSessionUserGetter = null;
  var currentAllFichas = [];
  var identityKey = "";
  var identityEdited = false;
  var uploadInFlight = null;
  var currentFotos = [];
  var selectedFotoIdx = 0;
  function syncFotoPreview(urls) {
    let list = [];
    if (Array.isArray(urls)) {
      list = urls.map((u, i) => {
        const trimmed = typeof u === "string" ? u.trim() : "";
        if (trimmed.includes("/admin/api/foto.php")) {
          return i === 0 ? DEMO_PHOTO_1 : DEMO_PHOTO_2;
        }
        return trimmed;
      }).filter(Boolean);
    } else if (typeof urls === "string" && urls.trim()) {
      let u = urls.trim();
      if (u.includes("/admin/api/foto.php")) u = DEMO_PHOTO_1;
      list = [u];
    }
    currentFotos = list;
    if (selectedFotoIdx >= currentFotos.length) {
      selectedFotoIdx = Math.max(0, currentFotos.length - 1);
    }
    const primaryUrl = currentFotos[selectedFotoIdx] || currentFotos[0] || "";
    if (fieldFotoUrl) fieldFotoUrl.value = primaryUrl;
    if (fotoLoading) fotoLoading.hidden = true;
    if (currentFotos.length > 0) {
      if (fotoPreviewImg) {
        fotoPreviewImg.onerror = () => {
          fotoPreviewImg.onerror = null;
          fotoPreviewImg.src = DEMO_PHOTO_1;
        };
        fotoPreviewImg.src = primaryUrl;
      }
      if (btnFotoView) btnFotoView.href = primaryUrl;
      if (fotoPreviewContainer) fotoPreviewContainer.hidden = false;
      if (fotoDropzone) fotoDropzone.hidden = true;
      if (fotoPreviewStatus) {
        fotoPreviewStatus.textContent = currentFotos.length === 1 ? "\u2713 1 foto adjunta en la sesi\xF3n" : `\u2713 ${currentFotos.length} fotos adjuntas (viendo ${selectedFotoIdx + 1} de ${currentFotos.length})`;
      }
      if (btnFotoRemoveCurrent) {
        btnFotoRemoveCurrent.hidden = false;
        btnFotoRemoveCurrent.textContent = currentFotos.length > 1 ? `\u{1F5D1}\uFE0F Eliminar foto ${selectedFotoIdx + 1}` : "\u{1F5D1}\uFE0F Eliminar foto";
      }
      if (fotoGalleryGrid) {
        fotoGalleryGrid.innerHTML = "";
        currentFotos.forEach((fUrl, idx) => {
          const itemDiv = document.createElement("div");
          itemDiv.className = `foto-gallery-item ${idx === selectedFotoIdx ? "is-selected" : ""}`;
          itemDiv.title = `Foto ${idx + 1} de ${currentFotos.length} (hac\xE9 clic para verla en grande)`;
          const thumb = document.createElement("img");
          thumb.className = "foto-gallery-thumb";
          thumb.onerror = () => {
            thumb.onerror = null;
            thumb.src = idx === 0 ? DEMO_PHOTO_1 : DEMO_PHOTO_2;
          };
          thumb.src = fUrl;
          thumb.alt = `Miniatura foto ${idx + 1}`;
          const badge = document.createElement("span");
          badge.className = "foto-gallery-badge";
          badge.textContent = `${idx + 1}/${currentFotos.length}`;
          const delBtn = document.createElement("button");
          delBtn.type = "button";
          delBtn.className = "foto-gallery-delete";
          delBtn.title = `Eliminar foto ${idx + 1}`;
          delBtn.setAttribute("aria-label", `Eliminar foto ${idx + 1}`);
          delBtn.innerHTML = "\xD7";
          delBtn.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            const ok = await dialogConfirm(`\xBFDese\xE1s quitar la foto ${idx + 1} de la sesi\xF3n?`);
            if (ok) {
              const updated = currentFotos.filter((_, i) => i !== idx);
              if (selectedFotoIdx >= updated.length) {
                selectedFotoIdx = Math.max(0, updated.length - 1);
              }
              syncFotoPreview(updated);
            }
          });
          itemDiv.appendChild(thumb);
          itemDiv.appendChild(badge);
          itemDiv.appendChild(delBtn);
          itemDiv.addEventListener("click", () => {
            selectedFotoIdx = idx;
            const chosen = currentFotos[idx];
            if (fieldFotoUrl) fieldFotoUrl.value = chosen;
            if (fotoPreviewImg) {
              fotoPreviewImg.onerror = () => {
                fotoPreviewImg.onerror = null;
                fotoPreviewImg.src = idx === 0 ? DEMO_PHOTO_1 : DEMO_PHOTO_2;
              };
              fotoPreviewImg.src = chosen;
            }
            if (btnFotoView) btnFotoView.href = chosen;
            if (fotoPreviewStatus) {
              fotoPreviewStatus.textContent = currentFotos.length === 1 ? "\u2713 1 foto adjunta en la sesi\xF3n" : `\u2713 ${currentFotos.length} fotos adjuntas (viendo ${idx + 1} de ${currentFotos.length})`;
            }
            if (btnFotoRemoveCurrent) {
              btnFotoRemoveCurrent.textContent = currentFotos.length > 1 ? `\u{1F5D1}\uFE0F Eliminar foto ${idx + 1}` : "\u{1F5D1}\uFE0F Eliminar foto";
            }
            fotoGalleryGrid.querySelectorAll(".foto-gallery-item").forEach((el, i) => {
              el.classList.toggle("is-selected", i === idx);
            });
          });
          fotoGalleryGrid.appendChild(itemDiv);
        });
        fotoGalleryGrid.hidden = false;
      }
    } else {
      if (fotoPreviewImg) {
        fotoPreviewImg.onerror = null;
        fotoPreviewImg.src = "";
      }
      if (btnFotoView) btnFotoView.href = "#";
      if (fotoPreviewContainer) fotoPreviewContainer.hidden = true;
      if (fotoGalleryGrid) {
        fotoGalleryGrid.innerHTML = "";
        fotoGalleryGrid.hidden = true;
      }
      if (btnFotoRemoveCurrent) btnFotoRemoveCurrent.hidden = true;
      if (fotoDropzone) fotoDropzone.hidden = false;
    }
  }
  function todayISO() {
    const d = /* @__PURE__ */ new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }
  function blank() {
    return {
      id: crypto.randomUUID(),
      savedAt: null,
      ...emptyFicha(),
      fechaSesion: todayISO()
    };
  }
  function readForm() {
    if (!form) return coerceFicha({});
    const raw = {
      id: currentId || crypto.randomUUID(),
      savedAt: (/* @__PURE__ */ new Date()).toISOString(),
      ...singles
    };
    const fd = new FormData(form);
    for (const [key, val] of fd.entries()) {
      if (key !== "cdi") raw[key] = val;
    }
    for (const el of form.querySelectorAll('input[type="checkbox"]')) {
      if (el.name && el.name !== "cdi") raw[el.name] = el.checked;
    }
    raw.cdi = [...form.querySelectorAll('input[name="cdi"]:checked')].map((el) => el.value);
    if (evaInput) raw.eva = evaInput.value;
    if (document.querySelector("#field-profesional")?.hidden) {
      delete raw.profesional;
    }
    if (!raw.edad && raw.nacimiento) {
      raw.edad = ageOn(raw.nacimiento, raw.fechaSesion || todayISO());
    }
    const dniOn = document.querySelector("#btn-dni-power")?.classList.contains("is-on") !== false;
    raw.sinDocumento = !dniOn;
    if (!dniOn) raw.dni = "";
    raw.fotosUrls = [...currentFotos];
    raw.fotoUrl = currentFotos[0] || "";
    return coerceFicha(raw);
  }
  function formState() {
    const data = readForm();
    delete data.id;
    delete data.savedAt;
    return JSON.stringify(data);
  }
  function fillForm(data, allFichas = []) {
    if (!form) return;
    currentId = data.id;
    step = 0;
    form.reset();
    Object.keys(singles).forEach((k) => delete singles[k]);
    for (const [key, value] of Object.entries(data)) {
      if (key === "id" || key === "savedAt" || key === "cdi") continue;
      const el = form.elements[key];
      if (!el) {
        if (form.querySelector(`[data-single="${key}"]`)) singles[key] = value || "";
        continue;
      }
      if (el instanceof RadioNodeList || el instanceof HTMLCollection) {
        for (const node2 of el) {
          if (node2.type === "checkbox") node2.checked = Boolean(value);
          else node2.value = value ?? "";
        }
        continue;
      }
      if (el.type === "checkbox") el.checked = Boolean(value);
      else el.value = value ?? "";
    }
    for (const el of form.querySelectorAll('input[name="cdi"]')) {
      el.checked = (data.cdi || []).includes(el.value);
    }
    document.querySelectorAll("[data-single]").forEach((group) => {
      const key = group.dataset.single;
      group.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("on", btn.dataset.value === (data[key] || ""));
      });
      if (data[key]) singles[key] = data[key];
    });
    syncFollowups();
    syncEva();
    updateStepValidation();
    const preAccordion = form.querySelector(".mediciones-accordion");
    if (preAccordion) preAccordion.open = true;
    const postAccordion = document.querySelector("#details-mediciones-post");
    if (postAccordion) {
      const hasPostData = Boolean(
        data.aperturaLibrePost || data.aperturaDolorPost || data.desviacionPost || data.desvIzqPost || data.desvDerPost || data.desvCorregidaPost || data.deflexionPost || data.protrusionPost || data.latIzqPost || data.latDerPost
      );
      postAccordion.open = hasPostData;
    }
    const sessionUser = typeof activeSessionUserGetter === "function" ? activeSessionUserGetter() : null;
    const profField = document.querySelector("#field-profesional");
    if (profField) {
      profField.hidden = false;
    }
    if (form.elements.profesional) {
      form.elements.profesional.value = data.profesional || sessionUser?.id || "";
    }
    const pSessions = data.dni || data.nombre ? allFichas.filter((f) => patientKey(f) === patientKey(data)) : [];
    if (compareFormBtn) {
      compareFormBtn.hidden = pSessions.length < 2;
    }
    if (btnPdfHistory) {
      btnPdfHistory.hidden = pSessions.length < 2;
    }
    currentAllFichas = allFichas;
    const pKey = data.dni || data.nombre ? patientKey(data) : "";
    populatePatientPicker(allFichas, pKey);
    if (pKey && pSessions.length > 0) {
      const isEdit = allFichas.some((f) => f.id === data.id);
      const sessionIdx = getSessionIndex(data, allFichas);
      setPatientLocked(true, data, isEdit ? sessionIdx : pSessions.length, isEdit);
    } else {
      setPatientLocked(false);
    }
    setDniPower(!data?.sinDocumento);
    const initialFotos = Array.isArray(data?.fotosUrls) && data.fotosUrls.length > 0 ? data.fotosUrls : data?.fotoUrl ? [data.fotoUrl] : [];
    selectedFotoIdx = 0;
    syncFotoPreview(initialFotos);
    showStep(0);
  }
  function setDniPower(on, { clear = false } = {}) {
    const btn = document.querySelector("#btn-dni-power");
    const input = form?.elements.dni;
    const locked = document.querySelector("#patient-fixed-section")?.classList.contains("is-locked");
    if (btn) {
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.title = on ? "Documento obligatorio. Toc\xE1 para no pedirlo." : "Sin documento. Toc\xE1 para volver a pedirlo.";
    }
    if (!input) return;
    if (!on) {
      if (clear) input.value = "";
      input.disabled = true;
      input.required = false;
      input.readOnly = true;
      input.classList.remove("input-error");
      return;
    }
    input.disabled = false;
    input.required = true;
    input.readOnly = Boolean(locked);
  }
  function setPatientLocked(locked, patientData = null, sessionCount = 0, isEdit = false, keepValues = false) {
    const fixedSection = document.querySelector("#patient-fixed-section");
    const banner = document.querySelector("#patient-status-banner");
    const nameSpan = document.querySelector("#patient-status-name");
    const dniSpan = document.querySelector("#patient-status-dni");
    const sessionsSpan = document.querySelector("#patient-status-sessions");
    const newToggle = document.querySelector("#btn-patient-new-toggle");
    const sessionBadge = document.querySelector("#session-count-badge");
    const inputs = [
      form?.elements.nombre,
      form?.elements.dni,
      form?.elements.nacimiento,
      form?.elements.lugarNac,
      form?.elements.antecedentes
    ].filter(Boolean);
    const habitChecks = [
      form?.elements.habitoApretamiento,
      form?.elements.habitoBruxismo,
      form?.elements.habitoMasticacionUni,
      form?.elements.habitoOnicofagia
    ].filter(Boolean);
    const editBtn = document.querySelector("#btn-edit-primary");
    if (locked) {
      identityKey = patientKey(patientData || {});
      identityEdited = false;
      if (fixedSection) fixedSection.classList.add("is-locked");
      inputs.forEach((input) => input.readOnly = true);
      habitChecks.forEach((chk) => chk.disabled = true);
      document.querySelectorAll('[data-single="motivo"] button').forEach((btn) => btn.disabled = true);
      if (banner) banner.hidden = false;
      if (newToggle) newToggle.hidden = false;
      if (nameSpan) nameSpan.textContent = patientData?.nombre || form?.elements.nombre?.value || "";
      if (dniSpan) dniSpan.textContent = patientData?.dni || form?.elements.dni?.value || "\u2014";
      if (sessionsSpan) {
        sessionsSpan.textContent = sessionCount > 0 ? `${sessionCount} ${sessionCount === 1 ? "sesi\xF3n registrada" : "sesiones registradas"}` : "Sin sesiones previas";
      }
      if (sessionBadge) {
        if (isEdit) {
          sessionBadge.textContent = sessionCount > 0 ? `Editando Sesi\xF3n N\xB0 ${sessionCount}` : "Editando ficha";
        } else {
          sessionBadge.textContent = sessionCount > 0 ? `Nueva consulta \xB7 Sesi\xF3n N\xB0 ${sessionCount + 1}` : "1\xAA Consulta \xB7 Evaluaci\xF3n inicial";
        }
      }
      if (editBtn) editBtn.hidden = false;
    } else {
      if (fixedSection) fixedSection.classList.remove("is-locked");
      inputs.forEach((input) => input.readOnly = false);
      habitChecks.forEach((chk) => chk.disabled = false);
      document.querySelectorAll('[data-single="motivo"] button').forEach((btn) => btn.disabled = false);
      if (banner) banner.hidden = true;
      if (newToggle) newToggle.hidden = true;
      if (sessionBadge && !keepValues) {
        sessionBadge.textContent = "1\xAA Consulta \xB7 Evaluaci\xF3n inicial";
      }
      if (editBtn) editBtn.hidden = true;
      if (keepValues) identityEdited = true;
      else {
        identityKey = "";
        identityEdited = false;
      }
    }
    const powerBtn = document.querySelector("#btn-dni-power");
    if (powerBtn) powerBtn.disabled = locked;
    setDniPower(powerBtn ? powerBtn.classList.contains("is-on") : true);
  }
  function populatePatientPicker(allFichas = [], selectedKey = "") {
    const select = document.querySelector("#patient-quick-select");
    const card = document.querySelector("#patient-picker-card");
    if (!select) return;
    const patients = getUniquePatients(allFichas);
    if (card) card.hidden = patients.length === 0;
    select.innerHTML = '<option value="">\u2014 Cargar nuevo paciente (o seleccionar existente) \u2014</option>';
    for (const p of patients) {
      const opt = document.createElement("option");
      opt.value = p.key;
      opt.textContent = `${p.nombre} (DNI ${p.dni || "\u2014"}) \xB7 ${p.sessions.length} ses.`;
      select.append(opt);
    }
    select.value = selectedKey || "";
  }
  function syncAge() {
    if (!form) return;
    const birth = form.elements.nacimiento?.value;
    const session = form.elements.fechaSesion?.value || todayISO();
    if (birth) {
      const calculated = ageOn(birth, session);
      if (calculated && form.elements.edad) {
        const num = parseInt(calculated, 10);
        if (Number.isInteger(num) && num >= 1 && num <= 120) {
          form.elements.edad.value = String(num);
          form.elements.edad.classList.remove("input-error");
          form.elements.edad.title = "";
        }
      }
    }
  }
  function updateStepValidation() {
    const data = readForm();
    const missingKeys = missingFieldKeys(data);
    const step0Val = validateStep(0, data);
    const dot0 = document.querySelector('#view-form .steps button[data-step="0"] .step-dot');
    if (dot0) dot0.hidden = missingKeys.length === 0 && step0Val.isValid;
    const step1Val = validateStep(1, data);
    const dot1 = document.querySelector('#view-form .steps button[data-step="1"] .step-dot');
    if (dot1) dot1.hidden = step1Val.isValid;
  }
  function highlightMissingFields(keys = []) {
    if (!form) return;
    for (const [key] of REQUIRED_FIELDS) {
      const el = form.elements[key];
      if (el) el.classList.toggle("input-error", keys.includes(key));
    }
  }
  function highlightErrorFields(keys = []) {
    if (!form) return;
    const sideConfig = {
      ruidos: { follow: "ruidos", checks: ["ruidosIzq", "ruidosDer"] },
      dolorCondilar: { follow: "dolorCondilar", checks: ["condilarIzq", "condilarDer"] },
      desviacion: { follow: "desviacion", checks: ["desvIzq", "desvDer"] },
      desviacionPost: { follow: "desviacionPost", checks: ["desvIzqPost", "desvDerPost"] }
    };
    keys.forEach((key) => {
      const el = form.elements[key];
      if (el) el.classList.add("input-error");
      if (sideConfig[key]) {
        const cfg = sideConfig[key];
        const fg = form.querySelector(`[data-follow="${cfg.follow}"] .follow-group`);
        if (fg) fg.classList.add("input-error");
        cfg.checks.forEach((chkName) => {
          form.elements[chkName]?.classList.add("input-error");
        });
      }
    });
  }
  function evaMeta(val) {
    const n = Number(val) || 0;
    if (n === 0) return { label: "0 / 10 \xB7 Sin dolor", level: "zero" };
    if (n <= 3) return { label: `${n} / 10 \xB7 Dolor leve`, level: "mild" };
    if (n <= 6) return { label: `${n} / 10 \xB7 Dolor moderado`, level: "moderate" };
    return { label: `${n} / 10 \xB7 Dolor severo`, level: "severe" };
  }
  function syncEva() {
    if (!evaInput || !evaValue) return;
    const meta = evaMeta(evaInput.value);
    evaValue.textContent = meta.label;
    evaValue.dataset.level = meta.level;
  }
  function syncFollowups() {
    document.querySelectorAll("[data-follow]").forEach((box) => {
      const show = singles[box.dataset.follow] === "S\xED";
      box.hidden = !show;
      if (!show) {
        box.querySelectorAll("input").forEach((input) => {
          input.checked = false;
          input.classList.remove("input-error");
        });
        box.querySelectorAll(".follow-group").forEach((fg) => {
          fg.classList.remove("input-error");
        });
      }
    });
  }
  function showStep(index = 0) {
    const num = Number(index);
    const validStep = Number.isInteger(num) && num >= 0 && num <= 5 ? num : 0;
    step = validStep;
    document.querySelectorAll("#view-form .panel").forEach((panel) => {
      panel.hidden = Number(panel.dataset.panel) !== validStep;
    });
    document.querySelectorAll("#view-form .steps button").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.step) === validStep);
    });
    if (btnPrev) btnPrev.hidden = validStep === 0;
    if (btnNext) btnNext.hidden = validStep === 5;
  }
  function showForm(targetStep = 0) {
    const libraryView3 = document.querySelector("#view-library");
    const compareView2 = document.querySelector("#view-compare");
    const gateView = document.querySelector("#view-gate");
    const dashView = document.querySelector("#view-dashboard");
    const pacView = document.querySelector("#view-pacientes");
    const horView = document.querySelector("#view-horarios");
    if (gateView) gateView.hidden = true;
    if (libraryView3) libraryView3.hidden = true;
    if (compareView2) compareView2.hidden = true;
    if (dashView) dashView.hidden = true;
    if (pacView) pacView.hidden = true;
    if (horView) horView.hidden = true;
    if (formView) {
      formView.hidden = false;
      try {
        window.scrollTo({ top: 0, behavior: "instant" });
      } catch {
      }
    }
    try {
      sessionStorage.setItem("fichas_atm_view", JSON.stringify({ view: "form", id: currentId }));
    } catch {
    }
    const initialStep = typeof targetStep === "number" && Number.isInteger(targetStep) && targetStep >= 0 && targetStep <= 4 ? targetStep : 0;
    showStep(initialStep);
    formBaseline = formState();
  }
  function initForm({ onSave, onBack, onCompare, onPrint, getSessionUser }) {
    if (!form) return;
    activeSessionUserGetter = getSessionUser;
    setupInputRestrictions(form);
    document.querySelectorAll("[data-single]").forEach((group) => {
      group.addEventListener("click", (event) => {
        const btn = event.target.closest("button");
        if (!btn) return;
        const key = group.dataset.single;
        const next = singles[key] === btn.dataset.value ? "" : btn.dataset.value;
        singles[key] = next;
        group.querySelectorAll("button").forEach((el) => {
          el.classList.toggle("on", el.dataset.value === next);
        });
        syncFollowups();
        updateStepValidation();
      });
    });
    document.querySelectorAll("#view-form .steps button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const s = Number(btn.dataset.step);
        showStep(Number.isInteger(s) ? s : 0);
      });
    });
    if (evaInput) {
      evaInput.addEventListener("input", syncEva);
    }
    form.elements.nacimiento?.addEventListener("change", () => {
      syncAge();
      updateStepValidation();
    });
    form.elements.nacimiento?.addEventListener("input", () => {
      syncAge();
      updateStepValidation();
    });
    form.elements.fechaSesion?.addEventListener("change", () => {
      syncAge();
      updateStepValidation();
    });
    form.elements.fechaSesion?.addEventListener("input", () => {
      syncAge();
      updateStepValidation();
    });
    const patientSelect2 = document.querySelector("#patient-quick-select");
    if (patientSelect2) {
      patientSelect2.addEventListener("change", () => {
        const selectedKey = patientSelect2.value;
        if (!selectedKey) {
          setPatientLocked(false);
          setDniPower(true);
          form.elements.nombre.value = "";
          form.elements.dni.value = "";
          form.elements.nacimiento.value = "";
          form.elements.lugarNac.value = "";
          form.elements.edad.value = "";
          singles.motivo = "";
          document.querySelectorAll('[data-single="motivo"] button').forEach((b) => b.classList.remove("on"));
          if (form.elements.habitoApretamiento) form.elements.habitoApretamiento.checked = false;
          if (form.elements.habitoBruxismo) form.elements.habitoBruxismo.checked = false;
          if (form.elements.habitoMasticacionUni) form.elements.habitoMasticacionUni.checked = false;
          if (form.elements.habitoOnicofagia) form.elements.habitoOnicofagia.checked = false;
          if (form.elements.antecedentes) form.elements.antecedentes.value = "";
          form.elements.nombre.focus();
          updateStepValidation();
          return;
        }
        const all = currentAllFichas || [];
        const match = all.find((f) => patientKey(f) === selectedKey);
        if (match) {
          form.elements.nombre.value = match.nombre || "";
          form.elements.dni.value = match.dni || "";
          form.elements.nacimiento.value = match.nacimiento || "";
          form.elements.lugarNac.value = match.lugarNac || "";
          if (match.motivo) {
            singles.motivo = match.motivo;
            document.querySelectorAll('[data-single="motivo"] button').forEach((btn) => {
              btn.classList.toggle("on", btn.dataset.value === match.motivo);
            });
          }
          if (form.elements.habitoApretamiento) form.elements.habitoApretamiento.checked = Boolean(match.habitoApretamiento);
          if (form.elements.habitoBruxismo) form.elements.habitoBruxismo.checked = Boolean(match.habitoBruxismo);
          if (form.elements.habitoMasticacionUni) form.elements.habitoMasticacionUni.checked = Boolean(match.habitoMasticacionUni);
          if (form.elements.habitoOnicofagia) form.elements.habitoOnicofagia.checked = Boolean(match.habitoOnicofagia);
          if (match.antecedentes) {
            form.elements.antecedentes.value = match.antecedentes;
          }
          if (form.elements.profesional && match.profesional) {
            form.elements.profesional.value = match.profesional;
          }
          syncAge();
          const pSessions = all.filter((f) => patientKey(f) === selectedKey);
          setDniPower(!match.sinDocumento, { clear: Boolean(match.sinDocumento) });
          setPatientLocked(true, match, pSessions.length, false);
          updateStepValidation();
          form.elements.fechaSesion?.focus();
        }
      });
    }
    const dniPowerBtn = document.querySelector("#btn-dni-power");
    if (dniPowerBtn) {
      dniPowerBtn.addEventListener("click", () => {
        if (dniPowerBtn.disabled) return;
        const on = dniPowerBtn.classList.contains("is-on");
        setDniPower(!on, { clear: on });
        updateStepValidation();
      });
    }
    const editBtn = document.querySelector("#btn-edit-primary");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        setPatientLocked(false, null, 0, false, true);
        form.elements.nombre?.focus();
      });
    }
    const newToggleBtn = document.querySelector("#btn-patient-new-toggle");
    if (newToggleBtn) {
      newToggleBtn.addEventListener("click", () => {
        if (patientSelect2) patientSelect2.value = "";
        setPatientLocked(false);
        setDniPower(true);
        form.elements.nombre.value = "";
        form.elements.dni.value = "";
        form.elements.nacimiento.value = "";
        form.elements.lugarNac.value = "";
        form.elements.edad.value = "";
        singles.motivo = "";
        document.querySelectorAll('[data-single="motivo"] button').forEach((b) => b.classList.remove("on"));
        if (form.elements.habitoApretamiento) form.elements.habitoApretamiento.checked = false;
        if (form.elements.habitoBruxismo) form.elements.habitoBruxismo.checked = false;
        if (form.elements.habitoMasticacionUni) form.elements.habitoMasticacionUni.checked = false;
        if (form.elements.habitoOnicofagia) form.elements.habitoOnicofagia.checked = false;
        if (form.elements.antecedentes) form.elements.antecedentes.value = "";
        form.elements.nombre?.focus();
        updateStepValidation();
      });
    }
    form.addEventListener("input", (e) => {
      if (e.target.classList.contains("input-error") && e.target.value.trim()) {
        const err = validateField(e.target.name, e.target.value, readForm());
        if (!err) {
          e.target.classList.remove("input-error");
          e.target.title = "";
        }
      }
      updateStepValidation();
    });
    form.addEventListener("change", (e) => {
      const sideMap = {
        ruidosIzq: "ruidos",
        ruidosDer: "ruidos",
        condilarIzq: "dolorCondilar",
        condilarDer: "dolorCondilar",
        desvIzq: "desviacion",
        desvDer: "desviacion",
        desvIzqPost: "desviacionPost",
        desvDerPost: "desviacionPost"
      };
      const key = sideMap[e.target?.name];
      if (key) {
        const data = readForm();
        const err = validateField(key, data[key], data);
        if (!err) {
          const sideConfig = {
            ruidos: { follow: "ruidos", checks: ["ruidosIzq", "ruidosDer"] },
            dolorCondilar: { follow: "dolorCondilar", checks: ["condilarIzq", "condilarDer"] },
            desviacion: { follow: "desviacion", checks: ["desvIzq", "desvDer"] },
            desviacionPost: { follow: "desviacionPost", checks: ["desvIzqPost", "desvDerPost"] }
          }[key];
          const fg = form.querySelector(`[data-follow="${sideConfig.follow}"] .follow-group`);
          if (fg) fg.classList.remove("input-error");
          sideConfig.checks.forEach((chkName) => {
            form.elements[chkName]?.classList.remove("input-error");
          });
        }
      }
      updateStepValidation();
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = readForm();
      const missingKeys = missingFieldKeys(data);
      if (missingKeys.length) {
        showStep(0);
        highlightMissingFields(missingKeys);
        await dialogAlert(`Falta completar: ${missingFields(data).join(", ")}.`);
        const firstMissing = form.elements[missingKeys[0]];
        if (firstMissing) firstMissing.focus();
        return;
      }
      const val = validateFicha(data);
      if (!val.isValid) {
        const stepForField = {
          nombre: 0,
          dni: 0,
          fechaSesion: 0,
          nacimiento: 0,
          edad: 0,
          lugarNac: 0,
          motivo: 0,
          antecedentes: 0,
          ruidos: 1,
          dolorCondilar: 1,
          aperturaLibre: 1,
          aperturaDolor: 1,
          desviacion: 1,
          protrusion: 1,
          latIzq: 1,
          latDer: 1,
          eva: 3
        };
        const targetStep = stepForField[val.firstErrorKey] ?? 0;
        showStep(targetStep);
        highlightErrorFields(Object.keys(val.errors));
        await dialogAlert(val.firstError);
        const sideInputs = {
          ruidos: form.elements.ruidosIzq,
          dolorCondilar: form.elements.condilarIzq,
          desviacion: form.elements.desvIzq
        };
        const firstMissing = form.elements[val.firstErrorKey] || sideInputs[val.firstErrorKey] || form.querySelector(".input-error");
        if (firstMissing) firstMissing.focus();
        return;
      }
      const ownKey = identityKey || patientKey(currentAllFichas.find((ficha) => ficha.id === data.id) || {});
      const clash = dniNameConflict(data, currentAllFichas, ownKey);
      if (clash) {
        showStep(0);
        form.elements.dni?.classList.add("input-error");
        await dialogAlert(`El documento ${clash.dni || data.dni} ya corresponde a ${clash.nombre}. No se puede guardar con otro nombre.`);
        form.elements.dni?.focus();
        return;
      }
      if (uploadInFlight) {
        try {
          await uploadInFlight;
        } catch {
        }
      }
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      try {
        if (typeof onSave === "function") {
          await onSave(data, identityEdited && identityKey ? { identityKey } : null);
        }
        currentId = data.id;
        showStep(0);
      } catch (error) {
        if (!error.auth) await dialogAlert(error.message);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
    async function processAndUploadFotos(files) {
      const fileList = Array.from(files || []).filter(Boolean);
      if (!fileList.length) return;
      if (currentFotos.length + fileList.length > 10) {
        await dialogAlert(`Solo se permiten hasta 10 fotos por sesi\xF3n. Actualmente ten\xE9s ${currentFotos.length} y seleccionaste ${fileList.length}.`);
        return;
      }
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      for (const f of fileList) {
        if (!validTypes.includes(f.type)) {
          await dialogAlert(`El archivo "${f.name}" no tiene un formato admitido. Seleccion\xE1 \xFAnicamente JPG, PNG o WebP.`);
          return;
        }
        if (f.size > 25 * 1024 * 1024) {
          await dialogAlert(`El archivo "${f.name}" supera los 25 MB. Seleccion\xE1 im\xE1genes m\xE1s livianas.`);
          return;
        }
      }
      if (fotoDropzone) fotoDropzone.hidden = true;
      if (fotoPreviewContainer) fotoPreviewContainer.hidden = true;
      if (fotoLoading) fotoLoading.hidden = false;
      const previousFotos = [...currentFotos];
      const uploadedUrls = [];
      try {
        const task = (async () => {
          for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (fotoLoadingText) {
              fotoLoadingText.textContent = fileList.length === 1 ? "Optimizando imagen local\u2026" : `Optimizando imagen ${i + 1} de ${fileList.length}\u2026`;
            }
            const compressed = await compressImage(file);
            const dataUrl = await blobToDataURL(compressed);
            if (dataUrl) {
              uploadedUrls.push(dataUrl);
            }
          }
        })();
        uploadInFlight = task;
        await task;
        if (uploadedUrls.length > 0) {
          const combined = [...currentFotos, ...uploadedUrls];
          selectedFotoIdx = currentFotos.length;
          syncFotoPreview(combined);
        } else {
          syncFotoPreview(previousFotos);
        }
      } catch (err) {
        syncFotoPreview(previousFotos);
        if (!err.auth) {
          await dialogAlert(err.message || "No se pudieron subir una o m\xE1s im\xE1genes.");
        }
      } finally {
        uploadInFlight = null;
        if (fotoInput) fotoInput.value = "";
      }
    }
    if (fotoInput) {
      fotoInput.addEventListener("change", (e) => {
        const files = e.target.files;
        if (files?.length) processAndUploadFotos(files);
      });
    }
    if (btnFotoSelect) {
      btnFotoSelect.addEventListener("click", (e) => {
        e.stopPropagation();
        fotoInput?.click();
      });
    }
    if (btnFotoChange) {
      btnFotoChange.addEventListener("click", () => {
        fotoInput?.click();
      });
    }
    if (btnFotoRemoveCurrent) {
      btnFotoRemoveCurrent.addEventListener("click", async () => {
        if (!currentFotos.length) return;
        const targetIdx = selectedFotoIdx;
        const confirmed = await dialogConfirm(
          currentFotos.length > 1 ? `\xBFDese\xE1s eliminar la foto ${targetIdx + 1} de la sesi\xF3n?` : "\xBFDese\xE1s quitar la foto adjunta de esta sesi\xF3n?"
        );
        if (confirmed) {
          const updated = currentFotos.filter((_, i) => i !== targetIdx);
          if (selectedFotoIdx >= updated.length) {
            selectedFotoIdx = Math.max(0, updated.length - 1);
          }
          syncFotoPreview(updated);
        }
      });
    }
    if (btnFotoRemove) {
      btnFotoRemove.addEventListener("click", async () => {
        const confirmed = await dialogConfirm(
          currentFotos.length > 1 ? `\xBFDese\xE1s quitar todas las fotos (${currentFotos.length}) adjuntas a esta sesi\xF3n?` : "\xBFDese\xE1s quitar la foto adjunta de esta sesi\xF3n?"
        );
        if (confirmed) {
          syncFotoPreview([]);
        }
      });
    }
    if (fotoDropzone) {
      fotoDropzone.addEventListener("click", () => {
        fotoInput?.click();
      });
      fotoDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        fotoDropzone.classList.add("dragover");
      });
      fotoDropzone.addEventListener("dragleave", () => {
        fotoDropzone.classList.remove("dragover");
      });
      fotoDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        fotoDropzone.classList.remove("dragover");
        const files = e.dataTransfer?.files;
        if (files?.length) processAndUploadFotos(files);
      });
    }
    if (fotoPreviewImg) {
      fotoPreviewImg.addEventListener("click", () => {
        if (fieldFotoUrl?.value) {
          window.open(fieldFotoUrl.value, "_blank", "noopener,noreferrer");
        }
      });
    }
    if (btnBack) {
      btnBack.addEventListener("click", async () => {
        if (formState() !== formBaseline && !await dialogConfirm("\xBFVolver a las fichas sin guardar?")) {
          return;
        }
        showStep(0);
        if (typeof onBack === "function") onBack();
      });
    }
    if (btnPrev) {
      btnPrev.addEventListener("click", () => showStep(Math.max(0, step - 1)));
    }
    const btnFormExportJson = document.querySelector("#btn-form-export-json");
    if (btnFormExportJson) {
      btnFormExportJson.addEventListener("click", async () => {
        const data = readForm();
        if (!data.nombre && !data.dni) {
          await dialogAlert("Completa al menos el nombre o DNI del paciente antes de exportar.");
          return;
        }
        await exportSingleFicha(data);
      });
    }
    if (btnNext) {
      btnNext.addEventListener("click", async () => {
        const data = readForm();
        if (step === 0) {
          const missingKeys = missingFieldKeys(data);
          if (missingKeys.length) {
            highlightMissingFields(missingKeys);
            await dialogAlert(`Falta completar: ${missingFields(data).join(", ")}.`);
            const firstMissing = form.elements[missingKeys[0]] || form.querySelector(".input-error");
            if (firstMissing) firstMissing.focus();
            return;
          }
          const val = validateStep(0, data);
          if (!val.isValid) {
            highlightErrorFields(Object.keys(val.errors));
            await dialogAlert(val.firstError);
            const firstMissing = form.elements[val.firstErrorKey] || form.querySelector(".input-error");
            if (firstMissing) firstMissing.focus();
            return;
          }
        } else if (step === 1) {
          const val = validateStep(1, data);
          if (!val.isValid) {
            highlightErrorFields(Object.keys(val.errors));
            await dialogAlert(val.firstError);
            const sideInputs = {
              ruidos: form.elements.ruidosIzq,
              dolorCondilar: form.elements.condilarIzq,
              desviacion: form.elements.desvIzq
            };
            const firstMissing = form.elements[val.firstErrorKey] || sideInputs[val.firstErrorKey] || form.querySelector(".input-error");
            if (firstMissing) firstMissing.focus();
            return;
          }
        }
        showStep(Math.min(5, step + 1));
      });
    }
    if (compareFormBtn) {
      compareFormBtn.addEventListener("click", () => {
        const currentItem = readForm();
        if (typeof onCompare === "function") {
          onCompare(patientKey(currentItem), currentId);
        }
      });
    }
    const btnPdfHistory2 = document.querySelector("#btn-pdf-history");
    if (btnPdfHistory2) {
      btnPdfHistory2.addEventListener("click", () => {
        const currentItem = readForm();
        const key = patientKey(currentItem);
        const pSessions = currentAllFichas.filter((f) => patientKey(f) === key);
        if (typeof onPrint === "function") {
          onPrint(pSessions.length ? pSessions : [currentItem]);
        }
      });
    }
  }
  function syncFormProfessionals(professionals = [], activeId = "") {
    const sel = document.querySelector("#field-form-profesional") || form && form.elements.profesional;
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = "";
    for (const p of professionals) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nombre || "Profesional sin nombre";
      sel.appendChild(opt);
    }
    if (current && [...sel.options].some((o) => o.value === current)) {
      sel.value = current;
    } else if (activeId) {
      sel.value = activeId;
    }
  }

  // js/modules/library-rows.js
  var rowsCtx = {
    loadAll: () => [],
    isGrouped: () => false,
    getSearchValue: () => "",
    getExpandedPatients: () => /* @__PURE__ */ new Set(),
    getSelectedIds: () => /* @__PURE__ */ new Set(),
    renderLibrary: () => {
    }
  };
  function setRowsContext(next) {
    rowsCtx = { ...rowsCtx, ...next };
  }
  function sessionRow(item, patient, callbacks = {}, sessionIndex = 1, totalSessions = 1) {
    const row = document.createElement("div");
    const isSelected = rowsCtx.getSelectedIds().has(item.id);
    row.className = `session-row ${isSelected ? "is-selected" : ""}`;
    const isInitial = sessionIndex === 1;
    const label = isInitial ? "Evaluaci\xF3n inicial" : `Sesi\xF3n N\xB0 ${sessionIndex}`;
    const checkWrap = document.createElement("label");
    checkWrap.className = "session-check-wrap";
    checkWrap.title = "Seleccionar ficha para exportar en grupo";
    checkWrap.onclick = (e) => e.stopPropagation();
    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "session-check";
    check.checked = isSelected;
    check.addEventListener("change", (e) => {
      e.stopPropagation();
      if (callbacks.onToggleSelect) {
        callbacks.onToggleSelect(item.id, check.checked);
      }
    });
    checkWrap.appendChild(check);
    let evaBadgeHtml = "";
    if (item.eva !== void 0 && item.eva !== null && String(item.eva).trim() !== "") {
      const val = Number(item.eva);
      const colorClass = val <= 3 ? "eva-green" : val <= 6 ? "eva-yellow" : "eva-red";
      evaBadgeHtml = `<span class="session-chip ${colorClass}">EVA ${val}/10</span>`;
    }
    let aperturaHtml = "";
    if (item.aperturaLibre) {
      aperturaHtml = `<span class="session-chip">Apertura ${escapeHtml(item.aperturaLibre)} mm</span>`;
    }
    let cdiHtml = "";
    if (Array.isArray(item.cdi) && item.cdi.length) {
      cdiHtml = `<span class="session-chip">CDI: ${escapeHtml(item.cdi.join(", "))}</span>`;
    }
    let anotacionesHtml = "";
    if (item.anotaciones && item.anotaciones.trim()) {
      const preview = item.anotaciones.trim().length > 30 ? `${item.anotaciones.trim().slice(0, 30)}\u2026` : item.anotaciones.trim();
      anotacionesHtml = `<span class="session-chip session-chip-notes" title="${escapeHtml(item.anotaciones.trim())}">\u{1F4DD} ${escapeHtml(preview)}</span>`;
    }
    let fotoHtml = "";
    const totalFotos = Array.isArray(item.fotosUrls) && item.fotosUrls.length > 0 ? item.fotosUrls.length : item.fotoUrl ? 1 : 0;
    if (totalFotos > 0) {
      const fotoLabel = totalFotos === 1 ? "\u{1F4F7} Foto" : `\u{1F4F7} ${totalFotos} fotos`;
      const fotoTitle = totalFotos === 1 ? "1 foto cl\xEDnica adjunta" : `${totalFotos} fotos cl\xEDnicas adjuntas`;
      fotoHtml = `<span class="session-chip session-chip-foto" title="${fotoTitle}">${fotoLabel}</span>`;
    }
    const profName = item.profesionalNombre || (item.profesional && item.profesional !== "default" ? item.profesional : "");
    const profHtml = profName ? `<span class="session-prof">${escapeHtml(profName)}</span>` : "";
    row.innerHTML = `
    <div class="session-info">
      <span class="session-num">${label}</span>
      <span class="session-date">${formatDate(item.fechaSesion)}</span>
      ${profHtml}
      <div class="session-chips">
        ${evaBadgeHtml}
        ${aperturaHtml}
        ${cdiHtml}
        ${anotacionesHtml}
        ${fotoHtml}
      </div>
    </div>
    <div class="session-actions"></div>
  `;
    const actions = row.querySelector(".session-actions");
    const jsonBtn = document.createElement("button");
    jsonBtn.type = "button";
    jsonBtn.className = "btn light btn-sm";
    jsonBtn.textContent = "JSON";
    jsonBtn.title = `Exportar ficha de esta sesi\xF3n (${formatDate(item.fechaSesion)}) en formato JSON`;
    jsonBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (callbacks.onExportSingle) callbacks.onExportSingle(item);
    });
    const pdfBtn = document.createElement("button");
    pdfBtn.type = "button";
    pdfBtn.className = "btn green";
    pdfBtn.textContent = "PDF";
    pdfBtn.title = `Imprimir ficha de esta sesi\xF3n (${formatDate(item.fechaSesion)})`;
    pdfBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (callbacks.onPdf) callbacks.onPdf(item);
    });
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn ghost btn-icon-del";
    delBtn.title = "Quitar ficha";
    delBtn.setAttribute("aria-label", "Quitar ficha");
    delBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>`;
    delBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const name = patient?.nombre || item.nombre || "esta ficha";
      const ok = await dialogConfirm(`\xBFQuitar la ficha de ${name} del ${formatDate(item.fechaSesion)}? Esta acci\xF3n no se puede deshacer.`, { danger: true });
      if (!ok) return;
      if (callbacks.onDelete) callbacks.onDelete(item);
    });
    actions.append(jsonBtn, pdfBtn, delBtn);
    row.prepend(checkWrap);
    row.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("label")) return;
      if (callbacks.onOpen) callbacks.onOpen(item);
    });
    return row;
  }
  function patientGroupRow(key, sessions, callbacks = {}) {
    const latest = sessions[0] || {};
    const isMulti = sessions.length > 1 || rowsCtx.isGrouped();
    const isSearchActive = String(rowsCtx.getSearchValue() || "").trim().length > 0;
    const isExpanded = rowsCtx.getExpandedPatients().has(key) || isSearchActive && isMulti;
    const selectedIds = rowsCtx.getSelectedIds();
    const allSelected = sessions.length > 0 && sessions.every((s) => selectedIds.has(s.id));
    const someSelected = sessions.some((s) => selectedIds.has(s.id));
    const card = document.createElement("article");
    card.className = `patient-card ${isExpanded ? "is-expanded" : ""} ${allSelected ? "is-selected" : ""}`;
    const header = document.createElement("div");
    header.className = "patient-header";
    const titleGroup = document.createElement("div");
    titleGroup.className = "patient-title-group";
    const titleRow = document.createElement("div");
    titleRow.className = "patient-title-row";
    const patientCheckWrap = document.createElement("label");
    patientCheckWrap.className = "patient-check-wrap";
    patientCheckWrap.title = "Seleccionar todas las sesiones de este paciente para exportar en grupo";
    patientCheckWrap.onclick = (e) => e.stopPropagation();
    const patientCheck = document.createElement("input");
    patientCheck.type = "checkbox";
    patientCheck.className = "patient-check";
    patientCheck.checked = allSelected;
    patientCheck.indeterminate = !allSelected && someSelected;
    patientCheck.addEventListener("change", (e) => {
      e.stopPropagation();
      if (callbacks.onToggleSelectGroup) {
        callbacks.onToggleSelectGroup(sessions.map((s) => s.id), patientCheck.checked);
      }
    });
    patientCheckWrap.appendChild(patientCheck);
    const nameEl = document.createElement("h3");
    nameEl.textContent = latest.nombre || "Sin nombre";
    const sessBadge = document.createElement("span");
    sessBadge.className = "patient-badge";
    sessBadge.textContent = sessions.length === 1 ? "1 sesi\xF3n" : `${sessions.length} sesiones`;
    titleRow.append(patientCheckWrap, nameEl, sessBadge);
    const calcAge = latest.edad || ageOn(latest.nacimiento, latest.fechaSesion);
    if (calcAge) {
      const ageBadge = document.createElement("span");
      ageBadge.className = "patient-badge age";
      ageBadge.textContent = `${calcAge} a\xF1os`;
      titleRow.append(ageBadge);
    }
    const metaRow = document.createElement("div");
    metaRow.className = "patient-meta";
    const dniText = document.createElement("span");
    dniText.textContent = `DNI ${latest.dni || "\u2014"}`;
    metaRow.append(dniText);
    const dot1 = document.createElement("span");
    dot1.className = "patient-meta-dot";
    dot1.textContent = "\xB7";
    metaRow.append(dot1);
    const lastText = document.createElement("span");
    lastText.textContent = sessions.length === 1 ? `Evaluaci\xF3n inicial: ${formatDate(latest.fechaSesion)}` : `\xDAltima visita: ${formatDate(latest.fechaSesion)}`;
    metaRow.append(lastText);
    if (Array.isArray(latest.cdi) && latest.cdi.length) {
      const dot2 = document.createElement("span");
      dot2.className = "patient-meta-dot";
      dot2.textContent = "\xB7";
      const cdiText = document.createElement("span");
      cdiText.textContent = `CDI: ${latest.cdi.join(", ")}`;
      metaRow.append(dot2, cdiText);
    }
    titleGroup.append(titleRow, metaRow);
    const controls = document.createElement("div");
    controls.className = "row-controls";
    const newSess = document.createElement("button");
    newSess.type = "button";
    newSess.className = "btn light";
    newSess.textContent = "+ Nueva sesi\xF3n";
    newSess.title = `Registrar una nueva consulta para ${latest.nombre || "este paciente"}`;
    newSess.addEventListener("click", (e) => {
      e.stopPropagation();
      if (callbacks.onNewSession) {
        callbacks.onNewSession(latest);
      }
    });
    controls.append(newSess);
    const printGroup = document.createElement("button");
    printGroup.type = "button";
    printGroup.className = "btn green";
    printGroup.textContent = isMulti ? "Historial PDF" : "PDF";
    printGroup.title = isMulti ? `Imprimir historial completo de ${latest.nombre || "este paciente"}` : `Imprimir ficha de ${latest.nombre || "este paciente"}`;
    printGroup.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isMulti) {
        if (callbacks.onPdfAll) callbacks.onPdfAll(sessions);
      } else {
        if (callbacks.onPdf) callbacks.onPdf(latest);
      }
    });
    controls.append(printGroup);
    const exportPatientBtn = document.createElement("button");
    exportPatientBtn.type = "button";
    exportPatientBtn.className = "btn light";
    exportPatientBtn.textContent = isMulti ? "JSON (todas)" : "JSON";
    exportPatientBtn.title = isMulti ? `Descargar las ${sessions.length} sesiones de ${latest.nombre || "este paciente"} en un archivo JSON` : `Descargar la ficha de ${latest.nombre || "este paciente"} en un archivo JSON`;
    exportPatientBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (callbacks.onExportPatient) callbacks.onExportPatient(latest.nombre || "paciente", sessions);
    });
    controls.append(exportPatientBtn);
    if (sessions.length >= 2 && callbacks.onCompare) {
      const comp = document.createElement("button");
      comp.type = "button";
      comp.className = "btn light";
      comp.textContent = "Comparar";
      comp.title = "Comparar evoluci\xF3n de este paciente";
      comp.addEventListener("click", (e) => {
        e.stopPropagation();
        callbacks.onCompare(key);
      });
      controls.append(comp);
    }
    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn ghost btn-icon-del-text";
    del.title = isMulti ? `Eliminar todas las ${sessions.length} sesiones de este paciente` : `Eliminar la ficha de este paciente`;
    del.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:4px;">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>${isMulti ? "Quitar todas" : "Quitar"}`;
    del.addEventListener("click", async (e) => {
      e.stopPropagation();
      const all = rowsCtx.loadAll().filter((item) => patientKey(item) === key);
      const name = latest.nombre || "este paciente";
      if (isMulti) {
        const countStr = all.length === 1 ? "la sesi\xF3n" : `las ${all.length} sesiones`;
        const ok = await dialogConfirm(`\xBFQuitar ${countStr} de ${name}? Esta acci\xF3n no se puede deshacer.`, { danger: true });
        if (!ok) return;
        if (callbacks.onDeleteBatch) callbacks.onDeleteBatch(all);
      } else {
        const ok = await dialogConfirm(`\xBFQuitar la ficha de ${name} del ${formatDate(latest.fechaSesion)}? Esta acci\xF3n no se puede deshacer.`, { danger: true });
        if (!ok) return;
        if (callbacks.onDelete) callbacks.onDelete(latest);
      }
    });
    controls.append(del);
    header.append(titleGroup, controls);
    header.addEventListener("click", (event) => {
      if (event.target.closest("button") || event.target.closest("label") || event.target.closest("input")) return;
      if (!isMulti) {
        if (callbacks.onOpen) callbacks.onOpen(latest);
      } else {
        if (rowsCtx.getExpandedPatients().has(key)) {
          rowsCtx.getExpandedPatients().delete(key);
        } else {
          rowsCtx.getExpandedPatients().add(key);
        }
        rowsCtx.renderLibrary();
      }
    });
    card.append(header);
    if (isExpanded && isMulti) {
      const sessionsList = document.createElement("div");
      sessionsList.className = "patient-sessions";
      const total = sessions.length;
      sessions.forEach((sess, idx) => {
        const sessionNumber = total - idx;
        sessionsList.append(sessionRow(sess, latest, callbacks, sessionNumber, total));
      });
      card.append(sessionsList);
    }
    return card;
  }

  // js/modules/library.js
  var libraryView = document.querySelector("#view-library");
  var listEl = document.querySelector("#library-list");
  var patientSelect = document.querySelector("#pdf-patient");
  var searchInput = document.querySelector("#search");
  var pageSizeSelect = document.querySelector("#page-size");
  var sortPatientsSelect = document.querySelector("#sort-patients");
  var libraryPager = document.querySelector("#library-pager");
  var mineButton = document.querySelector("#btn-mine");
  var filterProfSelect = document.querySelector("#filter-library-prof");
  var btnGroup = document.querySelector("#btn-group");
  var btnNew = document.querySelector("#btn-new");
  var btnSeed = document.querySelector("#btn-seed");
  var btnExport = document.querySelector("#btn-export");
  var cache = [];
  var libraryLoaded = false;
  var grouped = false;
  var focusedPatient = null;
  var page = 0;
  var onlyMine = false;
  var activeFilterProf = "todos";
  var mineDefaultApplied = false;
  var expandedPatients = /* @__PURE__ */ new Set();
  var selectedFichaIds = /* @__PURE__ */ new Set();
  var patientSortMode = "name";
  try {
    const s = localStorage.getItem("fichas_atm_patient_sort");
    if (s === "recent" || s === "name") patientSortMode = s;
  } catch {
  }
  var activeSessionUserGetter2 = null;
  var activeRowCallbacks = {};
  setRowsContext({
    loadAll: () => loadAll(),
    isGrouped: () => grouped,
    getSearchValue: () => searchInput?.value || "",
    getExpandedPatients: () => expandedPatients,
    getSelectedIds: () => selectedFichaIds,
    renderLibrary: () => renderLibrary()
  });
  var activeUpsert = null;
  var activeBlank = null;
  var activeFillForm = null;
  var activeShowForm = null;
  function upsert(item) {
    if (typeof activeUpsert === "function") {
      return activeUpsert(item);
    }
    return Promise.resolve(item);
  }
  function blank2() {
    if (typeof activeBlank === "function") {
      return activeBlank();
    }
    return {};
  }
  function fillForm2(data) {
    if (typeof activeFillForm === "function") {
      activeFillForm(data);
    }
  }
  function showForm2(targetStep = 0) {
    if (typeof activeShowForm === "function") {
      activeShowForm(targetStep);
    }
  }
  var IMPORT_BATCH = 20;
  function sessionIdentity(item) {
    return `${patientKey(item)}|${String(item?.fechaSesion || "")}`;
  }
  function planImport(rawItems) {
    const byId = new Map(cache.filter((ficha) => ficha && ficha.id).map((ficha) => [ficha.id, ficha]));
    const bySession = /* @__PURE__ */ new Map();
    for (const ficha of cache) {
      const key = sessionIdentity(ficha);
      if (key !== "|") bySession.set(key, ficha);
    }
    const planned = /* @__PURE__ */ new Map();
    for (const item of rawItems) {
      const coerced = coerceFicha({ ...blank2(), ...item });
      const known = item.id && byId.get(item.id) || bySession.get(sessionIdentity(coerced));
      const id = known && known.id || typeof item.id === "string" && item.id || crypto.randomUUID();
      const data = { ...coerced, id };
      planned.set(id, data);
      byId.set(id, data);
      const key = sessionIdentity(data);
      if (key !== "|") bySession.set(key, data);
    }
    return [...planned.values()];
  }
  var SEED_PEOPLE = [
    ["Luc\xEDa Fern\xE1ndez", "30111201"],
    ["Mateo Ruiz", "30111202"],
    ["Sof\xEDa \xC1lvarez", "30111203"],
    ["Benjam\xEDn Castro", "30111204"],
    ["Valentina D\xEDaz", "30111205"],
    ["Joaqu\xEDn Romero", "30111206"],
    ["Emma Su\xE1rez", "30111207"],
    ["Bautista Molina", "30111208"],
    ["Catalina Vargas", "30111209"],
    ["Thiago Navarro", "30111210"],
    ["Olivia Pereyra", "30111211"],
    ["Santino Acosta", "30111212"],
    ["Isabella Medina", "30111213"],
    ["Felipe Cabrera", "30111214"],
    ["Martina R\xEDos", "30111215"],
    ["Gael Paredes", "30111216"],
    ["Renata Quiroga", "30111217"],
    ["Ian Ferreyra", "30111218"],
    ["Zoe Maldonado", "30111219"],
    ["Le\xF3n Herrera", "30111220"]
  ];
  function loadAll() {
    return cache;
  }
  function setCache(items) {
    cache = items || [];
    libraryLoaded = true;
  }
  function showLibrary() {
    const formView3 = document.querySelector("#view-form");
    const compareView2 = document.querySelector("#view-compare");
    const gateView = document.querySelector("#view-gate");
    const dashView = document.querySelector("#view-dashboard");
    const pacView = document.querySelector("#view-pacientes");
    const horView = document.querySelector("#view-horarios");
    if (gateView) gateView.hidden = true;
    if (formView3) formView3.hidden = true;
    if (compareView2) compareView2.hidden = true;
    if (dashView) dashView.hidden = true;
    if (pacView) pacView.hidden = true;
    if (horView) horView.hidden = true;
    if (libraryView) libraryView.hidden = false;
    try {
      sessionStorage.setItem("fichas_atm_view", JSON.stringify({ view: "library" }));
    } catch {
    }
    renderLibrary();
  }
  function visibleFichas(sessionUser = null) {
    const q = searchInput ? searchInput.value : "";
    return loadAll().filter((item) => {
      if (activeFilterProf === "todos") return true;
      const target = activeFilterProf.toLowerCase();
      const pId = String(item?.profesionalId || "").toLowerCase();
      const pKey = String(item?.profesional || "").toLowerCase();
      const pName = String(item?.profesionalNombre || "").toLowerCase();
      return pId === target || pKey === target || pName === target;
    }).filter((item) => matchFichaSearch(item, q)).sort((a, b) => (b.fechaSesion || "").localeCompare(a.fechaSesion || ""));
  }
  function pageWindow(rows) {
    const size = pageSizeSelect && pageSizeSelect.value === "all" ? rows.length : Number(pageSizeSelect?.value || 25);
    const totalPages = Math.max(1, Math.ceil(rows.length / (size || 1)));
    page = Math.min(page, totalPages - 1);
    if (libraryPager) {
      libraryPager.innerHTML = "";
      if (rows.length > 0 && size < rows.length) {
        const prev = document.createElement("button");
        prev.type = "button";
        prev.className = "btn ghost";
        prev.textContent = "\u2190 Anterior";
        prev.disabled = page === 0;
        prev.addEventListener("click", () => {
          page -= 1;
          renderLibrary();
        });
        const span = document.createElement("span");
        const unit = rows.length === 1 ? "paciente" : "pacientes";
        span.textContent = `P\xE1gina ${page + 1} de ${totalPages} (${rows.length} ${unit})`;
        const next = document.createElement("button");
        next.type = "button";
        next.className = "btn ghost";
        next.textContent = "Siguiente \u2192";
        next.disabled = page >= totalPages - 1;
        next.addEventListener("click", () => {
          page += 1;
          renderLibrary();
        });
        libraryPager.append(prev, span, next);
      }
    }
    const start = page * size;
    return rows.slice(start, start + size);
  }
  function updateLibraryProfFilter(professionals = []) {
    if (!filterProfSelect) return;
    const currentVal = filterProfSelect.value;
    filterProfSelect.innerHTML = '<option value="todos">Todos los profesionales</option>';
    for (const p of professionals) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nombre || "Sin nombre";
      filterProfSelect.appendChild(opt);
    }
    if (currentVal && [...filterProfSelect.options].some((o) => o.value === currentVal)) {
      filterProfSelect.value = currentVal;
    } else {
      filterProfSelect.value = "todos";
    }
  }
  function syncMineButton() {
    if (!mineButton) return;
    mineButton.setAttribute("aria-pressed", String(onlyMine));
    mineButton.classList.toggle("is-active", onlyMine);
  }
  function updateSelectionUI() {
    const bar = document.querySelector("#selection-bar");
    const countEl = document.querySelector("#selection-bar-count");
    const radioSelected = document.querySelector("#export-radio-selected");
    const lblSelected = document.querySelector("#export-lbl-selected");
    const count = selectedFichaIds.size;
    if (bar) {
      bar.hidden = count === 0;
    }
    if (countEl) {
      countEl.textContent = count === 1 ? "1 ficha seleccionada" : `${count} fichas seleccionadas`;
    }
    if (radioSelected && lblSelected) {
      radioSelected.disabled = count === 0;
      lblSelected.textContent = count > 0 ? `Exportar las ${count} fichas marcadas con casillas de verificaci\xF3n.` : "No hay fichas seleccionadas actualmente (marca las casillas en la lista).";
    }
  }
  function openExportModal() {
    const modal = document.querySelector("#modal-export");
    if (!modal) return;
    const all = loadAll();
    const selectPatient = document.querySelector("#export-select-patient");
    const selectProf = document.querySelector("#export-select-prof");
    const lblAll = document.querySelector("#export-lbl-all");
    if (lblAll) {
      lblAll.textContent = `Todas las fichas registradas (${all.length} fichas) y datos del consultorio.`;
    }
    if (selectPatient) {
      selectPatient.innerHTML = "";
      const seen = /* @__PURE__ */ new Map();
      for (const f of all) {
        const k = patientKey(f);
        if (!seen.has(k)) seen.set(k, { nombre: f.nombre || "Sin nombre", dni: f.dni || "\u2014" });
      }
      for (const [k, p] of seen.entries()) {
        const opt = document.createElement("option");
        opt.value = k;
        opt.textContent = `${p.nombre} (DNI ${p.dni})`;
        selectPatient.appendChild(opt);
      }
    }
    if (selectProf) {
      selectProf.innerHTML = "";
      const seenProf = /* @__PURE__ */ new Map();
      for (const f of all) {
        const profId = f.profesionalId || f.profesional || "default";
        const profName = f.profesionalNombre || (f.profesional && f.profesional !== "default" ? f.profesional : "Profesional Principal");
        if (!seenProf.has(profId)) seenProf.set(profId, profName);
      }
      for (const [id, name] of seenProf.entries()) {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = name;
        selectProf.appendChild(opt);
      }
    }
    updateSelectionUI();
    modal.hidden = false;
  }
  function initExportModal() {
    const modal = document.querySelector("#modal-export");
    const btnClose = document.querySelector("#btn-close-export");
    const btnCancel = document.querySelector("#btn-cancel-export");
    const btnConfirm = document.querySelector("#btn-confirm-export");
    const closeFn = () => {
      if (modal) modal.hidden = true;
    };
    if (btnClose) btnClose.addEventListener("click", closeFn);
    if (btnCancel) btnCancel.addEventListener("click", closeFn);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeFn();
      });
    }
    if (btnConfirm) {
      btnConfirm.addEventListener("click", async () => {
        const selectedScope = document.querySelector('input[name="export-scope"]:checked')?.value || "all";
        const all = loadAll();
        if (!all.length) {
          dialogAlert("No hay fichas registradas para exportar.");
          return;
        }
        try {
          if (selectedScope === "all") {
            await exportBackup();
          } else if (selectedScope === "patient") {
            const selKey = document.querySelector("#export-select-patient")?.value;
            const patientSessions = all.filter((f) => patientKey(f) === selKey);
            if (!patientSessions.length) {
              dialogAlert("No se encontraron sesiones para el paciente seleccionado.");
              return;
            }
            const pName = patientSessions[0]?.nombre || "paciente";
            await exportPatientFichas(pName, patientSessions);
          } else if (selectedScope === "prof") {
            const selProf = document.querySelector("#export-select-prof")?.value;
            const profSessions = all.filter((f) => (f.profesionalId || f.profesional || "default") === selProf);
            if (!profSessions.length) {
              dialogAlert("No se encontraron fichas para el profesional seleccionado.");
              return;
            }
            const profName = profSessions[0]?.profesionalNombre || "profesional";
            await exportGroupFichas(profSessions, `profesional_${profName}`);
          } else if (selectedScope === "selected") {
            const selected = all.filter((f) => selectedFichaIds.has(f.id));
            if (!selected.length) {
              dialogAlert("No hay fichas seleccionadas en la lista.");
              return;
            }
            await exportGroupFichas(selected, "seleccion");
          }
          closeFn();
        } catch (err) {
          dialogAlert("Error al exportar: " + (err.message || err));
        }
      });
    }
  }
  function renderLibrary() {
    if (!listEl) return;
    const sessionUser = typeof activeSessionUserGetter2 === "function" ? activeSessionUserGetter2() : null;
    if (sessionUser && !mineDefaultApplied) {
      mineDefaultApplied = true;
      onlyMine = false;
    }
    syncMineButton();
    const noPatients = libraryLoaded && loadAll().length === 0;
    const toolbar = libraryView?.querySelector(".library-toolbar");
    if (toolbar) toolbar.classList.toggle("is-idle", noPatients || !libraryLoaded);
    const controlsLocked = noPatients || !libraryLoaded;
    if (patientSelect) patientSelect.disabled = controlsLocked;
    if (searchInput) searchInput.disabled = controlsLocked;
    if (filterProfSelect) {
      filterProfSelect.disabled = controlsLocked;
      filterProfSelect.value = activeFilterProf;
    }
    if (mineButton) mineButton.disabled = controlsLocked;
    if (sortPatientsSelect) sortPatientsSelect.disabled = controlsLocked;
    const items = visibleFichas(sessionUser);
    if (patientSelect) {
      const prevPatient = focusedPatient || patientSelect.value;
      patientSelect.innerHTML = '<option value="__all__">Todos los pacientes</option>';
      const seenPatients = /* @__PURE__ */ new Map();
      for (const item of items) {
        const key = patientKey(item);
        if (!seenPatients.has(key)) {
          seenPatients.set(key, item.nombre || "Sin nombre");
          const opt = document.createElement("option");
          opt.value = key;
          opt.textContent = `${item.nombre || "Sin nombre"} (DNI ${item.dni || "\u2014"})`;
          patientSelect.append(opt);
        }
      }
      patientSelect.value = focusedPatient && seenPatients.has(focusedPatient) ? focusedPatient : seenPatients.has(prevPatient) || prevPatient === "__all__" ? prevPatient : "__all__";
    }
    const groupMap = /* @__PURE__ */ new Map();
    for (const item of items) {
      const key = patientKey(item);
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key).push(item);
    }
    let groups = [...groupMap.entries()];
    if (focusedPatient) {
      groups = groups.filter(([key]) => key === focusedPatient);
      expandedPatients.add(focusedPatient);
    }
    if (patientSortMode === "recent") {
      groups.sort((a, b) => (b[1][0]?.fechaSesion || "").localeCompare(a[1][0]?.fechaSesion || ""));
    } else {
      groups.sort((a, b) => (a[1][0]?.nombre || "").localeCompare(b[1][0]?.nombre || "", "es", { sensitivity: "base" }));
    }
    const fragment = document.createDocumentFragment();
    if (focusedPatient && groups.length) {
      const pName = groups[0][1][0]?.nombre || "Paciente";
      const filterBanner = document.createElement("div");
      filterBanner.className = "card-row";
      filterBanner.style.background = "var(--sky)";
      filterBanner.style.marginBottom = "10px";
      filterBanner.style.padding = "10px 16px";
      const bannerInfo = document.createElement("div");
      bannerInfo.innerHTML = `<h3 style="margin:0; font-size:15px; color:var(--navy);">Filtrando por: <strong>${escapeHtml(pName)}</strong></h3>`;
      const backBtn = document.createElement("button");
      backBtn.type = "button";
      backBtn.className = "btn light";
      backBtn.textContent = "\u2190 Ver todos los pacientes";
      backBtn.addEventListener("click", () => {
        focusedPatient = null;
        if (patientSelect) patientSelect.value = "__all__";
        page = 0;
        renderLibrary();
      });
      filterBanner.append(bannerInfo, backBtn);
      fragment.append(filterBanner);
    }
    if (!groups.length) {
      const emptyBox = document.createElement("div");
      emptyBox.className = "empty-library-card";
      const isFiltered = Boolean(searchInput?.value || activeFilterProf !== "todos" || focusedPatient);
      if (isFiltered) {
        emptyBox.innerHTML = `
        <div class="empty-icon">\u{1F50D}</div>
        <h3>Sin resultados</h3>
        <p>No se encontraron pacientes que coincidan con la b\xFAsqueda.</p>
      `;
      } else {
        emptyBox.innerHTML = `
        <div class="empty-icon">\u{1F4CB}</div>
        <h3>No hay historias cl\xEDnicas guardadas</h3>
        <p>Utiliza los botones de arriba ("\u2795 Nueva sesi\xF3n" o "\u{1F4A1} Cargar ejemplo") para registrar tu primera atenci\xF3n.</p>
      `;
      }
      fragment.append(emptyBox);
    } else {
      const slice = pageWindow(groups);
      for (const [key, sessions] of slice) {
        fragment.append(patientGroupRow(key, sessions, activeRowCallbacks));
      }
    }
    listEl.replaceChildren(fragment);
  }
  function initLibrary({
    getSessionUser,
    onOpenFicha,
    onNewSessionFicha,
    onPdfFicha,
    onDeleteFicha,
    onDeleteBatchFichas,
    onComparePatient,
    onNewFichaBlank,
    upsertFn,
    blankFn,
    fillFormFn,
    showFormFn,
    todayStr
  }) {
    activeSessionUserGetter2 = getSessionUser;
    activeUpsert = upsertFn;
    activeBlank = blankFn;
    activeFillForm = fillFormFn;
    activeShowForm = showFormFn;
    activeRowCallbacks = {
      onOpen: onOpenFicha,
      onNewSession: (item) => {
        const copy = nextSession(item, todayISO());
        onNewSessionFicha({ ...copy, id: crypto.randomUUID() });
      },
      onPdf: (item) => onPdfFicha([item]),
      onPdfAll: (items) => onPdfFicha(items),
      onDelete: onDeleteFicha,
      onDeleteBatch: onDeleteBatchFichas,
      onCompare: onComparePatient,
      onToggleSelect: (id, isChecked) => {
        if (isChecked) {
          selectedFichaIds.add(id);
        } else {
          selectedFichaIds.delete(id);
        }
        updateSelectionUI();
        renderLibrary();
      },
      onToggleSelectGroup: (ids, isChecked) => {
        for (const id of ids) {
          if (isChecked) {
            selectedFichaIds.add(id);
          } else {
            selectedFichaIds.delete(id);
          }
        }
        updateSelectionUI();
        renderLibrary();
      },
      onExportSingle: async (item) => {
        await exportSingleFicha(item);
      },
      onExportPatient: async (patientName, sessions) => {
        await exportPatientFichas(patientName, sessions);
      },
      onDownloadJson: (item) => exportSingleFicha(item),
      onDownloadJsonAll: (items) => {
        const stem = items[0]?.nombre || "paciente";
        exportPatientFichas(stem, items);
      },
      todayStr
    };
    const btnExportSelected = document.querySelector("#btn-export-selected");
    if (btnExportSelected) {
      btnExportSelected.addEventListener("click", async () => {
        const all = loadAll();
        const selected = all.filter((f) => selectedFichaIds.has(f.id));
        if (!selected.length) {
          dialogAlert("No hay fichas seleccionadas.");
          return;
        }
        await exportGroupFichas(selected, "seleccion");
      });
    }
    const btnClearSelection = document.querySelector("#btn-clear-selection");
    if (btnClearSelection) {
      btnClearSelection.addEventListener("click", () => {
        selectedFichaIds.clear();
        updateSelectionUI();
        renderLibrary();
      });
    }
    const btnSelectAllVisible = document.querySelector("#btn-select-all-visible");
    if (btnSelectAllVisible) {
      btnSelectAllVisible.addEventListener("click", () => {
        const sessionUser = typeof activeSessionUserGetter2 === "function" ? activeSessionUserGetter2() : null;
        const items = visibleFichas(sessionUser);
        for (const item of items) {
          selectedFichaIds.add(item.id);
        }
        updateSelectionUI();
        renderLibrary();
      });
    }
    initExportModal();
    if (searchInput) {
      searchInput.addEventListener("input", debounce(() => {
        page = 0;
        renderLibrary();
      }, 150));
    }
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener("change", () => {
        page = 0;
        renderLibrary();
      });
    }
    if (sortPatientsSelect) {
      sortPatientsSelect.value = patientSortMode;
      sortPatientsSelect.addEventListener("change", () => {
        patientSortMode = sortPatientsSelect.value;
        try {
          localStorage.setItem("fichas_atm_patient_sort", patientSortMode);
        } catch {
        }
        page = 0;
        renderLibrary();
      });
    }
    if (filterProfSelect) {
      filterProfSelect.addEventListener("change", (e) => {
        activeFilterProf = e.target.value;
        focusedPatient = null;
        page = 0;
        renderLibrary();
      });
    }
    if (mineButton) {
      mineButton.addEventListener("click", () => {
        onlyMine = !onlyMine;
        focusedPatient = null;
        page = 0;
        syncMineButton();
        renderLibrary();
      });
    }
    if (btnGroup) {
      btnGroup.addEventListener("click", () => {
        grouped = !grouped;
        focusedPatient = null;
        page = 0;
        btnGroup.textContent = grouped ? "Ver todas las fichas" : "Agrupar por paciente";
        btnGroup.classList.toggle("green", grouped);
        btnGroup.classList.toggle("light", !grouped);
        renderLibrary();
      });
    }
    if (patientSelect) {
      patientSelect.addEventListener("change", () => {
        focusedPatient = patientSelect.value === "__all__" ? null : patientSelect.value;
        page = 0;
        renderLibrary();
      });
    }
    if (btnNew) {
      btnNew.addEventListener("click", () => {
        const sessionUser = typeof activeSessionUserGetter2 === "function" ? activeSessionUserGetter2() : null;
        const items = visibleFichas(sessionUser);
        if (focusedPatient) {
          const pSessions = items.filter((item) => patientKey(item) === focusedPatient);
          if (pSessions.length && typeof activeRowCallbacks.onNewSession === "function") {
            activeRowCallbacks.onNewSession(pSessions[0]);
            return;
          }
        }
        if (typeof onNewFichaBlank === "function") onNewFichaBlank();
      });
    }
    if (btnSeed) {
      btnSeed.addEventListener("click", async () => {
        const sessionUser = typeof activeSessionUserGetter2 === "function" ? activeSessionUserGetter2() : null;
        if (sessionUser && sessionUser.role && sessionUser.role !== "admin") return;
        if (!await dialogConfirm("\xBFAgregar 20 fichas de prueba?")) return;
        btnSeed.disabled = true;
        try {
          for (let i = 0; i < SEED_PEOPLE.length; i += 1) {
            const [nombre, dni] = SEED_PEOPLE[i];
            const day = String(i + 1).padStart(2, "0");
            const data = {
              ...blank2(),
              ...exampleFicha(),
              id: crypto.randomUUID(),
              nombre,
              dni,
              fechaSesion: `2026-09-${day}`
            };
            await upsert(data);
          }
          showLibrary();
        } catch (error) {
          if (!error.auth) dialogAlert(error.message);
        } finally {
          btnSeed.disabled = false;
        }
      });
    }
    if (btnExport) {
      btnExport.addEventListener("click", () => {
        openExportModal();
      });
    }
    const fileOpen = document.querySelector("#file-open");
    if (fileOpen) {
      fileOpen.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        event.target.value = "";
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
          dialogAlert("El archivo supera los 8 MB.");
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(await file.text());
        } catch {
          dialogAlert("El archivo no es un JSON v\xE1lido.");
          return;
        }
        if (!parsed || typeof parsed !== "object") {
          dialogAlert("El archivo no es una ficha.");
          return;
        }
        let raw = [];
        if (Array.isArray(parsed)) {
          raw = parsed.filter((item) => item && typeof item === "object" && !Array.isArray(item));
        } else if (parsed && Array.isArray(parsed.fichas)) {
          raw = parsed.fichas.filter((item) => item && typeof item === "object");
        }
        if (raw.length > 0) {
          const fichas = planImport(raw);
          const already = fichas.filter((item) => cache.some((ficha) => ficha.id === item.id)).length;
          const fileBtn = fileOpen.closest("label");
          const fileLabel = fileBtn ? fileBtn.childNodes[0] : null;
          const previousLabel = fileLabel && fileLabel.textContent;
          if (fileOpen) fileOpen.disabled = true;
          const failed = [];
          try {
            for (let offset = 0; offset < fichas.length; offset += IMPORT_BATCH) {
              const batch = fichas.slice(offset, offset + IMPORT_BATCH);
              if (fileLabel) {
                fileLabel.textContent = `Importando ${Math.min(offset + batch.length, fichas.length)}/${fichas.length}\u2026 `;
              }
              const results = await Promise.allSettled(batch.map((item) => upsert(item)));
              results.forEach((result) => {
                if (result.status === "rejected") failed.push(result.reason);
              });
              if (failed.some((error) => error && error.auth)) break;
            }
            showLibrary();
            if (failed.some((error) => error && error.auth)) return;
            const saved = fichas.length - failed.length;
            const replaced = already ? ` ${already === 1 ? "1 ya estaba y se actualiz\xF3." : `${already} ya estaban y se actualizaron.`}` : "";
            if (!failed.length) {
              dialogAlert((saved === 1 ? "Se import\xF3 1 ficha." : `Se importaron ${saved} fichas.`) + replaced);
            } else {
              const message = failed[0] && failed[0].message;
              dialogAlert(`Se importaron ${saved} de ${fichas.length}.${replaced} ${message || ""}`.trim());
            }
          } finally {
            if (fileLabel && previousLabel) fileLabel.textContent = previousLabel;
            fileOpen.disabled = false;
          }
          return;
        }
        const data = planImport([parsed])[0];
        fillForm2(data);
        showForm2(0);
        const missing = missingFields(data);
        if (missing.length) {
          dialogAlert(`El archivo se abri\xF3, pero falta completar: ${missing.join(", ")}.`);
        }
      });
    }
  }
  (function attentionOnLogin() {
    const lib = document.querySelector("#view-library");
    const cta = document.querySelector("#btn-new");
    if (!lib || !cta) return;
    const KEY = "fichas_atm_cta_seen";
    const maybePlay = () => {
      if (lib.hidden) return;
      try {
        if (sessionStorage.getItem(KEY)) return;
        sessionStorage.setItem(KEY, "1");
      } catch (_) {
      }
      cta.classList.remove("cta-attention");
      void cta.offsetWidth;
      cta.classList.add("cta-attention");
      cta.addEventListener(
        "animationend",
        (e) => {
          if (e.animationName === "cta-halo") cta.classList.remove("cta-attention");
        },
        { once: false }
      );
    };
    new MutationObserver(maybePlay).observe(lib, {
      attributes: true,
      attributeFilter: ["hidden"]
    });
    maybePlay();
  })();

  // js/modules/compare.js
  var compareView = document.querySelector("#view-compare");
  var libraryView2 = document.querySelector("#view-library");
  var formView2 = document.querySelector("#view-form");
  var compareSelectX = document.querySelector("#compare-select-x");
  var compareSelectY = document.querySelector("#compare-select-y");
  var compareSwapBtn = document.querySelector("#btn-compare-swap");
  var compareBackBtn = document.querySelector("#btn-compare-back");
  var comparePdfBtn = document.querySelector("#btn-compare-pdf");
  var comparePatientName = document.querySelector("#compare-patient-name");
  var comparePatientMeta = document.querySelector("#compare-patient-meta");
  var compareBanner = document.querySelector("#compare-banner");
  var compareTabCount = document.querySelector("#compare-tab-count");
  var comparePanelsWrap = document.querySelector("#compare-panels-wrap");
  var comparePatient = null;
  var comparePreviousView = "library";
  var activeCompareTab = "summary";
  var currentCompareResult = null;
  var activeAllFichasGetter = null;
  var activeSessionUserGetter3 = null;
  function showCompare(pKey, preferredXId, preferredYId, fromView = null) {
    comparePreviousView = fromView || (formView2 && !formView2.hidden ? "form" : "library");
    const gateView = document.querySelector("#view-gate");
    const dashView = document.querySelector("#view-dashboard");
    const pacView = document.querySelector("#view-pacientes");
    const horView = document.querySelector("#view-horarios");
    if (gateView) gateView.hidden = true;
    if (libraryView2) libraryView2.hidden = true;
    if (formView2) formView2.hidden = true;
    if (dashView) dashView.hidden = true;
    if (pacView) pacView.hidden = true;
    if (horView) horView.hidden = true;
    if (compareView) compareView.hidden = false;
    const allFichas = typeof activeAllFichasGetter === "function" ? activeAllFichasGetter() : [];
    let resolvedKey = pKey;
    if (typeof pKey === "object" && pKey !== null) {
      resolvedKey = patientKey(pKey);
    } else if (pKey && allFichas.some((f) => f.id === pKey)) {
      const found = allFichas.find((f) => f.id === pKey);
      resolvedKey = patientKey(found);
    } else if (typeof pKey === "string" && pKey.includes("|")) {
      const legacy = allFichas.find((f) => {
        const nombre = String(f?.nombre || "").trim().toLowerCase();
        return `${nombre}|${normalizeDni(f?.dni)}` === pKey;
      });
      if (legacy) resolvedKey = patientKey(legacy);
    }
    comparePatient = resolvedKey;
    try {
      sessionStorage.setItem(
        "fichas_atm_view",
        JSON.stringify({
          view: "compare",
          pKey: resolvedKey,
          xId: preferredXId || null,
          yId: preferredYId || null
        })
      );
    } catch {
    }
    populateCompareSessions(resolvedKey, preferredXId, preferredYId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function populateCompareSessions(pKey, preferredXId, preferredYId) {
    const allFichas = typeof activeAllFichasGetter === "function" ? activeAllFichasGetter() : [];
    const patientSessions = allFichas.filter((f) => patientKey(f) === pKey).sort((a, b) => (a.fechaSesion || "").localeCompare(b.fechaSesion || "") || (a.savedAt || a.id || "").localeCompare(b.savedAt || b.id || ""));
    if (!patientSessions.length) {
      if (compareBanner) {
        compareBanner.className = "compare-banner is-same-session";
        compareBanner.textContent = "No se encontraron sesiones para este paciente.";
      }
      if (comparePanelsWrap) comparePanelsWrap.innerHTML = "";
      return;
    }
    const latestSession = patientSessions[patientSessions.length - 1];
    const patientName = latestSession.nombre || "Paciente";
    const patientDni = latestSession.dni || "\u2014";
    if (comparePatientName) {
      comparePatientName.innerHTML = `<span class="bar"></span>Evoluci\xF3n: ${escapeHtml(patientName)}`;
    }
    if (comparePatientMeta) {
      comparePatientMeta.textContent = `DNI ${patientDni} \xB7 ${patientSessions.length} ${patientSessions.length === 1 ? "sesi\xF3n registrada" : "sesiones registradas"}`;
    }
    if (compareSelectX) compareSelectX.innerHTML = "";
    if (compareSelectY) compareSelectY.innerHTML = "";
    patientSessions.forEach((s, idx) => {
      const label = `Sesi\xF3n ${idx + 1} (${formatDate(s.fechaSesion)}) - ${s.profesionalNombre || "Sin prof."}`;
      const optX = document.createElement("option");
      optX.value = s.id;
      optX.textContent = label;
      if (compareSelectX) compareSelectX.append(optX);
      const optY = document.createElement("option");
      optY.value = s.id;
      optY.textContent = label;
      if (compareSelectY) compareSelectY.append(optY);
    });
    if (patientSessions.length >= 2) {
      if (preferredXId && preferredYId) {
        if (compareSelectX) compareSelectX.value = preferredXId;
        if (compareSelectY) compareSelectY.value = preferredYId;
      } else if (preferredXId) {
        const idx = patientSessions.findIndex((s) => s.id === preferredXId);
        if (idx > 0) {
          if (compareSelectX) compareSelectX.value = patientSessions[idx - 1].id;
          if (compareSelectY) compareSelectY.value = preferredXId;
        } else {
          if (compareSelectX) compareSelectX.value = preferredXId;
          if (compareSelectY) compareSelectY.value = patientSessions[patientSessions.length - 1].id;
        }
      } else {
        if (compareSelectX) compareSelectX.value = patientSessions[0].id;
        if (compareSelectY) compareSelectY.value = patientSessions[patientSessions.length - 1].id;
      }
    } else {
      if (compareSelectX) compareSelectX.value = patientSessions[0].id;
      if (compareSelectY) compareSelectY.value = patientSessions[0].id;
    }
    renderCompareContent();
  }
  function renderCompareContent() {
    if (!compareSelectX || !compareSelectY) return;
    const idX = compareSelectX.value;
    const idY = compareSelectY.value;
    const allFichas = typeof activeAllFichasGetter === "function" ? activeAllFichasGetter() : [];
    const sessionX = allFichas.find((f) => f.id === idX);
    const sessionY = allFichas.find((f) => f.id === idY);
    if (!sessionX || !sessionY) {
      if (compareBanner) {
        compareBanner.className = "compare-banner is-same-session";
        compareBanner.textContent = "Seleccion\xE1 dos sesiones para comparar.";
      }
      if (comparePanelsWrap) comparePanelsWrap.innerHTML = "";
      return;
    }
    const isSame = idX === idY;
    const res = compareFichas(sessionX, sessionY);
    res.sessionX = sessionX;
    res.sessionY = sessionY;
    currentCompareResult = res;
    if (compareTabCount) {
      compareTabCount.textContent = res.totalChanged;
    }
    if (compareBanner) {
      if (isSame) {
        const patientSessions = allFichas.filter((f) => patientKey(f) === patientKey(sessionX));
        if (patientSessions.length <= 1) {
          compareBanner.className = "compare-banner is-same-session";
          compareBanner.innerHTML = `<span><strong>Solo hay 1 sesi\xF3n registrada (${formatDate(
            sessionX.fechaSesion
          )}):</strong> Se necesitan al menos 2 sesiones para contrastar la evoluci\xF3n. Abajo pod\xE9s ver todos los valores registrados.</span>`;
        } else {
          compareBanner.className = "compare-banner is-same-session";
          compareBanner.innerHTML = `<span><strong>Misma sesi\xF3n seleccionada (${formatDate(
            sessionX.fechaSesion
          )}):</strong> Eleg\xED una sesi\xF3n distinta en \xABSesi\xF3n base\xBB o \xABSesi\xF3n comparada\xBB para ver la evoluci\xF3n.</span>`;
        }
      } else {
        compareBanner.className = "compare-banner";
        const daysText = res.daysBetween != null ? `${res.daysBetween} d\xEDas de diferencia` : "Sin fechas";
        const countText = res.totalChanged === 1 ? "1 cambio registrado" : `${res.totalChanged} cambios registrados`;
        compareBanner.innerHTML = `
        <div class="compare-banner-meta" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span>Comparando <strong>Sesi\xF3n del ${formatDate(
          sessionX.fechaSesion
        )}</strong> vs <strong>Sesi\xF3n del ${formatDate(sessionY.fechaSesion)}</strong></span>
        </div>
        <div class="compare-banner-tags" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span class="compare-tag-pill">\u{1F4C5} ${daysText}</span>
          <span class="compare-tag-pill ${res.totalChanged > 0 ? "accent" : ""}">\u26A1 ${countText}</span>
        </div>
      `;
      }
    }
    try {
      if (compareSelectX && compareSelectY && comparePatient) {
        sessionStorage.setItem(
          "fichas_atm_view",
          JSON.stringify({
            view: "compare",
            pKey: comparePatient,
            xId: compareSelectX.value,
            yId: compareSelectY.value
          })
        );
      }
    } catch {
    }
    renderCompareTab(activeCompareTab, res);
  }
  function renderCompareTab(tabKey, res) {
    if (!comparePanelsWrap) return;
    comparePanelsWrap.innerHTML = "";
    if (tabKey === "summary") {
      const allChanged = res.sections.flatMap(
        (sec) => sec.fields.filter((f) => f.changed).map((f) => ({
          ...f,
          sectionTitle: sec.title.replace(/^\d+\.\s*/, "")
        }))
      );
      if (allChanged.length === 0) {
        const empty = document.createElement("div");
        empty.className = "cmp-summary-empty";
        empty.innerHTML = `
        <h3>Sin modificaciones registradas</h3>
        <p>Todos los par\xE1metros cl\xEDnicos evaluados mantuvieron el mismo estado entre ambas sesiones. Pod\xE9s navegar por las pesta\xF1as superiores para revisar cada secci\xF3n de la ficha.</p>
      `;
        comparePanelsWrap.append(empty);
        return;
      }
      const block = document.createElement("div");
      block.className = "cmp-changes-block";
      block.innerHTML = `
      <div class="cmp-changes-block-head">
        <h3><span class="bar"></span>Par\xE1metros que cambiaron (${allChanged.length})</h3>
      </div>
      <div class="cmp-changes-grid"></div>
    `;
      const gridEl = block.querySelector(".cmp-changes-grid");
      const dateXStr = formatDate(res.sessionX.fechaSesion);
      const dateYStr = formatDate(res.sessionY.fechaSesion);
      allChanged.forEach((f) => {
        const item = document.createElement("div");
        item.className = "cmp-change-item";
        let trendClass = "same";
        let trendLabel = "Modificado";
        if (f.trend === "better") {
          trendClass = "better";
          trendLabel = "Mejor\xEDa cl\xEDnica";
        } else if (f.trend === "worse") {
          trendClass = "worse";
          trendLabel = "Empeoramiento";
        }
        const deltaHtml = f.deltaText ? `<span class="cmp-delta-badge ${trendClass}">${escapeHtml(f.deltaText)}</span>` : "";
        item.innerHTML = `
        <div class="cmp-change-header">
          <span class="cmp-change-sec-tag">${escapeHtml(f.sectionTitle)}</span>
          <div class="cmp-change-tags">
            ${deltaHtml}
            <span class="cmp-trend-tag ${trendClass}">${trendLabel}</span>
          </div>
        </div>
        <div class="cmp-change-label">${escapeHtml(f.label)}</div>
        <div class="cmp-change-transition">
          <div class="cmp-trans-col cmp-trans-prev">
            <span class="cmp-trans-meta">Sesi\xF3n inicial (${escapeHtml(dateXStr)})</span>
            <span class="cmp-trans-val">${escapeHtml(f.previous || "\u2014")}</span>
          </div>
          <div class="cmp-trans-arrow" aria-hidden="true">\u2794</div>
          <div class="cmp-trans-col cmp-trans-curr">
            <span class="cmp-trans-meta">Sesi\xF3n de control (${escapeHtml(dateYStr)})</span>
            <span class="cmp-trans-val">${escapeHtml(f.current || "\u2014")}</span>
          </div>
        </div>
      `;
        gridEl.append(item);
      });
      comparePanelsWrap.append(block);
      return;
    }
    const sectionsToRender = tabKey === "all" ? res.sections : [res.sections[Number(tabKey)]].filter(Boolean);
    sectionsToRender.forEach((sec) => {
      const panel = document.createElement("div");
      panel.className = "cmp-panel";
      panel.innerHTML = `
      <h2><span class="bar"></span>${escapeHtml(sec.title)}</h2>
      <div class="cmp-panel-grid"></div>
    `;
      const gridEl = panel.querySelector(".cmp-panel-grid");
      sec.fields.forEach((f) => {
        const box = document.createElement("div");
        box.className = `cmp-field-box ${f.changed ? "is-changed" : "is-same"}`;
        if (f.changed) {
          let trendClass = "same";
          let trendLabel = "Cambi\xF3";
          if (f.trend === "better") {
            trendClass = "better";
            trendLabel = "Mejora";
          } else if (f.trend === "worse") {
            trendClass = "worse";
            trendLabel = "Empeor\xF3";
          }
          const deltaHtml = f.deltaText ? `<span class="cmp-delta-badge ${trendClass}">${escapeHtml(f.deltaText)}</span>` : "";
          box.innerHTML = `
          <div class="cmp-field-top">
            <span class="cmp-field-title">${escapeHtml(f.label)}</span>
            <div class="cmp-field-badges" style="display:flex; align-items:center; gap:6px;">
              <span class="cmp-pill-changed">Cambi\xF3</span>
              <span class="cmp-trend-tag ${trendClass}">${trendLabel}</span>
            </div>
          </div>
          <div class="cmp-field-val-box">
            <span class="cmp-field-prev" title="Sesi\xF3n inicial">${escapeHtml(f.previous || "\u2014")}</span>
            <span class="cmp-field-arrow">\u2794</span>
            <span class="cmp-field-curr" title="Sesi\xF3n de control">${escapeHtml(f.current || "\u2014")}</span>
            ${deltaHtml}
          </div>
        `;
        } else {
          box.innerHTML = `
          <div class="cmp-field-top">
            <span class="cmp-field-title">${escapeHtml(f.label)}</span>
            <span class="cmp-pill-same">Sin cambios</span>
          </div>
          <div class="cmp-field-static">${escapeHtml(f.current || "\u2014")}</div>
        `;
        }
        gridEl.append(box);
      });
      comparePanelsWrap.append(panel);
    });
  }
  function buildComparePrintSheet(res) {
    const sessionUser = typeof activeSessionUserGetter3 === "function" ? activeSessionUserGetter3() : null;
    const sheet = node("article", "print-sheet pf-compare");
    const head = node("header", "pf-head");
    const brand = node("div", "pf-brand");
    const logo = document.createElement("img");
    logo.src = sessionUser?.logoDataUrl || "./icons/icon.svg";
    logo.alt = sessionUser?.institucion || "Fichas ATM";
    logo.onerror = () => {
      logo.style.display = "none";
    };
    const titles = node("div", "pf-titles");
    titles.append(
      node("h1", "", "Evoluci\xF3n cl\xEDnica de ATM"),
      node("p", "pf-sub", "Comparativa cuantitativa y cualitativa entre sesiones")
    );
    brand.append(logo, titles);
    const sessionMeta = node("div", "pf-session");
    const diffDays = res.daysBetween != null ? `${res.daysBetween} d\xEDas` : "\u2014";
    sessionMeta.append(
      node("span", "", "Lapso evaluado"),
      node("strong", "", `${formatDate(res.sessionX.fechaSesion)} \u2794 ${formatDate(res.sessionY.fechaSesion)}`),
      node("span", "", `Intervalo: ${diffDays}`)
    );
    head.append(brand, sessionMeta);
    const who = node("section", "pf-who");
    who.append(node("h2", "pf-name", res.patient.nombre || "Paciente"));
    const whoGrid = node("div", "pf-grid");
    whoGrid.append(
      node("div", "pf-field", `Documento: ${res.patient.dni || "\u2014"}`),
      node("div", "pf-field", `Edad: ${res.patient.edad ? `${res.patient.edad} a\xF1os` : "\u2014"}`),
      node("div", "pf-field", `Total cambios registrados: ${res.totalChanged}`)
    );
    who.append(whoGrid);
    const kpiSection = node("section", "pf-section");
    kpiSection.append(node("h2", "", "Indicadores clave de evoluci\xF3n"));
    const kpiGrid = node("div", "pf-compare-kpi-grid");
    const kpiDefs = [
      { title: "Dolor (EVA)", data: res.kpis.eva },
      { title: "Apertura libre", data: res.kpis.aperturaLibre },
      { title: "Apertura con dolor", data: res.kpis.aperturaDolor },
      { title: "Ruidos articulares", data: res.kpis.ruidos }
    ];
    kpiDefs.forEach((k) => {
      const card = node("div", "pf-compare-kpi");
      card.append(node("span", "", k.title));
      const trendText = k.data.trend === "better" ? " (Mejora)" : k.data.trend === "worse" ? " (Empeor\xF3)" : "";
      const deltaStr = k.data.deltaText ? ` [${k.data.deltaText}${trendText}]` : "";
      card.append(node("strong", "", `${k.data.current ?? "\u2014"}${deltaStr}`));
      kpiGrid.append(card);
    });
    kpiSection.append(kpiGrid);
    const tableSection = node("section", "pf-section");
    tableSection.append(node("h2", "", "Detalle comparativo por secci\xF3n"));
    const table = node("table", "pf-compare-table");
    const thead = node("thead", "");
    thead.innerHTML = `<tr><th>Secci\xF3n / Par\xE1metro</th><th>Sesi\xF3n base (${formatDate(
      res.sessionX.fechaSesion
    )})</th><th>Sesi\xF3n actual (${formatDate(res.sessionY.fechaSesion)})</th><th>Estado</th></tr>`;
    table.append(thead);
    const tbody = node("tbody", "");
    res.sections.forEach((sec) => {
      const headerRow = node("tr", "sec-header-row");
      headerRow.innerHTML = `<td colspan="4" style="background:#f8fafc; font-weight:700; color:#031c42; padding:6px 8px;">${escapeHtml(
        sec.title
      )}</td>`;
      tbody.append(headerRow);
      sec.fields.forEach((f) => {
        const tr = node("tr", f.changed ? "is-changed" : "");
        const deltaText = f.deltaText ? ` (${f.deltaText})` : "";
        const statusText = f.changed ? f.trend === "better" ? `Mejora${deltaText}` : f.trend === "worse" ? `Empeoramiento${deltaText}` : `Modificado${deltaText}` : "Sin cambios";
        tr.innerHTML = `
        <td style="padding-left:14px;">${escapeHtml(f.label)}</td>
        <td>${escapeHtml(f.previous || "\u2014")}</td>
        <td>${escapeHtml(f.current || "\u2014")}</td>
        <td><strong>${escapeHtml(statusText)}</strong></td>
      `;
        tbody.append(tr);
      });
    });
    table.append(tbody);
    tableSection.append(table);
    const profKey = res.sessionY?.profesional || "default";
    const details = sessionUser || CLINICIAN_DETAILS[profKey] || {
      nombre: res.sessionY?.profesionalNombre || "Profesional tratante",
      titulo: "Kinesi\xF3logo/a - Fisioterapeuta",
      matricula: "",
      signatureDataUrl: "",
      signatureFile: ""
    };
    const sigBox = node("div", "pf-signature");
    const sigImg = document.createElement("img");
    sigImg.className = "pf-sig-image";
    sigImg.alt = `Firma digital ${details.nombre}`;
    const sigSrc = details.signatureDataUrl || details.signatureFile || "";
    if (sigSrc) {
      sigImg.src = sigSrc;
      sigImg.onerror = () => {
        sigImg.classList.add("pf-sig-missing");
        sigImg.style.display = "none";
      };
    } else {
      sigImg.style.display = "none";
    }
    const sigStamp = node("div", "pf-sig-stamp");
    sigStamp.append(
      node("span", "pf-sig-rule"),
      node("strong", "pf-sig-name", details.nombre),
      node("span", "pf-sig-title", details.titulo),
      details.matricula ? node("span", "pf-sig-mat", details.matricula) : null
    );
    sigBox.append(sigImg, sigStamp);
    const foot = node("footer", "pf-foot");
    const clinicText = sessionUser?.institucion ? ` \xB7 ${sessionUser.institucion}` : "";
    const contactText = sessionUser?.contacto || "Documento confidencial de evoluci\xF3n cl\xEDnica";
    foot.append(
      node("span", "", `Informe comparativo de evoluci\xF3n cl\xEDnica${clinicText}`),
      node("span", "", contactText)
    );
    sheet.append(head, who, kpiSection, tableSection, sigBox, foot);
    return sheet;
  }
  async function printCompare(res) {
    if (!res) return;
    const root = document.querySelector("#print-root");
    if (!root) return;
    root.replaceChildren();
    root.append(buildComparePrintSheet(res));
    const previousTitle = document.title;
    document.title = `Evoluci\xF3n ATM - ${res.patient.nombre || "Paciente"} - ${formatDate(
      res.sessionX.fechaSesion
    )} vs ${formatDate(res.sessionY.fechaSesion)}`;
    await Promise.all(
      [...root.querySelectorAll("img")].map(
        (img) => img.decode ? img.decode() : Promise.resolve()
      ).map((p) => p.catch(() => {
      }))
    );
    window.print();
    setTimeout(() => {
      document.title = previousTitle;
    }, 1e3);
  }
  function initCompare({ getAllFichas, getSessionUser, onBackToLibrary, onBackToForm }) {
    activeAllFichasGetter = getAllFichas;
    activeSessionUserGetter3 = getSessionUser;
    if (compareSwapBtn) {
      compareSwapBtn.addEventListener("click", () => {
        const curX = compareSelectX.value;
        const curY = compareSelectY.value;
        compareSelectX.value = curY;
        compareSelectY.value = curX;
        renderCompareContent();
      });
    }
    if (compareSelectX) compareSelectX.addEventListener("change", renderCompareContent);
    if (compareSelectY) compareSelectY.addEventListener("change", renderCompareContent);
    if (compareBackBtn) {
      compareBackBtn.addEventListener("click", () => {
        if (compareView) compareView.hidden = true;
        try {
          sessionStorage.setItem(
            "fichas_atm_view",
            JSON.stringify({ view: comparePreviousView || "library" })
          );
        } catch {
        }
        if (comparePreviousView === "form") {
          if (typeof onBackToForm === "function") onBackToForm();
        } else {
          if (typeof onBackToLibrary === "function") onBackToLibrary();
        }
      });
    }
    if (comparePdfBtn) {
      comparePdfBtn.addEventListener("click", () => {
        if (currentCompareResult) printCompare(currentCompareResult);
      });
    }
    document.querySelectorAll(".compare-steps button").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCompareTab = btn.dataset.compareTab;
        document.querySelectorAll(".compare-steps button").forEach((b) => {
          b.classList.toggle("active", b === btn);
        });
        if (currentCompareResult) {
          renderCompareTab(activeCompareTab, currentCompareResult);
        }
      });
    });
  }

  // js/modules/print.js
  var activeClinicianGetter = null;
  function setClinicianGetter(fn) {
    activeClinicianGetter = fn;
  }
  var CDI_LABELS = {
    "I.a": "I.a) Dolor miofascial sin limitaci\xF3n de apertura",
    "I.b": "I.b) Dolor miofascial con limitaci\xF3n de apertura",
    "II.a": "II.a) Desplazamiento discal con recaptura",
    "II.b": "II.b) Desplazamiento discal sin recaptura con limitaci\xF3n de apertura",
    "II.c": "II.c) Desplazamiento discal sin recaptura sin limitaci\xF3n de apertura",
    "III.a": "III.a) Artralgia",
    "III.b": "III.b) Artrosis de la ATM",
    "III.c": "III.c) Osteoartritis de la ATM"
  };
  function buildSheet(item, sessionUser = null, meta = {}) {
    const sheet = node("article", "print-sheet");
    const sIdx = meta.sessionIndex || 1;
    const sTotal = meta.totalSessions || 1;
    const isFollowUp = shouldOmitInvariableFields(sIdx, sTotal);
    if (isFollowUp) {
      sheet.classList.add("pf-sheet-followup");
    }
    const customClinician = typeof activeClinicianGetter === "function" ? activeClinicianGetter() : null;
    const head = node("header", isFollowUp ? "pf-head pf-head-followup" : "pf-head");
    const brand = node("div", "pf-brand");
    const logo = document.createElement("img");
    logo.src = customClinician?.logoDataUrl || "./icons/icon.svg";
    logo.alt = customClinician?.institucion || "Fichas ATM";
    logo.onerror = () => {
      logo.style.display = "none";
    };
    const titles = node("div", "pf-titles");
    titles.append(
      node("h1", "", isFollowUp ? "Ficha cl\xEDnica de ATM \xB7 Evoluci\xF3n" : "Ficha cl\xEDnica de ATM"),
      node("p", "pf-sub", "Evaluaci\xF3n seg\xFAn criterios CDI-TTM")
    );
    brand.append(logo, titles);
    const session = node("div", "pf-session");
    const sessionBadgeText = formatSessionBadgeText(sIdx, sTotal);
    session.append(
      node("span", "pf-session-badge", sessionBadgeText),
      node("span", "pf-session-label", "Fecha de sesi\xF3n"),
      node("strong", "pf-session-date", formatDate(item.fechaSesion))
    );
    head.append(brand, session);
    let who;
    if (!isFollowUp) {
      who = node("section", "pf-who");
      who.append(node("h2", "pf-name", item.nombre || "Sin nombre"));
      const computedAge = item.edad || ageOn(item.nacimiento, item.fechaSesion);
      add(
        who,
        grid([
          ["Documento", item.dni],
          ["Edad", computedAge ? `${computedAge} a\xF1os` : ""],
          ["Nacimiento", formatParts([item.nacimiento ? formatDate(item.nacimiento) : "", item.lugarNac])],
          ["Motivo de consulta", item.motivo]
        ])
      );
      const habitosList = formatParts(
        [
          item.habitoApretamiento ? "Apretamiento diurno" : "",
          item.habitoBruxismo ? "Bruxismo nocturno" : "",
          item.habitoMasticacionUni ? "Masticaci\xF3n unilateral" : "",
          item.habitoOnicofagia ? "Onicofagia / mordisqueo" : ""
        ],
        ", "
      );
      if (habitosList) add(who, grid([["H\xE1bitos / bruxismo", habitosList]]));
      add(who, prose("Antecedentes cl\xEDnicos", item.antecedentes));
    } else {
      who = node("section", "pf-who pf-who-followup");
      const followupBar = node("div", "pf-followup-bar");
      const patientIdentity = node("div", "pf-followup-identity");
      patientIdentity.append(
        node("span", "pf-k", "Paciente"),
        node("h2", "pf-name pf-name-compact", item.nombre || "Sin nombre"),
        node("span", "pf-followup-doc", `DNI ${item.dni || "\u2014"}`)
      );
      followupBar.append(patientIdentity);
      const initialMotivo = (meta.initialMotivo || "").trim();
      const currentMotivo = (item.motivo || "").trim();
      const hasSpecificEvolution = currentMotivo && currentMotivo !== initialMotivo;
      if (hasSpecificEvolution) {
        followupBar.append(
          node("span", "pf-followup-note", "Antecedentes e historia basal en Sesi\xF3n N\xB0 1")
        );
        who.append(followupBar);
        const evoBox = node("div", "pf-followup-evo");
        evoBox.append(
          node("span", "pf-k", "Evoluci\xF3n cl\xEDnica / Motivo de consulta"),
          node("p", "", currentMotivo)
        );
        who.append(evoBox);
      } else {
        followupBar.append(
          node("span", "pf-followup-note", "Datos filiatorios y antecedentes registrados en Sesi\xF3n N\xB0 1")
        );
        who.append(followupBar);
      }
    }
    const atm = section("Articulaci\xF3n temporomandibular");
    const fases = [item.faseApertura ? "apertura" : "", item.faseCierre ? "cierre" : ""].filter(Boolean).join(" y ");
    const tiposRuido = [item.ruidoClic ? "clic / chasquido" : "", item.ruidoCrep ? "crepitaci\xF3n" : ""].filter(Boolean).join(" y ");
    const patronDesv = [item.desvCorregida ? "corregida en S" : "", item.deflexion ? "deflexi\xF3n" : ""].filter(Boolean).join(" \xB7 ");
    const hasPostMediciones = Boolean(
      item.aperturaLibrePost || item.aperturaDolorPost || item.desviacionPost || item.protrusionPost || item.latIzqPost || item.latDerPost
    );
    const atmFields = [
      [
        "Ruidos articulares",
        item.ruidos === "S\xED" ? formatParts([
          item.ruidos,
          side(item.ruidosIzq, item.ruidosDer),
          fases && `en ${fases}`,
          tiposRuido && `(${tiposRuido})`
        ]) : item.ruidos === "No" ? "No" : ""
      ],
      [
        "Dolor condilar",
        item.dolorCondilar === "S\xED" ? formatParts([item.dolorCondilar, side(item.condilarIzq, item.condilarDer)]) : item.dolorCondilar === "No" ? "No" : ""
      ],
      [hasPostMediciones ? "Apertura libre (antes)" : "Apertura libre de dolor", item.aperturaLibre ? `${item.aperturaLibre} mm` : ""],
      [hasPostMediciones ? "Apertura con dolor (antes)" : "Apertura con dolor", item.aperturaDolor ? `${item.aperturaDolor} mm` : ""],
      [
        hasPostMediciones ? "Desviaci\xF3n (antes)" : "Desviaci\xF3n de trayectoria",
        item.desviacion === "S\xED" ? formatParts([
          item.desviacion,
          side(item.desvIzq, item.desvDer),
          patronDesv && `(${patronDesv})`
        ]) : item.desviacion === "No" ? "No" : ""
      ],
      [hasPostMediciones ? "Protrusi\xF3n (antes)" : "Protrusi\xF3n", item.protrusion ? `${item.protrusion} mm` : ""],
      [
        hasPostMediciones ? "Lateralidades (antes)" : "Lateralidades",
        formatParts([
          item.latIzq ? `Izq ${item.latIzq} mm` : "",
          item.latDer ? `Der ${item.latDer} mm` : ""
        ])
      ]
    ];
    if (hasPostMediciones) {
      const patronDesvPost = [item.desvCorregidaPost ? "corregida en S" : "", item.deflexionPost ? "deflexi\xF3n" : ""].filter(Boolean).join(" \xB7 ");
      atmFields.push(
        ["Apertura libre (al finalizar)", item.aperturaLibrePost ? `${item.aperturaLibrePost} mm` : ""],
        ["Apertura dolor (al finalizar)", item.aperturaDolorPost ? `${item.aperturaDolorPost} mm` : ""],
        [
          "Desviaci\xF3n (al finalizar)",
          item.desviacionPost === "S\xED" ? formatParts([
            item.desviacionPost,
            side(item.desvIzqPost, item.desvDerPost),
            patronDesvPost && `(${patronDesvPost})`
          ]) : item.desviacionPost === "No" ? "No" : ""
        ],
        ["Protrusi\xF3n (al finalizar)", item.protrusionPost ? `${item.protrusionPost} mm` : ""],
        [
          "Lateralidades (al finalizar)",
          formatParts([
            item.latIzqPost ? `Izq ${item.latIzqPost} mm` : "",
            item.latDerPost ? `Der ${item.latDerPost} mm` : ""
          ])
        ]
      );
    }
    add(atm, grid(atmFields));
    const mus = section("M\xFAsculos craneales y disco articular");
    add(
      mus,
      grid([
        ["Masetero", side(item.maseteroIzq, item.maseteroDer)],
        ["Temporal anterior", side(item.temporalIzq, item.temporalDer)],
        ["Pterigoideo medial", side(item.pterMedIzq, item.pterMedDer)],
        ["Pterigoideo lateral", side(item.pterLatIzq, item.pterLatDer)],
        ["Disco con recaptura", side(item.discoConIzq, item.discoConDer)],
        ["Disco sin recaptura", side(item.discoSinIzq, item.discoSinDer)]
      ])
    );
    const cerv = section("Correlaci\xF3n cervical y postural");
    add(
      cerv,
      grid([
        ["Trapecio superior", side(item.trapecioIzq, item.trapecioDer)],
        ["ECOM", side(item.ecomIzq, item.ecomDer)],
        ["Suboccipitales", side(item.suboccipitalIzq, item.suboccipitalDer)]
      ])
    );
    add(cerv, prose("Observaciones cervicales / postura", item.obsCervical));
    const pain = section("Dolor y oclusi\xF3n");
    const evaNum = Number(item.eva);
    const hasEva = Number.isFinite(evaNum) && evaNum > 0;
    const painGrid = grid([
      ["Zona", item.zona],
      ["Caracter\xEDsticas", item.caracteristicas],
      ["Contacto dentario", item.contacto],
      ["Estabilidad oclusal", item.estabilidad],
      ["Clasificaci\xF3n de Angle", item.angle],
      ["Configuraci\xF3n esqueletal", item.esqueletal]
    ]);
    const painProse = prose("Factores que modifican el dolor", item.factores);
    if (hasEva || painGrid || painProse) {
      const eva = Math.max(0, Math.min(10, Math.round(evaNum || 0)));
      const evaBox = node("div", "pf-eva");
      evaBox.append(node("span", "pf-k", "Valoraci\xF3n EVA"));
      const track = node("div", "pf-eva-track");
      const fill = node("div", "pf-eva-fill");
      fill.style.width = `${eva * 10}%`;
      const evaLevel = eva === 0 ? "zero" : eva <= 3 ? "mild" : eva <= 6 ? "moderate" : "severe";
      const evaLabel = eva === 0 ? "Sin dolor" : eva <= 3 ? "Dolor leve" : eva <= 6 ? "Dolor moderado" : "Dolor severo";
      fill.classList.add(`pf-eva-${evaLevel}`);
      track.append(fill);
      const scoreBox = node("div", "pf-eva-score");
      scoreBox.append(
        node("strong", "", `${eva} / 10`),
        node("span", "pf-eva-tag", evaLabel)
      );
      evaBox.append(track, scoreBox);
      pain.append(evaBox);
      add(pain, painGrid);
      add(pain, painProse);
    }
    const cdi = section("Criterios diagn\xF3sticos CDI-TTM");
    const selected = item.cdi || [];
    const obs = prose("Observaciones cl\xEDnicas", item.observaciones);
    const plan = prose("Plan de tratamiento", item.plan);
    const notesSession = prose("Anotaciones de la sesi\xF3n", item.anotaciones);
    const fotosList = Array.isArray(item.fotosUrls) && item.fotosUrls.length > 0 ? item.fotosUrls : item.fotoUrl ? [item.fotoUrl] : [];
    if (selected.length > 0 || obs || plan || notesSession || fotosList.length > 0) {
      const chips = node("div", "pf-chips");
      if (selected.length) {
        for (const id of selected) chips.append(node("span", "pf-chip", CDI_LABELS[id] || id));
      } else {
        chips.append(node("span", "pf-empty", "Sin criterios marcados"));
      }
      cdi.append(chips);
      const notes = node("div", "pf-notes");
      if (obs) notes.append(obs);
      if (plan) notes.append(plan);
      if (notes.childElementCount) cdi.append(notes);
      if (notesSession) cdi.append(notesSession);
      if (fotosList.length > 0) {
        const validFotos = fotosList.filter((f) => {
          const str = String(f || "").trim();
          return str.startsWith("data:image/") || str.startsWith("blob:") || /^https?:\/\//i.test(str) || str.includes("foto.php");
        }).map((f) => {
          const str = String(f || "").trim();
          if (str.includes("/admin/api/foto.php")) return DEMO_PHOTO_1;
          return str;
        });
        if (validFotos.length > 0) {
          const fotoWrap = node("div", "pf-foto-box");
          fotoWrap.append(node("span", "pf-subhead", validFotos.length === 1 ? "Foto cl\xEDnica adjunta" : `Fotos cl\xEDnicas adjuntas (${validFotos.length})`));
          const grid2 = node("div", "pf-attached-photos-grid");
          for (const fUrl of validFotos) {
            const img = document.createElement("img");
            img.className = "pf-attached-photo";
            img.src = fUrl;
            img.alt = "Foto cl\xEDnica de la sesi\xF3n";
            grid2.append(img);
          }
          fotoWrap.append(grid2);
          cdi.append(fotoWrap);
        }
      }
    }
    const profId = item.profesionalId || item.profesional || "";
    const details = (typeof activeClinicianGetter === "function" ? activeClinicianGetter(profId) : null) || {
      nombre: item.profesionalNombre || "Profesional actuante",
      titulo: "Kinesi\xF3logo/a - Fisioterapeuta",
      matricula: "",
      signatureDataUrl: "",
      signatureFile: ""
    };
    const sigBox = node("div", "pf-signature");
    const sigImg = document.createElement("img");
    sigImg.className = "pf-sig-image";
    sigImg.alt = `Firma digital ${details.nombre}`;
    const sigSrc = details.signatureDataUrl || details.signatureFile || "";
    if (sigSrc) {
      sigImg.src = sigSrc;
      sigImg.onerror = () => {
        sigImg.classList.add("pf-sig-missing");
        sigImg.style.display = "none";
      };
    } else {
      sigImg.style.display = "none";
    }
    const sigStamp = node("div", "pf-sig-stamp");
    sigStamp.append(
      node("span", "pf-sig-rule"),
      node("strong", "pf-sig-name", details.nombre),
      node("span", "pf-sig-title", details.titulo),
      details.matricula ? node("span", "pf-sig-mat", details.matricula) : null
    );
    sigBox.append(sigImg, sigStamp);
    const foot = node("footer", "pf-foot");
    const clinicText = customClinician?.institucion ? ` \xB7 ${customClinician.institucion}` : "";
    const contactText = customClinician?.contacto || "Documento de evoluci\xF3n cl\xEDnica confidencial";
    foot.append(
      node("span", "", `Documento cl\xEDnico confidencial${clinicText}`),
      node("span", "", contactText)
    );
    sheet.append(head, who);
    for (const block of [atm, mus, cerv, pain, cdi]) {
      if (block.querySelector(".pf-grid, .pf-prose, .pf-eva, .pf-chip, .pf-empty")) {
        sheet.append(block);
      }
    }
    sheet.append(sigBox, foot);
    return sheet;
  }
  async function printItems(items, sessionUser = null) {
    const root = document.querySelector("#print-root");
    if (!root || !items.length) return;
    root.replaceChildren();
    const groups = /* @__PURE__ */ new Map();
    for (const item of items) {
      const key = patientKey(item);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    for (const group of groups.values()) {
      group.sort((a, b) => (a.fechaSesion || "").localeCompare(b.fechaSesion || ""));
      const initialMotivo = (group[0]?.motivo || "").trim();
      group.forEach((item, idx) => {
        root.append(
          buildSheet(item, sessionUser, {
            sessionIndex: idx + 1,
            totalSessions: group.length,
            initialMotivo
          })
        );
      });
    }
    const previousTitle = document.title;
    const names = [...new Set(items.map((item) => (item.nombre || "Paciente").trim()))];
    const dates = items.map((item) => formatDate(item.fechaSesion)).filter((date) => date !== "Sin fecha");
    const who = names.length === 1 ? names[0] : "Fichas ATM";
    const when = dates.length ? dates.length === 1 ? dates[0].replaceAll("/", "-") : `${dates[0].replaceAll("/", "-")} a ${dates[dates.length - 1].replaceAll("/", "-")}` : "";
    const isFullHistory = groups.size === 1 && items.length > 1;
    document.title = [who, when, isFullHistory ? "Historial Completo" : ""].filter(Boolean).join(" - ");
    await Promise.all(
      [...root.querySelectorAll("img")].map(
        (img) => img.decode ? img.decode() : Promise.resolve()
      ).map((p) => p.catch(() => {
      }))
    );
    window.print();
    setTimeout(() => {
      document.title = previousTitle;
    }, 1e3);
  }

  // js/modules/settings.js
  var professionalsList = [];
  var activeProfessionalId = null;
  var onProfessionalChangeCallbacks = [];
  var DEFAULT_PROFESSIONAL = {
    id: "prof_default",
    nombre: "Profesional Tratante",
    titulo: "Kinesi\xF3logo/a - Fisioterapeuta",
    matricula: "",
    institucion: "Consultorio de ATM",
    contacto: "",
    signatureDataUrl: "",
    logoDataUrl: ""
  };
  function onProfessionalChange(callback) {
    if (typeof callback === "function") {
      onProfessionalChangeCallbacks.push(callback);
    }
  }
  function notifyProfessionalChange() {
    const active = getActiveProfessional();
    for (const cb of onProfessionalChangeCallbacks) {
      try {
        cb(active, professionalsList);
      } catch (e) {
        console.error(e);
      }
    }
  }
  async function initSettings() {
    let savedList = await getSetting("professionals", null);
    if (!savedList || !Array.isArray(savedList) || savedList.length === 0) {
      const legacySingle = await getSetting("clinician", null);
      if (legacySingle && legacySingle.nombre) {
        savedList = [{ ...legacySingle, id: legacySingle.id || `prof_${Date.now()}` }];
      } else {
        savedList = [{ ...DEFAULT_PROFESSIONAL, id: `prof_${Date.now()}` }];
      }
      await saveSetting("professionals", savedList);
    }
    professionalsList = savedList;
    const savedActiveId = await getSetting("activeProfessionalId", null);
    if (savedActiveId && professionalsList.some((p) => p.id === savedActiveId)) {
      activeProfessionalId = savedActiveId;
    } else {
      activeProfessionalId = professionalsList[0].id;
      await saveSetting("activeProfessionalId", activeProfessionalId);
    }
    syncTopbarSelector();
    notifyProfessionalChange();
    return getActiveProfessional();
  }
  function getProfessionals() {
    return [...professionalsList];
  }
  function getActiveProfessional() {
    if (!professionalsList.length) return { ...DEFAULT_PROFESSIONAL };
    const found = professionalsList.find((p) => p.id === activeProfessionalId);
    return found ? { ...found } : { ...professionalsList[0] };
  }
  function getProfessionalById(id) {
    if (!id) return getActiveProfessional();
    const found = professionalsList.find((p) => p.id === id || p.nombre === id);
    return found ? { ...found } : getActiveProfessional();
  }
  async function setActiveProfessional(id) {
    if (professionalsList.some((p) => p.id === id)) {
      activeProfessionalId = id;
      await saveSetting("activeProfessionalId", id);
      syncTopbarSelector();
      notifyProfessionalChange();
    }
  }
  function syncTopbarSelector() {
    const select = document.querySelector("#topbar-prof-select");
    if (!select) return;
    select.innerHTML = "";
    for (const p of professionalsList) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nombre || "Profesional sin nombre";
      if (p.id === activeProfessionalId) opt.selected = true;
      select.appendChild(opt);
    }
  }
  function setupSettingsModal() {
    const modal = document.querySelector("#modal-settings");
    const openBtn = document.querySelector("#btn-open-settings");
    const closeBtn = document.querySelector("#btn-close-settings");
    const saveBtn = document.querySelector("#btn-save-settings");
    const newProfBtn = document.querySelector("#btn-new-professional");
    const deleteProfBtn = document.querySelector("#btn-delete-professional");
    const profSelectModal = document.querySelector("#modal-select-professional");
    const inputNombre = document.querySelector("#setting-nombre");
    const inputTitulo = document.querySelector("#setting-titulo");
    const inputMatricula = document.querySelector("#setting-matricula");
    const inputInstitucion = document.querySelector("#setting-institucion");
    const inputContacto = document.querySelector("#setting-contacto");
    const inputSignature = document.querySelector("#setting-signature-file");
    const previewSignature = document.querySelector("#setting-signature-preview");
    const removeSignatureBtn = document.querySelector("#btn-remove-signature");
    const boxSignaturePreview = document.querySelector("#box-signature-preview");
    const magicTransparentBtn = document.querySelector("#btn-magic-transparent");
    const inputLogo = document.querySelector("#setting-logo-file");
    const previewLogo = document.querySelector("#setting-logo-preview");
    const removeLogoBtn = document.querySelector("#btn-remove-logo");
    const boxLogoPreview = document.querySelector("#box-logo-preview");
    const cancelSettingsBtn = document.querySelector("#btn-cancel-settings");
    const topbarSelect = document.querySelector("#topbar-prof-select");
    let currentEditingId = null;
    let tempSignature = "";
    let tempLogo = "";
    if (topbarSelect) {
      topbarSelect.addEventListener("change", (e) => {
        setActiveProfessional(e.target.value);
      });
    }
    function populateModalList(selectedId) {
      if (!profSelectModal) return;
      profSelectModal.innerHTML = "";
      for (const p of professionalsList) {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.nombre || "Profesional sin nombre";
        if (p.id === selectedId) opt.selected = true;
        profSelectModal.appendChild(opt);
      }
    }
    function loadProfessionalIntoForm(id) {
      currentEditingId = id;
      const p = professionalsList.find((item) => item.id === id) || professionalsList[0] || { ...DEFAULT_PROFESSIONAL };
      if (inputNombre) inputNombre.value = p.nombre || "";
      if (inputTitulo) inputTitulo.value = p.titulo || "";
      if (inputMatricula) inputMatricula.value = p.matricula || "";
      if (inputInstitucion) inputInstitucion.value = p.institucion || "";
      if (inputContacto) inputContacto.value = p.contacto || "";
      tempSignature = p.signatureDataUrl || "";
      updateSignaturePreview();
      tempLogo = p.logoDataUrl || "";
      updateLogoPreview();
      if (deleteProfBtn) {
        deleteProfBtn.disabled = professionalsList.length <= 1;
        deleteProfBtn.title = professionalsList.length <= 1 ? "Debe existir al menos un profesional registrado." : "Eliminar este profesional";
      }
    }
    function updateSignaturePreview() {
      if (!previewSignature) return;
      if (tempSignature) {
        previewSignature.src = tempSignature;
        if (boxSignaturePreview) boxSignaturePreview.hidden = false;
      } else {
        previewSignature.src = "";
        if (boxSignaturePreview) boxSignaturePreview.hidden = true;
      }
    }
    function updateLogoPreview() {
      if (!previewLogo) return;
      if (tempLogo) {
        previewLogo.src = tempLogo;
        if (boxLogoPreview) boxLogoPreview.hidden = false;
      } else {
        previewLogo.src = "";
        if (boxLogoPreview) boxLogoPreview.hidden = true;
      }
    }
    if (openBtn) {
      openBtn.addEventListener("click", () => {
        populateModalList(activeProfessionalId);
        loadProfessionalIntoForm(activeProfessionalId);
        if (modal) modal.hidden = false;
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        if (modal) modal.hidden = true;
      });
    }
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.hidden = true;
      });
    }
    if (profSelectModal) {
      profSelectModal.addEventListener("change", (e) => {
        loadProfessionalIntoForm(e.target.value);
      });
    }
    if (newProfBtn) {
      newProfBtn.addEventListener("click", () => {
        const newId = `prof_${Date.now()}`;
        const newProf = {
          id: newId,
          nombre: "Nuevo Profesional",
          titulo: "Kinesi\xF3logo/a - Fisioterapeuta",
          matricula: "",
          institucion: professionalsList[0]?.institucion || "Consultorio de ATM",
          contacto: professionalsList[0]?.contacto || "",
          signatureDataUrl: "",
          logoDataUrl: professionalsList[0]?.logoDataUrl || ""
        };
        professionalsList.push(newProf);
        populateModalList(newId);
        loadProfessionalIntoForm(newId);
        inputNombre?.focus();
        inputNombre?.select();
      });
    }
    if (deleteProfBtn) {
      deleteProfBtn.addEventListener("click", async () => {
        if (professionalsList.length <= 1) {
          dialogAlert("Debe existir al menos un profesional registrado.");
          return;
        }
        const p = professionalsList.find((item) => item.id === currentEditingId);
        const confirmed = await dialogConfirm(
          `\xBFEliminar el perfil de "${p?.nombre || "este profesional"}"? Las fichas hist\xF3ricas conservar\xE1n su nombre registrado.`
        );
        if (!confirmed) return;
        professionalsList = professionalsList.filter((item) => item.id !== currentEditingId);
        await saveSetting("professionals", professionalsList);
        if (activeProfessionalId === currentEditingId) {
          activeProfessionalId = professionalsList[0].id;
          await saveSetting("activeProfessionalId", activeProfessionalId);
        }
        syncTopbarSelector();
        populateModalList(activeProfessionalId);
        loadProfessionalIntoForm(activeProfessionalId);
        notifyProfessionalChange();
        await dialogAlert("Profesional eliminado correctamente.", { type: "success" });
      });
    }
    if (inputSignature) {
      inputSignature.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) return;
        try {
          const compressed = await compressImage(file, { maxDimension: 800, quality: 0.95, preserveTransparency: true });
          tempSignature = await blobToDataURL(compressed);
          updateSignaturePreview();
        } catch (err) {
          dialogAlert(err.message || "Error al cargar la firma");
        }
      });
    }
    if (removeSignatureBtn) {
      removeSignatureBtn.addEventListener("click", () => {
        tempSignature = "";
        updateSignaturePreview();
      });
    }
    if (magicTransparentBtn) {
      magicTransparentBtn.addEventListener("click", async () => {
        if (!tempSignature) return;
        try {
          magicTransparentBtn.disabled = true;
          magicTransparentBtn.textContent = "Procesando...";
          tempSignature = await makeWhiteTransparent(tempSignature);
          updateSignaturePreview();
          await dialogAlert("Fondo blanco convertido a transparente con \xE9xito.", { type: "success" });
        } catch (err) {
          dialogAlert("No se pudo procesar la imagen: " + (err.message || err));
        } finally {
          magicTransparentBtn.disabled = false;
          magicTransparentBtn.textContent = "\u{1FA84} Quitar fondo blanco";
        }
      });
    }
    if (inputLogo) {
      inputLogo.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) return;
        try {
          const compressed = await compressImage(file, { maxDimension: 600, quality: 0.95, preserveTransparency: true });
          tempLogo = await blobToDataURL(compressed);
          updateLogoPreview();
        } catch (err) {
          dialogAlert(err.message || "Error al cargar el logo");
        }
      });
    }
    if (removeLogoBtn) {
      removeLogoBtn.addEventListener("click", () => {
        tempLogo = "";
        updateLogoPreview();
      });
    }
    if (cancelSettingsBtn) {
      cancelSettingsBtn.addEventListener("click", () => {
        if (modal) modal.hidden = true;
      });
    }
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const idx = professionalsList.findIndex((item) => item.id === currentEditingId);
        if (idx === -1) return;
        const updated = {
          ...professionalsList[idx],
          nombre: inputNombre?.value.trim() || "Profesional sin nombre",
          titulo: inputTitulo?.value.trim() || "",
          matricula: inputMatricula?.value.trim() || "",
          institucion: inputInstitucion?.value.trim() || "",
          contacto: inputContacto?.value.trim() || "",
          signatureDataUrl: tempSignature,
          logoDataUrl: tempLogo
        };
        professionalsList[idx] = updated;
        await saveSetting("professionals", professionalsList);
        if (currentEditingId === activeProfessionalId) {
          notifyProfessionalChange();
        }
        syncTopbarSelector();
        populateModalList(currentEditingId);
        if (modal) modal.hidden = true;
        await dialogAlert("Perfil profesional y firma guardados localmente.", { type: "success" });
      });
    }
  }

  // js/app.js
  async function refresh() {
    const all = await listFichas();
    setCache(all);
    renderLibrary();
    return all;
  }
  async function upsert2(ficha) {
    const saved = await saveFicha(ficha);
    await refresh();
    return saved;
  }
  async function remove(id) {
    await deleteFicha(id);
    await refresh();
  }
  async function initApp() {
    try {
      await initDb();
      await initSettings();
      setClinicianGetter((id) => getProfessionalById(id));
      onProfessionalChange((active, list) => {
        syncFormProfessionals(list, active.id);
        updateLibraryProfFilter(list);
        renderLibrary();
      });
      initForm({
        onSave: async (data, meta) => {
          if (meta?.identityKey) {
            const siblings = loadAll().filter(
              (ficha) => ficha.id !== data.id && patientKey(ficha) === meta.identityKey
            );
            for (const sibling of siblings) {
              const next = { ...sibling };
              for (const key of PATIENT_FIELDS) next[key] = data[key];
              next.sinDocumento = Boolean(data.sinDocumento);
              next.edad = ageOn(data.nacimiento, sibling.fechaSesion) || sibling.edad;
              await upsert2(next);
            }
          }
          if (!data.profesional) {
            data.profesional = getActiveProfessional().id;
          }
          const prof = getProfessionalById(data.profesional);
          if (prof) {
            data.profesionalNombre = prof.nombre;
            data.profesionalId = prof.id;
          }
          await upsert2(data);
          await dialogAlert("Sesi\xF3n cl\xEDnica guardada correctamente en tu dispositivo.", { type: "success" });
          showLibrary();
        },
        onBack: () => {
          showLibrary();
        },
        onCompare: (pKey, id) => {
          showCompare(pKey, id);
        },
        onPrint: (items) => {
          printItems(items, getActiveProfessional());
        },
        getSessionUser: () => getActiveProfessional()
      });
      initLibrary({
        getSessionUser: () => getActiveProfessional(),
        onOpenFicha: (item) => {
          fillForm(item, loadAll());
          showForm(0);
        },
        onNewSessionFicha: (copy) => {
          fillForm(copy, loadAll());
          showForm(0);
        },
        onPdfFicha: (items) => {
          printItems(items, getActiveProfessional());
        },
        onDeleteFicha: async (item) => {
          try {
            await remove(item.id);
          } catch (error) {
            dialogAlert(error.message);
          }
        },
        onDeleteBatchFichas: async (items) => {
          for (const item of items) {
            await deleteFicha(item.id);
          }
          await refresh();
          dialogAlert(`Se eliminaron ${items.length} fichas.`, { type: "success" });
        },
        onComparePatient: (pKey) => {
          showCompare(pKey);
        },
        onNewFichaBlank: () => {
          fillForm(blank(), loadAll());
          showForm(0);
        },
        upsertFn: upsert2,
        blankFn: blank,
        fillFormFn: (d) => fillForm(d, loadAll()),
        showFormFn: (targetStep = 0) => showForm(targetStep),
        todayStr: todayISO()
      });
      initCompare({
        getAllFichas: loadAll,
        getSessionUser: () => getActiveProfessional(),
        onBackToLibrary: () => {
          showLibrary();
        },
        onBackToForm: () => {
          showForm(0);
        }
      });
      setupSettingsModal();
      syncFormProfessionals(getProfessionals(), getActiveProfessional().id);
      updateLibraryProfFilter(getProfessionals());
      const btnBackupExport = document.querySelector("#btn-backup-export");
      if (btnBackupExport) {
        btnBackupExport.addEventListener("click", () => {
          openExportModal();
        });
      }
      window.FichasATM = {
        openExportModal: () => {
          openExportModal();
        },
        openSettings: () => {
          const modal = document.querySelector("#modal-settings");
          if (modal) modal.hidden = false;
        },
        closeSettings: () => {
          const modal = document.querySelector("#modal-settings");
          if (modal) modal.hidden = true;
        },
        openLegal: () => {
          const modal = document.querySelector("#modal-legal");
          if (modal) modal.hidden = false;
        },
        closeLegal: () => {
          const modal = document.querySelector("#modal-legal");
          if (modal) modal.hidden = true;
        },
        exportBackup: async () => {
          openExportModal();
        },
        newSession: () => {
          fillForm(blank(), loadAll());
          showForm(0);
        },
        loadExample: async () => {
          const sample = exampleFicha();
          sample.id = `ficha_demo_${Date.now()}`;
          sample.nombre = "Paciente de Ejemplo (Demostraci\xF3n)";
          sample.dni = "99.999.999";
          sample.fechaSesion = todayISO();
          await upsert2(sample);
          await dialogAlert("Se carg\xF3 una ficha cl\xEDnica de ejemplo completa en tu biblioteca.", { type: "success" });
          showLibrary();
        },
        showLibrary: () => showLibrary()
      };
      document.querySelector("#btn-open-settings")?.addEventListener("click", () => window.FichasATM.openSettings());
      document.querySelector("#btn-open-legal")?.addEventListener("click", () => window.FichasATM.openLegal());
      document.querySelector("#brand-link")?.addEventListener("click", (e) => {
        e.preventDefault();
        window.FichasATM.showLibrary();
      });
      const backupFileInput = document.querySelector("#backup-file-input");
      if (backupFileInput) {
        backupFileInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          e.target.value = "";
          if (!file) return;
          const confirmed = await dialogConfirm(
            "\xBFDeseas restaurar las fichas de este archivo? Las fichas existentes se mantendr\xE1n y las del respaldo se incorporar\xE1n a tu biblioteca."
          );
          if (!confirmed) return;
          try {
            const res = await importBackup(file);
            await refresh();
            await initSettings();
            let msg = `Se importaron ${res.importedCount} fichas con \xE9xito.`;
            if (res.clinicianImported) {
              msg += " Tambi\xE9n se actualizaron tus datos de perfil profesional.";
            }
            await dialogAlert(msg, { type: "success" });
          } catch (err) {
            dialogAlert(err.message || "Error al importar el archivo de respaldo.");
          }
        });
      }
      const modalLegal = document.querySelector("#modal-legal");
      const btnOpenLegal = document.querySelector("#btn-open-legal");
      const btnCloseLegal = document.querySelector("#btn-close-legal");
      if (btnOpenLegal) {
        btnOpenLegal.addEventListener("click", () => {
          if (modalLegal) modalLegal.hidden = false;
        });
      }
      if (btnCloseLegal) {
        btnCloseLegal.addEventListener("click", () => {
          if (modalLegal) modalLegal.hidden = true;
        });
      }
      if (modalLegal) {
        modalLegal.addEventListener("click", (e) => {
          if (e.target === modalLegal) modalLegal.hidden = true;
        });
      }
      const btnExampleFicha = document.querySelector("#btn-example-ficha");
      if (btnExampleFicha) {
        btnExampleFicha.addEventListener("click", async () => {
          const sample = exampleFicha();
          sample.id = `ficha_demo_${Date.now()}`;
          sample.nombre = "Paciente de Ejemplo (Demostraci\xF3n)";
          sample.dni = "99.999.999";
          sample.fechaSesion = todayISO();
          await upsert2(sample);
          await dialogAlert("Se carg\xF3 una ficha cl\xEDnica de ejemplo completa en tu biblioteca.", { type: "success" });
          showLibrary();
        });
      }
      await refresh();
      if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
        navigator.serviceWorker.register("./sw.js").catch(() => {
        });
      }
      let savedView = null;
      try {
        savedView = JSON.parse(sessionStorage.getItem("fichas_atm_view") || "null");
      } catch {
      }
      if (savedView?.view === "form") {
        showForm(0);
      } else if (savedView?.view === "compare") {
        showCompare(savedView.pKey, savedView.xId, savedView.yId);
      } else {
        showLibrary();
      }
    } catch (error) {
      console.error("Error al inicializar la app:", error);
      dialogAlert("Error al iniciar el almacenamiento local: " + error.message);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
