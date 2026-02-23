/**
 * Rauchmelder Card v2 – Home Assistant Custom Lovelace Card
 * Oben links: Rauchmelder-Symbol + Raumbezeichnung
 * Mitte: 3 binäre Entitäten mit eigenen Meldungen und Farben (aktiv/inaktiv)
 * Unten: Schalter zum Ausschalten, rechtsbündig
 */

const CARD_VERSION = "2.0.0";

const LAST_STATE_KEY = "rauchmelder_card_last_state";

console.info(
  `%c RAUCHMELDER-CARD %c v${CARD_VERSION} `,
  "color: white; background: #e74c3c; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;",
  "color: #e74c3c; background: #ffeaea; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0;"
);

const ICON_OPTIONS = [
  { value: "mdi:smoke-detector", label: "Rauchmelder" },
  { value: "mdi:smoke-detector-variant", label: "Rauchmelder Variante" },
  { value: "mdi:smoke-detector-alert", label: "Rauchmelder Alarm" },
  { value: "mdi:smoke-detector-off", label: "Rauchmelder Aus" },
  { value: "mdi:smoke-detector-outline", label: "Rauchmelder (Outline)" },
  { value: "mdi:fire", label: "Feuer" },
  { value: "mdi:shield-check", label: "Schild OK" },
  { value: "mdi:bell", label: "Glocke" },
];

const ENTITY_LEFT_OPTIONS = [
  { value: "bezeichnung", label: "Bezeichnung" },
  { value: "icon", label: "Icon" },
];

const ENTITY_ICON_OPTIONS = [
  { value: "mdi:circle", label: "Kreis" },
  { value: "mdi:circle-outline", label: "Kreis (Outline)" },
  { value: "mdi:check-circle", label: "Haken" },
  { value: "mdi:alert-circle", label: "Warnung" },
  { value: "mdi:lock", label: "Schloss" },
  { value: "mdi:lock-open", label: "Schloss offen" },
  { value: "mdi:shield-check", label: "Schild OK" },
  { value: "mdi:minus", label: "Strich" },
];

function defaultEntity(i) {
  return {
    entity: "",
    name: i === 0 ? "Abschaltung" : i === 1 ? "Fehler" : "Sperre",
    label_active: i === 0 ? "Abgeschaltet" : i === 1 ? "Fehler" : "Wartung",
    label_inactive: i === 0 ? "Aktiv" : i === 1 ? "OK" : "OK",
    color_active: i === 0 ? "#f39c12" : i === 1 ? "#e74c3c" : "#e67e22",
    color_inactive: "#27ae60",
    display_left: "bezeichnung",
    icon: "mdi:circle",
  };
}

class RauchmelderCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._confirmShown = false;
    this.shadowRoot.addEventListener("click", (e) => {
      const id = e.target.id;
      if (id === "confirm-abbrechen") {
        this._confirmShown = false;
        const ov = this.shadowRoot.getElementById("confirm-overlay");
        if (ov) ov.classList.add("hidden");
      } else if (id === "confirm-ok") {
        this._confirmShown = false;
        const ov = this.shadowRoot.getElementById("confirm-overlay");
        if (ov) ov.classList.add("hidden");
        this._setAbschaltState(true);
        this._sendAbschaltEmail();
      }
    });
  }

  static getConfigElement() {
    return document.createElement("rauchmelder-card-editor");
  }

  static getStubConfig() {
    return {
      title: "G0.03",
      icon: "mdi:smoke-detector-variant",
      entity_abschalten: "",
      entity_alarm: "",
      alarm_color: "#e74c3c",
      no_alarm_color: "#999999",
      icon_color: "#27ae60",
      switch_color_on: "#e74c3c",
      switch_color_off: "#555555",
      email_enabled: false,
      email_service: "",
      invert_abschalt_output: false,
      entities: [defaultEntity(0), defaultEntity(1), defaultEntity(2)],
    };
  }

  setConfig(config) {
    this._config = {
      title: config.title || "Rauchmelder",
      icon: config.icon || "mdi:smoke-detector-variant",
      entity_abschalten: config.entity_abschalten || "",
      entity_alarm: config.entity_alarm || "",
      alarm_color: config.alarm_color || "#e74c3c",
      no_alarm_color: config.no_alarm_color || "#999999",
      icon_color: config.icon_color || "#27ae60",
      switch_color_on: config.switch_color_on || "#e74c3c",
      switch_color_off: config.switch_color_off || "#555555",
      email_enabled: !!config.email_enabled,
      email_service: config.email_service || "",
      invert_abschalt_output: !!config.invert_abschalt_output,
      entities: Array.isArray(config.entities) && config.entities.length >= 3
        ? config.entities.map((e, i) => ({
            entity: e.entity || "",
            name: e.name || defaultEntity(i).name,
            label_active: e.label_active || defaultEntity(i).label_active,
            label_inactive: e.label_inactive || defaultEntity(i).label_inactive,
            color_active: e.color_active || defaultEntity(i).color_active,
            color_inactive: e.color_inactive || "#27ae60",
            display_left: e.display_left || "bezeichnung",
            icon: e.icon || "mdi:circle",
          }))
        : [defaultEntity(0), defaultEntity(1), defaultEntity(2)],
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

  _hasValidState(entityId) {
    const state = this._getState(entityId);
    if (!state || !state.state) return false;
    const s = String(state.state).toLowerCase();
    return s !== "unknown" && s !== "unavailable";
  }

  _isActive(entityId) {
    const state = this._getState(entityId);
    if (!state) return false;
    const s = state.state;
    return s === "on" || s === "locked";
  }

  _getLastStates() {
    try {
      const raw = localStorage.getItem(LAST_STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  _setLastState(entityId, stateValue, lastChanged) {
    if (!entityId) return;
    try {
      const o = this._getLastStates();
      o[entityId] = { state: stateValue, last_changed: lastChanged || null };
      localStorage.setItem(LAST_STATE_KEY, JSON.stringify(o));
    } catch (_) {}
  }

  _getLastState(entityId) {
    const o = this._getLastStates();
    return o[entityId] || null;
  }

  _isActiveFromState(stateValue) {
    return stateValue === "on" || stateValue === "locked";
  }

  /** Schalter links = 0, rechts = 1. Bei invert_abschalt_output wird die Ausgabe getauscht. */
  _setAbschaltState(sendOne) {
    const c = this._config;
    const entityId = c.entity_abschalten;
    if (!this._hass || !entityId) return;
    let one = !!sendOne;
    if (c.invert_abschalt_output) one = !one;
    const domain = entityId.split(".")[0];
    if (domain === "lock") {
      this._hass.callService("lock", one ? "unlock" : "lock", { entity_id: entityId });
    } else if (domain === "switch") {
      this._hass.callService("switch", one ? "turn_off" : "turn_on", { entity_id: entityId });
    } else {
      this._hass.callService("homeassistant", one ? "turn_off" : "turn_on", { entity_id: entityId });
    }
  }

  _sendAbschaltEmail() {
    const c = this._config;
    if (!this._hass || !c.email_enabled || !c.email_service) return;
    const svc = c.email_service.replace(/^notify\./, "");
    if (!svc) return;
    const title = "Rauchmelder abgeschaltet";
    const message = "Rauchmelder " + (c.title || "Rauchmelder") + " wurde abgeschaltet.";
    this._hass.callService("notify", svc, { title: title, message: message });
  }

  _render() {
    if (!this.shadowRoot || !this._config) return;

    const c = this._config;
    const entityAbschalten = c.entity_abschalten || "";

    if (entityAbschalten) {
      const state = this._getState(entityAbschalten);
      if (this._hasValidState(entityAbschalten) && state) {
        this._setLastState(entityAbschalten, state.state, state.last_changed);
      }
    }

    const lastAbschalt = entityAbschalten ? this._getLastState(entityAbschalten) : null;
    const hasValidAbschalt = entityAbschalten && this._hasValidState(entityAbschalten);
    const abschaltenOn = hasValidAbschalt
      ? !this._isActive(entityAbschalten)
      : lastAbschalt
        ? !this._isActiveFromState(lastAbschalt.state)
        : false;

    const abschaltenState = entityAbschalten ? this._getState(entityAbschalten) : null;
    const abschaltDatetime = abschaltenOn && (abschaltenState?.last_changed || lastAbschalt?.last_changed)
      ? new Date((abschaltenState?.last_changed || lastAbschalt.last_changed)).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })
      : "";

    const entityAlarm = c.entity_alarm || "";
    if (entityAlarm) {
      const state = this._getState(entityAlarm);
      if (this._hasValidState(entityAlarm) && state) {
        this._setLastState(entityAlarm, state.state, state.last_changed);
      }
    }
    const lastAlarm = entityAlarm ? this._getLastState(entityAlarm) : null;
    const alarmActive = entityAlarm
      ? (this._hasValidState(entityAlarm) ? this._isActive(entityAlarm) : (lastAlarm ? this._isActiveFromState(lastAlarm.state) : false))
      : false;

    const switchColorOn = c.switch_color_on || "#e74c3c";
    const iconClass = alarmActive ? "icon-alarm" : abschaltenOn ? "icon-abgeschaltet" : "";
    const iconStyle = !alarmActive && abschaltenOn ? "background:" + this._hexToRgba(switchColorOn, 0.35) + ";color:" + switchColorOn : "";

    const rows = c.entities.map((e, i) => {
      const entityId = e.entity || "";
      if (entityId) {
        const state = this._getState(entityId);
        if (this._hasValidState(entityId) && state) {
          this._setLastState(entityId, state.state, state.last_changed);
        }
      }
      const lastRow = entityId ? this._getLastState(entityId) : null;
      const active = entityId
        ? (this._hasValidState(entityId) ? this._isActive(entityId) : (lastRow ? this._isActiveFromState(lastRow.state) : false))
        : false;
      const value = active ? e.label_active : e.label_inactive;
      const color = active ? e.color_active : e.color_inactive;
      return {
        name: e.name || ("Entität " + (i + 1)),
        value: entityId ? value : "—",
        color,
        hasEntity: !!entityId,
        display_left: e.display_left || "bezeichnung",
        icon: e.icon || "mdi:circle",
      };
    });

    this.shadowRoot.innerHTML = `
      <ha-card>
        <style>
          :host {
            --text-primary: var(--primary-text-color, #fff);
            --text-secondary: var(--secondary-text-color, #aaa);
          }

          ha-card {
            display: block;
          }

          .card {
            padding: 8px 10px;
            display: flex;
            gap: 12px;
          }

          .left,
          .right {
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .left {
            justify-content: space-between;
          }

          .right {
            justify-content: center;
            gap: 4px;
          }

          .header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }

          .header .icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${this._hexToRgba(c.icon_color || "#27ae60", 0.2)};
            color: ${c.icon_color || "#27ae60"};
            flex-shrink: 0;
          }

          .header .icon.icon-alarm {
            animation: alarm-blink 3s ease-in-out infinite;
          }

          .header .icon.icon-abgeschaltet {
            background: ${this._hexToRgba(c.switch_color_on || "#e74c3c", 0.35)};
            color: ${c.switch_color_on || "#e74c3c"};
          }

          .header .icon.icon-abgeschaltet ha-icon {
            color: inherit;
          }

          @keyframes alarm-blink {
            0% { background: ${this._hexToRgba(c.alarm_color || "#e74c3c", 0.7)}; color: ${c.alarm_color || "#e74c3c"}; }
            16.67% { background: ${this._hexToRgba(c.no_alarm_color || "#999", 0.5)}; color: ${c.no_alarm_color || "#999"}; }
            33.33% { background: ${this._hexToRgba(c.alarm_color || "#e74c3c", 0.7)}; color: ${c.alarm_color || "#e74c3c"}; }
            50%, 100% { background: ${this._hexToRgba(c.no_alarm_color || "#999", 0.5)}; color: ${c.no_alarm_color || "#999"}; }
          }

          .header .icon ha-icon {
            --mdc-icon-size: 20px;
          }

          .header .title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .content-block {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 8px;
          }

          .content-block .icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(39, 174, 96, 0.2);
            color: #27ae60;
            flex-shrink: 0;
          }

          .content-block .icon ha-icon {
            --mdc-icon-size: 18px;
          }

          .text-rows {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .text-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            padding: 2px 0;
          }

          .text-row .label {
            color: var(--text-secondary, #aaa);
            flex-shrink: 0;
          }

          .text-row .value {
            font-weight: 500;
            text-align: right;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .text-row .row-icon {
            display: flex;
            align-items: center;
            flex-shrink: 0;
          }

          .text-row .row-icon ha-icon {
            --mdc-icon-size: 18px;
          }

          .abschalt-datetime {
            font-size: 11px;
            line-height: 1.2;
            min-height: 1.2em;
            color: var(--text-secondary, #aaa);
            margin: 2px 0 6px 0;
          }

          .toggle-row {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            margin-top: 2px;
          }

          .toggle-switch {
            width: 36px;
            height: 20px;
            border-radius: 10px;
            background: ${abschaltenOn ? (c.switch_color_on || "#e74c3c") : (c.switch_color_off || "#555")};
            position: relative;
            cursor: pointer;
            transition: background 0.2s ease;
            flex-shrink: 0;
          }

          .toggle-switch:hover {
            opacity: 0.9;
          }

          .toggle-switch:active {
            transform: scale(0.96);
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
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            transition: left 0.2s ease;
          }

          .confirm-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }

          .confirm-overlay.hidden {
            display: none;
          }

          .confirm-dialog {
            background: var(--card-background-color, #202124);
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          }

          .confirm-dialog .confirm-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--primary-text-color, #fff);
            margin: 0 0 12px 0;
          }

          .confirm-dialog .confirm-text {
            font-size: 14px;
            color: var(--primary-text-color, #fff);
            margin: 0 0 24px 0;
            opacity: 0.9;
          }

          .confirm-dialog .confirm-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            align-items: center;
          }

          .confirm-dialog .confirm-abbrechen {
            background: none;
            border: none;
            color: var(--primary-color, #03a9f4);
            font-size: 14px;
            cursor: pointer;
            padding: 8px 12px;
          }

          .confirm-dialog .confirm-abbrechen:hover {
            opacity: 0.9;
          }

          .confirm-dialog .confirm-ok {
            background: var(--primary-color, #03a9f4);
            color: #fff;
            border: none;
            border-radius: 20px;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          }

          .confirm-dialog .confirm-ok:hover {
            opacity: 0.9;
          }
        </style>

        <div class="card">
          <div class="left">
            <div class="header">
              <div class="icon ${iconClass}" ${iconStyle ? 'style="' + iconStyle + '"' : ""}>
                <ha-icon icon="${c.icon}"></ha-icon>
              </div>
              <div class="title">${c.title}</div>
            </div>

            <div class="abschalt-datetime">${abschaltDatetime || ""}</div>

            <div class="toggle-row">
              <div class="toggle-switch" id="btn-toggle"></div>
            </div>
          </div>

          <div class="right">
            ${rows.map((r) => `
              <div class="text-row">
                ${r.display_left === "icon" ? `<span class="row-icon" style="color:${r.color}"><ha-icon icon="${r.icon}"></ha-icon></span>` : `<span class="label">${r.name}</span>`}
                <span class="value" style="color:${r.color}">${r.value}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </ha-card>
    `;

    const btn = this.shadowRoot.getElementById("btn-toggle");

    const hideConfirm = () => {
      this._confirmShown = false;
      const ov = this.shadowRoot.getElementById("confirm-overlay");
      if (ov) ov.classList.add("hidden");
    };

    const ensureConfirmOverlay = () => {
      let overlay = this.shadowRoot.getElementById("confirm-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "confirm-overlay";
        overlay.className = "confirm-overlay hidden";
        overlay.innerHTML = `
          <div class="confirm-dialog">
            <div class="confirm-title">Bist du sicher?</div>
            <div class="confirm-text">Rauchmelder wirklich abschalten?</div>
            <div class="confirm-actions">
              <button type="button" class="confirm-abbrechen" id="confirm-abbrechen">Abbrechen</button>
              <button type="button" class="confirm-ok" id="confirm-ok">OK</button>
            </div>
          </div>`;
        this.shadowRoot.appendChild(overlay);
      }
      overlay.classList.toggle("hidden", !this._confirmShown);
    };

    if (btn && c.entity_abschalten) {
      btn.addEventListener("click", () => {
        if (abschaltenOn) {
          this._setAbschaltState(false);
          return;
        }
        this._confirmShown = true;
        ensureConfirmOverlay();
        this.shadowRoot.getElementById("confirm-overlay").classList.remove("hidden");
      });
    }

    ensureConfirmOverlay();
  }

  _hexToRgba(hex, alpha) {
    if (!hex || hex.length < 7) return "rgba(0,0,0,0.1)";
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }
}

/* ── Editor ──────────────────────────────────────────────── */
class RauchmelderCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._rendered = false;
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.entities || !Array.isArray(this._config.entities) || this._config.entities.length < 3) {
      this._config.entities = [defaultEntity(0), defaultEntity(1), defaultEntity(2)];
    }
    if (!this._rendered) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._rendered && this.shadowRoot) {
      this.shadowRoot.querySelectorAll("ha-icon-picker").forEach((el) => {
        el.hass = this._hass;
      });
    }
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));
  }

  _render() {
    this._rendered = true;
    const c = this._config;
    const e0 = c.entities[0] || defaultEntity(0);
    const e1 = c.entities[1] || defaultEntity(1);
    const e2 = c.entities[2] || defaultEntity(2);
    const entities = this._hass && this._hass.states ? Object.keys(this._hass.states) : [];
    const notifyServices = this._hass && this._hass.services && this._hass.services.notify ? Object.keys(this._hass.services.notify) : [];

    this.shadowRoot.innerHTML = `
      <style>
        .editor { padding: 0; display: flex; flex-direction: column; gap: 16px; }
        .section {
          border: 1px solid var(--divider-color, #3a3a3a);
          border-radius: 12px;
          padding: 16px;
          background: var(--card-background-color, #1c1c1c);
        }
        .section-title {
          font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
          color: var(--primary-text-color); margin-bottom: 12px;
        }
        .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
        .field:last-child { margin-bottom: 0; }
        .field-label { font-size: 12px; color: var(--secondary-text-color); }
        .field input, .field select, .field ha-icon-picker {
          width: 100%; padding: 10px 12px; border: 1px solid var(--divider-color);
          border-radius: 10px; font-size: 13px;
          background: var(--input-fill-color, #2a2a2a); color: var(--primary-text-color);
          box-sizing: border-box; outline: none;
        }
        .field select { cursor: pointer; -webkit-appearance: none; appearance: none; }
        .color-row { display: flex; gap: 8px; align-items: center; margin-top: 4px; }
        .color-row input[type="color"] {
          width: 40px; height: 34px; border: 2px solid var(--divider-color);
          border-radius: 8px; cursor: pointer; padding: 2px; background: transparent;
        }
        .color-row input[type="text"] {
          flex: 1; padding: 8px 10px; border: 1px solid var(--divider-color);
          border-radius: 8px; font-size: 12px; font-family: monospace;
          background: var(--input-fill-color, #2a2a2a); color: var(--primary-text-color);
        }
        .entity-block { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--divider-color); }
        .entity-block:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
      </style>

      <datalist id="all_entities">
        ${entities.map((id) => `<option value="${id}"></option>`).join("")}
      </datalist>
      <datalist id="notify_services">
        ${notifyServices.map((s) => `<option value="notify.${s}"></option>`).join("")}
      </datalist>

      <div class="editor">
        <div class="section">
          <div class="section-title">Oben links (Raum)</div>
          <div class="field">
            <span class="field-label">Raumbezeichnung</span>
            <input type="text" id="title" value="${c.title || "G0.03"}" />
          </div>
          <div class="field">
            <span class="field-label">Rauchmelder-Icon</span>
            <ha-icon-picker id="icon" value="${c.icon || "mdi:smoke-detector-variant"}"></ha-icon-picker>
          </div>
          <div class="field">
            <span class="field-label">Farbe Icon (Normal)</span>
            <div class="color-row">
              <input type="color" id="icon_color_picker" value="${c.icon_color || "#27ae60"}" />
              <input type="text" id="icon_color" value="${c.icon_color || "#27ae60"}" />
            </div>
          </div>
          <div class="field">
            <span class="field-label">Alarm-Status (Entität, 1 = Alarm)</span>
            <input type="text" id="entity_alarm" value="${c.entity_alarm || ""}" placeholder="binary_sensor..." list="all_entities" />
          </div>
          <div class="field">
            <span class="field-label">Farbe Alarm</span>
            <div class="color-row">
              <input type="color" id="alarm_color_picker" value="${c.alarm_color || "#e74c3c"}" />
              <input type="text" id="alarm_color" value="${c.alarm_color || "#e74c3c"}" />
            </div>
          </div>
          <div class="field">
            <span class="field-label">Farbe kein Alarm</span>
            <div class="color-row">
              <input type="color" id="no_alarm_color_picker" value="${c.no_alarm_color || "#999999"}" />
              <input type="text" id="no_alarm_color" value="${c.no_alarm_color || "#999999"}" />
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Binäre Entitäten (3 Stück)</div>

          <div class="entity-block">
            <div class="field-label" style="margin-bottom:8px;">Entität 1</div>
            <div class="field">
              <span class="field-label">Anzeige links</span>
              <select id="ent0_display_left">
                ${ENTITY_LEFT_OPTIONS.map((o) => '<option value="' + o.value + '"' + ((e0.display_left || "bezeichnung") === o.value ? " selected" : "") + ">" + o.label + "</option>").join("")}
              </select>
            </div>
            <div class="field">
              <span class="field-label">Bezeichnung (links)</span>
              <input type="text" id="ent0_name" value="${e0.name || "Abschaltung"}" placeholder="Abschaltung" />
            </div>
            <div class="field">
              <span class="field-label">Icon (wenn Anzeige = Icon)</span>
              <ha-icon-picker id="ent0_icon" value="${e0.icon || "mdi:circle"}"></ha-icon-picker>
            </div>
            <div class="field">
              <span class="field-label">Entity</span>
              <input type="text" id="ent0_entity" value="${e0.entity}" placeholder="binary_sensor..." list="all_entities" />
            </div>
            <div class="field">
              <span class="field-label">Meldung aktiv</span>
              <input type="text" id="ent0_label_active" value="${e0.label_active}" />
            </div>
            <div class="field">
              <span class="field-label">Meldung inaktiv</span>
              <input type="text" id="ent0_label_inactive" value="${e0.label_inactive}" />
            </div>
            <div class="field">
              <span class="field-label">Farbe aktiv</span>
              <div class="color-row">
                <input type="color" id="ent0_color_active_picker" value="${e0.color_active}" />
                <input type="text" id="ent0_color_active" value="${e0.color_active}" />
              </div>
            </div>
            <div class="field">
              <span class="field-label">Farbe inaktiv</span>
              <div class="color-row">
                <input type="color" id="ent0_color_inactive_picker" value="${e0.color_inactive}" />
                <input type="text" id="ent0_color_inactive" value="${e0.color_inactive}" />
              </div>
            </div>
          </div>

          <div class="entity-block">
            <div class="field-label" style="margin-bottom:8px;">Entität 2</div>
            <div class="field">
              <span class="field-label">Anzeige links</span>
              <select id="ent1_display_left">
                ${ENTITY_LEFT_OPTIONS.map((o) => '<option value="' + o.value + '"' + ((e1.display_left || "bezeichnung") === o.value ? " selected" : "") + ">" + o.label + "</option>").join("")}
              </select>
            </div>
            <div class="field">
              <span class="field-label">Bezeichnung (links)</span>
              <input type="text" id="ent1_name" value="${e1.name || "Fehler"}" placeholder="Fehler" />
            </div>
            <div class="field">
              <span class="field-label">Icon (wenn Anzeige = Icon)</span>
              <ha-icon-picker id="ent1_icon" value="${e1.icon || "mdi:circle"}"></ha-icon-picker>
            </div>
            <div class="field">
              <span class="field-label">Entity</span>
              <input type="text" id="ent1_entity" value="${e1.entity}" placeholder="binary_sensor..." list="all_entities" />
            </div>
            <div class="field">
              <span class="field-label">Meldung aktiv</span>
              <input type="text" id="ent1_label_active" value="${e1.label_active}" />
            </div>
            <div class="field">
              <span class="field-label">Meldung inaktiv</span>
              <input type="text" id="ent1_label_inactive" value="${e1.label_inactive}" />
            </div>
            <div class="field">
              <span class="field-label">Farbe aktiv</span>
              <div class="color-row">
                <input type="color" id="ent1_color_active_picker" value="${e1.color_active}" />
                <input type="text" id="ent1_color_active" value="${e1.color_active}" />
              </div>
            </div>
            <div class="field">
              <span class="field-label">Farbe inaktiv</span>
              <div class="color-row">
                <input type="color" id="ent1_color_inactive_picker" value="${e1.color_inactive}" />
                <input type="text" id="ent1_color_inactive" value="${e1.color_inactive}" />
              </div>
            </div>
          </div>

          <div class="entity-block">
            <div class="field-label" style="margin-bottom:8px;">Entität 3</div>
            <div class="field">
              <span class="field-label">Anzeige links</span>
              <select id="ent2_display_left">
                ${ENTITY_LEFT_OPTIONS.map((o) => '<option value="' + o.value + '"' + ((e2.display_left || "bezeichnung") === o.value ? " selected" : "") + ">" + o.label + "</option>").join("")}
              </select>
            </div>
            <div class="field">
              <span class="field-label">Bezeichnung (links)</span>
              <input type="text" id="ent2_name" value="${e2.name || "Sperre"}" placeholder="Sperre" />
            </div>
            <div class="field">
              <span class="field-label">Icon (wenn Anzeige = Icon)</span>
              <ha-icon-picker id="ent2_icon" value="${e2.icon || "mdi:circle"}"></ha-icon-picker>
            </div>
            <div class="field">
              <span class="field-label">Entity</span>
              <input type="text" id="ent2_entity" value="${e2.entity}" placeholder="binary_sensor..." list="all_entities" />
            </div>
            <div class="field">
              <span class="field-label">Meldung aktiv</span>
              <input type="text" id="ent2_label_active" value="${e2.label_active}" />
            </div>
            <div class="field">
              <span class="field-label">Meldung inaktiv</span>
              <input type="text" id="ent2_label_inactive" value="${e2.label_inactive}" />
            </div>
            <div class="field">
              <span class="field-label">Farbe aktiv</span>
              <div class="color-row">
                <input type="color" id="ent2_color_active_picker" value="${e2.color_active}" />
                <input type="text" id="ent2_color_active" value="${e2.color_active}" />
              </div>
            </div>
            <div class="field">
              <span class="field-label">Farbe inaktiv</span>
              <div class="color-row">
                <input type="color" id="ent2_color_inactive_picker" value="${e2.color_inactive}" />
                <input type="text" id="ent2_color_inactive" value="${e2.color_inactive}" />
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Unten: Schalter zum Ausschalten</div>
          <div class="field">
            <span class="field-label">Entity (lock oder switch)</span>
            <input type="text" id="entity_abschalten" value="${c.entity_abschalten || ""}" placeholder="lock... / switch..." list="all_entities" />
          </div>
          <div class="field" style="flex-direction: row; align-items: center; gap: 10px;">
            <input type="checkbox" id="invert_abschalt_output" ${c.invert_abschalt_output ? "checked" : ""} />
            <span class="field-label" style="margin: 0;">Ausgabe umgepolt (0/1 tauschen)</span>
          </div>
          <div class="field">
            <span class="field-label">Farbe Schalter an (Abgeschaltet)</span>
            <div class="color-row">
              <input type="color" id="switch_color_on_picker" value="${c.switch_color_on || "#e74c3c"}" />
              <input type="text" id="switch_color_on" value="${c.switch_color_on || "#e74c3c"}" />
            </div>
          </div>
          <div class="field">
            <span class="field-label">Farbe Schalter aus (Aktiv)</span>
            <div class="color-row">
              <input type="color" id="switch_color_off_picker" value="${c.switch_color_off || "#555555"}" />
              <input type="text" id="switch_color_off" value="${c.switch_color_off || "#555555"}" />
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">E-Mail bei Abschaltung</div>
          <div class="field" style="flex-direction: row; align-items: center; gap: 10px;">
            <input type="checkbox" id="email_enabled" ${c.email_enabled ? "checked" : ""} />
            <span class="field-label" style="margin: 0;">E-Mail bei Abschaltung senden</span>
          </div>
          <div class="field">
            <span class="field-label">Notify-Service (z. B. notify.mail_open_door)</span>
            <input type="text" id="email_service" value="${c.email_service || ""}" placeholder="notify.mail_open_door" list="notify_services" />
          </div>
        </div>
      </div>
    `;

    const bind = (id, key, subKey) => {
      const el = this.shadowRoot.getElementById(id);
      if (!el) return;
      el.addEventListener("change", () => {
        if (subKey) {
          const m = id.match(/ent(\d)_/);
          const i = m ? parseInt(m[1], 10) : 0;
          if (!this._config.entities[i]) this._config.entities[i] = defaultEntity(i);
          this._config.entities[i][subKey] = el.value;
        } else if (key) {
          this._config[key] = el.value;
        }
        this._fire();
      });
      el.addEventListener("input", (e) => {
        if (subKey) {
          const m = id.match(/ent(\d)_/);
          const i = m ? parseInt(m[1], 10) : 0;
          if (!this._config.entities[i]) this._config.entities[i] = defaultEntity(i);
          this._config.entities[i][subKey] = e.target.value;
        } else if (key) {
          this._config[key] = e.target.value;
        }
      });
    };

    bind("title", "title");

    const mainIconPicker = this.shadowRoot.getElementById("icon");
    if (mainIconPicker) {
      if (this._hass) mainIconPicker.hass = this._hass;
      mainIconPicker.addEventListener("value-changed", (e) => {
        this._config.icon = (e.detail && e.detail.value) || "";
        this._fire();
      });
    }

    bind("entity_alarm", "entity_alarm");
    bind("entity_abschalten", "entity_abschalten");

    const invertOutputEl = this.shadowRoot.getElementById("invert_abschalt_output");
    if (invertOutputEl) {
      invertOutputEl.addEventListener("change", () => {
        this._config.invert_abschalt_output = invertOutputEl.checked;
        this._fire();
      });
    }

    const emailEnabledEl = this.shadowRoot.getElementById("email_enabled");
    if (emailEnabledEl) {
      emailEnabledEl.addEventListener("change", () => {
        this._config.email_enabled = emailEnabledEl.checked;
        this._fire();
      });
    }
    bind("email_service", "email_service");

    const switchColorOnPicker = this.shadowRoot.getElementById("switch_color_on_picker");
    const switchColorOnText = this.shadowRoot.getElementById("switch_color_on");
    if (switchColorOnPicker) switchColorOnPicker.addEventListener("input", (e) => { this._config.switch_color_on = e.target.value; if (switchColorOnText) switchColorOnText.value = e.target.value; this._fire(); });
    if (switchColorOnText) switchColorOnText.addEventListener("change", (e) => { this._config.switch_color_on = e.target.value; if (switchColorOnPicker && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) switchColorOnPicker.value = e.target.value; this._fire(); });

    const switchColorOffPicker = this.shadowRoot.getElementById("switch_color_off_picker");
    const switchColorOffText = this.shadowRoot.getElementById("switch_color_off");
    if (switchColorOffPicker) switchColorOffPicker.addEventListener("input", (e) => { this._config.switch_color_off = e.target.value; if (switchColorOffText) switchColorOffText.value = e.target.value; this._fire(); });
    if (switchColorOffText) switchColorOffText.addEventListener("change", (e) => { this._config.switch_color_off = e.target.value; if (switchColorOffPicker && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) switchColorOffPicker.value = e.target.value; this._fire(); });

    const iconColorPicker = this.shadowRoot.getElementById("icon_color_picker");
    const iconColorText = this.shadowRoot.getElementById("icon_color");
    if (iconColorPicker) iconColorPicker.addEventListener("input", (e) => { this._config.icon_color = e.target.value; if (iconColorText) iconColorText.value = e.target.value; this._fire(); });
    if (iconColorText) iconColorText.addEventListener("change", (e) => { this._config.icon_color = e.target.value; if (iconColorPicker && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) iconColorPicker.value = e.target.value; this._fire(); });

    const alarmColorPicker = this.shadowRoot.getElementById("alarm_color_picker");
    const alarmColorText = this.shadowRoot.getElementById("alarm_color");
    if (alarmColorPicker) alarmColorPicker.addEventListener("input", (e) => { this._config.alarm_color = e.target.value; if (alarmColorText) alarmColorText.value = e.target.value; this._fire(); });
    if (alarmColorText) alarmColorText.addEventListener("change", (e) => { this._config.alarm_color = e.target.value; if (alarmColorPicker && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) alarmColorPicker.value = e.target.value; this._fire(); });

    const noAlarmColorPicker = this.shadowRoot.getElementById("no_alarm_color_picker");
    const noAlarmColorText = this.shadowRoot.getElementById("no_alarm_color");
    if (noAlarmColorPicker) noAlarmColorPicker.addEventListener("input", (e) => { this._config.no_alarm_color = e.target.value; if (noAlarmColorText) noAlarmColorText.value = e.target.value; this._fire(); });
    if (noAlarmColorText) noAlarmColorText.addEventListener("change", (e) => { this._config.no_alarm_color = e.target.value; if (noAlarmColorPicker && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) noAlarmColorPicker.value = e.target.value; this._fire(); });

    [0, 1, 2].forEach((i) => {
      bind("ent" + i + "_display_left", null, "display_left");

      const iconPicker = this.shadowRoot.getElementById("ent" + i + "_icon");
      if (iconPicker) {
        if (this._hass) iconPicker.hass = this._hass;
        iconPicker.addEventListener("value-changed", (e) => {
          if (!this._config.entities[i]) this._config.entities[i] = defaultEntity(i);
          this._config.entities[i].icon = (e.detail && e.detail.value) || "mdi:circle";
          this._fire();
        });
      }

      bind("ent" + i + "_name", null, "name");
      bind("ent" + i + "_entity", null, "entity");
      bind("ent" + i + "_label_active", null, "label_active");
      bind("ent" + i + "_label_inactive", null, "label_inactive");
      bind("ent" + i + "_color_active", null, "color_active");
      bind("ent" + i + "_color_inactive", null, "color_inactive");

      const pickerActive = this.shadowRoot.getElementById("ent" + i + "_color_active_picker");
      const textActive = this.shadowRoot.getElementById("ent" + i + "_color_active");
      if (pickerActive) pickerActive.addEventListener("input", (e) => { this._config.entities[i].color_active = e.target.value; if (textActive) textActive.value = e.target.value; this._fire(); });
      if (textActive) textActive.addEventListener("change", (e) => { this._config.entities[i].color_active = e.target.value; if (pickerActive && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) pickerActive.value = e.target.value; this._fire(); });

      const pickerInactive = this.shadowRoot.getElementById("ent" + i + "_color_inactive_picker");
      const textInactive = this.shadowRoot.getElementById("ent" + i + "_color_inactive");
      if (pickerInactive) pickerInactive.addEventListener("input", (e) => { this._config.entities[i].color_inactive = e.target.value; if (textInactive) textInactive.value = e.target.value; this._fire(); });
      if (textInactive) textInactive.addEventListener("change", (e) => { this._config.entities[i].color_inactive = e.target.value; if (pickerInactive && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) pickerInactive.value = e.target.value; this._fire(); });
    });

    if (this._hass) {
      this.shadowRoot.querySelectorAll("ha-icon-picker").forEach((el) => {
        el.hass = this._hass;
      });
    }
  }
}

customElements.define("rauchmelder-card", RauchmelderCard);
customElements.define("rauchmelder-card-editor", RauchmelderCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "rauchmelder-card",
  name: "Rauchmelder Card",
  description: "Rauchmelder mit Raumbezeichnung, 3 binären Entitäten (eigene Meldungen/Farben) und Ausschalt-Schalter.",
  preview: true,
});
