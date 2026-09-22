"use client";
import type { Step, Level } from '@/lib/du/content';
import { CHOICE_RULES, choiceComplete, type ChoiceReview } from '@/lib/du/investigation';
import { Hint } from './Investigation';

export default function ReasonedChoice({ step, level, choice, reason, review, onChange }: {
  step: Step; level: Level; choice?: number; reason: string; review?: ChoiceReview;
  onChange: (choice: number | undefined, reason: string, review: ChoiceReview) => void;
}) {
  const rules = CHOICE_RULES[step.id];
  const ready = choice !== undefined && (!step.reason || level !== 'middle' || reason.trim().length >= 5);
  const correct = choiceComplete(step, choice, reason, review, level);
  return <div className="reasoned-choice">
    <fieldset className="investigation-options choice-options"><legend className="sr-only">처리 방법 선택</legend>{step.options!.map((option, i) => <label key={option}><input type="radio" name={step.id} checked={choice === i} onChange={() => onChange(i, reason, { ...review, reviewed: false })}/><span>{option}</span></label>)}</fieldset>
    {step.reason && <label className="reason">내가 이렇게 생각한 이유 {level === 'middle' ? '(5자 이상)' : '(선택)'}<textarea maxLength={300} value={reason} onChange={e => onChange(choice, e.target.value, { ...review, reviewed: false })} placeholder="어떤 정보를 지키려는지 적어 주세요." /></label>}
    <button className="primary investigation-submit" disabled={!ready} onClick={() => onChange(choice, reason, { ...review, reviewed: true, attempts: (review?.attempts || 0) + 1, firstChoice: review?.firstChoice ?? choice })}>판단 확인</button>
    {review?.reviewed && <div className={'investigation-feedback ' + (correct ? 'is-correct' : '')} role="status"><b>{correct ? '판단을 확인했어요.' : '다시 생각해 보세요.'}</b><p>{correct ? step.feedback?.[choice!] : rules.hints[0]}</p></div>}
    <Hint hints={rules.hints} count={review?.hints || 0} onMore={() => onChange(choice, reason, { ...review, hints: Math.min((review?.hints || 0) + 1, rules.hints.length) })} />
  </div>;
}
