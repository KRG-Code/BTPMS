// Validation functions for resident signup form

/**
 * Validates the resident signup form data
 * @param {Object} signupState - The form state object
 * @returns {Object} - Contains valid (boolean) and errors object
 */
export const validateSignup = (signupState) => {
  let valid = true;
  const errors = {};

  // First Name validation
  if (!signupState.firstName?.trim()) {
    errors.firstName = "First name is required";
    valid = false;
  } else if (signupState.firstName.length < 2) {
    errors.firstName = "First name must be at least 2 characters";
    valid = false;
  }

  // Last Name validation
  if (!signupState.lastName?.trim()) {
    errors.lastName = "Last name is required";
    valid = false;
  } else if (signupState.lastName.length < 2) {
    errors.lastName = "Last name must be at least 2 characters";
    valid = false;
  }

  // Birthday validation
  if (!signupState.birthday) {
    errors.birthday = "Date of birth is required";
    valid = false;
  } else {
    const birthDate = new Date(signupState.birthday);
    const today = new Date();
    
    // Ensure the date is valid
    if (isNaN(birthDate.getTime())) {
      errors.birthday = "Please enter a valid date";
      valid = false;
    } 
    // Check if birth date is in the future
    else if (birthDate > today) {
      errors.birthday = "Date of birth cannot be in the future";
      valid = false;
    }
    // Check if person is at least 18 years old (if needed)
    // const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    // if (birthDate > eighteenYearsAgo) {
    //   errors.birthday = "You must be at least 18 years old";
    //   valid = false;
    // }
  }

  // Gender validation
  if (!signupState.gender) {
    errors.gender = "Gender is required";
    valid = false;
  }

  // Marital Status validation
  if (!signupState.maritalStatus) {
    errors.maritalStatus = "Marital status is required";
    valid = false;
  }

  // Citizenship validation
  if (!signupState.citizenship?.trim()) {
    errors.citizenship = "Citizenship is required";
    valid = false;
  }

  // Email validation
  if (!signupState.email?.trim()) {
    errors.email = "Email is required";
    valid = false;
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(signupState.email)) {
      errors.email = "Please enter a valid email address";
      valid = false;
    }
  }

  // Contact Number validation
  if (!signupState.contactNumber?.trim()) {
    errors.contactNumber = "Contact number is required";
    valid = false;
  } else {
    // Check for valid phone number format
    // Accepts formats like: +639123456789, 09123456789, 9123456789
    const phonePattern = /^(\+?63|0)?[9]\d{9}$/;
    if (!phonePattern.test(signupState.contactNumber.replace(/\s+/g, ''))) {
      errors.contactNumber = "Please enter a valid Philippine mobile number";
      valid = false;
    }
  }

  // Address validation
  if (!signupState.address?.trim()) {
    errors.address = "Address is required";
    valid = false;
  } else if (signupState.address.length < 5) {
    errors.address = "Please enter a complete address";
    valid = false;
  }

  return { valid, errors };
};
