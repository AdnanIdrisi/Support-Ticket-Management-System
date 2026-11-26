const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });

  return transporter;
};

/**
 * Sends an email notification if SMTP is configured; otherwise skips silently in test/dev.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (env.nodeEnv === 'test' || !to) {
    return { skipped: true };
  }

  const mailer = getTransporter();
  if (!mailer) {
    if (env.nodeEnv === 'development') {
      console.log(`[Email Skipped - SMTP not configured] To: ${to} | Subject: ${subject}`);
    }
    return { skipped: true };
  }

  try {
    const info = await mailer.sendMail({
      from: env.smtp.from,
      to,
      subject,
      text,
      html,
    });
    return { messageId: info.messageId };
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
    return { error: err.message };
  }
};

module.exports = { sendEmail };
