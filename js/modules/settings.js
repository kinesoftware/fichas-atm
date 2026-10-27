/**
 * Fichas ATM - Gestión Multi-Profesional (Local-First)
 * Permite registrar múltiples profesionales en un mismo equipo/consultorio,
 * asociar sesiones a cada profesional, cambiar de usuario activo y firmar informes PDF.
 */

import { getSetting, saveSetting } from "../storage/db.js";
import { dialogAlert, dialogConfirm } from "./dom.js";
import { compressImage, blobToDataURL } from "./form-image.js";

let professionalsList = [];
let activeProfessionalId = null;
let onProfessionalChangeCallbacks = [];

const DEFAULT_PROFESSIONAL = {
  id: "prof_default",
  nombre: "Profesional Tratante",
  titulo: "Kinesiólogo/a - Fisioterapeuta",
  matricula: "",
  institucion: "Consultorio de ATM",
  contacto: "",
  signatureDataUrl: "",
  logoDataUrl: "",
};

export function onProfessionalChange(callback) {
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

export async function initSettings() {
  // Cargar lista de profesionales guardados
  let savedList = await getSetting("professionals", null);

  // Migración retrocompatible si había un solo clinician guardado
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

  // Cargar profesional activo
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

export function getProfessionals() {
  return [...professionalsList];
}

export function getActiveProfessional() {
  if (!professionalsList.length) return { ...DEFAULT_PROFESSIONAL };
  const found = professionalsList.find((p) => p.id === activeProfessionalId);
  return found ? { ...found } : { ...professionalsList[0] };
}

export function getProfessionalById(id) {
  if (!id) return getActiveProfessional();
  const found = professionalsList.find((p) => p.id === id || p.nombre === id);
  return found ? { ...found } : getActiveProfessional();
}

export async function setActiveProfessional(id) {
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

export function setupSettingsModal() {
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

  const inputLogo = document.querySelector("#setting-logo-file");
  const previewLogo = document.querySelector("#setting-logo-preview");
  const removeLogoBtn = document.querySelector("#btn-remove-logo");

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

    // Actualizar estado del botón eliminar (no permitir si es el único profesional)
    if (deleteProfBtn) {
      deleteProfBtn.disabled = professionalsList.length <= 1;
      deleteProfBtn.title = professionalsList.length <= 1 ? "Debe existir al menos un profesional registrado." : "Eliminar este profesional";
    }
  }

  function updateSignaturePreview() {
    if (!previewSignature) return;
    if (tempSignature) {
      previewSignature.src = tempSignature;
      previewSignature.hidden = false;
      if (removeSignatureBtn) removeSignatureBtn.hidden = false;
    } else {
      previewSignature.src = "";
      previewSignature.hidden = true;
      if (removeSignatureBtn) removeSignatureBtn.hidden = true;
    }
  }

  function updateLogoPreview() {
    if (!previewLogo) return;
    if (tempLogo) {
      previewLogo.src = tempLogo;
      previewLogo.hidden = false;
      if (removeLogoBtn) removeLogoBtn.hidden = false;
    } else {
      previewLogo.src = "";
      previewLogo.hidden = true;
      if (removeLogoBtn) removeLogoBtn.hidden = true;
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
        titulo: "Kinesiólogo/a - Fisioterapeuta",
        matricula: "",
        institucion: professionalsList[0]?.institucion || "Consultorio de ATM",
        contacto: professionalsList[0]?.contacto || "",
        signatureDataUrl: "",
        logoDataUrl: professionalsList[0]?.logoDataUrl || "",
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
        `¿Eliminar el perfil de "${p?.nombre || "este profesional"}"? Las fichas históricas conservarán su nombre registrado.`
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

  // Carga de firma digital
  if (inputSignature) {
    inputSignature.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      try {
        const compressed = await compressImage(file, { maxDimension: 800, quality: 0.9 });
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

  // Carga de logo institucional
  if (inputLogo) {
    inputLogo.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      try {
        const compressed = await compressImage(file, { maxDimension: 600, quality: 0.9 });
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

  // Guardado de configuración
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
        logoDataUrl: tempLogo,
      };

      professionalsList[idx] = updated;
      await saveSetting("professionals", professionalsList);

      // Si estábamos editando el profesional activo, sincronizar
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
