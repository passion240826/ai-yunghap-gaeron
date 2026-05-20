export type CareerType = 'investigative' | 'artistic' | 'social';

export type SurveyScreen = 'home' | 'survey' | 'tieBreaker' | 'result' | 'roadmap' | 'mission' | 'diary' | 'activityMap' | 'experience' | 'parent' | 'portfolio';

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
  personality: string;
  recommendedJobs: string[];
  missionStory: string;
  missionTasks: string[];
  roadmapTitle: string;
  roadmapSummary: string;
  roadmap: RoadmapStep[];
};

export type AnswerMap = Record<string, AnswerValue>;

export type CareerScores = Record<CareerType, number>;

export type SeoulCareerActivity = {
  id: string;
  district: string;
  title: string;
  place: string;
  address: string;
  info: string;
  lat: number;
  lng: number;
  sourceUrl: string;
};


export type ExperienceProofType = 'reflection' | 'photo' | 'gps' | 'qr';

export type ExperienceMission = {
  id: string;
  type: CareerType;
  title: string;
  activity: string;
  description: string;
  proofType: ExperienceProofType;
  xp: number;
  lat?: number;
  lng?: number;
  qrCode?: string;
};

export type ExperienceSubmission = {
  missionId: string;
  proofText: string;
  reflection: string;
  earnedXp: number;
  completedAt: string;
};
