/**
 * Olympic-style trimmed mean per rubric (one dimension, multiple judges).
 * - n ≤ 2: no trim (average all — cannot drop without emptying)
 * - n = 3 or 4: remove 1 lowest and 1 highest
 * - n ≥ 5: remove 2 lowest and 2 highest
 */
export function olympicTrimmedMean(values) {
  const arr = values.map(Number).filter((x) => !Number.isNaN(x));
  const n = arr.length;
  if (n === 0) {
    return {
      trimmedMean: null,
      usedScores: [],
      droppedLow: [],
      droppedHigh: [],
      judgeCount: 0,
      trimRule: 'none',
    };
  }
  if (n <= 2) {
    const sum = arr.reduce((a, b) => a + b, 0);
    return {
      trimmedMean: sum / n,
      usedScores: [...arr].sort((a, b) => a - b),
      droppedLow: [],
      droppedHigh: [],
      judgeCount: n,
      trimRule: 'none (≤2 judges)',
    };
  }

  const sorted = [...arr].sort((a, b) => a - b);
  let dropLow = 1;
  let dropHigh = 1;
  if (n >= 5) {
    dropLow = 2;
    dropHigh = 2;
  }
  if (dropLow + dropHigh >= n) {
    dropLow = 1;
    dropHigh = 1;
  }

  const droppedLow = sorted.slice(0, dropLow);
  const droppedHigh = sorted.slice(n - dropHigh);
  const usedScores = sorted.slice(dropLow, n - dropHigh);
  const sumUsed = usedScores.reduce((a, b) => a + b, 0);
  const trimmedMean = usedScores.length ? sumUsed / usedScores.length : null;

  return {
    trimmedMean,
    usedScores,
    droppedLow,
    droppedHigh,
    judgeCount: n,
    trimRule: n >= 5 ? 'drop 2 low + 2 high' : 'drop 1 low + 1 high',
  };
}

/**
 * Rubric weights: if all missing, equal weights. Otherwise normalize positive weights to sum 1.
 */
export function normalizeRubricWeights(criteria) {
  const list = criteria.map((c) => ({
    name: c.name,
    maxScore: c.maxScore,
    rawWeight: c.weight != null && Number(c.weight) > 0 ? Number(c.weight) : null,
  }));

  const any = list.some((x) => x.rawWeight != null);
  if (!any) {
    const w = 1 / list.length;
    return list.map((x) => ({
      name: x.name,
      maxScore: x.maxScore,
      weight: w,
      weightSource: 'equal',
    }));
  }

  const sum = list.reduce((s, x) => s + (x.rawWeight || 0), 0);
  if (sum <= 0) {
    const w = 1 / list.length;
    return list.map((x) => ({
      name: x.name,
      maxScore: x.maxScore,
      weight: w,
      weightSource: 'equal (invalid weights)',
    }));
  }

  return list.map((x) => ({
    name: x.name,
    maxScore: x.maxScore,
    weight: (x.rawWeight || 0) / sum,
    weightSource: 'rubric',
  }));
}

/**
 * Weighted overall on 0–100 scale: sum(weight * (trimmedMean / maxScore)).
 */
export function weightedOverallFromRubrics(rubricResults) {
  let acc = 0;
  for (const r of rubricResults) {
    if (r.trimmedMean == null || !r.maxScore) continue;
    acc += r.weight * (r.trimmedMean / r.maxScore);
  }
  return parseFloat((acc * 100).toFixed(2));
}
