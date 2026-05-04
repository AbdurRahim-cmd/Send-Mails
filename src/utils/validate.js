// utils/validate.js

export const validateEmails = (emails) => {
  if (!emails || !Array.isArray(emails)) {
    return {
      isValid: false,
      message: "Emails must be an array",
    };
  }

  if (emails.length === 0) {
    return {
      isValid: false,
      message: "Email list cannot be empty",
    };
  }

  if (emails.length > 20) {
    return {
      isValid: false,
      message: "Maximum 20 emails allowed per request",
    };
  }

  for (const mail of emails) {
    if (!mail.to || !mail.subject || !mail.body) {
      return {
        isValid: false,
        message: "Each email must contain to, subject, and body",
      };
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(mail.to)) {
      return {
        isValid: false,
        message: `Invalid email format: ${mail.to}`,
      };
    }

    if (mail.subject.length > 200) {
      return {
        isValid: false,
        message: "Subject is too long",
      };
    }

    if (mail.body.length > 5000) {
      return {
        isValid: false,
        message: "Email body is too long",
      };
    }
  }

  return {
    isValid: true,
    message: "Validation successful",
  };
};