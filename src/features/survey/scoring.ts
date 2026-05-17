import { careerTypes, initialScores, questions, tieBreakerQuestions } from './data';
import type { AnswerMap, CareerScores, CareerType, Question } from './types';

export function calculateScores(answers: AnswerMap): CareerScores {
  return calculateScoresForQuestions(answers, questions);
}

export function calculateTieBreakerScores(answers: AnswerMap): CareerScores {
  return calculateScoresForQuestions(answers, careerTypes.flatMap((type) => tieBreakerQuestions[type]));
}

export function calculateScoresForQuestions(answers: AnswerMap, targetQuestions: Question[]): CareerScores {
  return targetQuestions.reduce<CareerScores>(
    (scores, question) => {
      scores[question.type] += answers[question.id] ?? 0;
      return scores;
    },
    { ...initialScores },
  );
}

export function combineScores(baseScores: CareerScores, extraScores: CareerScores): CareerScores {
  return {
    investigative: baseScores.investigative + extraScores.investigative,
    artistic: baseScores.artistic + extraScores.artistic,
    social: baseScores.social + extraScores.social,
  };
}

export function getTopCareerType(scores: CareerScores): CareerType {
  return getTopCareerTypes(scores)[0];
}

export function getTopCareerTypes(scores: CareerScores): CareerType[] {
  const topScore = Math.max(...careerTypes.map((type) => scores[type]));

  return careerTypes.filter((type) => scores[type] === topScore);
}

export function getTieBreakerQuestions(tiedTypes: CareerType[]): Question[] {
  return tiedTypes.flatMap((type) => tieBreakerQuestions[type]);
}

export function getTopCareerTypeByOrder(scores: CareerScores, allowedTypes: CareerType[]): CareerType {
  return careerTypes.reduce<CareerType>((winner, type) => {
    if (!allowedTypes.includes(type)) {
      return winner;
    }

    if (scores[type] > scores[winner]) {
      return type;
    }

    return winner;
  }, allowedTypes[0] ?? 'investigative');
}

export function getProgressPercent(answeredCount: number, totalCount: number) {
  if (totalCount === 0) {
    return 0;
  }

  return Math.round((answeredCount / totalCount) * 100);
}
