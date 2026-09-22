"use client";
import { useEffect, useId, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { Check, Hand, Pencil, RotateCcw, ZoomIn, X } from 'lucide-react';
import type { Step } from '@/lib/du/content';
import { matchEvidence, type Mark, type ScanValue } from '@/lib/du/evidence';
import ParcelPaper from './ParcelPaper';

type Point = { x: number; y: number };
const clamp = (n: number) => Math.max(0, Math.min(100, n));
const rect = (start: Point, end: Point, document: string): Mark => ({ document, x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), w: Math.abs(start.x - end.x), h: Math.abs(start.y - end.y) });

export default function EvidenceScanner({ step, value, found, onChange }: {
  step: Step; value?: ScanValue; found: string[]; onChange: (value: ScanValue, found: string[]) => void;
}) {
  const parcel = step.scene === 'parcel';
  const [document, setDocument] = useState(parcel ? 'label' : 'scene');
  const [zoom, setZoom] = useState(false), [pan, setPan] = useState(false);
  const [draft, setDraft] = useState<Mark | null>(null), [cursor, setCursor] = useState<Point | null>(null);
  const start = useRef<Point | null>(null), keyboardStart = useRef<Point | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const panStart = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const marks = value?.marks || [], reviewed = value?.reviewed ?? found.length > 0;
  const instructions = useId();
  const [fitWidth, setFitWidth] = useState<number>();
  const [photoRatio, setPhotoRatio] = useState(4 / 3);
  const ratio = parcel ? document === 'receipt' ? 600 / 960 : 1000 / 690 : photoRatio;
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const fit = () => setFitWidth(Math.max(1, Math.min(element.clientWidth - 24, (element.clientHeight - 24) * ratio)) + 24);
    const observer = new ResizeObserver(fit);
    observer.observe(element); fit();
    return () => observer.disconnect();
  }, [ratio]);
  const ownMarks = marks.map((mark, i) => ({ ...mark, i })).filter(mark => mark.document === document);
  function change(next: Mark[]) { onChange({ marks: next, reviewed: false }, []); }
  function add(mark: Mark) {
    if (marks.length >= 18) return;
    if (mark.w < 1 || mark.h < 1) {
      mark = { document, x: clamp(mark.x - 2), y: clamp(mark.y - 1.5), w: 4, h: 3 };
    }
    mark = { ...mark, w: Math.min(mark.w, 100 - mark.x), h: Math.min(mark.h, 100 - mark.y) };
    change([...marks, Object.fromEntries(Object.entries(mark).map(([key, v]) => [key, typeof v === 'number' ? Math.round(v * 100) / 100 : v])) as Mark]);
  }
  function point(e: PointerEvent<HTMLDivElement>): Point {
    const bounds = e.currentTarget.getBoundingClientRect();
    return { x: clamp((e.clientX - bounds.left) / bounds.width * 100), y: clamp((e.clientY - bounds.top) / bounds.height * 100) };
  }
  function down(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if (pan && viewport.current) {
      e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
      panStart.current = { x: e.clientX, y: e.clientY, left: viewport.current.scrollLeft, top: viewport.current.scrollTop };
      return;
    }
    if (marks.length >= 18) return;
    e.preventDefault(); e.currentTarget.focus(); e.currentTarget.setPointerCapture(e.pointerId);
    start.current = point(e); setDraft(rect(start.current, start.current, document)); setCursor(null);
  }
  function up(e: PointerEvent<HTMLDivElement>) {
    if (panStart.current) { panStart.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); return; }
    if (!start.current) return;
    add(rect(start.current, point(e), document)); start.current = null; setDraft(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (panStart.current && viewport.current) {
      viewport.current.scrollLeft = panStart.current.left + panStart.current.x - e.clientX;
      viewport.current.scrollTop = panStart.current.top + panStart.current.y - e.clientY;
    } else if (start.current) setDraft(rect(start.current, point(e), document));
  }
  function key(e: KeyboardEvent<HTMLDivElement>) {
    if (pan) return;
    const p = cursor || { x: 50, y: 50 }, amount = e.shiftKey ? 5 : 1;
    if (e.key.startsWith('Arrow')) {
      e.preventDefault(); const next = { x: clamp(p.x + (e.key === 'ArrowRight' ? amount : e.key === 'ArrowLeft' ? -amount : 0)), y: clamp(p.y + (e.key === 'ArrowDown' ? amount : e.key === 'ArrowUp' ? -amount : 0)) };
      setCursor(next); if (keyboardStart.current) setDraft(rect(keyboardStart.current, next, document));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (keyboardStart.current) { add(rect(keyboardStart.current, p, document)); keyboardStart.current = null; setDraft(null); }
      else { keyboardStart.current = p; setCursor(p); setDraft(rect(p, p, document)); }
    } else if (e.key === 'Escape') { keyboardStart.current = null; start.current = null; setDraft(null); }
  }
  function selectDocument(next: string) { setDocument(next); setDraft(null); start.current = null; keyboardStart.current = null; setCursor(null); }
  return <div className="evidence-layout">
    <section className="evidence-main">
      {parcel && <div className="document-tabs" aria-label="조사 자료 선택">
        <button aria-pressed={document === 'label'} onClick={() => selectDocument('label')}>택배 송장</button>
        <button aria-pressed={document === 'receipt'} onClick={() => selectDocument('receipt')}>구매 영수증</button>
      </div>}
      <p className="evidence-instruction" id={instructions}>개인정보가 담긴 부분을 직접 드래그해 표시하세요.</p>
      <div className="evidence-toolbar">
        <div><button className="icon-btn" aria-pressed={!pan} onClick={() => setPan(false)}><Pencil size={17} />표시</button><button className="icon-btn" aria-pressed={pan} onClick={() => setPan(true)}><Hand size={17} />이동</button></div>
        <button className="icon-btn" aria-pressed={zoom} onClick={() => setZoom(!zoom)}><ZoomIn size={17} />{zoom ? '화면 맞춤' : '확대'}</button>
        <button className="icon-btn" onClick={() => change(marks.slice(0, -1))} disabled={!marks.length}><RotateCcw size={17} />되돌리기</button>
      </div>
      <div ref={viewport} className={'evidence-viewport ' + (parcel ? 'paper-desk' : '')}>
        <div className={'evidence-size ' + (document === 'receipt' ? 'receipt-size' : '')} style={{ width: fitWidth ? fitWidth * (zoom ? 1.8 : 1) : '100%', maxWidth: 'none', padding: 12 }}>
          <div className={'evidence-surface ' + (pan ? 'pan-mode' : '')} tabIndex={0} aria-label="직접 표시하는 조사 자료" aria-describedby={instructions}
            onPointerDown={down} onPointerMove={move} onPointerUp={up}
            onPointerCancel={() => { start.current = null; panStart.current = null; setDraft(null); }} onKeyDown={key}>
            {parcel ? <ParcelPaper document={document as 'label' | 'receipt'} /> : <>
              <img className="evidence-photo" draggable={false} onLoad={event => setPhotoRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)} src={`/art/scene-${step.scene}.png`} alt={step.title} />
              {step.items?.filter(item => item.text).map(item => <span key={item.id} className={`evidence-text field-${item.id}`} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%` }}>{item.text}</span>)}
            </>}
            {ownMarks.map(mark => <span key={mark.i} className="evidence-mark" style={{ left: `${mark.x}%`, top: `${mark.y}%`, width: `${mark.w}%`, height: `${mark.h}%` }}><b>{mark.i + 1}</b></span>)}
            {draft && <span className="evidence-mark draft" style={{ left: `${draft.x}%`, top: `${draft.y}%`, width: `${draft.w}%`, height: `${draft.h}%` }} />}
            {cursor && <span className="evidence-cursor" style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }} />}
          </div>
        </div>
      </div>
      <p className="evidence-caption">{parcel ? '실제 인쇄 형식을 재현한 수업 자료입니다. 이름·주소·거래내역은 모두 가상입니다.' : '수업용 사진입니다. 작은 글씨와 배경도 살펴보세요.'}</p>
      <details className="keyboard-help"><summary>키보드로 표시하기</summary><p>자료에 초점을 놓고 방향키로 이동하세요. Enter로 시작점을 정한 뒤 방향키로 범위를 넓히고, Enter로 표시합니다. Shift와 방향키를 함께 누르면 크게 이동합니다.</p></details>
    </section>
    <aside className="evidence-notes">
      <h3>내가 표시한 곳</h3><p>{marks.length}곳 표시</p>
      <div className="mark-list">{marks.map((mark, i) => <button key={i} onClick={() => change(marks.filter((_, index) => index !== i))} aria-label={`${i + 1}번 표시 지우기`}><b>{i + 1}</b>{parcel ? mark.document === 'receipt' ? '영수증' : '송장' : '사진'}<X size={15} /></button>)}</div>
      {!marks.length && <p className="muted">자료에서 가려야 할 부분을 찾아 직접 표시해 보세요.</p>}
      {marks.length >= 18 && <p className="muted">표시가 많아졌어요. 필요 없는 표시를 지우고 다시 골라 보세요.</p>}
      <button className="primary evidence-review" onClick={() => onChange({ marks, reviewed: true }, matchEvidence(marks, step.items || [], step.scene || ''))}>표시한 곳 확인</button>
      {reviewed && <div className="evidence-review-result" role="status"><b>{found.length}가지 정보를 확인했어요.</b><ul>{step.items?.filter(item => found.includes(item.id)).map(item => <li key={item.id}><Check size={16} /><span>{item.label}<small>{item.detail}</small></span></li>)}</ul><p className="muted">다 찾지 못해도 다음으로 갈 수 있어요.</p></div>}
      {!reviewed && <p className="muted">표시를 마친 뒤 확인 버튼을 눌러 주세요.</p>}
    </aside>
  </div>;
}
