/**
 * Rauchmelder Card – Home Assistant Custom Lovelace Card
 * Kompakte Karte: Abschaltung/Fehler nur als Text wenn aktiv.
 */

const CARD_VERSION = "1.2.0";

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

  setConfig(config) {
    this._config = {
      title: config.title || "Rauchmelder",
      entity_abschaltung: config.entity_abschaltung || "",
      entity_fehler: config.entity_fehler || "",
      entity_abschalten: config.entity_abschalten || "",
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
    this._hass.callService("switch", "toggle", {
      entity_id: entityId,
    });
  }

  _render() {
    if (!this.shadowRoot || !this._config) return;

    const demo = this._isDemo();
    const abschaltungOn = demo ? false : this._isOn(this._config.entity_abschaltung);
    const fehlerOn = demo ? false : this._isOn(this._config.entity_fehler);
    const abschaltenOn = demo ? false : this._isOn(this._config.entity_abschalten);

    const hasAlerts = abschaltungOn || fehlerOn;

    const alerts = [];
    if (fehlerOn) {
      alerts.push('<div class="alert error"><ha-icon icon="mdi:smoke-detector-alert"></ha-icon> Fehler aktiv</div>');
    }
    if (abschaltungOn) {
      alerts.push('<div class="alert warning"><ha-icon icon="mdi:smoke-detector-off"></ha-icon> Abgeschaltet</div>');
    }

    const statusColor = fehlerOn ? "#e74c3c" : abschaltungOn ? "#f39c12" : "#27ae60";
    const statusBg = fehlerOn ? "#fde8e8" : abschaltungOn ? "#fef3e2" : "#e8f5e9";

    this.shadowRoot.innerHTML = `
      <ha-card>
        <style>
          :host {
            --text-primary: var(--primary-text-color, #333);
            --text-secondary: var(--secondary-text-color, #777);
          }

          .card {
            padding: 12px 16px;
          }

          .header {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .header .icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${statusBg};
            color: ${statusColor};
            flex-shrink: 0;
          }

          .header .icon ha-icon {
            --mdc-icon-size: 20px;
          }

          .header .title {
            font-size: 15px;
            font-weight: 600;
            color: var(--text-primary);
            flex: 1;
          }

          .header .badge {
            font-size: 11px;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 10px;
            background: ${statusBg};
            color: ${statusColor};
          }

          .alerts {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-top: 10px;
          }

          .alert {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
          }

          .alert ha-icon {
            --mdc-icon-size: 18px;
          }

          .alert.error {
            background: #fde8e8;
            color: #e74c3c;
            animation: pulse-error 2s infinite;
          }

          .alert.warning {
            background: #fef3e2;
            color: #e67e22;
          }

          @keyframes pulse-error {
            0%, 100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.2); }
            50% { box-shadow: 0 0 0 6px rgba(231, 76, 60, 0); }
          }

          .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 10px;
            padding: 10px 12px;
            border: 1px solid ${abschaltenOn ? "#e74c3c" : "var(--divider-color, #e0e0e0)"};
            border-radius: 10px;
            background: ${abschaltenOn ? "#fde8e8" : "transparent"};
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .toggle-row:hover {
            border-color: ${abschaltenOn ? "#c0392b" : "#f39c12"};
          }

          .toggle-row:active {
            transform: scale(0.98);
          }

          .toggle-left {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .toggle-left ha-icon {
            --mdc-icon-size: 20px;
            color: ${abschaltenOn ? "#e74c3c" : "var(--text-secondary)"};
          }

          .toggle-label {
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary);
          }

          .toggle-switch {
            width: 40px;
            height: 22px;
            border-radius: 11px;
            background: ${abschaltenOn ? "#e74c3c" : "#ccc"};
            position: relative;
            flex-shrink: 0;
            transition: background 0.2s ease;
          }

          .toggle-switch::after {
            content: '';
            position: absolute;
            top: 2px;
            left: ${abschaltenOn ? "20px" : "2px"};
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            transition: left 0.2s ease;
          }

          .demo-hint {
            text-align: center;
            font-size: 11px;
            color: var(--text-secondary);
            margin-top: 8px;
            font-style: italic;
          }
        </style>

        <div class="card">
          <div class="header">
            <div class="icon">
              <ha-icon icon="mdi:smoke-detector"></ha-icon>
            </div>
            <div class="title">${this._config.title}</div>
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
        this._toggleEntity(this._config.entity_abschalten);
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

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        .editor {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .editor label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 14px;
          color: var(--primary-text-color);
        }
        .editor input {
          padding: 8px 12px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 8px;
          font-size: 14px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
        }
        .editor small {
          color: var(--secondary-text-color);
          font-size: 11px;
        }
        .editor .hint {
          background: var(--info-color, #3b4cca);
          color: white;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.5;
        }
      </style>
      <div class="editor">
        <div class="hint">
          Alle Felder sind optional. Abschaltung und Fehler werden nur angezeigt wenn aktiv.
        </div>
        <label>
          Titel
          <input id="title" value="${this._config.title || "Rauchmelder"}" />
        </label>
        <label>
          Abschaltung Entity (binary_sensor)
          <input id="entity_abschaltung" value="${this._config.entity_abschaltung || ""}" placeholder="binary_sensor.rauchmelder_abschaltung" />
          <small>1-Bit Status: Wird nur angezeigt wenn abgeschaltet</small>
        </label>
        <label>
          Fehler Entity (binary_sensor)
          <input id="entity_fehler" value="${this._config.entity_fehler || ""}" placeholder="binary_sensor.rauchmelder_fehler" />
          <small>1-Bit Status: Wird nur angezeigt wenn Fehler vorliegt</small>
        </label>
        <label>
          Abschalten Entity (switch)
          <input id="entity_abschalten" value="${this._config.entity_abschalten || ""}" placeholder="switch.rauchmelder_abschalten" />
          <small>1-Bit Steuerung: Toggle zum Abschalten</small>
        </label>
      </div>
    `;

    ["title", "entity_abschaltung", "entity_fehler", "entity_abschalten"].forEach((key) => {
      const input = this.shadowRoot.getElementById(key);
      if (input) {
        input.addEventListener("input", (e) => {
          this._config = { ...this._config, [key]: e.target.value };
          const event = new CustomEvent("config-changed", {
            detail: { config: this._config },
          });
          this.dispatchEvent(event);
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
  description: "Kompakte Rauchmelder-Karte mit Abschaltung, Fehler und Steuerung (1-Bit KNX).",
  preview: true,
});
