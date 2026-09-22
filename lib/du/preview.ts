import { DEFAULT_STAMP } from './stamp';
export const previewClass = { id: 'preview-class', code: '1234', school_name: '화면 검수용 수업', level: 'elementary' };
export const previewStudents = [{ id: 'preview-student', nickname: '모아', current_case: 1, current_step: 0 }, { id: 'preview-friend', nickname: '구름', current_case: 5, current_step: 0 }];
export const previewAnswers = [{ id: 'preview-answer', student_id: 'preview-friend', case_no: 1, found_items: ['p_name', 'p_phone'], choices: { p_now: 0, p_keep: 0, p_next: 1, p_connections_inquiry: { answers: { duplicate: { sources: ['label', 'receipt'], choice: 1, reason: 2, reviewed: true, attempts: 2, hints: 1 } } } }, completed: true }];
export const previewCards = [{ id: 'preview-card', student_id: 'preview-friend', surprise: '사진 배경에서도 정보를 알 수 있어요.', promise: '사진을 올리기 전에 배경을 살펴볼게요.', job_thought: '무엇을 지울지 판단하는 일', stamp: { ...DEFAULT_STAMP, coverage: 45 } }];
const state: any = { classroom: previewClass, students: previewStudents, answers: previewAnswers, cards: previewCards, votes: [] };
export function previewInitial(level: string, n = 1, index = 0) { return { classroom: { ...previewClass, level }, student: { ...previewStudents[0], current_case: n, current_step: index }, answers: [1, 2, 3, 4].map(case_no => ({ case_no, found_items: [], choices: {}, reason: '', completed: n === 5 })), card: null }; }
export async function previewApi(action: string, b: any) {
    const delay = typeof window === 'undefined' ? 0 : Math.min(5000, Math.max(0, Number(new URLSearchParams(window.location.search).get('saveDelay')) || 0));
    if (delay && ['save_answer', 'progress'].includes(action)) await new Promise(resolve => setTimeout(resolve, delay));
    if (action === 'classes')
    return { classes: [previewClass] }; if (action === 'board')
    return state; if (action === 'class_summary' || action === 'gallery')
    return { ...state, averages: [1, 2, 3, 4].map(case_no => ({ case_no, average: 2.5, count: 1 })) }; if (action === 'save_answer') {
    const a = { ...b, student_id: 'preview-student', id: 'preview-' + b.case_no };
    const i = state.answers.findIndex((r: any) => r.student_id === a.student_id && r.case_no === a.case_no);
    if (i >= 0)
        state.answers[i] = a;
    else
        state.answers.push(a);
} if (action === 'save_card') {
    const card = { ...b, id: 'preview-card-own', student_id: 'preview-student' };
    const i = state.cards.findIndex((c: any) => c.student_id === 'preview-student');
    if (i >= 0)
        state.cards[i] = card;
    else
        state.cards.push(card);
    return { card };
} if (action === 'vote')
    state.votes = [{ student_id: 'preview-student', card_id: b.card_id }]; return { ok: true }; }
