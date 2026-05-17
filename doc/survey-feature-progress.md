# 설문조사 기능 진행 기록

## 기준 자료

- 요구사항 파일: `설문조사기능.md`
- 원본 PDF: `ai융개론 팀플 자료조사.전서연 (2).pdf`
- 구현 기준일: 2026-05-17
- 프로젝트: Expo + React Native + TypeScript

## 현재 구현 요약

PDF 자료를 기반으로 탐구형, 예술형, 사회형 3개 유형 진로 검사 MVP를 구현했다. 사용자는 시작 화면에서 검사를 시작하고, 75개 문항에 답한 뒤 결과 유형과 유형별 로드맵을 확인할 수 있다. 기본 문항 점수가 동점이면 동점 유형끼리 추가 질문을 진행해 최종 유형을 결정한다.

## 화면 흐름

1. 시작 화면
   - 앱명: `꿈길 찾기`
   - 검사 유형 안내: 탐구형, 예술형, 사회형
   - `검사 시작하기` 버튼으로 설문 시작
2. 설문 화면
   - 총 75문항
   - 탐구형 25문항, 예술형 25문항, 사회형 25문항
   - 선택지: `그렇지 않다`, `보통이다`, `그렇다`
   - 진행률 바와 완료 문항 수 표시
   - `이전 문항`, `처음으로` 버튼 제공
3. 동점 추가 질문 화면
   - 기본 75문항 결과에서 최고점 유형이 2개 이상일 때만 진입
   - 동점 유형당 2문항씩 추가 질문
   - 2개 유형 동점이면 4문항, 3개 유형 동점이면 6문항
   - 추가 문항도 같은 3점 척도로 답변
4. 결과 화면
   - `당신은 ㅇㅇ형입니다.` 문구 표시
   - 유형별 이모지 기반 이미지 자리 표시
   - 성향 요약 리포트와 성향 맞춤 가이드 표시
   - 세 유형의 최종 점수 바 표시
   - `로드맵을 확인해보세요!`, `다시 검사하기` 버튼 제공
5. 로드맵 화면
   - 최종 결과 유형에 맞는 3단계 로드맵 표시
   - 단계별 제목, 장소, 수행 퀘스트 포함
   - `결과로`, `처음 화면으로` 버튼 제공

## 구현된 기능

- PDF 기반 문항 데이터 입력
  - `src/features/survey/data.ts`에 총 75문항 저장
  - PDF 추출 텍스트의 명백한 오탈자와 띄어쓰기 일부를 사람이 읽기 좋게 보정
- 유형 프로필 데이터
  - 탐구형: 미래를 여는 꼬마 과학자, 지적 탐험가
  - 예술형: 트렌디한 디지털 크리에이터, 아이디어 크리에이터
  - 사회형: 마음을 치유하는 청소년 멘토/리더, 다정한 리더
- 점수 계산
  - `그렇지 않다`: 0점
  - `보통이다`: 1점
  - `그렇다`: 2점
  - 기본 유형별 최고 점수: 25문항 x 2점 = 50점
- 동점 처리
  - 최고점 유형 목록을 계산
  - 최고점 유형이 1개면 바로 결과 화면으로 이동
  - 최고점 유형이 2개 이상이면 동점 추가 질문 화면으로 이동
  - 추가 질문 점수를 기본 점수에 합산해 최종 결과 결정
  - 추가 질문 후에도 동점이면 `investigative -> artistic -> social` 순서상 먼저 나온 유형 유지
- 터치 피드백
  - 모든 주요 `Pressable` 버튼에 Android `android_ripple` 적용
  - iOS/Web에서도 눌림이 보이도록 opacity + scale pressed 스타일 적용
  - 최근 요청 반영으로 리플 색상과 눌림 opacity를 더 어둡게 조정
- 파일 분리
  - 단일 `App.tsx`에 몰아넣지 않고 `src/features/survey` 기능 단위로 분리
  - 다른 Codex 세션이 이어받기 쉽도록 이 문서 유지

## 파일 구조

- `App.tsx`
  - 앱 엔트리.
  - 현재는 `SurveyApp`만 import해서 렌더링.
- `src/features/survey/SurveyApp.tsx`
  - 화면 전환 상태 관리.
  - `screen` 상태값: `home`, `survey`, `tieBreaker`, `result`, `roadmap`
  - 기본 설문 답변 상태: `answers`
  - 동점 추가 질문 답변 상태: `tieBreakerAnswers`
  - 현재 문항 인덱스: `currentIndex`
  - 동점 추가 질문 인덱스: `tieBreakerIndex`
  - 동점 유형 목록: `tiedTypes`
- `src/features/survey/data.ts`
  - `careerTypes`
  - `profiles`
  - `questions`
  - `tieBreakerQuestions`
  - `answerOptions`
  - `maxTypeScore`
- `src/features/survey/scoring.ts`
  - `calculateScores`
  - `calculateTieBreakerScores`
  - `calculateScoresForQuestions`
  - `combineScores`
  - `getTopCareerType`
  - `getTopCareerTypes`
  - `getTieBreakerQuestions`
  - `getProgressPercent`
  - 참고: `getTopCareerTypeByOrder`는 현재 직접 사용되지는 않지만 동점 순서 기반 판정용으로 남아 있음.
