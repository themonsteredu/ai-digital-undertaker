"use client";
import { useState, useEffect } from 'react';
import Student from '@/components/du/Student';
import Teacher from '@/components/du/Teacher';
import { previewInitial } from '@/lib/du/preview';
export default function QA() { const [params, setParams] = useState<URLSearchParams | null>(null), [width, setWidth] = useState(1280), [kind, setKind] = useState('student'), [level, setLevel] = useState('elementary'), [n, setN] = useState(1); useEffect(() => setParams(new URLSearchParams(location.search)), []); if (process.env.NODE_ENV !== 'development')
    return <p>페이지를 찾을 수 없습니다.</p>; if (!params)
    return null; if (params.get('frame'))
    return params.get('kind') === 'teacher' ? <Teacher token="preview-local" onExit={() => { }}/> : <Student initial={previewInitial(params.get('level') || 'elementary', Number(params.get('n') || 1), Number(params.get('step') || 0))} token="preview-local" onExit={() => { }}/>; return <main style={{ padding: 15 }}><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 15 }}>{[1280, 820, 390].map(w => <button key={w} onClick={() => setWidth(w)}>{w}px</button>)}<button onClick={() => setKind(kind === 'student' ? 'teacher' : 'student')}>{kind === 'student' ? '교사 화면 보기' : '학생 화면 보기'}</button><button onClick={() => setLevel(level === 'elementary' ? 'middle' : 'elementary')}>{level === 'elementary' ? '중등으로' : '초등으로'}</button>{[1, 2, 3, 4, 5].map(v => <button key={v} onClick={() => setN(v)}>{v === 5 ? '약속·도장' : `사건 ${v}`}</button>)}</div><iframe title="기기별 화면 검수" src={`/qa?frame=1&kind=${kind}&level=${level}&n=${n}`} style={{ width, maxWidth: 'none', height: 900, border: '1px solid #ddd' }}/></main>; }
