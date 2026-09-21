# 디지털 장의사 웹앱 제작 요청서

아래 내용을 그대로 GPT(또는 클로드 코드)에 붙여넣으면 됩니다.

---

## 0. 무엇을 만들어야 하나

초등 고학년과 중학생을 대상으로 하는 진로 체험 웹앱을 만들어 주세요. 직업은 **디지털 장의사**입니다. 학생이 디지털 장의사가 되어 네 가지 사건을 해결하면서, 인터넷과 일상에 남는 개인정보를 찾아내고 지우는 방법을 배웁니다. 학교 방문 수업 2차시(80분) 중 웹 활동 45분 분량입니다.

수업은 한 교실에서 여러 학생이 각자 기기로 동시에 진행하고, 학생들의 기록과 약속 카드가 교사 화면에 모두 모여 함께 보게 됩니다.

## 1. 기술 조건

- 웹앱(브라우저에서 실행). 태블릿과 노트북 모두에서 쓰므로 반응형으로 만들어 주세요.
- 학생 기기와 교사 기기가 서로 다르므로 데이터는 서버에 저장해야 합니다. Supabase를 사용합니다.
- 폰트는 \*\*에스코어드림(S-Core Dream)\*\*을 사용합니다. 제목은 굵은 굵기, 본문은 보통 굵기로 씁니다.
- 이모지를 쓰지 않습니다.
- 학생 화면은 글씨를 크게, 버튼을 크게 만듭니다. 한 화면에 글이 많으면 안 됩니다.

### Supabase 표 구성

```
classes        id, code(수업코드 4자리), school_name, level(elementary | middle), created_at
students       id, class_id, nickname, created_at
answers        id, student_id, case_no(1~4), found_items(jsonb), choices(jsonb), reason(text), created_at
cards          id, student_id, surprise(text), promise(text), job_thought(text), stamp(jsonb), created_at

```

학생의 실명, 사진, 학교 이메일 등은 어떤 화면에서도 받지 않습니다. 저장하는 것은 별명, 선택한 답, 직접 쓴 문장, 도장 설정값뿐입니다.

## 2. 수업코드 로그인

- 교사가 교사 화면에서 수업을 만들면 **4자리 수업코드**가 자동 생성됩니다. 교사는 난이도(초등/중등)를 함께 고릅니다.
- 학생은 첫 화면에서 수업코드와 별명을 입력하고 들어옵니다. 비밀번호는 없습니다.
- 같은 수업코드 안에서 별명이 겹치면 뒤에 숫자를 붙여 구분합니다.
- 학생이 새로고침하거나 기기를 바꿔도 같은 수업코드와 별명으로 들어오면 이어서 진행됩니다.
- 난이도는 교사가 정한 값을 따라가고 학생이 바꿀 수 없습니다.

## 3. 교사용 슬라이드 (비밀번호 3035)

학생 화면 오른쪽 아래에 작은 설정 버튼을 둡니다. 누르면 비밀번호 입력창이 뜨고 **3035**를 입력하면 교사 화면이 열립니다. 교사 화면에는 슬라이드, 수업 만들기, 공유 보드가 있습니다.

슬라이드는 전체화면으로 열리고 좌우 화살표로 넘깁니다. 화면에는 큰 제목과 이미지만 나오고, 아래 멘트는 교사 화면 아래쪽에만 작게 보이는 발표자 메모로 둡니다.

**슬라이드 1. 오늘의 직업, 디지털 장의사**
메모: 이름만 들으면 무섭죠. 오늘 여러분이 이 일을 해볼 겁니다.

**슬라이드 2. 이 사람은 무슨 일을 할까요**
메모: 학생들에게 먼저 물어보세요. 장례식장 이야기가 나오면 그걸로 다음 장을 엽니다.

**슬라이드 3. 원래는 이런 일이었습니다**
메모: 처음에는 세상을 떠난 사람이 남긴 인터넷 기록을 정리해주는 일이었습니다. 지금은 살아있는 사람의 의뢰가 훨씬 많습니다.

