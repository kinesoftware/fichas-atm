/**
 * Fichas ATM - Aplicación Principal (Local-First)
 * Orquesta la interfaz de usuario, almacenamiento en IndexedDB,
 * generador de PDF, comparador de sesiones y soporte offline (PWA).
 */

import {
  initDb,
  saveFicha,
  getFicha,
  listFichas,
  deleteFicha,
  exportBackup,
  importBackup,
} from "./storage/db.js";

import {
  patientKey,
  PATIENT_FIELDS,
  ageOn,
  emptyFicha,
  exampleFicha,
} from "./core/ficha-rules.mjs";

import {
  initForm,
  fillForm,
  readForm,
  showForm,
  blank,
  todayISO,
} from "./modules/form.js";

import {
  initLibrary,
  showLibrary,
  renderLibrary,
  setCache,
  loadAll,
} from "./modules/library.js";

import {
  initCompare,
  showCompare,
} from "./modules/compare.js";

import {
  printItems,
  setClinicianGetter,
} from "./modules/print.js";

import {
  initSettings,
  getClinician,
  setupSettingsModal,
} from "./modules/settings.js";

import {
  dialogAlert,
  dialogConfirm,
} from "./modules/dom.js";

// Sincronizar datos y refrescar la biblioteca
async function refresh() {
  const all = await listFichas();
  setCache(all);
  renderLibrary();
  return all;
}

async function upsert(ficha) {
  const saved = await saveFicha(ficha);
  await refresh();
  return saved;
}

async function remove(id) {
  await deleteFicha(id);
  await refresh();
}

// Inicialización de la aplicación
async function initApp() {
  try {
    // 1. Inicializar base de datos local y configuración profesional
    await initDb();
    await initSettings();
    setClinicianGetter(() => getClinician());

    // 2. Conectar controlador del formulario clínico
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
            await upsert(next);
          }
        }
        await upsert(data);
        await dialogAlert("Sesión clínica guardada correctamente en tu dispositivo.", { type: "success" });
        showLibrary();
      },
      onBack: () => {
        showLibrary();
      },
      onCompare: (pKey, id) => {
        showCompare(pKey, id);
      },
      onPrint: (items) => {
        printItems(items, getClinician());
      },
      getSessionUser: () => getClinician(),
    });

    // 3. Conectar controlador de la biblioteca
    initLibrary({
      getSessionUser: () => getClinician(),
      onOpenFicha: (item) => {
        fillForm(item, loadAll());
        showForm(0);
      },
      onNewSessionFicha: (copy) => {
        fillForm(copy, loadAll());
        showForm(0);
      },
      onPdfFicha: (items) => {
        printItems(items, getClinician());
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
      upsertFn: upsert,
      blankFn: blank,
      fillFormFn: (d) => fillForm(d, loadAll()),
      showFormFn: (targetStep = 0) => showForm(targetStep),
      todayStr: todayISO(),
    });

    // 4. Conectar controlador del comparador de sesiones
    initCompare({
      getAllFichas: loadAll,
      getSessionUser: () => getClinician(),
      onBackToLibrary: () => {
        showLibrary();
      },
      onBackToForm: () => {
        showForm(0);
      },
    });

    // 5. Configuración de perfil profesional y firma
    setupSettingsModal();

    // 6. Botones de Respaldo Global (Backup JSON)
    const btnBackupExport = document.querySelector("#btn-backup-export");
    if (btnBackupExport) {
      btnBackupExport.addEventListener("click", async () => {
        const fichas = loadAll();
        if (!fichas.length) {
          dialogAlert("Aún no tienes fichas guardadas para respaldar.");
          return;
        }
        await exportBackup();
      });
    }

    // Exponer API global para eventos seguros y llamadas directas
    window.FichasATM = {
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
        const fichas = loadAll();
        if (!fichas.length) {
          dialogAlert("Aún no tienes fichas guardadas para respaldar.");
          return;
        }
        await exportBackup();
      },
      newSession: () => {
        fillForm(blank(), loadAll());
        showForm(0);
      },
      loadExample: async () => {
        const sample = exampleFicha();
        sample.id = `ficha_demo_${Date.now()}`;
        sample.nombre = "Paciente de Ejemplo (Demostración)";
        sample.dni = "99.999.999";
        sample.fechaSesion = todayISO();
        await upsert(sample);
        await dialogAlert("Se cargó una ficha clínica de ejemplo completa en tu biblioteca.", { type: "success" });
        showLibrary();
      },
      showLibrary: () => showLibrary(),
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
          "¿Deseas restaurar las fichas de este archivo? Las fichas existentes se mantendrán y las del respaldo se incorporarán a tu biblioteca."
        );
        if (!confirmed) return;

        try {
          const res = await importBackup(file);
          await refresh();
          await initSettings();
          let msg = `Se importaron ${res.importedCount} fichas con éxito.`;
          if (res.clinicianImported) {
            msg += " También se actualizaron tus datos de perfil profesional.";
          }
          await dialogAlert(msg, { type: "success" });
        } catch (err) {
          dialogAlert(err.message || "Error al importar el archivo de respaldo.");
        }
      });
    }

    // 7. Modal Legal & Privacidad
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

    // 8. Botón Cargar Ficha de Ejemplo (para demostración inicial)
    const btnExampleFicha = document.querySelector("#btn-example-ficha");
    if (btnExampleFicha) {
      btnExampleFicha.addEventListener("click", async () => {
        const sample = exampleFicha();
        sample.id = `ficha_demo_${Date.now()}`;
        sample.nombre = "Paciente de Ejemplo (Demostración)";
        sample.dni = "99.999.999";
        sample.fechaSesion = todayISO();
        await upsert(sample);
        await dialogAlert("Se cargó una ficha clínica de ejemplo completa en tu biblioteca.", { type: "success" });
        showLibrary();
      });
    }

    // 9. Cargar fichas existentes desde IndexedDB
    await refresh();

    // 10. Registrar Service Worker para soporte offline (PWA)
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }

    // 11. Restaurar vista previa si existe en sessionStorage
    let savedView = null;
    try {
      savedView = JSON.parse(sessionStorage.getItem("fichas_atm_view") || "null");
    } catch {}

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

// Iniciar al cargar el DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
