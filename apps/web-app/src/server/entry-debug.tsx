import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import { AuthProvider } from '../context/AuthContext';
import { AppContent } from '../app/app';

function SSRApp({ url }: { readonly url: string }) {
  return (
    <React.StrictMode>
      <StaticRouter location={url}>
        <AuthProvider isSSR={true}>
          <AppContent />
        </AuthProvider>
      </StaticRouter>
    </React.StrictMode>
  );
}

export function render(url: string) {
  console.log('SSR: Rendering URL:', url);
  const html = renderToString(<SSRApp url={url} />);
  console.log('SSR: Rendered HTML preview:', html.substring(0, 200) + '...');
  return html;
}
