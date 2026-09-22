import type { Level, Step } from './content';

export type Source = { id: string; title: string; text: string; image?: string };
export type InquiryQuestion = {
  id: string; prompt: string; options: string[]; answer: number;
  evidence: string[]; reasons: string[]; reason: number;
  retry: string; hints: string[]; explanation: string; found?: string[]; middle?: boolean;
};
export type Inquiry = { sources: Source[]; questions: InquiryQuestion[] };
export type InquiryAnswer = { sources: string[]; choice?: number; reason?: number; reviewed?: boolean; attempts?: number; hints?: number; firstChoice?: number };
export type InquiryValue = { current?: number; answers?: Record<string, InquiryAnswer> };
export type ChoiceReview = { reviewed?: boolean; attempts?: number; hints?: number; firstChoice?: number };

export const INQUIRIES: Record<string, Inquiry> = {
  p_connections: {
    sources: [
      { id: 'label', title: 'A · 택배 송장', image: 'label-photo.webp', text: '민서가 버리려는 상자에 붙어 있던 송장입니다.' },
      { id: 'receipt', title: 'B · 함께 버린 영수증', image: 'receipt-photo.webp', text: '송장과 함께 상자 안에 들어 있던 영수증입니다.' },
      { id: 'guide', title: 'C · 포장 안내', text: '종이 상자는 테이프를 떼고 접어서 배출해 주세요.\n완충재는 재질에 맞게 분리해 주세요.\n이 안내에는 주문자별 정보가 인쇄되지 않습니다.' },
    ],
    questions: [{
      id: 'duplicate', prompt: '민서는 송장의 이름과 연락처를 가렸어요. 버리기 전에 무엇을 더 해야 할까요?',
      options: ['상자와 포장 안내만 잘게 찢는다', '영수증까지 살펴 같은 사람의 정보가 남았는지 확인한다', '영수증의 합계 금액만 가린다'], answer: 1,
      evidence: ['label', 'receipt'], reasons: ['포장 안내에는 상자 모양이 나와 있기 때문이다', '합계 금액을 알면 누구인지 바로 알 수 있기 때문이다', '서로 다른 종이에 같은 주문자와 연락처가 남아 있기 때문이다'], reason: 2,
      retry: '한 장을 가렸을 때 다른 자료에 무엇이 남는지 비교해 보세요.',
      hints: ['같은 사람과 연결되는 글자가 여러 자료에 반복되는지 살펴보세요.', '가린 송장과 함께 버린 영수증을 비교해 보세요. 분리배출 방법만 적힌 안내도 근거가 될까요?'],
      explanation: '송장만 처리해도 영수증의 주문자·연락처·구매 내역은 남아요. 두 자료를 함께 확인해야 합니다. 공통 포장 안내까지 개인정보로 판단할 필요는 없어요.',
    }],
  },
  s_connections: {
    sources: [
      { id: 'school', title: 'A · 월요일 게시물', image: 'scene-classroom-photo.webp', text: '9월 7일 월요일 15:40 · 지호의 공개 계정\n“학교 끝! 오늘도 문구점 들렀다가 집에 가야지.”' },
      { id: 'street', title: 'B · 다음 주 게시물', image: 'scene-street-photo.webp', text: '9월 14일 월요일 15:50 · 같은 계정\n“월요일엔 늘 이 길. 문구점에서 친구 기다리는 중.”' },
      { id: 'birthday', title: 'C · 주말 게시물', image: 'scene-birthday-photo.webp', text: '9월 19일 토요일 14:00 · 같은 계정\n“오늘은 친구들과 여기서 생일 파티!”' },
    ],
    questions: [
      { id: 'location', prompt: '거리 사진과 생일 사진을 함께 본 사람이 짐작할 수 있는 것은?',
        options: ['사진만으로 정확한 집 호수를 알 수 있다', '사진을 찍은 곳은 반드시 지호의 집이다', '자주 머무는 동네를 좁혀 볼 수 있지만 집을 확정할 수는 없다'], answer: 2,
        evidence: ['street', 'birthday'], reasons: ['건물 단서와 초대장 장소가 연결되지만 방문한 장소일 수도 있다', '사진에 나온 모든 장소는 촬영자의 집이다', '생일 케이크가 보이면 집 주소도 알 수 있다'], reason: 0,
        retry: '자료에 실제로 보이는 것과 아직 확인하지 못한 것을 나눠 보세요.',
        hints: ['장소를 짐작하는 것과 집 주소를 확정하는 것은 달라요.', '거리의 건물과 생일 사진의 장소를 연결해 보세요. 친구를 만나러 방문했을 가능성도 남아 있어요.'],
        explanation: '거리의 간판·동 번호와 초대장 장소를 합치면 활동하는 동네를 좁혀 볼 수 있어요. 하지만 지호가 사는 동·호수라는 증거는 아닙니다.' },
      { id: 'routine', middle: true, prompt: '월요일 게시물들을 함께 공개하면 어떤 정보가 새로 드러날까요?',
        options: ['방과 후 특정 시간에 문구점 근처를 지나는 패턴', '매일 정확히 같은 시각에 귀가한다는 사실', '학교에 있는 모든 학생의 하교 시간'], answer: 0,
        evidence: ['school', 'street'], reasons: ['서로 다른 게시물의 얼굴이 같으면 하루 일정 전체를 알 수 있다', '다른 주의 같은 요일·비슷한 시간·이동 장소가 겹친다', '케이크의 초 개수로 하교 시간을 계산할 수 있다'], reason: 1,
        retry: '한 번의 방문인지 반복되는 모습인지 확인하고, 추측을 사실처럼 단정하지 마세요.',
        hints: ['사진뿐 아니라 게시한 날짜·시간·글도 비교해 보세요.', '두 월요일의 시간과 문구점에 관한 글을 묶어 보세요. “매일”이라고 단정할 근거도 있나요?'],
        explanation: '월요일 두 번의 글과 사진을 연결하면 하교 뒤 이동 패턴을 짐작할 수 있어요. 다만 매일의 정확한 일정까지 알 수는 없어요. 사진을 가리는 것과 함께 반복된 위치·시간 공개도 줄여야 합니다.' },
    ],
  },
  search: {
    sources: [
      { id: 'request', title: '의뢰인의 기억', text: '수아: “2016년에 모아초 4학년이었고, 게임 카페에서 달토끼라는 닉네임을 썼어요. 그때 종이접기를 좋아했어요. 지금은 사진 계정 하나만 써요.”' },
      { id: 'cafe', title: 'A · 달토끼의 첫 인사', text: '모아게임 카페 · 2016.03.12\n“수아예요. 모아초 4학년입니다. 종이접기도 좋아해요. 생일은 5월 18일!”\n작성자: 달토끼 · 전체 공개' },
      { id: 'blog', title: 'B · 달토끼의 일기', text: '달토끼 블로그 · 2016.03.18\n“수아의 일기. 오늘 종이접기를 했어요.”\n학교·학년은 보이지 않음 · 전체 공개' },
      { id: 'photo', title: 'C · 수아의 사진 작업실', text: '사진 작업실 · 2016.03.20\n“대학 졸업 사진전을 준비합니다.”\n작성자: 수아 · 작품 소개 · 전체 공개' },
    ],
    questions: [
      { id: 'owner', prompt: '어느 기록부터 수아와 본인 여부를 확인하는 것이 좋을까요?',
        options: ['A · 달토끼의 첫 인사', 'B · 달토끼의 일기', 'C · 수아의 사진 작업실'], answer: 0,
        evidence: ['request', 'cafe'], reasons: ['닉네임이 한 번 같으면 본인 기록이 확실하다', '이름·당시 학교와 학년·닉네임이 의뢰인의 기억과 함께 맞는다', '가장 최근에 검색된 결과가 본인 계정이다'], reason: 1,
        retry: '이름 하나만 보지 말고 당시의 기록이 의뢰인의 기억과 함께 맞는지 확인하세요.',
        hints: ['같은 이름이나 닉네임을 쓰는 다른 사람도 있을 수 있어요.', '의뢰인의 기억과 게시물의 연도·학교·학년을 나란히 확인해 보세요.'],
        explanation: 'A는 이름뿐 아니라 2016년의 학교·학년·닉네임도 일치해 우선 확인할 근거가 충분해요. 실제 삭제 요청 전에 수아에게 본인의 글인지 다시 확인합니다.', found: ['a_greeting'] },
      { id: 'uncertain', middle: true, prompt: 'B도 닉네임과 관심사가 같아요. 지금 어떻게 처리할까요?',
        options: ['A가 본인 글이므로 B도 함께 삭제 요청한다', '정보가 부족하므로 수아에게 B의 계정도 썼는지 먼저 묻는다', '학교가 없으므로 다른 사람의 글이라고 확정한다'], answer: 1,
        evidence: ['request', 'blog'], reasons: ['학교가 표시되지 않으면 개인정보가 전혀 없다', '관심사가 같으면 같은 사람이다', '공통점은 있지만 본인 여부를 결정할 단서가 부족하다'], reason: 2,
        retry: '모르는 내용을 억지로 확정하지 않아도 돼요. 다음 확인 절차를 생각해 보세요.',
        hints: ['“그럴 수 있다”와 “확인했다”는 달라요.', '이름·닉네임·관심사가 같아도 우연히 겹칠 수 있어요. 의뢰인에게 계정 사용 여부를 물을 수 있어요.'],
        explanation: 'B는 본인일 가능성이 있지만 단정할 수 없어요. 계정 사용 여부를 먼저 확인하고, 확인 전에는 다른 사람의 기록을 지우려 하지 않습니다.' },
    ],
  },
  chat: {
    sources: [
      { id: 'consent', title: '16:02 · 태윤', text: '오늘 찍은 사진, 우리 모둠방에서는 봐도 돼. 다른 방에는 보내지 말아 줘.' },
      { id: 'forward', title: '16:04 · 하늘', text: '태윤 사진 잘 나왔지? 방금 다른 반 친구들 방에도 보냈어.' },
      { id: 'homework', title: '16:05 · 준', text: '오늘 숙제는 수학 42쪽이야. 내일 연필도 챙겨 와.' },
      { id: 'contact', title: '16:07 · 별', text: '태윤 번호 물어본 친구가 있던데, 번호를 보내도 되는지 태윤에게 먼저 물어볼게.' },
      { id: 'offer', title: '16:09 · 선물봇', text: '오늘 5시 마감! 무료 게임 아이템 받기\n이름·휴대폰 번호·부모님 전화번호를 입력하세요.\n선물 안내창은 이 수업의 가상 자료입니다.' },
    ],
    questions: [
      { id: 'permission', prompt: '허락받은 범위를 벗어난 공유는 무엇인가요?',
        options: ['준이 숙제 쪽수를 알려 준 것', '별이 번호를 보내기 전에 물어보려는 것', '하늘이 사진을 다른 반 대화방에 보낸 것'], answer: 2,
        evidence: ['consent', 'forward'], reasons: ['한 번 사진을 올렸으니 어디든 공유할 수 있다', '태윤은 모둠방에서만 보도록 허락했기 때문이다', '친구끼리 보내는 사진은 모두 금지되어 있기 때문이다'], reason: 1,
        retry: '누가 무엇을 허락했는지 먼저 읽고, 실제 공유한 범위와 비교하세요.',
        hints: ['사진이 있는 모든 메시지가 잘못된 공유는 아니에요.', '태윤이 말한 “이 방”과 하늘이 보낸 “다른 방”을 비교해 보세요.'],
        explanation: '모둠방 안에서 보도록 한 허락이 다른 방으로 보내도 된다는 뜻은 아니에요. 하늘에게 삭제와 추가 공유 중단을 요청해야 합니다.', found: ['c_photo'] },
      { id: 'offer', prompt: '선물 안내창에서 정보를 입력하기 전에 어떻게 판단해야 할까요?',
        options: ['친구가 전달했으니 부모님 번호까지 입력한다', '선물과 무관한 정보 요구를 멈추고 공식 안내인지 확인한다', '내 번호만 실제 번호로 쓰고 부모님 번호는 지어낸다'], answer: 1,
        evidence: ['offer'], reasons: ['무료인 행사는 모두 거짓이다', '마감 시간이 있으므로 검증된 행사다', '급하게 행동하도록 하며 선물에 왜 필요한지 설명 없는 연락처를 요구한다'], reason: 2,
        retry: '무료라는 말만 보지 말고, 무엇을 왜 요구하는지 살펴보세요.',
        hints: ['서두르게 만드는 말과 요청하는 정보의 종류를 확인해 보세요.', '게임 선물을 받는 데 부모님 연락처까지 필요한 이유가 설명되어 있나요?'],
        explanation: '무료라는 이유만으로 사기라고 확정하지는 않아요. 다만 출처가 확인되지 않고 불필요한 연락처를 요구하므로 입력을 멈추고 믿을 만한 어른과 공식 안내를 확인합니다.', found: ['c_link', 'c_form'] },
    ],
  },
};

