"use client";
import { useState, useEffect, useRef } from 'react';
import { Check, Printer, Download, ArrowRight, ArrowLeft } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { api } from '@/lib/du/api';
import { CASES, riskItems } from '@/lib/du/content';
import { DEFAULT_STAMP, Stamp, drawStamp, drawTest, printStamp } from '@/lib/du/stamp';
export function StampCanvas({ stamp }: {
    stamp: Stamp;
}) { const ref = useRef<HTMLCanvasElement>(null); useEffect(() => { if (ref.current)
    drawStamp(ref.current, { ...DEFAULT_STAMP, ...stamp }); }, [stamp]); return <canvas ref={ref} width={600} height={Math.round(600 * (stamp.height || 15) / (stamp.width || 40))} aria-label="설계한 흑백 도장 무늬"/>; }
export function Gallery({ data, token, studentId, onVoted }: {
    data: any;
    token?: string;
    studentId?: string;
    onVoted?: () => void;
}) { const [sort, setSort] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false); if (!data?.cards?.length)
    return <div className="empty">아직 완성된 도장이 없어요.</div>; const cards = [...data.cards].sort((a: any, b: any) => sort ? (b.stamp?.coverage || 0) - (a.stamp?.coverage || 0) : 0); async function vote(id: string) { if (!token)
    return; setBusy(true); try {
    await api('vote', { card_id: id }, token);
    onVoted?.();
    setError('');
}
catch (e: any) {
    setError(e.message);
}
finally {
    setBusy(false);
} } return <><div className="activity-top"><p className="muted">모의 가림률은 예시 글씨와 무늬가 겹친 비율이에요.</p><button onClick={() => setSort(!sort)}>{sort ? '기본 순서로' : '가림률 순으로'}</button></div>{error && <p className="error">{error}</p>}<div className="stamp-gallery">{cards.map((c: any) => <section key={c.id} className="stamp-tile"><b>{data.students.find((s: any) => s.id === c.student_id)?.nickname || '친구'}</b><StampCanvas stamp={c.stamp}/><p className="muted">모의 가림률 {c.stamp?.coverage || 0}% · {data.votes?.filter((v: any) => v.card_id === c.id).length || 0}표</p>{token && c.student_id !== studentId && <button onClick={() => vote(c.id)} disabled={busy} className={data.votes?.some((v: any) => v.student_id === studentId && v.card_id === c.id) ? 'primary' : ''}>{data.votes?.some((v: any) => v.student_id === studentId && v.card_id === c.id) ? '선택한 도장' : '이 도장에 투표'}</button>}</section>)}</div></>; }
export default function Finish({ initial, answers, token, onSaved }: {
    initial: any;
    answers: any;
    token: string;
    onSaved: (card: any) => void;
}) {
    const [view, setView] = useState('summary'), [surprise, setSurprise] = useState(initial.card?.surprise || ''), [promise, setPromise] = useState(initial.card?.promise || ''), [thought, setThought] = useState(initial.card?.job_thought || ''), [stamp, setStamp] = useState<Stamp>({ ...DEFAULT_STAMP, ...initial.card?.stamp }), [test, setTest] = useState(false), [coverage, setCoverage] = useState(initial.card?.stamp?.coverage || 0), [error, setError] = useState(''), [busy, setBusy] = useState(false), [saved, setSaved] = useState(!!initial.card), [data, setData] = useState<any>(null);
    const preview = useRef<HTMLCanvasElement>(null);
    const level = initial.classroom.level;
    const missed = CASES.flatMap(c => riskItems(c.no, level).filter(i => !answers[c.no]?.found_items?.includes(i.id)));
    function refresh() { api('class_summary', {}, token).then(setData).catch(e => setError(e.message)); }
    useEffect(() => { refresh(); const i = setInterval(refresh, 5000); return () => clearInterval(i); }, [token]);
    useEffect(() => { let stop = false; document.fonts.ready.then(() => { if (!stop && preview.current)
        setCoverage(drawTest(preview.current, stamp, test)); }); return () => { stop = true; }; }, [stamp, test, view]);
    function change(v: Partial<Stamp>) { setStamp(s => ({ ...s, ...v })); setSaved(false); }
    async function saveCard(nextView?: string) { setBusy(true); setError(''); try {
        const result = await api('save_card', { surprise, promise, job_thought: thought, stamp: { ...stamp, coverage } }, token);
        onSaved(result.card);
        setSaved(true);
        refresh();
        if (nextView)
            setView(nextView);
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    return <><div className="activity-top"><span className="eyebrow">MY PRIVACY PROMISE</span><span className="done-badge">네 사건의 기록</span></div><h2>{view === 'summary' ? '이제 내 정보를 지킬 차례' : view === 'card' ? '나의 약속 카드' : view === 'stamp' ? '나만의 가림 도장' : '이제 진짜 도장을 만들 차례예요'}</h2>{error && <div className="error" role="alert">{error}</div>}
    {view === 'summary' && <><p style={{ margin: '12px 0 24px' }}>오늘 민서, 지호, 수아, 태윤을 도왔어요.</p><Table className="summary-table"><TableHeader><TableRow><TableHead>사건</TableHead><TableHead>내가 찾은 흔적</TableHead><TableHead>반 평균</TableHead><TableHead>못 보고 지나간 것</TableHead></TableRow></TableHeader><TableBody>{CASES.map(c => <TableRow key={c.no}><TableCell>{c.short}</TableCell><TableCell><strong>{answers[c.no]?.found_items?.length || 0}</strong>개</TableCell><TableCell>{data?.averages?.find((a: any) => a.case_no === c.no)?.average?.toFixed(1) ?? '—'}개</TableCell><TableCell>{riskItems(c.no, level).filter(i => !answers[c.no]?.found_items?.includes(i.id)).map(i => i.label).join(' · ') || '없음'}</TableCell></TableRow>)}</TableBody></Table><p className="muted" style={{ marginTop: 15 }}>반 평균은 해당 사건을 마친 학생들의 기록으로 계산해요. 점수와 등수는 없어요.</p><div className="activity-actions"><span /><button className="primary" onClick={() => setView('card')}>약속 카드 쓰기<ArrowRight size={18}/></button></div></>}
    {view === 'card' && <><div className="form-stack" style={{ marginTop: 25 }}><label>오늘 가장 놀랐던 것<textarea maxLength={300} value={surprise} onChange={e => { setSurprise(e.target.value); setSaved(false); }} placeholder="새롭게 알게 된 것을 적어요."/></label>{missed.length > 0 && <div className="pattern-buttons">{missed.slice(0, 6).map(i => <button key={i.id} onClick={() => setSurprise(`${i.label}도 단서가 된다는 것이 놀라웠어요.`)}>{i.label}</button>)}</div>}<label>앞으로 지킬 나의 약속 한 줄<textarea maxLength={300} value={promise} onChange={e => { setPromise(e.target.value); setSaved(false); }} placeholder="내가 실천할 수 있는 약속을 써 주세요."/></label><p className="muted">예: 배경 살펴보기 · 허락받고 올리기 · 안 쓰는 계정 정리하기. 그대로 옮기기보다 내 말로 써요.</p>{level === 'middle' && <label>이 직업에서 가장 어려워 보이는 일<textarea maxLength={300} value={thought} onChange={e => { setThought(e.target.value); setSaved(false); }} placeholder="어떤 판단이 어려울까요?"/></label>}<p className="privacy-reminder">실명·연락처·주소는 적지 않아요. 약속 카드는 교사 화면에 모여요.</p></div><div className="activity-actions"><button onClick={() => setView('summary')}><ArrowLeft size={18}/>기록 보기</button><button className="primary" disabled={busy || !surprise.trim() || !promise.trim() || (level === 'middle' && !thought.trim())} onClick={() => saveCard('stamp')}>저장하고 도장 만들기<ArrowRight size={18}/></button></div></>}
    {view === 'stamp' && <><div className="stamp-editor" style={{ marginTop: 26 }}><div className="stamp-controls"><div><label>바탕 무늬</label><div className="pattern-buttons">{[['hatch', '빗금'], ['grid', '격자'], ['wave', '물결'], ['dot', '점'], ['brick', '벽돌']].map(([id, label]) => <button key={id} className={stamp.pattern === id ? 'selected' : ''} onClick={() => change({ pattern: id })}>{label}</button>)}</div></div><label>촘촘한 정도 · {stamp.density}<Slider min={10} max={95} step={1} value={[stamp.density]} onValueChange={v => change({ density: v[0] })} aria-label="촘촘한 정도" style={{ marginTop: 12 }}/></label><div><label>가운데 그림</label><div className="pattern-buttons">{[['none', '없음'], ['lock', '자물쇠'], ['eraser', '지우개'], ['shield', '방패']].map(([id, label]) => <button key={id} className={stamp.icon === id ? 'selected' : ''} onClick={() => change({ icon: id })}>{label}</button>)}</div></div><div><label>도장 모양</label><div className="pattern-buttons"><button className={stamp.shape === 'rect' ? 'selected' : ''} onClick={() => change({ shape: 'rect' })}>사각형</button><button className={stamp.shape === 'round' ? 'selected' : ''} onClick={() => change({ shape: 'round' })}>둥근 사각형</button></div></div><div className="size-row">{[['width', '가로 mm', 15, 80], ['height', '세로 mm', 10, 50], ['margin', '여백 mm', 0, 5]].map(([key, label, min, max]) => <label key={key}>{label}<input type="number" value={stamp[key as keyof Stamp]} min={min} max={max} onChange={e => change({ [key]: Math.max(Number(min), Math.min(Number(max), Number(e.target.value))) })}/></label>)}</div><p className="muted">선생님과 도장 기계의 규격을 확인해 크기를 맞춰 주세요.</p></div><div className="stamp-preview"><h3>내 도장 무늬</h3><StampCanvas stamp={stamp}/><h3>가짜 송장에 시험하기</h3><canvas ref={preview} width={600} height={225} aria-label="송장 위 가림 무늬 미리보기"/><button onClick={() => setTest(!test)} className="primary">{test ? '송장 다시 보기' : '여기에 찍어보기'}</button>{test && <div style={{ marginTop: 16 }}><b className="cover-number">{coverage}%</b> <span>모의 가림률</span><p className="muted">예시 글씨와 무늬가 겹친 비율이에요. 실제 도장의 가림 성능을 보장하지 않아요.</p></div>}</div></div><div className="activity-actions"><button onClick={() => setView('card')}><ArrowLeft size={18}/>약속 카드</button><button className="primary" disabled={busy || !test} onClick={() => saveCard('done')}>{busy ? '저장 중…' : '도장 완성하기'}<Check size={18}/></button></div></>}
    {view === 'done' && <><div className="final-note"><p style={{ margin: '15px 0 22px' }}>설계한 도안을 출력하고, 실제 송장에 찍어 확인해요.</p><div style={{ maxWidth: 440, margin: 'auto' }}><StampCanvas stamp={stamp}/></div><div className="pattern-buttons" style={{ justifyContent: 'center', marginTop: 22 }}><button className="primary" onClick={() => { if (!printStamp({ ...stamp, coverage }))
        setError('인쇄 창을 열 수 없어요. 팝업 차단을 확인해 주세요.'); }}><Printer size={18}/>도안 인쇄</button><button onClick={() => printStamp({ ...stamp, coverage }, true)}><Download size={18}/>도안 저장</button><button onClick={() => setView('stamp')}>무늬 다시 바꾸기</button></div><p className="muted" style={{ marginTop: 15 }}>{stamp.width} × {stamp.height} mm · 흑백 도안 · 실제 크기 100% 인쇄</p><p className="muted">{saved ? '약속과 도장을 저장했어요.' : '변경한 내용을 저장해 주세요.'}</p></div><section className="student-gallery"><h3>우리 반 도장 갤러리</h3><Gallery data={data} token={token} studentId={initial.student.id} onVoted={refresh}/></section></>}
    </>;
}
