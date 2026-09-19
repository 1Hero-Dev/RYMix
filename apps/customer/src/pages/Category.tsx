import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Category() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg capitalize">{id?.replace('-', ' ')}</h1>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
        <p className="text-sm text-zinc-500">Filtered results for {id} will appear here.</p>
      </div>
    </div>
  );
}