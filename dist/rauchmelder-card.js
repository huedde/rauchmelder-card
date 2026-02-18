/**
 * Rauchmelder Card – Home Assistant Custom Lovelace Card
 * Kompakt, individuell konfigurierbare Icons, Farben und Texte.
 */

const CARD_VERSION = "1.6.0";

console.info(
  `%c RAUCHMELDER-CARD %c v${CARD_VERSION} `,
  "color: white; background: #e74c3c; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;",
  "color: #e74c3c; background: #ffeaea; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0;"
);

const ICON_OPTIONS = [
  { value: "mdi:smoke-detector", label: "Rauchmelder" },
  { value: "mdi:smoke-detector-alert", label: "Rauchmelder Alarm" },
  { value: "mdi:smoke-detector-off", label: "Rauchmelder Aus" },
  { value: "mdi:smoke-detector-off-outline", label: "Rauchmelder Aus (Outline)" },
  { value: "mdi:smoke-detector-outline", label: "Rauchmelder (Outline)" },
  { value: "mdi:smoke-detector-variant", label: "Rauchmelder Variante" },
  { value: "mdi:smoke-detector-variant-alert", label: "Rauchmelder Variante Alarm" },
  { value: "mdi:smoke-detector-variant-off", label: "Rauchmelder Variante Aus" },
  { value: "mdi:fire", label: "Feuer" },
  { value: "mdi:fire-alert", label: "Feuer Alarm" },
  { value: "mdi:fire-off", label: "Feuer Aus" },
  { value: "mdi:alarm-light", label: "Alarmleuchte" },
  { value: "mdi:alarm-light-off", label: "Alarmleuchte Aus" },
  { value: "mdi:alarm-light-outline", label: "Alarmleuchte (Outline)" },
  { value: "mdi:alert", label: "Warnung" },
  { value: "mdi:alert-circle", label: "Warnung Kreis" },
  { value: "mdi:alert-outline", label: "Warnung (Outline)" },
  { value: "mdi:check-circle", label: "OK Kreis" },
  { value: "mdi:check-circle-outline", label: "OK Kreis (Outline)" },
  { value: "mdi:shield-check", label: "Schild OK" },
  { value: "mdi:shield-alert", label: "Schild Alarm" },
  { value: "mdi:shield-off", label: "Schild Aus" },
  { value: "mdi:bell", label: "Glocke" },
  { value: "mdi:bell-alert", label: "Glocke Alarm" },
  { value: "mdi:bell-off", label: "Glocke Aus" },
  { value: "mdi:power", label: "Power" },
  { value: "mdi:power-off", label: "Power Aus" },
  { value: "mdi:lock", label: "Schloss" },
  { value: "mdi:lock-open", label: "Schloss offen" },
  { value: "mdi:lock-off", label: "Schloss Aus" },
  { value: "mdi:close-circle", label: "X Kreis" },
  { value: "mdi:cancel", label: "Abbrechen" },
  { value: "mdi:eye", label: "Auge" },
  { value: "mdi:eye-off", label: "Auge Aus" },
];

class RauchmelderCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  static getConfigElement() {
    return document.createElement("rauchmelder-card-editor");
  }

  static getStubConfig() {
    return {
      title: "Rauchmelder",
      entity_abschaltung: "",
      entity_fehler: "",
      entity_abschalten: "",
    };
  }

  static getLayoutOptions() {
    return { grid_columns: 2, grid_min_columns: 2, grid_rows: 2 };
  }

  setConfig(config) {
    this._config = {
      title: config.title || "Rauchmelder",
      entity_abschaltung: config.entity_abschaltung || "",
      entity_fehler: config.entity_fehler || "",
      entity_abschalten: config.entity_abschalten || "",
      icon: config.icon || "mdi:smoke-detector",
      icon_fehler: config.icon_fehler || "mdi:smoke-detector-alert",
      icon_abschaltung: config.icon_abschaltung || "mdi:smoke-detector-off",
      color_ok: config.color_ok || "#27ae60",
      color_fehler: config.color_fehler || "#e74c3c",
      color_abschaltung: config.color_abschaltung || "#f39c12",
      text_fehler: config.text_fehler || "Fehler aktiv",
      text_abschaltung: config.text_abschaltung || "Abgeschaltet",
      text_ok: config.text_ok || "OK",
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 2;
  }

  getLayoutOptions() {
    return { grid_columns: 2, grid_min_columns: 2, grid_rows: 2 };
  }

  _getState(entityId) {
    if (!this._hass || !entityId || !this._hass.states[entityId]) return null;
    return this._hass.states[entityId];
  }

  _isActive(entityId) {
    const state = this._getState(entityId);
    if (!state) return false;
    const s = state.state;
    return s === "on" || s === "locked";
  }

  _isDemo() {
    return (
      !this._config.entity_abschaltung &&
      !this._config.entity_fehler &&
      !this._config.entity_abschalten
    );
  }

  _toggleLock(entityId) {
    if (!this._hass || !entityId) return;
    const state = this._getState(entityId);
    if (!state) return;
    const domain = entityId.split(".")[0];
    if (domain === "lock") {
      const service = state.state === "locked" ? "unlock" : "lock";
      this._hass.callService("lock", service, { entity_id: entityId });
    } else if (domain === "switch") {
      this._hass.callService("switch", "toggle", { entity_id: entityId });
    } else {
      this._hass.callService("homeassistant", "toggle", { entity_id: entityId });
    }
  }

  _lastChanged(entityId) {
    const state = this._getState(entityId);
    if (!state) return "";
    const d = new Date(state.last_changed);
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  _hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  _render() {
    if (!this.shadowRoot || !this._config) return;

    const c = this._config;
    const demo = this._isDemo();
    const abschaltungOn = demo ? false : this._isActive(c.entity_abschaltung);
    const fehlerOn = demo ? false : this._isActive(c.entity_fehler);
    const abschaltenOn = demo ? false : this._isActive(c.entity_abschalten);

    const hasAlerts = abschaltungOn || fehlerOn;

    const statusColor = fehlerOn ? c.color_fehler : abschaltungOn ? c.color_abschaltung : c.color_ok;
    const statusBg = this._hexToRgba(statusColor, 0.15);

    const alerts = [];
    if (fehlerOn) {
      alerts.push(
        '<div class="alert" style="background:' + this._hexToRgba(c.color_fehler, 0.15) + ";color:" + c.color_fehler + '">' +
        '<ha-icon icon="' + c.icon_fehler + '"></ha-icon> ' + c.text_fehler + '</div>'
      );
    }
    if (abschaltungOn) {
      alerts.push(
        '<div class="alert" style="background:' + this._hexToRgba(c.color_abschaltung, 0.15) + ";color:" + c.color_abschaltung + '">' +
        '<ha-icon icon="' + c.icon_abschaltung + '"></ha-icon> ' + c.text_abschaltung + '</div>'
      );
    }

    const badgeText = demo ? "Vorschau" : fehlerOn ? c.text_fehler : abschaltungOn ? c.text_abschaltung : c.text_ok;
    const lastChanged = !demo && abschaltenOn && c.entity_abschalten ? this._lastChanged(c.entity_abschalten) : "";

    this.shadowRoot.innerHTML = `
      <ha-card>
        <style>
          :host {
            --text-primary: var(--primary-text-color, #333);
            --text-secondary: var(--secondary-text-color, #777);
          }

          ha-card {
            max-width: 250px;
          }

          .card {
            padding: 10px 12px;
          }

          .header {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .header .icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${statusBg};
            color: ${statusColor};
            flex-shrink: 0;
          }

          .header .icon ha-icon {
            --mdc-icon-size: 18px;
          }

          .header .info {
            flex: 1;
            min-width: 0;
          }

          .header .title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .header .last-changed {
            font-size: 10px;
            color: var(--text-secondary);
          }

          .header .badge {
            font-size: 10px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 8px;
            background: ${statusBg};
            color: ${statusColor};
            border: 1px solid ${this._hexToRgba(statusColor, 0.3)};
            flex-shrink: 0;
          }

          .alerts {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-top: 8px;
          }

          .alert {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
          }

          .alert ha-icon {
            --mdc-icon-size: 16px;
          }

          .toggle-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
          }

          .toggle-row .abgeschaltet-icon {
            color: ${c.color_fehler};
          }

          .toggle-row .abgeschaltet-icon ha-icon {
            --mdc-icon-size: 22px;
          }

          .toggle-switch {
            width: 36px;
            height: 20px;
            border-radius: 10px;
            background: ${abschaltenOn ? c.color_fehler : "#ccc"};
            position: relative;
            flex-shrink: 0;
            cursor: pointer;
            transition: background 0.2s ease;
          }

          .toggle-switch:hover {
            opacity: 0.85;
          }

          .toggle-switch:active {
            transform: scale(0.95);
          }

          .toggle-switch::after {
            content: '';
            position: absolute;
            top: 2px;
            left: ${abschaltenOn ? "18px" : "2px"};
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: white;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            transition: left 0.2s ease;
          }

          .demo-hint {
            text-align: center;
            font-size: 10px;
            color: var(--text-secondary);
            margin-top: 6px;
            font-style: italic;
          }
        </style>

        <div class="card">
          <div class="header">
            <div class="icon">
              <ha-icon icon="${c.icon}"></ha-icon>
            </div>
            <div class="info">
              <div class="title">${c.title}</div>
              ${lastChanged ? '<div class="last-changed">' + lastChanged + '</div>' : ""}
            </div>
            <div class="badge">${badgeText}</div>
          </div>

          ${hasAlerts ? '<div class="alerts">' + alerts.join("") + "</div>" : ""}

          <div class="toggle-row">
            <div class="toggle-switch" id="btn-toggle"></div>
            ${!demo && abschaltenOn ? '<div class="abgeschaltet-icon"><ha-icon icon="mdi:power"></ha-icon></div>' : ""}
          </div>

          ${demo ? '<div class="demo-hint">Entities im Editor konfigurieren</div>' : ""}
        </div>
      </ha-card>
    `;

    const btn = this.shadowRoot.getElementById("btn-toggle");
    if (btn && !demo) {
      btn.addEventListener("click", () => {
        this._toggleLock(c.entity_abschalten);
      });
    }
  }
}

/* ── Visueller Karteneditor ──────────────────────────────── */
class RauchmelderCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    this._config = { ...config };
    if (!this._rendered) {
      this._render();
    }
  }

  set hass(hass) {
    this._hass = hass;
  }

  _fireChanged() {
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: { ...this._config } } })
    );
  }

  _iconOptions(selected) {
    return ICON_OPTIONS.map(
      (o) => '<option value="' + o.value + '"' + (o.value === selected ? " selected" : "") + ">" + o.label + " (" + o.value + ")</option>"
    ).join("");
  }

  _updateIconPreview(key) {
    const preview = this.shadowRoot.getElementById(key + "_preview");
    if (preview) {
      preview.innerHTML = '<ha-icon icon="' + (this._config[key] || "mdi:smoke-detector") + '"></ha-icon> Vorschau';
    }
  }

  _render() {
    this._rendered = true;

    this.shadowRoot.innerHTML = `
      <style>
        .editor {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 0;
        }

        .section {
          border: 1px solid var(--divider-color, #3a3a3a);
          border-radius: 12px;
          padding: 16px;
          background: var(--card-background-color, var(--ha-card-background, #1c1c1c));
        }

        .section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--primary-text-color, #fff);
          margin-bottom: 14px;
        }

        .grid-1 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .field-label {
          font-size: 12px;
          color: var(--secondary-text-color, #aaa);
        }

        .field input[type="text"],
        .field select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--divider-color, #3a3a3a);
          border-radius: 10px;
          font-size: 13px;
          background: var(--input-fill-color, var(--secondary-background-color, #2a2a2a));
          color: var(--primary-text-color, #fff);
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
          -webkit-appearance: none;
          appearance: none;
        }

        .field select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23aaa' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
        }

        .field input[type="text"]:focus,
        .field select:focus {
          border-color: var(--primary-color, #03a9f4);
        }

        .field input[type="text"]::placeholder {
          color: var(--secondary-text-color, #666);
          font-size: 12px;
        }

        .icon-preview {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          font-size: 11px;
          color: var(--secondary-text-color, #aaa);
        }

        .icon-preview ha-icon {
          --mdc-icon-size: 20px;
          color: var(--primary-text-color, #fff);
        }

        .color-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .color-field .color-label {
          font-size: 12px;
          color: var(--secondary-text-color, #aaa);
        }

        .color-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .color-row input[type="color"] {
          width: 40px;
          height: 34px;
          border: 2px solid var(--divider-color, #3a3a3a);
          border-radius: 8px;
          cursor: pointer;
          padding: 2px;
          background: transparent;
          flex-shrink: 0;
          transition: border-color 0.2s;
        }

        .color-row input[type="color"]:hover {
          border-color: var(--primary-color, #03a9f4);
        }

        .color-row input[type="text"] {
          flex: 1;
          padding: 8px 10px;
          border: 1px solid var(--divider-color, #3a3a3a);
          border-radius: 8px;
          font-size: 12px;
          font-family: monospace;
          background: var(--input-fill-color, var(--secondary-background-color, #2a2a2a));
          color: var(--primary-text-color, #fff);
          box-sizing: border-box;
          outline: none;
          min-width: 0;
        }

        .color-row input[type="text"]:focus {
          border-color: var(--primary-color, #03a9f4);
        }
      </style>

      <div class="editor">
        <!-- ALLGEMEIN -->
        <div class="section">
          <div class="section-title">Allgemein</div>
          <div class="grid-1">
            <div class="field">
              <span class="field-label">Titel</span>
              <input type="text" id="title" value="${this._config.title || "Rauchmelder"}" />
            </div>
          </div>
        </div>

        <!-- ENTITIES -->
        <div class="section">
          <div class="section-title">Entities</div>
          <div class="grid-2">
            <div class="field">
              <span class="field-label">Abschaltung</span>
              <input type="text" id="entity_abschaltung" value="${this._config.entity_abschaltung || ""}" placeholder="binary_sensor..." />
            </div>
            <div class="field">
              <span class="field-label">Fehler</span>
              <input type="text" id="entity_fehler" value="${this._config.entity_fehler || ""}" placeholder="binary_sensor..." />
            </div>
            <div class="field">
              <span class="field-label">Abschalten (lock / switch)</span>
              <input type="text" id="entity_abschalten" value="${this._config.entity_abschalten || ""}" placeholder="lock... / switch..." />
            </div>
          </div>
        </div>

        <!-- TEXTE -->
        <div class="section">
          <div class="section-title">Texte</div>
          <div class="grid-3">
            <div class="field">
              <span class="field-label">OK-Text</span>
              <input type="text" id="text_ok" value="${this._config.text_ok || "OK"}" placeholder="OK" />
            </div>
            <div class="field">
              <span class="field-label">Fehler-Text</span>
              <input type="text" id="text_fehler" value="${this._config.text_fehler || "Fehler aktiv"}" placeholder="Fehler aktiv" />
            </div>
            <div class="field">
              <span class="field-label">Abschaltung-Text</span>
              <input type="text" id="text_abschaltung" value="${this._config.text_abschaltung || "Abgeschaltet"}" placeholder="Abgeschaltet" />
            </div>
          </div>
        </div>

        <!-- ICONS -->
        <div class="section">
          <div class="section-title">Icons</div>
          <div class="grid-2">
            <div class="field">
              <span class="field-label">Haupt-Icon</span>
              <select id="icon">${this._iconOptions(this._config.icon || "mdi:smoke-detector")}</select>
              <div class="icon-preview" id="icon_preview"><ha-icon icon="${this._config.icon || "mdi:smoke-detector"}"></ha-icon> Vorschau</div>
            </div>
            <div class="field">
              <span class="field-label">Fehler-Icon</span>
              <select id="icon_fehler">${this._iconOptions(this._config.icon_fehler || "mdi:smoke-detector-alert")}</select>
              <div class="icon-preview" id="icon_fehler_preview"><ha-icon icon="${this._config.icon_fehler || "mdi:smoke-detector-alert"}"></ha-icon> Vorschau</div>
            </div>
            <div class="field">
              <span class="field-label">Abschaltung-Icon</span>
              <select id="icon_abschaltung">${this._iconOptions(this._config.icon_abschaltung || "mdi:smoke-detector-off")}</select>
              <div class="icon-preview" id="icon_abschaltung_preview"><ha-icon icon="${this._config.icon_abschaltung || "mdi:smoke-detector-off"}"></ha-icon> Vorschau</div>
            </div>
          </div>
        </div>

        <!-- FARBEN -->
        <div class="section">
          <div class="section-title">Farben (optional)</div>
          <div class="grid-3">
            <div class="color-field">
              <span class="color-label">OK</span>
              <div class="color-row">
                <input type="color" id="color_ok_picker" value="${this._config.color_ok || "#27ae60"}" />
                <input type="text" id="color_ok" value="${this._config.color_ok || "#27ae60"}" />
              </div>
            </div>
            <div class="color-field">
              <span class="color-label">Fehler</span>
              <div class="color-row">
                <input type="color" id="color_fehler_picker" value="${this._config.color_fehler || "#e74c3c"}" />
                <input type="text" id="color_fehler" value="${this._config.color_fehler || "#e74c3c"}" />
              </div>
            </div>
            <div class="color-field">
              <span class="color-label">Abschaltung</span>
              <div class="color-row">
                <input type="color" id="color_abschaltung_picker" value="${this._config.color_abschaltung || "#f39c12"}" />
                <input type="text" id="color_abschaltung" value="${this._config.color_abschaltung || "#f39c12"}" />
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const textFields = [
      "title", "entity_abschaltung", "entity_fehler", "entity_abschalten",
      "text_ok", "text_fehler", "text_abschaltung"
    ];

    textFields.forEach((key) => {
      const input = this.shadowRoot.getElementById(key);
      if (input) {
        input.addEventListener("change", (e) => {
          this._config = { ...this._config, [key]: e.target.value };
          this._fireChanged();
        });
        input.addEventListener("input", (e) => {
          this._config[key] = e.target.value;
        });
      }
    });

    ["icon", "icon_fehler", "icon_abschaltung"].forEach((key) => {
      const select = this.shadowRoot.getElementById(key);
      if (select) {
        select.addEventListener("change", (e) => {
          this._config = { ...this._config, [key]: e.target.value };
          this._fireChanged();
          this._updateIconPreview(key);
        });
      }
    });

    ["color_ok", "color_fehler", "color_abschaltung"].forEach((key) => {
      const picker = this.shadowRoot.getElementById(key + "_picker");
      const text = this.shadowRoot.getElementById(key);

      if (picker) {
        picker.addEventListener("input", (e) => {
          this._config = { ...this._config, [key]: e.target.value };
          if (text) text.value = e.target.value;
          this._fireChanged();
        });
      }
      if (text) {
        text.addEventListener("change", (e) => {
          this._config = { ...this._config, [key]: e.target.value };
          if (picker && e.target.value.match(/^#[0-9a-fA-F]{6}$/)) {
            picker.value = e.target.value;
          }
          this._fireChanged();
        });
        text.addEventListener("input", (e) => {
          this._config[key] = e.target.value;
          if (picker && e.target.value.match(/^#[0-9a-fA-F]{6}$/)) {
            picker.value = e.target.value;
          }
        });
      }
    });
  }
}

/* ── Registrierung ──────────────────────────────────────── */
customElements.define("rauchmelder-card", RauchmelderCard);
customElements.define("rauchmelder-card-editor", RauchmelderCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "rauchmelder-card",
  name: "Rauchmelder Card",
  description: "Kompakte Rauchmelder-Karte mit individuellen Icons, Farben und Texten (1-Bit KNX).",
  preview: true,
});
