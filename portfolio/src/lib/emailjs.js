import emailjs from '@emailjs/browser';

const emailJsConfig = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

export const isEmailJsConfigured = Object.values(emailJsConfig).every(Boolean);

export const sendEmailForm = async (form) => {
  if (!isEmailJsConfigured) {
    throw new Error('Email service is not configured yet.');
  }

  return emailjs.sendForm(
    emailJsConfig.serviceId,
    emailJsConfig.templateId,
    form,
    emailJsConfig.publicKey,
  );
};
