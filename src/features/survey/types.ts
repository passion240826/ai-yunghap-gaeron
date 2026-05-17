export type CareerType = 'investigative' | 'artistic' | 'social';

export type SurveyScreen = 'home' | 'survey' | 'tieBreaker' | 'result' | 'roadmap';

export type AnswerValue = 0 | 1 | 2;

export type Question = {
  id: string;
  type: CareerType;
  text: string;
};

export type RoadmapStep = {
  step: string;
  title: string;
  place: string;
  quest: string;
};

export type CareerProfile = {
  type: CareerType;
  title: string;
  label: string;
  nickname: string;
  icon: string;
  color: string;
  softColor: string;
  imageCaption: string;
  description: string;
  guide: string;
  roadmapTitle: string;
  roadmapSummary: string;
  roadmap: RoadmapStep[];
};

export type AnswerMap = Record<string, AnswerValue>;

export type CareerScores = Record<CareerType, number>;
