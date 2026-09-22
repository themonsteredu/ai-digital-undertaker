"use client";
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Check, Search, Camera, LogOut, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sidebar, SidebarProvider, SidebarContent, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { CASES, stepsFor, riskItems, ACCOUNTS, Step, Level } from '@/lib/du/content';
import { api } from '@/lib/du/api';
import { AutosaveQueue, answerTask, readOutbox, type SaveState } from '@/lib/du/autosave';
import Finish from './Finish';
import EvidenceScanner from './EvidenceScanner';
export function Service({ type }: {
    type: 'erase' | 'leave';
}) { return <aside className="service-note"><h3>{type === 'erase' ? '지우개 서비스' : '웹사이트 회원탈퇴 지원'}</h3><p>{type === 'erase' ? '30세 미만이라면, 19세 미만일 때 직접 올린 개인정보가 담긴 글의 삭제·검색 차단 등을 도와달라고 신청할 수 있어요.' : '개인정보포털에서 본인확인 내역을 살펴보고, 지원되는 사이트의 탈퇴를 요청할 수 있어요.'}</p><p className="muted">{type === 'erase' ? '모든 글이 자동으로 지워지는 것은 아니에요. 대상과 필요한 자료를 확인해요.' : '모든 가입 계정이 조회되지는 않아요. 집에서 보호자와 함께 확인해 보세요.'}</p><a href={type === 'erase' ? 'https://www.privacy.go.kr/' : 'https://www.privacy.go.kr/front/contents/cntntsView.do?contsNo=196'} target="_blank" rel="noreferrer">개인정보포털에서 안내 확인</a></aside>; }
export default function Student({ initial, token, onExit }: {
    initial: any;
    token: string;
    onExit: () => void;
}) {
    const outboxKey = `du-pending-v1:${initial.classroom.id}:${initial.student.id}`;
    const [restored] = useState(() => readOutbox(outboxKey));
    const resume = restored.find(task => task.action === 'progress')?.body;
    const [n, setN] = useState(resume?.current_case || initial.student.current_case || 1), [index, setIndex] = useState(resume?.current_step ?? initial.student.current_step ?? 0);
    const [answers, setAnswers] = useState<Record<number, any>>(() => ({
        ...Object.fromEntries(initial.answers.map((a: any) => [a.case_no, a])),
        ...Object.fromEntries(restored.filter(task => task.action === 'save_answer').map(task => [task.body.case_no, task.body])),
    }));
    const [saveState, setSaveState] = useState<SaveState>({ pending: restored.length > 0, error: '' });
    const save = saveState.error ? '저장 확인 필요' : saveState.pending ? '저장 중' : '저장됨';
    const [detail, setDetail] = useState(''), [blocked, setBlocked] = useState(false);
    const [cardData, setCardData] = useState(initial.card);
    const [saves] = useState(() => new AutosaveQueue({
        initial: restored,
        baseline: [1, 2, 3, 4].map(caseNo => answerTask(caseNo, initial.answers.find((a: any) => a.case_no === caseNo) || {})),
        send: task => api(task.action, task.body, token),
        report: setSaveState,
        checkpoint: tasks => { try { if (tasks.length) sessionStorage.setItem(outboxKey, JSON.stringify(tasks)); else sessionStorage.removeItem(outboxKey); } catch { /* The unload guard also protects pending work. */ } },
    }));
    useEffect(() => {
        saves.start();
        const beforeUnload = (event: BeforeUnloadEvent) => { if (saves.hasPending()) { event.preventDefault(); event.returnValue = ''; } };
        const online = () => { void saves.retry().catch(() => {}); };
        window.addEventListener('beforeunload', beforeUnload);
        window.addEventListener('online', online);
        return () => { saves.pauseTimer(); window.removeEventListener('beforeunload', beforeUnload); window.removeEventListener('online', online); };
    }, [saves]);
    const level: Level = initial.classroom.level;
    const c = CASES[Math.min(n, 4) - 1], steps = stepsFor(Math.min(n, 4), level), step = steps[Math.min(index, steps.length - 1)];
    const answer = answers[n] || { found_items: [], choices: {}, reason: '', completed: false };
    const choice = answer.choices[step.id];
    useEffect(() => { const context = (document as any).modelContext; if (!context?.registerTool)
        return; const ctrl = new AbortController(); Promise.resolve(context.registerTool({ name: 'read_current_activity', description: '학생 화면에 표시된 현재 사건과 진행 단계를 읽습니다. 기록을 변경하지 않습니다.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: (input: any) => { if (!input || Object.keys(input).length)
            throw new Error('입력 항목이 없어야 합니다.'); return { case_no: n, case_title: n === 5 ? '약속과 도장' : c.title, step: n === 5 ? '마무리' : step.title, found_count: answer.found_items.length, level }; } }, { signal: ctrl.signal })).catch(() => { }); return () => ctrl.abort(); }, [n, index, answer.found_items.length, level]);
    function persist(a: any) { saves.enqueue(answerTask(n, a)); }
    function update(change: any) { const a = { ...answer, ...change }; setAnswers(v => ({ ...v, [n]: a })); persist(a); return a; }
    function pick(value: any) { update({ choices: { ...answer.choices, [step.id]: value } }); }
    function find(id: string) { const found = answer.found_items.includes(id); const it = step.items?.find(i => i.id === id); if (it?.safe) {
        setDetail(it.detail);
        return;
    } update({ found_items: found ? answer.found_items.filter((s: string) => s !== id) : [...answer.found_items, id] }); setDetail(found ? '' : it?.detail || ''); }
    function move(nextN: number, nextI: number, latest = answer) {
        if (n < 5) persist(latest);
        saves.enqueue({ key: 'progress', action: 'progress', body: { current_case: nextN, current_step: nextI } });
        setN(nextN); setIndex(nextI); setDetail('');
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
    function next() {
        const a = step.kind === 'report' ? { ...answer, completed: true } : answer;
        if (step.kind === 'report') setAnswers(v => ({ ...v, [n]: a }));
        move(index === steps.length - 1 ? n + 1 : n, index === steps.length - 1 ? 0 : index + 1, a);
    }
    const reasonKey = step.id + '_reason';
    const requiresReason = step.reason && level === 'middle';
    const visualScan = step.kind === 'scan' && !['search', 'chat'].includes(step.scene || '');
    const valid = visualScan ? (answer.choices[step.id + '_scan']?.reviewed ?? answer.found_items.some((id: string) => step.items?.some(item => item.id === id))) : step.kind === 'choice' ? choice !== undefined && (!requiresReason || Boolean(answer.choices[reasonKey]?.trim())) : step.kind === 'accounts' ? ACCOUNTS.every(a => answer.choices.accounts?.[a[0]]) : step.kind === 'settings' ? ['location', 'public', 'tag'].every(k => answer.choices.s_settings?.[k] === false) : true;
    async function exit() { setBlocked(true); try {
        if (n < 5)
            persist(answer);
        await saves.flush();
        onExit();
    }
    catch { }
    finally {
        setBlocked(false);
    } }
    return <><header className={'app-header' + (n < 5 && (visualScan || step.kind === 'intro') ? ' app-header-fit' : '')}><div className="brand"><ShieldCheck /><b>MOAKIT</b><span>DIGITAL PRIVACY LAB</span></div><div className="header-right"><span className="badge">{level === 'middle' ? '중등' : '초등'} 조사실</span><span>{initial.student.nickname} · {initial.classroom.code}</span><button className="icon-btn" aria-label="나가기" onClick={exit} disabled={blocked}><LogOut size={18}/></button></div></header><div className={'workspace' + (n < 5 && (visualScan || step.kind === 'intro') ? ' workspace-fit' : '')}><SidebarProvider style={{ minHeight: 0, width: 'auto' }}><Sidebar collapsible="none" className="case-nav"><SidebarContent><span className="eyebrow">CASE FILES</span><SidebarMenu>{CASES.map(v => <SidebarMenuItem key={v.no}><button className={n === v.no ? 'active' : ''} onClick={() => move(v.no, 0)} disabled={blocked}><span className="nav-num">0{v.no}</span>{v.short}{answers[v.no]?.completed && <Check size={15}/>}</button></SidebarMenuItem>)}<SidebarMenuItem><button onClick={() => move(5, 0)} className={n === 5 ? 'active' : ''} disabled={blocked || !CASES.every(c => answers[c.no]?.completed)}>나의 약속과 도장</button></SidebarMenuItem></SidebarMenu><small>활동 내용은 자동으로 저장돼요.</small></SidebarContent></Sidebar></SidebarProvider><main className={'activity' + (n < 5 && (visualScan || step.kind === 'intro') ? ' activity-fit' : '')}>
 {saveState.error && <div role="alert" className="error">{saveState.error} 작성한 내용은 유지하고 있어요. <button onClick={() => saves.retry().catch(() => {})}>다시 저장</button></div>}
 {n === 5 ? <Finish initial={{ ...initial, card: cardData }} answers={answers} token={token} onSaved={setCardData}/> : <><div className="activity-top"><span className="eyebrow">CASE 0{n} · {c.client}의 의뢰</span><div className="steps" aria-label={`${index + 1}/${steps.length} 단계`}>{steps.map((_, i) => <i className={i <= index ? 'done' : ''} key={i}/>)}</div></div><div className="activity-title"><h2>{step.title}</h2>{step.hint && <p>{step.hint}</p>}</div>
 {step.kind === 'intro' && <div className="intro"><div className="intro-visual"><img src={'/art/' + (['scene-parcel-photo.webp', 'scene-classroom-photo.webp', 'slide-03.png', 'slide-05.png'][n - 1])} alt={n === 1 ? '송장이 붙은 택배 상자와 구매 영수증' : c.short}/></div><div className="request"><span className="eyebrow">의뢰인 · {c.client}</span><blockquote>“{c.quote}”</blockquote></div></div>}
 {step.kind === 'scan' && (!['search', 'chat'].includes(step.scene!) ? <EvidenceScanner key={`${n}-${step.id}`} step={step} value={answer.choices[step.id + '_scan']} found={answer.found_items.filter((id: string) => step.items?.some(item => item.id === id))} onChange={(value, found) => update({ choices: { ...answer.choices, [step.id + '_scan']: value }, found_items: [...answer.found_items.filter((id: string) => !step.items?.some(item => item.id === id)), ...found] })} /> : <div className="scan-layout"><div>
 {step.scene === 'search' ? <div className="search-results"><div className="search-bar"><Search size={18}/>수아</div>{step.items?.map(it => <button key={it.id} className={'search-result ' + (answer.found_items.includes(it.id) ? 'selected' : '')} onClick={() => find(it.id)} aria-pressed={answer.found_items.includes(it.id)}><strong>{it.label}</strong>{it.text}</button>)}</div> : <div className="chat-window"><div className="chat-head">6학년 모아반 · 단체 대화</div>{step.items?.map(it => <button key={it.id} className={'chat-bubble ' + (answer.found_items.includes(it.id) ? 'selected' : '')} aria-pressed={answer.found_items.includes(it.id)} onClick={() => find(it.id)}>{it.id === 'c_photo' && <Camera size={23}/>} {it.text}</button>)}</div>}
 </div><aside className="scan-notes"><div className="scan-count"><b>{step.items?.filter(i => answer.found_items.includes(i.id)).length || 0}</b>곳을 찾았어요</div><ul className="found-list">{step.items?.filter(it => answer.found_items.includes(it.id)).map(it => <li key={it.id}><Check size={17}/>{it.label}</li>)}</ul><p className="muted">다 찾지 못해도 다음으로 갈 수 있어요.</p>{detail && <div className="feedback" role="status">{detail}</div>}</aside></div>)}
 {step.kind === 'choice' && <><RadioGroup className="choices" value={choice === undefined ? '' : String(choice)} onValueChange={v => pick(Number(v))}>{step.options!.map((op, i) => <label key={i} className={'choice ' + (choice === i ? 'selected' : '')} style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer' }}><RadioGroupItem value={String(i)} aria-label={op}/><span className="choice-number">{i + 1}</span>{op}</label>)}</RadioGroup>{choice !== undefined && <div className="feedback" role="status">{step.feedback?.[choice]}</div>}{step.id === 'p_now' && choice === 2 && <div className="pen-example">받는 분 김민서 · 010-0000-0000</div>}{step.reason && <label className="reason">내가 이렇게 생각한 이유 {requiresReason ? '' : '(선택)'}<textarea maxLength={300} value={answer.choices[reasonKey] || ''} onChange={e => update({ choices: { ...answer.choices, [reasonKey]: e.target.value } })} placeholder="내 생각을 한 줄로 적어 주세요."/></label>}{step.service && choice !== undefined && <Service type={step.service}/>}</>}
 {step.kind === 'settings' && <div className="settings-list">{[['location', '위치 정보 함께 올리기', '위치 표시를 끄면 사진에 장소가 자동으로 붙지 않아요.'], ['public', '모든 사람에게 계정 공개', '공개 범위를 친구만으로 바꿨어요.'], ['tag', '누구나 나를 태그할 수 있음', '친구만 나를 태그할 수 있어요.']].map(([key, label, help]) => { const on = answer.choices.s_settings?.[key] !== false; return <div key={key} className="setting-row"><div>{label}<small>{on ? '현재 켜져 있어요.' : help}</small></div><Switch checked={on} onCheckedChange={v => update({ choices: { ...answer.choices, s_settings: { ...answer.choices.s_settings, [key]: v } } })} aria-label={label}/></div>; })}</div>}
 {step.kind === 'accounts' && <><div className="account-list">{ACCOUNTS.map(([id, name, year, last]) => <div className="account-row" key={id}><div>{name}<small>{year}년 가입 · 마지막 접속 {last}</small></div><div className="segmented">{['남기기', '탈퇴하기'].map((v, i) => <button key={v} className={answer.choices.accounts?.[id] === v ? 'selected' : ''} aria-pressed={answer.choices.accounts?.[id] === v} onClick={() => update({ choices: { ...answer.choices, accounts: { ...answer.choices.accounts, [id]: v } } })}>{v}</button>)}</div></div>)}</div><Service type="leave"/><p className="muted">여기서는 가상 계정을 정리해요. 실제 사이트에서 탈퇴되지 않아요.</p></>}
 {step.kind === 'report' && <><div className="report-found">{answer.found_items.length}<span style={{ fontSize: 18, color: 'var(--muted)', marginLeft: 12 }}>개의 흔적을 찾았어요</span></div><div className="report-grid"><section><h3>찾아낸 흔적</h3><p>{riskItems(n, level).filter(i => answer.found_items.includes(i.id)).map(i => i.label).join(' · ') || '다시 살펴볼 수 있어요.'}</p></section><section><h3>이건 못 보고 지나갔어요</h3><p>{riskItems(n, level).filter(i => !answer.found_items.includes(i.id)).map(i => i.label).join(' · ') || '이번 자료의 흔적을 모두 찾았어요.'}</p></section></div><div className="report-list">{steps.filter(s => s.kind === 'choice').map(s => <div className="report-row" key={s.id}><span>{s.title}</span><b>{s.options?.[answer.choices[s.id]] || '선택하지 않음'}</b></div>)}</div><p className="report-ending">{c.ending}</p></>}
 <div className="activity-actions"><button className="secondary" onClick={() => move(n, Math.max(0, index - 1))} disabled={index === 0 || blocked}><ArrowLeft size={18}/>이전</button><div className="actions-right"><span className="save-status" role="status">{save}</span><button className="primary" onClick={next} disabled={!valid || blocked}>{blocked ? '저장 중…' : step.kind === 'intro' ? '의뢰 살펴보기' : step.kind === 'report' ? (n === 4 ? '나의 약속 쓰기' : '다음 사건') : '다음'}<ArrowRight size={18}/></button></div></div></>}
 </main></div></>;
}
