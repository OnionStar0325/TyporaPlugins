/**
 * Typora Pikchr Plugin - Settings Management & Setting Tab
 */

const DEFAULT_SETTINGS = {
  debounceDelay: 50,
  enableDarkModeAdjustment: true,
  fontSize: 'initial'
};

class PikchrSettingTab {
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    if (!containerEl) return;

    containerEl.empty();
    containerEl.createEl('h2', { text: this.plugin.i18n ? this.plugin.i18n.t('settingsTitle') : 'Pikchr Settings' });

    // 1. Debounce delay setting
    this.createSettingItem(
      containerEl,
      this.plugin.i18n ? this.plugin.i18n.t('debounceLabel') : 'Debounce Delay (ms)',
      this.plugin.i18n ? this.plugin.i18n.t('debounceDesc') : 'Delay before re-rendering diagram.',
      'number',
      this.plugin.settings.debounceDelay,
      async (value) => {
        this.plugin.settings.debounceDelay = Math.max(0, parseInt(value, 10) || 50);
        await this.plugin.saveSettings();
      }
    );

    // 2. Dark mode adjustment setting
    this.createSettingItem(
      containerEl,
      this.plugin.i18n ? this.plugin.i18n.t('darkModeLabel') : 'Dark Mode Optimization',
      this.plugin.i18n ? this.plugin.i18n.t('darkModeDesc') : 'Adjust SVG contrast in dark themes.',
      'checkbox',
      this.plugin.settings.enableDarkModeAdjustment,
      async (value) => {
        this.plugin.settings.enableDarkModeAdjustment = Boolean(value);
        await this.plugin.saveSettings();
      }
    );
  }

  createSettingItem(containerEl, title, desc, type, currentValue, onChange) {
    const itemEl = containerEl.createDiv ? containerEl.createDiv({ cls: 'setting-item' }) : document.createElement('div');
    if (!containerEl.createDiv) {
      itemEl.className = 'setting-item';
      containerEl.appendChild(itemEl);
    }

    const infoEl = document.createElement('div');
    infoEl.className = 'setting-item-info';
    infoEl.innerHTML = `<div class="setting-item-name">${title}</div><div class="setting-item-description">${desc}</div>`;
    itemEl.appendChild(infoEl);

    const controlEl = document.createElement('div');
    controlEl.className = 'setting-item-control';

    if (type === 'checkbox') {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = currentValue;
      input.addEventListener('change', (e) => onChange(e.target.checked));
      controlEl.appendChild(input);
    } else if (type === 'number') {
      const input = document.createElement('input');
      input.type = 'number';
      input.value = currentValue;
      input.addEventListener('change', (e) => onChange(e.target.value));
      controlEl.appendChild(input);
    }

    itemEl.appendChild(controlEl);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_SETTINGS, PikchrSettingTab };
} else {
  window.PikchrSettings = { DEFAULT_SETTINGS, PikchrSettingTab };
}
