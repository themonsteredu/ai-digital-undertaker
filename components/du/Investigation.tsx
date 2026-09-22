"use client";
import { useRef, useState } from 'react';
import type { Level } from '@/lib/du/content';
import { INQUIRIES, inquiryCorrect, inquiryChecks, questionsFor, type InquiryValue, type InquiryAnswer } from '@/lib/du/investigation';

export function Hint({ hints, count, onMore }: { hints: string[]; count: number; onMore: () => void }) {
  return <div className="investigation-hint"><button type="button" className="hint-button" onClick={onMore} disabled={count >= hints.length}>{count === 0 ? '힌트가 필요해요' : count < hints.length ? '힌트 더 보기' : '힌트를 모두 봤어요'}</button>{count > 0 && <p role="status">{hints[Math.min(count, hints.length) - 1]}</p>}</div>;
}

export default function Investigation({ id, level, value, onChange }: {
  id: string; level: Level; value?: InquiryValue; onChange: (value: InquiryValue) => void;
}) {
  const inquiry = INQUIRIES[id], questions = questionsFor(id, level);
  const index = Math.min(value?.current || 0, questions.length - 1), question = questions[index];
  const answer: InquiryAnswer = value?.answers?.[question.id] || { sources: [] };
  const [viewedSource, setViewedSource] = useState({ questionId: question.id, sourceId: question.focusSource || inquiry.sources[0].id });
  // A saved question may change independently of the last opened document.
  const sourceId = viewedSource.questionId === question.id ? viewedSource.sourceId : question.focusSource || inquiry.sources[0].id;
  const [panel, setPanel] = useState<'sources' | 'judgment'>('sources');
  const imageDialog = useRef<HTMLDialogElement>(null);
  const [answerPart, setAnswerPart] = useState<'choice' | 'reason'>('choice');
  const source = inquiry.sources.find(s => s.id === sourceId) || inquiry.sources[0];
  const correct = answer.reviewed && inquiryCorrect(question, answer, level);
  const checks = inquiryChecks(question, answer, level);
  const reviewParts = [
    { key: 'sources' as const, label: '자료 선택' },
    { key: 'choice' as const, label: '내 판단' },
    ...(level === 'middle' ? [{ key: 'reason' as const, label: '판단 이유' }] : []),
  ];
  const ready = answer.sources.length > 0 && answer.choice !== undefined && (level === 'elementary' || answer.reason !== undefined);
  function update(change: Partial<InquiryAnswer>, edit = true) {
    onChange({ ...value, answers: { ...value?.answers, [question.id]: { ...answer, ...change, ...(edit ? { reviewed: false } : {}) } } });
  }
  function toggleSource() { update({ sources: answer.sources.includes(source.id) ? answer.sources.filter(id => id !== source.id) : [...answer.sources, source.id] }); }
  function selectQuestion(next: number) {
    const nextQuestion = questions[next];
    onChange({ ...value, current: next });
    setViewedSource({ questionId: nextQuestion.id, sourceId: nextQuestion.focusSource || inquiry.sources[0].id });
    setPanel('sources'); setAnswerPart('choice');
  }
  return <div className={'investigation-layout showing-' + panel}>
    <div className="investigation-mobile-tabs" aria-label="조사 화면 전환"><button aria-pressed={panel === 'sources'} onClick={() => setPanel('sources')}>자료</button><button aria-pressed={panel === 'judgment' && answerPart === 'choice'} onClick={() => { setPanel('judgment'); setAnswerPart('choice'); }}>내 판단</button>{level === 'middle' && <button aria-pressed={panel === 'judgment' && answerPart === 'reason'} onClick={() => { setPanel('judgment'); setAnswerPart('reason'); }}>판단 이유</button>}</div>
    <section className="investigation-sources" aria-label="조사 자료">
      <p className="mobile-source-question"><small>질문 {index + 1} / {questions.length}</small>{question.prompt}</p>
      <div className="source-tabs" aria-label="자료 선택">{inquiry.sources.map(s => <button key={s.id} aria-pressed={s.id === source.id} onClick={() => setViewedSource({ questionId: question.id, sourceId: s.id })}>{s.title}{answer.sources.includes(s.id) && <span aria-label="근거로 선택함"> ✓</span>}</button>)}</div>
      <article className={'source-document' + (source.image ? ' has-image' : '')}>
        {!source.image && <h4 className="source-heading">{source.title}</h4>}
        {source.image && <img src={'/art/' + source.image} alt={source.title + ' 조사 사진'} />}
        <p>{source.text}</p>
      </article>
      {source.image && <><button className="photo-expand" onClick={() => imageDialog.current?.showModal()}>사진 크게 보기</button><dialog className="source-photo-dialog" ref={imageDialog} aria-label="조사 사진 확대"><button className="secondary" onClick={() => imageDialog.current?.close()}>닫기</button><img src={'/art/' + source.image} alt={source.title + ' 확대 사진'} /></dialog></>}
      <label className="source-select"><input type="checkbox" checked={answer.sources.includes(source.id)} onChange={toggleSource} />이 자료를 판단의 근거로 선택</label>
      <p className="source-reminder">관련된 자료만 골라 주세요. 모두 수업용 가상 자료입니다.</p>
    </section>
    <section className="investigation-judgment" aria-label="내 판단"><div className="judgment-scroll">
      {questions.length > 1 && <nav className="question-tabs" aria-label="조사 질문">{questions.map((q, i) => <button key={q.id} aria-pressed={i === index} onClick={() => selectQuestion(i)}>질문 {i + 1}{value?.answers?.[q.id]?.reviewed && inquiryCorrect(q, value.answers[q.id], level) ? ' ✓' : ''}</button>)}</nav>}
      <h3>{question.prompt}</h3>
      {level === 'middle' && <nav className="judgment-parts" aria-label="판단 작성 순서"><button aria-pressed={answerPart === 'choice'} onClick={() => setAnswerPart('choice')}>1. 내 판단</button><button aria-pressed={answerPart === 'reason'} onClick={() => setAnswerPart('reason')}>2. 판단 이유</button></nav>}
      {(level === 'elementary' || answerPart === 'choice') && <fieldset className="investigation-options"><legend>내 판단</legend>{question.options.map((option, i) => <label key={option}><input type="radio" name={id + question.id + '-choice'} checked={answer.choice === i} onChange={() => update({ choice: i })}/><span>{option}</span></label>)}</fieldset>}
      {level === 'middle' && answerPart === 'reason' && <fieldset className="investigation-options"><legend>그렇게 판단한 이유</legend>{question.reasons.map((reason, i) => <label key={reason}><input type="radio" name={id + question.id + '-reason'} checked={answer.reason === i} onChange={() => update({ reason: i })}/><span>{reason}</span></label>)}</fieldset>}
      {answerPart === 'reason' && answer.choice !== undefined && <p className="chosen-sources">내 판단: {question.options[answer.choice]}</p>}
      <p className="chosen-sources">내 근거: {answer.sources.length ? inquiry.sources.filter(s => answer.sources.includes(s.id)).map(s => s.title).join(' · ') : '자료를 살펴보고 선택하세요.'}</p>
      </div><div className="judgment-actions">
      {level === 'middle' && answerPart === 'choice' ? <button className="primary investigation-submit" disabled={answer.choice === undefined} onClick={() => setAnswerPart('reason')}>이유 선택하기</button> : <button className="primary investigation-submit" disabled={!ready} onClick={() => update({ reviewed: true, attempts: (answer.attempts || 0) + 1, firstChoice: answer.firstChoice ?? answer.choice }, false)}>판단 확인</button>}
      {answer.reviewed && <div className={'investigation-feedback ' + (correct ? 'is-correct' : '')} role="status"><b>{correct ? '자료와 판단이 연결됐어요.' : reviewParts.filter(part => !checks[part.key]).map(part => part.label).join(' · ') + ' 항목을 다시 확인해 주세요.'}</b>{correct ? <p>{question.explanation}</p> : <div className="inquiry-checks">{reviewParts.map(part => checks[part.key] ? <span key={part.key}>✓ {part.label} 맞았어요</span> : <button type="button" key={part.key} onClick={() => { if (part.key === 'sources') setPanel('sources'); else { setPanel('judgment'); setAnswerPart(part.key); } }}>{part.label} 다시 보기 →</button>)}</div>}</div>}
      {correct && index < questions.length - 1 && <button className="secondary next-question" onClick={() => selectQuestion(index + 1)}>다음 질문 살펴보기</button>}
      <Hint hints={question.hints} count={answer.hints || 0} onMore={() => update({ hints: Math.min((answer.hints || 0) + 1, question.hints.length) }, false)} />
      </div>
    </section>
  </div>;
}
