// formatPlayerName.js
/**
 * Format player name as 'F. lastName', e.g. 'Guillermo Del Pino' -> 'G. del Pino'
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}
 */
export function formatPlayerName(firstName, lastName) {
  if (!firstName && !lastName) return '';
  const initial = firstName ? firstName[0].toUpperCase() + '.' : '';
  let formattedLast = lastName ? lastName.trim() : '';
  return `${initial} ${formattedLast}`.trim();
}
