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

// Map of specific filename bases or extensions to their logo names from the Simple Icons library
const logoNameMap = new Map<string, string>([
  // Specific filename bases (e.g., 'excel' from 'excel.html')
  ['local_video_player', 'vlcmediaplayer'],
  ['pdf_textify', 'adobeacrobat'],
  ['dateformater', 'calendar'],
  ['drinkwater', 'water'],
  ['filespacer', 'folder'],
  ['finance-tracker', 'money'],
  ['full_page_calendar_task_scheduler', 'calendar'],
  ['igrsp_proposal_downloader', 'download'],
  ['material3-website-builder', 'materialdesign'],
  ['online-excel', 'microsoftexcel'],
  ['pdfrenamerv7', 'adobeacrobat'],
  ['youtube', 'youtube'],

  // Common file extensions
  ['html', 'html5'],
  ['css', 'css3'],
  ['js', 'javascript'],
  ['ts', 'typescript'],
  ['json', 'json'],
  ['md', 'markdown'],
]);

// Function to get the correct logo name based on the full filename
function getFileLogoName(filename: string): string {
  const lowercaseFilename = filename.toLowerCase();

  // 1. Extract filename base and check for a match
  const filenameWithoutExtension = lowercaseFilename.replace(/\.[^/.]+$/, '');
  if (logoNameMap.has(filenameWithoutExtension)) {
    return logoNameMap.get(filenameWithoutExtension)!;
  }

  // 2. Fallback to checking for common file extensions
  const extensionMatch = lowercaseFilename.match(/\.([0-9a-z]+)$/i);
  if (extensionMatch) {
    const extension = extensionMatch[1];
    if (logoNameMap.has(extension)) {
      return logoNameMap.get(extension)!;
    }
  }

  // 3. Final fallback to a generic file icon
  return 'file';
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
        const logoName = getFileLogoName(file);
        // The logo color is determined by the theme via JavaScript after the page loads
        const logoSrc = `https://cdn.simpleicons.org/${logoName}/white`;
        const altText = `${file} Logo`;
        
        return `
          <div class="grid-item">
            <a href="/${encodeURIComponent(file)}" target="_blank">
              <div class="file-icon">
                <img src="${logoSrc}" alt="${altText}" class="html-icon">
              </div>
              <div class="file-name">${file}</div>
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
        /* Dark Mode - Default Styles */
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: #1a1a1a;
          color: #f4f4f4;
          transition: background-color 0.3s, color 0.3s;
        }
        .container {
          max-width: 1200px;
          margin: 40px auto;
        }
        h1 {
          color: #e0e0e0;
          text-align: center;
          margin-bottom: 20px;
        }
        .view-controls {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }
        .view-toggle {
          padding: 8px 15px;
          border: none;
          background-color: #333;
          color: white;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        .view-toggle:hover {
          background-color: #555;
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
        .grid-item {
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s;
          overflow: hidden;
        }
        .grid-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          background-color: #3a3a3a;
        }
        .grid-item a {
          text-decoration: none;
          color: #f4f4f4;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
        }
        .file-icon {
          width: 80px;
          height: 80px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
        }
        .html-icon {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .file-name {
          font-weight: bold;
          text-align: center;
          word-break: break-all;
        }

        /* Light Mode - Optional Styles */
        body.light-mode {
          background-color: #f0f2f5;
          color: #333;
        }
        body.light-mode h1 {
          color: #1a237e;
        }
        body.light-mode .view-toggle {
          background-color: #4CAF50;
          color: white;
        }
        body.light-mode .view-toggle:hover {
          background-color: #45a049;
        }
        body.light-mode .grid-item {
          background: #fff;
          border: 1px solid #ddd;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        body.light-mode .grid-item:hover {
          background-color: #f9f9f9;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        body.light-mode .grid-item a {
          color: #333;
        }
        
        /* List View Styling (for the toggle) */
        .list-container {
          list-style: none;
          padding: 0;
        }
        .list-item {
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 10px;
          transition: background-color 0.3s ease;
        }
        .list-item:hover {
          background-color: #3a3a3a;
        }
        .list-item a {
          text-decoration: none;
          color: #4CAF50;
          font-weight: bold;
          display: block;
        }
        body.light-mode .list-item {
          background: #fff;
          border: 1px solid #ddd;
        }
        body.light-mode .list-item:hover {
          background-color: #f9f9f9;
        }
        body.light-mode .list-item a {
          color: #007bff;
        }
        
        /* Hide a container based on the class */
        .hidden {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Available HTML Files</h1>
        <div class="view-controls">
          <button id="viewToggle" class="view-toggle">Switch to List View</button>
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
          ${htmlFiles.length > 0 ? htmlFiles.map(file => `<div class="list-item"><a href="/${encodeURIComponent(file)}" target="_blank">${file}</a></div>`).join('') : ''}
        </div>
      </div>

      <script>
        const viewToggle = document.getElementById('viewToggle');
        const themeToggle = document.getElementById('themeToggle');
        const themeText = document.getElementById('themeText');
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');
        const body = document.body;
        
        let isGridView = true;
        
        // Load theme from local storage or default to dark
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'light-mode') {
            body.classList.add('light-mode');
            themeToggle.checked = true;
            themeText.textContent = 'Light Mode';
        }

        viewToggle.addEventListener('click', () => {
          if (isGridView) {
            gridView.classList.add('hidden');
            listView.classList.remove('hidden');
            viewToggle.textContent = 'Switch to Grid View';
          } else {
            gridView.classList.add('hidden');
            listView.classList.remove('hidden');
            viewToggle.textContent = 'Switch to List View';
          }
          isGridView = !isGridView;
        });

        // Function to update logo colors
        function updateLogoColors(color) {
            const logoImages = document.querySelectorAll('.file-icon img');
            logoImages.forEach(img => {
                const parts = img.src.split('/');
                parts.pop(); // Remove the current color
                parts.push(color); // Add the new color
                img.src = parts.join('/');
            });
        }

        // Set initial logo color on page load
        window.addEventListener('DOMContentLoaded', () => {
            const initialColor = body.classList.contains('light-mode') ? 'black' : 'white';
            updateLogoColors(initialColor);
        });

        themeToggle.addEventListener('change', (event) => {
          const color = event.target.checked ? 'black' : 'white';
          updateLogoColors(color);
          
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
      </script>
    </body>
    </html>
  `;
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
};

console.log("Server running on http://localhost:8000");
serve(handler);
