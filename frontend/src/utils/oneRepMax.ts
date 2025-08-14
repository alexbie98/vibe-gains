/**
 * Calculate estimated 1 Rep Max using the Epley Formula
 * Formula: 1RM = Weight Lifted × (1 + Reps / 30)
 * 
 * @param weight - Weight lifted
 * @param reps - Number of repetitions
 * @returns Estimated 1RM
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  
  return weight * (1 + reps / 30);
}

/**
 * Calculate the maximum estimated 1RM from an array of sets
 * 
 * @param sets - Array of sets with weight and reps
 * @returns Maximum estimated 1RM from all sets
 */
export function calculateMaxOneRepMax(sets: Array<{ weight: number; reps: number }>): number {
  if (!sets || sets.length === 0) return 0;
  
  return Math.max(...sets.map(set => calculateOneRepMax(set.weight, set.reps)));
}

/**
 * Find the set with the maximum estimated 1RM and return both the 1RM and the set
 * 
 * @param sets - Array of sets with weight and reps
 * @returns Object with maxOneRepMax and the corresponding set
 */
export function findMaxOneRepMaxSet(sets: Array<{ weight: number; reps: number }>): {
  maxOneRepMax: number;
  bestSet: { weight: number; reps: number } | null;
} {
  if (!sets || sets.length === 0) {
    return { maxOneRepMax: 0, bestSet: null };
  }
  
  let maxOneRepMax = 0;
  let bestSet: { weight: number; reps: number } | null = null;
  
  sets.forEach(set => {
    const oneRepMax = calculateOneRepMax(set.weight, set.reps);
    if (oneRepMax > maxOneRepMax) {
      maxOneRepMax = oneRepMax;
      bestSet = set;
    }
  });
  
  return { maxOneRepMax, bestSet };
}