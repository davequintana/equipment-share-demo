import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const __dirname = path.resolve();
const isProduction = process.env['NODE_ENV'] === 'production';
const port = process.env['PORT'] || 4201;

async function createServer() {
  const app = express();

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: path.resolve(__dirname, '../..'),
  });

  if (isProduction) {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, '../client')));
  } else {
    // Use Vite's dev middleware
    app.use(vite.middlewares);
  }

  // SSR route handler
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      let template: string;
      let render: any;

      if (isProduction) {
        // Load pre-built template and render function in production
        template = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8" />
              <title>SSR React App</title>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link rel="icon" type="image/x-icon" href="/favicon.ico" />
            </head>
            <body>
              <div id="root"><!--ssr-outlet--></div>
              <script type="module" src="/client.js"></script>
            </body>
          </html>
        `;
        render = (await import('./entry.js')).render;
      } else {
        // Load template from file system in development
        template = await vite.transformIndexHtml(url, `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8" />
              <title>SSR React App - Enterprise NX Monorepo</title>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link rel="icon" type="image/x-icon" href="/favicon.ico" />
              <meta name="description" content="Server-side rendered React application with modern technologies" />
            </head>
            <body>
              <div id="root"><!--ssr-outlet--></div>
              <script type="module" src="/src/client/main.tsx"></script>
            </body>
          </html>
        `);

        // Load the server-side render function
        render = (await vite.ssrLoadModule('/src/server/entry.tsx')).render;
      }

      // Render the app HTML
      const appHtml = await render(url);

      // Replace the placeholder with the rendered app HTML
      const html = template.replace('<!--ssr-outlet-->', appHtml);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
      if (!isProduction) {
        vite.ssrFixStacktrace(error as Error);
      }
      console.error('SSR Error:', error);
      res.status(500).end('Internal Server Error');
    }
  });

  return { app, vite };
}

createServer().then(({ app }) => {
  app.listen(port, () => {
    console.log(`🚀 SSR React app ready at http://localhost:${port}`);
  });
});
