import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { answerOptions, careerTypes, experienceMissions, maxTypeScore, profiles, questions, seoulCareerActivities } from './data';
import {
  calculateScores,
  calculateTieBreakerScores,
  combineScores,
  getProgressPercent,
  getTieBreakerQuestions,
  getTopCareerType,
  getTopCareerTypes,
} from './scoring';
import { styles } from './styles';
import type { AnswerMap, AnswerValue, CareerScores, CareerType, ExperienceMission, ExperienceSubmission, SeoulCareerActivity, SurveyScreen } from './types';

type DiaryEntry = {
  id: string;
  type: string;
  goal: string;
  date: string;
  content: string;
};

type LocalAccount = {
  id: string;
  name: string;
  password: string;
  createdAt: string;
  lastLoginAt: string;
};

type ActiveAccount = {
  id: string;
  name: string;
};

type SavedActivityState = {
  selectedHomeType: CareerType | null;
  currentIndex: number;
  tieBreakerIndex: number;
  tiedTypes: CareerType[];
  answers: AnswerMap;
  tieBreakerAnswers: AnswerMap;
  selectedMissionIndex: number | null;
  puzzleMissionStates: Partial<Record<CareerType, PuzzleMissionState>>;
  selectedPuzzleType: CareerType | null;
  diaryUnlocked: boolean;
  diaryEntries: DiaryEntry[];
  diaryMode: 'list' | 'form' | 'detail';
  experienceSubmissions: Record<string, ExperienceSubmission>;
  selectedExperienceId: string;
  portfolioName: string;
  portfolioDesiredCareer: string;
  portfolioNextGoal: string;
  hasSurveyResult: boolean;
  diaryFirstEntryBonusClaimed: boolean;
  selectedGameVillageId: GameVillageId;
  selectedGameMissionId: string;
  gameView: 'main' | 'map' | 'mission';
  completedGameMissions: Record<string, boolean>;
  gameMissionSubmissions: Record<string, GameMissionSubmission>;
  spentRewardPoints: number;
  rewardEntries: Record<string, boolean>;
};

type PuzzleMissionState = {
  reflections: string[];
  completedCount: number;
};

type GameVillageId = 'research' | 'creation' | 'communication' | 'care' | 'field';

type GameMission = {
  id: string;
  step: 1 | 2 | 3;
  title: string;
  kind: 'career';
  prompt: string;
  checklist: string[];
  proofHint: string;
  stat: string;
};

type GameVillage = {
  id: GameVillageId;
  title: string;
  theme: string;
  npc: string;
  icon: string;
  color: string;
  softColor: string;
  careerGroup: string;
  personality: string;
  growthActivities: string[];
  roadmap: string[];
  mapPosition: {
    top: string;
    left: string;
  };
  missions: GameMission[];
};

type RewardItem = {
  id: string;
  category: 'building' | 'hero' | 'gift';
  title: string;
  description: string;
  cost: number;
  confirmationText: string;
};

type GameMissionSubmission = {
  missionId: string;
  photoText: string;
  reflection: string;
  earnedPoints: number;
  completedAt: string;
};

type ActivityAiType = CareerType | 'auto';

type ActivityRecommendation = {
  activity: SeoulCareerActivity;
  score: number;
  distanceKm: number | null;
  reasons: string[];
};

const gameHomeButtonImage = require('../../../홈버튼.png');
const villageMapImage = require('../../../마을_이미지.png');
const investigativeAiResearcherImage = require('../../../assets/career-results/investigative-ai-researcher.png');
const investigativeSoftwareDeveloperImage = require('../../../assets/career-results/investigative-software-developer.png');
const artisticBallerinaImage = require('../../../assets/career-results/artistic-ballerina.png');
const artisticFashionDesignerImage = require('../../../assets/career-results/artistic-fashion-designer.png');
const socialCounselorImage = require('../../../assets/career-results/social-counselor.png');
const socialTeacherImage = require('../../../assets/career-results/social-teacher.png');

const resultCareerJobs: Record<CareerType, { name: string; image: ImageSourcePropType }[]> = {
  investigative: [
    { name: 'AI 연구원', image: investigativeAiResearcherImage },
    { name: '소프트웨어 개발자', image: investigativeSoftwareDeveloperImage },
  ],
  artistic: [
    { name: '발레리나', image: artisticBallerinaImage },
    { name: '패션 디자이너', image: artisticFashionDesignerImage },
  ],
  social: [
    { name: '상담사', image: socialCounselorImage },
    { name: '교사', image: socialTeacherImage },
  ],
};

const gameVillages: GameVillage[] = [
  {
    id: 'research',
    title: '탐구마을',
    theme: '관찰과 실험',
    npc: '과학자',
    icon: '🔬',
    color: '#2F80ED',
    softColor: '#EAF3FF',
    careerGroup: '과학·AI·데이터·의료 연구 직업군',
    personality: '궁금한 점을 끝까지 파고들고, 자료와 근거를 비교하며 답을 찾는 성향',
    growthActivities: ['관찰 일지 쓰기', '작은 실험 설계하기', '코딩·로봇 체험 참여'],
    roadmap: ['질문 만들기', '자료 조사', '실험·코딩 결과물 만들기'],
    mapPosition: { top: '8%', left: '39%' },
    missions: [
      {
        id: 'research-cause',
        step: 1,
        title: '궁금한 현상 관찰',
        kind: 'career',
        prompt: '주변에서 궁금했던 현상 하나를 관찰하고 사진 설명을 남겨보세요.',
        checklist: ['관찰할 대상을 정했나요?', '운영 시간이나 장소를 확인했나요?', '사진 설명을 적을 준비가 되었나요?'],
        proofHint: '예: 과학관 전시 사진, 식물 관찰 사진, 실험 준비물 사진 설명',
        stat: '미션 에너지 1/3',
      },
      {
        id: 'research-data',
        step: 2,
        title: '원인 추측과 자료 찾기',
        kind: 'career',
        prompt: '관찰한 현상의 원인을 한 가지 추측하고 관련 자료를 찾아 한 줄로 정리하세요.',
        checklist: ['추측을 한 문장으로 썼나요?', '자료 출처나 검색어를 남겼나요?', '보호자와 확인할 내용이 있나요?'],
        proofHint: '예: 검색한 자료 제목, 책 이름, 전시 설명문 요약',
        stat: '미션 에너지 2/3',
      },
      {
        id: 'research-real',
        step: 3,
        title: '작은 실험 결과 기록',
        kind: 'career',
        prompt: '작은 실험, 코딩 결과, 관찰 결과 중 하나를 완성하고 결과를 기록하세요.',
        checklist: ['결과물을 완성했나요?', '실패하거나 바꾼 점도 적었나요?', '다음에 더 해보고 싶은 질문을 남겼나요?'],
        proofHint: '예: 실험 결과 사진 설명, 스크래치 작품명, 관찰표 파일명',
        stat: '미션 에너지 3/3',
      },
    ],
  },
  {
    id: 'creation',
    title: '예술마을',
    theme: '아이디어와 표현',
    npc: '디자이너',
    icon: '🎨',
    color: '#E0568A',
    softColor: '#FFF0F5',
    careerGroup: '디자인·콘텐츠·영상·공연기획 직업군',
    personality: '새로운 아이디어를 떠올리고 색, 이미지, 이야기로 표현하는 성향',
    growthActivities: ['아이디어 스케치', '카드뉴스·영상 만들기', '작품 발표와 피드백 받기'],
    roadmap: ['좋아하는 작품 분석', '나만의 콘텐츠 제작', '공모전·전시 도전'],
    mapPosition: { top: '28%', left: '75%' },
    missions: [
      {
        id: 'creation-color',
        step: 1,
        title: '아이디어 스케치',
        kind: 'career',
        prompt: '나만의 캐릭터, 그림, 카드뉴스 아이디어 중 하나를 스케치하고 설명하세요.',
        checklist: ['표현할 주제를 골랐나요?', '사용할 도구를 준비했나요?', '작품 사진 설명을 남길 수 있나요?'],
        proofHint: '예: 캐릭터 스케치 사진 설명, 포스터 초안 파일명',
        stat: '미션 에너지 1/3',
      },
      {
        id: 'creation-user',
        step: 2,
        title: '작품 제목과 의도',
        kind: 'career',
        prompt: '작품에 제목을 붙이고 왜 그렇게 표현했는지 한 줄로 설명하세요.',
        checklist: ['작품 제목을 정했나요?', '색이나 모양을 고른 이유를 적었나요?', '보는 사람이 이해할 수 있게 설명했나요?'],
        proofHint: '예: 작품 제목, 사용한 색, 전달하고 싶은 메시지',
        stat: '미션 에너지 2/3',
      },
      {
        id: 'creation-real',
        step: 3,
        title: '작품 소개',
        kind: 'career',
        prompt: '친구나 가족에게 작품을 소개하고 들은 반응 또는 느낀 점을 남기세요.',
        checklist: ['작품을 완성했나요?', '누군가에게 소개했나요?', '피드백이나 느낀 점을 적었나요?'],
        proofHint: '예: 작품 사진 설명, 소개한 사람, 받은 피드백',
        stat: '미션 에너지 3/3',
      },
    ],
  },
  {
    id: 'communication',
    title: '소통마을',
    theme: '공정한 대화',
    npc: '판사',
    icon: '⚖️',
    color: '#27AE60',
    softColor: '#EAF8EF',
    careerGroup: '법·교육·상담·미디어 소통 직업군',
    personality: '상대의 입장을 듣고 공정하게 조정하며, 생각을 말과 글로 전달하는 성향',
    growthActivities: ['인터뷰 질문 만들기', '토론·발표 연습', '갈등 조정 역할 맡기'],
    roadmap: ['경청 연습', '토론 참여', '인터뷰·발표 포트폴리오 만들기'],
    mapPosition: { top: '77%', left: '70%' },
    missions: [
      {
        id: 'communication-fair',
        step: 1,
        title: '경청 미션',
        kind: 'career',
        prompt: '친구나 가족의 이야기를 끝까지 듣고 핵심 내용을 한 줄로 정리하세요.',
        checklist: ['대화할 사람을 정했나요?', '중간에 끊지 않고 들었나요?', '상대가 불편하지 않게 허락을 구했나요?'],
        proofHint: '예: 대화 주제, 들은 내용 요약, 배운 점',
        stat: '미션 에너지 1/3',
      },
      {
        id: 'communication-word',
        step: 2,
        title: '공감 문장 만들기',
        kind: 'career',
        prompt: '상대의 마음을 존중하는 공감 문장 2개를 만들어보세요.',
        checklist: ['상대의 감정을 먼저 적었나요?', '충고보다 공감을 먼저 했나요?', '상처가 될 표현을 뺐나요?'],
        proofHint: '예: 네 마음이 답답했겠다 / 같이 방법을 찾아보자',
        stat: '미션 에너지 2/3',
      },
      {
        id: 'communication-real',
        step: 3,
        title: '진로 인터뷰 기록',
        kind: 'career',
        prompt: '선생님, 상담사, 가족, 친구 중 한 명과 진로 이야기를 나누고 느낀 점을 적으세요.',
        checklist: ['질문 1개 이상을 준비했나요?', '대화 내용을 짧게 기록했나요?', '내 진로와 연결되는 점을 찾았나요?'],
        proofHint: '예: 인터뷰 질문, 인상 깊은 답변, 새로 알게 된 점',
        stat: '미션 에너지 3/3',
      },
    ],
  },
  {
    id: 'care',
    title: '돌봄마을',
    theme: '건강과 배려',
    npc: '간호사',
    icon: '🩺',
    color: '#9B51E0',
    softColor: '#F3ECFF',
    careerGroup: '보건·복지·심리·생활지원 직업군',
    personality: '사람의 몸과 마음 상태를 살피고 필요한 도움을 연결하는 성향',
    growthActivities: ['건강 캠페인 만들기', '봉사 활동 기록하기', '마음 건강 대화법 연습'],
    roadmap: ['기본 안전·건강 지식 익히기', '돌봄 활동 실천', '보건·복지 직업인 인터뷰'],
    mapPosition: { top: '77%', left: '19%' },
    missions: [
      {
        id: 'care-first',
        step: 1,
        title: '건강 습관 정하기',
        kind: 'career',
        prompt: '손 씻기, 수면, 마음 건강 중 하나를 골라 실천 목표를 정하세요.',
        checklist: ['실천할 건강 습관을 골랐나요?', '오늘 할 수 있는 작은 행동인가요?', '준비물이 필요한지 확인했나요?'],
        proofHint: '예: 오늘의 건강 목표, 실천 전 준비 사진 설명',
        stat: '미션 에너지 1/3',
      },
      {
        id: 'care-listen',
        step: 2,
        title: '돌봄 실천',
        kind: 'career',
        prompt: '정한 건강 습관을 직접 실천하고 어떤 점이 좋았는지 적으세요.',
        checklist: ['실천 시간을 정했나요?', '무리하지 않는 방법인가요?', '도움이 필요한 사람에게 알려줄 수 있나요?'],
        proofHint: '예: 손 씻기 캠페인 문구, 수면 기록, 마음 건강 메모',
        stat: '미션 에너지 2/3',
      },
      {
        id: 'care-real',
        step: 3,
        title: '건강 캠페인 문구',
        kind: 'career',
        prompt: '친구들에게 알려주고 싶은 건강 캠페인 문구를 만들고 기록하세요.',
        checklist: ['누구에게 필요한 문구인지 생각했나요?', '짧고 기억하기 쉽게 썼나요?', '실천을 응원하는 표현인가요?'],
        proofHint: '예: 캠페인 문구 사진 설명, 포스터 초안, 발표 내용',
        stat: '미션 에너지 3/3',
      },
    ],
  },
  {
    id: 'field',
    title: '현장마을',
    theme: '안전과 실행',
    npc: '소방관',
    icon: '🚒',
    color: '#F2994A',
    softColor: '#FFF3E6',
    careerGroup: '안전·공학·스포츠·현장 운영 직업군',
    personality: '상황을 빠르게 파악하고 몸으로 실행하며 팀과 함께 문제를 해결하는 성향',
    growthActivities: ['안전 점검표 작성', '팀 프로젝트 역할 맡기', '체험형 캠프 참여'],
    roadmap: ['현장 규칙 익히기', '팀 실행 미션', '안전·기술 체험 인증'],
    mapPosition: { top: '29%', left: '6%' },
    missions: [
      {
        id: 'field-exit',
        step: 1,
        title: '안전 표지 찾기',
        kind: 'career',
        prompt: '학교나 집 주변에서 안전 표지, 비상구, 소화기 중 하나를 찾아 기록하세요.',
        checklist: ['확인할 장소가 안전한가요?', '보호자나 선생님께 알렸나요?', '표지의 의미를 이해했나요?'],
        proofHint: '예: 비상구 표지 사진 설명, 소화기 위치, 안전 안내문',
        stat: '미션 에너지 1/3',
      },
      {
        id: 'field-team',
        step: 2,
        title: '현장 역할 나누기',
        kind: 'career',
        prompt: '작은 팀 활동에서 필요한 역할을 나누고 내가 맡을 역할을 적으세요.',
        checklist: ['목표를 먼저 정했나요?', '역할을 공평하게 나눴나요?', '내가 맡은 일을 끝낼 수 있나요?'],
        proofHint: '예: 역할표 사진 설명, 내가 맡은 역할, 팀 활동 기록',
        stat: '미션 에너지 2/3',
      },
      {
        id: 'field-real',
        step: 3,
        title: '안전 수칙 카드',
        kind: 'career',
        prompt: '친구들에게 알려줄 안전 수칙 카드 1장을 만들고 설명하세요.',
        checklist: ['가장 중요한 수칙 1개를 골랐나요?', '그림이나 짧은 문구로 표현했나요?', '위험 행동을 피하는 방법을 넣었나요?'],
        proofHint: '예: 안전 카드 사진 설명, 카드 제목, 알려주고 싶은 이유',
        stat: '미션 에너지 3/3',
      },
    ],
  },
];

const gameRewards: RewardItem[] = [
  {
    id: 'dream-castle',
    category: 'building',
    title: '내 건물 상점: 작은 성',
    description: '드림월드 내 구역에 작은 성을 짓는 꾸미기 보상',
    cost: 600,
    confirmationText: '내 구역에 작은 성이 세워졌어요!',
  },
  {
    id: 'dream-restaurant',
    category: 'building',
    title: '내 건물 상점: 레스토랑',
    description: '친구들이 둘러볼 수 있는 레스토랑 건물을 추가합니다.',
    cost: 450,
    confirmationText: '드림월드 레스토랑 공사가 완료되었어요!',
  },
  {
    id: 'animal-food',
    category: 'hero',
    title: '리얼 히어로: 보호소 사료 10g',
    description: '유기동물 보호소에 사료 10g을 보낸 것으로 기록하는 사회공헌 보상',
    cost: 100,
    confirmationText: 'OO 가디언 덕분에 보호소 친구들이 오늘 맛있는 밥을 먹었어요!',
  },
  {
    id: 'bee-support',
    category: 'hero',
    title: '리얼 히어로: 꿀벌 살리기',
    description: '우리 지역 꿀벌 살리기 후원에 참여한 것으로 기록합니다.',
    cost: 100,
    confirmationText: '드림월드 꽃밭과 현실의 꿀벌을 함께 지켰어요!',
  },
  {
    id: 'guardian-badge',
    category: 'gift',
    title: '리얼 기프트: 가디언 배지 교환권',
    description: '기관 방문 시 안내 데스크에서 보여줄 수 있는 교환권 코드',
    cost: 300,
    confirmationText: '교환권 코드 DG-BADGE-2026이 발급되었어요.',
  },
  {
    id: 'experience-sticker',
    category: 'gift',
    title: '리얼 기프트: 체험 스티커 교환권',
    description: '오프라인 체험 활동에서 사용할 수 있는 발표용 교환권',
    cost: 250,
    confirmationText: '교환권 코드 DG-STICKER-2026이 발급되었어요.',
  },
];

