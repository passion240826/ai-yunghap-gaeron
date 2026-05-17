import type { AnswerValue, CareerProfile, CareerScores, CareerType, Question } from './types';

export const careerTypes: CareerType[] = ['investigative', 'artistic', 'social'];

export const initialScores: CareerScores = {
  investigative: 0,
  artistic: 0,
  social: 0,
};

export const answerOptions: { label: string; value: AnswerValue }[] = [
  { label: '그렇지 않다', value: 0 },
  { label: '보통이다', value: 1 },
  { label: '그렇다', value: 2 },
];

export const maxTypeScore = 50;

export const profiles: Record<CareerType, CareerProfile> = {
  investigative: {
    type: 'investigative',
    title: '탐구형',
    label: '미래를 여는 꼬마 과학자',
    nickname: '지적 탐험가',
    icon: '🔬',
    color: '#2F80ED',
    softColor: '#EAF3FF',
    imageCaption: '관찰, 실험, 분석을 즐기는 탐구 이미지',
    description:
      '현상의 원인을 논리적으로 분석하고 복잡한 문제를 하나씩 풀어갈 때 깊은 흥미를 느끼는 유형입니다. 주변 사물을 보며 "왜 그럴까?"라는 질문을 자주 던지는 관찰력이 강해요.',
    guide:
      '정답을 외우는 활동보다 스스로 가설을 세우고 실험과 데이터로 확인하는 환경에서 강점이 잘 드러납니다.',
    roadmapTitle: '미래를 여는 꼬마 과학자 로드맵',
    roadmapSummary: '과학 원리 체험부터 미래 기술, 코딩 캠프까지 이어지는 탐구형 성장 경로입니다.',
    roadmap: [
      {
        step: '1단계',
        title: '기초 과학 원리 온몸으로 체험하기',
        place: '서울시립과학관(노원구)',
        quest: '일상 속 과학 원리 전시를 관람하고 가장 신기했던 원리 1가지를 퀘스트 일지에 기록하기',
      },
      {
        step: '2단계',
        title: '최신 미래 기술 트렌드 마스터하기',
        place: '서울로봇인공지능과학관, 서울시교육청 융합과학교육원',
        quest: 'AI 로봇 도슨트 투어와 자율주행, 인공지능 작동 원리 교육 참여하기',
      },
      {
        step: '3단계',
        title: '나만의 상상을 현실로 만드는 코딩 캠프',
        place: '이노베이션 아카데미 또는 서울시내 소프트웨어 체험센터',
        quest: '엔트리나 스크래치로 나만의 미니 프로그램을 완성하고 결과물 인증하기',
      },
    ],
  },
  artistic: {
    type: 'artistic',
    title: '예술형',
    label: '트렌디한 디지털 크리에이터',
    nickname: '아이디어 크리에이터',
    icon: '🎨',
    color: '#E0568A',
    softColor: '#FFF0F5',
    imageCaption: '창작, 표현, 감각을 즐기는 예술 이미지',
    description:
      '틀에 박힌 규칙보다 자유로운 환경에서 나만의 생각과 감정을 표현할 때 행복한 유형입니다. 독창적인 감각과 아름다움을 알아보는 눈을 지녔어요.',
    guide:
      '반복적인 일보다 새로운 변화가 있는 환경이 어울리며, 시각 예술, 음악, 미디어 콘텐츠로 세상과 소통할 때 빛을 발합니다.',
    roadmapTitle: '트렌디한 디지털 크리에이터 로드맵',
    roadmapSummary: '시각 예술 감상에서 미디어 제작, 작품 발표까지 이어지는 예술형 성장 경로입니다.',
    roadmap: [
      {
        step: '1단계',
        title: '현대 미술과 시각 예술 감각 깨우기',
        place: '서울시립 미술아카이브(종로구) 또는 DDP 디자인랩(중구)',
        quest: '가장 영감을 준 디자인 작품을 사진으로 남기고 한 줄 평 작성하기',
      },
      {
        step: '2단계',
        title: '내 손으로 만드는 미디어 콘텐츠 기획',
        place: "서울시립청소년미디어센터 '스스로넷'(용산구)",
        quest: '웹툰, 사진, 영상 편집 중 하나의 원데이 클래스를 수강하기',
      },
      {
        step: '3단계',
        title: '세상에 내 작품을 선보이는 크리에이터 데뷔',
        place: '시립 청소년센터 미디어 동아리 또는 대한민국청소년미디어대전',
        quest: '직접 만든 단편 영상이나 캐릭터 디자인을 축제 또는 공모전에 출품하기',
      },
    ],
  },
  social: {
    type: 'social',
    title: '사회형',
    label: '마음을 치유하는 청소년 멘토, 리더',
    nickname: '다정한 리더',
    icon: '🤝',
    color: '#27AE60',
    softColor: '#EAF8EF',
    imageCaption: '공감, 소통, 협력을 즐기는 사회형 이미지',
    description:
      '주변 사람들의 마음에 공감하고 누군가를 도와주거나 가르쳐 줄 때 큰 보람을 느끼는 유형입니다. 친구들의 고민을 잘 들어주고 소통을 이끄는 따뜻한 에너지가 있어요.',
    guide:
      '혼자 일하는 환경보다 다양한 사람과 만나 긍정적인 영향을 전하고 공동체의 문제를 함께 해결하는 환경이 잘 맞습니다.',
    roadmapTitle: '마음을 치유하는 청소년 멘토, 리더 로드맵',
    roadmapSummary: '공감 리더십, 또래 상담, 지역사회 활동으로 이어지는 사회형 성장 경로입니다.',
    roadmap: [
      {
        step: '1단계',
        title: '타인과 소통하고 공감하는 리더십 배우기',
        place: '서울시립청소년활동진흥센터(동작구)',
        quest: '청소년 인성 교육 프로그램과 공동체 협동 게임에 참여하기',
      },
      {
        step: '2단계',
        title: '우리 동네 친구들의 마음을 돌보는 또래 상담가',
        place: '자치구별 시립 청소년센터 또는 청소년상담복지센터',
        quest: '또래 상담가 기획 교실을 수료하고 배운 대화법을 정리하기',
      },
      {
        step: '3단계',
        title: '따뜻한 사회를 만드는 지역사회 체인지메이커',
        place: '청소년 자원봉사 포털 두볼(Dovol), 서울 지역 봉사처',
        quest: '환경 캠페인, 플로깅, 돌봄 봉사 중 하나를 완료하고 활동 기록 남기기',
      },
    ],
  },
};

