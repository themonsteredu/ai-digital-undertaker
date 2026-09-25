// Scripted real interactions in the app's dev-only preview (/qa?frame=1, local fake data).
import { session, record, BASE } from './rec.mjs';
const w = ms => new Promise(r => setTimeout(r, ms));
const which = process.argv[2];
const url = (n, step, kind = 'student') => `${BASE}/qa?frame=1&kind=${kind}&level=middle&n=${n}&step=${step}`;
// drag a mark on the evidence photo, in percent of the photo surface
async function mark(p, x, y, wd, ht) {
  const box = await p.locator('.evidence-surface').boundingBox();
  const X = v => box.x + box.width * v / 100, Y = v => box.y + box.height * v / 100;
  await p.mouse.move(X(x - 0.5), Y(y - 0.5)); await w(250); await p.mouse.down();
  await p.mouse.move(X(x + wd + 0.5), Y(y + ht + 0.5), { steps: 18 }); await w(120); await p.mouse.up(); await w(550);
}
await session(async p => {
  if (which === 'intro') {
    await p.goto(url(1, 0)); await w(2500);
    await record(p, 'intro', async () => {
      await w(2600);
      for (const t of ['SNS 사진', '옛날 계정', '단톡방']) { await p.locator('.case-nav button', { hasText: t }).click(); await w(2400); }
    });
  }
  if (which === 'scan') {
    await p.goto(url(1, 1)); await w(3000);
    await record(p, 'scan', async () => {
      await w(1200);
      await mark(p, 25, 47, 14, 7); await mark(p, 52, 47, 25, 7); await mark(p, 25, 55.5, 43, 11);
      await p.getByRole('button', { name: '구매 영수증' }).click(); await w(1500);
      await mark(p, 17, 30.5, 66, 15); await mark(p, 17, 64.5, 53, 13);
      await p.getByRole('button', { name: '표시한 곳 확인' }).click(); await w(3500);
    });
  }
  if (which === 'photo') {
    await p.goto(url(2, 1)); await w(3000);
    await record(p, 'photo', async () => {
      await w(1200);
      await mark(p, 23, 74, 10, 8); await mark(p, 73, 8, 23, 19); await mark(p, 74, 86, 14, 10);
      await p.getByRole('button', { name: '표시한 곳 확인' }).click(); await w(3500);
    });
  }
  if (which === 'choice') {
    await p.goto(url(1, 2)); await w(3000);
    await record(p, 'choice', async () => {
      await w(1200);
      const opts = p.locator('.choice-options label');
      await opts.nth(0).click(); await w(900);
      await p.getByRole('button', { name: '판단 확인' }).click(); await w(2200);
      await opts.nth(1).click(); await w(900);
      await p.getByRole('button', { name: '판단 확인' }).click(); await w(3200);
    });
  }
  if (which === 'inquiry') {
    await p.goto(url(1, 5)); await w(3000);
    await record(p, 'inquiry', async () => {
      await w(1200);
      await p.locator('.source-select').click(); await w(900);
      await p.locator('.source-tabs button').nth(1).click(); await w(1300);
      await p.locator('.source-select').click(); await w(900);
      await p.locator('.investigation-options label').nth(1).click(); await w(900);
      await p.getByRole('button', { name: '이유 선택하기' }).click(); await w(900);
      await p.locator('.investigation-options label').nth(2).click(); await w(900);
      await p.getByRole('button', { name: '판단 확인' }).click(); await w(3500);
    });
  }
  if (which === 'finish') {
    await p.goto(url(5, 0)); await w(3000);
    await p.getByRole('button', { name: '약속 카드 쓰기' }).click(); await w(1200);
    await record(p, 'card', async () => {
      await w(800);
      await p.locator('.pattern-buttons button').first().click(); await w(900);
      await p.locator('textarea').nth(1).pressSequentially('사진을 올리기 전에 배경과 작은 글씨를 먼저 살펴볼게요.', { delay: 70 }); await w(500);
      await p.locator('textarea').nth(2).pressSequentially('무엇을 지우고 무엇을 남길지 판단하는 일', { delay: 70 }); await w(1200);
    });
    await p.getByRole('button', { name: '저장하고 도장 만들기' }).click(); await w(1500);
    await record(p, 'stamp', async () => {
      await w(1000);
      await p.getByRole('button', { name: '격자', exact: true }).click(); await w(900);
      await p.getByRole('button', { name: '방패', exact: true }).click(); await w(900);
      await p.getByRole('button', { name: '둥근 사각형' }).click(); await w(900);
      await p.getByRole('button', { name: '여기에 찍어보기' }).click(); await w(3000);
    });
  }
  if (which === 'teacher') {
    await p.goto(url(1, 0, 'teacher')); await w(3500);
    await record(p, 'teacher', async () => {
      await w(2000);
      for (const t of ['선택과 발견', '약속 카드', '수업 슬라이드']) { await p.getByRole('tab', { name: t }).click(); await w(2300); }
    });
  }
});