const ACCOUNT_INDEX_KEY = 'dream-road-local-accounts';
const ACTIVE_ACCOUNT_KEY = 'dream-road-active-account';
const ACTIVITY_KEY_PREFIX = 'dream-road-activity:';

function getStorage() {
  const storageRef = (globalThis as { localStorage?: Storage }).localStorage;
  return storageRef ?? null;
}

function normalizeAccountName(name: string) {
  return name.trim().toLowerCase();
}

function readJson<T>(key: string, fallback: T): T {
  const storage = getStorage();

  if (!storage) {
    return fallback;
  }

  try {
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}

function getActivityKey(accountId: string) {
  return `${ACTIVITY_KEY_PREFIX}${accountId}`;
}

function getStoredAccounts() {
  return readJson<LocalAccount[]>(ACCOUNT_INDEX_KEY, []);
}

function storeAccounts(accounts: LocalAccount[]) {
  writeJson(ACCOUNT_INDEX_KEY, accounts);
}

function getInitialVillageId(type: CareerType): GameVillageId {
  if (type === 'investigative') {
    return 'research';
  }

  if (type === 'artistic') {
    return 'creation';
  }

  return 'communication';
}

function createPuzzleMissionState(): PuzzleMissionState {
  return {
    reflections: ['', '', ''],
    completedCount: 0,
  };
}

function getDiaryDateTime(dateText: string) {
  const normalizedDate = dateText.trim().match(/^(\d{4})[-./\s](\d{1,2})[-./\s](\d{1,2})$/);

  if (normalizedDate) {
    const [, year, month, date] = normalizedDate;
    return Date.UTC(Number(year), Number(month) - 1, Number(date));
  }

  const parsedTime = Date.parse(dateText);
  return Number.isNaN(parsedTime) ? Number.MAX_SAFE_INTEGER : parsedTime;
}

function formatDiaryDate(year: string, month: string, date: string) {
  if (!year || !month || !date) {
    return '';
  }

  return `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
}


type GrowthSnapshot = {
  label: string;
  scores: CareerScores;
};

function getScoreDelta(currentScores: CareerScores, baseScores: CareerScores, type: CareerType) {
  return currentScores[type] - baseScores[type];
}


function calculateDistanceMeters(startLat: number, startLng: number, endLat: number, endLng: number) {
  const earthRadius = 6371000;
  const latDelta = ((endLat - startLat) * Math.PI) / 180;
  const lngDelta = ((endLng - startLng) * Math.PI) / 180;
  const startLatRad = (startLat * Math.PI) / 180;
  const endLatRad = (endLat * Math.PI) / 180;
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(startLatRad) * Math.cos(endLatRad) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function getDistrictCenter(district: string) {
  const districtActivities = seoulCareerActivities.filter((activity) => activity.district === district);

  if (districtActivities.length === 0) {
    return null;
  }

  return {
    lat: districtActivities.reduce((sum, activity) => sum + activity.lat, 0) / districtActivities.length,
    lng: districtActivities.reduce((sum, activity) => sum + activity.lng, 0) / districtActivities.length,
  };
}

function buildActivityRecommendations(
  ageText: string,
  district: string,
  selectedType: CareerType | null,
  interestText: string,
): ActivityRecommendation[] {
  const age = Number(ageText);
  const hasAge = Number.isFinite(age) && age > 0;
  const districtCenter = district === '전체' ? null : getDistrictCenter(district);
  const normalizedInterest = interestText.trim().toLowerCase();

  return seoulCareerActivities
    .map<ActivityRecommendation>((activity) => {
      let score = 0;
      const reasons: string[] = [];
      let distanceKm: number | null = null;

      if (selectedType && activity.types.includes(selectedType)) {
        score += 45;
        reasons.push(`${profiles[selectedType].title} 성향과 활동 주제가 잘 맞아요.`);
      } else if (selectedType) {
        score += 8;
      } else {
        score += 22;
        reasons.push('성향을 아직 고르지 않아 여러 유형을 폭넓게 비교했어요.');
      }

      if (district === '전체') {
        score += 18;
        reasons.push('희망지역을 전체로 두어 서울 전역 활동을 열어두었어요.');
      } else if (activity.district === district) {
        score += 35;
        distanceKm = 0;
        reasons.push(`${district} 희망지역과 정확히 일치해요.`);
      } else if (districtCenter) {
        const distanceMeters = calculateDistanceMeters(districtCenter.lat, districtCenter.lng, activity.lat, activity.lng);
        distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
        const distanceScore = Math.max(0, 25 - distanceKm * 2);
        score += distanceScore;

        if (distanceKm <= 5) {
          reasons.push(`희망지역에서 약 ${distanceKm}km 거리라 이동 부담이 낮아요.`);
        }
      }

      if (hasAge && age >= activity.minAge && age <= activity.maxAge) {
        score += 25;
        reasons.push(`${activity.minAge}-${activity.maxAge}세 권장 활동이라 입력한 나이에 맞아요.`);
      } else if (hasAge && Math.abs(age - activity.minAge) <= 2) {
        score += 10;
        reasons.push('권장 연령과 가깝지만 보호자 확인이 있으면 더 좋아요.');
      } else if (!hasAge) {
        score += 12;
        reasons.push('나이를 입력하면 연령 적합도를 더 정확히 계산할 수 있어요.');
      }

      if (normalizedInterest) {
        const searchableText = `${activity.title} ${activity.place} ${activity.info} ${activity.keywords.join(' ')}`.toLowerCase();

        if (searchableText.includes(normalizedInterest)) {
          score += 15;
          reasons.push(`관심 키워드 "${interestText.trim()}"와 연결돼요.`);
        }
      }

      return {
        activity,
        score: Math.round(score),
        distanceKm,
        reasons: reasons.slice(0, 3),
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

function getProofLabel(mission: ExperienceMission) {
  if (mission.proofType === 'photo') {
    return '사진 업로드';
  }

  if (mission.proofType === 'gps') {
    return '위치 인증';
  }

  if (mission.proofType === 'qr') {
    return 'QR 인증';
  }

  return '소감 인증';
}


function KakaoActivityMap({ activities }: { activities: SeoulCareerActivity[] }) {
  const [mapStatus, setMapStatus] = useState('지도를 준비하고 있어요.');
  const kakaoAppKey = "df31ad748756f9b2386c3c2ab1dd6692"
  useEffect(() => {
    const documentRef = (globalThis as { document?: Document }).document;
    const windowRef = globalThis as typeof globalThis & { kakao?: any };

    if (!documentRef) {
      setMapStatus('웹 환경에서 카카오맵을 확인할 수 있어요.');
      return;
    }

    if (!kakaoAppKey) {
      setMapStatus('EXPO_PUBLIC_KAKAO_MAP_API_KEY를 설정하면 카카오맵이 표시됩니다.');
      return;
    }

    const renderMap = () => {
      const container = documentRef.getElementById('seoul-career-kakao-map');
      const kakao = windowRef.kakao;

      if (!container || !kakao?.maps) {
        return;
      }

      kakao.maps.load(() => {
        const map = new kakao.maps.Map(container, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 8,
        });
        const bounds = new kakao.maps.LatLngBounds();

        activities.forEach((activity) => {
          const position = new kakao.maps.LatLng(activity.lat, activity.lng);
          const marker = new kakao.maps.Marker({ map, position, title: activity.title });
          const infoWindow = new kakao.maps.InfoWindow({
            content: `<div style="width:220px;padding:12px;font-size:13px;line-height:1.45;color:#1F2A44;"><strong>${activity.title}</strong><br/>${activity.district} · ${activity.place}<br/><span style="color:#52657A;">${activity.info}</span></div>`,
          });

          kakao.maps.event.addListener(marker, 'click', () => infoWindow.open(map, marker));
          bounds.extend(position);
        });

        map.setBounds(bounds);
        setMapStatus('');
      });
    };

    if (windowRef.kakao?.maps) {
      renderMap();
      return;
    }

    const existingScript = documentRef.getElementById('kakao-map-sdk');

    if (existingScript) {
      existingScript.addEventListener('load', renderMap, { once: true });
      return;
    }

    const script = documentRef.createElement('script');
    script.id = 'kakao-map-sdk';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false`;
    script.async = true;
    script.addEventListener('load', renderMap, { once: true });
    script.addEventListener('error', () => setMapStatus('카카오맵 SDK를 불러오지 못했습니다.'));
    documentRef.head.appendChild(script);
  }, [activities, kakaoAppKey]);

  return (
    <View style={styles.kakaoMapShell}>
      <View nativeID="seoul-career-kakao-map" style={styles.kakaoMapCanvas} />
      {mapStatus ? (
        <View style={styles.kakaoMapNotice}>
          <Text style={styles.kakaoMapNoticeText}>{mapStatus}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function SurveyApp() {
  const [screen, setScreen] = useState<SurveyScreen>('home');
  const [currentAccount, setCurrentAccount] = useState<ActiveAccount | null>(null);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [selectedHomeType, setSelectedHomeType] = useState<CareerType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tieBreakerIndex, setTieBreakerIndex] = useState(0);
  const [tiedTypes, setTiedTypes] = useState<CareerType[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [tieBreakerAnswers, setTieBreakerAnswers] = useState<AnswerMap>({});
  const [selectedMissionIndex, setSelectedMissionIndex] = useState<number | null>(0);
  const [recordingMissionIndex, setRecordingMissionIndex] = useState<number | null>(null);
  const [reflectionDraft, setReflectionDraft] = useState('');
  const [puzzleMissionStates, setPuzzleMissionStates] = useState<Partial<Record<CareerType, PuzzleMissionState>>>({});
  const [selectedPuzzleType, setSelectedPuzzleType] = useState<CareerType | null>(null);
  const [diaryUnlocked, setDiaryUnlocked] = useState(false);
  const [diaryType, setDiaryType] = useState('');
  const [diaryGoal, setDiaryGoal] = useState('');
  const [diaryYear, setDiaryYear] = useState('');
  const [diaryMonth, setDiaryMonth] = useState('');
  const [diaryDay, setDiaryDay] = useState('');
  const [diaryContent, setDiaryContent] = useState('');
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [diaryMode, setDiaryMode] = useState<'list' | 'form' | 'detail'>('list');
  const [selectedDiaryEntryId, setSelectedDiaryEntryId] = useState<string | null>(null);
  const [showActivityMap, setShowActivityMap] = useState(false);
  const [selectedMapActivityId, setSelectedMapActivityId] = useState<string | null>(null);
  const [activityAiAge, setActivityAiAge] = useState('');
  const [activityAiDistrict, setActivityAiDistrict] = useState('전체');
  const [activityAiType, setActivityAiType] = useState<ActivityAiType>('auto');
  const [activityAiInterest, setActivityAiInterest] = useState('');
  const [activityAiSubmitted, setActivityAiSubmitted] = useState(false);
  const [activityAiResults, setActivityAiResults] = useState<ActivityRecommendation[]>([]);
  const [submittedActivityAiType, setSubmittedActivityAiType] = useState<CareerType | null>(null);
  const [activityAiMapActivityId, setActivityAiMapActivityId] = useState<string | null>(null);
  const [experienceSubmissions, setExperienceSubmissions] = useState<Record<string, ExperienceSubmission>>({});
  const [selectedExperienceId, setSelectedExperienceId] = useState(experienceMissions[0]?.id ?? '');
  const [experienceProofText, setExperienceProofText] = useState('');
  const [experienceReflection, setExperienceReflection] = useState('');
  const [gpsVerifiedMissionId, setGpsVerifiedMissionId] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState('');
  const [portfolioName, setPortfolioName] = useState('김OO');
  const [portfolioDesiredCareer, setPortfolioDesiredCareer] = useState('');
  const [portfolioNextGoal, setPortfolioNextGoal] = useState('');
  const [hasSurveyResult, setHasSurveyResult] = useState(false);
  const [missionEntrySource, setMissionEntrySource] = useState<'home' | 'roadmap'>('roadmap');
  const [experienceEntrySource, setExperienceEntrySource] = useState<'home' | 'roadmap'>('roadmap');
  const [diaryFirstEntryBonusClaimed, setDiaryFirstEntryBonusClaimed] = useState(false);
  const [pointPopupText, setPointPopupText] = useState('');
  const [selectedGameVillageId, setSelectedGameVillageId] = useState<GameVillageId>('research');
  const [selectedGameMissionId, setSelectedGameMissionId] = useState(gameVillages[0].missions[0].id);
  const [gameView, setGameView] = useState<'main' | 'map' | 'mission'>('main');
  const [completedGameMissions, setCompletedGameMissions] = useState<Record<string, boolean>>({});
  const [gameMissionSubmissions, setGameMissionSubmissions] = useState<Record<string, GameMissionSubmission>>({});
  const [gameProofText, setGameProofText] = useState('');
  const [gameReflectionText, setGameReflectionText] = useState('');
  const [selectedStoreCategory, setSelectedStoreCategory] = useState<RewardItem['category']>('building');
  const [gameAnswerStatus, setGameAnswerStatus] = useState('');
  const [spentRewardPoints, setSpentRewardPoints] = useState(0);
  const [rewardEntries, setRewardEntries] = useState<Record<string, boolean>>({});
  const pointPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityMapScrollRef = useRef<ScrollView | null>(null);

  const currentQuestion = questions[currentIndex];
  const tieBreakerQuestions = useMemo(() => getTieBreakerQuestions(tiedTypes), [tiedTypes]);
  const currentTieBreakerQuestion = tieBreakerQuestions[tieBreakerIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = getProgressPercent(answeredCount, questions.length);
  const tieBreakerAnsweredCount = Object.keys(tieBreakerAnswers).length;
  const tieBreakerProgress = getProgressPercent(tieBreakerAnsweredCount, tieBreakerQuestions.length);

  const scores = useMemo(() => calculateScores(answers), [answers]);
  const tieBreakerScores = useMemo(() => calculateTieBreakerScores(tieBreakerAnswers), [tieBreakerAnswers]);
  const surveyFinalScores = useMemo(() => combineScores(scores, tieBreakerScores), [scores, tieBreakerScores]);
  const experienceScores = useMemo<CareerScores>(() => {
    return Object.values(experienceSubmissions).reduce<CareerScores>(
      (nextScores, submission) => {
        const mission = experienceMissions.find((item) => item.id === submission.missionId);

        if (mission) {
          nextScores[mission.type] += submission.earnedXp;
        }

        return nextScores;
      },
      { investigative: 0, artistic: 0, social: 0 },
    );
  }, [experienceSubmissions]);
  const finalScores = useMemo(() => combineScores(surveyFinalScores, experienceScores), [surveyFinalScores, experienceScores]);
  const surveyResultType = useMemo(() => getTopCareerType(surveyFinalScores), [surveyFinalScores]);
  const resultType = useMemo(() => getTopCareerType(finalScores), [finalScores]);
  const resultProfile = profiles[resultType];
  const puzzleResultType = hasSurveyResult ? surveyResultType : resultType;
  const activePuzzleType = selectedPuzzleType ?? puzzleResultType;
  const activePuzzleProfile = profiles[activePuzzleType];
  const puzzleMissions = useMemo(
    () =>
      activePuzzleProfile.missionTasks.map((task, index) => ({
        step: `${index + 1}단계`,
        title: `${index + 1}번째 작은 성장 과제`,
        place: '성장 노트',
        quest: task,
      })),
    [activePuzzleProfile],
  );
  const selectedExperienceMission = experienceMissions.find((mission) => mission.id === selectedExperienceId) ?? experienceMissions[0];
  const completedExperienceCount = Object.keys(experienceSubmissions).length;
  const totalExperienceXp = Object.values(experienceSubmissions).reduce((sum, submission) => sum + submission.earnedXp, 0);
  const activePuzzleState = puzzleMissionStates[activePuzzleType] ?? createPuzzleMissionState();
  const missionReflections = activePuzzleState.reflections;
  const completedMissionCount = activePuzzleState.completedCount;
  const unlockedMissionCount = Math.min(completedMissionCount + 1, puzzleMissions.length);
  const collectedPuzzleCount = Math.min(completedMissionCount + 1, 4);
  const allMissionsCompleted = completedMissionCount >= puzzleMissions.length;
  const puzzleTypes = careerTypes.filter((type) => puzzleMissionStates[type]);
  const puzzlePoints = puzzleTypes.reduce((sum, type) => {
    const state = puzzleMissionStates[type] ?? createPuzzleMissionState();
    return sum + Math.min(state.completedCount + 1, 4) * 2;
  }, 0);
  const diaryBonusPoints = diaryFirstEntryBonusClaimed ? 4 : 0;
  const growthPoints = puzzlePoints + diaryBonusPoints;
  const completedGameMissionList = gameVillages.flatMap((village) => village.missions).filter((mission) => completedGameMissions[mission.id]);
  const initialGameVillageId = getInitialVillageId(surveyResultType);
  const getGameMissionRewardPoints = (villageId: GameVillageId) => (villageId === initialGameVillageId ? 300 : 200);
  const getGameMissionVillage = (missionId: string) => gameVillages.find((village) => village.missions.some((mission) => mission.id === missionId));
  const gameExp = completedGameMissionList.reduce((sum, mission) => {
    const village = getGameMissionVillage(mission.id);
    return sum + (village ? getGameMissionRewardPoints(village.id) : 0);
  }, 0);
  const gamePoints = completedGameMissionList.reduce((sum, mission) => {
    const village = getGameMissionVillage(mission.id);
    return sum + (village ? getGameMissionRewardPoints(village.id) : 0);
  }, 0);
  const gameLevel = Math.floor(gameExp / 100) + 1;
  const currentLevelExp = gameExp % 100;
  const totalCareerPoints = growthPoints + totalExperienceXp + gamePoints;
  const availableCareerPoints = Math.max(totalCareerPoints - spentRewardPoints, 0);
  const unlockedGameVillageIds = useMemo(() => {
    return new Set<GameVillageId>(gameVillages.map((village) => village.id));
  }, []);
  const selectedGameVillage = gameVillages.find((village) => village.id === selectedGameVillageId) ?? gameVillages[0];
  const selectedGameMission =
    selectedGameVillage.missions.find((mission) => mission.id === selectedGameMissionId) ?? selectedGameVillage.missions[0];
  const completedGameMissionCount = completedGameMissionList.length;
  const gameBadges = gameVillages.filter((village) => village.missions.every((mission) => completedGameMissions[mission.id]));
  const selectedGameCompletedCount = selectedGameVillage.missions.filter((mission) => completedGameMissions[mission.id]).length;
  const selectedGameEnergyPercent = Math.round((selectedGameCompletedCount / selectedGameVillage.missions.length) * 100);
  const selectedGameRewardPoints = getGameMissionRewardPoints(selectedGameVillage.id);
  const selectedGameSubmission = gameMissionSubmissions[selectedGameMission.id];
  const selectedStoreRewards = gameRewards.filter((reward) => reward.category === selectedStoreCategory);
  const diaryYears = useMemo(() => Array.from({ length: 16 }, (_, index) => String(2020 + index)), []);
  const diaryMonths = useMemo(() => Array.from({ length: 12 }, (_, index) => String(index + 1)), []);
  const diaryDays = useMemo(() => {
    if (!diaryYear || !diaryMonth) {
      return Array.from({ length: 31 }, (_, index) => String(index + 1));
    }

    const daysInMonth = new Date(Number(diaryYear), Number(diaryMonth), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => String(index + 1));
  }, [diaryMonth, diaryYear]);
  const selectedDiaryDate = formatDiaryDate(diaryYear, diaryMonth, diaryDay);
  const selectedMapActivity = seoulCareerActivities.find((activity) => activity.id === selectedMapActivityId);
  const visibleMapActivities = selectedMapActivity ? [selectedMapActivity] : seoulCareerActivities;
  const activityAiDistricts = useMemo(
    () => ['전체', ...Array.from(new Set(seoulCareerActivities.map((activity) => activity.district)))],
    [],
  );
  const resolvedActivityAiType = activityAiType === 'auto' ? (hasSurveyResult ? resultType : null) : activityAiType;
  const sortedDiaryEntries = useMemo(
    () =>
      [...diaryEntries].sort((left, right) => {
        const dateOrder = getDiaryDateTime(right.date) - getDiaryDateTime(left.date);
        return dateOrder === 0 ? right.id.localeCompare(left.id) : dateOrder;
      }),
    [diaryEntries],
  );
  const latestDiaryEntries = useMemo(
    () =>
      [...diaryEntries].sort((left, right) => {
        const dateOrder = getDiaryDateTime(right.date) - getDiaryDateTime(left.date);
        return dateOrder === 0 ? right.id.localeCompare(left.id) : dateOrder;
      }),
    [diaryEntries],
  );
  const selectedDiaryEntry = sortedDiaryEntries.find((entry) => entry.id === selectedDiaryEntryId);
  const growthSnapshots = useMemo<GrowthSnapshot[]>(() => {
    const snapshots: GrowthSnapshot[] = [{ label: '검사 직후', scores: surveyFinalScores }];
    const runningScores: CareerScores = { ...surveyFinalScores };

    Object.values(experienceSubmissions)
      .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
      .forEach((submission) => {
        const mission = experienceMissions.find((item) => item.id === submission.missionId);

        if (!mission) {
          return;
        }

        runningScores[mission.type] += submission.earnedXp;
        snapshots.push({ label: submission.completedAt, scores: { ...runningScores } });
      });

    if (snapshots.length === 1) {
      snapshots.push({ label: '현재', scores: finalScores });
    }

    return snapshots;
  }, [experienceSubmissions, finalScores, surveyFinalScores]);
  const strongestGrowthType = careerTypes.reduce<CareerType>((winner, type) => {
    return getScoreDelta(finalScores, surveyFinalScores, type) > getScoreDelta(finalScores, surveyFinalScores, winner)
      ? type
      : winner;
  }, 'investigative');
  const weakestExperienceType = careerTypes.reduce<CareerType>((weakest, type) => {
    return experienceScores[type] < experienceScores[weakest] ? type : weakest;
  }, 'investigative');
  const recommendedParentActivities = seoulCareerActivities.filter((activity) => {
    if (weakestExperienceType === 'investigative') {
      return activity.title.includes('과학') || activity.title.includes('로봇') || activity.info.includes('기술');
    }

    if (weakestExperienceType === 'artistic') {
      return activity.title.includes('디자인') || activity.title.includes('미디어') || activity.info.includes('창작');
    }

    return activity.title.includes('청소년') || activity.info.includes('리더십') || activity.info.includes('봉사');
  });

  const getCurrentActivityState = (): SavedActivityState => ({
    selectedHomeType,
    currentIndex,
    tieBreakerIndex,
    tiedTypes,
    answers,
    tieBreakerAnswers,
    selectedMissionIndex,
    puzzleMissionStates,
    selectedPuzzleType,
    diaryUnlocked,
    diaryEntries,
    diaryMode,
    experienceSubmissions,
    selectedExperienceId,
    portfolioName,
    portfolioDesiredCareer,
    portfolioNextGoal,
    hasSurveyResult,
    diaryFirstEntryBonusClaimed,
    selectedGameVillageId,
    selectedGameMissionId,
    gameView,
    completedGameMissions,
    spentRewardPoints,
    rewardEntries,
  });

  const resetActivityState = () => {
    setScreen('home');
    setSelectedHomeType(null);
    setCurrentIndex(0);
    setTieBreakerIndex(0);
    setTiedTypes([]);
    setAnswers({});
    setTieBreakerAnswers({});
    setSelectedMissionIndex(0);
    setRecordingMissionIndex(null);
    setReflectionDraft('');
    setPuzzleMissionStates({});
    setSelectedPuzzleType(null);
    setDiaryUnlocked(false);
    setDiaryType('');
    setDiaryGoal('');
    setDiaryYear('');
    setDiaryMonth('');
    setDiaryDay('');
    setDiaryContent('');
    setDiaryEntries([]);
    setDiaryMode('list');
    setSelectedDiaryEntryId(null);
    setShowActivityMap(false);
    setSelectedMapActivityId(null);
    setExperienceSubmissions({});
    setSelectedExperienceId(experienceMissions[0]?.id ?? '');
    setExperienceProofText('');
    setExperienceReflection('');
    setGpsVerifiedMissionId(null);
    setGpsStatus('');
    setPortfolioName('김OO');
    setPortfolioDesiredCareer('');
    setPortfolioNextGoal('');
    setHasSurveyResult(false);
    setMissionEntrySource('roadmap');
    setExperienceEntrySource('roadmap');
    setDiaryFirstEntryBonusClaimed(false);
    setSelectedGameVillageId('research');
    setSelectedGameMissionId(gameVillages[0].missions[0].id);
    setGameView('main');
    setCompletedGameMissions({});
    setGameAnswerStatus('');
    setSpentRewardPoints(0);
    setRewardEntries({});
  };

  const loadActivityState = (accountId: string) => {
    const savedState = readJson<SavedActivityState | null>(getActivityKey(accountId), null);

    resetActivityState();

    if (!savedState) {
      setActivityLoaded(true);
      return;
    }

    setSelectedHomeType(savedState.selectedHomeType ?? null);
    setCurrentIndex(savedState.currentIndex ?? 0);
    setTieBreakerIndex(savedState.tieBreakerIndex ?? 0);
    setTiedTypes(savedState.tiedTypes ?? []);
    setAnswers(savedState.answers ?? {});
    setTieBreakerAnswers(savedState.tieBreakerAnswers ?? {});
    setSelectedMissionIndex(savedState.selectedMissionIndex ?? 0);
    setPuzzleMissionStates(savedState.puzzleMissionStates ?? {});
    setSelectedPuzzleType(savedState.selectedPuzzleType ?? null);
    setDiaryUnlocked(Boolean(savedState.diaryUnlocked));
    setDiaryEntries(savedState.diaryEntries ?? []);
    setDiaryMode(savedState.diaryMode ?? 'list');
    setExperienceSubmissions(savedState.experienceSubmissions ?? {});
    setSelectedExperienceId(savedState.selectedExperienceId || experienceMissions[0]?.id || '');
    setPortfolioName(savedState.portfolioName || '김OO');
    setPortfolioDesiredCareer(savedState.portfolioDesiredCareer ?? '');
    setPortfolioNextGoal(savedState.portfolioNextGoal ?? '');
    setHasSurveyResult(Boolean(savedState.hasSurveyResult));
    setDiaryFirstEntryBonusClaimed(Boolean(savedState.diaryFirstEntryBonusClaimed));
    setSelectedGameVillageId(savedState.selectedGameVillageId ?? 'research');
    setSelectedGameMissionId(savedState.selectedGameMissionId || gameVillages[0].missions[0].id);
    setGameView(savedState.gameView ?? 'main');
    setCompletedGameMissions(savedState.completedGameMissions ?? {});
    setSpentRewardPoints(savedState.spentRewardPoints ?? 0);
    setRewardEntries(savedState.rewardEntries ?? {});
    setActivityLoaded(true);
  };

  const submitLogin = () => {
    const name = loginName.trim();
    const password = loginPassword;

    if (!name || !password) {
      setLoginStatus('아이디와 비밀번호를 입력하세요.');
      return;
    }

    const accounts = getStoredAccounts();
    const normalizedName = normalizeAccountName(name);
    const existingAccount = accounts.find((account) => normalizeAccountName(account.name) === normalizedName);

    if (loginMode === 'signup') {
      if (existingAccount) {
        setLoginStatus('이미 있는 아이디입니다.');
        return;
      }

      const account: LocalAccount = {
        id: `${Date.now()}-${normalizedName}`,
        name,
        password,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      storeAccounts([...accounts, account]);
      writeJson(ACTIVE_ACCOUNT_KEY, account.id);
      setCurrentAccount({ id: account.id, name: account.name });
      setLoginPassword('');
      setLoginStatus('');
      loadActivityState(account.id);
      return;
    }

    if (!existingAccount || existingAccount.password !== password) {
      setLoginStatus('아이디 또는 비밀번호가 맞지 않습니다.');
      return;
    }

    const updatedAccounts = accounts.map((account) =>
      account.id === existingAccount.id ? { ...account, lastLoginAt: new Date().toISOString() } : account,
    );
    storeAccounts(updatedAccounts);
    writeJson(ACTIVE_ACCOUNT_KEY, existingAccount.id);
    setCurrentAccount({ id: existingAccount.id, name: existingAccount.name });
    setLoginPassword('');
    setLoginStatus('');
    loadActivityState(existingAccount.id);
  };

  const logoutAccount = () => {
    if (currentAccount) {
      writeJson(getActivityKey(currentAccount.id), getCurrentActivityState());
    }

    const storage = getStorage();
    storage?.removeItem(ACTIVE_ACCOUNT_KEY);
    setCurrentAccount(null);
    setActivityLoaded(false);
    setLoginMode('login');
    setLoginPassword('');
    setLoginStatus('');
    resetActivityState();
  };

  const restartSurvey = () => {
    setAnswers({});
    setTieBreakerAnswers({});
    setTiedTypes([]);
    setCurrentIndex(0);
    setTieBreakerIndex(0);
    setSelectedMissionIndex(0);
    setRecordingMissionIndex(null);
    setReflectionDraft('');
    setExperienceProofText('');
    setExperienceReflection('');
    setGpsVerifiedMissionId(null);
    setGpsStatus('');
    setHasSurveyResult(false);
    setMissionEntrySource('roadmap');
    setExperienceEntrySource('roadmap');
    setScreen('survey');
  };

  const selectAnswer = (value: AnswerValue) => {
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: value,
    };

    setAnswers(nextAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    const nextScores = calculateScores(nextAnswers);
    const topTypes = getTopCareerTypes(nextScores);

    if (topTypes.length > 1) {
      setTiedTypes(topTypes);
      setTieBreakerAnswers({});
      setTieBreakerIndex(0);
      setScreen('tieBreaker');
      return;
    }

    setHasSurveyResult(true);
    setScreen('result');
  };

  const selectTieBreakerAnswer = (value: AnswerValue) => {
    if (!currentTieBreakerQuestion) {
      setHasSurveyResult(true);
      setScreen('result');
      return;
    }

    const nextAnswers = {
      ...tieBreakerAnswers,
      [currentTieBreakerQuestion.id]: value,
    };

    setTieBreakerAnswers(nextAnswers);

    if (tieBreakerIndex < tieBreakerQuestions.length - 1) {
      setTieBreakerIndex(tieBreakerIndex + 1);
      return;
    }

    setHasSurveyResult(true);
    setScreen('result');
  };

  const goBackQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goBackTieBreakerQuestion = () => {
    if (tieBreakerIndex > 0) {
      setTieBreakerIndex(tieBreakerIndex - 1);
    }
  };

  const updatePuzzleState = (type: CareerType, updater: (state: PuzzleMissionState) => PuzzleMissionState) => {
    setPuzzleMissionStates((prevStates) => {
      const currentState = prevStates[type] ?? createPuzzleMissionState();
      return {
        ...prevStates,
        [type]: updater(currentState),
      };
    });
  };

  const showPointPopup = (points: number) => {
    if (pointPopupTimerRef.current) {
      clearTimeout(pointPopupTimerRef.current);
    }

    setPointPopupText(`${points}포인트를 획득했어요!`);
    pointPopupTimerRef.current = setTimeout(() => {
      setPointPopupText('');
      pointPopupTimerRef.current = null;
    }, 2000);
  };

  const openMissionRecord = (index: number) => {
    setRecordingMissionIndex(index);
    setReflectionDraft(missionReflections[index] ?? '');
  };

  const saveMissionRecord = () => {
    if (recordingMissionIndex === null) {
      return;
    }

    updatePuzzleState(activePuzzleType, (state) => {
      const nextReflections = [...state.reflections];
      nextReflections[recordingMissionIndex] = reflectionDraft.trim();
      return { ...state, reflections: nextReflections };
    });
    setRecordingMissionIndex(null);
  };

  const completeMission = (index: number) => {
    if (!missionReflections[index] || index !== completedMissionCount) {
      return;
    }

    const nextCompletedCount = Math.min(completedMissionCount + 1, puzzleMissions.length);
    updatePuzzleState(activePuzzleType, (state) => ({ ...state, completedCount: nextCompletedCount }));
    setSelectedMissionIndex(Math.min(index + 1, puzzleMissions.length - 1));
    showPointPopup(2);

    if (nextCompletedCount >= puzzleMissions.length) {
      setDiaryType(activePuzzleProfile.title);
    }
  };

  const claimGrowthDiary = () => {
    setDiaryUnlocked(true);
    setDiaryType(activePuzzleProfile.title);
    setScreen('diary');
  };

  const openHomeDiary = () => {
    if (!diaryUnlocked) {
      Alert.alert('성장 다이어리 잠금', '퍼즐 미션을 완료한 후 성장 다이어리를 획득하세요!');
      return;
    }

    setScreen('diary');
  };

  const openDiaryForm = () => {
    const today = new Date();
    setDiaryType(diaryType || resultProfile.title);
    setDiaryGoal('');
    setDiaryYear(String(today.getFullYear()));
    setDiaryMonth(String(today.getMonth() + 1));
    setDiaryDay(String(today.getDate()));
    setDiaryContent('');
    setSelectedDiaryEntryId(null);
    setDiaryMode('form');
  };

  const saveDiaryEntry = () => {
    const trimmedContent = diaryContent.trim();

    if (!selectedDiaryDate || !trimmedContent) {
      return;
    }

    const entry: DiaryEntry = {
      id: `${Date.now()}-${diaryEntries.length}`,
      type: diaryType.trim() || resultProfile.title,
      goal: diaryGoal.trim(),
      date: selectedDiaryDate,
      content: trimmedContent,
    };

    setDiaryEntries([...diaryEntries, entry]);
    setDiaryType(resultProfile.title);
    setDiaryGoal('');
    setDiaryYear('');
    setDiaryMonth('');
    setDiaryDay('');
    setDiaryContent('');
    setDiaryMode('list');

    if (!diaryFirstEntryBonusClaimed) {
      setDiaryFirstEntryBonusClaimed(true);
      showPointPopup(4);
    }
  };

  const openActivityDetailMap = (activityId: string) => {
    setSelectedMapActivityId(activityId);
    setShowActivityMap(true);
    setTimeout(() => {
      activityMapScrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 0);
  };

  const resetActivityAiOutput = () => {
    setActivityAiSubmitted(false);
    setActivityAiResults([]);
    setActivityAiMapActivityId(null);
  };

  const submitActivityAi = () => {
    const nextType = activityAiType === 'auto' ? (hasSurveyResult ? resultType : null) : activityAiType;
    setSubmittedActivityAiType(nextType);
    setActivityAiResults(buildActivityRecommendations(activityAiAge, activityAiDistrict, nextType, activityAiInterest));
    setActivityAiSubmitted(true);
    setActivityAiMapActivityId(null);
  };

  const openDiaryEntry = (entryId: string) => {
    setSelectedDiaryEntryId(entryId);
    setDiaryMode('detail');
  };

  const selectExperienceMission = (mission: ExperienceMission) => {
    const submission = experienceSubmissions[mission.id];
    setSelectedExperienceId(mission.id);
    setExperienceProofText(submission?.proofText ?? '');
    setExperienceReflection(submission?.reflection ?? '');
    setGpsStatus(submission ? '이미 인증된 미션입니다.' : '');
  };

  const openRoadmapExperienceMission = (stepIndex: number) => {
    const typeMissions = experienceMissions.filter((mission) => mission.type === resultProfile.type);
    const mission = typeMissions[stepIndex % typeMissions.length] ?? experienceMissions[0];

    setExperienceEntrySource('roadmap');
    selectExperienceMission(mission);
    setScreen('experience');
  };

  const verifyExperienceLocation = () => {
    const navigatorRef = (globalThis as { navigator?: Navigator }).navigator;

    if (!selectedExperienceMission?.lat || !selectedExperienceMission.lng) {
      setGpsStatus('이 미션에는 위치 정보가 없습니다.');
      return;
    }

    if (!navigatorRef?.geolocation) {
      setGpsStatus('현재 환경에서는 GPS 인증을 사용할 수 없습니다.');
      return;
    }

    setGpsStatus('현재 위치를 확인하고 있어요.');
    navigatorRef.geolocation.getCurrentPosition(
      (position) => {
        const distance = calculateDistanceMeters(
          position.coords.latitude,
          position.coords.longitude,
          selectedExperienceMission.lat ?? 0,
          selectedExperienceMission.lng ?? 0,
        );

        if (distance <= 500) {
          setGpsVerifiedMissionId(selectedExperienceMission.id);
          setGpsStatus('위치 인증 성공! 반경 500m 안에 있어요.');
          return;
        }

        setGpsStatus(`위치 인증 실패: 활동 장소와 약 ${Math.round(distance)}m 떨어져 있어요.`);
      },
      () => setGpsStatus('위치 권한이 없거나 현재 위치를 확인하지 못했습니다.'),
    );
  };

  const certifyExperienceMission = () => {
    if (!selectedExperienceMission || experienceSubmissions[selectedExperienceMission.id]) {
      return;
    }

    const proofText = experienceProofText.trim();
    const reflection = experienceReflection.trim();
    let verified = false;

    if (selectedExperienceMission.proofType === 'reflection') {
      verified = reflection.length >= 10;
    }

    if (selectedExperienceMission.proofType === 'photo') {
      verified = proofText.length > 0 && reflection.length >= 5;
    }

    if (selectedExperienceMission.proofType === 'qr') {
      verified = proofText.toUpperCase() === selectedExperienceMission.qrCode && reflection.length >= 5;
    }

    if (selectedExperienceMission.proofType === 'gps') {
      verified = gpsVerifiedMissionId === selectedExperienceMission.id && reflection.length >= 5;
    }

    if (!verified) {
      setGpsStatus('인증 조건을 충족하지 못했습니다. 인증 정보와 소감을 확인해 주세요.');
      return;
    }

    setExperienceSubmissions({
      ...experienceSubmissions,
      [selectedExperienceMission.id]: {
        missionId: selectedExperienceMission.id,
        proofText,
        reflection,
        earnedXp: selectedExperienceMission.xp,
        completedAt: new Date().toISOString().slice(0, 10),
      },
    });
    setGpsStatus(`${selectedExperienceMission.xp}XP 지급 완료! 진로 점수가 갱신되었습니다.`);
    showPointPopup(selectedExperienceMission.xp);
  };

  const openGameVillage = (village: GameVillage) => {
    if (!unlockedGameVillageIds.has(village.id)) {
      setGameAnswerStatus('검사 결과에 맞는 마을만 먼저 열려요.');
      setGameView('map');
      return;
    }

    setSelectedGameVillageId(village.id);
    setSelectedGameMissionId(village.missions[0].id);
    setGameView('mission');
    setGameAnswerStatus(`${village.npc} NPC가 미션을 준비했어요.`);
  };

  const selectGameMission = (mission: GameMission) => {
    setSelectedGameMissionId(mission.id);
    setGameAnswerStatus(completedGameMissions[mission.id] ? '이미 완료한 미션입니다.' : '');
  };

  const completeGameMission = (choiceIndex: number) => {
    if (!selectedGameMission || completedGameMissions[selectedGameMission.id]) {
      return;
    }

    if (choiceIndex !== selectedGameMission.answerIndex) {
      setGameAnswerStatus('다시 생각해보세요. NPC의 설명을 읽고 가장 알맞은 선택지를 고르세요.');
      return;
    }

    setCompletedGameMissions({
      ...completedGameMissions,
      [selectedGameMission.id]: true,
    });
    setGameAnswerStatus(
      `${selectedGameMission.reward.stat}, 경험치 +${selectedGameMission.reward.exp}, 포인트 +${selectedGameMission.reward.points}`,
    );
    showPointPopup(selectedGameMission.reward.points);
  };

  const enterGame = () => {
    const villageId = hasSurveyResult ? getInitialVillageId(surveyResultType) : selectedGameVillageId;
    const village = gameVillages.find((item) => item.id === villageId) ?? gameVillages[0];

    setSelectedGameVillageId(village.id);
    setSelectedGameMissionId(village.missions[0].id);
    setGameView('main');
    setGameAnswerStatus('');
    setScreen('game');
  };

  const applyReward = (reward: RewardItem) => {
    if (rewardEntries[reward.id]) {
      return;
    }

    if (availableCareerPoints < reward.cost) {
      setGameAnswerStatus(`${reward.title} 응모에는 ${reward.cost}포인트가 필요합니다.`);
      return;
    }

    setSpentRewardPoints(spentRewardPoints + reward.cost);
    setRewardEntries({
      ...rewardEntries,
      [reward.id]: true,
    });
    setGameAnswerStatus(`${reward.title} 응모가 완료되었습니다.`);
  };

  const printParentReport = () => {
    const windowRef = globalThis as typeof globalThis & { print?: () => void };

    if (typeof windowRef.print === 'function') {
      windowRef.print();
    }
  };

  const printPortfolio = () => {
    const windowRef = globalThis as typeof globalThis & { print?: () => void };

    if (typeof windowRef.print === 'function') {
      windowRef.print();
    }
  };

  useEffect(() => {
    const activeAccountId = readJson<string | null>(ACTIVE_ACCOUNT_KEY, null);
    const activeAccount = getStoredAccounts().find((account) => account.id === activeAccountId);

    if (!activeAccount) {
      return;
    }

    setCurrentAccount({ id: activeAccount.id, name: activeAccount.name });
    loadActivityState(activeAccount.id);
  }, []);

  useEffect(() => {
    if (!currentAccount || !activityLoaded) {
      return;
    }

    writeJson(getActivityKey(currentAccount.id), getCurrentActivityState());
  }, [
    currentAccount,
    activityLoaded,
    selectedHomeType,
    currentIndex,
    tieBreakerIndex,
    tiedTypes,
    answers,
    tieBreakerAnswers,
    selectedMissionIndex,
    puzzleMissionStates,
    selectedPuzzleType,
    diaryUnlocked,
    diaryEntries,
    diaryMode,
    experienceSubmissions,
    selectedExperienceId,
    portfolioName,
    portfolioDesiredCareer,
    portfolioNextGoal,
    hasSurveyResult,
    diaryFirstEntryBonusClaimed,
    selectedGameVillageId,
    selectedGameMissionId,
    gameView,
    completedGameMissions,
    spentRewardPoints,
    rewardEntries,
  ]);

  useEffect(() => {
    if (diaryDay && !diaryDays.includes(diaryDay)) {
      setDiaryDay('');
    }
  }, [diaryDay, diaryDays]);

  useEffect(() => {
    if (!hasSurveyResult) {
      return;
    }

    setPuzzleMissionStates((prevStates) => {
      if (prevStates[surveyResultType]) {
        return prevStates;
      }

      return {
        ...prevStates,
        [surveyResultType]: createPuzzleMissionState(),
      };
    });
    setSelectedPuzzleType(surveyResultType);
    setSelectedMissionIndex(0);
    setRecordingMissionIndex(null);
  }, [hasSurveyResult, surveyResultType]);

  useEffect(() => {
    return () => {
      if (pointPopupTimerRef.current) {
        clearTimeout(pointPopupTimerRef.current);
      }
    };
  }, []);

  if (!currentAccount) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.loginPanel}>
            <Text style={styles.loginIcon}>🧭</Text>
            <Text style={styles.loginTitle}>꿈길 찾기 로그인</Text>
            <Text style={styles.loginText}>
              계정으로 로그인하면 검사 결과, 로드맵 활동, 퍼즐 미션, 성장 다이어리와 포인트 기록이 이 브라우저에 저장됩니다.
            </Text>

            <View style={styles.loginModeRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.loginModeButton,
                  loginMode === 'login' && styles.loginModeButtonActive,
                  pressed && styles.pressed,
                ]}
                android_ripple={{ color: '#1F2A4424' }}
                accessibilityRole="button"
                onPress={() => {
                  setLoginMode('login');
                  setLoginStatus('');
                }}
              >
                <Text style={[styles.loginModeText, loginMode === 'login' && styles.loginModeTextActive]}>로그인</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.loginModeButton,
                  loginMode === 'signup' && styles.loginModeButtonActive,
                  pressed && styles.pressed,
                ]}
                android_ripple={{ color: '#1F2A4424' }}
                accessibilityRole="button"
                onPress={() => {
                  setLoginMode('signup');
                  setLoginStatus('');
                }}
              >
                <Text style={[styles.loginModeText, loginMode === 'signup' && styles.loginModeTextActive]}>회원가입</Text>
              </Pressable>
            </View>

            <Text style={styles.loginLabel}>아이디</Text>
            <TextInput
              style={styles.loginInput}
              placeholder="아이디를 입력하세요"
              placeholderTextColor="#8A9AAF"
              value={loginName}
              onChangeText={setLoginName}
              autoCapitalize="none"
            />

            <Text style={styles.loginLabel}>비밀번호</Text>
            <TextInput
              style={styles.loginInput}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor="#8A9AAF"
              value={loginPassword}
              onChangeText={setLoginPassword}
              secureTextEntry
            />

            {loginStatus ? <Text style={styles.loginStatus}>{loginStatus}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.loginSubmitButton, pressed && styles.pressed]}
              android_ripple={{ color: '#0000002E' }}
              accessibilityRole="button"
              onPress={submitLogin}
            >
              <Text style={styles.primaryButtonText}>{loginMode === 'login' ? '로그인하기' : '계정 만들기'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {pointPopupText ? (
        <View style={styles.pointPopup}>
          <Text style={styles.pointPopupText}>{pointPopupText}</Text>
        </View>
      ) : null}
      {screen !== 'home' && (
        <Pressable
          style={({ pressed }) => [styles.floatingHomeButton, pressed && styles.pressed]}
          android_ripple={{ color: '#0000002E' }}
          accessibilityRole="button"
          onPress={() => setScreen('home')}
        >
          <Text style={styles.floatingHomeButtonText}>메인으로</Text>
        </Pressable>
      )}
      {screen === 'home' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.topBar}>
              <Text style={styles.brand}>꿈길 찾기</Text>
              <View style={styles.accountBox}>
                <Text style={styles.accountName}>{currentAccount.name}</Text>
                <Pressable
                  style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
                  android_ripple={{ color: '#1F2A4424' }}
                  accessibilityRole="button"
                  onPress={logoutAccount}
                >
                  <Text style={styles.logoutButtonText}>로그아웃</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.heroMain}>
              <View style={styles.heroContent}>
                <View style={styles.heroImage}>
                  <Text style={styles.heroIcon}>🧭</Text>
                </View>
                <Text style={styles.eyebrow}>탐구형 · 예술형 · 사회형</Text>
                <Text style={styles.title}>나에게 어울리는 진로 유형을 찾아봐요</Text>
                <Text style={styles.subtitle}>
                  51개의 문항에 답하면 가장 점수가 높은 유형과 맞춤 로드맵을 확인할 수 있어요.
                </Text>
                {hasSurveyResult && (
                  <View style={[styles.homeResultCard, { borderColor: resultProfile.color }]}>
                    <Text style={styles.homeResultLabel}>나의 유형</Text>
                    <View style={styles.homeResultRow}>
                      <Text style={styles.homeResultIcon}>{resultProfile.icon}</Text>
                      <View style={styles.homeResultTextWrap}>
                        <Text style={[styles.homeResultTitle, { color: resultProfile.color }]}>{resultProfile.title}</Text>
                        <Text style={styles.homeResultSubtitle}>{resultProfile.nickname}</Text>
                      </View>
                    </View>
                  </View>
                )}
                {hasSurveyResult && (
                  <View style={styles.homePointCard}>
                    <Text style={styles.homePointLabel}>획득 포인트</Text>
                    <Text style={styles.homePointValue}>{availableCareerPoints}점</Text>
                    <Text style={styles.homePointText}>
                      퍼즐 {growthPoints}점 · 진로 {totalExperienceXp}점 · 게임 {gamePoints}점
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                style={({ pressed }) => [styles.gameHomeButton, pressed && styles.pressed]}
                android_ripple={{ color: '#0000002E' }}
                accessibilityRole="button"
                onPress={enterGame}
              >
                <Text style={styles.gameHomeIcon}>🎮</Text>
                <View style={styles.gameHomeTextWrap}>
                  <Text style={styles.gameHomeTitle}>진로월드</Text>
                  <Text style={styles.gameHomeText}>마을 NPC 미션으로 포인트를 더 빠르게 모아요</Text>
                </View>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              android_ripple={{ color: '#0000002E' }}
              accessibilityRole="button"
              onPress={restartSurvey}
            >
              <Text style={styles.primaryButtonText}>{hasSurveyResult ? '검사 다시하기' : '검사 시작하기'}</Text>
            </Pressable>

            {(hasSurveyResult || diaryUnlocked) && (
              <Pressable
                style={({ pressed }) => [
                  styles.diaryHomeButton,
                  !diaryUnlocked && styles.diaryHomeButtonLocked,
                  pressed && styles.pressed,
                ]}
                android_ripple={{ color: '#1F2A4424' }}
                accessibilityRole="button"
                onPress={openHomeDiary}
              >
                <Text style={styles.diaryHomeIcon}>{diaryUnlocked ? '📔' : '🔒'}</Text>
                <View style={styles.diaryHomeTextWrap}>
                  <Text style={[styles.diaryHomeText, !diaryUnlocked && styles.diaryHomeTextLocked]}>
                    성장 다이어리
                  </Text>
                  {!diaryUnlocked && (
                    <Text style={styles.diaryHomeLockText}>퍼즐 미션 완료 후 획득 가능</Text>
                  )}
                </View>
              </Pressable>
            )}

            {hasSurveyResult && (
              <Pressable
                style={({ pressed }) => [styles.pointShopHomeButton, pressed && styles.pressed]}
                android_ripple={{ color: '#1F2A4424' }}
                accessibilityRole="button"
                onPress={() => setScreen('pointShop')}
              >
                <Text style={styles.pointShopHomeText}>포인트 사용하기</Text>
              </Pressable>
            )}
          </View>

          {hasSurveyResult && (
            <View style={styles.postSurveyShortcutPanel}>
              <Text style={styles.postSurveyShortcutTitle}>검사 이후 바로가기</Text>
              <Text style={styles.postSurveyShortcutText}>
                퍼즐 미션은 작은 성장 과제, 진로 미션 인증은 실제 증빙 기반 점수 갱신입니다.
              </Text>
              <View style={styles.postSurveyShortcutGrid}>
                <Pressable
                  style={({ pressed }) => [styles.postSurveyShortcutButton, pressed && styles.pressed]}
                  android_ripple={{ color: '#1F2A4424' }}
                  accessibilityRole="button"
                  onPress={() => setScreen('result')}
                >
                  <Text style={styles.postSurveyShortcutIcon}>📊</Text>
                  <Text style={styles.postSurveyShortcutLabel}>결과 보기</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.postSurveyShortcutButton, pressed && styles.pressed]}
                  android_ripple={{ color: '#1F2A4424' }}
                  accessibilityRole="button"
                  onPress={() => {
                    setMissionEntrySource('home');
                    setSelectedPuzzleType(puzzleResultType);
                    setScreen('mission');
                  }}
                >
                  <Text style={styles.postSurveyShortcutIcon}>🧩</Text>
                  <Text style={styles.postSurveyShortcutLabel}>퍼즐 미션</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.postSurveyShortcutButton, pressed && styles.pressed]}
                  android_ripple={{ color: '#1F2A4424' }}
                  accessibilityRole="button"
                  onPress={() => {
                    setExperienceEntrySource('home');
                    setScreen('experience');
                  }}
                >
                  <Text style={styles.postSurveyShortcutIcon}>⭐</Text>
                  <Text style={styles.postSurveyShortcutLabel}>진로 미션 인증</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.typeGrid}>
            {careerTypes.map((type) => {
              const profile = profiles[type];
              const selected = selectedHomeType === type;
              return (
                <Pressable
                  key={type}
                  style={({ pressed }) => [
                    styles.typeCard,
                    { backgroundColor: profile.softColor, borderColor: selected ? profile.color : '#E3EDF8' },
                    selected && styles.typeCardSelected,
                    pressed && styles.pressed,
                  ]}
                  android_ripple={{ color: '#1F2A4424' }}
                  accessibilityRole="button"
                  onPress={() => setSelectedHomeType(selected ? null : type)}
                >
                  <View style={styles.typeCardHeader}>
                    <Text style={styles.typeIcon}>{profile.icon}</Text>
                    <View style={styles.typeCardTitleWrap}>
                      <Text style={styles.typeTitle}>{profile.title}</Text>
                      <Text style={styles.typeDescription}>{profile.label}</Text>
                    </View>
                    <Text style={[styles.typeToggle, { color: profile.color }]}>{selected ? '접기' : '보기'}</Text>
                  </View>
                  {selected && (
                    <View style={styles.typeDetailBox}>
                      <Text style={styles.typeDetailTitle}>유형 설명</Text>
                      <Text style={styles.typeDetailText}>{profile.description}</Text>
                      <Text style={styles.typeDetailTitle}>어울리는 활동</Text>
                      <Text style={styles.typeDetailText}>{profile.guide}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [styles.activityAiHomeButton, pressed && styles.pressed]}
            android_ripple={{ color: '#1F2A4424' }}
            accessibilityRole="button"
            onPress={() => setScreen('activityAi')}
          >
            <Text style={styles.activityMapHomeIcon}>🤖</Text>
            <View style={styles.activityMapHomeTextWrap}>
              <Text style={styles.activityMapHomeTitle}>활동추천AI</Text>
              <Text style={styles.activityMapHomeText}>나이, 희망지역, 성향을 분석해서 맞춤 진로 활동을 추천해요.</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.activityMapHomeButton, pressed && styles.pressed]}
            android_ripple={{ color: '#1F2A4424' }}
            accessibilityRole="button"
            onPress={() => setScreen('activityMap')}
          >
            <Text style={styles.activityMapHomeIcon}>🗺️</Text>
            <View style={styles.activityMapHomeTextWrap}>
              <Text style={styles.activityMapHomeTitle}>서울 진로 활동 지도</Text>
              <Text style={styles.activityMapHomeText}>서울시 안에서 찾아볼 수 있는 진로 활동을 목록과 상세 지도로 확인해보세요.</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.parentHomeButton, pressed && styles.pressed]}
            android_ripple={{ color: '#1F2A4424' }}
            accessibilityRole="button"
            onPress={() => setScreen('parent')}
          >
            <Text style={styles.activityMapHomeIcon}>👨‍👩‍👧</Text>
            <View style={styles.activityMapHomeTextWrap}>
              <Text style={styles.activityMapHomeTitle}>부모 전용 리포트</Text>
              <Text style={styles.activityMapHomeText}>흥미 변화, 부족 경험, 추천 체험활동 확인하기</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.portfolioHomeButton, pressed && styles.pressed]}
            android_ripple={{ color: '#1F2A4424' }}
            accessibilityRole="button"
            onPress={() => setScreen('portfolio')}
          >
            <Text style={styles.activityMapHomeIcon}>📁</Text>
            <View style={styles.activityMapHomeTextWrap}>
              <Text style={styles.activityMapHomeTitle}>진로 포트폴리오</Text>
              <Text style={styles.activityMapHomeText}>경험, 다이어리, 추천 진로를 자동 정리해 PDF로 저장하기</Text>
            </View>
          </Pressable>
        </ScrollView>
      )}

      {screen === 'portfolio' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.roadmapHeader}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              onPress={() => setScreen('home')}
            >
              <Text style={styles.backButtonText}>메인으로</Text>
            </Pressable>
            <Text style={styles.roadmapType}>포트폴리오</Text>
          </View>

          <View style={styles.portfolioHero}>
            <Text style={styles.portfolioIcon}>📁</Text>
            <Text style={styles.portfolioTitle}>나의 진로 포트폴리오</Text>
            <Text style={styles.portfolioSubtitle}>내가 해본 활동, 느낀 점, 앞으로의 목표를 모아두는 학생용 성장 기록장입니다.</Text>
            <Text style={styles.diaryLabel}>이름</Text>
            <TextInput
              style={styles.diaryInput}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#8A9AAF"
              value={portfolioName}
              onChangeText={setPortfolioName}
            />
            <Text style={styles.diaryLabel}>희망 진로</Text>
            <TextInput
              style={styles.diaryInput}
              placeholder="희망하는 진로를 입력하세요"
              placeholderTextColor="#8A9AAF"
              value={portfolioDesiredCareer}
              onChangeText={setPortfolioDesiredCareer}
            />
          </View>

          <View style={styles.portfolioSection}>
            <Text style={styles.portfolioSectionTitle}>기본 정보</Text>
            <View style={styles.portfolioProfileRow}>
              <Text style={styles.portfolioProfileLabel}>이름</Text>
              <Text style={styles.portfolioProfileValue}>{portfolioName || '김OO'}</Text>
            </View>
            <View style={styles.portfolioProfileRow}>
              <Text style={styles.portfolioProfileLabel}>현재 흥미</Text>
              <Text style={[styles.portfolioProfileValue, { color: resultProfile.color }]}>{resultProfile.title}</Text>
            </View>
            <View style={styles.portfolioProfileRow}>
              <Text style={styles.portfolioProfileLabel}>추천 진로</Text>
              <Text style={styles.portfolioProfileValue}>{resultProfile.recommendedJobs.slice(0, 3).join(', ')}</Text>
            </View>
            <View style={styles.portfolioProfileRow}>
              <Text style={styles.portfolioProfileLabel}>희망 진로</Text>
              <Text style={styles.portfolioProfileValue}>{portfolioDesiredCareer || '작성 전'}</Text>
            </View>
          </View>

          <View style={styles.portfolioSection}>
            <Text style={styles.portfolioSectionTitle}>나를 나타내는 진로 키워드</Text>
            <View style={styles.portfolioKeywordGrid}>
              {[resultProfile.title, resultProfile.nickname, ...resultProfile.recommendedJobs.slice(0, 4)].map((keyword) => (
                <View key={keyword} style={[styles.portfolioKeywordChip, { backgroundColor: resultProfile.softColor }]}>
                  <Text style={[styles.portfolioKeywordText, { color: resultProfile.color }]}>{keyword}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.portfolioSummaryText}>{resultProfile.guide}</Text>
          </View>

          <View style={styles.portfolioSection}>
            <Text style={styles.portfolioSectionTitle}>내가 완료한 활동</Text>
            {Object.values(experienceSubmissions).length === 0 ? (
              <Text style={styles.portfolioEmptyText}>아직 기록된 활동이 없습니다. 활동 인증을 완료하면 이곳에 나의 경험이 쌓입니다.</Text>
            ) : (
              Object.values(experienceSubmissions).map((submission) => {
                const mission = experienceMissions.find((item) => item.id === submission.missionId);

                if (!mission) {
                  return null;
                }

                return (
                  <View key={submission.missionId} style={styles.portfolioListItem}>
                    <Text style={styles.portfolioListTitle}>{mission.title}</Text>
                    <Text style={styles.portfolioListText}>{profiles[mission.type].title} · {submission.earnedXp}XP · {submission.completedAt}</Text>
                    <Text style={styles.portfolioListLabel}>내가 남긴 소감</Text>
                    <Text style={styles.portfolioListText}>{submission.reflection}</Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.portfolioSection}>
            <Text style={styles.portfolioSectionTitle}>내 성장 다이어리</Text>
            {sortedDiaryEntries.length === 0 ? (
              <Text style={styles.portfolioEmptyText}>저장된 다이어리 페이지가 없습니다. 활동 후 배운 점을 직접 기록해 보세요.</Text>
            ) : (
              latestDiaryEntries.slice(0, 3).map((entry) => (
                <View key={entry.id} style={styles.portfolioListItem}>
                  <Text style={styles.portfolioListTitle}>{entry.date} · {entry.goal || '성장 기록'}</Text>
                  <Text style={styles.portfolioListText}>{entry.content}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.portfolioSection}>
            <Text style={styles.portfolioSectionTitle}>다음 목표로 해보고 싶은 활동</Text>
            {recommendedParentActivities.slice(0, 3).map((activity) => (
              <View key={activity.id} style={styles.portfolioListItem}>
                <Text style={styles.portfolioListTitle}>{activity.title}</Text>
                <Text style={styles.portfolioListText}>{activity.district} · {activity.place}</Text>
                <Text style={styles.portfolioListText}>{activity.info}</Text>
              </View>
            ))}
          </View>

          <View style={styles.portfolioSection}>
            <Text style={styles.portfolioSectionTitle}>나의 다음 목표</Text>
            <TextInput
              style={[styles.diaryInput, styles.portfolioGoalInput]}
              multiline
              placeholder="다음에 해보고 싶은 활동이나 목표를 직접 적어보세요."
              placeholderTextColor="#8A9AAF"
              value={portfolioNextGoal}
              onChangeText={setPortfolioNextGoal}
              textAlignVertical="top"
            />
            <Text style={styles.portfolioSummaryText}>
              {portfolioNextGoal.trim() ||
                `나는 ${resultProfile.title} 성향을 바탕으로 ${resultProfile.recommendedJobs.slice(0, 2).join(', ')} 같은 분야를 더 알아볼 수 있습니다. 다음 활동에서는 ${profiles[weakestExperienceType].title} 경험도 하나 추가해 나의 가능성을 더 넓혀보겠습니다.`}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.portfolioPrintButton, pressed && styles.pressed]}
            android_ripple={{ color: '#0000002E' }}
            accessibilityRole="button"
            onPress={printPortfolio}
          >
            <Text style={styles.primaryButtonText}>포트폴리오 PDF로 저장</Text>
          </Pressable>
        </ScrollView>
      )}

      {screen === 'parent' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.roadmapHeader}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              onPress={() => setScreen('home')}
            >
              <Text style={styles.backButtonText}>메인으로</Text>
            </Pressable>
            <Text style={styles.roadmapType}>부모 리포트</Text>
          </View>

          <View style={styles.parentHero}>
            <Text style={styles.parentHeroIcon}>📈</Text>
            <Text style={styles.parentHeroTitle}>보호자 코칭 리포트</Text>
            <Text style={styles.parentHeroText}>
              아이의 검사 결과와 실제 활동 데이터를 바탕으로 강점, 부족 경험, 가정에서 도와줄 방향을 정리합니다.
            </Text>
          </View>

          <View style={styles.parentPanel}>
            <Text style={styles.sectionTitle}>요약 진단</Text>
            <Text style={styles.parentReportText}>
              현재 핵심 성향은 {resultProfile.title}이며, 실제 활동에서는 {profiles[strongestGrowthType].title} 영역의 성장이 가장 크게 나타났습니다. 다음 단계에서는 {profiles[weakestExperienceType].title} 경험을 의도적으로 보완하면 탐색 균형을 맞출 수 있습니다.
            </Text>
            <View style={styles.parentInsightGrid}>
              {careerTypes.map((type) => {
                const profile = profiles[type];
                const delta = getScoreDelta(finalScores, surveyFinalScores, type);
                return (
                  <View key={type} style={styles.parentInsightCard}>
                    <Text style={[styles.parentInsightValue, { color: profile.color }]}>{delta >= 0 ? '+' : ''}{delta}</Text>
                    <Text style={styles.parentInsightLabel}>{profile.title} 변화</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.parentPanel}>
            <Text style={styles.sectionTitle}>점수 변화 그래프</Text>
            <View style={styles.growthGraph}>
              {growthSnapshots.map((snapshot) => {
                const maxScore = Math.max(...careerTypes.map((type) => snapshot.scores[type]), 1);
                return (
                  <View key={snapshot.label} style={styles.growthSnapshotRow}>
                    <Text style={styles.growthSnapshotLabel}>{snapshot.label}</Text>
                    <View style={styles.growthBars}>
                      {careerTypes.map((type) => {
                        const profile = profiles[type];
                        const width = `${Math.max(Math.round((snapshot.scores[type] / maxScore) * 100), 8)}%` as const;
                        return (
                          <View key={type} style={styles.growthBarLine}>
                            <Text style={styles.growthBarLabel}>{profile.title}</Text>
                            <View style={styles.growthBarTrack}>
                              <View style={[styles.growthBarFill, { width, backgroundColor: profile.color }]} />
                            </View>
                            <Text style={styles.growthBarValue}>{snapshot.scores[type]}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.parentPanel}>
            <Text style={styles.sectionTitle}>가정 코칭 팁</Text>
            <Text style={styles.parentReportText}>
              {resultProfile.title} 아이에게는 결과를 바로 평가하기보다 탐색 과정과 선택 이유를 묻는 대화가 효과적입니다. 활동 후에는 “무엇이 재미있었는지”, “어떤 역할이 편했는지”, “다음에는 무엇을 바꾸고 싶은지”를 짧게 정리하게 해주세요.
            </Text>
            <View style={styles.parentTipList}>
              <Text style={styles.parentTipItem}>강점 강화: {resultProfile.guide}</Text>
              <Text style={styles.parentTipItem}>균형 보완: {profiles[weakestExperienceType].title} 활동을 월 1회 이상 경험하게 해주세요.</Text>
              <Text style={styles.parentTipItem}>기록 습관: 활동 직후 사진, 한 줄 소감, 배운 점을 남기게 해주세요.</Text>
            </View>
          </View>

          <View style={styles.parentPanel}>
            <Text style={styles.sectionTitle}>관찰된 활동 근거</Text>
            {Object.values(experienceSubmissions).length === 0 ? (
              <Text style={styles.parentReportText}>아직 인증된 경험 미션이 없습니다. 실제 활동 인증이 쌓이면 아이의 관심 변화 판단 근거로 활용할 수 있습니다.</Text>
            ) : (
              Object.values(experienceSubmissions).map((submission) => {
                const mission = experienceMissions.find((item) => item.id === submission.missionId);

                if (!mission) {
                  return null;
                }

                return (
                  <View key={submission.missionId} style={styles.parentMissionRow}>
                    <Text style={styles.parentMissionTitle}>{mission.title}</Text>
                    <Text style={styles.parentMissionMeta}>{profiles[mission.type].title} · {submission.earnedXp}XP · {submission.completedAt}</Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.parentPanel}>
            <Text style={styles.sectionTitle}>부족 경험과 지원 방향</Text>
            <Text style={styles.parentReportText}>
              {profiles[weakestExperienceType].title} 활동 인증이 상대적으로 적습니다. 아이의 선호를 바꾸려 하기보다 짧고 부담 없는 체험부터 추가하는 방식이 좋습니다.
            </Text>
          </View>

          <View style={styles.parentPanel}>
            <Text style={styles.sectionTitle}>추천 체험활동</Text>
            {recommendedParentActivities.slice(0, 3).map((activity) => (
              <View key={activity.id} style={styles.parentActivityRow}>
                <Text style={styles.parentActivityDistrict}>{activity.district}</Text>
                <View style={styles.parentActivityTextWrap}>
                  <Text style={styles.parentActivityTitle}>{activity.title}</Text>
                  <Text style={styles.parentActivityText}>{activity.place} · {activity.info}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.parentPanel}>
            <Text style={styles.sectionTitle}>대화 질문</Text>
            <View style={styles.parentQuestionList}>
              <Text style={styles.parentQuestionItem}>오늘 활동에서 가장 오래 집중한 순간은 언제였어?</Text>
              <Text style={styles.parentQuestionItem}>혼자 하고 싶은 부분과 같이 하고 싶은 부분은 무엇이 달랐어?</Text>
              <Text style={styles.parentQuestionItem}>다음에 비슷한 활동을 한다면 어떤 역할을 해보고 싶어?</Text>
            </View>
          </View>

          <View style={styles.parentPanel}>
            <Text style={styles.sectionTitle}>2주 실행 계획</Text>
            <View style={styles.parentPlanRow}>
              <Text style={styles.parentPlanStep}>1주차</Text>
              <Text style={styles.parentPlanText}>{resultProfile.title} 강점과 연결된 활동 1개를 선택하고 짧은 소감을 남깁니다.</Text>
            </View>
            <View style={styles.parentPlanRow}>
              <Text style={styles.parentPlanStep}>2주차</Text>
              <Text style={styles.parentPlanText}>{profiles[weakestExperienceType].title} 보완 활동 1개를 가볍게 체험하고 아이의 반응을 관찰합니다.</Text>
            </View>
          </View>

          <View style={styles.parentPanel}>
            <Text style={styles.sectionTitle}>성장 리포트 저장</Text>
            <Text style={styles.parentReportText}>
              이 리포트는 검사 점수, 인증 경험치, 수행 활동을 바탕으로 생성되었습니다. PDF로 저장해 상담이나 가정 지도 자료로 활용할 수 있습니다.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.parentPrintButton, pressed && styles.pressed]}
              android_ripple={{ color: '#0000002E' }}
              accessibilityRole="button"
              onPress={printParentReport}
            >
              <Text style={styles.primaryButtonText}>성장 리포트 PDF로 저장</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {screen === 'activityAi' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.roadmapHeader}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              onPress={() => setScreen('home')}
            >
              <Text style={styles.backButtonText}>메인으로</Text>
            </Pressable>
            <Text style={styles.roadmapType}>활동추천AI</Text>
          </View>

          <View style={styles.activityAiHero}>
            <Text style={styles.activityIntroIcon}>🤖</Text>
            <Text style={styles.activityIntroTitle}>활동 조건을 입력해주세요</Text>
            <Text style={styles.activityIntroText}>
              입력완료를 누르면 성향, 희망지역, 연령, 관심 키워드 기준으로 AI처럼 추천 결과를 분석합니다.
            </Text>
          </View>

          <View style={styles.activityAiForm}>
            <Text style={styles.diaryLabel}>나이</Text>
            <TextInput
              style={styles.diaryInput}
              placeholder="예: 12"
              placeholderTextColor="#8A9AAF"
              value={activityAiAge}
              onChangeText={(value) => {
                setActivityAiAge(value);
                resetActivityAiOutput();
              }}
              keyboardType="number-pad"
            />

            <Text style={styles.diaryLabel}>희망지역</Text>
            <View style={styles.activityAiChipGrid}>
              {activityAiDistricts.map((district) => {
                const selected = activityAiDistrict === district;
                return (
                  <Pressable
                    key={district}
                    style={({ pressed }) => [
                      styles.activityAiChip,
                      selected && styles.activityAiChipSelected,
                      pressed && styles.pressed,
                    ]}
                    android_ripple={{ color: '#1F2A4424' }}
                    accessibilityRole="button"
                    onPress={() => {
                      setActivityAiDistrict(district);
                      resetActivityAiOutput();
                    }}
                  >
                    <Text style={[styles.activityAiChipText, selected && styles.activityAiChipTextSelected]}>{district}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.diaryLabel}>성향</Text>
            <View style={styles.activityAiChipGrid}>
              <Pressable
                style={({ pressed }) => [
                  styles.activityAiChip,
                  activityAiType === 'auto' && styles.activityAiChipSelected,
                  pressed && styles.pressed,
                ]}
                android_ripple={{ color: '#1F2A4424' }}
                accessibilityRole="button"
                onPress={() => {
                  setActivityAiType('auto');
                  resetActivityAiOutput();
                }}
              >
                <Text style={[styles.activityAiChipText, activityAiType === 'auto' && styles.activityAiChipTextSelected]}>
                  검사결과 자동
                </Text>
              </Pressable>
              {careerTypes.map((type) => {
                const selected = activityAiType === type;
                return (
                  <Pressable
                    key={type}
                    style={({ pressed }) => [
                      styles.activityAiChip,
                      selected && { backgroundColor: profiles[type].color, borderColor: profiles[type].color },
                      pressed && styles.pressed,
                    ]}
                    android_ripple={{ color: '#1F2A4424' }}
                    accessibilityRole="button"
                    onPress={() => {
                      setActivityAiType(type);
                      resetActivityAiOutput();
                    }}
                  >
                    <Text style={[styles.activityAiChipText, selected && styles.activityAiChipTextSelected]}>{profiles[type].title}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.diaryLabel}>관심 키워드</Text>
            <TextInput
              style={styles.diaryInput}
              placeholder="예: 과학, 영상, 봉사, 디자인"
              placeholderTextColor="#8A9AAF"
              value={activityAiInterest}
              onChangeText={(value) => {
                setActivityAiInterest(value);
                resetActivityAiOutput();
              }}
            />

            <Pressable
              style={({ pressed }) => [styles.activityAiSubmitButton, pressed && styles.pressed]}
              android_ripple={{ color: '#0000002E' }}
              accessibilityRole="button"
              onPress={submitActivityAi}
            >
              <Text style={styles.primaryButtonText}>입력완료</Text>
            </Pressable>
          </View>

          {!activityAiSubmitted && (
            <View style={styles.activityAiWaitingBox}>
              <Text style={styles.activityAiWaitingTitle}>추천 대기 중</Text>
              <Text style={styles.activityAiWaitingText}>조건을 입력하고 입력완료를 누르면 맞춤 활동이 표시됩니다.</Text>
            </View>
          )}

          {activityAiSubmitted && (
            <View style={styles.activityAiResultHeader}>
              <Text style={styles.portfolioSectionTitle}>AI 추천 결과</Text>
              <Text style={styles.activityAiResultMeta}>
                기준 성향: {submittedActivityAiType ? profiles[submittedActivityAiType].title : '전체'} · 추천 {activityAiResults.length}개
              </Text>
            </View>
          )}

          {activityAiSubmitted && (
          <View style={styles.activityList}>
            {activityAiResults.map((recommendation, index) => {
              const activity = recommendation.activity;
              const mapOpen = activityAiMapActivityId === activity.id;
              return (
                <View key={activity.id} style={styles.activityAiResultCard}>
                  <View style={styles.activityAiScoreLine}>
                    <Text style={styles.activityAiRank}>추천 {index + 1}</Text>
                    <Text style={styles.activityAiScore}>{recommendation.score}점</Text>
                  </View>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityInfo}>{activity.place} · {activity.district}</Text>
                  <Text style={styles.activityAddress}>
                    권장 {activity.minAge}-{activity.maxAge}세 · {activity.types.map((type) => profiles[type].title).join(', ')}
                    {recommendation.distanceKm === null ? '' : ` · 약 ${recommendation.distanceKm}km`}
                  </Text>
                  <View style={styles.activityAiReasonBox}>
                    {recommendation.reasons.map((reason) => (
                      <Text key={reason} style={styles.activityAiReasonText}>• {reason}</Text>
                    ))}
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.activityDetailMapButton, pressed && styles.pressed]}
                    android_ripple={{ color: '#0000002E' }}
                    accessibilityRole="button"
                    onPress={() => {
                      setActivityAiMapActivityId(mapOpen ? null : activity.id);
                    }}
                  >
                    <Text style={styles.activityDetailMapButtonText}>{mapOpen ? '지도 닫기' : '지도 보기'}</Text>
                  </Pressable>
                  {mapOpen && (
                    <View style={styles.activityAiInlineMap}>
                      <KakaoActivityMap activities={[activity]} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          )}
        </ScrollView>
      )}

      {screen === 'activityMap' && (
        <ScrollView ref={activityMapScrollRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.roadmapHeader}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              onPress={() => setScreen('home')}
            >
              <Text style={styles.backButtonText}>메인으로</Text>
            </Pressable>
            <Text style={styles.roadmapType}>서울 진로 활동</Text>
          </View>

          <View style={styles.activityIntroPanel}>
            <Text style={styles.activityIntroIcon}>🗺️</Text>
            <Text style={styles.activityIntroTitle}>서울 진로 활동 지도</Text>
            <Text style={styles.activityIntroText}>
              서울시 안에서 찾아볼 수 있는 진로 활동을 목록과 상세 지도로 확인해보세요.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.activityMapToggleButton, pressed && styles.pressed]}
              android_ripple={{ color: '#0000002E' }}
              accessibilityRole="button"
              onPress={() => {
                if (!showActivityMap) {
                  setSelectedMapActivityId(null);
                  setTimeout(() => {
                    activityMapScrollRef.current?.scrollTo({ y: 0, animated: true });
                  }, 0);
                }
                setShowActivityMap(!showActivityMap);
              }}
            >
              <Text style={styles.primaryButtonText}>{showActivityMap ? '지도 접기' : '한눈에 보기'}</Text>
            </Pressable>
          </View>

          {showActivityMap && <KakaoActivityMap activities={visibleMapActivities} />}

          <View style={styles.activityList}>
            {seoulCareerActivities.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityCardTopLine}>
                  <Text style={styles.activityDistrict}>{activity.district}</Text>
                  <Text style={styles.activityPlace}>{activity.place}</Text>
                </View>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityInfo}>{activity.info}</Text>
                <Text style={styles.activityAddress}>{activity.address}</Text>
                <Pressable
                  style={({ pressed }) => [styles.activityDetailMapButton, pressed && styles.pressed]}
                  android_ripple={{ color: '#0000002E' }}
                  accessibilityRole="button"
                  onPress={() => openActivityDetailMap(activity.id)}
                >
                  <Text style={styles.activityDetailMapButtonText}>지도 보기</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {screen === 'pointShop' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.roadmapHeader}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              onPress={() => setScreen('home')}
            >
              <Text style={styles.backButtonText}>메인으로</Text>
            </Pressable>
            <Text style={styles.roadmapType}>포인트 사용</Text>
          </View>

          <View style={styles.pointShopHero}>
            <Text style={styles.pointShopIcon}>🎟️</Text>
            <Text style={styles.pointShopTitle}>모은 포인트로 체험 활동에 응모하세요</Text>
            <Text style={styles.pointShopText}>현재 사용 가능 포인트 {availableCareerPoints}점 · 사용한 포인트 {spentRewardPoints}점</Text>
          </View>

          <View style={styles.rewardList}>
            {gameRewards.map((reward) => {
              const applied = Boolean(rewardEntries[reward.id]);
              const disabled = applied || availableCareerPoints < reward.cost;
              return (
                <View key={reward.id} style={styles.rewardCard}>
                  <View style={styles.rewardCardHeader}>
                    <View style={styles.rewardCardTextWrap}>
                      <Text style={styles.rewardTitle}>{reward.title}</Text>
                      <Text style={styles.rewardDescription}>{reward.description}</Text>
                    </View>
                    <Text style={styles.rewardCost}>{reward.cost}P</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.rewardApplyButton,
                      disabled && styles.disabledButton,
                      pressed && !disabled && styles.pressed,
                    ]}
                    android_ripple={{ color: '#0000002E' }}
                    accessibilityRole="button"
                    disabled={disabled}
                    onPress={() => applyReward(reward)}
                  >
                    <Text style={styles.primaryButtonText}>{applied ? '응모완료' : '응모하기'}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {gameAnswerStatus ? <Text style={styles.gameStatusText}>{gameAnswerStatus}</Text> : null}
        </ScrollView>
      )}

      {screen === 'game' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {gameView === 'main' && (
            <>
              <View style={styles.gameMainHero}>
                <Text style={styles.gameMainIcon}>🎮</Text>
                <Text style={styles.gameTitle}>진로월드</Text>
                <Text style={styles.gameSubtitle}>Lv.{gameLevel} 꿈 탐험가 · EXP {currentLevelExp} / 100</Text>
                <View style={styles.gamePointPanel}>
                  <Text style={styles.gamePointLabel}>현재 포인트</Text>
                  <Text style={styles.gamePointValue}>{availableCareerPoints}P</Text>
                  <Text style={styles.gamePointText}>완료 미션 {completedGameMissionCount}개 · 사용한 포인트 {spentRewardPoints}P</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.gameMainImageButton, pressed && styles.pressed]}
                android_ripple={{ color: '#0000002E' }}
                accessibilityRole="button"
                accessibilityLabel="홈으로 이동하기"
                onPress={() => {
                  const village = gameVillages.find((item) => item.id === initialGameVillageId) ?? gameVillages[0];
                  setSelectedGameVillageId(village.id);
                  setSelectedGameMissionId(village.missions[0].id);
                  setGameView('mission');
                  setGameAnswerStatus('');
                }}
              >
                <Image source={gameHomeButtonImage} style={styles.gameMainHomeImage} resizeMode="contain" />
                <Text style={styles.gameMainImageButtonText}>홈으로 이동하기</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.gameMainSecondaryButton, pressed && styles.pressed]}
                android_ripple={{ color: '#1F2A4424' }}
                accessibilityRole="button"
                onPress={() => setScreen('pointShop')}
              >
                <Text style={styles.gameMainSecondaryButtonText}>포인트 사용하기</Text>
              </Pressable>

              <View style={styles.villageIntroSection}>
                <Text style={styles.sectionTitle}>마을 소개</Text>
                <Text style={styles.villageIntroLead}>마을마다 어울리는 직업군과 성장 활동이 달라요.</Text>
                {gameVillages.map((village) => (
                  <View key={village.id} style={[styles.villageIntroCard, { borderColor: village.color }]}>
                    <View style={styles.villageIntroHeader}>
                      <View style={[styles.villageIntroIconBox, { backgroundColor: village.softColor }]}>
                        <Text style={styles.villageIntroIcon}>{village.icon}</Text>
                      </View>
                      <View style={styles.villageIntroTitleWrap}>
                        <Text style={[styles.villageIntroTitle, { color: village.color }]}>{village.title}</Text>
                        <Text style={styles.villageIntroTheme}>{village.theme}</Text>
                      </View>
                    </View>
                    <Text style={styles.villageIntroLabel}>직업군</Text>
                    <Text style={styles.villageIntroText}>{village.careerGroup}</Text>
                    <Text style={styles.villageIntroLabel}>성향</Text>
                    <Text style={styles.villageIntroText}>{village.personality}</Text>
                    <Text style={styles.villageIntroLabel}>추천 성장 활동</Text>
                    <View style={styles.villageIntroChipList}>
                      {village.growthActivities.map((activity) => (
                        <View key={activity} style={[styles.villageIntroChip, { backgroundColor: village.softColor }]}>
                          <Text style={[styles.villageIntroChipText, { color: village.color }]}>{activity}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.villageIntroLabel}>로드맵</Text>
                    <View style={styles.villageRoadmapRow}>
                      {village.roadmap.map((step, index) => (
                        <View key={step} style={styles.villageRoadmapStep}>
                          <Text style={[styles.villageRoadmapNumber, { backgroundColor: village.color }]}>
                            {index + 1}
                          </Text>
                          <Text style={styles.villageRoadmapText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.villageIntroButton,
                        { backgroundColor: village.color },
                        pressed && styles.pressed,
                      ]}
                      android_ripple={{ color: '#0000002E' }}
                      accessibilityRole="button"
                      onPress={() => openGameVillage(village)}
                    >
                      <Text style={styles.villageIntroButtonText}>{village.title} 미션 시작</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
              <Pressable
                style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
                android_ripple={{ color: '#1F2A4424' }}
                accessibilityRole="button"
                onPress={() => setScreen('home')}
              >
                <Text style={styles.textButtonLabel}>앱 메인으로</Text>
              </Pressable>
            </>
          )}

          {gameView !== 'main' && (
            <>
              <View style={styles.gameWorldHeader}>
                <Pressable
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                  android_ripple={{ color: '#1F2A4428' }}
                  accessibilityRole="button"
                  onPress={() => {
                    setGameView('main');
                    setGameAnswerStatus('');
                  }}
                >
                  <Text style={styles.backButtonText}>진로월드 메인으로</Text>
                </Pressable>
                <View style={styles.gameWorldPointBox}>
                  <Text style={styles.gameWorldPointText}>현재 포인트 {availableCareerPoints}P</Text>
                </View>
              </View>

              <View style={styles.worldMap}>
                <Image source={villageMapImage} style={styles.worldMapImage} resizeMode="cover" />
                <Pressable
                  style={({ pressed }) => [styles.mapHomeNode, pressed && styles.pressed]}
                  android_ripple={{ color: '#1F2A4424' }}
                  accessibilityRole="button"
                  onPress={() => {
                    setGameView('main');
                    setGameAnswerStatus('');
                  }}
                >
                  <Text style={styles.mapHomeText}>홈</Text>
                </Pressable>
                {gameVillages.map((village) => {
                  const selected = gameView === 'mission' && selectedGameVillage.id === village.id;
                  const unlocked = unlockedGameVillageIds.has(village.id);
                  return (
                    <Pressable
                      key={village.id}
                      style={({ pressed }) => [
                        styles.villageNode,
                        {
                          top: village.mapPosition.top as `${number}%`,
                          left: village.mapPosition.left as `${number}%`,
                          backgroundColor: village.softColor,
                          borderColor: selected ? village.color : '#FFFFFF',
                        },
                        selected && styles.villageNodeSelected,
                        !unlocked && styles.villageNodeLocked,
                        pressed && unlocked && styles.pressed,
                      ]}
                      android_ripple={{ color: '#1F2A4424' }}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !unlocked, selected }}
                      onPress={() => openGameVillage(village)}
                    >
                      <Text style={styles.villageIcon}>{unlocked ? village.icon : '🔒'}</Text>
                      <Text style={[styles.villageName, { color: unlocked ? village.color : '#7A8795' }]}>{village.title}</Text>
                      {!unlocked && <Text style={styles.villageLockText}>잠김</Text>}
                    </Pressable>
                  );
                })}
              </View>

              {gameAnswerStatus && gameView === 'map' ? <Text style={styles.gameStatusText}>{gameAnswerStatus}</Text> : null}
            </>
          )}

          {gameView === 'mission' && (
            <>
              <View style={[styles.npcPanel, { borderColor: selectedGameVillage.color }]}>
                <Text style={styles.npcIcon}>{selectedGameVillage.icon}</Text>
                <View style={styles.npcTextWrap}>
                  <Text style={[styles.npcName, { color: selectedGameVillage.color }]}>{selectedGameVillage.npc}</Text>
                  <Text style={styles.npcText}>{selectedGameVillage.title}의 {selectedGameVillage.theme} 미션</Text>
                </View>
              </View>

              <View style={styles.gameMissionGrid}>
                {selectedGameVillage.missions.map((mission) => {
                  const selected = selectedGameMission.id === mission.id;
                  const completed = Boolean(completedGameMissions[mission.id]);
                  return (
                    <Pressable
                      key={mission.id}
                      style={({ pressed }) => [
                        styles.gameMissionCard,
                        selected && { borderColor: selectedGameVillage.color, backgroundColor: selectedGameVillage.softColor },
                        pressed && styles.pressed,
                      ]}
                      android_ripple={{ color: '#1F2A4424' }}
                      accessibilityRole="button"
                      onPress={() => selectGameMission(mission)}
                    >
                      <Text style={[styles.gameMissionKind, { color: selectedGameVillage.color }]}>
                        {mission.kind === 'real' ? '실제 활동' : '게임 미션'}
                      </Text>
                      <Text style={styles.gameMissionTitle}>{mission.title}</Text>
                      <Text style={styles.gameMissionReward}>
                        EXP +{mission.reward.exp} · {mission.reward.points}P · {completed ? '완료' : '대기'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.gameQuestPanel}>
                <Text style={styles.sectionTitle}>{selectedGameMission.title}</Text>
                <Text style={styles.bodyText}>{selectedGameMission.prompt}</Text>
                <Text style={styles.gameRewardNotice}>
                  보상: {selectedGameMission.reward.stat}, 경험치 +{selectedGameMission.reward.exp}, 포인트 +{selectedGameMission.reward.points}
                </Text>
                {selectedGameMission.choices.map((choice, index) => (
                  <Pressable
                    key={choice}
                    style={({ pressed }) => [
                      styles.gameChoiceButton,
                      completedGameMissions[selectedGameMission.id] && index === selectedGameMission.answerIndex && {
                        borderColor: selectedGameVillage.color,
                        backgroundColor: selectedGameVillage.softColor,
                      },
                      pressed && !completedGameMissions[selectedGameMission.id] && styles.pressed,
                    ]}
                    android_ripple={{ color: '#1F2A4424' }}
                    accessibilityRole="button"
                    disabled={Boolean(completedGameMissions[selectedGameMission.id])}
                    onPress={() => completeGameMission(index)}
                  >
                    <Text style={styles.gameChoiceText}>{choice}</Text>
                  </Pressable>
                ))}
                {gameAnswerStatus ? <Text style={styles.gameStatusText}>{gameAnswerStatus}</Text> : null}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {screen === 'survey' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.surveyHeader}>
            <Text style={styles.brand}>꿈길 찾기</Text>
            <Text style={styles.progressText}>
              {answeredCount}/{questions.length} 완료
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.questionCard}>
            <View style={[styles.questionTypeBadge, { backgroundColor: profiles[currentQuestion.type].softColor }]}>
              <Text style={[styles.questionTypeText, { color: profiles[currentQuestion.type].color }]}>
                {profiles[currentQuestion.type].title}
              </Text>
            </View>
            <Text style={styles.questionNumber}>Q{currentIndex + 1}</Text>
            <Text style={styles.questionText}>{currentQuestion.text}</Text>
          </View>

          <View style={styles.answerList}>
            {answerOptions.map((option) => {
              const selected = answers[currentQuestion.id] === option.value;
              return (
                <Pressable
                  key={option.label}
                  style={({ pressed }) => [
                    styles.answerButton,
                    selected && styles.answerButtonSelected,
                    pressed && styles.pressed,
                  ]}
                  android_ripple={{ color: selected ? '#00000038' : '#1F2A4430' }}
                  accessibilityRole="button"
                  onPress={() => selectAnswer(option.value)}
                >
                  <Text style={[styles.answerText, selected && styles.answerTextSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.surveyFooter}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                currentIndex === 0 && styles.disabledButton,
                pressed && currentIndex !== 0 && styles.pressed,
              ]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              disabled={currentIndex === 0}
              onPress={goBackQuestion}
            >
              <Text style={styles.secondaryButtonText}>이전 문항</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              onPress={() => setScreen('home')}
            >
              <Text style={styles.secondaryButtonText}>메인으로</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {screen === 'tieBreaker' && currentTieBreakerQuestion && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.surveyHeader}>
            <Text style={styles.brand}>동점 추가 질문</Text>
            <Text style={styles.progressText}>
              {tieBreakerAnsweredCount}/{tieBreakerQuestions.length} 완료
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${tieBreakerProgress}%` }]} />
          </View>

          <View style={styles.tieNotice}>
            <Text style={styles.tieNoticeTitle}>점수가 같은 유형이 있어요</Text>
            <Text style={styles.tieNoticeText}>
              {tiedTypes.map((type) => profiles[type].title).join(', ')} 중 더 가까운 유형을 고르기 위해 짧은
              추가 질문을 진행합니다.
            </Text>
          </View>

          <View style={styles.questionCard}>
            <View
              style={[
                styles.questionTypeBadge,
                { backgroundColor: profiles[currentTieBreakerQuestion.type].softColor },
              ]}
            >
              <Text style={[styles.questionTypeText, { color: profiles[currentTieBreakerQuestion.type].color }]}>
                {profiles[currentTieBreakerQuestion.type].title}
              </Text>
            </View>
            <Text style={styles.questionNumber}>추가 Q{tieBreakerIndex + 1}</Text>
            <Text style={styles.questionText}>{currentTieBreakerQuestion.text}</Text>
          </View>

          <View style={styles.answerList}>
            {answerOptions.map((option) => {
              const selected = tieBreakerAnswers[currentTieBreakerQuestion.id] === option.value;
              return (
                <Pressable
                  key={option.label}
                  style={({ pressed }) => [
                    styles.answerButton,
                    selected && styles.answerButtonSelected,
                    pressed && styles.pressed,
                  ]}
                  android_ripple={{ color: selected ? '#00000038' : '#1F2A4430' }}
                  accessibilityRole="button"
                  onPress={() => selectTieBreakerAnswer(option.value)}
                >
                  <Text style={[styles.answerText, selected && styles.answerTextSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.surveyFooter}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                tieBreakerIndex === 0 && styles.disabledButton,
                pressed && tieBreakerIndex !== 0 && styles.pressed,
              ]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              disabled={tieBreakerIndex === 0}
              onPress={goBackTieBreakerQuestion}
            >
              <Text style={styles.secondaryButtonText}>이전 문항</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              onPress={() => setScreen('home')}
            >
              <Text style={styles.secondaryButtonText}>메인으로</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {screen === 'result' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.roadmapHeader}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              onPress={() => setScreen('home')}
            >
              <Text style={styles.backButtonText}>메인으로</Text>
            </Pressable>
            <View style={styles.resultHeaderActions}>
              <Text style={[styles.roadmapType, { color: resultProfile.color }]}>검사 결과</Text>
              <Pressable
                style={({ pressed }) => [styles.topSmallButton, pressed && styles.pressed]}
                android_ripple={{ color: '#1F2A4428' }}
                accessibilityRole="button"
                onPress={restartSurvey}
              >
                <Text style={styles.topSmallButtonText}>다시 검사하기</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.resultHero, { backgroundColor: resultProfile.softColor }]}>
            <Text style={styles.resultIcon}>{resultProfile.icon}</Text>
            <Text style={[styles.resultKicker, { color: resultProfile.color }]}>검사 결과</Text>
            <Text style={styles.resultTitle}>당신은 {resultProfile.title}입니다.</Text>
            <Text style={styles.resultSubtitle}>{resultProfile.nickname}</Text>
            <View style={styles.imageBox}>
              {resultCareerJobs[resultProfile.type].map((job) => (
                <View key={job.name} style={[styles.resultCareerCard, { borderColor: resultProfile.color }]}>
                  <Image source={job.image} style={styles.resultCareerImage} resizeMode="contain" />
                  <Text style={[styles.resultCareerName, { color: resultProfile.color }]}>{job.name}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.scorePanel}>
            {careerTypes.map((type) => {
              const profile = profiles[type];
              const scoreMax = maxTypeScore + (tiedTypes.includes(type) ? 4 : 0) + 45;
              const scorePercent = Math.min(Math.round((finalScores[type] / scoreMax) * 100), 100);
              return (
                <View key={type} style={styles.scoreRow}>
                  <View style={styles.scoreTopLine}>
                    <Text style={styles.scoreLabel}>{profile.title}</Text>
                    <Text style={styles.scoreValue}>
                      {finalScores[type]}점 · 경험 +{experienceScores[type]}XP
                    </Text>
                  </View>
                  <View style={styles.scoreTrack}>
                    <View style={[styles.scoreFill, { width: `${scorePercent}%`, backgroundColor: profile.color }]} />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.infoPanel}>
            <Text style={styles.sectionTitle}>성격 유형 설명</Text>
            <Text style={styles.bodyText}>{resultProfile.description}</Text>
            <Text style={styles.bodyText}>{resultProfile.personality}</Text>
            <Text style={styles.sectionTitle}>성향 맞춤 가이드</Text>
            <Text style={styles.bodyText}>{resultProfile.guide}</Text>
            <Text style={styles.sectionTitle}>유형에 따른 직업 추천</Text>
            <View style={styles.jobList}>
              {resultProfile.recommendedJobs.map((job) => (
                <View key={job} style={[styles.jobChip, { backgroundColor: resultProfile.softColor }]}>
                  <Text style={[styles.jobChipText, { color: resultProfile.color }]}>{job}</Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              styles.resultRoadmapButton,
              { backgroundColor: resultProfile.color },
              pressed && styles.pressed,
            ]}
            android_ripple={{ color: '#0000002E' }}
            accessibilityRole="button"
            onPress={() => setScreen('roadmap')}
          >
            <Text style={styles.resultRoadmapButtonText}>로드맵 확인하기</Text>
          </Pressable>
        </ScrollView>
      )}

      {screen === 'experience' && selectedExperienceMission && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.roadmapHeader}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              onPress={() => setScreen(experienceEntrySource === 'home' ? 'home' : 'roadmap')}
            >
              <Text style={styles.backButtonText}>{experienceEntrySource === 'home' ? '메인으로' : '로드맵으로'}</Text>
            </Pressable>
            <Text style={[styles.roadmapType, { color: resultProfile.color }]}>미션 인증</Text>
          </View>

          <View style={styles.experienceHero}>
            <Text style={styles.experienceHeroIcon}>⭐</Text>
            <Text style={styles.experienceHeroTitle}>진로 미션 인증 시스템</Text>
            <Text style={styles.experienceHeroText}>
              실제 활동을 인증하면 경험치가 지급되고, 진로 점수가 행동 데이터 기반으로 다시 계산됩니다.
            </Text>
            <View style={styles.experienceStatsRow}>
              <View style={styles.experienceStatBox}>
                <Text style={styles.experienceStatValue}>{completedExperienceCount}</Text>
                <Text style={styles.experienceStatLabel}>완료 미션</Text>
              </View>
              <View style={styles.experienceStatBox}>
                <Text style={styles.experienceStatValue}>{totalExperienceXp}</Text>
                <Text style={styles.experienceStatLabel}>획득 XP</Text>
              </View>
            </View>
          </View>

          <View style={styles.experienceScorePanel}>
            {careerTypes.map((type) => {
              const profile = profiles[type];
              return (
                <View key={type} style={styles.experienceScoreRow}>
                  <Text style={styles.experienceScoreLabel}>{profile.title}</Text>
                  <Text style={[styles.experienceScoreValue, { color: profile.color }]}>+{experienceScores[type]}XP</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.experienceMissionList}>
            {experienceMissions.map((mission) => {
              const profile = profiles[mission.type];
              const completed = Boolean(experienceSubmissions[mission.id]);
              const selected = selectedExperienceMission.id === mission.id;
              return (
                <Pressable
                  key={mission.id}
                  style={({ pressed }) => [
                    styles.experienceMissionButton,
                    selected && { borderColor: profile.color, backgroundColor: profile.softColor },
                    pressed && styles.pressed,
                  ]}
                  android_ripple={{ color: '#1F2A4424' }}
                  accessibilityRole="button"
                  onPress={() => selectExperienceMission(mission)}
                >
                  <View style={[styles.experienceMissionType, { backgroundColor: profile.color }]}>
                    <Text style={styles.experienceMissionTypeText}>{profile.title}</Text>
                  </View>
                  <View style={styles.experienceMissionTextWrap}>
                    <Text style={styles.experienceMissionTitle}>{mission.title}</Text>
                    <Text style={styles.experienceMissionMeta}>{getProofLabel(mission)} · {mission.xp}XP</Text>
                  </View>
                  <Text style={[styles.experienceMissionStatus, completed && { color: profile.color }]}> 
                    {completed ? '완료' : '대기'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.experienceCertPanel}>
            <Text style={styles.sectionTitle}>{selectedExperienceMission.title}</Text>
            <Text style={styles.bodyText}>{selectedExperienceMission.description}</Text>
            <Text style={styles.experienceCertLabel}>활동</Text>
            <Text style={styles.experienceCertText}>{selectedExperienceMission.activity}</Text>
            <Text style={styles.experienceCertLabel}>인증 방식</Text>
            <Text style={styles.experienceCertText}>{getProofLabel(selectedExperienceMission)} · {selectedExperienceMission.xp}XP</Text>

            {selectedExperienceMission.proofType === 'photo' && (
              <>
                <Text style={styles.diaryLabel}>사진 파일명 또는 결과물 링크</Text>
                <TextInput
                  style={styles.diaryInput}
                  placeholder="예: science-project.jpg 또는 https://..."
                  placeholderTextColor="#8A9AAF"
                  value={experienceProofText}
                  onChangeText={setExperienceProofText}
                />
              </>
            )}

            {selectedExperienceMission.proofType === 'qr' && (
              <>
                <Text style={styles.diaryLabel}>QR 코드 입력</Text>
                <TextInput
                  style={styles.diaryInput}
                  placeholder="예: ART-DDP-2026"
                  placeholderTextColor="#8A9AAF"
                  autoCapitalize="characters"
                  value={experienceProofText}
                  onChangeText={setExperienceProofText}
                />
              </>
            )}

            {selectedExperienceMission.proofType === 'gps' && (
              <Pressable
                style={({ pressed }) => [styles.gpsButton, pressed && styles.pressed]}
                android_ripple={{ color: '#1F2A4428' }}
                accessibilityRole="button"
                onPress={verifyExperienceLocation}
              >
                <Text style={styles.gpsButtonText}>현재 위치로 인증하기</Text>
              </Pressable>
            )}

            <Text style={styles.diaryLabel}>활동 소감</Text>
            <TextInput
              style={[styles.diaryInput, styles.diaryContentInput]}
              multiline
              placeholder="활동 후 느낀 점과 새롭게 알게 된 점을 적어보세요."
              placeholderTextColor="#8A9AAF"
              value={experienceReflection}
              onChangeText={setExperienceReflection}
              textAlignVertical="top"
            />

            {gpsStatus ? <Text style={styles.experienceStatusText}>{gpsStatus}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                styles.diarySaveButton,
                { backgroundColor: experienceSubmissions[selectedExperienceMission.id] ? '#AAB7C4' : profiles[selectedExperienceMission.type].color },
                pressed && !experienceSubmissions[selectedExperienceMission.id] && styles.pressed,
              ]}
              android_ripple={{ color: '#0000002E' }}
              accessibilityRole="button"
              disabled={Boolean(experienceSubmissions[selectedExperienceMission.id])}
              onPress={certifyExperienceMission}
            >
              <Text style={styles.primaryButtonText}>
                {experienceSubmissions[selectedExperienceMission.id] ? '인증 완료' : '인증하고 경험치 받기'}
              </Text>
            </Pressable>
          </View>

          {experienceEntrySource !== 'home' && (
            <Pressable
              style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4424' }}
              accessibilityRole="button"
              onPress={() => setScreen('home')}
            >
              <Text style={styles.textButtonLabel}>메인으로</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {screen === 'roadmap' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.roadmapHeader}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              onPress={() => setScreen('result')}
            >
              <Text style={styles.backButtonText}>결과로</Text>
            </Pressable>
            <Text style={[styles.roadmapType, { color: resultProfile.color }]}>{resultProfile.title}</Text>
          </View>

          <View style={[styles.roadmapIntro, { backgroundColor: resultProfile.softColor }]}>
            <Text style={styles.roadmapIcon}>{resultProfile.icon}</Text>
            <Text style={styles.roadmapTitle}>{resultProfile.roadmapTitle}</Text>
            <Text style={styles.roadmapText}>{resultProfile.roadmapSummary}</Text>
          </View>

          <View style={styles.timeline}>
            {resultProfile.roadmap.map((item, index) => (
              <View key={item.step} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: resultProfile.color }]}>
                  <Text style={styles.timelineNumber}>{index + 1}</Text>
                </View>
                <View style={styles.timelineCard}>
                  <Text style={[styles.timelineStep, { color: resultProfile.color }]}>{item.step}</Text>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelinePlace}>{item.place}</Text>
                  <View style={styles.timelineQuestRow}>
                    <Text style={styles.timelineQuest}>{item.quest}</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.timelineCertButton,
                        { backgroundColor: resultProfile.color },
                        pressed && styles.pressed,
                      ]}
                      android_ripple={{ color: '#0000002E' }}
                      accessibilityRole="button"
                      onPress={() => openRoadmapExperienceMission(index)}
                    >
                      <Text style={styles.timelineCertButtonText}>활동 인증하기</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.roadmapMapButton,
              pressed && styles.pressed,
            ]}
            android_ripple={{ color: '#0000002E' }}
            accessibilityRole="button"
            onPress={() => setScreen('activityMap')}
          >
            <Text style={styles.roadmapMapButtonText}>다른 활동을 더 확인해보세요!</Text>
            <Text style={styles.roadmapMapButtonTitle}>서울진로지도</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              styles.roadmapPuzzleButton,
              { backgroundColor: resultProfile.color },
              pressed && styles.pressed,
            ]}
            android_ripple={{ color: '#0000002E' }}
            accessibilityRole="button"
            onPress={() => {
              setMissionEntrySource('roadmap');
              setSelectedPuzzleType(puzzleResultType);
              setScreen('mission');
            }}
          >
            <Text style={styles.primaryButtonText}>퍼즐 미션 시작하기</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
            android_ripple={{ color: '#1F2A4424' }}
            accessibilityRole="button"
            onPress={() => setScreen('home')}
          >
            <Text style={styles.textButtonLabel}>메인으로</Text>
          </Pressable>
        </ScrollView>
      )}

      {screen === 'mission' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.roadmapHeader}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              onPress={() => setScreen(missionEntrySource === 'home' ? 'home' : 'roadmap')}
            >
              <Text style={styles.backButtonText}>{missionEntrySource === 'home' ? '메인으로' : '로드맵으로'}</Text>
            </Pressable>
            <Text style={[styles.roadmapType, { color: activePuzzleProfile.color }]}>퍼즐 미션</Text>
          </View>

          <View style={styles.puzzleTypeTabs}>
            {puzzleTypes.map((type) => {
              const profile = profiles[type];
              const selected = activePuzzleType === type;
              return (
                <Pressable
                  key={type}
                  style={({ pressed }) => [
                    styles.puzzleTypeTab,
                    selected && { backgroundColor: profile.color, borderColor: profile.color },
                    pressed && styles.pressed,
                  ]}
                  android_ripple={{ color: '#1F2A4424' }}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedPuzzleType(type);
                    setSelectedMissionIndex(0);
                    setRecordingMissionIndex(null);
                  }}
                >
                  <Text style={[styles.puzzleTypeTabText, selected && styles.puzzleTypeTabTextSelected]}>{profile.title}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.fairyRoadmap, { borderColor: activePuzzleProfile.color }]}>
            <View style={styles.fairySky}>
              <Text style={styles.fairyCloud}>퍼즐 {collectedPuzzleCount}/4</Text>
              <Text style={styles.fairyStar}>{growthPoints}포인트</Text>
            </View>
            <Text style={styles.fairyIcon}>{activePuzzleProfile.icon}</Text>
            <Text style={styles.fairyTitle}>{activePuzzleProfile.nickname}의 성장 모험</Text>
            <Text style={styles.fairyStory}>{activePuzzleProfile.missionStory}</Text>
            <Text style={styles.puzzleGuideText}>검사를 완료하고 퍼즐 1개를 획득했어요!</Text>
            <Text style={styles.puzzleGuideText}>퍼즐을 1개 획득할 때마다 2포인트가 지급돼요.</Text>
            <Text style={styles.puzzleGuideText}>나머지 퍼즐을 모두 맞추고 성장 다이어리를 획득해보세요!</Text>
            <View style={styles.pointSummaryBox}>
              <Text style={styles.pointSummaryText}>퍼즐 포인트 {puzzlePoints}점 · 다이어리 보너스 {diaryBonusPoints}점</Text>
            </View>

            <View style={styles.puzzleBoard}>
              {[0, 1, 2, 3].map((piece) => {
                const collected = piece < collectedPuzzleCount;
                return (
                  <View
                    key={piece}
                    style={[
                      styles.puzzlePiece,
                      collected && { backgroundColor: activePuzzleProfile.color, borderColor: activePuzzleProfile.color },
                    ]}
                  >
                    <Text style={[styles.puzzlePieceText, collected && styles.puzzlePieceTextActive]}>
                      {collected ? (piece === 0 ? activePuzzleProfile.icon : piece) : '잠금'}
                    </Text>
                  </View>
                );
              })}
            </View>

            {allMissionsCompleted && (
              <View style={styles.completedGiftBox}>
                <Text style={styles.completedGiftTitle}>성향별 이미지가 완성됐어요!</Text>
                <Text style={styles.completedGiftText}>
                  모든 퍼즐 조각을 모았습니다. {diaryUnlocked ? '성장 다이어리에 바로 기록할 수 있어요.' : '성장 다이어리를 획득하면 스스로 찾은 활동도 기록할 수 있어요.'} 처음 다이어리를 작성하면 4포인트가 추가 지급됩니다.
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.diaryGiftButton, pressed && styles.pressed]}
                  android_ripple={{ color: '#0000002E' }}
                  accessibilityRole="button"
                  onPress={claimGrowthDiary}
                >
                  <Text style={styles.primaryButtonText}>{diaryUnlocked ? '성장 다이어리 작성하기' : '성장 다이어리 획득하기'}</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.missionList}>
            {puzzleMissions.map((item, index) => {
              const unlocked = index < unlockedMissionCount;
              const completed = index < completedMissionCount;
              const hasRecord = Boolean(missionReflections[index]);
              const selected = selectedMissionIndex === index;
              return (
                <View key={item.step} style={[styles.missionCard, !unlocked && styles.missionCardLocked]}>
                  <Pressable
                    style={({ pressed }) => [styles.missionButton, pressed && unlocked && styles.pressed]}
                    android_ripple={{ color: '#1F2A4424' }}
                    accessibilityRole="button"
                    disabled={!unlocked}
                    onPress={() => setSelectedMissionIndex(selected ? null : index)}
                  >
                    <View style={[styles.missionBadge, { backgroundColor: unlocked ? activePuzzleProfile.color : '#AAB7C4' }]}>
                      <Text style={styles.missionBadgeText}>{completed ? '완료' : unlocked ? index + 1 : '잠금'}</Text>
                    </View>
                    <View style={styles.missionButtonTextWrap}>
                      <Text style={styles.missionStep}>{item.step}</Text>
                      <Text style={styles.missionTitle}>{item.title}</Text>
                    </View>
                  </Pressable>

                  {selected && unlocked && (
                    <View style={styles.missionDetail}>
                      <Text style={styles.missionDetailLabel}>기록 위치</Text>
                      <Text style={styles.missionDetailText}>{item.place}</Text>
                      <Text style={styles.missionDetailLabel}>작은 성장 과제</Text>
                      <Text style={styles.missionDetailText}>{item.quest}</Text>
                      <Text style={styles.missionPointNotice}>미션 성공 시 퍼즐 1개와 2포인트 지급</Text>

                      {recordingMissionIndex === index ? (
                        <View style={styles.recordPanel}>
                          <Text style={styles.recordTitle}>성장 노트 작성하기</Text>
                          <TextInput
                            style={styles.recordInput}
                            multiline
                            placeholder="작은 과제를 하며 떠오른 생각과 다음에 해보고 싶은 일을 적어보세요."
                            placeholderTextColor="#8A9AAF"
                            value={reflectionDraft}
                            onChangeText={setReflectionDraft}
                            textAlignVertical="top"
                          />
                          <View style={styles.recordActions}>
                            <Pressable
                              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                              android_ripple={{ color: '#1F2A4428' }}
                              accessibilityRole="button"
                              onPress={() => setRecordingMissionIndex(null)}
                            >
                              <Text style={styles.secondaryButtonText}>뒤로</Text>
                            </Pressable>
                            <Pressable
                              style={({ pressed }) => [
                                styles.secondaryButton,
                                { backgroundColor: activePuzzleProfile.color },
                                !reflectionDraft.trim() && styles.disabledButton,
                                pressed && reflectionDraft.trim() && styles.pressed,
                              ]}
                              android_ripple={{ color: '#0000002E' }}
                              accessibilityRole="button"
                              disabled={!reflectionDraft.trim()}
                              onPress={saveMissionRecord}
                            >
                              <Text style={styles.recordSaveText}>저장하기</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <>
                          {hasRecord && (
                            <View style={styles.savedRecordBox}>
                              <Text style={styles.savedRecordLabel}>저장된 소감</Text>
                              <Text style={styles.savedRecordText}>{missionReflections[index]}</Text>
                            </View>
                          )}
                          <Pressable
                            style={({ pressed }) => [styles.recordButton, pressed && styles.pressed]}
                            android_ripple={{ color: '#1F2A4424' }}
                            accessibilityRole="button"
                            onPress={() => openMissionRecord(index)}
                          >
                            <Text style={styles.recordButtonText}>성장 노트 기록하기</Text>
                          </Pressable>
                          {hasRecord && !completed && index === completedMissionCount && (
                            <Pressable
                              style={({ pressed }) => [
                                styles.missionSuccessButton,
                                { backgroundColor: activePuzzleProfile.color },
                                pressed && styles.pressed,
                              ]}
                              android_ripple={{ color: '#0000002E' }}
                              accessibilityRole="button"
                              onPress={() => completeMission(index)}
                            >
                              <Text style={styles.primaryButtonText}>{item.step} 미션 성공!</Text>
                            </Pressable>
                          )}
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {missionEntrySource !== 'home' && (
            <Pressable
              style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4424' }}
              accessibilityRole="button"
              onPress={() => setScreen('home')}
            >
              <Text style={styles.textButtonLabel}>메인으로</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {screen === 'diary' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.roadmapHeader}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              android_ripple={{ color: '#1F2A4428' }}
              accessibilityRole="button"
              onPress={() => {
                setDiaryMode('list');
                setScreen('home');
              }}
            >
              <Text style={styles.backButtonText}>메인으로</Text>
            </Pressable>
            <Text style={[styles.roadmapType, { color: resultProfile.color }]}>성장 다이어리</Text>
          </View>

          {diaryMode === 'list' && (
            <View style={styles.diaryPanel}>
              <View style={styles.diaryTopLine}>
                <View style={styles.diaryTitleWrap}>
                  <Text style={styles.diaryTitle}>나의 성장 다이어리</Text>
                  <Text style={styles.diarySubtitle}>저장한 활동 기록을 최신순으로 모아볼 수 있어요.</Text>
                </View>
                <Text style={[styles.diaryCountBadge, { color: resultProfile.color }]}>{diaryEntries.length}개</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.diaryAddButton, { backgroundColor: resultProfile.color }, pressed && styles.pressed]}
                android_ripple={{ color: '#0000002E' }}
                accessibilityRole="button"
                onPress={openDiaryForm}
              >
                <Text style={styles.primaryButtonText}>페이지 추가하기</Text>
              </Pressable>

              <View style={styles.diaryEntryList}>
                {sortedDiaryEntries.length === 0 ? (
                  <View style={styles.diaryEmptyBox}>
                    <Text style={styles.diaryEmptyTitle}>아직 저장된 페이지가 없어요</Text>
                    <Text style={styles.diaryEmptyText}>페이지를 추가해서 활동 날짜와 내용을 기록해 보세요.</Text>
                  </View>
                ) : (
                  sortedDiaryEntries.map((entry) => (
                    <Pressable
                      key={entry.id}
                      style={({ pressed }) => [styles.diaryEntryItem, pressed && styles.pressed]}
                      android_ripple={{ color: '#1F2A4424' }}
                      accessibilityRole="button"
                      onPress={() => openDiaryEntry(entry.id)}
                    >
                      <View style={styles.diaryEntryDateBox}>
                        <Text style={[styles.diaryEntryDate, { color: resultProfile.color }]}>{entry.date}</Text>
                      </View>
                      <View style={styles.diaryEntryTextWrap}>
                        <Text style={styles.diaryEntryGoal}>{entry.goal || '성장 목표 없음'}</Text>
                        <Text style={styles.diaryEntryPreview} numberOfLines={2}>{entry.content}</Text>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            </View>
          )}

          {diaryMode === 'form' && (
            <View style={styles.diaryPanel}>
              <Text style={styles.diaryTitle}>새 다이어리 페이지</Text>
              <Text style={styles.diarySubtitle}>유형, 목표, 날짜, 활동 내용을 작성하고 저장하세요.</Text>

              <Text style={styles.diaryLabel}>유형</Text>
              <TextInput
                style={styles.diaryInput}
                placeholder="나의 진로 유형"
                placeholderTextColor="#8A9AAF"
                value={diaryType}
                onChangeText={setDiaryType}
              />

              <Text style={styles.diaryLabel}>성장 목표</Text>
              <TextInput
                style={styles.diaryInput}
                placeholder="성장 목표를 적어보세요."
                placeholderTextColor="#8A9AAF"
                value={diaryGoal}
                onChangeText={setDiaryGoal}
              />

              <Text style={styles.diaryLabel}>활동 날짜</Text>
              <View style={styles.datePickerGroup}>
                <Text style={styles.datePickerLabel}>연도 선택</Text>
                <View style={styles.dateOptionRow}>
                  {diaryYears.map((year) => (
                    <Pressable
                      key={year}
                      style={({ pressed }) => [
                        styles.dateOptionButton,
                        diaryYear === year && { backgroundColor: resultProfile.color, borderColor: resultProfile.color },
                        pressed && styles.pressed,
                      ]}
                      android_ripple={{ color: '#1F2A4424' }}
                      accessibilityRole="button"
                      onPress={() => setDiaryYear(year)}
                    >
                      <Text style={[styles.dateOptionText, diaryYear === year && styles.dateOptionTextSelected]}>{year}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.datePickerLabel}>월 선택</Text>
                <View style={styles.dateOptionRow}>
                  {diaryMonths.map((month) => (
                    <Pressable
                      key={month}
                      style={({ pressed }) => [
                        styles.dateOptionButton,
                        diaryMonth === month && { backgroundColor: resultProfile.color, borderColor: resultProfile.color },
                        pressed && styles.pressed,
                      ]}
                      android_ripple={{ color: '#1F2A4424' }}
                      accessibilityRole="button"
                      onPress={() => setDiaryMonth(month)}
                    >
                      <Text style={[styles.dateOptionText, diaryMonth === month && styles.dateOptionTextSelected]}>{month}월</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.datePickerLabel}>일 선택</Text>
                <View style={styles.dateOptionRow}>
                  {diaryDays.map((day) => (
                    <Pressable
                      key={day}
                      style={({ pressed }) => [
                        styles.dateOptionButton,
                        diaryDay === day && { backgroundColor: resultProfile.color, borderColor: resultProfile.color },
                        pressed && styles.pressed,
                      ]}
                      android_ripple={{ color: '#1F2A4424' }}
                      accessibilityRole="button"
                      onPress={() => setDiaryDay(day)}
                    >
                      <Text style={[styles.dateOptionText, diaryDay === day && styles.dateOptionTextSelected]}>{day}일</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.selectedDateText}>
                  선택한 날짜: {selectedDiaryDate || '연도, 월, 일을 선택하세요.'}
                </Text>
              </View>

              <Text style={styles.diaryLabel}>활동 내용</Text>
              <TextInput
                style={[styles.diaryInput, styles.diaryContentInput]}
                multiline
                placeholder="활동 내용과 배운 점을 자유롭게 작성하세요."
                placeholderTextColor="#8A9AAF"
                value={diaryContent}
                onChangeText={setDiaryContent}
                textAlignVertical="top"
              />

              <View style={styles.diaryFormActions}>
                <Pressable
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                  android_ripple={{ color: '#1F2A4428' }}
                  accessibilityRole="button"
                  onPress={() => setDiaryMode('list')}
                >
                  <Text style={styles.secondaryButtonText}>목록으로</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { backgroundColor: resultProfile.color },
                    (!selectedDiaryDate || !diaryContent.trim()) && styles.disabledButton,
                    pressed && selectedDiaryDate && diaryContent.trim() && styles.pressed,
                  ]}
                  android_ripple={{ color: '#0000002E' }}
                  accessibilityRole="button"
                  disabled={!selectedDiaryDate || !diaryContent.trim()}
                  onPress={saveDiaryEntry}
                >
                  <Text style={styles.recordSaveText}>저장하기</Text>
                </Pressable>
              </View>
            </View>
          )}

          {diaryMode === 'detail' && selectedDiaryEntry && (
            <View style={styles.diaryPanel}>
              <Text style={styles.diaryTitle}>저장한 활동 기록</Text>
              <Text style={styles.diarySubtitle}>{selectedDiaryEntry.date}에 작성한 다이어리입니다.</Text>

              <View style={styles.diaryDetailBox}>
                <Text style={styles.diaryDetailLabel}>유형</Text>
                <Text style={styles.diaryDetailText}>{selectedDiaryEntry.type}</Text>
                <Text style={styles.diaryDetailLabel}>성장 목표</Text>
                <Text style={styles.diaryDetailText}>{selectedDiaryEntry.goal || '작성된 성장 목표가 없습니다.'}</Text>
                <Text style={styles.diaryDetailLabel}>활동 날짜</Text>
                <Text style={styles.diaryDetailText}>{selectedDiaryEntry.date}</Text>
                <Text style={styles.diaryDetailLabel}>활동 내용</Text>
                <Text style={styles.diaryDetailText}>{selectedDiaryEntry.content}</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.diarySaveButton, { backgroundColor: resultProfile.color }, pressed && styles.pressed]}
                android_ripple={{ color: '#0000002E' }}
                accessibilityRole="button"
                onPress={() => setDiaryMode('list')}
              >
                <Text style={styles.primaryButtonText}>목록으로 돌아가기</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
