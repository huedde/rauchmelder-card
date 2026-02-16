# Rauchmelder Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

Custom Lovelace Card für Home Assistant zur Anzeige und Steuerung von Rauchmeldern über 1-Bit KNX-Objekte.

## Features

- **Abschaltung-Status** – Zeigt ob der Rauchmelder abgeschaltet ist (1-Bit binary_sensor)
- **Fehler-Status** – Zeigt ob ein Fehler am Rauchmelder vorliegt (1-Bit binary_sensor)
- **Abschalten-Steuerung** – Toggle zum Ein-/Ausschalten des Rauchmelders (1-Bit switch)
- **Farbliche Hervorhebung** – Grün = OK, Orange = Abgeschaltet, Rot = Fehler (mit Puls-Animation)
- **Visueller Karteneditor** – Konfiguration direkt im Dashboard-Editor
- **Letzte Änderung** – Optionale Zeitanzeige der letzten Statusänderung

## Installation über HACS

1. **HACS** öffnen → **Frontend** → **⋮** (drei Punkte oben rechts)
2. **Benutzerdefinierte Repositories** auswählen
3. Repository-URL eingeben: `https://github.com/DEIN_USERNAME/rauchmelder-card`
4. Kategorie: **Lovelace**
5. **Hinzufügen** und anschließend **Installieren**
6. Home Assistant **neu starten**

## Manuelle Installation

1. `dist/rauchmelder-card.js` herunterladen
2. Datei nach `config/www/rauchmelder-card.js` kopieren
3. In Home Assistant → **Einstellungen** → **Dashboards** → **Ressourcen**:
   - URL: `/local/rauchmelder-card.js`
   - Typ: `JavaScript-Modul`

## Konfiguration

### Über den visuellen Editor

1. Dashboard bearbeiten → **+ Karte hinzufügen**
2. Nach **Rauchmelder Card** suchen
3. Entities in den Feldern eintragen

### YAML-Konfiguration

```yaml
type: custom:rauchmelder-card
title: Rauchmelder Flur
entity_abschaltung: binary_sensor.rauchmelder_flur_abschaltung
entity_fehler: binary_sensor.rauchmelder_flur_fehler
entity_abschalten: switch.rauchmelder_flur_abschalten
show_last_changed: true
```

### Optionen

| Option              | Typ     | Pflicht | Standard       | Beschreibung                              |
|---------------------|---------|---------|----------------|-------------------------------------------|
| `title`             | string  | Nein    | `Rauchmelder`  | Titel der Karte                           |
| `entity_abschaltung`| string | Nein    | –              | binary_sensor für Abschaltung-Status      |
| `entity_fehler`     | string  | Nein    | –              | binary_sensor für Fehler-Status           |
| `entity_abschalten` | string  | **Ja**  | –              | switch Entity zum Abschalten              |
| `show_last_changed` | boolean | Nein    | `true`         | Letzte Änderung anzeigen                  |

## Mehrere Rauchmelder

Einfach mehrere Karten anlegen – eine pro Rauchmelder/Raum:

```yaml
type: vertical-stack
cards:
  - type: custom:rauchmelder-card
    title: Rauchmelder Flur
    entity_abschaltung: binary_sensor.rm_flur_abschaltung
    entity_fehler: binary_sensor.rm_flur_fehler
    entity_abschalten: switch.rm_flur_abschalten

  - type: custom:rauchmelder-card
    title: Rauchmelder Küche
    entity_abschaltung: binary_sensor.rm_kueche_abschaltung
    entity_fehler: binary_sensor.rm_kueche_fehler
    entity_abschalten: switch.rm_kueche_abschalten
```

## Lizenz

MIT
