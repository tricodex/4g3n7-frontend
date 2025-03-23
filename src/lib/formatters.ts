/**
 * Format a timestamp consistently between server and client
 * to avoid hydration errors with Next.js
 */
export function formatTime(date: Date): string {
  // Use fixed format rather than locale-dependent methods
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format a date consistently between server and client
 */
export function formatDate(date: Date): string {
  // Use fixed format that doesn't depend on locale
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a datetime consistently between server and client
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}
