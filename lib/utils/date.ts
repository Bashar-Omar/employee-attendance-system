export function toEgyptTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function toEgyptTimeOnly(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    timeZone: 'Africa/Cairo',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function toEgyptDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Returns today's date as a string in Egypt local time (YYYY-MM-DD).
 * Used for "already checked in today" comparisons — avoids UTC midnight drift.
 */
export function getEgyptDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }); // "2024-03-15"
}
