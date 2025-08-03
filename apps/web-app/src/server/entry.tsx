import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import { AuthProvider } from '../context/AuthContext';
import { AppContent } from '../app/app';

function SSRApp({ url }: { url: string }) {
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
  return renderToString(<SSRApp url={url} />);
}
