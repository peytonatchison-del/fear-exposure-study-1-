// SQLite's datetime('now') returns "YYYY-MM-DD HH:MM:SS" — UTC, space
// separator, 24-hour clock. The researcher dashboard shows every timestamp
// converted to the researcher's local time zone in 12-hour (AM/PM) format,
// e.g. "Sep 27, 2026, 3:45 PM", instead of the raw 24-hour SQLite string.
export function formatTimestamp(sqliteTimestamp) {
  if (!sqliteTimestamp) return '—';
  const iso = `${sqliteTimestamp.replace(' ', 'T')}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return sqliteTimestamp;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
