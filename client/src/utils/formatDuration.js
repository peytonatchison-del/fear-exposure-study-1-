// Turns an hour count into something readable in participant-facing text —
// "24" becomes "1 day", "72" becomes "3 days", "6" stays "6 hours". Used
// anywhere the rolling session-timing settings (rollingUnlockHours /
// rollingWindowHours) are shown to a participant.
export function formatDuration(hours) {
  const n = Number(hours);
  if (!Number.isFinite(n) || n <= 0) return '0 hours';
  if (n % 24 === 0) {
    const days = n / 24;
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  return `${n} hour${n === 1 ? '' : 's'}`;
}