**슬라이드 4. 요즘 진짜 하는 일**
메모: 일의 70퍼센트 정도가 평판 관리, 30퍼센트가 삭제입니다. 연예인, 유튜버, 인터넷 방송인이 주로 맡깁니다.

**슬라이드 5. 왜 이런 직업이 생겼을까요**
메모: 인터넷에 올린 것은 지워도 어딘가에 남습니다. 한 번 퍼지면 되돌리기 어렵습니다.

**슬라이드 6. 오늘 맡을 사건 네 개**
메모: 택배 상자, SNS 사진, 잊어버린 옛날 계정, 단톡방. 네 곳에서 정보가 샙니다.

**슬라이드 7. 완벽하게 지울 수 있을까요**
메모: 지워달라고 할 권리도 있고 표현할 자유도 있습니다. 중학생은 여기서 토론합니다.

**슬라이드 8. 진짜로 쓸 수 있는 도구 두 가지**
메모: 지우개 서비스와 e프라이버시 클린서비스. 둘 다 무료입니다. 자세한 설명은 사건 3에서 나옵니다.

**슬라이드 9. 내 손으로 만드는 가림 도장**
메모: 웹에서 설계한 무늬가 그대로 진짜 도장이 됩니다.

**슬라이드 10. 오늘의 약속**
메모: 올리기 전에 3초만 생각하기.

## 4. 학생 활동 — 사건 1. 버려진 택배 상자

의뢰인은 중학생 민서입니다. 의뢰 메시지를 먼저 보여줍니다.

"어제 집 앞에 택배 상자를 그냥 내놨어요. 오늘 모르는 번호로 전화가 왔는데 제 이름이랑 주소를 알고 있었어요. 뭐가 잘못된 걸까요?"

### 화면 1. 상자 살펴보기

택배 상자 그림 위의 송장에서 위험한 곳을 눌러 표시합니다. 확대할 수 있어야 합니다.

찾을 항목: 받는 사람 이름 / 집 주소(동호수까지) / 휴대폰 번호 / 주문한 물건 이름 / 주문번호와 바코드 / 함께 버린 영수증
초등은 이름, 주소, 전화번호, 물건 이름 네 개만 둡니다.

다 찾으면 한 줄 설명: 물건 이름만 봐도 몇 학년인지 알 수 있어요.

### 화면 2. 어떻게 처리할까

상황 1. 지금 당장 버려야 한다
보기: 상자째 그냥 내놓기 / 송장만 떼어 잘게 찢기 / 송장 위에 볼펜으로 한 번 긋기
볼펜을 고르면 불빛에 비친 종이에 글씨가 비쳐 보이는 화면을 보여줍니다. 한 줄로는 안 보이게 못 합니다.

상황 2. 상자를 며칠 두고 써야 한다
보기: 가림 도장으로 촘촘히 찍기 / 스티커 한 장 붙이기 / 물을 뿌리기

상황 3. 다음 주문부터 아예 덜 새게 하려면
보기: 안심번호 쓰기 / 무인택배함이나 편의점으로 받기 / 이름을 별명으로 적기
세 개 모두 맞는 답으로 두고, 고른 이유를 한 줄 적게 합니다. 중등은 필수, 초등은 선택입니다.

### 화면 3. 해결 보고서

찾은 개수, 놓친 항목, 고른 방법을 정리합니다. 놓친 항목은 "이건 못 보고 지나갔어요"로 표현합니다.
마지막 줄: 완벽하게 지우는 방법은 없어요. 대신 알아보기 어렵게 만들 수는 있어요.

## 5. 사건 2. SNS에 올린 사진

의뢰인은 중학생 지호입니다.

"작년에 올린 사진인데, 모르는 사람이 댓글로 우리 학교 이름을 말했어요. 저는 학교를 쓴 적이 없는데 어떻게 안 걸까요?"

### 화면 1. 사진 넘겨보기

