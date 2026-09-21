import { ANON_KEY } from './config';
export async function api(action: string, body: Record<string, unknown> = {}, token = '') {
    if (process.env.NODE_ENV === 'development' && token === 'preview-local') {
        const { previewApi } = await import('./preview');
        return previewApi(action, body);
    }
    const r = await fetch('/api/activity', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY, ...(token ? { 'x-session': token } : {}) }, body: JSON.stringify({ action, ...body }), signal: AbortSignal.timeout(20000) });
    let d: any;
    try {
        d = await r.json();
    }
    catch {
        throw new Error('서버에 연결하지 못했어요. 다시 시도해 주세요.');
    }
    if (!r.ok || d.error)
        throw new Error(d.error || '서버에 연결하지 못했어요.');
    return d;
}
