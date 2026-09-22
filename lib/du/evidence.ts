import type { Item } from './content';

export type Mark = { document: string; x: number; y: number; w: number; h: number };
export type ScanValue = { marks: Mark[]; reviewed: boolean };
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
    return markArea > 0 && markArea <= targetArea * 5 && overlapX * overlapY >= Math.min(targetArea * .25, markArea * .65);
  })).map(target => target.id))];
}
