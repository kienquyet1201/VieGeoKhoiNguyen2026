"use client";

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type Difficulty = 'easy' | 'medium' | 'hard';
type Session = { email: string; name?: string };

const difficultyOptions: Array<{ value: Difficulty; label: string; description: string; accent: string }> = [
  { value: 'easy', label: 'Dễ', description: 'Khởi động với kiến thức địa lí nền tảng.', accent: '#22c55e' },
  { value: 'medium', label: 'Trung bình', description: 'Mở rộng tư duy vùng miền và biểu đồ.', accent: '#eab308' },
  { value: 'hard', label: 'Khó', description: 'Thử thách khả năng phân tích và vận dụng.', accent: '#ef4444' },
];

export default function LevelSelection() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [savingDifficulty, setSavingDifficulty] = useState<Difficulty | null>(null);

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
        const savedDifficulty = userSnapshot.exists() ? userSnapshot.data().selectedDifficulty : null;
        if (savedDifficulty && !cancelled) {
          router.replace('/map');
          return;
        }
        if (!cancelled) setIsOpen(true);
      } catch (error) {
        console.error('Không thể đọc mức độ học tập:', error);
        if (!cancelled) setIsOpen(true);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    initialiseProfile();
    return () => { cancelled = true; };
  }, [router]);

  const saveDifficulty = useCallback(async (difficulty: Difficulty) => {
    if (!session?.email || savingDifficulty) return;

    setSavingDifficulty(difficulty);
    try {
      await setDoc(doc(db, 'users', session.email), {
        email: session.email,
        name: session.name || '',
        grade: null,
        selectedGrade: null,
        selectedDifficulty: difficulty,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      try {
        const rawState = window.localStorage.getItem('VieGeo_state');
        const currentState = rawState ? JSON.parse(rawState) : {};
        const { selectedGrade: _legacyGrade, ...stateWithoutLegacyGrade } = currentState;
        window.localStorage.setItem('VieGeo_state', JSON.stringify({ ...stateWithoutLegacyGrade, selectedDifficulty: difficulty }));
      } catch (error) {
        console.warn('Không thể đồng bộ mức độ vào bộ nhớ thiết bị:', error);
      }

      await Swal.fire({
        title: 'Đã chọn lộ trình',
        text: `VieGeo đã sẵn sàng lộ trình mức ${difficultyOptions.find((option) => option.value === difficulty)?.label || 'Dễ'}.`,
        icon: 'success',
        timer: 1300,
        showConfirmButton: false,
      });
      router.replace('/map');
    } catch (error) {
      console.error('Không thể lưu mức độ học tập:', error);
      await Swal.fire({
        title: 'Chưa thể lưu mức độ',
        text: 'Vui lòng kiểm tra kết nối rồi thử lại.',
        icon: 'error',
        confirmButtonText: 'Đã hiểu',
      });
    } finally {
      setSavingDifficulty(null);
    }
  }, [router, savingDifficulty, session]);

  if (!isReady) return <div className="level-loading">Đang chuẩn bị hồ sơ học tập…</div>;
  if (!isOpen) return null;

  return (
    <div className="level-overlay" role="dialog" aria-modal="true" aria-labelledby="difficulty-title">
      <section className="level-dialog">
        <span className="level-icon" aria-hidden="true">🎓</span>
        <p className="level-eyebrow">Cá nhân hoá lộ trình</p>
        <h2 id="difficulty-title">Bạn muốn học ở mức nào?</h2>
        <p>Bạn có thể chọn Dễ, Trung bình hoặc Khó bất cứ lúc nào trên thanh điều hướng.</p>
        <div className="difficulty-option-list">
          {difficultyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="difficulty-option"
              onClick={() => saveDifficulty(option.value)}
              disabled={savingDifficulty !== null}
              style={{ '--difficulty-accent': option.accent } as CSSProperties}
            >
              <strong>{savingDifficulty === option.value ? 'Đang lưu…' : option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
