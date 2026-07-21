"use client";

import LevelSelection from './components/LevelSelection';

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <p className="landing-kicker">VIEGEO · EDTECH VIỆT NAM</p>
        <h1>Khám phá Việt Nam,<br /><span>học địa lí bằng hành trình.</span></h1>
        <p className="landing-copy">Hành trình khám phá 63 tỉnh thành Việt Nam với 6300 hòn đảo tri thức. Từ câu hỏi cơ bản đến thử thách tư duy, phần thưởng hấp dẫn đang chờ đón bạn.</p>
        <div className="landing-stats" aria-label="Quy mô nền tảng">
          <div><strong>63</strong><span>Tỉnh thành</span></div>
          <div><strong>6.300</strong><span>Đảo tri thức</span></div>
          <div><strong>3</strong><span>Mức độ học</span></div>
        </div>
        <a className="landing-cta" href="/loginout">Bắt đầu hành trình <span aria-hidden="true">→</span></a>
      </section>
      <LevelSelection />
      <style jsx>{`
        .landing-page { min-height: 100vh; display: grid; place-items: center; overflow: hidden; color: #edf6ff; background: radial-gradient(circle at 15% 15%, rgba(28,176,246,.22), transparent 30rem), radial-gradient(circle at 88% 82%, rgba(88,204,2,.16), transparent 28rem), #091526; font-family: 'Be Vietnam Pro', sans-serif; }
        .landing-hero { position: relative; width: min(920px, calc(100% - 40px)); padding: clamp(42px, 8vw, 100px) 0; text-align: center; }
        .landing-kicker { margin: 0 0 18px; color: #60d5ff; font-weight: 800; font-size: .82rem; letter-spacing: .16em; }
        h1 { margin: 0; font-size: clamp(2.5rem, 7vw, 5.5rem); line-height: 1.06; letter-spacing: -.055em; } h1 span { color: #6ce0ff; }
        .landing-copy { max-width: 690px; margin: 28px auto; color: #afc2d9; font-size: clamp(1rem, 2vw, 1.18rem); line-height: 1.75; }
        .landing-stats { display: flex; justify-content: center; gap: clamp(16px, 7vw, 70px); margin: 38px 0; } .landing-stats div { display: grid; gap: 4px; } .landing-stats strong { color: #fff; font-size: clamp(1.5rem, 4vw, 2.35rem); } .landing-stats span { color: #8ea5bf; font-size: .85rem; }
        .landing-cta { display: inline-flex; align-items: center; gap: 12px; padding: 15px 22px; border-radius: 14px; background: linear-gradient(135deg, #1cb0f6, #2563eb); color: #fff; font-weight: 800; text-decoration: none; box-shadow: 0 12px 35px rgba(28,176,246,.25); }
        :global(.level-overlay), :global(.level-loading) { position: fixed; inset: 0; z-index: 999999; display: grid; place-items: center; padding: 20px; background: rgba(4, 12, 26, .82); backdrop-filter: blur(12px); font-family: 'Be Vietnam Pro', sans-serif; }
        :global(.level-loading) { color: #eaf7ff; font-size: 1.1rem; }
        :global(.level-dialog) { width: min(560px, 100%); padding: 34px; border: 1px solid rgba(255,255,255,.14); border-radius: 26px; background: #12233a; color: #fff; box-shadow: 0 28px 70px rgba(0,0,0,.42); text-align: center; }
        :global(.level-icon) { display: block; font-size: 2.6rem; margin-bottom: 8px; } :global(.level-eyebrow) { margin: 0; color: #6ce0ff; font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; } :global(.level-dialog h2) { margin: 10px 0; font-size: 1.75rem; } :global(.level-dialog > p:not(.level-eyebrow)) { color: #aec0d5; line-height: 1.55; }
        :global(.difficulty-option-list) { display: grid; gap: 12px; margin-top: 24px; } :global(.difficulty-option) { display: grid; gap: 4px; width: 100%; padding: 16px 18px; border: 1px solid color-mix(in srgb, var(--difficulty-accent), transparent 52%); border-radius: 16px; background: color-mix(in srgb, var(--difficulty-accent), transparent 89%); color: #fff; cursor: pointer; text-align: left; } :global(.difficulty-option:hover:not(:disabled)) { transform: translateY(-2px); border-color: var(--difficulty-accent); } :global(.difficulty-option:disabled) { cursor: wait; opacity: .7; } :global(.difficulty-option strong) { color: var(--difficulty-accent); font-size: 1.05rem; } :global(.difficulty-option span) { color: #bbcadc; font-size: .88rem; }
        @media (max-width: 480px) { .landing-stats { gap: 18px; } :global(.level-dialog) { padding: 26px 20px; } }
      `}</style>
    </main>
  );
}
