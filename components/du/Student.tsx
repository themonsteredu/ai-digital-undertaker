"use client";
import { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Check, Search, ZoomIn, Package, Camera, MessageSquare, LogOut, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sidebar, SidebarProvider, SidebarContent, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { CASES, stepsFor, riskItems, ACCOUNTS, Step, Level } from '@/lib/du/content';
import { api } from '@/lib/du/api';
import Finish from './Finish';
export function Service({ type }: {
    type: 'erase' | 'leave';
}) { return <aside className="service-note"><h3>{type === 'erase' ? '지우개 서비스' : '웹사이트 회원탈퇴 지원'}</h3><p>{type === 'erase' ? '30세 미만이라면, 19세 미만일 때 직접 올린 개인정보가 담긴 글의 삭제·검색 차단 등을 도와달라고 신청할 수 있어요.' : '개인정보포털에서 본인확인 내역을 살펴보고, 지원되는 사이트의 탈퇴를 요청할 수 있어요.'}</p><p className="muted">{type === 'erase' ? '모든 글이 자동으로 지워지는 것은 아니에요. 대상과 필요한 자료를 확인해요.' : '모든 가입 계정이 조회되지는 않아요. 집에서 보호자와 함께 확인해 보세요.'}</p><a href={type === 'erase' ? 'https://www.privacy.go.kr/' : 'https://www.privacy.go.kr/front/contents/cntntsView.do?contsNo=196'} target="_blank" rel="noreferrer">개인정보포털에서 안내 확인</a></aside>; }
export default function Student({ initial, token, onExit }: {
    initial: any;
    token: string;
    onExit: () => void;
}) {
    const [n, setN] = useState(initial.student.current_case || 1), [index, setIndex] = useState(initial.student.current_step || 0);
    const [answers, setAnswers] = useState<Record<number, any>>(Object.fromEntries(initial.answers.map((a: any) => [a.case_no, a])));
    const [save, setSave] = useState('저장됨'), [error, setError] = useState(''), [detail, setDetail] = useState(''), [zoom, setZoom] = useState(false), [blocked, setBlocked] = useState(false);
    const [cardData, setCardData] = useState(initial.card);
    const chain = useRef(Promise.resolve());
    const pending = useRef(0);
    const level: Level = initial.classroom.level;
    const c = CASES[Math.min(n, 4) - 1], steps = stepsFor(Math.min(n, 4), level), step = steps[Math.min(index, steps.length - 1)];
    const answer = answers[n] || { found_items: [], choices: {}, reason: '', completed: false };
    const choice = answer.choices[step.id];
    useEffect(() => { const context = (document as any).modelContext; if (!context?.registerTool)
        return; const ctrl = new AbortController(); Promise.resolve(context.registerTool({ name: 'read_current_activity', description: '학생 화면에 표시된 현재 사건과 진행 단계를 읽습니다. 기록을 변경하지 않습니다.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: (input: any) => { if (!input || Object.keys(input).length)
            throw new Error('입력 항목이 없어야 합니다.'); return { case_no: n, case_title: n === 5 ? '약속과 도장' : c.title, step: n === 5 ? '마무리' : step.title, found_count: answer.found_items.length, level }; } }, { signal: ctrl.signal })).catch(() => { }); return () => ctrl.abort(); }, [n, index, answer.found_items.length, level]);
    function enqueue(action: string, body: any) { pending.current++; setSave('저장 중'); setError(''); const task = chain.current.catch(() => { }).then(() => api(action, body, token)); chain.current = task.then(() => { pending.current--; if (!pending.current)
        setSave('저장됨'); }).catch(e => { pending.current--; setError(e.message); setSave('저장 확인 필요'); throw e; }); chain.current.catch(() => { }); return chain.current; }
    function persist(a: any) { return enqueue('save_answer', { case_no: n, found_items: a.found_items, choices: a.choices, reason: a.reason || '', completed: a.completed }); }
    function update(change: any, shouldSave = true) { const a = { ...answer, ...change }; setAnswers(v => ({ ...v, [n]: a })); if (shouldSave)
        persist(a).catch(() => { }); return a; }
    function pick(value: any) { update({ choices: { ...answer.choices, [step.id]: value } }); }
    function find(id: string) { const found = answer.found_items.includes(id); const it = step.items?.find(i => i.id === id); if (it?.safe) {
        setDetail(it.detail);
        return;
    } update({ found_items: found ? answer.found_items.filter((s: string) => s !== id) : [...answer.found_items, id] }); setDetail(found ? '' : it?.detail || ''); }
    async function move(nextN: number, nextI: number) { setBlocked(true); try {
        if (n < 5)
            await persist(answer);
        await enqueue('progress', { current_case: nextN, current_step: nextI });
        setN(nextN);
        setIndex(nextI);
        setDetail('');
        setZoom(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    catch { }
    finally {
        setBlocked(false);
    } }
    async function next() { setBlocked(true); try {
        const a = step.kind === 'report' ? { ...answer, completed: true } : answer;
        await persist(a);
        if (step.kind === 'report')
            setAnswers(v => ({ ...v, [n]: a }));
        const nextN = index === steps.length - 1 ? n + 1 : n, nextI = index === steps.length - 1 ? 0 : index + 1;
        await enqueue('progress', { current_case: nextN, current_step: nextI });
        setN(nextN);
        setIndex(nextI);
        setDetail('');
        setZoom(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    catch { }
    finally {
        setBlocked(false);
    } }
    const reasonKey = step.id + '_reason';
    const requiresReason = step.reason && level === 'middle';
    const valid = step.kind === 'choice' ? choice !== undefined && (!requiresReason || Boolean(answer.choices[reasonKey]?.trim())) : step.kind === 'accounts' ? ACCOUNTS.every(a => answer.choices.accounts?.[a[0]]) : step.kind === 'settings' ? ['location', 'public', 'tag'].every(k => answer.choices.s_settings?.[k] === false) : true;
    async function exit() { setBlocked(true); try {
        if (n < 5)
            await persist(answer);
        await chain.current;
        onExit();
    }
    catch { }
    finally {
        setBlocked(false);
    } }
    return <><header className="app-header"><div className="brand"><ShieldCheck /><b>MOAKIT</b><span>DIGITAL PRIVACY LAB</span></div><div className="header-right"><span className="badge">{level === 'middle' ? '중등' : '초등'} 조사실</span><span>{initial.student.nickname} · {initial.classroom.code}</span><button className="icon-btn" aria-label="나가기" onClick={exit} disabled={blocked}><LogOut size={18}/></button></div></header><div className="workspace"><SidebarProvider style={{ minHeight: 0, width: 'auto' }}><Sidebar collapsible="none" className="case-nav"><SidebarContent><span className="eyebrow">CASE FILES</span><SidebarMenu>{CASES.map(v => <SidebarMenuItem key={v.no}><button className={n === v.no ? 'active' : ''} onClick={() => move(v.no, 0)} disabled={blocked}><span className="nav-num">0{v.no}</span>{v.short}{answers[v.no]?.completed && <Check size={15}/>}</button></SidebarMenuItem>)}<SidebarMenuItem><button onClick={() => move(5, 0)} className={n === 5 ? 'active' : ''} disabled={blocked || !CASES.every(c => answers[c.no]?.completed)}>나의 약속과 도장</button></SidebarMenuItem></SidebarMenu><small>활동 내용은 자동으로 저장돼요.</small></SidebarContent></Sidebar></SidebarProvider><main className="activity">
 {error && <div role="alert" className="error">{error} <button onClick={() => persist(answer).catch(() => { })}>다시 저장</button></div>}
 {n === 5 ? <Finish initial={{ ...initial, card: cardData }} answers={answers} token={token} onSaved={setCardData}/> : <><div className="activity-top"><span className="eyebrow">CASE 0{n} · {c.client}의 의뢰</span><div className="steps" aria-label={`${index + 1}/${steps.length} 단계`}>{steps.map((_, i) => <i className={i <= index ? 'done' : ''} key={i}/>)}</div></div><div className="activity-title"><h2>{step.title}</h2>{step.hint && <p>{step.hint}</p>}</div>
 {step.kind === 'intro' && <div className="intro"><div className="intro-visual"><img src={'/art/' + (['scene-parcel', 'scene-classroom', 'slide-03', 'slide-05'][n - 1]) + '.png'} alt={c.short}/></div><div className="request"><span className="eyebrow">의뢰인 · {c.client}</span><blockquote>“{c.quote}”</blockquote></div></div>}
 {step.kind === 'scan' && <div className="scan-layout"><div><div className="scan-tools"><span>수업용 가상 자료</span>{!['search', 'chat'].includes(step.scene!) && <button className="icon-btn" aria-pressed={zoom} onClick={() => setZoom(!zoom)}><ZoomIn size={17}/>{zoom ? '기본 크기' : '확대하기'}</button>}</div>
 {step.scene === 'search' ? <div className="search-results"><div className="search-bar"><Search size={18}/>수아</div>{step.items?.map(it => <button key={it.id} className={'search-result ' + (answer.found_items.includes(it.id) ? 'selected' : '')} onClick={() => find(it.id)} aria-pressed={answer.found_items.includes(it.id)}><strong>{it.label}</strong>{it.text}</button>)}</div> : step.scene === 'chat' ? <div className="chat-window"><div className="chat-head">6학년 모아반 · 단체 대화</div>{step.items?.map(it => <button key={it.id} className={'chat-bubble ' + (answer.found_items.includes(it.id) ? 'selected' : '')} aria-pressed={answer.found_items.includes(it.id)} onClick={() => find(it.id)}>{it.id === 'c_photo' && <Camera size={23}/>} {it.text}</button>)}</div> : <div className="scene-viewport"><div className="scene" style={zoom ? { width: '170%', minWidth: '170%' } : {}}><img src={'/art/scene-' + step.scene + '.png'} alt={step.scene === 'parcel' ? '문 앞 택배 상자와 송장' : step.scene === 'classroom' ? '교실 사진' : step.scene === 'street' ? '집 앞 거리 사진' : '생일 케이크 사진'}/>{step.scene === 'parcel' ? <><div className="parcel-label"><span>MOA DELIVERY · 수업용 송장</span>{step.items?.filter(it => it.id !== 'p_receipt').map(it => <button key={it.id} className={'label-field ' + (answer.found_items.includes(it.id) ? 'selected' : '')} aria-label={it.label} aria-pressed={answer.found_items.includes(it.id)} onClick={() => find(it.id)}>{it.text}</button>)}</div>{step.items?.some(it => it.id === 'p_receipt') && <button className={'hotspot receipt ' + (answer.found_items.includes('p_receipt') ? 'selected' : '')} aria-label="함께 버린 영수증" onClick={() => find('p_receipt')}>구매 영수증<br />수학 연습장<br />0000-00-00</button>}</> : step.items?.map(it => <button key={it.id} className={'hotspot field-' + it.id + ' ' + (!it.text ? 'blank ' : '') + (answer.found_items.includes(it.id) ? 'selected' : '')} style={{ left: it.x + '%', top: it.y + '%', width: it.w + '%', height: it.h + '%' }} aria-label={it.label} aria-pressed={answer.found_items.includes(it.id)} onClick={() => find(it.id)}>{it.text}</button>)}</div></div>}</div><aside className="scan-notes"><div className="scan-count"><b>{step.items?.filter(i => answer.found_items.includes(i.id)).length || 0}</b>곳을 찾았어요</div><ul className="found-list">{step.items?.filter(it => answer.found_items.includes(it.id)).map(it => <li key={it.id}><Check size={17}/>{it.label}</li>)}</ul><p className="muted">다 찾지 못해도 다음으로 갈 수 있어요.</p>{detail && <div className="feedback" role="status">{detail}</div>}</aside></div>}
 {step.kind === 'choice' && <><RadioGroup className="choices" value={choice === undefined ? '' : String(choice)} onValueChange={v => pick(Number(v))}>{step.options!.map((op, i) => <label key={i} className={'choice ' + (choice === i ? 'selected' : '')} style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer' }}><RadioGroupItem value={String(i)} aria-label={op}/><span className="choice-number">{i + 1}</span>{op}</label>)}</RadioGroup>{choice !== undefined && <div className="feedback" role="status">{step.feedback?.[choice]}</div>}{step.id === 'p_now' && choice === 2 && <div className="pen-example">받는 분 김민서 · 010-0000-0000</div>}{step.reason && <label className="reason">내가 이렇게 생각한 이유 {requiresReason ? '' : '(선택)'}<textarea maxLength={300} value={answer.choices[reasonKey] || ''} onChange={e => update({ choices: { ...answer.choices, [reasonKey]: e.target.value } }, false)} onBlur={() => persist(answer).catch(() => { })} placeholder="내 생각을 한 줄로 적어 주세요."/></label>}{step.service && choice !== undefined && <Service type={step.service}/>}</>}
 {step.kind === 'settings' && <div className="settings-list">{[['location', '위치 정보 함께 올리기', '위치 표시를 끄면 사진에 장소가 자동으로 붙지 않아요.'], ['public', '모든 사람에게 계정 공개', '공개 범위를 친구만으로 바꿨어요.'], ['tag', '누구나 나를 태그할 수 있음', '친구만 나를 태그할 수 있어요.']].map(([key, label, help]) => { const on = answer.choices.s_settings?.[key] !== false; return <div key={key} className="setting-row"><div>{label}<small>{on ? '현재 켜져 있어요.' : help}</small></div><Switch checked={on} onCheckedChange={v => update({ choices: { ...answer.choices, s_settings: { ...answer.choices.s_settings, [key]: v } } })} aria-label={label}/></div>; })}</div>}
 {step.kind === 'accounts' && <><div className="account-list">{ACCOUNTS.map(([id, name, year, last]) => <div className="account-row" key={id}><div>{name}<small>{year}년 가입 · 마지막 접속 {last}</small></div><div className="segmented">{['남기기', '탈퇴하기'].map((v, i) => <button key={v} className={answer.choices.accounts?.[id] === v ? 'selected' : ''} aria-pressed={answer.choices.accounts?.[id] === v} onClick={() => update({ choices: { ...answer.choices, accounts: { ...answer.choices.accounts, [id]: v } } })}>{v}</button>)}</div></div>)}</div><Service type="leave"/><p className="muted">여기서는 가상 계정을 정리해요. 실제 사이트에서 탈퇴되지 않아요.</p></>}
 {step.kind === 'report' && <><div className="report-found">{answer.found_items.length}<span style={{ fontSize: 18, color: 'var(--muted)', marginLeft: 12 }}>개의 흔적을 찾았어요</span></div><div className="report-grid"><section><h3>찾아낸 흔적</h3><p>{riskItems(n, level).filter(i => answer.found_items.includes(i.id)).map(i => i.label).join(' · ') || '다시 살펴볼 수 있어요.'}</p></section><section><h3>이건 못 보고 지나갔어요</h3><p>{riskItems(n, level).filter(i => !answer.found_items.includes(i.id)).map(i => i.label).join(' · ') || '이번 자료의 흔적을 모두 찾았어요.'}</p></section></div><div className="report-list">{steps.filter(s => s.kind === 'choice').map(s => <div className="report-row" key={s.id}><span>{s.title}</span><b>{s.options?.[answer.choices[s.id]] || '선택하지 않음'}</b></div>)}</div><p className="report-ending">{c.ending}</p></>}
 <div className="activity-actions"><button className="secondary" onClick={() => move(n, Math.max(0, index - 1))} disabled={index === 0 || blocked}><ArrowLeft size={18}/>이전</button><div className="actions-right"><span className="save-status" role="status">{save}</span><button className="primary" onClick={next} disabled={!valid || blocked}>{blocked ? '저장 중…' : step.kind === 'intro' ? '의뢰 살펴보기' : step.kind === 'report' ? (n === 4 ? '나의 약속 쓰기' : '다음 사건') : '다음'}<ArrowRight size={18}/></button></div></div></>}
 </main></div></>;
}
