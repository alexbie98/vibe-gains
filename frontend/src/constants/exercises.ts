export interface Exercise {
  value: string;
  label: string;
}

export const COMMON_EXERCISES: Exercise[] = [
  { value: 'Bench Press', label: 'Bench Press' },
  { value: 'Dumbbell Bench Press', label: 'Dumbbell Bench Press' },
  { value: 'Squat', label: 'Squat' },
  { value: 'Deadlift', label: 'Deadlift' },
  { value: 'Dumbbell Row (Left)', label: 'Dumbbell Row (Left)' },
  { value: 'Dumbbell Row (Right)', label: 'Dumbbell Row (Right)' },
  { value: 'Pull-ups', label: 'Pull-ups' },
  { value: 'Pull-ups (banded)', label: 'Pull-ups (banded)' },
  { value: 'Chin-ups', label: 'Chin-ups' },
  { value: 'Dips', label: 'Dips' },
  { value: 'Lat Pulldown', label: 'Lat Pulldown' },
  { value: 'Lateral Raises', label: 'Lateral Raises' },
  { value: 'Bicep Curls', label: 'Bicep Curls' },
  { value: 'Hammer Curls', label: 'Hammer Curls' },
];