import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '../app/app';

const root = document.getElementById('root');

// Get the base path from the HTML base tag or default to root
const getBasename = () => {
  const baseElement = document.querySelector('base');
  if (baseElement && baseElement.href) {
    const url = new URL(baseElement.href);
    return url.pathname;
  }
  return '/';
};

// Check if there's a stored route from GitHub Pages 404 redirect
const handleStoredRoute = () => {
  const storedRoute = sessionStorage.getItem('github-pages-route');
  if (storedRoute) {
    sessionStorage.removeItem('github-pages-route');
    // Use history.replaceState to navigate without triggering a page reload
    window.history.replaceState(null, '', getBasename() + storedRoute.substring(1));
  }
};

if (root) {
  // Handle any stored route before rendering
  handleStoredRoute();

  hydrateRoot(
    root,
    <React.StrictMode>
      <BrowserRouter basename={getBasename()}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
