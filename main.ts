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
    // Return empty array or handle error as appropriate
  }
  return htmlFiles;
}

// HTTP handler
const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  // Serve the requested HTML file if the path matches a file
  if (url.pathname !== "/") {
    try {
      const filePath = decodeURIComponent(url.pathname.slice(1));
      // Basic security check: prevent directory traversal
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

  // List all .html files in the directory
  const htmlFiles = await listHtmlFiles();
  const links = htmlFiles
    .map(
      (file) =>
        `<li><a href="/${encodeURIComponent(file)}" target="_blank">${file}</a></li>`,
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
          background-color: #f4f4f4;
          color: #333;
        }
        .container {
          max-width: 800px;
          margin: 40px auto;
          background: #fff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #0056b3;
          text-align: center;
          margin-bottom: 30px;
        }
        ul {
          list-style: none;
          padding: 0;
        }
        li {
          background: #e9e9e9;
          margin-bottom: 10px;
          padding: 12px 15px;
          border-radius: 5px;
          transition: background-color 0.3s ease;
        }
        li:hover {
          background-color: #dcdcdc;
        }
        a {
          text-decoration: none;
          color: #007bff;
          font-weight: bold;
          display: block; /* Make the whole list item clickable via the link */
        }
        a:hover {
          text-decoration: underline;
          color: #0056b3;
        }
        /* Optional: Add a subtle border to list items */
        li {
          border-left: 5px solid #007bff;
        }
         li:hover {
          border-left-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Available HTML Files</h1>
        <ul>
          ${links.length > 0 ? links : '<li>No HTML files found in the current directory.</li>'}
        </ul>
      </div>
    </body>
    </html>
  `;
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
};

console.log("Server running on http://localhost:8000");
// Start the server
serve(handler);
