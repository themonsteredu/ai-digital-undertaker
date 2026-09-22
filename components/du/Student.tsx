"use client";
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Check, LogOut, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Sidebar, SidebarProvider, SidebarContent, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { CASES, stepsFor, riskItems, ACCOUNTS, Step, Level } from '@/lib/du/content';
import { api } from '@/lib/du/api';
import { AutosaveQueue, answerTask, readOutbox, type SaveState } from '@/lib/du/autosave';
import Finish from './Finish';
import EvidenceScanner from './EvidenceScanner';
import Investigation from './Investigation';
import ReasonedChoice from './ReasonedChoice';
import { inquiryComplete, inquiryFound, questionsFor, INQUIRIES, choiceComplete } from '@/lib/du/investigation';
import { reviewEvidence } from '@/lib/du/evidence';
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
    const [blocked, setBlocked] = useState(false);
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
    function move(nextN: number, nextI: number, latest = answer) {
        if (n < 5) persist(latest);
        saves.enqueue({ key: 'progress', action: 'progress', body: { current_case: nextN, current_step: nextI } });
        setN(nextN); setIndex(nextI);
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
    function next() {
        const a = step.kind === 'report' ? { ...answer, completed: true } : answer;
        if (step.kind === 'report') setAnswers(v => ({ ...v, [n]: a }));
        move(index === steps.length - 1 ? n + 1 : n, index === steps.length - 1 ? 0 : index + 1, a);
    }
    const reasonKey = step.id + '_reason';
    const visualScan = step.kind === 'scan' && !['search', 'chat'].includes(step.scene || '');
    const fitScreen = visualScan || step.kind === 'intro' || step.kind === 'inquiry';
    const valid = visualScan ? answer.choices[step.id + '_scan']?.reviewed === true && reviewEvidence(answer.choices[step.id + '_scan'], step, level).passed
        : step.kind === 'inquiry' ? inquiryComplete(step.id, answer.choices[step.id + '_inquiry'], level)
        : step.kind === 'choice' ? choiceComplete(step, choice, answer.choices[reasonKey] || '', answer.choices[step.id + '_review'], level)
        : step.kind === 'accounts' ? ACCOUNTS.every(a => answer.choices.accounts?.[a[0]])
        : step.kind === 'settings' ? ['location', 'public', 'tag'].every(k => answer.choices.s_settings?.[k] === false) : true;
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
    return <><header className={'app-header' + (n < 5 && fitScreen ? ' app-header-fit' : '')}><div className="brand"><ShieldCheck /><b>MOAKIT</b><span>DIGITAL PRIVACY LAB</span></div><div className="header-right"><span className="badge">{level === 'middle' ? '중등' : '초등'} 조사실</span><span>{initial.student.nickname} · {initial.classroom.code}</span><button className="icon-btn" aria-label="나가기" onClick={exit} disabled={blocked}><LogOut size={18}/></button></div></header><div className={'workspace' + (n < 5 && fitScreen ? ' workspace-fit' : '')}><SidebarProvider style={{ minHeight: 0, width: 'auto' }}><Sidebar collapsible="none" className="case-nav"><SidebarContent><span className="eyebrow">CASE FILES</span><SidebarMenu>{CASES.map(v => <SidebarMenuItem key={v.no}><button className={n === v.no ? 'active' : ''} onClick={() => move(v.no, 0)} disabled={blocked}><span className="nav-num">0{v.no}</span>{v.short}{answers[v.no]?.completed && <Check size={15}/>}</button></SidebarMenuItem>)}<SidebarMenuItem><button onClick={() => move(5, 0)} className={n === 5 ? 'active' : ''} disabled={blocked || !CASES.every(c => answers[c.no]?.completed)}>나의 약속과 도장</button></SidebarMenuItem></SidebarMenu><small>활동 내용은 자동으로 저장돼요.</small></SidebarContent></Sidebar></SidebarProvider><main className={'activity' + (n < 5 && fitScreen ? ' activity-fit' : '')}>
 {saveState.error && <div role="alert" className="error">{saveState.error} 작성한 내용은 유지하고 있어요. <button onClick={() => saves.retry().catch(() => {})}>다시 저장</button></div>}
 {n === 5 ? <Finish initial={{ ...initial, card: cardData }} answers={answers} token={token} onSaved={setCardData}/> : <><div className="activity-top"><span className="eyebrow">CASE 0{n} · {c.client}의 의뢰</span><div className="steps" aria-label={`${index + 1}/${steps.length} 단계`}>{steps.map((_, i) => <i className={i <= index ? 'done' : ''} key={i}/>)}</div></div><div className="activity-title"><h2>{step.title}</h2>{step.hint && <p>{step.hint}</p>}</div>
 {step.kind === 'intro' && <div className="intro"><div className="intro-visual"><img src={'/art/' + (['scene-parcel-photo.webp', 'scene-classroom-photo.webp', 'slide-03.png', 'slide-05.png'][n - 1])} alt={n === 1 ? '송장이 붙은 택배 상자와 구매 영수증' : c.short}/></div><div className="request"><span className="eyebrow">의뢰인 · {c.client}</span><blockquote>“{c.quote}”</blockquote></div></div>}
 {visualScan && <EvidenceScanner key={`${n}-${step.id}`} step={step} level={level} value={answer.choices[step.id + '_scan']} onChange={(value, found) => update({ choices: { ...answer.choices, [step.id + '_scan']: value }, found_items: [...answer.found_items.filter((id: string) => !step.items?.some(item => item.id === id)), ...found] })} />}
 {step.kind === 'inquiry' && <Investigation key={`${n}-${step.id}`} id={step.id} level={level} value={answer.choices[step.id + '_inquiry']} onChange={value => update({ choices: { ...answer.choices, [step.id + '_inquiry']: value }, found_items: [...answer.found_items.filter((id: string) => !step.items?.some(item => item.id === id)), ...inquiryFound(step.id, value, level)] })} />}
 {step.kind === 'choice' && <><ReasonedChoice key={`${n}-${step.id}`} step={step} level={level} choice={choice} reason={answer.choices[reasonKey] || ''} review={answer.choices[step.id + '_review']} onChange={(value, reason, review) => update({ choices: { ...answer.choices, [step.id]: value, [reasonKey]: reason, [step.id + '_review']: review } })} />{step.service && answer.choices[step.id + '_review']?.reviewed && valid && <Service type={step.service}/>}</>}
 {step.kind === 'settings' && <div className="settings-list">{[['location', '위치 정보 함께 올리기', '위치 표시를 끄면 사진에 장소가 자동으로 붙지 않아요.'], ['public', '모든 사람에게 계정 공개', '공개 범위를 친구만으로 바꿨어요.'], ['tag', '누구나 나를 태그할 수 있음', '친구만 나를 태그할 수 있어요.']].map(([key, label, help]) => { const on = answer.choices.s_settings?.[key] !== false; return <div key={key} className="setting-row"><div>{label}<small>{on ? '현재 켜져 있어요.' : help}</small></div><Switch checked={on} onCheckedChange={v => update({ choices: { ...answer.choices, s_settings: { ...answer.choices.s_settings, [key]: v } } })} aria-label={label}/></div>; })}</div>}
 {step.kind === 'accounts' && <><div className="account-list">{ACCOUNTS.map(([id, name, year, last]) => <div className="account-row" key={id}><div>{name}<small>{year}년 가입 · 마지막 접속 {last}</small></div><div className="segmented">{['남기기', '탈퇴하기'].map((v, i) => <button key={v} className={answer.choices.accounts?.[id] === v ? 'selected' : ''} aria-pressed={answer.choices.accounts?.[id] === v} onClick={() => update({ choices: { ...answer.choices, accounts: { ...answer.choices.accounts, [id]: v } } })}>{v}</button>)}</div></div>)}</div><Service type="leave"/><p className="muted">여기서는 가상 계정을 정리해요. 실제 사이트에서 탈퇴되지 않아요.</p></>}
 {step.kind === 'report' && <><div className="report-found">{answer.found_items.length}<span style={{ fontSize: 18, color: 'var(--muted)', marginLeft: 12 }}>개의 흔적을 찾았어요</span></div><div className="report-grid"><section><h3>찾아낸 흔적</h3><p>{riskItems(n, level).filter(i => answer.found_items.includes(i.id)).map(i => i.label).join(' · ') || '다시 살펴볼 수 있어요.'}</p></section><section><h3>이건 못 보고 지나갔어요</h3><p>{riskItems(n, level).filter(i => !answer.found_items.includes(i.id)).map(i => i.label).join(' · ') || '이번 자료의 흔적을 모두 찾았어요.'}</p></section></div><div className="report-list">{steps.filter(s => s.kind === 'choice').map(s => <div className="report-row" key={s.id}><span>{s.title}</span><b>{s.options?.[answer.choices[s.id]] || '선택하지 않음'}</b></div>)}</div><section className="inquiry-report"><h3>자료를 연결한 판단</h3>{steps.filter(s => s.kind === 'inquiry').flatMap(s => questionsFor(s.id, level).map(q => { const a = answer.choices[s.id + '_inquiry']?.answers?.[q.id]; return <div className="report-row" key={q.id}><div><span>{q.prompt}</span><p>{a?.choice !== undefined ? q.options[a.choice] : '아직 판단하지 않았어요.'}</p><small>근거: {INQUIRIES[s.id].sources.filter(source => a?.sources?.includes(source.id)).map(source => source.title).join(' · ') || '선택 전'}</small>{level === 'middle' && a?.reason !== undefined && <small>이유: {q.reasons[a.reason]}</small>}</div></div>; }))}</section><p className="report-ending">{c.ending}</p></>}
 <div className="activity-actions"><button className="secondary" onClick={() => move(n, Math.max(0, index - 1))} disabled={index === 0 || blocked}><ArrowLeft size={18}/>이전</button><div className="actions-right"><span className="save-status" role="status">{save}</span><button className="primary" onClick={next} disabled={!valid || blocked}>{blocked ? '저장 중…' : step.kind === 'intro' ? '의뢰 살펴보기' : step.kind === 'report' ? (n === 4 ? '나의 약속 쓰기' : '다음 사건') : '다음'}<ArrowRight size={18}/></button></div></div></>}
 </main></div></>;
}
