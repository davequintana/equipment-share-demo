import fastify from 'fastify';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const __dirname = path.resolve();
const isProduction = process.env['NODE_ENV'] === 'production';
const port = parseInt(process.env['PORT'] || '4201', 10);

async function createServer() {
  console.log('Creating SSR server...');
  const app = fastify({ logger: true });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: path.join(process.cwd(), 'apps', 'web-app'),
  });

  // For production, register static file serving
  if (isProduction) {
    await app.register(import('@fastify/static'), {
      root: path.resolve(__dirname, '../client'),
      prefix: '/',
    });
  }

  // API Proxy for development
  if (!isProduction) {
    app.all('/api/*', async (request, reply) => {
      const apiUrl = `http://localhost:3333${request.url}`;
      try {
        const response = await fetch(apiUrl, {
          method: request.method,
          headers: request.headers as any,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? JSON.stringify(request.body) : undefined,
        });

        const data = await response.text();
        reply
          .code(response.status)
          .headers(Object.fromEntries(response.headers.entries()))
          .send(data);
      } catch (error) {
        reply.code(500).send({ error: 'Proxy error', details: error });
      }
    });
  }

  // Health check route
  app.get('/health', async (request, reply) => {
    return { status: 'ok', service: 'web-app' };
  });

  // Register Vite middleware for development
  if (!isProduction) {
    app.addHook('onRequest', async (request, reply) => {
      // Let Vite handle its dev server routes
      if (request.url.startsWith('/@') || request.url.startsWith('/src/') || request.url.match(/\.(js|css|ts|tsx)$/)) {
        const viteHandler = vite.middlewares;
        await new Promise<void>((resolve, reject) => {
          viteHandler(request.raw, reply.raw, (err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
        return; // Don't continue to other routes
      }
    });
  }

  // SSR route handler for all routes (except health and assets)
  app.get('/*', async (request, reply) => {
    const url = request.url;

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
        // Load template from index.html file in development
        const indexPath = path.join(process.cwd(), 'apps', 'web-app', 'index.html');
        const templateFile = await fs.promises.readFile(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, templateFile);

        // Load the server-side render function
        render = (await vite.ssrLoadModule('/src/server/entry.tsx')).render;
      }

      // Render the app HTML
      const appHtml = await render(url);

      // Replace the placeholder with the rendered app HTML
      const html = template.replace('<!--ssr-outlet-->', appHtml);

      reply.type('text/html').code(200).send(html);
    } catch (error) {
      if (!isProduction) {
        vite.ssrFixStacktrace(error as Error);
      }
      console.error('SSR Error:', error);
      reply.code(500).send('Internal Server Error');
    }
  });

  return { app, vite };
}

createServer().then(({ app }) => {
  console.log('Starting SSR server...');
  app.listen({ port, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error('Failed to start SSR server:', err);
      process.exit(1);
    }
    console.log(`🚀 SSR React app ready at ${address}`);
  });
}).catch((error) => {
  console.error('Failed to create server:', error);
  process.exit(1);
});
