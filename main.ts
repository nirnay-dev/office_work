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

// Map of specific filenames to logo URLs and alt text
const logoMap = new Map<string, { src: string; alt: string }>([
  ['index.html', { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/HTML5_logo_and_wordmark.svg/100px-HTML5_logo_and_wordmark.svg.png', alt: 'Index HTML Icon' }],
  ['main.ts', { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Typescript_logo_2020.svg/100px-Typescript_logo_2020.svg.png', alt: 'Main TypeScript Icon' }],
  ['style.css', { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/CSS3_logo.svg/100px-CSS3_logo.svg.png', alt: 'Style CSS Icon' }],
  ['script.js', { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/JavaScript-logo.png/100px-JavaScript-logo.png', alt: 'JavaScript Icon' }],
  ['deno.json', { src: 'https://deno.land/logo.svg', alt: 'Deno Icon' }],
  ['readme.md', { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Markdown-mark.svg/100px-Markdown-mark.svg.png', alt: 'README Markdown Icon' }],
  ['package.json', { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/JSON_logo.svg/100px-JSON_logo.svg.png', alt: 'package.json Icon' }],
  // Fallback for any other HTML files
  ['default.html', { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/HTML5_logo_and_wordmark.svg/100px-HTML5_logo_and_wordmark.svg.png', alt: 'HTML Icon' }],
  // Default for any other file
  ['default', { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Text-x-generic-template.svg/100px-Text-x-generic-template.svg.png', alt: 'Generic File Icon' }]
]);

// Function to get the correct logo based on the full filename
function getFileLogo(filename: string): { src: string; alt: string } {
  // Check for an exact filename match first
  if (logoMap.has(filename.toLowerCase())) {
    return logoMap.get(filename.toLowerCase())!;
  }
  
  // As a fallback, check for common file extensions.
  const extensionMatch = filename.match(/\.([0-9a-z]+)(?=[?#])?$/i) || filename.match(/\.([0-9a-z]+)$/i);
  const extension = extensionMatch ? `default.${extensionMatch[1].toLowerCase()}` : 'default';

  return logoMap.get(extension) || logoMap.get('default')!;
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
        const logo = getFileLogo(file);
        return `
          <div class="grid-item">
            <a href="/${encodeURIComponent(file)}" target="_blank">
              <div class="file-icon">
                <img src="${logo.src}" alt="${logo.alt}" class="html-icon">
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
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: #f0f2f5;
          color: #333;
        }
        .container {
          max-width: 1200px;
          margin: 40px auto;
        }
        h1 {
          color: #1a237e;
          text-align: center;
          margin-bottom: 20px;
        }
        .view-controls {
          text-align: right;
          margin-bottom: 20px;
        }
        .view-toggle {
          padding: 8px 15px;
          border: none;
          background-color: #4CAF50;
          color: white;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        }
        .view-toggle:hover {
          background-color: #45a049;
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
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          overflow: hidden;
        }
        .grid-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        .grid-item a {
          text-decoration: none;
          color: #333;
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
        /* List View Styling (for the toggle) */
        .list-container {
          list-style: none;
          padding: 0;
        }
        .list-item {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 10px;
          transition: background-color 0.3s ease;
        }
        .list-item:hover {
          background-color: #f9f9f9;
        }
        .list-item a {
          text-decoration: none;
          color: #007bff;
          font-weight: bold;
          display: block;
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
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');
        let isGridView = true;

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