사진 세 장을 한 장씩 확대해 위험한 곳을 누릅니다.

사진 A(교실 셀카): 교복 명찰의 이름 / 칠판의 학급과 시간표 / 책상 위 학생증
사진 B(집 앞): 옆 건물 간판 상호 / 아파트 동 번호 / 주차된 차 번호판
사진 C(생일 케이크): 케이크 위에 쓴 이름 / 초 개수로 아는 나이 / 사진 아래 위치 표시
초등은 사진 A와 C만, 각 두 항목만 둡니다.

정리 화면: 사진 한 장에 이름, 학교, 반, 사는 곳, 나이가 다 들어 있었어요. 다섯 개를 합치면 내가 누군지 알아낼 수 있어요.

### 화면 2. 이제 어떻게 할까

사진 A(내 계정, 비밀번호 알고 있음)
보기: 삭제하기 / 명찰만 가리고 다시 올리기 / 그냥 두기
삭제를 고르면: 지웠어도 누군가 캡처했으면 남아 있어요.

사진 B(친구 계정에 올라간 사진)
보기: 친구에게 지워달라고 부탁하기 / 댓글로 따지기 / 내가 지울 방법 찾기

사진 C(초등학교 때 쓰던 계정, 비밀번호를 잊어버림)
보기: 포기하기 / 새 계정으로 신고하기 / 지우개 서비스에 도움 요청하기

### 화면 3. 설정 바꾸기 체험

가짜 설정 화면에서 직접 스위치를 눌러 바꿉니다. 바꿀 때마다 결과를 한 줄로 알려줍니다.
위치 정보 함께 올리기 끄기 / 계정 공개 범위를 친구만으로 / 나를 태그할 수 있는 사람을 친구만으로

### 중등 추가 문항

"지호의 친구가 지호를 놀리는 글을 올렸습니다. 지호는 지워달라고 했지만 친구는 내 생각을 쓴 건데 왜 지워야 하냐고 합니다. 어떻게 해야 할까요?"
정답 없는 보기 세 개를 두고 이유를 한 줄 쓰게 합니다. 반 전체 비율이 공유 보드에 막대로 뜹니다.

### 해결 보고서

마지막 줄: 사진은 지워도 퍼진 건 남아요. 그래서 올리기 전이 제일 중요해요.

## 6. 사건 3. 잊어버린 옛날 계정

의뢰인은 대학생 수아입니다.

"아르바이트 면접을 봤는데, 면접관이 제 이름을 검색해 봤대요. 초등학교 때 쓴 글이 아직 나온다고 하네요. 저는 그런 걸 쓴 기억도 없어요."

### 화면 1. 이름 검색해보기

가짜 검색 결과에서 지워야 한다고 생각하는 항목을 고릅니다.

초등학교 때 게임 카페 가입 인사(이름, 학교, 생년월일 포함) / 중학교 때 블로그 일기 / 학원 홈페이지의 성적 우수자 명단 / 대회 수상자 명단 / 지금도 쓰는 SNS 계정 / 동명이인의 글
초등은 가입 인사, 블로그, 지금 쓰는 계정, 동명이인 네 개만 둡니다.

동명이인의 글과 남이 올린 명단은 함정입니다. 검색되면 다 지울 수 있다는 생각을 깨는 것이 목적입니다.

### 화면 2. 종류별로 방법이 다르다

내가 올렸고 계정도 살아 있는 글
보기: 직접 삭제 / 비공개로 전환 / 그냥 두기

내가 올렸는데 계정을 잃어버린 글
보기: 포기하기 / 사이트에 직접 연락하기 / 지우개 서비스에 신청하기
여기서 지우개 서비스를 설명합니다. 어릴 적 올린 개인정보가 담긴 게시물을 개인정보보호위원회가 삭제하거나 블라인드 처리해주는 서비스입니다. 19세가 되기 전에 올린 글이 대상이고 30세가 되기 전에 신청할 수 있습니다. 지금 초등학생과 중학생이 올리는 글은 전부 해당된다고 짚어줍니다.

