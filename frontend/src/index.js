// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Remove the old service worker if present (legacy CRA default)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
