import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';

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
  const kakaoAppKey = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

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
  const [selectedHomeType, setSelectedHomeType] = useState<CareerType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tieBreakerIndex, setTieBreakerIndex] = useState(0);
  const [tiedTypes, setTiedTypes] = useState<CareerType[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [tieBreakerAnswers, setTieBreakerAnswers] = useState<AnswerMap>({});
  const [selectedMissionIndex, setSelectedMissionIndex] = useState<number | null>(0);
  const [recordingMissionIndex, setRecordingMissionIndex] = useState<number | null>(null);
  const [missionReflections, setMissionReflections] = useState<string[]>(['', '', '']);
  const [reflectionDraft, setReflectionDraft] = useState('');
  const [completedMissionCount, setCompletedMissionCount] = useState(0);
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
  const [experienceSubmissions, setExperienceSubmissions] = useState<Record<string, ExperienceSubmission>>({});
  const [selectedExperienceId, setSelectedExperienceId] = useState(experienceMissions[0]?.id ?? '');
  const [experienceProofText, setExperienceProofText] = useState('');
  const [experienceReflection, setExperienceReflection] = useState('');
  const [gpsVerifiedMissionId, setGpsVerifiedMissionId] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState('');
  const [portfolioName, setPortfolioName] = useState('김OO');
  const [portfolioDesiredCareer, setPortfolioDesiredCareer] = useState('');
  const [hasSurveyResult, setHasSurveyResult] = useState(false);
  const [missionEntrySource, setMissionEntrySource] = useState<'home' | 'roadmap'>('roadmap');
  const [experienceEntrySource, setExperienceEntrySource] = useState<'home' | 'roadmap'>('roadmap');
  const [diaryFirstEntryBonusClaimed, setDiaryFirstEntryBonusClaimed] = useState(false);
  const [pointPopupText, setPointPopupText] = useState('');
  const pointPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const resultType = useMemo(() => getTopCareerType(finalScores), [finalScores]);
  const resultProfile = profiles[resultType];
  const puzzleMissions = useMemo(
    () =>
      resultProfile.missionTasks.map((task, index) => ({
        step: `${index + 1}단계`,
        title: `${index + 1}번째 작은 성장 과제`,
        place: '성장 노트',
        quest: task,
      })),
    [resultProfile],
  );
  const selectedExperienceMission = experienceMissions.find((mission) => mission.id === selectedExperienceId) ?? experienceMissions[0];
  const completedExperienceCount = Object.keys(experienceSubmissions).length;
  const totalExperienceXp = Object.values(experienceSubmissions).reduce((sum, submission) => sum + submission.earnedXp, 0);
  const unlockedMissionCount = Math.min(completedMissionCount + 1, puzzleMissions.length);
  const collectedPuzzleCount = Math.min(completedMissionCount + 1, 4);
  const allMissionsCompleted = completedMissionCount >= puzzleMissions.length;
  const puzzlePoints = collectedPuzzleCount * 2;
  const diaryBonusPoints = diaryFirstEntryBonusClaimed ? 4 : 0;
  const growthPoints = puzzlePoints + diaryBonusPoints;
  const totalCareerPoints = growthPoints + totalExperienceXp;
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

  const restartSurvey = () => {
    setAnswers({});
    setTieBreakerAnswers({});
    setTiedTypes([]);
    setCurrentIndex(0);
    setTieBreakerIndex(0);
    setSelectedMissionIndex(0);
    setRecordingMissionIndex(null);
    setMissionReflections(['', '', '']);
    setReflectionDraft('');
    setCompletedMissionCount(0);
    setExperienceSubmissions({});
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

    const nextReflections = [...missionReflections];
    nextReflections[recordingMissionIndex] = reflectionDraft.trim();
    setMissionReflections(nextReflections);
    setRecordingMissionIndex(null);
  };

  const completeMission = (index: number) => {
    if (!missionReflections[index] || index !== completedMissionCount) {
      return;
    }

    const nextCompletedCount = Math.min(completedMissionCount + 1, puzzleMissions.length);
    setCompletedMissionCount(nextCompletedCount);
    setSelectedMissionIndex(Math.min(index + 1, puzzleMissions.length - 1));
    showPointPopup(2);

    if (nextCompletedCount >= puzzleMissions.length) {
      setDiaryType(resultProfile.title);
    }
  };

  const claimGrowthDiary = () => {
    setDiaryUnlocked(true);
    setDiaryType(resultProfile.title);
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
    if (diaryDay && !diaryDays.includes(diaryDay)) {
      setDiaryDay('');
    }
  }, [diaryDay, diaryDays]);

  useEffect(() => {
    return () => {
      if (pointPopupTimerRef.current) {
        clearTimeout(pointPopupTimerRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {pointPopupText ? (
        <View style={styles.pointPopup}>
          <Text style={styles.pointPopupText}>{pointPopupText}</Text>
        </View>
      ) : null}
      {screen === 'home' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.topBar}>
              <Text style={styles.brand}>꿈길 찾기</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3유형 진로 검사</Text>
              </View>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.heroImage}>
                <Text style={styles.heroIcon}>🧭</Text>
              </View>
              <Text style={styles.eyebrow}>탐구형 · 예술형 · 사회형</Text>
              <Text style={styles.title}>나에게 어울리는 진로 유형을 찾아봐요</Text>
              <Text style={styles.subtitle}>
                75개의 문항에 답하면 가장 점수가 높은 유형과 맞춤 로드맵을 확인할 수 있어요.
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
                  <Text style={styles.homePointValue}>{totalCareerPoints}점</Text>
                  <Text style={styles.homePointText}>
                    퍼즐 미션 {growthPoints}점 · 진로 미션 {totalExperienceXp}점
                  </Text>
                </View>
              )}
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
            <Text style={styles.portfolioTitle}>진로 성장 포트폴리오</Text>
            <Text style={styles.portfolioSubtitle}>검사 결과와 실제 경험을 자동으로 정리한 PDF용 포트폴리오입니다.</Text>
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
            <Text style={styles.portfolioSectionTitle}>유형별 점수</Text>
            {careerTypes.map((type) => {
              const profile = profiles[type];
              return (
                <View key={type} style={styles.portfolioScoreRow}>
                  <Text style={styles.portfolioScoreLabel}>{profile.title}</Text>
                  <View style={styles.portfolioScoreTrack}>
                    <View
                      style={[
                        styles.portfolioScoreFill,
                        { width: `${Math.min(Math.max(finalScores[type], 8), 100)}%` as const, backgroundColor: profile.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.portfolioScoreValue}>{finalScores[type]}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.portfolioSection}>
            <Text style={styles.portfolioSectionTitle}>수행 경험</Text>
            {Object.values(experienceSubmissions).length === 0 ? (
              <Text style={styles.portfolioEmptyText}>아직 인증된 경험이 없습니다. 진로 미션 인증을 완료하면 자동으로 추가됩니다.</Text>
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
                    <Text style={styles.portfolioListText}>{submission.reflection}</Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.portfolioSection}>
            <Text style={styles.portfolioSectionTitle}>성장 다이어리</Text>
            {sortedDiaryEntries.length === 0 ? (
              <Text style={styles.portfolioEmptyText}>저장된 다이어리 페이지가 없습니다.</Text>
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
            <Text style={styles.portfolioSectionTitle}>추천 다음 활동</Text>
            {recommendedParentActivities.slice(0, 3).map((activity) => (
              <View key={activity.id} style={styles.portfolioListItem}>
                <Text style={styles.portfolioListTitle}>{activity.title}</Text>
                <Text style={styles.portfolioListText}>{activity.district} · {activity.place}</Text>
                <Text style={styles.portfolioListText}>{activity.info}</Text>
              </View>
            ))}
          </View>

          <View style={styles.portfolioSection}>
            <Text style={styles.portfolioSectionTitle}>자동 분석 요약</Text>
            <Text style={styles.portfolioSummaryText}>
              {portfolioName || '아이'}는 현재 {resultProfile.title} 성향이 가장 높고, 실제 경험 데이터에서는 {profiles[strongestGrowthType].title} 영역이 가장 크게 성장했습니다. 다음 단계에서는 {profiles[weakestExperienceType].title} 경험을 보완하면 더 균형 있는 진로 탐색이 가능합니다.
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
            <Text style={styles.parentHeroTitle}>AI 진로 성장 그래프</Text>
            <Text style={styles.parentHeroText}>
              설문 결과와 실제 인증 활동을 누적해 아이의 흥미 변화와 다음 체험 방향을 보여줍니다.
            </Text>
          </View>

          <View style={styles.parentPanel}>
            <Text style={styles.sectionTitle}>흥미 변화</Text>
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
            <Text style={styles.sectionTitle}>성장 요약</Text>
            <Text style={styles.parentReportText}>
              현재 가장 강하게 성장한 영역은 {profiles[strongestGrowthType].title}입니다. 실제 인증 경험치 기준으로 {profiles[weakestExperienceType].title} 경험이 가장 부족합니다.
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
            <Text style={styles.sectionTitle}>수행 미션</Text>
            {Object.values(experienceSubmissions).length === 0 ? (
              <Text style={styles.parentReportText}>아직 인증된 경험 미션이 없습니다. 결과 화면에서 진로 미션 인증을 먼저 진행해 보세요.</Text>
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
            <Text style={styles.sectionTitle}>부족 경험</Text>
            <Text style={styles.parentReportText}>
              {profiles[weakestExperienceType].title} 활동 인증이 상대적으로 적습니다. 균형 있는 진로 탐색을 위해 아래 활동을 추천합니다.
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
            <Text style={styles.sectionTitle}>성장 리포트</Text>
            <Text style={styles.parentReportText}>
              이 리포트는 검사 점수, 인증 경험치, 수행 미션을 바탕으로 생성되었습니다. 출력 버튼을 누르면 브라우저의 PDF 저장 기능으로 리포트를 보관할 수 있습니다.
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

      {screen === 'activityMap' && (
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
            <Text style={[styles.roadmapType, { color: resultProfile.color }]}>검사 결과</Text>
          </View>

          <View style={[styles.resultHero, { backgroundColor: resultProfile.softColor }]}>
            <Text style={styles.resultIcon}>{resultProfile.icon}</Text>
            <Text style={[styles.resultKicker, { color: resultProfile.color }]}>검사 결과</Text>
            <Text style={styles.resultTitle}>당신은 {resultProfile.title}입니다.</Text>
            <Text style={styles.resultSubtitle}>{resultProfile.nickname}</Text>
            <View style={styles.imageBox}>
              <Text style={styles.imageIcon}>{resultProfile.icon}</Text>
              <Text style={styles.imageCaption}>{resultProfile.imageCaption}</Text>
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
              { backgroundColor: '#1F2A44', marginBottom: 10 },
              pressed && styles.pressed,
            ]}
            android_ripple={{ color: '#0000002E' }}
            accessibilityRole="button"
            onPress={restartSurvey}
          >
            <Text style={styles.primaryButtonText}>다시 검사하기</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: resultProfile.color },
              pressed && styles.pressed,
            ]}
            android_ripple={{ color: '#0000002E' }}
            accessibilityRole="button"
            onPress={() => setScreen('roadmap')}
          >
            <Text style={styles.primaryButtonText}>로드맵을 확인해보세요!</Text>
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
                  <Text style={styles.timelineQuest}>{item.quest}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: '#1F2A44', marginBottom: 10 },
              pressed && styles.pressed,
            ]}
            android_ripple={{ color: '#0000002E' }}
            accessibilityRole="button"
            onPress={() => {
              setExperienceEntrySource('roadmap');
              setScreen('experience');
            }}
          >
            <Text style={styles.primaryButtonText}>진로 미션 인증하기</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: resultProfile.color },
              pressed && styles.pressed,
            ]}
            android_ripple={{ color: '#0000002E' }}
            accessibilityRole="button"
            onPress={() => {
              setMissionEntrySource('roadmap');
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
            <Text style={[styles.roadmapType, { color: resultProfile.color }]}>퍼즐 미션</Text>
          </View>

          <View style={[styles.fairyRoadmap, { borderColor: resultProfile.color }]}>
            <View style={styles.fairySky}>
              <Text style={styles.fairyCloud}>퍼즐 {collectedPuzzleCount}/4</Text>
              <Text style={styles.fairyStar}>{growthPoints}포인트</Text>
            </View>
            <Text style={styles.fairyIcon}>{resultProfile.icon}</Text>
            <Text style={styles.fairyTitle}>{resultProfile.nickname}의 성장 모험</Text>
            <Text style={styles.fairyStory}>{resultProfile.missionStory}</Text>
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
                      collected && { backgroundColor: resultProfile.color, borderColor: resultProfile.color },
                    ]}
                  >
                    <Text style={[styles.puzzlePieceText, collected && styles.puzzlePieceTextActive]}>
                      {collected ? (piece === 0 ? resultProfile.icon : piece) : '잠금'}
                    </Text>
                  </View>
                );
              })}
            </View>

            {allMissionsCompleted && (
              <View style={styles.completedGiftBox}>
                <Text style={styles.completedGiftTitle}>성향별 이미지가 완성됐어요!</Text>
                <Text style={styles.completedGiftText}>
                  모든 퍼즐 조각을 모았습니다. 성장 다이어리를 획득하면 스스로 찾은 활동도 기록할 수 있어요. 처음 다이어리를 작성하면 4포인트가 추가 지급됩니다.
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.diaryGiftButton, pressed && styles.pressed]}
                  android_ripple={{ color: '#0000002E' }}
                  accessibilityRole="button"
                  onPress={claimGrowthDiary}
                >
                  <Text style={styles.primaryButtonText}>성장 다이어리 획득하기</Text>
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
                    <View style={[styles.missionBadge, { backgroundColor: unlocked ? resultProfile.color : '#AAB7C4' }]}>
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
                                { backgroundColor: resultProfile.color },
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
                                { backgroundColor: resultProfile.color },
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
