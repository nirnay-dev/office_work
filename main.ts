import { serve } from "https://deno.land/std@0.187.0/http/server.ts";

// Helper function to list all .html files in the current directory
async function listHtmlFiles(): Promise<string[]> {
  const htmlFiles: string[] = [];
  for await (const entry of Deno.readDir(".")) {
    if (entry.isFile && entry.name.endsWith(".html")) {
      htmlFiles.push(entry.name);
    }
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
      const file = await Deno.readFile(filePath);
      const headers = new Headers();
      headers.set("Content-Type", "text/html");
      return new Response(file, { headers });
    } catch {
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
    <html>
    <head>
      <title>HTML File List</title>
    </head>
    <body>
      <h1>Available HTML Files</h1>
      <ul>
        ${links}
      </ul>
    </body>
    </html>
  `;
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
};

// Start the server
serve(handler);
