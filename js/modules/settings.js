/**
 * Fichas ATM - Configuración del Profesional e Identidad Clínica (Local-First)
 * Permite a cualquier profesional configurar sus datos para el encabezado y pie de página
 * de las hojas de impresión y reportes médicos en PDF.
 */

import { getSetting, saveSetting } from "../storage/db.js";
import { dialogAlert } from "./dom.js";
import { compressImage, blobToDataURL } from "./form-image.js";

let cachedClinician = null;

const DEFAULT_CLINICIAN = {
  nombre: "",
  titulo: "Kinesiólogo/a - Fisioterapeuta",
  matricula: "",
  institucion: "Consultorio de ATM y Fisioterapia",
  contacto: "",
  signatureDataUrl: "",
  logoDataUrl: "",
};

export async function initSettings() {
  const saved = await getSetting("clinician", null);
  cachedClinician = saved ? { ...DEFAULT_CLINICIAN, ...saved } : { ...DEFAULT_CLINICIAN };
  return cachedClinician;
}

export function getClinician() {
  return cachedClinician || { ...DEFAULT_CLINICIAN };
}

export function setupSettingsModal() {
  const modal = document.querySelector("#modal-settings");
  const openBtn = document.querySelector("#btn-open-settings");
  const closeBtn = document.querySelector("#btn-close-settings");
  const saveBtn = document.querySelector("#btn-save-settings");

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

  let tempSignature = "";
  let tempLogo = "";

  function populateForm() {
    const c = getClinician();
    if (inputNombre) inputNombre.value = c.nombre || "";
    if (inputTitulo) inputTitulo.value = c.titulo || "";
    if (inputMatricula) inputMatricula.value = c.matricula || "";
    if (inputInstitucion) inputInstitucion.value = c.institucion || "";
    if (inputContacto) inputContacto.value = c.contacto || "";

    tempSignature = c.signatureDataUrl || "";
    updateSignaturePreview();

    tempLogo = c.logoDataUrl || "";
    updateLogoPreview();
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
      populateForm();
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
      const updated = {
        nombre: inputNombre?.value.trim() || "",
        titulo: inputTitulo?.value.trim() || "",
        matricula: inputMatricula?.value.trim() || "",
        institucion: inputInstitucion?.value.trim() || "",
        contacto: inputContacto?.value.trim() || "",
        signatureDataUrl: tempSignature,
        logoDataUrl: tempLogo,
      };

      await saveSetting("clinician", updated);
      cachedClinician = updated;
      if (modal) modal.hidden = true;
      await dialogAlert("Datos profesionales y firma guardados localmente.", { type: "success" });
    });
  }
}
