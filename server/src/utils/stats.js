// Small, dependency-free descriptive-statistics helpers used by the
// researcher dashboard. Deliberately does NOT include inferential tests
// (t-tests, p-values, etc.) — the study spec requires the dashboard to show
// only raw/organized data and basic descriptive statistics, and to avoid
// implying the intervention "worked."

export function mean(values) {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function median(values) {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v)).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
}

export function stddev(values) {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (nums.length < 2) return null;
  const m = mean(nums);
  const variance = nums.reduce((sum, v) => sum + (v - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

export function round(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

export function describe(values) {
  return {
    n: values.filter((v) => typeof v === 'number' && !Number.isNaN(v)).length,
    mean: round(mean(values), 2),
    median: round(median(values), 2),
    sd: round(stddev(values), 2),
  };
}