export const questions: Question[] = [
  { id: 'i1', type: 'investigative', text: '과학 잡지를 읽거나 새로운 기술 원리(AI, 로봇 등)를 알아내는 것이 재밌다.' },
  { id: 'i2', type: 'investigative', text: '수수께끼나 수학 문제처럼 답이 복잡한 문제를 끝까지 풀어내는 걸 좋아한다.' },
  { id: 'i3', type: 'investigative', text: '주변 사물이나 현상을 보면 "이건 어떤 원리로 움직이는 걸까?" 하고 생각해보곤 한다.' },
  { id: 'i4', type: 'investigative', text: '컴퓨터 프로그램이나 스마트폰 앱이 작동하는 내부 구조에 호기심이 생긴다.' },
  { id: 'i5', type: 'investigative', text: '무언가를 결정할 때 감정보다 정확한 사실과 통계 자료를 바탕으로 판단하는 편이다.' },
  { id: 'i6', type: 'investigative', text: '돋보기, 현미경, 실험 도구 등을 사용해 사물을 자세히 관찰하고 분석하는 활동이 즐겁다.' },
  { id: 'i7', type: 'investigative', text: '한 가지 주제에 꽂히면 책이나 인터넷을 뒤져 깊이 있게 끝까지 파고드는 성격이다.' },
  { id: 'i8', type: 'investigative', text: '친구들과 수다를 떠는 것보다 혼자 조용히 지적 호기심을 채우는 시간이 좋다.' },
  { id: 'i9', type: 'investigative', text: '학교 수업 중 과학 실험 시간이나 수학 시간이 가장 기다려진다.' },
  { id: 'i10', type: 'investigative', text: '새로운 가전제품이나 전자기기가 나오면 기능과 스펙을 자세히 살펴본다.' },
  { id: 'i11', type: 'investigative', text: '레고나 프라모델을 조립할 때 설명서를 꼼꼼히 읽고 구조를 이해하며 만든다.' },
  { id: 'i12', type: 'investigative', text: '"그냥 그래"라는 말보다 "왜냐하면"으로 시작하는 논리적인 설명이 좋다.' },
  { id: 'i13', type: 'investigative', text: '역사적 사건이나 자연 현상의 선후 관계를 표나 그래프로 정리하는 게 편하다.' },
  { id: 'i14', type: 'investigative', text: '별자리, 행성 등 우주와 관련된 다큐멘터리를 보면 몰입이 잘된다.' },
  { id: 'i15', type: 'investigative', text: '어떤 문제가 발생했을 때 당황하기보다 원인이 무엇인지부터 차분히 찾는다.' },
  { id: 'i16', type: 'investigative', text: '동식물의 종류를 분류하고 각각의 특징을 공책에 기록하는 활동이 흥미롭다.' },
  { id: 'i17', type: 'investigative', text: '논리적인 오류를 찾아내거나 남들의 주장 속 모순을 발견하는 편이다.' },
  { id: 'i18', type: 'investigative', text: '박물관이나 과학관에 가면 설명 안내문을 처음부터 끝까지 읽는다.' },
  { id: 'i19', type: 'investigative', text: '암기과목보다 공식 하나로 여러 문제를 풀어내는 과목이 더 적성에 맞는다.' },
  { id: 'i20', type: 'investigative', text: '체스, 바둑 혹은 전략을 치밀하게 짜야 하는 보드게임을 즐긴다.' },
  { id: 'i21', type: 'investigative', text: '인체 구조, 의학 지식, 범죄 수사 기법 같은 전문적인 분야에 호기심이 간다.' },
  { id: 'i22', type: 'investigative', text: '친구들이 무언가를 물어봤을 때 정확한 백과사전식 지식을 알려주고 싶다.' },
  { id: 'i23', type: 'investigative', text: '복잡한 기계나 장난감을 스스로 분해했다가 다시 조립해 본 적이 있다.' },
  { id: 'i24', type: 'investigative', text: '"창의적이다"보다 "똑똑하고 논리적이다"라는 칭찬을 들을 때 더 기쁘다.' },
  { id: 'i25', type: 'investigative', text: '세상의 모든 현상에는 명확한 이유와 원칙이 존재한다고 믿는다.' },
  { id: 'a1', type: 'artistic', text: '미술, 음악, 글쓰기, 영상 제작 등 나만의 아이디어로 무언가를 창작할 때 행복하다.' },
  { id: 'a2', type: 'artistic', text: '정해진 규칙이나 시간표대로 움직이는 것보다 자유롭게 행동하는 것이 편하다.' },
  { id: 'a3', type: 'artistic', text: '내 방을 꾸미거나 옷을 입을 때 남들과 다른 나만의 개성을 보여주고 싶다.' },
  { id: 'a4', type: 'artistic', text: '아름다운 풍경, 세련된 디자인의 물건, 멋진 예술 작품을 보면 쉽게 감동을 받는다.' },
  { id: 'a5', type: 'artistic', text: '정답이 하나로 정해진 문제보다 다양한 해석과 상상을 할 수 있는 열린 질문이 좋다.' },
  { id: 'a6', type: 'artistic', text: '글쓰기, 멜로디 흥얼거리기, 낙서처럼 내 감정을 표현하는 활동을 즐긴다.' },
  { id: 'a7', type: 'artistic', text: '매일 똑같이 반복되는 일상보다 새로운 변화와 모험이 있는 환경이 좋다.' },
  { id: 'a8', type: 'artistic', text: '영화나 소설을 볼 때 스토리의 결말을 내 방식대로 상상해서 바꾸어 보곤 한다.' },
  { id: 'a9', type: 'artistic', text: '무언가를 배울 때 이론적인 설명보다 오감으로 직접 느끼는 감각이 더 중요하다.' },
  { id: 'a10', type: 'artistic', text: '남들이 생각하지 못한 기발하고 엉뚱한 아이디어를 내서 사람들을 놀라게 하곤 한다.' },
  { id: 'a11', type: 'artistic', text: '웹툰이나 예쁜 일러스트를 따라 그리거나 수집하는 걸 좋아한다.' },
  { id: 'a12', type: 'artistic', text: '교복이나 소지품을 내 취향에 맞게 리폼하거나 꾸미는 데 소질이 있다.' },
  { id: 'a13', type: 'artistic', text: '악기를 연주하거나 노래를 부를 때 나만의 감정을 담아 표현하는 편이다.' },
  { id: 'a14', type: 'artistic', text: '계획을 철저하게 세우기보다 그날의 기분과 영감에 따라 행동한다.' },
  { id: 'a15', type: 'artistic', text: '유행하는 밈이나 숏폼 영상을 나만의 방식으로 재해석해 보고 싶다.' },
  { id: 'a16', type: 'artistic', text: '미술관이나 쇼품숍 구경처럼 감각을 자극하는 공간에 가는 것을 좋아한다.' },
  { id: 'a17', type: 'artistic', text: '"얌전하고 모범적이다"보다 "개성 있고 매력적이다"라는 말이 더 좋다.' },
  { id: 'a18', type: 'artistic', text: '글을 쓸 때 단어의 어감이나 문장의 분위기를 아름답게 다듬는 데 신경을 쓴다.' },
  { id: 'a19', type: 'artistic', text: '어떤 사물을 보면 전혀 상관없는 기발한 비유나 상상이 머릿속에 떠오른다.' },
  { id: 'a20', type: 'artistic', text: '조직의 규율이나 단체 유니폼처럼 나를 틀에 가두는 규칙은 답답하게 느껴진다.' },
  { id: 'a21', type: 'artistic', text: '연극, 축제, 댄스 무대처럼 사람들 앞에서 표현하는 활동에 관심이 있다.' },
  { id: 'a22', type: 'artistic', text: '주변 친구들의 감정이나 날씨의 변화를 섬세하게 잘 알아채는 편이다.' },
  { id: 'a23', type: 'artistic', text: '방의 가구 배치를 새로 바꾸거나 나만의 감성적인 공간으로 꾸미는 걸 즐긴다.' },
  { id: 'a24', type: 'artistic', text: '남들의 시선보다 내가 만족하고 즐거운 창작을 하는 게 더 중요하다.' },
  { id: 'a25', type: 'artistic', text: '예술은 세상을 더 아름답고 풍요롭게 만드는 중요한 요소라고 생각한다.' },
  { id: 's1', type: 'social', text: '친구가 속상한 일로 고민을 털어놓으면 진심으로 공감해주고 위로해주고 싶다.' },
  { id: 's2', type: 'social', text: '새로 알게 된 지식이나 유익한 정보를 다른 사람에게 친절하게 가르쳐 줄 때 보람차다.' },
  { id: 's3', type: 'social', text: '혼자 노는 것보다 친구들과 힘을 합쳐 하나의 목표를 이루는 게 즐겁다.' },
  { id: 's4', type: 'social', text: '주변에 소외되거나 슬퍼하는 사람이 있으면 먼저 다가가 말을 건네고 도와주는 편이다.' },
  { id: 's5', type: 'social', text: '사람들의 성격이나 심리, 행동의 이유에 대해 알아보고 대화하는 것에 관심이 많다.' },
  { id: 's6', type: 'social', text: '우리 동네나 학교를 더 따뜻하고 살기 좋은 곳으로 만드는 활동에 관심이 있다.' },
  { id: 's7', type: 'social', text: '처음 만나는 사람과도 대화를 잘 이어나가고 어색함을 풀어주는 편이다.' },
  { id: 's8', type: 'social', text: '무리 안에서 갈등이나 싸움이 생기면 중간에서 말을 전하며 잘 중재한다.' },
  { id: 's9', type: 'social', text: '나 혼자 1등을 하는 것보다 조원 모두가 함께 좋은 점수를 받는 게 더 기쁘다.' },
  { id: 's10', type: 'social', text: '아픈 사람을 돌보거나 어린아이들과 놀아주는 일이 힘들지 않고 즐겁다.' },
  { id: 's11', type: 'social', text: '친구들의 생일이나 기념일을 기억해 두었다가 편지와 선물을 챙긴다.' },
  { id: 's12', type: 'social', text: '캠프나 조별 과제에서 조장을 맡아 팀원들을 다독이며 이끄는 역할을 자주 한다.' },
  { id: 's13', type: 'social', text: '대화할 때 내 이야기만 하기보다 상대방의 말을 끝까지 경청하고 반응을 잘한다.' },
  { id: 's14', type: 'social', text: '"일 처리가 빠르다"보다 "따뜻하고 믿음직하다"라는 말이 더 좋다.' },
  { id: 's15', type: 'social', text: '환경 보호 캠페인, 기부 활동 등 공익적인 일에 참여하고 싶다.' },
  { id: 's16', type: 'social', text: '누군가 도움을 청하면 내 일은 제쳐두고서라도 도와주려는 성향이 있다.' },
  { id: 's17', type: 'social', text: '혼자 공부하는 독서실보다 친구들과 모여서 서로 물어보며 공부하는 게 잘된다.' },
  { id: 's18', type: 'social', text: '타인의 장점을 잘 찾아내고 그것을 진심으로 칭찬해 주는 것을 잘한다.' },
  { id: 's19', type: 'social', text: '심리학 책이나 사람의 마음을 다룬 상담 관련 콘텐츠에 흥미를 느낀다.' },
  { id: 's20', type: 'social', text: '새로운 환경에 처한 전학생이나 신입 부원이 있으면 먼저 다가가 적응을 돕는다.' },
  { id: 's21', type: 'social', text: '친구들이 나를 비밀을 잘 지켜주는 편안한 상담소처럼 생각하고 의지한다.' },
  { id: 's22', type: 'social', text: '모임이나 동아리를 기획하고 사람들을 한곳에 모으는 사회자 역할을 잘해낸다.' },
  { id: 's23', type: 'social', text: '나 때문에 다른 사람이 기뻐하거나 행복해하는 모습을 볼 때 삶의 보람을 느낀다.' },
  { id: 's24', type: 'social', text: '말 한마디를 하더라도 상대방이 상처받지 않게 다정하게 말하려고 노력한다.' },
  { id: 's25', type: 'social', text: '세상은 서로를 돕고 연대하는 따뜻한 사람들에 의해 발전한다고 믿는다.' },
];

