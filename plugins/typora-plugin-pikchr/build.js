import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginDir = __dirname;
const srcDir = path.join(pluginDir, 'src');
const distDir = path.join(pluginDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('📦 Building Typora Community Plugin: Pikchr Diagram Renderer...');

const pikchrModulePath = path.join(pluginDir, 'node_modules', 'pikchr-js', 'pikchr.js');
let pikchrJs = fs.readFileSync(pikchrModulePath, 'utf-8');
pikchrJs = pikchrJs.replace('"use strict";var Module=', 'var PikchrModule=');
pikchrJs = pikchrJs.replace('var ENVIRONMENT_IS_NODE=globalThis.process?.versions?.node&&globalThis.process?.type!="renderer";', 'var ENVIRONMENT_IS_NODE=false;');
const splitMarker = ';return moduleRtn}})();';
if (pikchrJs.includes(splitMarker)) {
  pikchrJs = pikchrJs.split(splitMarker)[0] + splitMarker;
}
const modeJs = fs.readFileSync(path.join(srcDir, 'mode.js'), 'utf-8');
const rendererJs = fs.readFileSync(path.join(srcDir, 'renderer.js'), 'utf-8');
const styleCss = fs.readFileSync(path.join(pluginDir, 'styles.css'), 'utf-8');

// Build clean core plugin script without module exports
const coreScript = `
function debugLog(...args) {
  const msg = new Date().toISOString() + ' [Pikchr-Plugin] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\\n';
  console.log('[Pikchr-Plugin]', ...args);
  try {
    if (typeof window !== 'undefined' && window.reqnode) {
      window.reqnode('fs').appendFileSync('D:/Projects/TyporaPlugins/plugin-debug.log', msg);
    }
  } catch(e) {}
}

debugLog('Pikchr script evaluated in window');

// ==========================================
// 1. Embedded Pikchr WebAssembly Engine
// ==========================================
${pikchrJs}

// ==========================================
// 2. Internationalization (I18n)
// ==========================================
const pikchrLocales = {
  en: {
    pluginName: 'Pikchr Diagram Renderer',
    settingsTitle: 'Pikchr Settings',
    debounceLabel: 'Render Debounce Delay (ms)',
    debounceDesc: 'Debounce duration before updating diagram on text change.',
    darkModeLabel: 'Dark Mode Optimization',
    darkModeDesc: 'Automatically generate dark-mode optimized colors for dark themes (using native Pikchr dark mode engine).'
  },
  ko: {
    pluginName: 'Pikchr 다이어그램 렌더러',
    settingsTitle: 'Pikchr 설정',
    debounceLabel: '렌더링 디바운스 지연 시간 (ms)',
    debounceDesc: '텍스트 수정 후 다이어그램을 업데이트하기 전 대기 시간입니다.',
    darkModeLabel: '다크 모드 최적화',
    darkModeDesc: '다크 테마 사용 시 Pikchr 네이티브 다크모드 엔진을 사용하여 최적화된 색상으로 자동 렌더링합니다.'
  }
};

class PikchrI18nManager {
  constructor() {
    this.locale = this.detectLocale();
  }
  detectLocale() {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const lang = navigator.language.toLowerCase();
      if (lang.startsWith('ko')) return 'ko';
    }
    return 'en';
  }
  t(key) {
    const dict = pikchrLocales[this.locale] || pikchrLocales.en;
    return dict[key] || pikchrLocales.en[key] || key;
  }
}
const pikchrI18n = new PikchrI18nManager();

// ==========================================
// 3. Settings & Setting Tab
// ==========================================
const PIKCHR_DEFAULT_SETTINGS = {
  debounceDelay: 30,
  enableDarkModeAdjustment: true
};

class PikchrSettingTab {
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
  }

  display() {
    const containerEl = this.containerEl;
    if (!containerEl) return;

    containerEl.innerHTML = '';
    const h2 = document.createElement('h2');
    h2.textContent = this.plugin.i18n.t('settingsTitle');
    containerEl.appendChild(h2);

    this.createSettingItem(
      containerEl,
      this.plugin.i18n.t('debounceLabel'),
      this.plugin.i18n.t('debounceDesc'),
      'number',
      this.plugin.pluginSettings.debounceDelay,
      async (val) => {
        this.plugin.pluginSettings.debounceDelay = Math.max(0, parseInt(val, 10) || 30);
        await this.plugin.saveSettings();
      }
    );

    this.createSettingItem(
      containerEl,
      this.plugin.i18n.t('darkModeLabel'),
      this.plugin.i18n.t('darkModeDesc'),
      'checkbox',
      this.plugin.pluginSettings.enableDarkModeAdjustment,
      async (val) => {
        this.plugin.pluginSettings.enableDarkModeAdjustment = Boolean(val);
        await this.plugin.saveSettings();
      }
    );
  }

  createSettingItem(containerEl, title, desc, type, currentValue, onChange) {
    const itemEl = document.createElement('div');
    itemEl.className = 'setting-item';

    const infoEl = document.createElement('div');
    infoEl.className = 'setting-item-info';
    infoEl.innerHTML = '<div class="setting-item-name">' + title + '</div><div class="setting-item-description">' + desc + '</div>';
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
    containerEl.appendChild(itemEl);
  }
}

// ==========================================
// 4. CodeMirror Mode & Typora Integration
// ==========================================
${modeJs}

// ==========================================
// 5. Pikchr Renderer Engine
// ==========================================
${rendererJs}

// ==========================================
// 6. Plugin Main Class (Community Plugin Core API)
// ==========================================
class FallbackPluginBase {
  constructor(app, manifest) {
    this.app = app || (typeof window !== 'undefined' ? window : {});
    this.manifest = manifest || {};
    this._loaded = false;
    this._disposables = [];
  }
  load() {
    if (!this._loaded) {
      this.onload();
      this._loaded = true;
    }
  }
  unload() {
    if (this._loaded) {
      this.onunload();
      this._disposables.forEach(fn => {
        try { if (typeof fn === 'function') fn(); } catch (e) {}
      });
      this._disposables = [];
      this._loaded = false;
    }
  }
  register(disposable) {
    if (typeof disposable === 'function') this._disposables.push(disposable);
  }
  registerMarkdownPostProcessor(processor) {}
  async loadData() {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem('typora-plugin-' + (this.manifest.id || 'pikchr'));
      return data ? JSON.parse(data) : {};
    }
    return {};
  }
  async saveData(data) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('typora-plugin-' + (this.manifest.id || 'pikchr'), JSON.stringify(data));
    }
  }
  addSettingTab(tab) {
    if (this.app && this.app.setting && typeof this.app.setting.addSettingTab === 'function') {
      this.app.setting.addSettingTab(tab);
    }
  }
}

const typoraCoreApi = (typeof window !== 'undefined' && window[Symbol.for('typora-plugin-core@v2')]) || {};
let CommunityPluginBase = typoraCoreApi.Plugin || FallbackPluginBase;
let CommunityCodeblockProcessor = typoraCoreApi.CodeblockPostProcessor || null;

class PikchrPlugin extends CommunityPluginBase {
  constructor(app, manifest) {
    try {
      super(app, manifest);
      this.pluginSettings = Object.assign({}, PIKCHR_DEFAULT_SETTINGS);
      this.i18n = pikchrI18n;
      this.renderer = null;
      this.domObserver = null;
      this.themeObserver = null;
      debugLog('PikchrPlugin instance created successfully');
    } catch (e) {
      debugLog('PikchrPlugin constructor ERROR:', e.message);
      throw e;
    }
  }

  async onload() {
    debugLog('PikchrPlugin.onload() started');

    try {
      // 1. Inject Stylesheet
      if (typeof document !== 'undefined') {
        this.injectStyle();
      }

      // 2. Load Settings
      await this.loadSettings();

      // 3. Initialize WebAssembly Engine
      this.renderer = new PikchrRenderer({
        debounceDelay: this.pluginSettings.debounceDelay,
        enableDarkModeAdjustment: this.pluginSettings.enableDarkModeAdjustment
      });
      
      if (typeof window !== 'undefined') {
        window.PikchrRendererInstance = this.renderer;
      }

      try {
        const loader = typeof PikchrModule === 'function' ? PikchrModule : (typeof window !== 'undefined' ? window.PikchrModule : null);
        await this.renderer.init(loader);
        debugLog('WASM engine ready in onload');
      } catch(err) {
        debugLog('WASM engine init ERROR:', err.message);
      }

      // 4. Register CodeMirror Syntax Highlighting & Typora Engine Integration
      if (typeof registerPikchrMode === 'function') {
        registerPikchrMode(this.renderer);
      }

      // 5. Register Community Plugin CodeblockPostProcessor
      const self = this;
      if (typeof this.registerMarkdownPostProcessor === 'function' && CommunityCodeblockProcessor) {
        try {
          const postProcessor = CommunityCodeblockProcessor.from({
            lang: ['pikchr'],
            exportPreview: true,
            preview: async (code, codeblockEl) => {
              const container = document.createElement('div');
              container.className = 'typora-pikchr-preview';
              const isDark = self.renderer ? self.renderer.isDarkMode() : false;
              container.innerHTML = self.renderer ? self.renderer.render(code, 'pikchr-svg', isDark) : '';
              return container;
            }
          });
          this.registerMarkdownPostProcessor(postProcessor);
          debugLog('Registered native CodeblockPostProcessor for pikchr');
        } catch(e) {
          debugLog('CodeblockPostProcessor registration error:', e.message);
        }
      }

      // 6. Register Setting Tab
      if (typeof this.addSettingTab === 'function') {
        this.addSettingTab(new PikchrSettingTab(this.app, this));
      } else if (typeof this.registerSettingTab === 'function') {
        try {
          this.registerSettingTab(new PikchrSettingTab(this.app, this));
        } catch(e) {}
      }

      // 7. Register Workspace Events
      if (this.app && this.app.workspace && typeof this.app.workspace.on === 'function') {
        this.register(
          this.app.workspace.on('file:open', () => {
            debugLog('workspace file:open event fired');
            setTimeout(() => self.processFencesInElement(document), 100);
          })
        );
      }

      // 8. Start real-time DOM observer, theme observer & input hooks
      if (typeof document !== 'undefined') {
        this.startObserver();
        this.bindEditorEvents();

        // Multi-stage initial scan
        for (let i = 1; i <= 10; i++) {
          setTimeout(() => self.processFencesInElement(document), i * 150);
        }
      }

      // 9. Hook Typora Editor events
      if (typeof window !== 'undefined' && window.editor && typeof window.editor.on === 'function') {
        window.editor.on('edit', () => self.processFencesInElement(document));
        window.editor.on('load', () => self.processFencesInElement(document));
      }

      debugLog('PikchrPlugin.onload() fully ready');
    } catch(err) {
      debugLog('PikchrPlugin.onload() ERROR:', err.message, err.stack);
    }
  }

  injectStyle() {
    const styleId = 'typora-pikchr-injected-style';
    if (document.getElementById(styleId)) return;
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = ${JSON.stringify(styleCss)};
    document.head.appendChild(styleEl);
    debugLog('Pikchr stylesheet injected');
  }

  processFencesInElement(root) {
    if (typeof document === 'undefined' || !root || !root.querySelectorAll) return;
    const allFences = root.querySelectorAll('.md-fences');
    let matched = 0;
    allFences.forEach(fence => {
      if (this.renderer && this.renderer.isPikchrFence(fence)) {
        matched++;
        this.renderer.updateFence(fence);
      }
    });
    if (matched > 0) {
      debugLog('processFencesInElement rendered', matched, 'pikchr fences');
    }
  }

  startObserver() {
    if (typeof document === 'undefined') return;
    const targetNode = document.querySelector('#write') || document.body;
    if (!targetNode) {
      debugLog('startObserver: #write not found yet, retrying...');
      setTimeout(() => this.startObserver(), 300);
      return;
    }

    debugLog('startObserver: observing target node:', targetNode.tagName, targetNode.id);

    this.domObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches && node.matches('.md-fences')) {
                if (this.renderer && this.renderer.isPikchrFence(node)) {
                  this.renderer.updateFence(node);
                }
              } else if (node.querySelectorAll) {
                this.processFencesInElement(node);
              }
            }
          });
        } else if (mutation.type === 'characterData' || mutation.type === 'attributes') {
          let el = mutation.target.nodeType === Node.ELEMENT_NODE ? mutation.target : mutation.target.parentElement;
          const fence = el ? el.closest('.md-fences') : null;
          if (fence && this.renderer && this.renderer.isPikchrFence(fence)) {
            this.renderer.updateFence(fence);
          }
        }
      }
    });

    this.domObserver.observe(targetNode, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'lang', 'data-lang']
    });

    // Theme and Dark mode change observer
    this.themeObserver = new MutationObserver(() => {
      if (this.renderer) {
        this.renderer.renderCache.clear();
        this.processFencesInElement(document);
      }
    });

    this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'theme', 'style'] });
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'theme', 'style'] });

    if (window.matchMedia) {
      try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          if (this.renderer) {
            this.renderer.renderCache.clear();
            this.processFencesInElement(document);
          }
        });
      } catch (e) {}
    }
  }

  bindEditorEvents() {
    if (typeof document === 'undefined') return;

    document.addEventListener('input', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('md-fences-lang')) {
        const fence = e.target.closest('.md-fences');
        if (fence) {
          const val = (e.target.value || '').trim().toLowerCase();
          if (val === 'pikchr') {
            fence.setAttribute('lang', 'pikchr');
            this.renderer.updateFence(fence);
          }
        }
      }
    }, true);

    document.addEventListener('blur', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('md-fences-lang')) {
        const fence = e.target.closest('.md-fences');
        if (fence) {
          const val = (e.target.value || '').trim().toLowerCase();
          if (val === 'pikchr') {
            fence.setAttribute('lang', 'pikchr');
            this.renderer.updateFence(fence);
          }
        }
      }
    }, true);
  }

  onunload() {
    debugLog('PikchrPlugin.onunload() called');
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }
    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }
    if (this.renderer && typeof document !== 'undefined') {
      this.renderer.cleanup(document);
    }
  }

  async loadSettings() {
    try {
      const loadedData = await this.loadData();
      this.pluginSettings = Object.assign({}, PIKCHR_DEFAULT_SETTINGS, loadedData);
    } catch(e) {}
  }

  async saveSettings() {
    try {
      await this.saveData(this.pluginSettings);
      if (this.renderer) {
        this.renderer.options.debounceDelay = this.pluginSettings.debounceDelay;
        this.renderer.options.enableDarkModeAdjustment = this.pluginSettings.enableDarkModeAdjustment;
        this.renderer.renderCache.clear();
        this.processFencesInElement(document);
      }
    } catch(e) {}
  }
}
`;

// 1. main.js (ES Module for Community Loader)
const mainJsContent = `${coreScript}
export default PikchrPlugin;
`;
fs.writeFileSync(path.join(pluginDir, 'main.js'), mainJsContent, 'utf-8');

// 2. Standalone bundle (Pure IIFE script for direct injection & eval)
const standaloneContent = `/**
 * Typora Pikchr Plugin (Standalone Bundle)
 * License: MIT
 */
(function() {
  'use strict';

  ${coreScript}

  if (typeof PikchrPlugin !== 'undefined') {
    const pluginInstance = new PikchrPlugin(window, { id: 'typora-plugin-pikchr' });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => pluginInstance.load());
    } else {
      pluginInstance.load();
    }
    window.PikchrPluginInstance = pluginInstance;
  }
})();
`;

fs.writeFileSync(path.join(distDir, 'typora-plugin-pikchr.bundle.js'), standaloneContent, 'utf-8');
console.log('✅ Generated clean main.js and standalone bundle without syntax errors.');
