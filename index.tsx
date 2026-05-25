
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Maintenance from './components/Maintenance';

// Toggle this to true to take the site offline behind a maintenance page.
// Set back to false and redeploy to restore normal access.
const MAINTENANCE_MODE = true;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {MAINTENANCE_MODE ? <Maintenance /> : <App />}
  </React.StrictMode>
);
