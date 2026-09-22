import test from 'node:test';
import assert from 'node:assert/strict';
import { INQUIRIES, questionsFor, inquiryCorrect, inquiryChecks, inquiryComplete, inquiryFound, choiceComplete } from '../lib/du/investigation.ts';
import { reviewEvidence } from '../lib/du/evidence.ts';

const answerFor = q => ({ sources: [...q.evidence], choice: q.answer, reason: q.reason, reviewed: true });
test('correct reasoning stays correct when evidence or conclusion needs revision', () => {
  const q = INQUIRIES.search.questions.find(q => q.id === 'uncertain');
  const a = answerFor(q);
  assert.deepEqual(inquiryChecks(q, { ...a, sources: ['blog'] }, 'middle'), { sources: false, choice: true, reason: true });
  assert.deepEqual(inquiryChecks(q, { ...a, choice: 0 }, 'middle'), { sources: true, choice: false, reason: true });
  assert.deepEqual(inquiryChecks(q, { ...a, reason: 0 }, 'middle'), { sources: true, choice: true, reason: false });
  assert.deepEqual(inquiryChecks(q, { ...a, reason: undefined }, 'elementary'), { sources: true, choice: true, reason: true });
});
const samplePhoto = { scene: 'classroom', items: [
  { id: 'name', x: 10, y: 20, w: 10, h: 5 },
  { id: 'school', x: 50, y: 30, w: 20, h: 10 },
] };
const mark = (x, y, w, h, document = 'scene') => ({ document, x, y, w, h });

test('empty, whole-page and random marks cannot pass even with legacy reviewed=true', () => {
  for (const marks of [[], [mark(0, 0, 100, 100)], [mark(80, 80, 8, 8)]]) {
    assert.equal(reviewEvidence({ marks, reviewed: true }, samplePhoto, 'middle').passed, false);
  }
});

test('middle needs distinct meaningful clues; elementary needs one; extra random marks invalidate', () => {
  const one = [mark(10, 20, 10, 5)];
  assert.equal(reviewEvidence({ marks: one }, samplePhoto, 'elementary').passed, true);
  assert.equal(reviewEvidence({ marks: [...one, ...one] }, samplePhoto, 'middle').passed, false);
  const both = [...one, mark(50, 30, 20, 10)];
  assert.equal(reviewEvidence({ marks: both }, samplePhoto, 'middle').passed, true);
  assert.equal(reviewEvidence({ marks: [...both, mark(80, 80, 8, 8)] }, samplePhoto, 'middle').passed, false);
});

test('both parcel documents must be investigated at either level', () => {
  const parcel = { scene: 'parcel', items: [{ id: 'p_name' }, { id: 'p_phone' }, { id: 'p_receipt' }] };
  const label = [mark(25, 47, 14, 7, 'label'), mark(52, 47, 25, 7, 'label')];
  for (const level of ['elementary', 'middle']) {
    assert.equal(reviewEvidence({ marks: label }, parcel, level).passed, false);
    assert.equal(reviewEvidence({ marks: [...label, mark(17, 64.5, 53, 13, 'receipt')] }, parcel, level).passed, true);
  }
});

test('each inquiry requires the evidence set, conclusion, middle reason, and explicit review', () => {
  for (const [id, inquiry] of Object.entries(INQUIRIES)) {
    const answers = Object.fromEntries(questionsFor(id, 'middle').map(q => [q.id, answerFor(q)]));
    assert.equal(inquiryComplete(id, { answers }, 'middle'), true, id);
    for (const q of questionsFor(id, 'middle')) {
      const a = answerFor(q);
      assert.equal(inquiryCorrect(q, { ...a, choice: (q.answer + 1) % q.options.length }, 'middle'), false);
      assert.equal(inquiryCorrect(q, { ...a, reason: (q.reason + 1) % q.reasons.length }, 'middle'), false);
      assert.equal(inquiryCorrect(q, { ...a, sources: a.sources.slice(1) }, 'middle'), false);
      assert.equal(inquiryCorrect(q, { ...a, sources: inquiry.sources.map(s => s.id) }, 'middle'), false);
      assert.equal(inquiryComplete(id, { answers: { ...answers, [q.id]: { ...a, reviewed: false } } }, 'middle'), false);
    }
  }
});

test('elementary omits advanced questions and reason selection, but still requires evidence', () => {
  for (const id of Object.keys(INQUIRIES)) {
    const answers = Object.fromEntries(questionsFor(id, 'elementary').map(q => [q.id, { ...answerFor(q), reason: undefined }]));
    assert.equal(inquiryComplete(id, { answers }, 'elementary'), true);
    assert.equal(inquiryComplete(id, undefined, 'elementary'), false);
  }
  assert.equal(questionsFor('s_connections', 'elementary').length, 1);
  assert.equal(questionsFor('s_connections', 'middle').length, 2);
});

test('unreviewed or wrong decisions do not add found items; saved answers round-trip', () => {
  const q = questionsFor('search', 'middle')[0];
  const value = { answers: { [q.id]: answerFor(q) } };
  assert.deepEqual(inquiryFound('search', JSON.parse(JSON.stringify(value)), 'middle'), ['a_greeting']);
  value.answers[q.id].reviewed = false;
  assert.deepEqual(inquiryFound('search', value, 'middle'), []);
});

test('processing choices reject unsafe answers and premature next; open choices retain alternatives', () => {
  const closed = { id: 'p_now' };
  assert.equal(choiceComplete(closed, 0, '', { reviewed: true }, 'middle'), false);
  assert.equal(choiceComplete(closed, 1, '', {}, 'middle'), false);
  assert.equal(choiceComplete(closed, 1, '', { reviewed: true }, 'middle'), true);
  for (const i of [0, 1, 2]) assert.equal(choiceComplete({ id: 'p_next', reason: true }, i, '전화번호 노출을 줄이려고', { reviewed: true }, 'middle'), true);
  assert.equal(choiceComplete({ id: 'p_next', reason: true }, 0, '   ', { reviewed: true }, 'middle'), false);
});
