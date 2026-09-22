import type { Item } from './content';

export type Mark = { document: string; x: number; y: number; w: number; h: number };
export type ScanValue = { marks: Mark[]; reviewed: boolean };
type Target = Mark & { id: string };
const label = (id: string, x: number, y: number, w: number, h: number): Target => ({ id, document: 'label', x: x / 10, y: y / 6.9, w: w / 10, h: h / 6.9 });
const receipt = (x: number, y: number, w: number, h: number): Target => ({ id: 'p_receipt', document: 'receipt', x: x / 6, y: y / 9.6, w: w / 6, h: h / 9.6 });
const PARCEL_TARGETS: Target[] = [
  label('p_name', 152, 302, 158, 42),
  label('p_phone', 546, 304, 354, 39),
  label('p_address', 150, 365, 649, 75),
  label('p_product', 153, 533, 516, 43),
  label('p_barcode', 104, 168, 794, 116),
  receipt(37, 328, 510, 143), receipt(38, 628, 504, 149),
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
