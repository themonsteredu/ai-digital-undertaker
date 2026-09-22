import type { ReactNode } from 'react';

function Barcode({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  // A printed sample, deliberately not a carrier tracking code.
  const bars = Array.from({ length: 86 }, (_, i) => 1 + ((i * 17 + i * i) % 4));
  const total = bars.reduce((sum, v) => sum + v + 1.4, 0);
  let offset = 0;
  return <g fill="#191919">{bars.map((bar, i) => {
    const left = offset; offset += bar + 1.4;
    return <rect key={i} x={x + left / total * width} y={y} width={bar / total * width} height={height} />;
  })}</g>;
}

function Paper({ receipt, children }: { receipt?: boolean; children: ReactNode }) {
  return <svg viewBox={receipt ? '0 0 600 960' : '0 0 1000 690'} className="parcel-paper" aria-label={receipt ? '구매 영수증 인쇄물' : '택배 운송장 인쇄물'} role="img">
    <defs>
      <linearGradient id={receipt ? 'receipt-paper' : 'label-paper'} x2="1" y2="1">
        <stop stopColor="#fffefa" /><stop offset=".48" stopColor="#fff" /><stop offset="1" stopColor="#f2f0e9" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${receipt ? 'receipt-paper' : 'label-paper'})`} />
    <g fill="#161616" fontFamily="Score, sans-serif" fontSize={receipt ? 22 : 24}>{children}</g>
  </svg>;
}

export default function ParcelPaper({ document }: { document: 'label' | 'receipt' }) {
  if (document === 'receipt') return <Paper receipt>
    <text x="300" y="74" textAnchor="middle" fontSize="38" fontWeight="700">모아문구</text>
    <text x="300" y="111" textAnchor="middle" fontSize="20">도서 · 문구 · 학습 준비물</text>
    <text x="42" y="154">모아시 한빛로 12, 1층</text>
    <text x="42" y="185" fontSize="19">사업자 000-00-00000  /  TEL 000-000-0000</text>
    <path d="M38 203H562 M38 276H562 M38 478H562 M38 616H562 M38 793H562" stroke="#282828" strokeDasharray="6 5" />
    <text x="42" y="235">2026.09.21  16:24:08</text>
    <text x="558" y="262" textAnchor="end" fontSize="18">매장 01 / 거래 00482 / 담당 001</text>
    <text x="42" y="313">상품명</text><text x="558" y="313" textAnchor="end">금액</text>
    <text x="42" y="355" fontSize="25">중학 1 수학 연습장</text>
    <text x="58" y="388" fontSize="20">6,000원 × 2</text><text x="558" y="388" textAnchor="end">12,000</text>
    <text x="42" y="432" fontSize="25">개인정보 가림 도장</text>
    <text x="58" y="465" fontSize="20">4,500원 × 1</text><text x="558" y="465" textAnchor="end">4,500</text>
    <text x="42" y="516">공급가액</text><text x="558" y="516" textAnchor="end">15,000</text>
    <text x="42" y="550">부가세</text><text x="558" y="550" textAnchor="end">1,500</text>
    <text x="42" y="595" fontSize="30" fontWeight="700">합계</text><text x="558" y="595" textAnchor="end" fontSize="32" fontWeight="700">16,500원</text>
    <text x="42" y="657">주문자  김민서</text>
    <text x="42" y="694">연락처  010-0000-0000</text>
    <text x="42" y="731" fontSize="20">카드결제  0000-****-****-1248 / 일시불</text>
    <text x="42" y="767" fontSize="20">승인번호  00005423 / 결제 완료</text>
    <text x="300" y="829" textAnchor="middle" fontSize="20">교환·반품 시 영수증을 가져오세요.</text>
    <Barcode x={123} y={852} width={354} height={44} />
    <text x="300" y="927" textAnchor="middle" fontSize="16" fill="#666">수업용 재현 자료 · 모든 거래정보는 가상입니다.</text>
  </Paper>;
  return <Paper>
    <rect x="20" y="20" width="960" height="650" fill="none" stroke="#202020" strokeWidth="2" />
    <text x="42" y="67" fontSize="37" fontWeight="700">MOA 택배</text>
    <text x="956" y="62" textAnchor="end" fontSize="22">택배 운송장 · 고객 보관용</text>
    <path d="M20 87H980 M20 154H980 M20 291H980 M20 450H980 M20 519H980 M20 589H980 M20 635H980" stroke="#202020" strokeWidth="2" />
    <text x="42" y="135" fontSize="47" fontWeight="700">M 21 — 04</text>
    <text x="506" y="128">모아 01 / 한빛 집배점</text>
    <rect x="835" y="97" width="124" height="45" fill="#202020" />
    <text x="897" y="129" textAnchor="middle" fill="white" fontSize="24">선불</text>
    <Barcode x={109} y={172} width={784} height={77} />
    <text x="500" y="279" textAnchor="middle" fontSize="25" letterSpacing="5">2026 0918 4827</text>
    <path d="M136 291V589 M20 357H980" stroke="#202020" />
    <text x="78" y="331" textAnchor="middle" fontSize="22">받는 분</text>
    <text x="161" y="337" fontSize="36" fontWeight="700">김민서</text>
    <text x="554" y="335" fontSize="31" fontWeight="700">010-0000-0000</text>
    <text x="78" y="409" textAnchor="middle" fontSize="22">주소</text>
    <text x="161" y="396" fontSize="31">모아시 한빛로 24, 모아아파트</text>
    <text x="161" y="435" fontSize="31" fontWeight="700">101동 1203호</text>
    <text x="78" y="489" textAnchor="middle" fontSize="20">보내는 분</text>
    <text x="161" y="481" fontSize="22">모아문구 온라인몰 / 000-000-0000</text>
    <text x="161" y="508" fontSize="18">모아시 한빛로 12, 1층 / 주문 20260921-00482</text>
    <text x="78" y="561" textAnchor="middle" fontSize="20">상품 정보</text>
    <text x="161" y="564" fontSize="30">중학교 1학년 수학 연습장</text>
    <text x="952" y="564" textAnchor="end" fontSize="22">수량 2</text>
    <text x="42" y="620" fontSize="20">배송 요청</text><text x="185" y="620" fontSize="22">문 앞에 두고 문자 주세요.</text>
    <text x="42" y="659" fontSize="16" fill="#666">수업용 재현 자료 · 실제 배송에 사용되지 않습니다.</text>
    <text x="958" y="659" textAnchor="end" fontSize="17">발행 2026.09.21</text>
  </Paper>;
}
