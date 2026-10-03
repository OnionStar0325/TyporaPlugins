# Typora Plugins

A collection and monorepo workspace for developing modular plugins for [Typora](https://typora.io/), fully compatible with the [typora-community-plugin](https://github.com/typora-community-plugin/typora-community-plugin) loader.

> **Notice**: Most of the source code and documentation in this project has been authored and maintained with the assistance of the **Antigravity CLI** agentic AI coding environment.

---

## 📖 Overview

This repository serves as a centralized hub for developing, testing, and distributing Typora plugins. Every plugin under the `plugins/` directory follows the official [Typora Community Plugin Dev Guide](https://github.com/typora-community-plugin/typora-community-plugin/tree/main/docs/en-us/dev-guide) specifications, featuring:

- `manifest.json` metadata description
- `main.js` with `Plugin` lifecycle hooks (`onload`, `onunload`)
- `styles.css` automatic injection
- Setting Tabs with persistent configuration
- Internationalization (I18n: EN, KO, ZH)

---

## 🧩 Plugins List

| Plugin | Directory | Description | Status |
| :--- | :--- | :--- | :--- |
| **[Typora Pikchr Plugin](plugins/typora-plugin-pikchr)** | [`plugins/typora-plugin-pikchr`](plugins/typora-plugin-pikchr) | Real-time [Pikchr](https://pikchr.org/) diagram rendering with an embedded WebAssembly engine. | ✅ Ready & Tested |

---

## 📸 Screenshots & Samples

Typora Pikchr plugin delivers real-time live preview rendering with native Light and Dark theme synchronization. When the editor loses focus, code blocks are automatically hidden to present clean diagram visuals.

### ☀️ Light Mode Preview
![Light Mode Sample](doc_assets/typora-plugin-pikchr-LightSamples.png)

### 🌙 Dark Mode Preview
![Dark Mode Sample](doc_assets/typora-plugin-pikchr-DarkSamples.png)

> 💡 *Check out [typora-plugin-pikchr-examples.md](doc_assets/typora-plugin-pikchr-examples.md) for full runnable syntax examples (SQLite architecture, pipelines, flowcharts, build trees, and primitives).*

---

## 📁 Repository Structure

```text
TyporaPlugins/
├── .gitignore
├── LICENSE                                    # MIT License
├── README.md                                  # Root Project Overview (This file)
├── doc_assets/                                # Documentation assets & guides (prefixed by plugin)
│   ├── typora-plugin-pikchr-examples.md       # Official Pikchr examples for Typora
│   ├── typora-plugin-pikchr-LightSamples.png  # Light theme screenshot
│   └── typora-plugin-pikchr-DarkSamples.png   # Dark theme screenshot
└── plugins/                                   # Plugins directory (standalone / submodules)
    └── typora-plugin-pikchr/                  # Pikchr Diagram Plugin
        ├── manifest.json                      # Community loader descriptor
        ├── main.js                            # Built plugin entry point (Plugin subclass)
        ├── styles.css                         # Automatically loaded styles
        ├── package.json                       # Package metadata & build scripts
        ├── README.md                          # Plugin documentation & installation guide
        ├── doc_assets/                        # Plugin-level doc assets (standalone names)
        │   ├── examples.md                    # Packaged examples guide
        │   ├── LightSamples.png               # Light theme screenshot
        │   └── DarkSamples.png                # Dark theme screenshot
        ├── LICENSE                            # MIT License
        ├── build.js                           # Bundle build tool
        ├── src/
        │   ├── index.js                       # Plugin lifecycle & Typora integration
        │   ├── renderer.js                    # DOM rendering engine & CodeMirror bridge
        │   ├── settings.js                    # Settings Tab & options
        │   ├── i18n.js                        # Multi-language dictionary
        │   └── style.css                      # Base styling
        └── test/
            └── test.js                        # Test suite
```

---

## 🚀 Installing Plugins with Community Plugin Loader

To install any plugin from this repo into Typora:

1. Install [typora-community-plugin](https://github.com/typora-community-plugin/typora-community-plugin) in your Typora application.
2. Install dependencies and build the target plugin:
   ```bash
   cd plugins/typora-plugin-pikchr
   npm install
   npm run build
   ```
3. Copy the plugin directory into your Typora plugin folder:
   - **Windows**: `%APPDATA%\Typora\plugins\plugins\typora-plugin-pikchr\`
   - **macOS**: `~/Library/Application Support/abnerworks.Typora/plugins/plugins/typora-plugin-pikchr/`
   - **Linux**: `~/.config/Typora/plugins/plugins/typora-plugin-pikchr/`
4. Enable the plugin from Typora Settings -> **Community Plugins**.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
Individual plugins adhere to their respective upstream licensing notices.
