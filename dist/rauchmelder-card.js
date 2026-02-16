/**
 * Rauchmelder Card – Home Assistant Custom Lovelace Card
 * Zeigt Abschaltung-Status, Fehler-Status und Abschalten-Steuerung
 * für 1-Bit KNX-Objekte.
 */

const CARD_VERSION = "1.0.0";

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

  /* ── Editor für den visuellen Karteneditor ─────────────── */
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

  /* ── Konfiguration setzen ─────────────────────────────── */
  setConfig(config) {
    if (!config.entity_abschalten) {
      throw new Error("Bitte 'entity_abschalten' angeben (switch entity).");
    }
    this._config = {
      title: config.title || "Rauchmelder",
      entity_abschaltung: config.entity_abschaltung || "",
      entity_fehler: config.entity_fehler || "",
      entity_abschalten: config.entity_abschalten || "",
      show_last_changed: config.show_last_changed !== false,
    };
    this._render();
  }

  /* ── Home Assistant State ─────────────────────────────── */
  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  /* ── Kartengröße ──────────────────────────────────────── */
  getCardSize() {
    return 3;
  }

  /* ── Hilfsfunktionen ──────────────────────────────────── */
  _getState(entityId) {
    if (!this._hass || !entityId || !this._hass.states[entityId]) return null;
    return this._hass.states[entityId];
  }

  _isOn(entityId) {
    const state = this._getState(entityId);
    return state ? state.state === "on" : false;
  }

  _lastChanged(entityId) {
    const state = this._getState(entityId);
    if (!state) return "";
    const d = new Date(state.last_changed);
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  _toggleEntity(entityId) {
    if (!this._hass || !entityId) return;
    this._hass.callService("switch", "toggle", {
      entity_id: entityId,
    });
  }

  /* ── Rendering ────────────────────────────────────────── */
  _render() {
    if (!this.shadowRoot || !this._config) return;

    const abschaltungOn = this._isOn(this._config.entity_abschaltung);
    const fehlerOn = this._isOn(this._config.entity_fehler);
    const abschaltenOn = this._isOn(this._config.entity_abschalten);

    const abschaltungEntity = this._getState(this._config.entity_abschaltung);
    const fehlerEntity = this._getState(this._config.entity_fehler);

    this.shadowRoot.innerHTML = `
      <ha-card>
        <style>
          :host {
            --card-bg: var(--ha-card-background, var(--card-background-color, #fff));
            --text-primary: var(--primary-text-color, #333);
            --text-secondary: var(--secondary-text-color, #777);
          }

          .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 16px 8px 16px;
          }

          .card-header .icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${fehlerOn ? "#fde8e8" : abschaltungOn ? "#fef3e2" : "#e8f5e9"};
            color: ${fehlerOn ? "#e74c3c" : abschaltungOn ? "#f39c12" : "#27ae60"};
            flex-shrink: 0;
          }

          .card-header .icon ha-icon {
            --mdc-icon-size: 24px;
          }

          .card-header .info {
            flex: 1;
          }

          .card-header .title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
          }

          .card-header .subtitle {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 2px;
          }

          .status-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            padding: 12px 16px;
          }

          .status-item {
            background: var(--ha-card-background, var(--card-background-color, #f8f9fa));
            border: 1px solid var(--divider-color, #e0e0e0);
            border-radius: 12px;
            padding: 14px;
            text-align: center;
            transition: all 0.3s ease;
          }

          .status-item.warning {
            background: #fef3e2;
            border-color: #f39c12;
          }

          .status-item.error {
            background: #fde8e8;
            border-color: #e74c3c;
            animation: pulse-error 2s infinite;
          }

          .status-item.ok {
            background: #e8f5e9;
            border-color: #27ae60;
          }

          @keyframes pulse-error {
            0%, 100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.3); }
            50% { box-shadow: 0 0 0 8px rgba(231, 76, 60, 0); }
          }

          .status-item .status-icon {
            font-size: 28px;
            margin-bottom: 6px;
          }

          .status-item .status-icon ha-icon {
            --mdc-icon-size: 28px;
          }

          .status-item.warning .status-icon { color: #f39c12; }
          .status-item.error .status-icon { color: #e74c3c; }
          .status-item.ok .status-icon { color: #27ae60; }

          .status-item .status-label {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 2px;
          }

          .status-item .status-value {
            font-size: 11px;
            color: var(--text-secondary);
          }

          .control-section {
            padding: 8px 16px 16px 16px;
          }

          .control-button {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 14px 18px;
            border: 2px solid ${abschaltenOn ? "#e74c3c" : "var(--divider-color, #e0e0e0)"};
            border-radius: 12px;
            background: ${abschaltenOn ? "#fde8e8" : "transparent"};
            cursor: pointer;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }

          .control-button:hover {
            border-color: ${abschaltenOn ? "#c0392b" : "#f39c12"};
            background: ${abschaltenOn ? "#fbd5d5" : "#fef9f0"};
          }

          .control-button:active {
            transform: scale(0.98);
          }

          .control-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .control-left ha-icon {
            --mdc-icon-size: 22px;
            color: ${abschaltenOn ? "#e74c3c" : "var(--text-secondary)"};
          }

          .control-label {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
          }

          .control-state {
            font-size: 12px;
            color: var(--text-secondary);
          }

          .toggle-indicator {
            width: 48px;
            height: 26px;
            border-radius: 13px;
            background: ${abschaltenOn ? "#e74c3c" : "#ccc"};
            position: relative;
            transition: background 0.3s ease;
            flex-shrink: 0;
          }

          .toggle-indicator::after {
            content: '';
            position: absolute;
            top: 3px;
            left: ${abschaltenOn ? "24px" : "3px"};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            transition: left 0.3s ease;
          }

          .unavailable {
            color: var(--text-secondary);
            font-style: italic;
            text-align: center;
            padding: 8px;
            font-size: 12px;
          }
        </style>

        <div class="card-header">
          <div class="icon">
            <ha-icon icon="mdi:smoke-detector"></ha-icon>
          </div>
          <div class="info">
            <div class="title">${this._config.title}</div>
            <div class="subtitle">
              ${fehlerOn ? "⚠ Fehler aktiv!" : abschaltungOn ? "Abgeschaltet" : "Betriebsbereit"}
            </div>
          </div>
        </div>

        <div class="status-grid">
          <!-- Abschaltung -->
          <div class="status-item ${
            !abschaltungEntity ? "" : abschaltungOn ? "warning" : "ok"
          }">
            <div class="status-icon">
              <ha-icon icon="${abschaltungOn ? "mdi:smoke-detector-off" : "mdi:smoke-detector"}"></ha-icon>
            </div>
            <div class="status-label">Abschaltung</div>
            <div class="status-value">
              ${!abschaltungEntity 
                ? "<em>Nicht konfiguriert</em>" 
                : abschaltungOn 
                  ? "Abgeschaltet" 
                  : "Aktiv"
              }
            </div>
            ${this._config.show_last_changed && abschaltungEntity 
              ? `<div class="status-value" style="margin-top:4px;font-size:10px;">${this._lastChanged(this._config.entity_abschaltung)}</div>` 
              : ""
            }
          </div>

          <!-- Fehler -->
          <div class="status-item ${
            !fehlerEntity ? "" : fehlerOn ? "error" : "ok"
          }">
            <div class="status-icon">
              <ha-icon icon="${fehlerOn ? "mdi:smoke-detector-alert" : "mdi:check-circle"}"></ha-icon>
            </div>
            <div class="status-label">Fehler</div>
            <div class="status-value">
              ${!fehlerEntity 
                ? "<em>Nicht konfiguriert</em>" 
                : fehlerOn 
                  ? "Fehler!" 
                  : "Kein Fehler"
              }
            </div>
            ${this._config.show_last_changed && fehlerEntity 
              ? `<div class="status-value" style="margin-top:4px;font-size:10px;">${this._lastChanged(this._config.entity_fehler)}</div>` 
              : ""
            }
          </div>
        </div>

        <!-- Steuerung -->
        <div class="control-section">
          <div class="control-button" id="btn-toggle">
            <div class="control-left">
              <ha-icon icon="mdi:power"></ha-icon>
              <div>
                <div class="control-label">Rauchmelder abschalten</div>
                <div class="control-state">${abschaltenOn ? "Ist abgeschaltet" : "Ist eingeschaltet"}</div>
              </div>
            </div>
            <div class="toggle-indicator"></div>
          </div>
        </div>
      </ha-card>
    `;

    const btn = this.shadowRoot.getElementById("btn-toggle");
    if (btn) {
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
      </style>
      <div class="editor">
        <label>
          Titel
          <input id="title" value="${this._config.title || "Rauchmelder"}" />
        </label>
        <label>
          Abschaltung Entity (binary_sensor)
          <input id="entity_abschaltung" value="${this._config.entity_abschaltung || ""}" placeholder="binary_sensor.rauchmelder_abschaltung" />
          <small>1-Bit Status: Zeigt ob der Melder abgeschaltet ist</small>
        </label>
        <label>
          Fehler Entity (binary_sensor)
          <input id="entity_fehler" value="${this._config.entity_fehler || ""}" placeholder="binary_sensor.rauchmelder_fehler" />
          <small>1-Bit Status: Zeigt ob ein Fehler vorliegt</small>
        </label>
        <label>
          Abschalten Entity (switch) *
          <input id="entity_abschalten" value="${this._config.entity_abschalten || ""}" placeholder="switch.rauchmelder_abschalten" />
          <small>1-Bit Steuerung: Schaltet den Melder ab (Pflichtfeld)</small>
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
  description: "Zeigt Abschaltung, Fehler und Abschalten-Steuerung für Rauchmelder (1-Bit KNX Objekte).",
  preview: true,
});
