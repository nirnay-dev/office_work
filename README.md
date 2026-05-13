# Office Work - Application Hub

A modern, high-performance local file server built with **Deno** that allows you to browse and run web applications stored in subdirectories through a beautiful Application Hub interface.

## 🚀 Features

- **Application Discovery**: Automatically scans your directory for folders containing an `index.html` file and serves them as standalone apps.
- **Dynamic Views**: Toggle between **Grid View** (for visual browsing) and **List View** (for quick scanning).
- **Theme System**:
  - **Dark/Light Mode**: Smooth transitions between dark and light aesthetics.
  - **Color Schemes**: Choose from multiple curated palettes:
    - **Default**: Professional Blue/Green.
    - **Monochromatic**: Clean grayscale.
    - **Analogous**: Refreshing Teal/Indigo.
    - **Complementary**: Vibrant Blue/Orange.
- **Deno 2.x Optimized**: Uses the latest `Deno.serve` API for maximum reliability and speed.

## 🛠️ Getting Started

### Prerequisites

You must have **Deno** installed. If you don't have it yet, install it via:

```bash
# Linux/macOS
curl -fsSL https://deno.land/install.sh | sh
```

### Running the Server

To start the server, simply run:

```bash
deno task dev
```

The server will be available at [http://localhost:8000](http://localhost:8000).

## 📂 Project Structure

- `main.ts`: The core Deno server logic that routes and serves the applications.
- `deno.json`: Project configuration, task definitions, and dependency mapping.
- `.vscode/settings.json`: Recommended VS Code settings for Deno development.
- `CHANGELOG.md`: History of notable changes to the repository.
- `<app_folder>/`: Each application lives in its own folder (e.g., `online_excel/`, `drink_water/`) containing an `index.html` file and its associated assets.

## 🔧 Permissions

The server requires the following permissions:

- `--allow-read`: To read and serve your HTML files.
- `--allow-net`: To host the local web server.

---
