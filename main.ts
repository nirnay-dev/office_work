import { serve } from "https://deno.land/std@0.187.0/http/server.ts";

// Helper function to list all .html files in the current directory
async function listHtmlFiles(): Promise<string[]> {
  const htmlFiles: string[] = [];
  try {
    for await (const entry of Deno.readDir(".")) {
      if (entry.isFile && entry.name.endsWith(".html")) {
        htmlFiles.push(entry.name);
      }
    }
  } catch (error) {
    console.error("Error reading directory:", error);
  }
  return htmlFiles;
}

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  // Serve the requested file
  if (url.pathname !== "/") {
    try {
      const filePath = decodeURIComponent(url.pathname.slice(1));
      if (filePath.includes("..")) {
        return new Response("Invalid path", { status: 400 });
      }
      const file = await Deno.readFile(filePath);
      const headers = new Headers();
      headers.set("Content-Type", "text/html");
      return new Response(file, { headers });
    } catch (error) {
      console.error("Error serving file:", error);
      return new Response("File not found", { status: 404 });
    }
  }

  // Generate the main page with a grid of files
  const htmlFiles = await listHtmlFiles();
  const gridItems = htmlFiles
    .map(
      (file) => {
        return `
          <div class="grid-item">
            <a href="/${encodeURIComponent(file)}" target="_blank">
              <span class="file-name">${file}</span>
            </a>
          </div>
        `;
      },
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Available HTML Files</title>
      <style>
        /* Base styles for dark mode */
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: #1a1a1a;
          transition: background-color 0.3s, color 0.3s;
        }

        .container {
          max-width: 1200px;
          margin: 40px auto;
        }

        h1 {
          text-align: center;
          margin-bottom: 20px;
        }

        .view-controls {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .view-toggle, .color-scheme-toggle {
          padding: 8px 15px;
          border: none;
          background-color: #333;
          color: white;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        .view-toggle:hover, .color-scheme-toggle:hover {
          background-color: #555;
        }
        
        .color-scheme-toggle.active {
            background-color: #4CAF50;
            color: white;
        }

        /* Toggle Switch Styling */
        .theme-toggle-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        #themeText {
            font-size: 14px;
        }
        .toggle-checkbox {
          display: none;
        }
        .toggle-label {
          display: block;
          width: 50px;
          height: 26px;
          background-color: #555;
          border-radius: 50px;
          position: relative;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .toggle-label:after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #f4f4f4;
          top: 3px;
          left: 3px;
          transition: transform 0.3s;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #4CAF50;
        }
        .toggle-checkbox:checked + .toggle-label:after {
          transform: translateX(24px);
        }

        /* Grid View Styling */
        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          list-style: none;
          padding: 0;
        }
        /* Common style for both grid and list items */
        .grid-item, .list-item {
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s;
          overflow: hidden;
          text-align: center;
        }
        .grid-item:hover, .list-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          background-color: #3a3a3a;
        }
        .grid-item a, .list-item a {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          height: 100%;
          box-sizing: border-box;
        }
        .file-name {
          font-weight: bold;
          text-align: center;
          word-break: break-all;
        }

        /* Theme-specific styles will be applied via JS */
        
        /* List View Specific Styling */
        .list-container {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .list-item a {
          flex-direction: row;
          justify-content: flex-start;
          padding: 15px;
        }
        
        /* Hide a container based on the class */
        .hidden {
          display: none;
        }
      </style>
    </head>
    <body class="default-scheme dark-mode">
      <div class="container">
        <h1>Available HTML Files</h1>
        <div class="view-controls">
          <button id="viewToggle" class="view-toggle">Switch to List View</button>
          <button id="colorSchemeToggle" class="color-scheme-toggle">Theme: Default</button>
          <div class="theme-toggle-wrapper">
             <span id="themeText">Dark Mode</span>
             <input type="checkbox" id="themeToggle" class="toggle-checkbox">
             <label for="themeToggle" class="toggle-label"></label>
          </div>
        </div>

        <div id="gridView" class="grid-container">
          ${htmlFiles.length > 0 ? gridItems : '<p style="text-align: center;">No HTML files found.</p>'}
        </div>
        
        <div id="listView" class="list-container hidden">
          ${htmlFiles.length > 0 ? htmlFiles.map(file => `<div class="list-item"><a href="/${encodeURIComponent(file)}" target="_blank"><span class="file-name">${file}</span></a></div>`).join('') : ''}
        </div>
      </div>

      <script>
        const viewToggle = document.getElementById('viewToggle');
        const themeToggle = document.getElementById('themeToggle');
        const themeText = document.getElementById('themeText');
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');
        const body = document.body;
        const colorSchemeToggle = document.getElementById('colorSchemeToggle');
        
        const schemes = ['default', 'mono', 'analogous', 'comp'];
        let currentSchemeIndex = 0;
        
        let isGridView = true;
        
        function applyScheme(scheme) {
            body.classList.remove(...schemes.map(s => s + '-scheme'));
            body.classList.add(scheme + '-scheme');
            
            colorSchemeToggle.textContent = 'Theme: ' + scheme.charAt(0).toUpperCase() + scheme.slice(1);
            localStorage.setItem('colorScheme', scheme);
        }

        // Apply initial theme from local storage or default
        const savedColorScheme = localStorage.getItem('colorScheme');
        if (savedColorScheme) {
            currentSchemeIndex = schemes.indexOf(savedColorScheme);
            if (currentSchemeIndex === -1) {
                currentSchemeIndex = 0; // Fallback to default
            }
            applyScheme(schemes[currentSchemeIndex]);
        } else {
            applyScheme('default');
        }

        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'light-mode') {
            body.classList.add('light-mode');
            themeToggle.checked = true;
            themeText.textContent = 'Light Mode';
        } else {
            body.classList.remove('light-mode');
            themeToggle.checked = false;
            themeText.textContent = 'Dark Mode';
        }

        viewToggle.addEventListener('click', () => {
          if (isGridView) {
            gridView.classList.add('hidden');
            listView.classList.remove('hidden');
            viewToggle.textContent = 'Switch to Grid View';
          } else {
            gridView.classList.remove('hidden');
            listView.classList.add('hidden');
            viewToggle.textContent = 'Switch to List View';
          }
          isGridView = !isGridView;
        });

        themeToggle.addEventListener('change', (event) => {
          if (event.target.checked) {
            body.classList.add('light-mode');
            themeText.textContent = 'Light Mode';
            localStorage.setItem('theme', 'light-mode');
          } else {
            body.classList.remove('light-mode');
            themeText.textContent = 'Dark Mode';
            localStorage.setItem('theme', 'dark-mode');
          }
        });

        colorSchemeToggle.addEventListener('click', () => {
            currentSchemeIndex = (currentSchemeIndex + 1) % schemes.length;
            applyScheme(schemes[currentSchemeIndex]);
        });
      </script>
      <style>
        /* Default Theme (Blue/Green) */
        body.default-scheme { color: #f4f4f4; }
        body.default-scheme h1 { color: #007bff; }
        body.default-scheme .view-toggle { background-color: #007bff; }
        body.default-scheme .view-toggle:hover { background-color: #0056b3; }
        body.default-scheme .color-scheme-toggle { background-color: #007bff; }
        body.default-scheme .color-scheme-toggle:hover { background-color: #0056b3; }
        body.default-scheme .grid-item a, body.default-scheme .list-item a { color: #4CAF50; }
        
        body.default-scheme.light-mode {
          background-color: #f0f2f5;
          color: #333;
        }
        body.default-scheme.light-mode h1 { color: #4CAF50; }
        body.default-scheme.light-mode .view-toggle { background-color: #4CAF50; }
        body.default-scheme.light-mode .view-toggle:hover { background-color: #45a049; }
        body.default-scheme.light-mode .color-scheme-toggle { background-color: #4CAF50; }
        body.default-scheme.light-mode .color-scheme-toggle:hover { background-color: #45a049; }
        body.default-scheme.light-mode .grid-item, body.default-scheme.light-mode .list-item { background: #fff; border: 1px solid #ddd; }
        body.default-scheme.light-mode .grid-item:hover, body.default-scheme.light-mode .list-item:hover { background-color: #f9f9f9; }
        body.default-scheme.light-mode .grid-item a, body.default-scheme.light-mode .list-item a { color: #007bff; }

        /* Monochromatic Theme */
        body.mono-scheme { color: #f0f0f0; }
        body.mono-scheme h1 { color: #b0b0b0; }
        body.mono-scheme .view-toggle { background-color: #b0b0b0; }
        body.mono-scheme .view-toggle:hover { background-color: #8c8c8c; }
        body.mono-scheme .color-scheme-toggle { background-color: #b0b0b0; }
        body.mono-scheme .color-scheme-toggle:hover { background-color: #8c8c8c; }
        body.mono-scheme .grid-item, body.mono-scheme .list-item { background: #2a2a2a; border: 1px solid #444; }
        body.mono-scheme .grid-item a, body.mono-scheme .list-item a { color: #d0d0d0; }
        
        body.mono-scheme.light-mode {
            background-color: #f0f2f5;
            color: #444;
        }
        body.mono-scheme.light-mode h1 { color: #8c8c8c; }
        body.mono-scheme.light-mode .view-toggle { background-color: #8c8c8c; }
        body.mono-scheme.light-mode .view-toggle:hover { background-color: #666; }
        body.mono-scheme.light-mode .color-scheme-toggle { background-color: #8c8c8c; }
        body.mono-scheme.light-mode .color-scheme-toggle:hover { background-color: #666; }
        body.mono-scheme.light-mode .grid-item, body.mono-scheme.light-mode .list-item { background: #fff; border: 1px solid #ddd; }
        body.mono-scheme.light-mode .grid-item:hover, body.mono-scheme.light-mode .list-item:hover { background-color: #f9f9f9; }
        body.mono-scheme.light-mode .grid-item a, body.mono-scheme.light-mode .list-item a { color: #555; }

        /* Analogous Theme (Blue-Green) */
        body.analogous-scheme { color: #e8f5e9; }
        body.analogous-scheme h1 { color: #00897b; }
        body.analogous-scheme .view-toggle { background-color: #00897b; }
        body.analogous-scheme .view-toggle:hover { background-color: #00695c; }
        body.analogous-scheme .color-scheme-toggle { background-color: #00897b; }
        body.analogous-scheme .color-scheme-toggle:hover { background-color: #00695c; }
        body.analogous-scheme .grid-item, body.analogous-scheme .list-item { background: #1a237e; border: 1px solid #3f51b5; }
        body.analogous-scheme .grid-item a, body.analogous-scheme .list-item a { color: #4db6ac; }
        
        body.analogous-scheme.light-mode {
            background-color: #e3f2fd;
            color: #1a237e;
        }
        body.analogous-scheme.light-mode h1 { color: #00897b; }
        body.analogous-scheme.light-mode .view-toggle { background-color: #00897b; }
        body.analogous-scheme.light-mode .view-toggle:hover { background-color: #00695c; }
        body.analogous-scheme.light-mode .color-scheme-toggle { background-color: #00897b; }
        body.analogous-scheme.light-mode .color-scheme-toggle:hover { background-color: #00695c; }
        body.analogous-scheme.light-mode .grid-item, body.analogous-scheme.light-mode .list-item { background: #fff; border: 1px solid #ddd; }
        body.analogous-scheme.light-mode .grid-item:hover, body.analogous-scheme.light-mode .list-item:hover { background-color: #e0f2f1; }
        body.analogous-scheme.light-mode .grid-item a, body.analogous-scheme.light-mode .list-item a { color: #00897b; }

        /* Complementary Theme (Blue-Orange) */
        body.comp-scheme { color: #fff3e0; }
        body.comp-scheme h1 { color: #e65100; }
        body.comp-scheme .view-toggle { background-color: #e65100; }
        body.comp-scheme .view-toggle:hover { background-color: #bf360c; }
        body.comp-scheme .color-scheme-toggle { background-color: #e65100; }
        body.comp-scheme .color-scheme-toggle:hover { background-color: #bf360c; }
        body.comp-scheme .grid-item, body.comp-scheme .list-item { background: #01579b; border: 1px solid #0277bd; }
        body.comp-scheme .grid-item a, body.comp-scheme .list-item a { color: #ffab40; }
        
        body.comp-scheme.light-mode {
            background-color: #e3f2fd;
            color: #0d47a1;
        }
        body.comp-scheme.light-mode h1 { color: #e65100; }
        body.comp-scheme.light-mode .view-toggle { background-color: #e65100; }
        body.comp-scheme.light-mode .view-toggle:hover { background-color: #bf360c; }
        body.comp-scheme.light-mode .color-scheme-toggle { background-color: #e65100; }
        body.comp-scheme.light-mode .color-scheme-toggle:hover { background-color: #bf360c; }
        body.comp-scheme.light-mode .grid-item, body.comp-scheme.light-mode .list-item { background: #fff; border: 1px solid #ddd; }
        body.comp-scheme.light-mode .grid-item:hover, body.comp-scheme.light-mode .list-item:hover { background-color: #fff3e0; }
        body.comp-scheme.light-mode .grid-item a, body.comp-scheme.light-mode .list-item a { color: #e65100; }
      </style>
    </body>
    </html>
  `;
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
};

console.log("Server running on http://localhost:8000");
serve(handler);
