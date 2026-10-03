/**
 * Typora Pikchr Plugin
 * High-performance real-time Pikchr diagram rendering & language autocomplete for Typora.
 */

const PikchrModule = typeof require === 'function' ? require('./pikchr.js') : window.PikchrModule;
const PikchrRenderer = typeof require === 'function' ? require('./renderer.js') : window.PikchrRenderer;
const { registerPikchrMode } = typeof require === 'function' ? require('./mode.js') : window;
const { DEFAULT_SETTINGS, PikchrSettingTab } = typeof require === 'function' ? require('./settings.js') : (typeof PikchrSettings !== 'undefined' ? PikchrSettings : {});
const { i18n } = typeof require === 'function' ? require('./i18n.js') : (typeof PikchrI18n !== 'undefined' ? PikchrI18n : {});

// Base Plugin fallback class
let BasePlugin = class {
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
    if (typeof disposable === 'function') {
      this._disposables.push(disposable);
    }
  }
  registerMarkdownPostProcessor(processor) {
    console.log('[Pikchr-Plugin] Fallback post-processor registered');
  }
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
};

let CodeblockPostProcessorClass = null;

if (typeof require === 'function') {
  try {
    const communityCore = require('typora-community-plugin');
    if (communityCore) {
      if (communityCore.Plugin) BasePlugin = communityCore.Plugin;
      if (communityCore.CodeblockPostProcessor) CodeblockPostProcessorClass = communityCore.CodeblockPostProcessor;
    }
  } catch (e) {}
}

class PikchrPlugin extends BasePlugin {
  constructor(app, manifest) {
    super(app, manifest);
    this.settings = Object.assign({}, DEFAULT_SETTINGS || { debounceDelay: 50, enableDarkModeAdjustment: true });
    this.i18n = i18n;
    this.renderer = null;
    this.fallbackObserver = null;
  }

  async onload() {
    console.log('[Pikchr-Plugin] Loading Pikchr Diagram Renderer & Autocomplete...');

    // 1. Register CodeMirror Syntax Highlighting & Codeblock Autocomplete
    if (typeof registerPikchrMode === 'function') {
      registerPikchrMode();
    }

    // 2. Load settings
    await this.loadSettings();

    // 3. Initialize Pikchr WASM Engine
    this.renderer = new PikchrRenderer({
      debounceDelay: this.settings.debounceDelay,
      enableDarkModeAdjustment: this.settings.enableDarkModeAdjustment
    });
    await this.renderer.init(PikchrModule);

    // 4. Register Setting Tab
    if (PikchrSettingTab) {
      this.addSettingTab(new PikchrSettingTab(this.app, this));
    }

    // 5. Register Community Plugin CodeblockPostProcessor
    const self = this;
    if (typeof this.registerMarkdownPostProcessor === 'function') {
      if (CodeblockPostProcessorClass && typeof CodeblockPostProcessorClass.from === 'function') {
        const postProcessor = CodeblockPostProcessorClass.from({
          lang: ['pikchr'],
          exportPreview: true,
          preview: async (code, codeblockEl) => {
            const container = document.createElement('div');
            container.className = 'pikchr-diagram-preview';
            const svg = self.renderer.render(code);
            container.innerHTML = svg;
            return container;
          }
        });
        this.registerMarkdownPostProcessor(postProcessor);
        console.log('[Pikchr-Plugin] Native CodeblockPostProcessor registered for "pikchr".');
      } else {
        this.registerMarkdownPostProcessor((el) => {
          self.processFencesInElement(el || document);
        });
      }
    }

    // 6. Start real-time DOM observer & input hooks
    this.startObserver();
    this.bindEditorEvents();

    // 7. Initial render scan
    this.processFencesInElement(document);

    console.log('[Pikchr-Plugin] Pikchr Diagram Renderer loaded and active.');
  }

  processFencesInElement(root) {
    if (!root || !root.querySelectorAll) return;
    const fences = root.querySelectorAll('.md-fences');
    fences.forEach(fence => {
      if (this.renderer && this.renderer.isPikchrFence(fence)) {
        this.renderer.updateFence(fence);
      }
    });
  }

  startObserver() {
    const targetNode = document.querySelector('#write') || document.body;
    if (!targetNode) {
      setTimeout(() => this.startObserver(), 300);
      return;
    }

    this.fallbackObserver = new MutationObserver((mutations) => {
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

    this.fallbackObserver.observe(targetNode, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'lang', 'data-lang']
    });
  }

  bindEditorEvents() {
    // Listen for language input changes on .md-fences-lang
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
        if (fence && this.renderer.isPikchrFence(fence)) {
          this.renderer.updateFence(fence);
        }
      }
    }, true);
  }

  onunload() {
    console.log('[Pikchr-Plugin] Unloading Pikchr Plugin...');
    if (this.fallbackObserver) {
      this.fallbackObserver.disconnect();
      this.fallbackObserver = null;
    }
    if (this.renderer) {
      this.renderer.cleanup(document);
    }
    console.log('[Pikchr-Plugin] Unloaded.');
  }

  async loadSettings() {
    const loadedData = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    if (this.renderer) {
      this.renderer.options.debounceDelay = this.settings.debounceDelay;
      this.renderer.options.enableDarkModeAdjustment = this.settings.enableDarkModeAdjustment;
      this.processFencesInElement(document);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PikchrPlugin;
  module.exports.default = PikchrPlugin;
}
if (typeof window !== 'undefined') {
  window.PikchrPlugin = PikchrPlugin;
}
export default PikchrPlugin;
