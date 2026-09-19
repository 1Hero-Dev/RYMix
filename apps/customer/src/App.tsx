import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Category from './pages/Category';
import Orders from './pages/Orders';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import { BottomNavBar } from './components/BottomNavBar';

export default function App() {
  return (
    <BrowserRouter>
      <div className="w-full h-[100dvh] bg-[#F6F7F9] font-sans text-[#1C1B1B] overflow-hidden flex flex-col relative sm:max-w-md sm:mx-auto sm:border-x sm:border-zinc-200">

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-[64px]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:id" element={<Category />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Global Meituan-style Bottom Navbar */}
        <BottomNavBar />

      </div>
    </BrowserRouter>
  );
}
