"use client";

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type Grade = 5 | 9 | 12;
type Session = { email: string; name?: string };

const gradeOptions: Array<{ value: Grade; label: string; description: string; accent: string }> = [
  { value: 5, label: 'Khối 5', description: 'Khởi đầu bằng kiến thức địa lí nền tảng.', accent: '#22c55e' },
  { value: 9, label: 'Khối 9', description: 'Củng cố tư duy vùng miền và biểu đồ.', accent: '#eab308' },
  { value: 12, label: 'Khối 12', description: 'Luyện thi THPT với nội dung chuyên sâu.', accent: '#ef4444' },
];

export default function LevelSelection() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [savingGrade, setSavingGrade] = useState<Grade | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initialiseProfile() {
      const rawSession = window.localStorage.getItem('lm_session');
      if (!rawSession) {
        router.replace('/loginout');
        return;
      }

      try {
        const parsed = JSON.parse(rawSession) as Session;
        if (!parsed.email) throw new Error('Phiên đăng nhập không có email.');
        if (!cancelled) setSession(parsed);

        const userSnapshot = await getDoc(doc(db, 'users', parsed.email));
        const savedGrade = userSnapshot.exists() ? userSnapshot.data().grade : null;
        if (savedGrade && !cancelled) {
          router.replace('/map');
          return;
        }
        if (!cancelled) setIsOpen(true);
      } catch (error) {
        console.error('Không thể đọc hồ sơ khối lớp:', error);
        if (!cancelled) setIsOpen(true);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    initialiseProfile();
    return () => { cancelled = true; };
  }, [router]);

  const saveGrade = useCallback(async (grade: Grade) => {
    if (!session?.email || savingGrade) return;

    setSavingGrade(grade);
    try {
      await setDoc(doc(db, 'users', session.email), {
        email: session.email,
        name: session.name || '',
        grade,
        selectedGrade: String(grade),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      try {
        const rawState = window.localStorage.getItem('VieGeo_state');
        const currentState = rawState ? JSON.parse(rawState) : {};
        window.localStorage.setItem('VieGeo_state', JSON.stringify({ ...currentState, selectedGrade: String(grade) }));
      } catch (error) {
        console.warn('Không thể đồng bộ khối lớp vào bộ nhớ thiết bị:', error);
      }

      await Swal.fire({
        title: 'Đã chọn lộ trình',
        text: `VieGeo đã sẵn sàng lộ trình cho khối ${grade}.`,
        icon: 'success',
        timer: 1300,
        showConfirmButton: false,
      });
      router.replace('/map');
    } catch (error) {
      console.error('Không thể lưu khối lớp:', error);
      await Swal.fire({
        title: 'Chưa thể lưu khối lớp',
        text: 'Vui lòng kiểm tra kết nối rồi thử lại.',
        icon: 'error',
        confirmButtonText: 'Đã hiểu',
      });
    } finally {
      setSavingGrade(null);
    }
  }, [router, savingGrade, session]);

  if (!isReady) return <div className="level-loading">Đang chuẩn bị hồ sơ học tập…</div>;
  if (!isOpen) return null;

  return (
    <div className="level-overlay" role="dialog" aria-modal="true" aria-labelledby="grade-title">
      <section className="level-dialog">
        <span className="level-icon" aria-hidden="true">🎓</span>
        <p className="level-eyebrow">Cá nhân hoá lộ trình</p>
        <h2 id="grade-title">Bạn đang học khối nào?</h2>
        <p>Khối lớp giúp VieGeo chọn đúng độ khó câu hỏi, đảo tổng ôn và phần thưởng phù hợp.</p>
        <div className="grade-option-list">
          {gradeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="grade-option"
              onClick={() => saveGrade(option.value)}
              disabled={savingGrade !== null}
              style={{ '--grade-accent': option.accent } as CSSProperties}
            >
              <strong>{savingGrade === option.value ? 'Đang lưu…' : option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
