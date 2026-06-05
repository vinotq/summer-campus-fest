export function normalize(str, { caseSensitive = false } = {}) {
  let s = str.normalize('NFKC').trim().replace(/\s+/g, ' ');
  // Remove punctuation
  s = s.replace(/[.,!?;:'"«»—–\-()[\]{}/\\]/g, '');
  s = s.trim();
  if (!caseSensitive) s = s.toLowerCase();
  return s;
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
