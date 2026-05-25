# 꿈길 찾기

초등학생이 자신의 관심사와 성향을 바탕으로 어울리는 진로를 탐색하고, 추천 결과와 실천 로드맵을 확인할 수 있도록 설계한 Expo 기반 진로 탐색 앱입니다.

## 프로젝트 개요

`꿈길 찾기`는 간단한 질문 흐름을 통해 사용자가 좋아하는 활동을 발견하고, 그 결과를 바탕으로 진로 후보와 다음 행동 계획을 제안하는 것을 목표로 합니다.

현재 버전은 첫 화면 중심의 프로토타입이며, 이후 질문 화면, 추천 결과 화면, 로드맵 화면을 순차적으로 확장할 수 있는 구조로 구성되어 있습니다.

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| 진로 적성 검사 | 사용자의 관심사와 성향을 파악하기 위한 질문 흐름 |
| 진로 추천 | 답변을 바탕으로 어울리는 진로 후보 제안 |
| 로드맵 추천 | 추천 진로에 맞는 작은 실천 미션과 학습 방향 제시 |
| 웹 배포 지원 | Expo Web 정적 번들링을 통해 Vercel 배포 가능 |

## 기술 스택

이 프로젝트는 Expo 기반의 React Native 앱이며, 같은 코드베이스로 Android, iOS, Web 실행을 지원합니다. 웹 배포는 Expo Web 정적 export 결과물을 사용하는 방식입니다.

### 핵심 프레임워크

| 기술 | 버전 | 역할 |
| --- | --- | --- |
| Expo | `~54.0.33` | 앱 실행, 개발 서버, 플랫폼별 빌드와 웹 export를 담당하는 기반 프레임워크 |
| React | `19.1.0` | 화면 상태 관리와 컴포넌트 렌더링 |
| React Native | `0.81.5` | 모바일 UI 컴포넌트, 스타일 시스템, 네이티브 앱 실행 기반 |
| React Native Web | `^0.21.0` | React Native 컴포넌트를 웹에서 렌더링 |
| React DOM | `19.1.0` | Expo Web 실행 시 브라우저 DOM 렌더링 |
| TypeScript | `~5.9.2` | 정적 타입 검사와 타입 기반 개발 |

### Expo 및 앱 실행 환경

- 앱 진입점은 `index.ts`이며, `registerRootComponent`로 `App.tsx`를 등록합니다.
- `App.tsx`는 `src/features/survey/SurveyApp.tsx`의 `SurveyApp` 컴포넌트를 렌더링합니다.
- Expo 설정은 `app.json`에서 관리합니다.
- 화면 방향은 세로 모드(`portrait`)로 설정되어 있습니다.
- iOS는 태블릿을 지원하도록 설정되어 있습니다.
- Android는 edge-to-edge 화면과 adaptive icon을 사용합니다.
- Expo New Architecture가 활성화되어 있습니다.

### 프론트엔드 UI 구성

- UI는 React Native 기본 컴포넌트(`View`, `Text`, `Pressable`, `ScrollView`, `Image`, `TextInput`, `SafeAreaView`)로 구성합니다.
- 스타일은 `StyleSheet.create` 기반의 React Native 스타일 객체로 관리합니다.
- 화면 크기 대응은 `useWindowDimensions`를 사용해 모바일/넓은 화면 레이아웃을 분기합니다.
- 이미지 리소스는 `require`와 Expo asset 처리를 통해 앱에 포함합니다.
- 아이콘은 별도 아이콘 라이브러리 없이 텍스트 이모지와 이미지 asset을 함께 사용합니다.

### 언어와 타입 시스템

- 전체 앱 코드는 TypeScript(`.ts`, `.tsx`)로 작성되어 있습니다.
- `tsconfig.json`은 `expo/tsconfig.base`를 확장합니다.
- `strict: true`가 켜져 있어 엄격한 타입 검사를 사용합니다.
- 주요 도메인 타입은 `src/features/survey/types.ts`에 정의되어 있습니다.

### 상태 관리와 데이터 처리

- 별도 상태 관리 라이브러리 없이 React의 `useState`, `useMemo`, `useEffect`, `useRef`를 사용합니다.
- 설문 문항, 진로 유형, 활동 데이터는 `src/features/survey/data.ts`의 정적 데이터로 관리합니다.
- 점수 계산과 결과 판정 로직은 `src/features/survey/scoring.ts`에 분리되어 있습니다.
- 앱 내부 화면 전환은 라우터 라이브러리 없이 컴포넌트 상태값으로 제어합니다.

### 에셋 구성

- 앱 아이콘, 스플래시, 파비콘은 `assets/`에 저장되어 있습니다.
- 진로 결과 이미지는 `assets/career-results/`에 저장되어 있습니다.
- 드림월드 홈 버튼과 마을 지도 이미지는 프로젝트 루트의 PNG 파일을 사용합니다.

### 개발 및 빌드 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm start` | Expo 개발 서버 실행 |
| `npm run android` | Android 네이티브 앱 실행 |
| `npm run ios` | iOS 네이티브 앱 실행 |
| `npm run web` | Expo Web 개발 서버 실행 |
| `npm run build` | `expo export --platform web`으로 웹 정적 번들 생성 |

### 배포 방식

- 웹 배포는 `npm run build`로 생성되는 `dist` 폴더를 정적 호스팅에 배포하는 방식입니다.
- Vercel 같은 정적 호스팅 환경에서는 Build Command를 `npm run build`, Output Directory를 `dist`로 설정합니다.
- 현재 프로젝트는 서버 API 없이 클라이언트 앱 중심으로 구성되어 있습니다.

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm start
```

웹에서 바로 확인하려면:

```bash
npm run web
```

## 웹 번들링

Vercel 같은 정적 호스팅 환경에 배포할 때는 아래 명령으로 웹 번들을 생성합니다.

```bash
npm run build
```

빌드 결과물은 `dist` 폴더에 생성됩니다.

## Vercel 배포 설정

Vercel의 Build and Output Settings는 아래처럼 설정하면 됩니다.

| 항목 | 값 |
| --- | --- |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

직접 명령을 넣는 경우 Build Command를 `npx expo export --platform web`으로 설정해도 됩니다.

## 프로젝트 구조

```txt
.
├── App.tsx
├── app.json
├── index.ts
├── package.json
├── assets/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   ├── splash-icon.png
│   └── career-results/
├── src/
│   └── features/
│       └── survey/
│           ├── SurveyApp.tsx
│           ├── data.ts
│           ├── scoring.ts
│           ├── styles.ts
│           └── types.ts
├── 홈버튼.png
└── 마을_이미지.png
```

## 개발 메모

- 현재 앱은 Expo 기반으로 Android, iOS, Web 실행을 지원합니다.
- 웹 배포는 `expo export --platform web` 기반의 정적 번들 방식입니다.
- 안정적인 Expo CLI 사용을 위해 Node.js LTS 버전 사용을 권장합니다.
