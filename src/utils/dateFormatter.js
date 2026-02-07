/**
 * Format a date string (YYYY-MM-DD) to a localized date string without timezone issues
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export const formatDateString = (dateString) => {
  if (!dateString) return '';

  // Parse the date components manually to avoid timezone conversion
  const [year, month, day] = dateString.split('-').map(Number);

  // Create date in local timezone (month is 0-indexed in JS Date)
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString();
};

/**
 * Format a date string to a more readable format
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDateStringLong = (dateString, options = {}) => {
  if (!dateString) return '';

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const defaultOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return date.toLocaleDateString(undefined, defaultOptions);
};