export function questionsFor(id: string, level: Level) { return INQUIRIES[id].questions.filter(q => !q.middle || level === 'middle'); }
export function inquiryCorrect(question: InquiryQuestion, value: InquiryAnswer | undefined, level: Level): boolean {
  if (!value || value.choice !== question.answer || (level === 'middle' && value.reason !== question.reason)) return false;
  const sources = new Set(value.sources);
  return sources.size === question.evidence.length && question.evidence.every(id => sources.has(id));
}
export function inquiryComplete(id: string, value: InquiryValue | undefined, level: Level): boolean {
  return questionsFor(id, level).every(q => value?.answers?.[q.id]?.reviewed === true && inquiryCorrect(q, value.answers[q.id], level));
}
export function inquiryFound(id: string, value: InquiryValue, level: Level): string[] {
  return [...new Set(questionsFor(id, level).filter(q => value.answers?.[q.id]?.reviewed && inquiryCorrect(q, value.answers[q.id], level)).flatMap(q => q.found || []))];
}

export const CHOICE_RULES: Record<string, { accepted: number[]; hints: string[] }> = {
  p_now: { accepted: [1], hints: ['버린 뒤 다른 사람이 글씨를 다시 읽을 수 있는지 생각해 보세요.', '종이를 떼는 것과 읽을 수 없게 처리하는 일을 함께 해야 해요.'] },
  p_keep: { accepted: [0], hints: ['상자를 계속 쓰면서 글씨가 다시 드러나지 않을 방법을 골라요.', '가린 뒤 밝은 곳에서도 글씨가 읽히는지 확인하는 방법이에요.'] },
  p_next: { accepted: [0, 1, 2], hints: ['다음 배송에 꼭 필요한 정보와 줄일 수 있는 정보를 나눠 보세요.', '세 방법 모두 조건에 맞으면 사용할 수 있어요. 내 상황에서 고른 이유를 설명하세요.'] },
  s_mine: { accepted: [0, 1], hints: ['남길 추억과 공개하지 않을 정보를 따로 생각해 보세요.', '사진을 남기려면 이름뿐 아니라 배경의 정보도 함께 살펴야 해요.'] },
  s_friend: { accepted: [0], hints: ['그 게시물을 수정할 수 있는 사람이 누구인가요?', '사진을 올린 사람에게 먼저 요청하고, 필요하면 도움을 받아요.'] },
  s_old: { accepted: [1, 2], hints: ['로그인이 어려워도 요청할 수 있는 창구가 있어요.', '신고 사유나 지원 조건을 확인한 뒤 도움을 요청할 수 있어요.'] },
  s_debate: { accepted: [0, 1, 2], hints: ['내 의견과 다른 사람의 피해를 함께 생각해 보세요.', '선택한 방법으로 어떤 피해를 줄일지 설명해 보세요.'] },
  a_active: { accepted: [0, 1], hints: ['기록을 남기고 싶은지와 공개하고 싶은지는 달라요.', '필요 없는 글은 지우고, 남길 글은 공개 범위를 줄일 수 있어요.'] },
  a_lost: { accepted: [1, 2], hints: ['본인 계정임을 확인받을 수 있는 곳을 찾아요.', '사이트의 계정 복구·문의 창구와 지원 제도가 있어요.'] },
  a_list: { accepted: [0], hints: ['내 이름이 있어도 수정 권한은 게시한 곳에 있어요.', '게시한 기관에 노출되는 내용과 요청 사항을 알려야 해요.'] },
  a_namesake: { accepted: [1], hints: ['이름이 같다는 것만으로 내 기록일까요?', '의뢰인의 기록인지 확인하지 못했다면 다른 사람의 글을 함부로 처리하지 않아요.'] },
  c_offer: { accepted: [2], hints: ['입력을 계속하는 것이 꼭 필요한지 생각해 보세요.', '일부만 실제 정보로 입력해도 정보가 전달돼요. 멈추고 확인할 수 있어요.'] },
  c_now: { accepted: [0], hints: ['지금 더 퍼지는 것을 줄일 수 있는 행동인가요?', '올린 사람에게 삭제와 추가 공유 중단을 함께 부탁해요.'] },
  c_evidence: { accepted: [0], hints: ['나중에 도움을 받을 때 설명할 수 있어야 해요.', '일반적인 피해 대화의 주소·시간을 기록해요. 불법 촬영물은 저장·전달하지 않아요.'] },
  c_help: { accepted: [0], hints: ['피해가 커질 때 실제로 도와줄 수 있는 사람을 찾아요.', '믿을 만한 어른과 함께 대응할 수 있어요.'] },
};

export function choiceComplete(step: Step, choice: number | undefined, reason: string, review: ChoiceReview | undefined, level: Level): boolean {
  return review?.reviewed === true && choice !== undefined && !!CHOICE_RULES[step.id]?.accepted.includes(choice) && (!step.reason || level !== 'middle' || reason.trim().length >= 5);
}
