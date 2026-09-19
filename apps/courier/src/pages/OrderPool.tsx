import React from 'react';

export default function OrderPool() {
  return (
    <div className="p-4">
      <h1 className="font-bold text-xl mb-4">Commandes Disponibles</h1>
      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <p className="text-sm text-zinc-500">List of orders ready to be grabbed by courier.</p>
      </div>
    </div>
  );
}