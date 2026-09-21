import { ENDPOINT, ANON_KEY } from '@/lib/du/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: '허용되지 않은 앱 주소입니다.' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ error: '지원하지 않는 요청입니다.' }, { status: 415 });
  }
  const body = await request.text();
  if (body.length > 32000) {
    return Response.json({ error: '입력 내용이 너무 길어요.' }, { status: 413 });
  }
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
        'x-session': request.headers.get('x-session') || '',
        'x-forwarded-for': request.headers.get('x-forwarded-for') || 'vercel',
      },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(18000),
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ error: '서버에 연결하지 못했어요. 다시 시도해 주세요.' }, { status: 502 });
  }
}
