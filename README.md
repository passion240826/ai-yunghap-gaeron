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

- Expo `~54.0.33`
- React `19.1.0`
- React Native `0.81.5`
- React Native Web
- TypeScript

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
└── android/
```

## 개발 메모

- 현재 앱은 Expo 기반으로 Android, iOS, Web 실행을 지원합니다.
- 웹 배포는 `expo export --platform web` 기반의 정적 번들 방식입니다.
- 안정적인 Expo CLI 사용을 위해 Node.js LTS 버전 사용을 권장합니다.
