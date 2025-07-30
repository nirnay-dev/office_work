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
        /* Dark Mode - Default Styles */
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: #1a1a1a;
          color: #4CAF50; /* Green color for default text */
          transition: background-color 0.3s, color 0.3s;
        }
        .container {
          max-width: 1200px;
          margin: 40px auto;
        }
        h1 {
          color: #007bff; /* Blue for heading */
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
          background-color: #007bff; /* Blue button */
          color: white;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        .view-toggle:hover {
          background-color: #0056b3; /* Darker blue on hover */
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
          background-color: #007bff; /* Blue for the switch track */
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
          background-color: #4CAF50; /* Green when checked */
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
          color: #4CAF50; /* Green for links in dark mode */
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

        /* Light Mode - Optional Styles */
        body.light-mode {
          background-color: #f0f2f5;
          color: #007bff; /* Blue for default text */
        }
        body.light-mode h1 {
          color: #4CAF50; /* Green for heading */
        }
        body.light-mode .view-toggle {
          background-color: #4CAF50; /* Green button */
          color: white;
        }
        body.light-mode .view-toggle:hover {
          background-color: #45a049; /* Darker green on hover */
        }
        body.light-mode .grid-item, body.light-mode .list-item {
          background: #fff;
          border: 1px solid #ddd;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        body.light-mode .grid-item:hover, body.light-mode .list-item:hover {
          background-color: #f9f9f9;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        body.light-mode .grid-item a, body.light-mode .list-item a {
          color: #007bff; /* Blue for links in light mode */
        }
        
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
