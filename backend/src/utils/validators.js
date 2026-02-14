const validator = {
  isValidEmail(email) {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPhone(phone) {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[\d\s\-+()]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  },

  isValidPassword(password) {
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8');
    return password && password.length >= minLength;
  },

  isValidRole(role) {
    const validRoles = ['manager', 'cook', 'order_taker'];
    return validRoles.includes(role);
  },

  isValidOrderStatus(status) {
    const validStatuses = ['pending', 'assigned', 'in_progress', 'completed'];
    return validStatuses.includes(status);
  },

  isValidTransactionType(type) {
    const validTypes = ['purchase', 'usage', 'adjustment'];
    return validTypes.includes(type);
  },

  isPositiveNumber(value) {
    return typeof value === 'number' && value > 0;
  },

  isNonNegativeNumber(value) {
    return typeof value === 'number' && value >= 0;
  },

  sanitizeString(str) {
    if (!str) return '';
    return str.trim().replace(/[<>]/g, '');
  },
};

module.exports = validator;
