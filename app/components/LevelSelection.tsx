"use client";

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function LevelSelection() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [session, setSession] = useState<{email: string, name: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    
    // Đọc session từ localStorage theo cơ chế cũ của app
    const sessionStr = localStorage.getItem('lm_session');
    
    if (sessionStr) {
      try {
        const parsedSession = JSON.parse(sessionStr);
        setSession(parsedSession);
        
        // Lấy thông tin user từ Firestore
        const fetchUserData = async () => {
          try {
            const userDocRef = doc(db, 'users', parsedSession.email);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Nếu chưa có grade, mở form chọn lớp
              if (!userData.grade) {
                setIsOpen(true);
              } else {
                // Đã có grade -> redirect vào map
                window.location.href = '/map.html';
              }
            } else {
               setIsOpen(true);
            }
          } catch (error) {
            console.error("Lỗi khi fetch user data:", error);
            setIsOpen(true);
          } finally {
            setLoading(false);
          }
        };
        fetchUserData();
      } catch (e) {
        setLoading(false);
        window.location.href = '/loginout.html';
      }
    } else {
      // Chưa đăng nhập
      window.location.href = '/loginout.html';
    }
  }, []);

  const loadGradeData = async (grade: number) => {
    if (!session || !session.email) return;
    
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', session.email);
      await updateDoc(userDocRef, { grade: grade });
      
      Swal.fire({
        title: 'Thành công!',
        text: `Đã cập nhật khối lớp ${grade}! Bắt đầu hành trình thôi!`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.location.href = '/map.html';
      });
    } catch (error) {
      console.error("Lỗi khi lưu khối lớp:", error);
      Swal.fire('Lỗi', 'Không thể lưu khối lớp. Vui lòng thử lại!', 'error');
      setLoading(false);
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
        <div className="text-white text-2xl animate-pulse">Đang kiểm tra thông tin...</div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
      <div className="bg-white/5 p-10 rounded-3xl border border-white/10 shadow-2xl text-center max-w-lg w-[90%]">
        <div className="text-5xl text-blue-500 mb-5">🎓</div>
        <h2 className="text-3xl font-bold mb-3 text-white">Chào mừng đến với VieGeo!</h2>
        <p className="text-white/70 mb-6">Hãy cho chúng tôi biết bạn đang học lớp mấy để xây dựng lộ trình phù hợp nhất nhé.</p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => loadGradeData(5)}
            className="px-6 py-3 text-xl font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 transition"
          >
            Khối Lớp 5
          </button>
          <button 
            onClick={() => loadGradeData(9)}
            className="px-6 py-3 text-xl font-bold text-white bg-yellow-500 rounded-xl hover:bg-yellow-600 transition"
          >
            Khối Lớp 9
          </button>
          <button 
            onClick={() => loadGradeData(12)}
            className="px-6 py-3 text-xl font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition"
          >
            Khối Lớp 12
          </button>
        </div>
      </div>
    </div>
  );
}
