/**
 * Display formatting helpers (locale-aware through Intl).
 */

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/** Formats a Unix timestamp in seconds, e.g. `Aug 29, 2023` (course MainPage Task 3). */
export function formatDate(unixSeconds: number): string {
  return dateFormatter.format(new Date(unixSeconds * 1000));
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 hours ago", "yesterday", "just now". */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

/** "1.1 years", "1 year". */
export function formatAge(years: number): string {
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}
