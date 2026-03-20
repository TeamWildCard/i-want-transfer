export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function formatCurrency(amount: number) {
  return `₩${new Intl.NumberFormat('ko-KR').format(Math.round(amount))}`;
}

export function formatCountdown(seconds: number) {
  return `00:${String(seconds).padStart(2, '0')}`;
}

export function normalizeProgress(value: number, min: number, max: number) {
  if (max <= min) {
    return 0;
  }

  return clamp((value - min) / (max - min), 0, 1);
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }

  navigator.vibrate(pattern);
}
