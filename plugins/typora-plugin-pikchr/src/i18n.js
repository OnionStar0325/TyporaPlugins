/**
 * Typora Pikchr Plugin - Internationalization (I18n)
 */

const locales = {
  en: {
    pluginName: 'Pikchr Diagram Renderer',
    settingsTitle: 'Pikchr Settings',
    debounceLabel: 'Render Debounce Delay (ms)',
    debounceDesc: 'Debounce duration before updating diagram on text change.',
    darkModeLabel: 'Dark Mode Optimization',
    darkModeDesc: 'Apply theme-adaptive contrast adjustments for dark themes.',
    fontSizeLabel: 'Initial Font Size',
    fontSizeDesc: 'Font size style applied to rendered SVG diagrams (e.g., "initial" or "14px").',
    renderError: 'Pikchr Rendering Error',
  },
  ko: {
    pluginName: 'Pikchr 다이어그램 렌더러',
    settingsTitle: 'Pikchr 설정',
    debounceLabel: '렌더링 디바운스 지연 시간 (ms)',
    debounceDesc: '텍스트 수정 후 다이어그램을 업데이트하기 전 대기 시간입니다.',
    darkModeLabel: '다크 모드 최적화',
    darkModeDesc: '다크 테마 사용 시 다이어그램의 가독성을 높이기 위한 자동 조정을 적용합니다.',
    fontSizeLabel: '초기 폰트 크기',
    fontSizeDesc: '렌더링된 SVG 다이어그램에 적용할 폰트 크기입니다 (예: "initial", "14px").',
    renderError: 'Pikchr 렌더링 오류',
  },
  zh_cn: {
    pluginName: 'Pikchr 图表渲染器',
    settingsTitle: 'Pikchr 设置',
    debounceLabel: '渲染防抖延迟 (毫秒)',
    debounceDesc: '文本更改后更新图表前的防抖等待时间。',
    darkModeLabel: '暗黑模式适配',
    darkModeDesc: '在暗黑主题下自动应用对比度调整以提升可读性。',
    fontSizeLabel: '初始字体大小',
    fontSizeDesc: '应用于渲染的 SVG 图表的字体大小（例如 "initial" 或 "14px"）。',
    renderError: 'Pikchr 渲染错误',
  }
};

class I18n {
  constructor() {
    this.locale = this.detectLocale();
  }

  detectLocale() {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const lang = navigator.language.toLowerCase();
      if (lang.startsWith('ko')) return 'ko';
      if (lang.startsWith('zh')) return 'zh_cn';
    }
    return 'en';
  }

  setLocale(lang) {
    if (locales[lang]) {
      this.locale = lang;
    }
  }

  t(key) {
    const dict = locales[this.locale] || locales.en;
    return dict[key] || locales.en[key] || key;
  }
}

const i18n = new I18n();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { i18n, locales };
} else {
  window.PikchrI18n = { i18n, locales };
}
