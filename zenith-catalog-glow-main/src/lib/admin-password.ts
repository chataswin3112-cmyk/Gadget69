export const ADMIN_PASSWORD_HINT =
  "Use 8+ characters with uppercase, lowercase, number, and special character.";

export const ADMIN_PASSWORD_PLACEHOLDER =
  "Min 8 chars, uppercase, lowercase, number, special char";

export const checkAdminPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&#^()_+=-]/.test(password),
  };

  return {
    checks,
    score: Object.values(checks).filter(Boolean).length,
  };
};

export const isStrongAdminPassword = (password: string) =>
  checkAdminPasswordStrength(password).score === 5;
