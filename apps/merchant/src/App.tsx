import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import { BottomNavBar } from './components/BottomNavBar';

export default function App() {
  return (
    <BrowserRouter>
      <div className="w-full h-[100dvh] bg-[#F6F7F9] font-sans text-[#1C1B1B] overflow-hidden flex flex-col relative sm:max-w-md sm:mx-auto sm:border-x sm:border-zinc-200">

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-[64px]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Global Merchant Bottom Navbar */}
        <BottomNavBar />

      </div>
    </BrowserRouter>
  );
}
