import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MapTasks from './pages/MapTasks';
import OrderPool from './pages/OrderPool';
import Earnings from './pages/Earnings';
import Profile from './pages/Profile';
import { BottomNavBar } from './components/BottomNavBar';

export default function App() {
  return (
    <BrowserRouter>
      <div className="w-full h-[100dvh] bg-[#F6F7F9] font-sans text-[#1C1B1B] overflow-hidden flex flex-col relative sm:max-w-md sm:mx-auto sm:border-x sm:border-zinc-200">

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-[64px]">
          <Routes>
            <Route path="/" element={<MapTasks />} />
            <Route path="/pool" element={<OrderPool />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Global Courier Bottom Navbar */}
        <BottomNavBar />

      </div>
    </BrowserRouter>
  );
}
