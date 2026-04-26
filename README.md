# Office Work - Local HTML File Viewer

A modern, high-performance local file server built with **Deno** that allows you to browse and view all `.html` files in your directory through a beautiful web interface.

## 🚀 Features

- **Instant Preview**: Automatically scans your directory for HTML files and serves them.
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

- `main.ts`: The core Deno server logic.
- `deno.json`: Project configuration and task definitions.
- `.vscode/settings.json`: Recommended VS Code settings for Deno development.
- `*.html`: Your local HTML files that will be served.

## 🔧 Permissions

The server requires the following permissions:

- `--allow-read`: To read and serve your HTML files.
- `--allow-net`: To host the local web server.

---