남이 올린 명단에 내 이름이 있는 글
보기: 명단을 올린 곳에 삭제 요청하기 / 내가 지우기 / 신경 쓰지 않기

동명이인의 글
보기: 지워달라고 요청하기 / 그냥 둔다
요청을 고르면: 다른 사람의 글입니다. 내 정보가 아니면 지워달라고 할 수 없어요.

### 화면 3. 안 쓰는 계정 정리하기

수아가 가입한 사이트 여덟 개가 뜹니다. 각 사이트에 가입 연도와 마지막 접속일을 표시합니다. 하나씩 남길지 탈퇴할지 정합니다.

다 정리하면 e프라이버시 클린서비스를 소개합니다. 휴대전화 본인확인으로 가입한 사이트를 한 번에 조회하고 필요 없는 곳은 탈퇴를 대신 처리해주는 서비스입니다. 학생 혼자서는 본인확인이 어려우니 집에 가서 부모님과 함께 해보기 과제로 안내합니다.

### 해결 보고서

마지막 줄: 지금 쓰는 계정보다 안 쓰는 계정이 더 위험해요. 아무도 안 보고 있으니까요.

## 7. 사건 4. 단톡방과 이상한 링크

의뢰인은 초등학교 6학년 태윤입니다.

"반 단톡방에 누가 제 사진을 올렸어요. 지워달라고 했는데 이미 다른 방으로 퍼졌대요. 그리고 모르는 링크도 하나 올라왔는데, 친구들이 다 눌렀어요."

### 화면 1. 단톡방 훑어보기

찾을 항목: 친구가 올린 태윤의 사진 / 누군가 올린 전화번호 / 반 전체 명단 캡처 / 무료 아이템 링크 / 링크를 눌렀더니 나온 입력 창 / 모르는 참여자
초등은 사진, 전화번호, 링크, 모르는 참여자 네 개만 둡니다.

정리 화면: 내가 올린 게 하나도 없는데, 내 정보가 다섯 개나 있었어요.

### 화면 2. 링크를 눌러볼까

보기: 이름과 번호를 넣고 아이템 받기 / 가짜 정보를 넣기 / 창을 닫고 나오기
가짜 정보를 고르면: 가짜로 넣어도 링크를 눌렀다는 것만으로 내 기기 정보가 넘어갈 수 있어요.
결과 화면에 세 줄로 정리합니다. 무료라는 말, 오늘까지라는 말, 부모님 번호를 물어보는 것은 신호입니다.

### 화면 3. 퍼진 사진을 어떻게 할까

1단계 지금 당장
보기: 올린 친구에게 삭제 부탁하기 / 단톡방에서 화내기 / 나도 그 친구 사진을 올리기
세 번째를 고르면: 똑같은 일을 하면 나도 같은 일을 한 사람이 돼요.

2단계 퍼진 건 어떻게
보기: 캡처해서 증거 남기기 / 다 지워버리기 / 모른 척하기
지워버리기를 고르면 증거가 사라진다는 것을 알려줍니다. 앞의 세 사건에서는 계속 지우라고 했지만 여기서는 남겨야 합니다.

3단계 누구에게 말할까
보기: 부모님이나 선생님 / 친구끼리만 / 혼자 해결하기
혼자 해결하기를 고르면: 이건 혼자 해결하는 일이 아니에요. 학교 폭력이나 불법 촬영물이 섞인 경우에는 즉시 어른에게 알려야 한다고 분명히 씁니다.

### 해결 보고서

마지막 줄: 내 정보는 나만 지킬 수 있는 게 아니에요. 친구 것도 같이 지켜야 해요.

## 8. 마무리 화면

### 나의 기록 돌아보기

네 사건의 결과를 한 장으로 보여줍니다. 찾은 흔적 수, 놓친 것, 반 평균을 나란히 둡니다. 점수와 등수는 만들지 않습니다.
한 줄: 오늘 민서, 지호, 수아, 태윤을 도왔어요. 이제 내 차례예요.

