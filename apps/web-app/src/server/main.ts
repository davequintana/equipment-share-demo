import fastify from 'fastify';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const isProduction = process.env['NODE_ENV'] === 'production';
const port = parseInt(process.env['PORT'] || '4201', 10);

async function createServer() {
  console.log('Creating SSR server...');
  const app = fastify({ logger: true });
  let vite: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

  if (isProduction) {
    // For production, skip Vite and static file serving for now
    console.log('Running in production mode - simplified SSR');
  } else {
    // Create Vite server in middleware mode for development
    const webAppRoot = path.resolve(process.cwd(), 'apps/web-app');
    
    console.log('Development mode - Creating Vite server');
    console.log('WebAppRoot for Vite:', webAppRoot);
    
    if (!fs.existsSync(webAppRoot)) {
      console.error('Web app directory not found for Vite server creation');
      throw new Error(`Web app directory not found: ${webAppRoot}`);
    }
    
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
      root: webAppRoot,
    });

    // API Proxy for development
    app.all('/api/*', async (request, reply) => {
      const apiUrl = `http://localhost:3334${request.url}`;
      try {
        // Convert request headers to a proper format
        const requestHeaders: Record<string, string> = {};
        Object.entries(request.headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            requestHeaders[key] = value;
          } else if (Array.isArray(value)) {
            requestHeaders[key] = value[0];
          }
        });

        const response = await fetch(apiUrl, {
          method: request.method,
          headers: requestHeaders,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? JSON.stringify(request.body) : undefined,
        });

        const data = await response.text();
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        reply
          .code(response.status)
          .headers(headers)
          .send(data);
      } catch (error) {
        reply.code(500).send({ error: 'Proxy error', details: error });
      }
    });

    // Register Vite middleware for development
    app.addHook('onRequest', async (request, reply) => {
      // Let Vite handle its dev server routes
      if (request.url.startsWith('/@') || request.url.startsWith('/src/') || request.url.match(/\.(js|css|ts|tsx)$/)) {
        const viteHandler = vite.middlewares;
        await new Promise<void>((resolve, reject) => {
          viteHandler(request.raw, reply.raw, (err: Error | null) => {
            if (err) reject(err);
            else resolve();
          });
        });
        return; // Don't continue to other routes
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
          viteHandler(request.raw, reply.raw, (err: Error | null) => {
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
      let render: (url: string) => string;

      if (isProduction) {
        // In production, use a simple static template
        template = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8" />
              <title>SSR React App - Enterprise NX Monorepo</title>
              <base href="/" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link rel="icon" type="image/x-icon" href="/favicon.ico" />
              <meta name="description" content="Server-side rendered React application with modern technologies" />
            </head>
            <body>
              <div id="root"><!--ssr-outlet--></div>
              <script type="module" src="/client.js"></script>
            </body>
          </html>
        `;
        // For now, render static content in production
        render = () => `
          <div>
            <h1>Welcome to Enterprise NX Monorepo</h1>
            <p>A comprehensive full-stack application with modern technologies</p>
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
              <button>Login</button>
              <button>Create Account</button>
            </div>
          </div>
        `;
      } else {
        // Load template from index.html file in development
        const webAppRoot = path.resolve(process.cwd(), 'apps/web-app');
        
        // Debug logging for CI troubleshooting
        console.log('Debug - Current working directory:', process.cwd());
        console.log('Debug - Resolved webAppRoot:', webAppRoot);
        console.log('Debug - webAppRoot exists:', fs.existsSync(webAppRoot));
        
        let actualWebAppRoot = webAppRoot;
        
        if (!fs.existsSync(webAppRoot)) {
          console.error('Web app directory not found, trying alternative paths...');
          // List current directory contents for debugging
          const cwd = process.cwd();
          console.log('Directory contents of cwd:', fs.readdirSync(cwd));
          
          // Try alternative path resolution strategies
          const alternatives = [
            path.resolve(cwd, 'apps', 'web-app'),
            path.join(cwd, 'apps', 'web-app'),
            path.resolve(__dirname, '..', '..', '..', 'apps', 'web-app'),
          ];
          
          let foundPath = null;
          for (const altPath of alternatives) {
            if (fs.existsSync(altPath)) {
              console.log('Found alternative path:', altPath);
              foundPath = altPath;
              break;
            }
          }
          
          if (!foundPath) {
            throw new Error(`Could not locate web-app directory. Tried: ${[webAppRoot, ...alternatives].join(', ')}`);
          }
          
          actualWebAppRoot = foundPath;
        }
        
        const indexPath = path.join(actualWebAppRoot, 'index.html');
        console.log('Debug - Index.html path:', indexPath);
        console.log('Debug - Index.html exists:', fs.existsSync(indexPath));
        
        if (!fs.existsSync(indexPath)) {
          throw new Error(`index.html not found at: ${indexPath}`);
        }
        
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
