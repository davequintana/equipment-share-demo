import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import { App } from '../app/app';

function SSRApp({ url }: { readonly url: string }) {
  return (
    <React.StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </React.StrictMode>
  );
}

export function render(url: string) {
  return renderToString(<SSRApp url={url} />);
}
