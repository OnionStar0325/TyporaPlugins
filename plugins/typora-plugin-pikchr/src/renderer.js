/**
 * Typora Pikchr Plugin - Robust Diagram Renderer with Focus Toggle Support
 */

const PIKCHR_FLAG_PLAINTEXT_ERRORS = 0x01;
const PIKCHR_FLAG_DARK_MODE = 0x02;

class PikchrRenderer {
  constructor(options = {}) {
    this.module = null;
    this.initPromise = null;
    this.renderCache = new Map();
    this.debounceTimers = new Map();
    this.options = Object.assign({
      debounceDelay: 30,
      enableDarkModeAdjustment: true,
      darkMode: 'auto' // 'auto' | 'dark' | 'light'
    }, options);
  }

  async init(loader) {
    if (this.module) return this.module;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      let moduleLoader = loader;
      if (typeof moduleLoader !== 'function') {
        if (typeof loadPikchr === 'function') {
          moduleLoader = loadPikchr;
        } else if (typeof globalThis !== 'undefined' && typeof globalThis.loadPikchr === 'function') {
          moduleLoader = globalThis.loadPikchr;
        } else if (typeof window !== 'undefined' && typeof window.loadPikchr === 'function') {
          moduleLoader = window.loadPikchr;
        } else if (typeof PikchrModule === 'function') {
          moduleLoader = PikchrModule;
        } else if (typeof Module === 'function') {
          moduleLoader = Module;
        } else if (typeof window !== 'undefined' && typeof window.PikchrModule === 'function') {
          moduleLoader = window.PikchrModule;
        } else if (typeof window !== 'undefined' && typeof window.Module === 'function') {
          moduleLoader = window.Module;
        }
      }
      if (typeof moduleLoader === 'function') {
        const mod = await moduleLoader();
        this.module = mod;
        console.log('[Pikchr-Renderer] WebAssembly engine loaded successfully.');
        return mod;
      }
      throw new Error('Pikchr WebAssembly module loader not found.');
    })();

    return this.initPromise;
  }

  isDarkMode() {
    if (this.options.darkMode === 'dark') return true;
    if (this.options.darkMode === 'light') return false;
    if (!this.options.enableDarkModeAdjustment) return false;
    if (typeof document === 'undefined') return false;

    // 1. Check Typora's native File.colorBrightness (0 = pure black, 1 = pure white)
    if (typeof window !== 'undefined' && window.File && typeof window.File.colorBrightness === 'number') {
      return window.File.colorBrightness < 0.5;
    }

    // 2. Check explicit theme name
    const theme = (
      document.body.getAttribute('theme') || 
      (typeof window !== 'undefined' && window.File && window.File.option && window.File.option.theme) || 
      ''
    ).toLowerCase();

    if (['github', 'newsprint', 'gothic', 'whitey', 'pixyll', 'academic', 'light'].includes(theme)) {
      return false;
    }
    if (theme.includes('night') || theme.includes('dark') || theme.includes('black') || 
        theme.includes('dracula') || theme.includes('nord') || theme.includes('monokai') ||
        theme.includes('one-dark') || theme.includes('solarized-dark')) {
      return true;
    }

    // 3. Check explicit dark mode classes on html or body
    if (document.documentElement.classList.contains('dark-mode') || 
        document.body.classList.contains('dark-mode') ||
        document.body.classList.contains('typora-dark-mode')) {
      return true;
    }

    // 4. Check text/background color luminance of content area (#write or body)
    if (typeof window !== 'undefined') {
      try {
        const targetEl = document.querySelector('#write') || document.body;
        const style = window.getComputedStyle(targetEl);
        
        // Check background color if not transparent
        const bg = style.backgroundColor;
        const bgMatch = bg && bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (bgMatch) {
          const alpha = bgMatch[4] !== undefined ? parseFloat(bgMatch[4]) : 1;
          if (alpha > 0.1) {
            const r = parseInt(bgMatch[1], 10);
            const g = parseInt(bgMatch[2], 10);
            const b = parseInt(bgMatch[3], 10);
            const bgLum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return bgLum < 0.5;
          }
        }

        // Check text color (in dark mode text is bright/white, in light mode text is dark/black)
        const fg = style.color;
        const fgMatch = fg && fg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (fgMatch) {
          const r = parseInt(fgMatch[1], 10);
          const g = parseInt(fgMatch[2], 10);
          const b = parseInt(fgMatch[3], 10);
          const fgLum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return fgLum > 0.5;
        }
      } catch (e) {}
    }

    // Default to light mode (standard document editing)
    return false;
  }

  render(source, className = 'pikchr-svg', forceDarkMode = null) {
    if (!this.module) {
      return '<div class="typora-pikchr-loading" style="padding:6px;color:#888;">Pikchr engine initializing...</div>';
    }
    if (!source || !source.trim()) {
      return '';
    }

    const isDark = forceDarkMode !== null ? forceDarkMode : this.isDarkMode();
    const flags = isDark ? PIKCHR_FLAG_DARK_MODE : 0;

    try {
      let svg = '';
      if (typeof this.module === 'function') {
        svg = this.module(source, className, flags);
      } else if (this.module && typeof this.module.ccall === 'function') {
        svg = this.module.ccall(
          'pikchr',
          'string',
          ['string', 'string', 'number', 'number', 'number'],
          [source, className, flags, 0, 0]
        );
      }
      return svg || '';
    } catch (err) {
      return '<div class="typora-pikchr-error">' +
        'Pikchr error: ' + String(err.message).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
        '</div>';
    }
  }

  isPikchrFence(fenceEl) {
    if (!fenceEl || !fenceEl.getAttribute) return false;
    const langAttr = (fenceEl.getAttribute('lang') || fenceEl.getAttribute('data-lang') || '').trim().toLowerCase();
    if (langAttr === 'pikchr') return true;

    const langInput = fenceEl.querySelector('.md-fences-lang');
    if (langInput) {
      const val = (langInput.value || langInput.getAttribute('value') || langInput.textContent || '').trim().toLowerCase();
      if (val === 'pikchr') return true;
    }
    return false;
  }

  extractCode(fenceEl) {
    if (!fenceEl) return '';
    
    // 1. Direct cm property
    if (fenceEl.cm && typeof fenceEl.cm.getValue === 'function') {
      return fenceEl.cm.getValue();
    }

    // 2. Typora editor fences map
    const cid = fenceEl.getAttribute('cid');
    if (cid && typeof window !== 'undefined') {
      const editor = window.editor || (window.File && window.File.editor);
      if (editor && editor.fences && typeof editor.fences.getCm === 'function') {
        try {
          const cm = editor.fences.getCm(cid);
          if (cm && typeof cm.getValue === 'function') return cm.getValue();
        } catch (e) {}
      }
      if (editor && typeof editor.getNode === 'function') {
        try {
          const node = editor.getNode(cid);
          if (node && typeof node.get === 'function') {
            const text = node.get('text');
            if (typeof text === 'string') return text;
          }
        } catch (e) {}
      }
    }

    // 3. CodeMirror instance attached to DOM
    const cmEl = fenceEl.querySelector('.CodeMirror');
    if (cmEl && cmEl.CodeMirror && typeof cmEl.CodeMirror.getValue === 'function') {
      return cmEl.CodeMirror.getValue();
    }

    // 4. CodeMirror line elements
    const codeContainer = fenceEl.querySelector('.CodeMirror-code');
    if (codeContainer) {
      const lines = codeContainer.querySelectorAll('.CodeMirror-line');
      if (lines.length > 0) {
        return Array.from(lines).map(l => l.textContent.replace(/\u200b/g, '')).join('\n');
      }
      return codeContainer.textContent || '';
    }

    // 5. Fallback text content (ignoring language header and container)
    const clone = fenceEl.cloneNode(true);
    const lang = clone.querySelector('.md-fences-lang');
    if (lang) lang.remove();
    const panel = clone.querySelector('.typora-pikchr-container, .md-diagram-panel');
    if (panel) panel.remove();
    return clone.textContent || '';
  }

  updateFence(fenceEl) {
    if (!fenceEl) return;
    if (!this.isPikchrFence(fenceEl)) {
      this.removePanel(fenceEl);
      return;
    }

    const cid = fenceEl.getAttribute('cid') || fenceEl.id || Math.random().toString(36).slice(2);
    const delay = this.options.debounceDelay !== undefined ? this.options.debounceDelay : 30;

    if (this.debounceTimers.has(cid)) {
      clearTimeout(this.debounceTimers.get(cid));
    }

    this.debounceTimers.set(
      cid,
      setTimeout(() => {
        this.debounceTimers.delete(cid);
        this.processFence(fenceEl);
      }, delay)
    );
  }

  processFence(fenceEl) {
    if (!fenceEl || !this.isPikchrFence(fenceEl)) return;

    fenceEl.classList.add('pikchr-rendered');
    const cid = fenceEl.getAttribute('cid');
    const editor = typeof window !== 'undefined' ? (window.editor || (window.File && window.File.editor)) : null;
    const isDark = this.isDarkMode();

    // Check if Typora native diagram panel is active
    let nativePanel = fenceEl.querySelector('.md-diagram-panel');
    if (editor && editor.diagrams && !nativePanel && cid) {
      try {
        editor.diagrams.startPreview(cid);
        nativePanel = fenceEl.querySelector('.md-diagram-panel');
      } catch (e) {}
    }

    if (nativePanel) {
      const previewEl = nativePanel.querySelector('.md-diagram-panel-preview');
      const errorEl = nativePanel.querySelector('.md-diagram-panel-error');
      const rawCode = this.extractCode(fenceEl);
      const cacheKey = rawCode + '::' + (isDark ? 'dark' : 'light');

      // Attach click-to-focus handler on native panel
      if (!nativePanel._pikchrClickAttached) {
        nativePanel.addEventListener('click', (e) => {
          e.stopPropagation();
          fenceEl.classList.add('md-focus');
          if (fenceEl.cm && typeof fenceEl.cm.focus === 'function') {
            fenceEl.cm.focus();
          } else if (cid && editor && editor.fences) {
            try {
              const cm = editor.fences.getCm(cid);
              if (cm) cm.focus();
            } catch (err) {}
          }
        });
        nativePanel._pikchrClickAttached = true;
      }

      const cached = this.renderCache.get(fenceEl);
      if (cached && cached.key === cacheKey) return;

      if (errorEl) errorEl.innerHTML = '';
      if (!rawCode || !rawCode.trim()) {
        if (previewEl) previewEl.innerHTML = '<text style="fill:#888;font-size:12px;">Empty Pikchr Diagram</text>';
      } else {
        const svg = this.render(rawCode, 'pikchr-svg', isDark);
        if (previewEl) {
          previewEl.innerHTML = svg;
          const svgEl = previewEl.querySelector('svg');
          if (svgEl) svgEl.classList.add('pikchr-svg');
        }
      }
      this.renderCache.set(fenceEl, { key: cacheKey });
      return;
    }

    // Fallback: Standalone container rendering
    let container = fenceEl.querySelector('.typora-pikchr-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'typora-pikchr-container';
      container.setAttribute('contenteditable', 'false');

      container.addEventListener('click', (e) => {
        e.stopPropagation();
        fenceEl.classList.add('md-focus');
        if (fenceEl.cm && typeof fenceEl.cm.focus === 'function') {
          fenceEl.cm.focus();
        } else if (cid && editor && editor.fences) {
          try {
            const cm = editor.fences.getCm(cid);
            if (cm) cm.focus();
          } catch (err) {}
        }
      });

      const rerender = () => this.updateFence(fenceEl);
      fenceEl.addEventListener('keyup', rerender);
      fenceEl.addEventListener('input', rerender);

      fenceEl.appendChild(container);
    }

    const rawCode = this.extractCode(fenceEl);
    const cacheKey = rawCode + '::' + (isDark ? 'dark' : 'light');
    const cached = this.renderCache.get(fenceEl);
    if (cached && cached.key === cacheKey) {
      return;
    }

    const svgResult = this.render(rawCode, 'pikchr-svg', isDark);
    container.innerHTML = svgResult;
    this.renderCache.set(fenceEl, { key: cacheKey });
  }

  removePanel(fenceEl) {
    if (!fenceEl) return;
    const container = fenceEl.querySelector('.typora-pikchr-container');
    if (container) container.remove();
    fenceEl.classList.remove('pikchr-rendered');
    this.renderCache.delete(fenceEl);
  }

  cleanup(root = document) {
    const containers = root.querySelectorAll('.typora-pikchr-container');
    containers.forEach(c => c.remove());
    const fences = root.querySelectorAll('.pikchr-rendered');
    fences.forEach(f => f.classList.remove('pikchr-rendered'));
    this.renderCache.clear();
    this.debounceTimers.forEach(t => clearTimeout(t));
    this.debounceTimers.clear();
  }

  scanAndRender(root = document) {
    if (!root || !root.querySelectorAll) return;
    const fences = root.querySelectorAll('.md-fences');
    fences.forEach(f => {
      if (this.isPikchrFence(f)) this.updateFence(f);
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PikchrRenderer;
}
if (typeof window !== 'undefined') {
  window.PikchrRenderer = PikchrRenderer;
}