### 약속 카드 쓰기

- 오늘 가장 놀랐던 것: 학생이 실제로 놓친 항목이 보기로 먼저 뜨고, 직접 쓸 수도 있습니다.
- 앞으로 지킬 나의 약속 한 줄: 직접 씁니다. 예시 문장 세 개를 흐리게 보여주되 그대로 쓰지 말라고 안내합니다.
- 중등 추가: 디지털 장의사가 하는 일 중 가장 어려워 보이는 것은 무엇인가요.

### 도장 무늬 설계

왼쪽에 설정, 오른쪽에 미리보기를 둡니다.
바탕 무늬: 빗금, 격자, 물결, 점, 벽돌 중 하나
촘촘한 정도: 슬라이더
가운데 그림: 자물쇠, 지우개, 방패 중 하나 또는 없음
모양: 사각형 또는 둥근 사각형

미리보기 옆에 가짜 송장 조각을 두고 "여기에 찍어보기" 버튼을 만듭니다. 누르면 무늬가 글씨 위에 얹히고, 글씨가 얼마나 가려졌는지 백분율로 보여줍니다. 성기게 만들면 글씨가 그대로 보이도록 해서 학생이 스스로 다시 설계하게 합니다.

완성하면 인쇄용 흑백 도안을 출력합니다. 도장 기계에 넣을 크기와 여백을 맞춰 주세요.

마지막 화면: 이제 진짜 도장을 만들 차례예요.

## 9. 공유 보드 (교사 화면)

수업코드에 들어온 모든 학생의 기록이 실시간으로 모입니다. 학생이 답을 제출할 때마다 갱신됩니다.

1. **학생 현황**: 별명과 진행 상황(사건 1\~4 중 어디까지 했는지)이 한눈에 보입니다. 아직 못 따라오는 학생을 찾기 위한 화면입니다.
2. **오늘의 숫자**: 반 전체가 찾은 흔적 수, 탈퇴시킨 계정 수, 지운 게시물 수를 합산해 크게 띄웁니다.
3. **가장 많이 놓친 것**: 상위 세 가지를 순위로 보여줍니다.
4. **선택이 갈린 문제**: 사건별로 답이 갈린 문항을 막대그래프로 보여줍니다. 중등 토론 문항은 찬반 비율과 학생들이 쓴 이유를 함께 보여줍니다.
5. **약속 카드 벽**: 학생 전원의 약속 카드가 별명과 함께 타일처럼 깔립니다. 하나를 누르면 전체화면으로 크게 뜨고, 좌우로 넘겨가며 읽을 수 있습니다.
6. **도장 무늬 갤러리**: 학생들이 설계한 무늬가 나란히 뜹니다. 가림 정도 순으로 정렬할 수 있고, 투표 기능으로 가장 잘 가린 무늬를 뽑습니다.

교사 화면에는 수업 기록 전체를 지우는 버튼을 둡니다. 수업이 끝나면 교사가 직접 지울 수 있어야 합니다.

## 10. 글을 쓸 때 지킬 것

- 학생에게 하는 말은 짧고 담백하게 씁니다. 과장된 감탄, 억지스러운 칭찬, 광고 같은 문장을 쓰지 않습니다.
- 틀렸을 때 혼내지 않습니다. 무엇이 왜 그런지만 한 줄로 알려줍니다.
- 이모지를 쓰지 않습니다.
- 한 화면에 문장은 세 줄을 넘기지 않습니다.
- 초등 화면은 어려운 단어를 쓰지 않습니다. 게시물 대신 올린 글, 접근배제 대신 못 찾게 하기처럼 풉니다.

## 11. 이미지 프롬프트

이미지는 별도로 만들어 넣습니다. 모든 이미지는 같은 화풍으로 만들고, 글자는 넣지 않습니다. 글자는 앱에서 얹습니다.

