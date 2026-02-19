/**
 * Rauchmelder Card v2 – Home Assistant Custom Lovelace Card
 * Oben links: Rauchmelder-Symbol + Raumbezeichnung
 * Mitte: 3 binäre Entitäten mit eigenen Meldungen und Farben (aktiv/inaktiv)
 * Unten: Schalter zum Ausschalten, rechtsbündig
 */

const CARD_VERSION = "2.0.0";

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

function defaultEntity(i) {
  return {
    entity: "",
    name: i === 0 ? "Abschaltung" : i === 1 ? "Fehler" : "Sperre",
    label_active: i === 0 ? "Abgeschaltet" : i === 1 ? "Fehler" : "Wartung",
    label_inactive: i === 0 ? "Aktiv" : i === 1 ? "OK" : "OK",
    color_active: i === 0 ? "#f39c12" : i === 1 ? "#e74c3c" : "#e67e22",
    color_inactive: "#27ae60",
  };
}

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
      title: "G0.03",
      icon: "mdi:smoke-detector-variant",
      entity_abschalten: "",
      entities: [defaultEntity(0), defaultEntity(1), defaultEntity(2)],
    };
  }

  setConfig(config) {
    this._config = {
      title: config.title || "Rauchmelder",
      icon: config.icon || "mdi:smoke-detector-variant",
      entity_abschalten: config.entity_abschalten || "",
      entities: Array.isArray(config.entities) && config.entities.length >= 3
        ? config.entities.map((e, i) => ({
            entity: e.entity || "",
            name: e.name || defaultEntity(i).name,
            label_active: e.label_active || defaultEntity(i).label_active,
            label_inactive: e.label_inactive || defaultEntity(i).label_inactive,
            color_active: e.color_active || defaultEntity(i).color_active,
            color_inactive: e.color_inactive || "#27ae60",
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

  _isActive(entityId) {
    const state = this._getState(entityId);
    if (!state) return false;
    const s = state.state;
    return s === "on" || s === "locked";
  }

  _toggleAbschalten() {
    const entityId = this._config.entity_abschalten;
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

  _render() {
    if (!this.shadowRoot || !this._config) return;

    const c = this._config;
    const abschaltenOn = c.entity_abschalten ? this._isActive(c.entity_abschalten) : false;

    const rows = c.entities.map((e, i) => {
      const active = e.entity ? this._isActive(e.entity) : false;
      const value = active ? e.label_active : e.label_inactive;
      const color = active ? e.color_active : e.color_inactive;
      return {
        name: e.name || ("Entität " + (i + 1)),
        value: e.entity ? value : "—",
        color,
        hasEntity: !!e.entity,
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
            display: inline-block;
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
            background: rgba(39, 174, 96, 0.2);
            color: #27ae60;
            flex-shrink: 0;
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
            background: ${abschaltenOn ? "#e74c3c" : "#555"};
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
        </style>

        <div class="card">
          <div class="left">
            <div class="header">
              <div class="icon">
                <ha-icon icon="${c.icon}"></ha-icon>
              </div>
              <div class="title">${c.title}</div>
            </div>

            <div class="toggle-row">
              <div class="toggle-switch" id="btn-toggle"></div>
            </div>
          </div>

          <div class="right">
            ${rows.map((r) => `
              <div class="text-row">
                <span class="label">${r.name}</span>
                <span class="value" style="color:${r.color}">${r.value}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </ha-card>
    `;

    const btn = this.shadowRoot.getElementById("btn-toggle");
    if (btn && c.entity_abschalten) {
      btn.addEventListener("click", () => this._toggleAbschalten());
    }
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
        .field input, .field select {
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

      <div class="editor">
        <div class="section">
          <div class="section-title">Oben links (Raum)</div>
          <div class="field">
            <span class="field-label">Raumbezeichnung</span>
            <input type="text" id="title" value="${c.title || "G0.03"}" />
          </div>
          <div class="field">
            <span class="field-label">Rauchmelder-Icon</span>
            <select id="icon">
              ${ICON_OPTIONS.map((o) => '<option value="' + o.value + '"' + ((c.icon || "mdi:smoke-detector-variant") === o.value ? " selected" : "") + ">" + o.label + "</option>").join("")}
            </select>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Binäre Entitäten (3 Stück)</div>

          <div class="entity-block">
            <div class="field-label" style="margin-bottom:8px;">Entität 1</div>
            <div class="field">
              <span class="field-label">Bezeichnung (links)</span>
              <input type="text" id="ent0_name" value="${e0.name || "Abschaltung"}" placeholder="Abschaltung" />
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
              <span class="field-label">Bezeichnung (links)</span>
              <input type="text" id="ent1_name" value="${e1.name || "Fehler"}" placeholder="Fehler" />
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
              <span class="field-label">Bezeichnung (links)</span>
              <input type="text" id="ent2_name" value="${e2.name || "Sperre"}" placeholder="Sperre" />
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
    bind("icon", "icon");
    bind("entity_abschalten", "entity_abschalten");

    [0, 1, 2].forEach((i) => {
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
