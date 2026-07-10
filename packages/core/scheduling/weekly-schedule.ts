import {
  DAY_OF_WEEK_VALUES,
  DISTRIBUTION_STYLE_VALUES,
} from "../constants/onboarding";

export type ScheduleDayOfWeek = (typeof DAY_OF_WEEK_VALUES)[number];
export type ScheduleDistributionStyle =
  (typeof DISTRIBUTION_STYLE_VALUES)[number];

export type ScheduleAvailability = {
  dayOfWeek: ScheduleDayOfWeek;
  hours: number;
};

export type ScheduleSubject = {
  subjectId: string;
  subjectName: string;
  difficultyLevel: number;
  weightMultiplier: number;
};

export type PlannedStudyTask = {
  subjectId: string;
  title: string;
  scheduledDate: Date;
};

export type WeeklyScheduleInput = {
  startDate: Date;
  availability: ScheduleAvailability[];
  distributionStyle: ScheduleDistributionStyle;
  subjects: ScheduleSubject[];
};

const DAY_OF_WEEK_BY_UTC_INDEX: readonly ScheduleDayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

type WeightedSubject = ScheduleSubject & {
  assignedBlocks: number;
  score: number;
};

function dateAtUtcMidnight(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function addDays(date: Date, days: number) {
  const result = dateAtUtcMidnight(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function scoreForStyle(
  score: number,
  distributionStyle: ScheduleDistributionStyle
) {
  switch (distributionStyle) {
    case "BALANCED":
      return Math.sqrt(score);
    case "FOCUSED":
      return score;
    case "INTENSIVE":
      return Math.pow(score, 1.35);
  }
}

function selectNextSubject(subjects: WeightedSubject[]) {
  return subjects.reduce((selected, candidate) => {
    const selectedRatio = selected.score / (selected.assignedBlocks + 1);
    const candidateRatio = candidate.score / (candidate.assignedBlocks + 1);

    if (
      candidateRatio > selectedRatio ||
      (candidateRatio === selectedRatio &&
        candidate.subjectName.localeCompare(selected.subjectName) < 0)
    ) {
      return candidate;
    }

    return selected;
  });
}

export function generateWeeklyStudyTasks({
  startDate,
  availability,
  distributionStyle,
  subjects,
}: WeeklyScheduleInput): PlannedStudyTask[] {
  const availableHoursByDay = new Map(
    availability.map(({ dayOfWeek, hours }) => [
      dayOfWeek,
      Math.max(0, Math.floor(hours)),
    ])
  );
  const rawPriorities = subjects.map((subject) => ({
    subject,
    priority: Math.max(0, subject.difficultyLevel * subject.weightMultiplier),
  }));
  const hasDifficultyPriority = rawPriorities.some(({ priority }) => priority > 0);
  const weightedSubjects = rawPriorities
    .map(({ subject, priority }) => {
      const baseScore = hasDifficultyPriority
        ? priority
        : Math.max(0, subject.weightMultiplier);

      return {
        ...subject,
        assignedBlocks: 0,
        score: scoreForStyle(baseScore, distributionStyle),
      };
    })
    .filter((subject) => subject.score > 0);

  if (weightedSubjects.length === 0) {
    return [];
  }

  const tasks: PlannedStudyTask[] = [];
  const weekStart = dateAtUtcMidnight(startDate);

  for (let offset = 0; offset < 7; offset += 1) {
    const scheduledDate = addDays(weekStart, offset);
    const dayOfWeek = DAY_OF_WEEK_BY_UTC_INDEX[scheduledDate.getUTCDay()];
    const hours = availableHoursByDay.get(dayOfWeek) ?? 0;

    // A task is a one-hour block, so daily task count cannot exceed availability.
    for (let block = 0; block < hours; block += 1) {
      const subject = selectNextSubject(weightedSubjects);
      subject.assignedBlocks += 1;

      tasks.push({
        subjectId: subject.subjectId,
        title: `Estudar ${subject.subjectName}`,
        scheduledDate,
      });
    }
  }

  return tasks;
}
