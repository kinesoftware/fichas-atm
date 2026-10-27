/**
 * Fichas ATM - Utilidades DOM y Diálogos Modales Accesibles
 */

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function node(tag, className = "", text = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== "" && text !== null && text !== undefined) el.textContent = String(text);
  return el;
}

export function field(label, value) {
  const box = node("div", "pf-field");
  box.append(node("span", "pf-k", label), node("span", "pf-v", value || "—"));
  return box;
}

export function side(left, right) {
  const isLeft = Boolean(left && left !== "No" && left !== "0" && left !== "false");
  const isRight = Boolean(right && right !== "No" && right !== "0" && right !== "false");
  if (isLeft && isRight) return "Bilateral";
  if (isLeft) return "Izquierda";
  if (isRight) return "Derecha";
  return "";
}

export function section(title) {
  const sec = node("section", "pf-section");
  sec.append(node("h2", "", title));
  return sec;
}

export function grid(fields) {
  const g = node("div", "pf-grid");
  for (const [k, v] of fields) {
    if (v !== undefined && v !== null && v !== "") {
      g.append(field(k, v));
    }
  }
  return g.childElementCount > 0 ? g : null;
}

export function prose(label, value) {
  if (!value) return null;
  const box = node("div", "pf-prose");
  box.append(node("span", "pf-k", label), node("p", "", value));
  return box;
}

export function formatParts(parts, sep = " · ") {
  return parts.filter(Boolean).join(sep);
}

export function add(parent, child) {
  if (child) parent.append(child);
}

let dialogQueue = Promise.resolve();

function enqueueDialog(task) {
  const run = dialogQueue.then(task, task);
  dialogQueue = run.then(() => {}, () => {});
  return run;
}

export function dialogAlert(message, options = {}) {
  const msgStr = String(message ?? "");
  const inferredSuccess = options.type === "success" || /(éxito|correctamente|restauraron|guardados|guardado|importó|importaron)/i.test(msgStr);
  const inferredDanger = options.type === "danger" || (!inferredSuccess && /(error|falló|supera|inválido|no es|no se pudo|falta)/i.test(msgStr));
  const finalType = options.type || (inferredSuccess ? "success" : (inferredDanger ? "danger" : "info"));

  return enqueueDialog(() => openDialog({ message: msgStr, confirm: false, alertType: finalType }));
}

export function dialogConfirm(message, options = {}) {
  return enqueueDialog(() =>
    openDialog({
      message,
      confirm: true,
      danger: Boolean(options.danger),
      okText: options.okText,
      cancelText: options.cancelText,
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
        finish(confirm ? false : undefined);
      } else if (event.key === "Enter") {
        event.preventDefault();
        finish(confirm ? true : undefined);
      }
    };
    cancel?.addEventListener("click", () => finish(false));
    ok.addEventListener("click", () => finish(confirm ? true : undefined));
    root.addEventListener("click", (event) => {
      if (event.target === root) finish(confirm ? false : undefined);
    });
    document.addEventListener("keydown", onKey);
    ok.focus();
  });
}

export function debounce(fn, delay = 150) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
