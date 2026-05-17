import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';

import { answerOptions, careerTypes, maxTypeScore, profiles, questions } from './data';
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
import type { AnswerMap, AnswerValue, CareerType, SurveyScreen } from './types';

export function SurveyApp() {
  const [screen, setScreen] = useState<SurveyScreen>('home');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tieBreakerIndex, setTieBreakerIndex] = useState(0);
  const [tiedTypes, setTiedTypes] = useState<CareerType[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [tieBreakerAnswers, setTieBreakerAnswers] = useState<AnswerMap>({});

  const currentQuestion = questions[currentIndex];
  const tieBreakerQuestions = useMemo(() => getTieBreakerQuestions(tiedTypes), [tiedTypes]);
  const currentTieBreakerQuestion = tieBreakerQuestions[tieBreakerIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = getProgressPercent(answeredCount, questions.length);
  const tieBreakerAnsweredCount = Object.keys(tieBreakerAnswers).length;
  const tieBreakerProgress = getProgressPercent(tieBreakerAnsweredCount, tieBreakerQuestions.length);

  const scores = useMemo(() => calculateScores(answers), [answers]);
  const tieBreakerScores = useMemo(() => calculateTieBreakerScores(tieBreakerAnswers), [tieBreakerAnswers]);
  const finalScores = useMemo(() => combineScores(scores, tieBreakerScores), [scores, tieBreakerScores]);
  const resultType = useMemo(() => getTopCareerType(finalScores), [finalScores]);
  const resultProfile = profiles[resultType];

  const restartSurvey = () => {
    setAnswers({});
    setTieBreakerAnswers({});
    setTiedTypes([]);
    setCurrentIndex(0);
    setTieBreakerIndex(0);
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

    setScreen('result');
  };

  const selectTieBreakerAnswer = (value: AnswerValue) => {
    if (!currentTieBreakerQuestion) {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
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
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              android_ripple={{ color: '#0000002E' }}
              accessibilityRole="button"
              onPress={restartSurvey}
            >
              <Text style={styles.primaryButtonText}>검사 시작하기</Text>
            </Pressable>
          </View>

          <View style={styles.typeGrid}>
            {careerTypes.map((type) => {
              const profile = profiles[type];
              return (
                <View key={type} style={[styles.typeCard, { backgroundColor: profile.softColor }]}>
                  <Text style={styles.typeIcon}>{profile.icon}</Text>
                  <Text style={styles.typeTitle}>{profile.title}</Text>
                  <Text style={styles.typeDescription}>{profile.label}</Text>
                </View>
              );
            })}
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
              <Text style={styles.secondaryButtonText}>처음으로</Text>
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
              onPress={restartSurvey}
            >
              <Text style={styles.secondaryButtonText}>처음부터</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {screen === 'result' && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
              const scoreMax = maxTypeScore + (tiedTypes.includes(type) ? 4 : 0);
              const scorePercent = Math.min(Math.round((finalScores[type] / scoreMax) * 100), 100);
              return (
                <View key={type} style={styles.scoreRow}>
                  <View style={styles.scoreTopLine}>
                    <Text style={styles.scoreLabel}>{profile.title}</Text>
                    <Text style={styles.scoreValue}>{finalScores[type]}점</Text>
                  </View>
                  <View style={styles.scoreTrack}>
                    <View style={[styles.scoreFill, { width: `${scorePercent}%`, backgroundColor: profile.color }]} />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.infoPanel}>
            <Text style={styles.sectionTitle}>성향 요약 리포트</Text>
            <Text style={styles.bodyText}>{resultProfile.description}</Text>
            <Text style={styles.sectionTitle}>성향 맞춤 가이드</Text>
            <Text style={styles.bodyText}>{resultProfile.guide}</Text>
          </View>

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
          <Pressable
            style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
            android_ripple={{ color: '#1F2A4424' }}
            accessibilityRole="button"
            onPress={restartSurvey}
          >
            <Text style={styles.textButtonLabel}>다시 검사하기</Text>
          </Pressable>
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
              { backgroundColor: resultProfile.color },
              pressed && styles.pressed,
            ]}
            android_ripple={{ color: '#0000002E' }}
            accessibilityRole="button"
            onPress={() => setScreen('home')}
          >
            <Text style={styles.primaryButtonText}>처음 화면으로</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
