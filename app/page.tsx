"use client";
import { useEffect, useState } from 'react';
import { ShieldCheck, ArrowRight, Settings2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { api } from '@/lib/du/api';
import Student from '@/components/du/Student';
import Teacher from '@/components/du/Teacher';
export default function Home() {
    const [code, setCode] = useState(''), [nickname, setNickname] = useState(''), [mode, setMode] = useState('join'), [error, setError] = useState(''), [busy, setBusy] = useState(false), [session, setSession] = useState<any>(null), [initial, setInitial] = useState<any>(null), [teacherOpen, setTeacherOpen] = useState(false), [password, setPassword] = useState(''), [ready, setReady] = useState(false);
    useEffect(() => { let cancelled = false; try {
        const raw = localStorage.getItem('du-session');
        const saved = raw ? JSON.parse(raw) : null;
        const last = JSON.parse(localStorage.getItem('du-last') || 'null');
        if (last) {
            setCode(last.code);
            setNickname(last.nickname);
            setMode('resume');
        }
        if (saved) {
            if (saved.role === 'teacher') {
                api('classes', {}, saved.token).then(() => { if (!cancelled)
                    setSession(saved); }).catch(() => localStorage.removeItem('du-session')).finally(() => !cancelled && setReady(true));
                return () => { cancelled = true; };
            }
            api('state', {}, saved.token).then(d => { if (!cancelled) {
                setInitial(d);
                setSession(saved);
            } }).catch(() => localStorage.removeItem('du-session')).finally(() => !cancelled && setReady(true));
            return () => { cancelled = true; };
        }
    }
    catch { } setReady(true); return () => { cancelled = true; }; }, []);
    async function join(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(''); try {
        const d = await api(mode, { code, nickname });
        const s = { token: d.token, role: 'student' };
        localStorage.setItem('du-session', JSON.stringify(s));
        localStorage.setItem('du-last', JSON.stringify({ code, nickname: d.student.nickname }));
        setInitial(d);
        setSession(s);
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    async function teacher(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(''); try {
        const d = await api('teacher_login', { password });
        const s = { token: d.token, role: 'teacher' };
        localStorage.setItem('du-session', JSON.stringify(s));
        setSession(s);
        setTeacherOpen(false);
        setPassword('');
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    function exit() { if (session)
        api('logout', {}, session.token).catch(() => { }); localStorage.removeItem('du-session'); setSession(null); setInitial(null); setError(''); }
    if (!ready)
        return <main className="loading">저장된 수업을 확인하고 있어요.</main>;
    if (session?.role === 'teacher')
        return <Teacher token={session.token} onExit={exit}/>;
    if (session?.role === 'student' && initial)
        return <Student initial={initial} token={session.token} onExit={exit}/>;
    return <main className="entry"><header className="brand"><ShieldCheck /><b>MOAKIT</b><span>CAREER STUDIO</span></header><section className="entry-layout"><div className="entry-story"><span className="eyebrow">DIGITAL PRIVACY LAB</span><h1>디지털 장의사</h1><p>누군가 남긴 흔적, 어디까지 지울 수 있을까?</p><img className="entry-art" src="/art/slide-01.png" alt="디지털 기록을 살펴보는 조사실 책상"/><div className="entry-cases">{['택배 상자', 'SNS 사진', '옛날 계정', '단톡방'].map((v, i) => <span key={v}><b>0{i + 1}</b>{v}</span>)}</div></div><form className="join-panel" onSubmit={join}><div><span className="eyebrow">오늘의 조사 시작하기</span><h2 style={{ marginTop: 12 }}>수업에 들어가기</h2></div><Tabs value={mode} onValueChange={setMode}><TabsList><TabsTrigger value="join">처음 참여</TabsTrigger><TabsTrigger value="resume">이어서 하기</TabsTrigger></TabsList></Tabs><label>수업코드<InputOTP maxLength={4} value={code} onChange={v => setCode(v.replace(/\D/g, ''))} inputMode="numeric" aria-label="수업코드"><InputOTPGroup>{[0, 1, 2, 3].map(i => <InputOTPSlot key={i} index={i} style={{ height: 56, width: 56, fontSize: 26 }}/>)}</InputOTPGroup></InputOTP></label><label>별명<input maxLength={mode === 'resume' ? 24 : 16} value={nickname} onChange={e => setNickname(e.target.value)} placeholder="수업에서 사용할 별명" autoComplete="off" required/></label><p className="muted">{mode === 'join' ? '실명 대신 별명을 써 주세요. 같은 별명은 숫자로 구분해요.' : '처음에 안내받은 별명을 숫자까지 그대로 적어 주세요.'}</p>{error && !teacherOpen && <div className="error" role="alert">{error}</div>}<button className="primary" disabled={busy || code.length !== 4 || !nickname.trim()}>{busy ? '입장 중…' : '조사실 입장'}<ArrowRight size={20}/></button></form></section><footer><span>MOAKIT · 디지털 개인정보 보호 진로 체험</span><button className="icon-btn" aria-label="교사 화면" onClick={() => { setTeacherOpen(true); setError(''); }}><Settings2 size={20}/></button></footer><Dialog open={teacherOpen} onOpenChange={setTeacherOpen}><DialogContent><DialogTitle>교사 화면</DialogTitle><DialogDescription>교사용 비밀번호를 입력해 주세요.</DialogDescription><form onSubmit={teacher} className="form-stack"><label>비밀번호<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoFocus maxLength={20}/></label>{error && <div className="error" role="alert">{error}</div>}<button className="primary" disabled={busy}>교사 화면 열기</button></form></DialogContent></Dialog></main>;
}
