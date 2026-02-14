/**
 * Format date to localized string
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format date and time to localized string
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format time only
 * @param {string|Date} date
 * @returns {string}
 */
export const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format currency (Argentine pesos)
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

/**
 * Calculate time difference in minutes
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {number}
 */
export const getMinutesDiff = (startDate, endDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end - start) / 1000 / 60);
};

/**
 * Format minutes to readable string
 * @param {number} minutes
 * @returns {string}
 */
export const formatDuration = (minutes) => {
  if (minutes < 1) return 'Menos de 1 min';
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
};
