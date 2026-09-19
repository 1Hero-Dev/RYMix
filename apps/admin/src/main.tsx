import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold">Admin App Placeholder</h1>
    <p>This is a placeholder for the admin application.</p>
  </div>
);

createRoot(document.getElementById('root')!).render(<App />);