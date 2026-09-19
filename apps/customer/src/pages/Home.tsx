import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const categories = [
    { id: 'fastfood', name: 'Fast Food', icon: '🍔' },
    { id: 'cafe', name: 'Café & Tea', icon: '☕' },
    { id: 'grocery', name: 'Marché', icon: '🛒' },
    { id: 'healthy', name: 'Healthy', icon: '🥗' },
  ];

  return (
    <div className="p-4 space-y-4">
      <header className="flex justify-between items-center mb-6">
        <div>
          <p className="text-xs text-zinc-500">Livrer à</p>
          <h1 className="font-bold">Maison - Alger Centre</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-zinc-200"></div>
      </header>

      <div className="grid grid-cols-4 gap-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigate(`/category/${cat.id}`)}
            className="flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl hover:scale-105 transition-transform">
              {cat.icon}
            </div>
            <span className="text-[10px] font-medium">{cat.name}</span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-bold text-lg mb-2">Populaire autour de vous</h2>
        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <p className="text-sm text-zinc-500">Restaurant list will go here...</p>
        </div>
      </div>
    </div>
  );
}