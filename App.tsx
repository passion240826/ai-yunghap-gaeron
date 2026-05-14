import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const features = [
  {
    title: '진로 적성 검사',
    description: '짧은 질문에 답하며 내가 좋아하는 활동을 찾아요.',
    accent: '#2F80ED',
    mark: '1',
  },
  {
    title: '진로 추천',
    description: '답변을 바탕으로 나와 잘 맞는 진로를 보여줘요.',
    accent: '#27AE60',
    mark: '2',
  },
  {
    title: '로드맵 추천',
    description: '이번 주부터 해볼 수 있는 작은 미션을 제안해요.',
    accent: '#F2994A',
    mark: '3',
  },
];

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.topBar}>
            <Text style={styles.brand}>꿈길 찾기</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>초등 진로 탐색</Text>
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.sun}>
              <View style={styles.sunCore} />
            </View>
            <Text style={styles.eyebrow}>나에게 어울리는 미래를 찾아봐요</Text>
            <Text style={styles.title}>오늘의 관심이 내일의 꿈이 되도록</Text>
            <Text style={styles.subtitle}>
              간단한 검사로 좋아하는 활동을 알아보고, 어울리는 진로와 실천 로드맵을 확인해요.
            </Text>
          </View>

          <Pressable style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>검사 시작하기</Text>
          </Pressable>
        </View>

        <View style={styles.featureList}>
          {features.map((feature) => (
            <View key={feature.title} style={styles.featureItem}>
              <View style={[styles.featureMark, { backgroundColor: feature.accent }]}>
                <Text style={styles.featureMarkText}>{feature.mark}</Text>
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.roadmapPreview}>
          <Text style={styles.previewLabel}>다음에 만들 화면</Text>
          <Text style={styles.previewTitle}>검사 질문, 추천 결과, 로드맵</Text>
          <Text style={styles.previewText}>
            첫 버전은 회원가입 없이 바로 검사하고 결과를 확인하는 흐름으로 구성합니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FBFF',
  },
  container: {
    padding: 20,
    paddingBottom: 36,
  },
  hero: {
    minHeight: 480,
    borderRadius: 28,
    backgroundColor: '#FFF7D6',
    padding: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFE08A',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    color: '#1F2A44',
    fontSize: 24,
    fontWeight: '900',
  },
  badge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#DDEBFF',
  },
  badgeText: {
    color: '#315078',
    fontSize: 12,
    fontWeight: '800',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 36,
  },
  sun: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: '#FFE8A3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  sunCore: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFB84D',
    borderWidth: 8,
    borderColor: '#FFFFFF',
  },
  eyebrow: {
    color: '#2F80ED',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 10,
  },
  title: {
    color: '#1F2A44',
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '900',
    maxWidth: 330,
  },
  subtitle: {
    color: '#42526E',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    marginTop: 14,
    maxWidth: 330,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#2F80ED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D5FBF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  featureList: {
    marginTop: 22,
    gap: 12,
  },
  featureItem: {
    minHeight: 92,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EDF8',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureMarkText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    color: '#1F2A44',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#52657A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  roadmapPreview: {
    marginTop: 20,
    borderRadius: 22,
    backgroundColor: '#E9F8EF',
    padding: 18,
    borderWidth: 1,
    borderColor: '#BDE7CC',
  },
  previewLabel: {
    color: '#2D7A46',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  previewTitle: {
    color: '#1F2A44',
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '900',
  },
  previewText: {
    color: '#40566F',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    marginTop: 8,
  },
});