슬라이드 1: A quiet desk at night with a glowing monitor showing scattered photo thumbnails fading away, soft blue light, clean minimal illustration, muted navy and warm grey palette, no text
슬라이드 2: A person wearing headphones looking at three floating screens filled with photos and comments, one screen being wiped clean, flat vector illustration, calm blue tones, no text
슬라이드 3: Split scene illustration, left side an old photo album closing, right side a smartphone with social media posts, connected by a thin line, soft pastel colors, no text
슬라이드 4: A desk with a checklist, a magnifying glass over a web page, and a small trash bin, isometric illustration, navy and mint accent, no text
슬라이드 5: One photo dropped into water spreading into many identical ripples and copies, conceptual illustration, dark blue water, minimal, no text
슬라이드 6: Four flat icons in a row, a cardboard parcel, a phone with photo feed, an old computer monitor, a group chat bubble, consistent line-art style, soft colors, no text
슬라이드 7: A balance scale with a delete symbol on one side and a speech bubble on the other, soft neutral background, conceptual minimal illustration, no text
슬라이드 8: Two friendly shield icons side by side, one with an eraser shape inside, one with a checkmark, simple rounded illustration, no text
슬라이드 9: A hand pressing a wooden stamp onto a shipping label, dense pattern ink covering the printed lines, warm lighting, craft mood illustration, no text
슬라이드 10: A small card held in two hands with a simple pattern border, soft daylight, cozy illustration, no text

사건 1: A realistic cardboard parcel on a doorstep with a printed shipping label, label fields visible as blank printed boxes, soft daylight, top-down angle, clean illustration, no readable text
사건 2 사진 A: An illustrated selfie of a student in a school uniform inside a classroom, name tag on the chest as a blank rectangle, blackboard and timetable in the background, flat illustration, no readable text
사건 2 사진 B: An illustrated teenager standing in front of an apartment entrance, shop signboard and building number plate as blank shapes, parked car with blank license plate, daytime, flat illustration, no readable text
사건 2 사진 C: An illustrated birthday cake with candles on a table, a blank name plate on the cake surface, cozy indoor lighting, flat illustration, no readable text
사건 3 검색 화면: A clean search results page layout with empty content blocks and placeholder lines, light background, flat UI illustration, no readable text
사건 3 옛날 계정: An old desktop computer and a dusty notebook on a shelf, cobwebs on the screen corner, warm muted colors, illustration, no text
사건 3 가입 목록: A list of blank app icons in rows on a phone screen, some greyed out, minimal flat UI illustration, no text
사건 4 단톡방: A group chat interface with empty message bubbles and blank profile circles, one bubble containing a small photo placeholder, flat UI illustration, no readable text
사건 4 링크: A phone screen showing a bright promotional popup with a gift box icon and an empty input form, slightly garish colors, flat illustration, no readable text
사건 4 퍼지는 사진: One photo icon duplicating into many smaller copies spreading outward across several chat windows, conceptual flat illustration, muted colors, no text
마무리 기록: A simple case file folder lying open on a desk with blank paper inside, soft top-down view, muted colors, flat illustration, no text
마무리 카드: A blank card with a patterned border lying on a wooden table, soft natural light, cozy illustration, no text
도장 화면: A rubber stamp and its pressed ink pattern side by side on white paper, clean product-style illustration, navy ink, no text

## 12. 만드는 순서

한꺼번에 다 만들지 말고 아래 순서로 만들어 주세요. 한 단계가 끝나면 동작을 확인한 뒤 다음으로 넘어갑니다.

1. 수업코드 만들기와 학생 로그인
2. 사건 1 전체 (찾기 화면, 선택 화면, 보고서)
3. 교사 화면의 학생 현황과 오늘의 숫자
4. 사건 2, 3, 4
5. 약속 카드와 도장 설계, 인쇄 도안
6. 공유 보드 전체 (약속 카드 벽, 도장 갤러리, 갈린 문제)
7. 교사용 슬라이드와 비밀번호 3035
8. 초등과 중등 난이도 분기 적용