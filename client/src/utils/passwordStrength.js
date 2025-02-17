// passwordStrength.js

export const getPasswordStrength = (password) => {
  let score = 0;
  let suggestions = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    suggestions.push("Password should be at least 8 characters long.");
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push("Include at least one uppercase letter.");
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push("Include at least one lowercase letter.");
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    suggestions.push("Include at least one number.");
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    suggestions.push("Include at least one special character (e.g., !@#$%).");
  }

  let strength = "Weak";
  if (score === 5) {
    strength = "Very Strong";
  } else if (score >= 4) {
    strength = "Strong";
  } else if (score >= 3) {
    strength = "Medium";
  }

  return { score, strength, suggestions };
};
