/**
 * Rauchmelder Card – Home Assistant Custom Lovelace Card
 * Kompakt, individuell konfigurierbare Icons und Farben.
 */

const CARD_VERSION = "1.3.0";

console.info(
  `%c RAUCHMELDER-CARD %c v${CARD_VERSION} `,
  "color: white; background: #e74c3c; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;",
  "color: #e74c3c; background: #ffeaea; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0;"
);

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

  _isOn(entityId) {
    const state = this._getState(entityId);
    return state ? state.state === "on" : false;
  }

  _isDemo() {
    return (
      !this._config.entity_abschaltung &&
      !this._config.entity_fehler &&
      !this._config.entity_abschalten
    );
  }

  _toggleEntity(entityId) {
    if (!this._hass || !entityId) return;
    this._hass.callService("switch", "toggle", { entity_id: entityId });
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
    const abschaltungOn = demo ? false : this._isOn(c.entity_abschaltung);
    const fehlerOn = demo ? false : this._isOn(c.entity_fehler);
    const abschaltenOn = demo ? false : this._isOn(c.entity_abschalten);

    const hasAlerts = abschaltungOn || fehlerOn;

    const statusColor = fehlerOn ? c.color_fehler : abschaltungOn ? c.color_abschaltung : c.color_ok;
    const statusBg = this._hexToRgba(statusColor, 0.15);

    const alerts = [];
    if (fehlerOn) {
      alerts.push(
        '<div class="alert" style="background:' + this._hexToRgba(c.color_fehler, 0.15) + ";color:" + c.color_fehler + '">' +
        '<ha-icon icon="' + c.icon_fehler + '"></ha-icon> Fehler aktiv</div>'
      );
    }
    if (abschaltungOn) {
      alerts.push(
        '<div class="alert" style="background:' + this._hexToRgba(c.color_abschaltung, 0.15) + ";color:" + c.color_abschaltung + '">' +
        '<ha-icon icon="' + c.icon_abschaltung + '"></ha-icon> Abgeschaltet</div>'
      );
    }

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

          .header .title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
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
            justify-content: space-between;
            margin-top: 8px;
            padding: 8px 10px;
            border: 1px solid ${abschaltenOn ? c.color_fehler : "var(--divider-color, #e0e0e0)"};
            border-radius: 8px;
            background: ${abschaltenOn ? this._hexToRgba(c.color_fehler, 0.1) : "var(--card-background-color, var(--ha-card-background, transparent))"};
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .toggle-row:hover {
            border-color: ${abschaltenOn ? c.color_fehler : c.color_abschaltung};
          }

          .toggle-row:active {
            transform: scale(0.98);
          }

          .toggle-left {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .toggle-left ha-icon {
            --mdc-icon-size: 18px;
            color: ${abschaltenOn ? c.color_fehler : "var(--text-secondary)"};
          }

          .toggle-label {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-primary);
          }

          .toggle-switch {
            width: 36px;
            height: 20px;
            border-radius: 10px;
            background: ${abschaltenOn ? c.color_fehler : "#ccc"};
            position: relative;
            flex-shrink: 0;
            transition: background 0.2s ease;
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
            <div class="title">${c.title}</div>
            <div class="badge">${
              demo ? "Vorschau" : fehlerOn ? "Fehler" : abschaltungOn ? "Aus" : "OK"
            }</div>
          </div>

          ${hasAlerts ? '<div class="alerts">' + alerts.join("") + "</div>" : ""}

          <div class="toggle-row" id="btn-toggle">
            <div class="toggle-left">
              <ha-icon icon="mdi:power"></ha-icon>
              <div class="toggle-label">${abschaltenOn ? "Ist abgeschaltet" : "Abschalten"}</div>
            </div>
            <div class="toggle-switch"></div>
          </div>

          ${demo ? '<div class="demo-hint">Entities im Editor konfigurieren</div>' : ""}
        </div>
      </ha-card>
    `;

    const btn = this.shadowRoot.getElementById("btn-toggle");
    if (btn && !demo) {
      btn.addEventListener("click", () => {
        this._toggleEntity(c.entity_abschalten);
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
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _fireChanged() {
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: this._config } })
    );
  }

  _render() {
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

        .field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .field-label {
          font-size: 12px;
          color: var(--secondary-text-color, #aaa);
        }

        .field input[type="text"] {
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
        }

        .field input[type="text"]:focus {
          border-color: var(--primary-color, #03a9f4);
        }

        .field input[type="text"]::placeholder {
          color: var(--secondary-text-color, #666);
          font-size: 12px;
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

        .color-field input[type="color"] {
          width: 60px;
          height: 32px;
          border: 2px solid var(--divider-color, #3a3a3a);
          border-radius: 8px;
          cursor: pointer;
          padding: 2px;
          background: transparent;
          transition: border-color 0.2s;
        }

        .color-field input[type="color"]:hover {
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
              <span class="field-label">Abschalten</span>
              <input type="text" id="entity_abschalten" value="${this._config.entity_abschalten || ""}" placeholder="switch..." />
            </div>
          </div>
        </div>

        <!-- ICONS -->
        <div class="section">
          <div class="section-title">Icons</div>
          <div class="grid-2">
            <div class="field">
              <span class="field-label">Haupt-Icon</span>
              <input type="text" id="icon" value="${this._config.icon || "mdi:smoke-detector"}" placeholder="mdi:smoke-detector" />
            </div>
            <div class="field">
              <span class="field-label">Fehler-Icon</span>
              <input type="text" id="icon_fehler" value="${this._config.icon_fehler || "mdi:smoke-detector-alert"}" placeholder="mdi:smoke-detector-alert" />
            </div>
            <div class="field">
              <span class="field-label">Abschaltung-Icon</span>
              <input type="text" id="icon_abschaltung" value="${this._config.icon_abschaltung || "mdi:smoke-detector-off"}" placeholder="mdi:smoke-detector-off" />
            </div>
          </div>
        </div>

        <!-- FARBEN -->
        <div class="section">
          <div class="section-title">Farben (optional)</div>
          <div class="grid-2">
            <div class="color-field">
              <span class="color-label">OK</span>
              <input type="color" id="color_ok_picker" value="${this._config.color_ok || "#27ae60"}" />
            </div>
            <div class="color-field">
              <span class="color-label">Fehler</span>
              <input type="color" id="color_fehler_picker" value="${this._config.color_fehler || "#e74c3c"}" />
            </div>
            <div class="color-field">
              <span class="color-label">Abschaltung</span>
              <input type="color" id="color_abschaltung_picker" value="${this._config.color_abschaltung || "#f39c12"}" />
            </div>
          </div>
        </div>
      </div>
    `;

    const textFields = [
      "title", "entity_abschaltung", "entity_fehler", "entity_abschalten",
      "icon", "icon_fehler", "icon_abschaltung"
    ];

    textFields.forEach((key) => {
      const input = this.shadowRoot.getElementById(key);
      if (input) {
        input.addEventListener("input", (e) => {
          this._config = { ...this._config, [key]: e.target.value };
          this._fireChanged();
        });
      }
    });

    ["color_ok", "color_fehler", "color_abschaltung"].forEach((key) => {
      const picker = this.shadowRoot.getElementById(key + "_picker");
      if (picker) {
        picker.addEventListener("input", (e) => {
          this._config = { ...this._config, [key]: e.target.value };
          this._fireChanged();
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
  description: "Kompakte Rauchmelder-Karte mit individuellen Icons und Farben (1-Bit KNX).",
  preview: true,
});
