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

| Plugin | Repository / Submodule | Description | Status |
| :--- | :--- | :--- | :--- |
| **[Typora Pikchr Plugin](https://github.com/OnionStar0325/typora-plugin-pikchr)** | [`plugins/typora-plugin-pikchr`](https://github.com/OnionStar0325/typora-plugin-pikchr) | Real-time [Pikchr](https://pikchr.org/) diagram rendering with an embedded WebAssembly engine. | ✅ [v0.1.0 Released](https://github.com/OnionStar0325/typora-plugin-pikchr/releases) |

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
├── .gitmodules                                # Git submodules configuration
├── LICENSE                                    # MIT License
├── README.md                                  # Root Project Overview (This file)
├── doc_assets/                                # Documentation assets & guides (prefixed by plugin)
│   ├── typora-plugin-pikchr-examples.md       # Official Pikchr examples for Typora
│   ├── typora-plugin-pikchr-LightSamples.png  # Light theme screenshot
│   └── typora-plugin-pikchr-DarkSamples.png   # Dark theme screenshot
└── plugins/                                   # Plugins directory (managed via Git Submodules)
    └── typora-plugin-pikchr/                  # [Submodule] -> https://github.com/OnionStar0325/typora-plugin-pikchr
        ├── manifest.json                      # Community loader descriptor
        ├── main.js                            # Built plugin entry point (Plugin subclass)
        ├── styles.css                         # Automatically loaded styles
        ├── package.json                       # Package metadata & build scripts
        ├── README.md                          # Plugin documentation & installation guide
        ├── doc_assets/                        # Plugin-level doc assets
        │   ├── examples.md                    # Packaged examples guide
        │   ├── LightSamples.png               # Light theme screenshot
        │   └── DarkSamples.png                # Dark theme screenshot
        ├── LICENSE                            # MIT License
        ├── build.js                           # Bundle build tool
        ├── pack.js                            # Packaging tool (generates plugin.zip)
        ├── src/                               # Core source modules
        └── test/                              # Unit & bundle test suite
```

---

## 🚀 Installation & Setup

### Method 1: Community Plugin Marketplace (Recommended)
1. Install [typora-community-plugin](https://github.com/typora-community-plugin/typora-community-plugin) in Typora.
2. In Typora, open **Settings -> Community Plugins**.
3. Search for **Pikchr Diagram Renderer** and click **Install**.

### Method 2: Manual Installation (`plugin.zip`)
1. Download `plugin.zip` from the plugin's [Releases](https://github.com/OnionStar0325/typora-plugin-pikchr/releases).
2. Extract the folder into your Typora plugins directory:
   - **Windows**: `%APPDATA%\Typora\plugins\plugins\typora-plugin-pikchr\`
   - **macOS**: `~/Library/Application Support/abnerworks.Typora/plugins/plugins/typora-plugin-pikchr/`
   - **Linux**: `~/.config/Typora/plugins/plugins/typora-plugin-pikchr/`
3. Restart Typora and activate the plugin under **Settings -> Community Plugins**.

---

## 🛠️ Cloning with Submodules

To clone this repository along with all submodules:

```bash
git clone --recurse-submodules https://github.com/OnionStar0325/TyporaPlugins.git
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
Individual plugins adhere to their respective upstream licensing notices.
