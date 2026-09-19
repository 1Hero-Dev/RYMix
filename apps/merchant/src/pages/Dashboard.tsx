import React from 'react';

export default function Dashboard() {
  return (
    <div className="p-4">
      <h1 className="font-bold text-xl mb-4">Commandes en Cours</h1>
      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <p className="text-sm text-zinc-500">Active orders waiting for preparation will appear here.</p>
      </div>
    </div>
  );
}