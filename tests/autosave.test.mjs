import test from 'node:test';
import assert from 'node:assert/strict';
import { AutosaveQueue, answerTask } from '../lib/du/autosave.ts';

const answer = (value, caseNo = 1) => answerTask(caseNo, { choices: { choice: value } });
const progress = step => ({ key: 'progress', action: 'progress', body: { current_case: 1, current_step: step } });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const setup = options => new AutosaveQueue({ report() {}, delay: 10000, ...options });

test('twenty rapid edits send only the latest answer; unchanged navigation does not save it again', async () => {
  const calls = [];
  const q = setup({ send: async task => calls.push(task) });
  for (let i = 0; i < 20; i++) q.enqueue(answer(i));
  await q.flush();
  q.enqueue(answer(19)); q.enqueue(progress(2));
  await q.flush();
  assert.deepEqual(calls.map(t => t.action), ['save_answer', 'progress']);
  assert.equal(calls[0].body.choices.choice, 19);
});

test('a slow in-flight save cannot overwrite newer choices, and progress waits for answers', async () => {
  const first = deferred(), calls = [];
  const q = setup({ send: async task => { calls.push(task); if (calls.length === 1) await first.promise; } });
  q.enqueue(answer(0)); const saving = q.flush();
  q.enqueue(progress(1));
  for (let i = 1; i <= 20; i++) q.enqueue(answer(i));
  q.enqueue(progress(4));
  first.resolve(); await saving;
  assert.deepEqual(calls.map(t => t.action), ['save_answer', 'save_answer', 'progress']);
  assert.equal(calls[1].body.choices.choice, 20);
  assert.equal(calls[2].body.current_step, 4);
  assert.equal(q.hasPending(), false);
});

test('different cases retain their own answers', async () => {
  const calls = [];
  const q = setup({ send: async task => calls.push(task) });
  q.enqueue(answer('first', 1)); q.enqueue(answer('second', 2)); q.enqueue(answer('latest', 1));
  await q.flush();
  assert.deepEqual(calls.map(t => [t.body.case_no, t.body.choices.choice]), [[1, 'latest'], [2, 'second']]);
});

test('failed saves retain the latest snapshot, block flush, and recover on retry', async () => {
  let fail = true, checkpoint = [], status;
  const calls = [];
  const q = setup({ send: async task => { if (fail) throw new Error('offline'); calls.push(task); }, checkpoint: tasks => { checkpoint = tasks; }, report: value => { status = value; } });
  q.enqueue(answer('old'));
  await assert.rejects(q.flush(), /offline/);
  q.enqueue(answer('new')); q.enqueue(progress(3));
  assert.equal(checkpoint[0].body.choices.choice, 'new');
  assert.equal(status.error, 'offline');
  fail = false; await q.retry();
  assert.equal(calls[0].body.choices.choice, 'new');
  assert.equal(checkpoint.length, 0);
  assert.deepEqual(status, { pending: false, error: '' });
});

test('pending snapshots can be restored after reload and completion is retained', async () => {
  let persisted = [];
  const q = setup({ send: async () => {}, checkpoint: tasks => { persisted = tasks; } });
  q.enqueue(answerTask(4, { choices: {}, found_items: ['last'], completed: true }));
  q.enqueue({ ...progress(0), body: { current_case: 5, current_step: 0 } });
  q.pauseTimer();
  const calls = [];
  const restored = setup({ initial: JSON.parse(JSON.stringify(persisted)), send: async task => calls.push(task) });
  await restored.flush();
  assert.equal(calls[0].body.completed, true);
  assert.equal(calls[1].body.current_case, 5);
});

test('server-loaded answers do not cause unnecessary writes', async () => {
  const calls = [];
  const q = setup({ baseline: [answer(1)], send: async task => calls.push(task) });
  q.enqueue(answer(1)); await q.flush();
  assert.equal(calls.length, 0);
});