- `src/features/survey/types.ts`
  - `CareerType`
  - `SurveyScreen`
  - `AnswerValue`
  - `Question`
  - `RoadmapStep`
  - `CareerProfile`
  - `AnswerMap`
  - `CareerScores`
- `src/features/survey/styles.ts`
  - 설문 기능 전체 스타일.
  - `pressed`, `tieNotice` 등 터치 피드백/동점 안내 스타일 포함.

## 점수 정책 상세

- 기본 문항 점수만 먼저 계산한다.
- 기본 점수 예시:
  - 탐구형 30, 예술형 28, 사회형 20이면 탐구형 결과로 바로 이동.
  - 탐구형 30, 예술형 30, 사회형 20이면 탐구형/예술형 추가 질문으로 이동.
  - 탐구형 30, 예술형 30, 사회형 30이면 세 유형 모두 추가 질문으로 이동.
- 추가 질문은 동점 유형에 대해서만 생성한다.
  - 탐구형/예술형 동점: `tie-i1`, `tie-i2`, `tie-a1`, `tie-a2`
  - 세 유형 동점: 위 문항에 `tie-s1`, `tie-s2`까지 포함
- 최종 점수는 `기본 점수 + 추가 질문 점수`.
- 결과 화면의 점수 바는 동점 추가 질문을 받은 유형만 최대치를 54점으로 계산한다.
  - 기본 최대 50점 + 추가 2문항 x 2점 = 54점
  - 추가 질문을 받지 않은 유형은 최대 50점 기준.

## 현재 UI/UX 상태

- 네비게이션 라이브러리는 아직 도입하지 않았다.
- 화면 전환은 `SurveyApp.tsx` 내부의 `screen` 상태로 처리한다.
- 스크롤 기반 단일 화면들이라 모바일/웹에서 동작한다.
- 실제 이미지 자산은 아직 없다.
  - 결과/로드맵 이미지는 현재 이모지와 이미지 자리 표시 텍스트로 대체.
- `Pressable` 버튼은 Android 리플과 pressed 스타일을 모두 사용한다.
  - 주요 버튼 리플: 어두운 반투명 색상
  - 선택지 리플: 선택/미선택 상태에 따라 다른 어두운 반투명 색상

## 검증 이력

- `npx tsc --noEmit` 통과
- `npm run build` 통과
- `npm run build` 결과로 `dist` 생성 확인
- 개발 서버 참고
  - 일반 `npm run web` 실행 시 Expo CLI의 의존성 버전 확인 API 호출에서 `fetch failed`가 난 적 있음.
  - 우회 실행 명령: `EXPO_OFFLINE=1 npm run web -- --port 8081`
  - 이 명령으로 `http://localhost:8081` 대기 상태까지 확인했음.

## 현재 미완성/주의점

- 실제 결과 이미지와 로드맵 이미지가 없다.
  - 추후 `assets/`에 유형별 이미지를 추가하고 React Native `Image` 컴포넌트로 교체 필요.
- 결과 저장 기능이 없다.
  - 앱을 새로 시작하면 답변과 결과가 초기화됨.
  - AsyncStorage 또는 Expo SecureStore 도입 검토.
- 설문이 75문항이라 길다.
  - 섹션 전환, 중간 저장, 완료 전 검토 화면을 추가하면 UX가 좋아질 수 있음.
- 화면 컴포넌트가 아직 `SurveyApp.tsx` 한 파일에 모여 있다.
  - 데이터/로직/스타일은 분리했지만 화면 JSX는 추가 분리 가능.
  - 후보: `HomeScreen.tsx`, `SurveyScreen.tsx`, `TieBreakerScreen.tsx`, `ResultScreen.tsx`, `RoadmapScreen.tsx`
- 테스트 러너가 없다.
  - `scoring.ts`는 순수 함수라 단위 테스트 도입 시 우선 테스트 대상.
- `package-lock.json`은 작업 전부터 수정 상태였음.
  - 이번 기능 구현에서 의존성 추가는 하지 않았다.

## 다음 작업 후보

1. 실제 이미지 추가
   - 탐구형, 예술형, 사회형 결과 이미지
   - 유형별 로드맵 이미지 또는 일러스트
2. 화면 컴포넌트 추가 분리
   - 현재 `SurveyApp.tsx`가 길어지고 있으므로 화면 단위 파일로 나누는 작업 권장
3. 결과 저장/지난 결과 보기
   - MVP 계획의 `지난 결과 보기`와 연결
4. 동점 처리 UX 개선
   - 추가 질문 진입 전 간단한 안내 모달 또는 전환 애니메이션 추가
5. 점수 결과 상세화
   - 1등 유형뿐 아니라 2등 유형도 보조 성향으로 표시
6. 테스트 추가
   - 점수 계산, 동점 감지, 추가 질문 생성, 최종 합산 로직 테스트

## 이어받는 세션을 위한 빠른 확인 순서

1. `src/features/survey/SurveyApp.tsx`에서 화면 흐름 확인
2. `src/features/survey/data.ts`에서 문항/프로필/로드맵 데이터 확인
3. `src/features/survey/scoring.ts`에서 점수와 동점 처리 로직 확인
4. 변경 후 `npx tsc --noEmit` 실행
5. 웹 번들까지 확인하려면 `npm run build` 실행
