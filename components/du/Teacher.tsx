"use client";
import { useEffect, useState } from 'react';
import { ShieldCheck, LogOut, Plus, ArrowLeft, ArrowRight, Trash2, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { api } from '@/lib/du/api';
import { CASES, riskItems, stepsFor } from '@/lib/du/content';
import { INQUIRIES, questionsFor, inquiryCorrect } from '@/lib/du/investigation';
import { Gallery, StampCanvas } from './Finish';
import LessonSlides from './LessonSlides';
function Bar({ label, count, total }: {
    label: string;
    count: number;
    total: number;
}) { return <div className="bar-row"><span>{label}</span><b>{count}명 · {total ? Math.round(count / total * 100) : 0}%</b><div className="bar-track"><div className="bar-fill" style={{ width: (total ? count / total * 100 : 0) + '%' }}/></div></div>; }
export default function Teacher({ token, onExit }: {
    token: string;
    onExit: () => void;
}) {
    const [classes, setClasses] = useState<any[]>([]), [classId, setClassId] = useState(''), [board, setBoard] = useState<any>(null), [school, setSchool] = useState(''), [level, setLevel] = useState('elementary'), [error, setError] = useState(''), [createOpen, setCreateOpen] = useState(false), [deleteOpen, setDeleteOpen] = useState(false), [confirm, setConfirm] = useState(''), [busy, setBusy] = useState(false), [updated, setUpdated] = useState(''), [cardIndex, setCardIndex] = useState<number | null>(null), [tab, setTab] = useState('status');
    async function loadClasses() { const d = await api('classes', {}, token); setClasses(d.classes); if (!classId && d.classes.length)
        setClassId(d.classes[0].id); }
    useEffect(() => { loadClasses().catch(e => setError(e.message)); }, [token]);
    useEffect(() => { if (!classId) {
        setBoard(null);
        return;
    } let active = true, working = false; setBoard(null); const refresh = async () => { if (working)
        return; working = true; try {
        const d = await api('board', { class_id: classId }, token);
        if (active) {
            setBoard(d);
            setError('');
            setUpdated(new Date().toLocaleTimeString('ko-KR'));
        }
    }
    catch (e: any) {
        if (active)
            setError(e.message);
    }
    finally {
        working = false;
    } }; refresh(); const interval = setInterval(refresh, 3000); return () => { active = false; clearInterval(interval); }; }, [classId, token]);
    async function create(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(''); try {
        const d = await api('create_class', { school_name: school, level }, token);
        setClasses(c => [d.classroom, ...c]);
        setClassId(d.classroom.id);
        setCreateOpen(false);
        setSchool('');
        setTab('status');
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    async function remove() { setBusy(true); try {
        await api('delete_class', { class_id: classId, confirm_code: confirm }, token);
        const rest = classes.filter(c => c.id !== classId);
        setClasses(rest);
        setClassId(rest[0]?.id || '');
        setBoard(null);
        setDeleteOpen(false);
        setConfirm('');
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    const found = board?.answers.reduce((sum: number, a: any) => sum + a.found_items.length, 0) || 0;
    const left = board?.answers.reduce((sum: number, a: any) => sum + Object.values(a.choices.accounts || {}).filter(v => v === '탈퇴하기').length, 0) || 0;
    const removed = board?.answers.reduce((sum: number, a: any) => sum + (a.choices.s_mine === 0 ? 1 : 0) + (a.choices.a_active === 0 ? 1 : 0), 0) || 0;
    const misses = board ? CASES.flatMap(c => riskItems(c.no, board.classroom.level).map(i => ({ ...i, count: board.answers.filter((a: any) => a.case_no === c.no && a.completed && !a.found_items.includes(i.id)).length }))).filter(i => i.count > 0).sort((a, b) => b.count - a.count).slice(0, 3) : [];
    const inquiryRows = board ? board.answers.flatMap((a: any) => stepsFor(a.case_no, board.classroom.level).filter(step => step.kind === 'inquiry').flatMap(step => questionsFor(step.id, board.classroom.level).filter(q => a.choices[step.id + '_inquiry']?.answers?.[q.id]?.attempts).map(q => ({ question: q, inquiry: step.id, answer: a.choices[step.id + '_inquiry'].answers[q.id], student: board.students.find((student: any) => student.id === a.student_id)?.nickname || '학생', key: a.student_id + step.id + q.id })))) : [];
    const questions = board ? CASES.flatMap(c => stepsFor(c.no, board.classroom.level).filter(s => s.kind === 'choice').map(s => ({ ...s, case_no: c.no, rows: board.answers.filter((a: any) => a.case_no === c.no && a.choices[s.id] !== undefined) }))).filter(s => new Set(s.rows.map((a: any) => a.choices[s.id])).size > 1 || s.id === 's_debate' && s.rows.length) : [];
    const card = cardIndex !== null ? board?.cards[cardIndex] : null;
    return <><header className="app-header"><div className="brand"><ShieldCheck /><b>MOAKIT</b><span>TEACHER DESK</span></div><div className="header-right"><span>교사 화면</span><button className="icon-btn" aria-label="교사 나가기" onClick={onExit}><LogOut size={18}/></button></div></header><main className="teacher"><div className="teacher-head"><div><span className="eyebrow">DIGITAL PRIVACY LAB</span><h1>교사 조사실</h1></div><div className="teacher-controls">{classes.length > 0 && <Select value={classId} onValueChange={setClassId}><SelectTrigger aria-label="수업 선택" style={{ minWidth: 240, height: 49 }}><SelectValue placeholder="수업 선택"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.code} · {c.school_name || '이름 없는 수업'}</SelectItem>)}</SelectContent></Select>}<button className="primary" onClick={() => setCreateOpen(true)}><Plus size={18}/>수업 만들기</button></div></div>{error && !createOpen && !deleteOpen && <div className="error" role="alert">{error}</div>}
    <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="status">학생 현황</TabsTrigger><TabsTrigger value="board">선택과 발견</TabsTrigger><TabsTrigger value="cards">약속 카드</TabsTrigger><TabsTrigger value="gallery">도장 갤러리</TabsTrigger><TabsTrigger value="slides">수업 슬라이드</TabsTrigger></TabsList>
    {tab !== 'slides' && (board ? <div className="class-code"><div><p>{board.classroom.school_name || '우리 반'} · {board.classroom.level === 'middle' ? '중등' : '초등'}</p><b>{board.classroom.code}</b></div><div><p>{board.students.length}명 참여 중</p><p style={{ fontSize: 12 }}>3초마다 갱신 · {updated}</p></div></div> : <div className="empty">{classId ? '수업 기록을 불러오고 있어요.' : '수업을 만들면 학생들이 코드로 들어올 수 있어요.'}</div>)}
    <TabsContent value="status">{board && <><div className="numbers"><div><strong>{found}</strong><span>찾아낸 흔적</span></div><div><strong>{left}</strong><span>탈퇴를 선택한 가상 계정</span></div><div><strong>{removed}</strong><span>삭제를 선택한 가상 글</span></div></div><h3 style={{ marginBottom: 15 }}>학생 진행 상황</h3>{board.students.length ? <Table><TableHeader><TableRow><TableHead>별명</TableHead><TableHead>사건별 완료</TableHead><TableHead>지금 활동</TableHead><TableHead>약속 카드</TableHead></TableRow></TableHeader><TableBody>{board.students.map((s: any) => <TableRow key={s.id}><TableCell><b>{s.nickname}</b></TableCell><TableCell><div className="progress-dots">{CASES.map(c => <span key={c.no} className={board.answers.some((a: any) => a.student_id === s.id && a.case_no === c.no && a.completed) ? 'yes' : ''}>{c.no}</span>)}</div></TableCell><TableCell>{s.current_case === 5 ? '약속·도장' : `사건 ${s.current_case} · ${stepsFor(s.current_case, board.classroom.level)[s.current_step]?.title || '진행 중'}`}</TableCell><TableCell>{board.cards.some((c: any) => c.student_id === s.id) ? '작성함' : '아직'}</TableCell></TableRow>)}</TableBody></Table> : <div className="empty">학생이 들어오면 여기에 표시돼요.</div>}<div className="danger-zone"><button className="danger-btn" onClick={() => setDeleteOpen(true)}><Trash2 size={18}/>이 수업 기록 전체 삭제</button></div></>}</TabsContent>
    <TabsContent value="board">{board && <div className="board-grid"><section className="board-section"><h3>가장 많이 놓친 것</h3>{misses.length ? misses.map((m, i) => <Bar key={m.id} label={`${i + 1}. ${m.label}`} count={m.count} total={board.students.length}/>) : <div className="empty">완료한 사건의 놓친 항목이 모여요.</div>}<p className="muted">완료한 사건만 집계해요. 학생의 등수는 매기지 않아요.</p></section><section className="board-section"><h3>선택이 갈린 문제</h3>{questions.length ? questions.map(q => <div className="bars" key={q.id}><h3 style={{ fontSize: 18 }}>사건 {q.case_no} · {q.title}</h3>{q.options?.map((op, i) => <Bar key={op} label={op} count={q.rows.filter((a: any) => a.choices[q.id] === i).length} total={q.rows.length}/>)}{q.id === 's_debate' && q.rows.map((a: any) => <p key={a.id} className="feedback"><b>{board.students.find((s: any) => s.id === a.student_id)?.nickname}</b> · {a.choices.s_debate_reason || '이유 작성 중'}</p>)}</div>) : <div className="empty">서로 다른 선택이 나오면 비교해 볼 수 있어요.</div>}</section><section className="teacher-inquiries"><h3>자료를 연결한 판단</h3><p className="muted">정답 개수보다 학생이 고른 근거와 이유를 함께 살펴보세요.</p>{inquiryRows.length ? inquiryRows.map((row: any) => <details key={row.key}><summary>{row.student} · {row.question.prompt} · {row.answer.reviewed && inquiryCorrect(row.question, row.answer, board.classroom.level) ? '확인함' : '다시 살펴보는 중'}</summary><p>판단: {row.question.options[row.answer.choice]}</p><p>근거: {INQUIRIES[row.inquiry].sources.filter(source => row.answer.sources.includes(source.id)).map(source => source.title).join(' · ')}</p>{row.answer.reason !== undefined && <p>이유: {row.question.reasons[row.answer.reason]}</p>}<small>확인 {row.answer.attempts}회 · 힌트 {row.answer.hints || 0}단계</small></details>) : <p>학생이 판단을 확인하면 근거와 이유가 여기에 모여요.</p>}</section></div>}</TabsContent>
    <TabsContent value="cards">{board?.cards.length ? <div className="card-wall">{board.cards.map((c: any, i: number) => <button className="promise-tile" key={c.id} onClick={() => setCardIndex(i)}><span className="eyebrow">MY PRIVACY PROMISE</span><p>{c.promise || '약속 작성 중'}</p><span className="muted">{board.students.find((s: any) => s.id === c.student_id)?.nickname}</span></button>)}</div> : <div className="empty">학생들의 약속 카드가 여기에 모여요.</div>}</TabsContent>
    <TabsContent value="gallery"><Gallery data={board}/></TabsContent><TabsContent value="slides"><LessonSlides /></TabsContent></Tabs>
    <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogTitle>새 수업 만들기</DialogTitle><DialogDescription>학생들이 사용할 난이도를 골라 주세요.</DialogDescription><form onSubmit={create} className="form-stack"><label>수업 이름<input value={school} maxLength={60} onChange={e => setSchool(e.target.value)} placeholder="예: 모아초 6학년"/></label><RadioGroup value={level} onValueChange={setLevel}><label style={{ flexDirection: 'row', alignItems: 'center' }}><RadioGroupItem value="elementary"/>초등 고학년</label><label style={{ flexDirection: 'row', alignItems: 'center' }}><RadioGroupItem value="middle"/>중학생</label></RadioGroup>{error && <p className="error">{error}</p>}<button className="primary" disabled={busy}>{busy ? '만드는 중…' : '수업코드 만들기'}</button></form></DialogContent></Dialog>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent><AlertDialogTitle>이 수업의 기록을 모두 지울까요?</AlertDialogTitle><AlertDialogDescription>학생 기록, 약속 카드, 도장과 투표가 함께 삭제됩니다. 다시 되돌릴 수 없습니다.</AlertDialogDescription><label>삭제할 수업코드 {board?.classroom.code}<input value={confirm} inputMode="numeric" maxLength={4} onChange={e => setConfirm(e.target.value)}/></label>{error && <p className="error">{error}</p>}<AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><button className="danger-btn" disabled={busy || confirm !== board?.classroom.code} onClick={remove}>전체 삭제</button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <Dialog open={cardIndex !== null} onOpenChange={v => !v && setCardIndex(null)}><DialogContent style={{ maxWidth: 'min(1000px,95vw)', minHeight: '75vh' }}><DialogTitle>우리 반 약속 카드</DialogTitle><DialogDescription>{card && board.students.find((s: any) => s.id === card.student_id)?.nickname}</DialogDescription>{card && <div className="full-card"><span className="eyebrow">앞으로 지킬 나의 약속</span><blockquote>{card.promise}</blockquote><p>놀랐던 것 · {card.surprise}</p>{card.job_thought && <p>이 직업에서 어려운 일 · {card.job_thought}</p>}<div className="slides-nav"><button onClick={() => setCardIndex((cardIndex! + board.cards.length - 1) % board.cards.length)}><ArrowLeft size={18}/>이전 카드</button><span>{cardIndex! + 1} / {board.cards.length}</span><button onClick={() => setCardIndex((cardIndex! + 1) % board.cards.length)}>다음 카드<ArrowRight size={18}/></button></div></div>}</DialogContent></Dialog>
    </main></>;
}
