"use client"; // BẮT BUỘC: Đánh dấu đây là Client Component

import React, { useState } from 'react';
import Swal from 'sweetalert2';

export default function LevelSelection() {
  // BẮT BUỘC: Quản lý trạng thái hiển thị bằng React State, KHÔNG dùng DOM manipulation
  const [isOpen, setIsOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hàm xử lý đóng Modal chọn cấp học
  const closeLevelSelection = () => {
    setIsOpen(false);
  };

  // Hàm xử lý chọn lớp
  const handleSelectGrade = (grade: number) => {
    console.log(`Đã chọn lớp ${grade}`);
    // Logic lưu cấp học vào context/localStorage ở đây
    closeLevelSelection();
  };

  // Nếu isOpen = false, component sẽ không render phần UI này
  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
      <div className="bg-white/5 p-10 rounded-3xl border border-white/10 shadow-2xl text-center max-w-lg w-[90%]">
        <div className="text-5xl text-blue-500 mb-5">🎓</div>
        <h2 className="text-3xl font-bold mb-3 text-white">Chào mừng đến với VieGeo!</h2>
        <p className="text-white/70 mb-6">Hãy cho chúng tôi biết bạn đang học lớp mấy để xây dựng lộ trình phù hợp nhất nhé.</p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => handleSelectGrade(5)}
            className="px-6 py-3 text-xl font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 transition"
          >
            Khối Lớp 5
          </button>
          <button 
            onClick={() => handleSelectGrade(9)}
            className="px-6 py-3 text-xl font-bold text-white bg-yellow-500 rounded-xl hover:bg-yellow-600 transition"
          >
            Khối Lớp 9
          </button>
          <button 
            onClick={() => handleSelectGrade(12)}
            className="px-6 py-3 text-xl font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition"
          >
            Khối Lớp 12
          </button>
        </div>
      </div>
    </div>
  );
}
