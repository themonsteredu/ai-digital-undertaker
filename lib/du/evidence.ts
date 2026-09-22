import type { Item, Level, Step } from './content';

export type Mark = { document: string; x: number; y: number; w: number; h: number };
export type ScanValue = { marks: Mark[]; reviewed: boolean; attempts?: number; hints?: number };
type Target = Mark & { id: string };
// Percent coordinates measured from the final photographs, not rendered text layers.
const target = (id: string, document: string, x: number, y: number, w: number, h: number): Target => ({ id, document, x, y, w, h });
const PARCEL_TARGETS: Target[] = [
  target('p_name', 'label', 25, 47, 14, 7),
  target('p_phone', 'label', 52, 47, 25, 7),
  target('p_address', 'label', 25, 55.5, 43, 11),
  target('p_product', 'label', 25, 78.5, 34, 6),
  target('p_barcode', 'label', 22, 25, 57, 19),
  target('p_receipt', 'receipt', 17, 30.5, 66, 15),
  target('p_receipt', 'receipt', 17, 64.5, 53, 13),
];

export function matchEvidence(marks: Mark[], items: Item[], scene: string): string[] {
  const targets = scene === 'parcel' ? PARCEL_TARGETS : items.map(item => ({
    id: item.id, document: 'scene', x: item.x || 0, y: item.y || 0, w: item.w || 0, h: item.h || 0,
  }));
  const ids = new Set(items.filter(item => !item.safe).map(item => item.id));
  return [...new Set(targets.filter(target => ids.has(target.id) && marks.some(mark => {
    if (mark.document !== target.document || !target.w || !target.h) return false;
    const overlapX = Math.max(0, Math.min(mark.x + mark.w, target.x + target.w) - Math.max(mark.x, target.x));
    const overlapY = Math.max(0, Math.min(mark.y + mark.h, target.y + target.h) - Math.max(mark.y, target.y));
    const targetArea = target.w * target.h, markArea = mark.w * mark.h;
    // Match a meaningful piece of text, not an indiscriminate rectangle over the page.
    return markArea > 0 && markArea <= targetArea * 5 && overlapX * overlapY >= Math.max(targetArea * .2, markArea * .4);
  })).map(target => target.id))];
}

export function reviewEvidence(value: ScanValue | undefined, step: Step, level: Level) {
  const marks = value?.marks || [], items = step.items || [], scene = step.scene || '';
  const found = matchEvidence(marks, items, scene);
  const unmatched = marks.some(mark => matchEvidence([mark], items, scene).length === 0);
  const required = level === 'middle' ? Math.min(2, items.filter(i => !i.safe).length) : 1;
  const documents = scene !== 'parcel' || ['label', 'receipt'].every(doc => matchEvidence(marks.filter(m => m.document === doc), items, scene).length > 0);
  const passed = marks.length > 0 && found.length >= required && documents && !unmatched;
  const message = !marks.length ? '공개하지 않을 부분을 먼저 표시해 주세요.' : unmatched ? '표시가 실제 글씨나 단서에 맞는지 살펴보세요. 빈 곳과 너무 넓은 표시는 줄여 주세요.' : !documents ? '한 자료만 처리했을 때 다른 자료에 남는 정보는 없을까요?' : !passed ? '한 가지 단서에만 머물지 말고 자료 전체를 한 번 더 살펴보세요.' : '표시한 내용에서 보호할 정보를 확인했어요. 다음 판단으로 이어가세요.';
  return { passed, found, message };
}

export function scanHints(scene: string): string[] {
  return ['사람을 직접 알려 주는 정보와, 다른 정보와 연결하면 드러나는 단서를 나눠 살펴보세요.', scene === 'parcel' ? '송장과 영수증을 모두 살펴보세요. 연락할 수 있는 정보와 주문자의 생활을 짐작하게 하는 내용이 남아 있나요?' : scene === 'birthday' ? '이름뿐 아니라 장소나 나이를 짐작하게 하는 물건도 살펴보세요. 추측과 확정은 달라요.' : '주인공만 보지 말고 배경과 주변 물건의 작은 글씨도 살펴보세요.'];
}
