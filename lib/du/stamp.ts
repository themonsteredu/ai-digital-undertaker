export type Stamp = {
    pattern: string;
    density: number;
    icon: string;
    shape: string;
    width: number;
    height: number;
    margin: number;
    coverage: number;
};
export const DEFAULT_STAMP: Stamp = { pattern: 'hatch', density: 55, icon: 'shield', shape: 'round', width: 40, height: 15, margin: 1, coverage: 0 };
export function drawStamp(canvas: HTMLCanvasElement, s: Stamp, black = true) {
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    const sc = w / 600;
    ctx.scale(sc, sc);
    const H = h / sc;
    const margin = Math.min(s.margin / s.width * 600, 35);
    ctx.beginPath();
    ctx.roundRect(margin, margin, 600 - 2 * margin, H - 2 * margin, s.shape === 'round' ? 18 : 0);
    ctx.clip();
    ctx.strokeStyle = black ? '#000' : '#163d43';
    ctx.fillStyle = black ? '#000' : '#163d43';
    const step = 48 - s.density * .42;
    const thick = 2 + s.density * .035;
    ctx.lineWidth = thick;
    if (s.pattern === 'hatch' || s.pattern === 'grid') {
        for (let x = -H; x < 600 + H; x += step) {
            ctx.beginPath();
            if (s.pattern === 'hatch') {
                ctx.moveTo(x, 0);
                ctx.lineTo(x + H, H);
            }
            else {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, H);
            }
            ctx.stroke();
        }
        for (let y = 0; y < H; y += step) {
            ctx.beginPath();
            if (s.pattern === 'grid') {
                ctx.moveTo(0, y);
                ctx.lineTo(600, y);
            }
            else {
                ctx.moveTo(-H, y);
                ctx.lineTo(600, y - 600);
            }
            ctx.stroke();
        }
    }
    if (s.pattern === 'dot') {
        for (let y = margin; y < H; y += step)
            for (let x = margin; x < 600; x += step) {
                ctx.beginPath();
                ctx.arc(x + (Math.round(y / step) % 2) * step / 2, y, thick * .8, 0, Math.PI * 2);
                ctx.fill();
            }
    }
    if (s.pattern === 'wave') {
        for (let y = -20; y < H + 20; y += step) {
            ctx.beginPath();
            for (let x = 0; x < 602; x += 2) {
                const yy = y + Math.sin(x / 15) * 9;
                if (x === 0)
                    ctx.moveTo(x, yy);
                else
                    ctx.lineTo(x, yy);
            }
            ctx.stroke();
        }
    }
    if (s.pattern === 'brick') {
        for (let y = 0; y < H; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(600, y);
            ctx.stroke();
            for (let x = (Math.round(y / step) % 2) * step; x < 600; x += step * 2) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + step);
                ctx.stroke();
            }
        }
    }
    if (s.icon !== 'none') {
        ctx.save();
        ctx.translate(300, H / 2);
        ctx.lineWidth = 8;
        ctx.fillStyle = '#fff';
        ctx.fillRect(-35, -35, 70, 70);
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        if (s.icon === 'shield') {
            ctx.moveTo(0, -28);
            ctx.lineTo(26, -17);
            ctx.lineTo(23, 13);
            ctx.quadraticCurveTo(0, 38, -23, 13);
            ctx.lineTo(-26, -17);
            ctx.closePath();
        }
        else if (s.icon === 'lock') {
            ctx.roundRect(-24, -3, 48, 31, 4);
            ctx.moveTo(-15, -3);
            ctx.lineTo(-15, -18);
            ctx.arc(0, -18, 15, Math.PI, 0);
            ctx.lineTo(15, -3);
        }
        else {
            ctx.moveTo(-28, 6);
            ctx.lineTo(1, -25);
            ctx.lineTo(28, 1);
            ctx.lineTo(4, 26);
            ctx.lineTo(-10, 26);
            ctx.closePath();
            ctx.moveTo(-12, -10);
            ctx.lineTo(16, 16);
        }
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}
export function drawTest(canvas: HTMLCanvasElement, s: Stamp, apply: boolean) {
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    const text = document.createElement('canvas');
    text.width = w;
    text.height = h;
    const t = text.getContext('2d')!;
    t.fillStyle = '#000';
    t.font = '600 24px Score, sans-serif';
    t.fillText('받는 분  김민서', 30, 54);
    t.font = '400 21px Score, sans-serif';
    t.fillText('가상시 모아로 00길 00  101동 000호', 30, 98);
    t.fillText('010-0000-0000   주문 MOA-000001', 30, 143);
    t.fillText('물품  중학교 1학년 수학 연습장', 30, 187);
    ctx.drawImage(text, 0, 0);
    if (!apply)
        return 0;
    const mask = document.createElement('canvas');
    mask.width = w;
    mask.height = h;
    const impression = document.createElement('canvas');
    impression.width = Math.min(w, Math.round(h * s.width / s.height));
    impression.height = Math.round(impression.width * s.height / s.width);
    drawStamp(impression, s);
    mask.getContext('2d')!.drawImage(impression, (w - impression.width) / 2, (h - impression.height) / 2);
    const td = t.getImageData(0, 0, w, h).data, md = mask.getContext('2d')!.getImageData(0, 0, w, h).data;
    let total = 0, covered = 0;
    for (let i = 3; i < td.length; i += 4) {
        if (td[i] > 128) {
            total++;
            if (md[i] > 128 && md[i - 3] < 80)
                covered++;
        }
    }
    ctx.drawImage(mask, 0, 0);
    return total ? Math.round(covered / total * 100) : 0;
}
export function printStamp(s: Stamp, download = false) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(s.width / 25.4 * 600);
    canvas.height = Math.round(s.height / 25.4 * 600);
    drawStamp(canvas, s);
    const data = canvas.toDataURL('image/png');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}mm" height="${s.height}mm" viewBox="0 0 ${canvas.width} ${canvas.height}"><rect width="100%" height="100%" fill="white"/><image width="100%" height="100%" href="${data}"/></svg>`;
    if (download) {
        const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        const a = document.createElement('a');
        a.href = u;
        a.download = `MOAKIT_stamp_${s.width}x${s.height}mm.svg`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(u), 2000);
        return true;
    }
    const win = window.open('', '_blank');
    if (!win)
        return false;
    win.document.write(`<!doctype html><html lang="ko"><head><title>MOAKIT 도장 도안</title><style>@page{size:A4;margin:15mm}body{font:14px sans-serif}img{width:${s.width}mm;height:${s.height}mm;display:block;margin-top:10mm}button{padding:12px 25px;font-size:16px}@media print{.help{display:none}}</style></head><body><div class="help"><h2>도장 도안 · ${s.width} × ${s.height} mm</h2><p>인쇄 배율 100% · 실제 크기로 출력하세요. 기계 규격과 반전 여부를 확인하세요.</p><button onclick="window.print()">인쇄하기</button></div><img src="${data}" alt="흑백 도장 도안"/></body></html>`);
    win.document.close();
    return true;
}
