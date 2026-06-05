import { normalize, levenshtein } from '../utils/normalizeText.js';

// All checkers return { correct: boolean, partialRatio: number (0..1) }

function setsEqual(a, b) {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((x) => setA.has(x));
}

// Partial ratio: (correct hits - wrong hits) / total correct, clamped 0..1
function partialRatioForSets(correctSet, selectedArr) {
  const sel = new Set(selectedArr);
  const hits = [...correctSet].filter(x => sel.has(x)).length;
  const wrong = [...sel].filter(x => !correctSet.has(x)).length;
  const total = correctSet.size;
  if (total === 0) return 0;
  return Math.max(0, (hits - wrong) / total);
}

export function checkGrid3x3(payload, answerData) {
  const correctSet = new Set(
    payload.tiles.map((t, i) => (t.correct ? i : -1)).filter(i => i >= 0)
  );
  const selected = Array.isArray(answerData?.selected) ? answerData.selected : [];
  const partialRatio = partialRatioForSets(correctSet, selected);
  return { correct: partialRatio > 0, partialRatio };
}

export function checkTiles(payload, answerData) {
  const correctSet = new Set(payload.correctCells);
  const selected = Array.isArray(answerData?.selected) ? answerData.selected : [];
  const partialRatio = partialRatioForSets(correctSet, selected);
  return { correct: partialRatio > 0, partialRatio };
}

export function checkSlider(payload, answerData) {
  const { target, tolerance, axis } = payload;
  const ax = answerData?.x ?? -1;
  const ay = answerData?.y ?? -1;
  let hit;
  if (axis === 'x') hit = Math.abs(ax - target.x) <= tolerance;
  else if (axis === 'y') hit = Math.abs(ay - target.y) <= tolerance;
  else hit = Math.sqrt((ax - target.x) ** 2 + (ay - target.y) ** 2) <= tolerance;
  return { correct: hit, partialRatio: hit ? 1 : 0 };
}

export function checkText(payload, answerData) {
  const { expected, alternatives, matching } = payload;
  const opts = { caseSensitive: matching?.caseSensitive ?? false };
  const normActual = normalize(answerData?.text ?? '', opts);
  const maxDist = matching?.maxDistance ?? 0;

  const allExpected = [expected, ...(Array.isArray(alternatives) ? alternatives : [])].filter(Boolean);
  const hit = allExpected.some(exp => {
    const normExp = normalize(exp, opts);
    return levenshtein(normExp, normActual) <= maxDist;
  });
  return { correct: hit, partialRatio: hit ? 1 : 0 };
}

export const checkers = {
  grid3x3: checkGrid3x3,
  tiles: checkTiles,
  slider: checkSlider,
  audio: checkText,
  imageCode: checkText,
};
