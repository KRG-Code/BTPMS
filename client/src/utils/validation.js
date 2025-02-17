// validation.js
import { getPasswordStrength } from './passwordStrength';

// validation.js

export const validateSignup = (signupState) => {
  let valid = true;
  const errors = {};

  // First Name validation
  if (!signupState['firstName']) {
    errors['firstName'] = "First Name is required.";
    valid = false;
  }

  // Last Name validation
  if (!signupState['lastName']) {
    errors['lastName'] = "Last Name is required.";
    valid = false;
  }

  if (signupState.address && signupState.address.length < 5) {
    errors.address = "Address is too short.";
    valid = false;
  }

  // Contact Number validation (optional)
  const contactPattern = /^[0-9]{10}$/;
  if (signupState.contactNumber && !contactPattern.test(signupState.contactNumber)) {
    errors.contactNumber = "Contact Number must be a valid 10-digit number.";
    valid = false;
  }

  // Birthday validation
  if (!signupState.birthday) {
    errors.birthday = "Birthday is required.";
    valid = false;
  }

  // Username validation
  if (!signupState.username) {
    errors.username = "Username is required.";
    valid = false;
  }

  // Email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!signupState.email || !emailPattern.test(signupState.email)) {
    errors.email = "Please enter a valid email address.";
    valid = false;
  }

  // Password validation
  const { score } = getPasswordStrength(signupState.password);
  if (score < 4) {  // Require at least a 'Strong' password
    errors.password = "Password is too weak.";
    valid = false;
  }

  if (signupState.password !== signupState.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
    valid = false;
  }

  return { valid, errors };
};

export const validateLoginTanod = (loginState) => {
  let valid = true;
  const errors = {};

  // Username validation
  if (!loginState.username) {
    errors.username = "Username is required.";
    valid = false;
  }

  // Password validation
  if (!loginState.password) {
    errors.password = "Password is required.";
    valid = false;
  }

  return { valid, errors };
};

export const validateLoginResident = (loginState) => {
  let valid = true;
  const errors = {};

  // Username validation
  if (!loginState.email) {
    errors.email = "Email is required.";
    valid = false;
  }

  // Password validation
  if (!loginState.password) {
    errors.password = "Password is required.";
    valid = false;
  }

  return { valid, errors };
};

