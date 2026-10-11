export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Please enter a valid email address.";
  }
  return undefined;
}

export function validatePhone(phone: string): string | undefined {
  if (!phone.trim()) return "Phone number is required.";
  const normalized = phone.replace(/[\s()-]/g, "");
  if (!/^(?:(?:\+?234)|0)?[789]\d{9}$/.test(normalized)) {
    return "Please enter a valid Nigerian phone number.";
  }
  return undefined;
}

export function validateEmailOrPhone(identifier: string): string | undefined {
  if (!identifier.trim()) return "Email or phone number is required.";
  return identifier.includes("@")
    ? validateEmail(identifier)
    : validatePhone(identifier);
}

export function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Use at least one letter and one number.";
  }
  return undefined;
}
