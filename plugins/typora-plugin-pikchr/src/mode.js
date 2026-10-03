/**
 * Typora Pikchr Plugin - CodeMirror Mode, Autocomplete & Typora Native Diagram Engine Integration
 */

function registerPikchrMode(pikchrRenderer) {
  if (typeof window === 'undefined') return;

  // 1. Register CodeMirror Syntax Highlighting Mode
  const CodeMirror = window.CodeMirror;
  if (CodeMirror && typeof CodeMirror.defineMode === 'function') {
    if (!CodeMirror.modes || !CodeMirror.modes.pikchr) {
      CodeMirror.defineMode('pikchr', function () {
        const keywords = /^(box|circle|ellipse|oval|cylinder|file|line|arrow|spline|dot|text)\b/i;
        const attributes = /^(at|from|to|then|color|fill|thickness|width|height|radius|diameter|rad|above|below|left|right|up|down|heading|cw|ccw|close|behind|chop|invisible|invis|same|as|fit|go)\b/i;
        const colors = /^(black|white|red|green|blue|cyan|magenta|yellow|gray|grey|orange|purple)\b/i;

        return {
          startState: () => ({ inString: false }),
          token: (stream) => {
            if (stream.eatSpace()) return null;
            if (stream.match(/^#.*/) || stream.match(/^\/\/.*/)) return 'comment';
            if (stream.match(/^"([^"\\]|\\.)*"/)) return 'string';
            if (stream.match(/^0x[0-9a-f]+/i) || stream.match(/^[0-9]+(\.[0-9]+)?(cm|in|px|pt|mm)?/i)) return 'number';
            if (stream.match(keywords)) return 'keyword';
            if (stream.match(attributes)) return 'attribute';
            if (stream.match(colors)) return 'atom';
            stream.next();
            return null;
          }
        };
      });
    }

    // 2. Register CodeMirror.modeInfo for language selection & dropdown
    if (Array.isArray(CodeMirror.modeInfo)) {
      const exists = CodeMirror.modeInfo.some(m => (m.name || '').toLowerCase() === 'pikchr' || m.mode === 'pikchr');
      if (!exists) {
        CodeMirror.modeInfo.push({
          name: 'Pikchr',
          mime: 'text/x-pikchr',
          mode: 'pikchr',
          ext: ['pikchr', 'pik']
        });
      }
    }
  }

  // 3. Register in Typora global modes map
  if (window.modes && typeof window.modes === 'object') {
    window.modes.pikchr = { name: 'Pikchr', mode: 'pikchr', mime: 'text/x-pikchr' };
  }

  // 4. Register in Typora Fences Autocomplete List (editor.fences.ALL)
  const addPikchrToLangList = (fencesObj) => {
    if (!fencesObj) return;
    if (fencesObj.modes && !fencesObj.modes.pikchr) {
      fencesObj.modes.pikchr = 'pikchr';
    }
    if (Array.isArray(fencesObj.ALL) && !fencesObj.ALL.includes('pikchr')) {
      fencesObj.ALL.push('pikchr');
    }
    if (typeof fencesObj.getLangList === 'function') {
      try {
        const list = fencesObj.getLangList();
        if (Array.isArray(list) && !list.includes('pikchr')) {
          list.push('pikchr');
        }
      } catch (e) {}
    }
  };

  if (window.editor && window.editor.fences) addPikchrToLangList(window.editor.fences);
  if (window.File && window.File.editor && window.File.editor.fences) addPikchrToLangList(window.File.editor.fences);
  if (window.Fences) addPikchrToLangList(window.Fences);

  // 5. Hook Typora Native Diagram Engine (editor.diagrams & isDiagramType)
  const hookDiagramEngine = () => {
    const editor = window.editor || (window.File && window.File.editor);
    if (!editor || !editor.diagrams) return false;

    const diagrams = editor.diagrams;
    const DiagramClass = diagrams.constructor;

    if (DiagramClass) {
      if (Array.isArray(DiagramClass.MODES) && !DiagramClass.MODES.includes('pikchr')) {
        DiagramClass.MODES.push('pikchr');
      }

      if (!DiagramClass._pikchrHooked && typeof DiagramClass.isDiagramType === 'function') {
        const origIsDiagramType = DiagramClass.isDiagramType;
        DiagramClass.isDiagramType = function (lang) {
          if (typeof lang === 'string' && lang.toLowerCase().trim() === 'pikchr') {
            return true;
          }
          return origIsDiagramType ? origIsDiagramType(lang) : false;
        };
        DiagramClass._pikchrHooked = true;
      }
    }

    if (!diagrams._pikchrHooked && typeof diagrams.updateDiagram === 'function') {
      const origUpdateDiagram = diagrams.updateDiagram;
      diagrams.updateDiagram = async function (cid, i, e, t) {
        const node = this.editor.getNode(cid);
        const lang = ((node ? node.get('lang') : '') || '').toLowerCase().trim();
        const cm = this.editor.fences.getCm(cid);
        const mode = ((cm && cm.options && cm.options.mode) || '').toLowerCase().trim();

        if (lang === 'pikchr' || mode === 'pikchr') {
          const elem = this.editor.findElemById(cid);
          if (!elem || !elem.length) return;

          let panel = elem.find('.md-diagram-panel');
          if (!panel.length) {
            return this.startPreview(cid, t);
          }

          const previewEl = panel.find('.md-diagram-panel-preview')[0];
          const errorEl = panel.find('.md-diagram-panel-error')[0];
          const code = cm ? cm.getValue() : (node ? node.get('text') : '');

          if (errorEl) errorEl.innerHTML = '';

          if (!code || !code.trim()) {
            if (previewEl) previewEl.innerHTML = '<text style="fill:#888;font-size:12px;">Empty Pikchr Diagram</text>';
            return;
          }

          try {
            const renderer = pikchrRenderer || window.PikchrRendererInstance || (window.PikchrPluginInstance && window.PikchrPluginInstance.renderer);
            if (renderer && previewEl) {
              const svg = renderer.render(code);
              previewEl.innerHTML = svg;
              const svgEl = previewEl.querySelector('svg');
              if (svgEl) {
                svgEl.classList.add('pikchr-svg');
              }
            }
          } catch (err) {
            if (errorEl) errorEl.textContent = 'Pikchr error: ' + err.message;
          }

          const h = panel.height();
          const domElem = elem[0];
          if (domElem) {
            domElem.style.marginBottom = domElem.classList.contains('md-focus') ? (h + 40 + 'px') : '';
          }
          return;
        }

        return origUpdateDiagram.apply(this, arguments);
      };
      diagrams._pikchrHooked = true;
    }

    return true;
  };

  // Run hooks immediately and keep trying until editor is initialized
  if (!hookDiagramEngine()) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (hookDiagramEngine() || attempts > 20) {
        clearInterval(interval);
      }
    }, 250);
  }

  console.log('[Pikchr-Plugin] CodeMirror mode, autocomplete, and native diagram hooks registered.');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { registerPikchrMode };
}
if (typeof window !== 'undefined') {
  window.registerPikchrMode = registerPikchrMode;
}