export const tieBreakerQuestions: Record<CareerType, Question[]> = {
  investigative: [
    {
      id: 'tie-i1',
      type: 'investigative',
      text: '새로운 문제를 만나면 바로 답을 보기보다 원인을 추리하며 해결해보고 싶다.',
    },
    {
      id: 'tie-i2',
      type: 'investigative',
      text: '내가 좋아하는 주제를 깊이 조사해서 다른 사람에게 정확하게 설명하는 일이 즐겁다.',
    },
  ],
  artistic: [
    {
      id: 'tie-a1',
      type: 'artistic',
      text: '같은 과제라도 나만의 색깔이 드러나도록 표현 방식을 바꾸고 싶다.',
    },
    {
      id: 'tie-a2',
      type: 'artistic',
      text: '생각이나 감정을 그림, 글, 음악, 영상 같은 창작물로 남길 때 가장 만족스럽다.',
    },
  ],
  social: [
    {
      id: 'tie-s1',
      type: 'social',
      text: '친구나 가족이 힘들어할 때 곁에서 이야기를 들어주고 해결 방법을 함께 찾고 싶다.',
    },
    {
      id: 'tie-s2',
      type: 'social',
      text: '여러 사람이 함께하는 활동에서 분위기를 살피고 모두가 참여하도록 돕는 편이다.',
    },
  ],
};
