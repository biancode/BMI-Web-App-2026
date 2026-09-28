/* Einstellungen und Passwort werden über die API (Node-RED hinter nginx unter /api/) gespeichert. */

const API_BASE = "/api";

const DEFAULT_SETTINGS = {
  username: "",
  email: "",
  wishBmi: "",
  height: "",
  age: "",
  gender: "",
  theme: "light",
};

const THEMES = ["light", "dark"];
const GENDERS = ["", "female", "male", "diverse"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

/* --- API ---------------------------------------------------- */

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* Ein Netzwerkfehler (Server nicht erreichbar) wirft ApiError mit status 0. */
async function apiRequest(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ApiError(0, "Server nicht erreichbar.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, `Anfrage fehlgeschlagen (${response.status}).`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function fetchSettings() {
  return apiRequest("/settings");
}

function uploadSettings(settings) {
  return apiRequest("/settings", { method: "PUT", body: settings });
}

function changePassword(currentPassword, newPassword) {
  return apiRequest("/password", { method: "POST", body: { currentPassword, newPassword } });
}

/* Unbekannte Felder vom Server ignorieren, ungültige Werte auf den Standard zurücksetzen. */
function normalizeSettings(raw) {
  const settings = { ...DEFAULT_SETTINGS };
  Object.keys(DEFAULT_SETTINGS).forEach((key) => {
    if (raw && raw[key] !== undefined && raw[key] !== null) settings[key] = String(raw[key]);
  });
  if (!THEMES.includes(settings.theme)) settings.theme = DEFAULT_SETTINGS.theme;
  if (!GENDERS.includes(settings.gender)) settings.gender = DEFAULT_SETTINGS.gender;
  return settings;
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function readForm(form) {
  const data = new FormData(form);
  return {
    username: (data.get("username") ?? "").trim(),
    email: (data.get("email") ?? "").trim(),
    wishBmi: data.get("wishBmi") ?? "",
    height: data.get("height") ?? "",
    age: data.get("age") ?? "",
    gender: data.get("gender") ?? "",
    theme: data.get("theme") || DEFAULT_SETTINGS.theme,
  };
}

function fillForm(form, settings) {
  form.elements.username.value = settings.username;
  form.elements.email.value = settings.email;
  form.elements.wishBmi.value = settings.wishBmi;
  form.elements.height.value = settings.height;
  form.elements.age.value = settings.age;
  form.elements.gender.value = settings.gender;
  form.elements.theme.value = settings.theme;
}

/* --- Fehlermeldungen ---------------------------------------------------- */

function setError(inputId, message) {
  const input = document.getElementById(inputId);
  const output = document.getElementById(`${inputId}-error`);

  if (output) output.textContent = message;
  if (input) {
    if (message) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
  }
}

function clearErrors(inputIds) {
  inputIds.forEach((id) => setError(id, ""));
}

const statusTimers = new Map();

function showStatus(element, message, variant) {
  element.textContent = message;
  element.classList.remove("settings-status--error", "settings-status--success");
  if (variant) element.classList.add(`settings-status--${variant}`);

  clearTimeout(statusTimers.get(element));

  /* Fehler bleiben stehen, Erfolgsmeldungen blenden sich aus. */
  if (variant !== "error") {
    statusTimers.set(
      element,
      setTimeout(() => {
        element.textContent = "";
        element.classList.remove("settings-status--success");
      }, 2500),
    );
  }
}

/* --- Prüfungen ---------------------------------------------------- */

/* Leere Felder sind erlaubt, gefüllte müssen im Rahmen liegen. */
function checkNumber(value, { min, max, label }) {
  if (value === "") return "";
  const number = Number(value);
  if (Number.isNaN(number)) return `${label} muss eine Zahl sein.`;
  if (number < min || number > max) return `${label} muss zwischen ${min} und ${max} liegen.`;
  return "";
}

const SETTINGS_FIELDS = ["username", "email", "wish-bmi", "height", "age"];

function validateSettings(values) {
  const errors = {};

  if (values.username && values.username.length < 3) {
    errors.username = "Der Benutzername braucht mindestens 3 Zeichen.";
  }

  if (values.email && !EMAIL_PATTERN.test(values.email)) {
    errors.email = "Bitte eine gültige E-Mail Adresse eingeben.";
  }

  const wishBmi = checkNumber(values.wishBmi, { min: 10, max: 60, label: "Der Wunsch BMI" });
  if (wishBmi) errors["wish-bmi"] = wishBmi;

  const height = checkNumber(values.height, { min: 50, max: 260, label: "Die Größe" });
  if (height) errors.height = height;

  const age = checkNumber(values.age, { min: 1, max: 120, label: "Das Alter" });
  if (age) errors.age = age;

  return errors;
}

const PASSWORD_FIELDS = ["current-password", "new-password", "repeat-password"];

function validatePassword({ current, next, repeat }) {
  const errors = {};

  if (!current) {
    errors["current-password"] = "Bitte das aktuelle Passwort eingeben.";
  }

  if (!next) {
    errors["new-password"] = "Bitte ein neues Passwort eingeben.";
  } else if (next.length < MIN_PASSWORD_LENGTH) {
    errors["new-password"] = `Das neue Passwort braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`;
  } else if (next === current) {
    errors["new-password"] = "Das neue Passwort muss sich vom aktuellen unterscheiden.";
  }

  if (!repeat) {
    errors["repeat-password"] = "Bitte das neue Passwort wiederholen.";
  } else if (next && repeat !== next) {
    errors["repeat-password"] = "Die Passwörter stimmen nicht überein.";
  }

  return errors;
}

/* --- Start ---------------------------------------------------- */


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("settings-form");
  const status = document.getElementById("settings-status");
  const passwordForm = document.getElementById("password-form");
  const passwordStatus = document.getElementById("password-status");
  const showPasswords = document.getElementById("show-passwords");

  fillForm(form, DEFAULT_SETTINGS);
  applyTheme(DEFAULT_SETTINGS.theme);

  fetchSettings()
    .then((remote) => {
      if (!remote) return;
      const settings = normalizeSettings(remote);
      fillForm(form, settings);
      applyTheme(settings.theme);
    })
    .catch((error) => {
      console.warn("Einstellungen konnten nicht geladen werden:", error);
    });

  /* Das Theme wirkt sofort, auch ohne Speichern. */
  form.elements.theme.forEach((radio) => {
    radio.addEventListener("change", (event) => applyTheme(event.target.value));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const values = readForm(form);
    const errors = validateSettings(values);

    clearErrors(SETTINGS_FIELDS);
    Object.entries(errors).forEach(([field, message]) => setError(field, message));

    if (Object.keys(errors).length > 0) {
      showStatus(status, "Bitte die markierten Felder prüfen.", "error");
      return;
    }

    applyTheme(values.theme);

    try {
      await uploadSettings(values);
      showStatus(status, "Gespeichert", "success");
    } catch (error) {
      showStatus(status, `Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });

  showPasswords.addEventListener("change", () => {
    const type = showPasswords.checked ? "text" : "password";
    PASSWORD_FIELDS.forEach((id) => {
      document.getElementById(id).type = type;
    });
  });

  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(passwordForm);
    const current = data.get("currentPassword") ?? "";
    const next = data.get("newPassword") ?? "";
    const errors = validatePassword({
      current,
      next,
      repeat: data.get("repeatPassword") ?? "",
    });

    clearErrors(PASSWORD_FIELDS);
    Object.entries(errors).forEach(([field, message]) => setError(field, message));

    if (Object.keys(errors).length > 0) {
      showStatus(passwordStatus, "Bitte die markierten Felder prüfen.", "error");
      return;
    }

    try {
      await changePassword(current, next);
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        setError("current-password", "Das aktuelle Passwort ist falsch.");
        showStatus(passwordStatus, "Bitte die markierten Felder prüfen.", "error");
      } else {
        showStatus(passwordStatus, `Passwort nicht geändert: ${error.message}`, "error");
      }
      return;
    }

    passwordForm.reset();
    showPasswords.checked = false;
    PASSWORD_FIELDS.forEach((id) => {
      document.getElementById(id).type = "password";
    });
    showStatus(passwordStatus, "Passwort geändert", "success");
  });
});
