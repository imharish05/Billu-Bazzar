export const validateEmail = (email) => {
  if (!email) return { isValid: false, message: 'Email address is required.' };
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Please enter a valid email address (e.g. name@domain.com).' };
  }
  return { isValid: true };
};

export const validatePassword = (password) => {
  if (!password) return { isValid: false, message: 'Password is required.' };
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  return { isValid: true };
};

export const validatePhoneNumber = (phone) => {
  if (!phone) return { isValid: false, message: 'Phone number is required.' };
  
  // Clean formatting characters
  const clean = phone.trim().replace(/^\+/, '').replace(/[\s\-()]/g, '');
  
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, message: 'Phone number must contain only digits.' };
  }
  
  const isIndiaPrefix = clean.startsWith('91');
  const isUaePrefix = clean.startsWith('971');
  
  // 1. India checks
  if (isIndiaPrefix || (/^[6-9]/.test(clean) && clean.length >= 9 && clean.length <= 11)) {
    if (isIndiaPrefix) {
      const localPart = clean.slice(2);
      if (localPart.length !== 10) {
        return { 
          isValid: false, 
          message: 'India number with country code must be 12 digits (+91 followed by 10 digits).' 
        };
      }
      if (!/^[6-9]/.test(localPart)) {
        return { 
          isValid: false, 
          message: 'India mobile numbers must start with 6, 7, 8, or 9.' 
        };
      }
      return { isValid: true };
    } else {
      if (clean.length !== 10) {
        return { 
          isValid: false, 
          message: 'India mobile number must be exactly 10 digits (excluding country code).' 
        };
      }
      if (!/^[6-9]/.test(clean)) {
        return { 
          isValid: false, 
          message: 'India mobile numbers must start with 6, 7, 8, or 9.' 
        };
      }
      return { isValid: true };
    }
  }
  
  // 2. UAE checks
  if (isUaePrefix || /^0?5[024568]/.test(clean) || /^0?4/.test(clean)) {
    if (isUaePrefix) {
      const localPart = clean.slice(3); // Remove 971
      
      if (localPart.startsWith('5')) {
        if (localPart.length !== 9) {
          return {
            isValid: false,
            message: 'UAE mobile with country code must be 11 digits (+971 50/52/54/55/56/58 followed by 7 digits).'
          };
        }
        if (!/^5[024568]/.test(localPart)) {
          return {
            isValid: false,
            message: 'UAE mobile operator code must be 50, 52, 54, 55, 56, or 58.'
          };
        }
        return { isValid: true };
      } else if (localPart.startsWith('4')) {
        if (localPart.length !== 8) {
          return {
            isValid: false,
            message: 'Dubai landline with country code must be 10 digits (+971 4 followed by 7 digits).'
          };
        }
        return { isValid: true };
      } else {
        return {
          isValid: false,
          message: 'Invalid UAE number. Mobile must start with 5 (e.g. 50) and landline must start with 4.'
        };
      }
    } else {
      // Local UAE format (without country code)
      if (clean.startsWith('05') || clean.startsWith('5')) {
        const hasLeadingZero = clean.startsWith('0');
        const expectedLength = hasLeadingZero ? 10 : 9;
        
        if (clean.length !== expectedLength) {
          return {
            isValid: false,
            message: hasLeadingZero 
              ? 'UAE mobile number must be 10 digits when starting with 0 (e.g. 050 123 4567).'
              : 'UAE mobile number must be 9 digits (excluding leading 0).'
          };
        }
        
        const operatorCode = hasLeadingZero ? clean.slice(1, 3) : clean.slice(0, 2);
        const validCodes = ['50', '52', '54', '55', '56', '58'];
        if (!validCodes.includes(operatorCode)) {
          return {
            isValid: false,
            message: 'UAE mobile operator code must be 50, 52, 54, 55, 56, or 58.'
          };
        }
        return { isValid: true };
      } else if (clean.startsWith('04') || clean.startsWith('4')) {
        const hasLeadingZero = clean.startsWith('0');
        const expectedLength = hasLeadingZero ? 9 : 8;
        
        if (clean.length !== expectedLength) {
          return {
            isValid: false,
            message: hasLeadingZero
              ? 'Dubai landline must be 9 digits when starting with 04 (e.g. 04 123 4567).'
              : 'Dubai landline must be 8 digits (excluding leading 0).'
          };
        }
        return { isValid: true };
      }
    }
  }
  
  return {
    isValid: false,
    message: 'Please enter a valid India (+91) or UAE (+971) phone number.'
  };
};
