"use client";
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Expand } from 'lucide-react';
import { LESSON_SLIDES } from '@/lib/du/slides';

export default function LessonSlides() {
  const [n, setN] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nativeFullscreen = useRef(false);
  const slide = LESSON_SLIDES[n];
  function stopPresenting() {
    setPresenting(false);
    if (document.fullscreenElement === ref.current) document.exitFullscreen().catch(() => {});
  }
  useEffect(() => {
    if (!presenting) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [presenting]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'Escape') { setPresenting(false); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); setN(v => Math.min(LESSON_SLIDES.length - 1, v + 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setN(v => Math.max(0, v - 1)); }
    }
    window.addEventListener('keydown', key);
    function fullscreen() {
      if (document.fullscreenElement === ref.current) nativeFullscreen.current = true;
      else if (nativeFullscreen.current) { nativeFullscreen.current = false; setPresenting(false); }
    }
    document.addEventListener('fullscreenchange', fullscreen);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('fullscreenchange', fullscreen); };
  }, []);
  return <section className="lesson-deck">
    <div className={'lesson-frame' + (presenting ? ' is-presenting' : '')} ref={ref}>
      <article className="lesson-slide" aria-label={`${n + 1}번 슬라이드`}>
        <div className="lesson-content">
          <div className="lesson-kicker"><span>MOAKIT · 디지털 장의사</span><span>{String(n + 1).padStart(2, '0')} / {LESSON_SLIDES.length}</span></div>
          <p className="lesson-chapter">{slide.chapter}</p>
          <h2>{slide.title}</h2><p className="lesson-lead">{slide.lead}</p>
          <ol className="lesson-points">{slide.points.map((point, i) => <li key={point.title}><span>{i + 1}</span><div><h3>{point.title}</h3><p>{point.text}</p></div></li>)}</ol>
        </div>
        <div className="lesson-photo"><img src={`/art/${slide.image}.png`} alt="" /><span>{slide.chapter}</span></div>
        <div className="lesson-question"><b>함께 생각하기</b><p>{slide.question}</p></div>
      </article>
      <div className="lesson-controls"><button aria-label="이전 슬라이드" onClick={() => setN(v => Math.max(0, v - 1))} disabled={!n}><ArrowLeft size={20} />이전</button><span>{n + 1} / {LESSON_SLIDES.length}</span>{presenting && <button onClick={stopPresenting}>발표 마치기</button>}<button aria-label="다음 슬라이드" onClick={() => setN(v => Math.min(LESSON_SLIDES.length - 1, v + 1))} disabled={n === LESSON_SLIDES.length - 1}>다음<ArrowRight size={20} /></button></div>
    </div>
    <div className="slides-nav"><span>방향키 ← →로 넘길 수 있습니다.</span><button onClick={() => { setPresenting(true); ref.current?.requestFullscreen?.().catch(() => {}); }}><Expand size={18} />전체화면</button></div>
    <div className="lesson-jump" aria-label="슬라이드 바로가기">{LESSON_SLIDES.map((item, i) => <button key={item.title} aria-label={`${i + 1}번 ${item.title}`} aria-current={i === n ? 'step' : undefined} onClick={() => setN(i)}>{String(i + 1).padStart(2, '0')}</button>)}</div>
    <aside className="presenter-notes"><div className="presenter-heading"><b>교사 진행 메모</b><span>{slide.minutes}</span></div><p>{slide.notes}</p><p><b>이렇게 진행하세요</b> · {slide.activity}</p></aside>
  </section>;
}
