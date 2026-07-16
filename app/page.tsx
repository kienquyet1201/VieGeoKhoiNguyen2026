"use client";

import React, { useEffect } from 'react';
import LevelSelection from './components/LevelSelection';

export default function HomePage() {
  
  useEffect(() => {
    // Các logic khởi chạy phía Client 
    if (typeof window !== 'undefined') {
      // Đảm bảo mã an toàn với SSR
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-900 text-white relative">
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold text-blue-500">VieGeo - Nền tảng học Địa lí ứng dụng AI</h1>
        <p className="mt-4 text-slate-400">Khám phá dải đất hình chữ S theo phong cách Gamification</p>
      </div>

      <LevelSelection />
    </main>
  );
}
