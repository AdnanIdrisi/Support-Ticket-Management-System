const nodemailer = require('nodemailer');
const env = require('../config/env');

const hasGoogleOAuthConfig = () =>
  Boolean(
    env.google.user &&
      env.google.clientId &&
      env.google.clientSecret &&
      env.google.refreshToken
  );

let transporter = null;

if (env.nodeEnv !== 'test' && hasGoogleOAuthConfig()) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: env.google.user,
      clientId: env.google.clientId,
      clientSecret: env.google.clientSecret,
      refreshToken: env.google.refreshToken,
    },
  });

  transporter
    .verify()
    .then(() => {
      console.log('Email transporter is ready to send emails');
    })
    .catch((err) => {
      console.error('Error setting up email transporter', err);
    });
}

/**
 * Sends an email notification via Google Gmail OAuth2 if configured;
 * otherwise skips gracefully in test/dev.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (env.nodeEnv === 'test' || !to) {
    return { skipped: true };
  }

  if (!transporter) {
    if (env.nodeEnv === 'development') {
      console.log(
        `[Email Skipped - Google OAuth2 credentials not configured] To: ${to} | Subject: ${subject}`
      );
    }
    return { skipped: true };
  }

  try {
    const mailOptions = {
      from: env.google.from,
      to,
      subject,
      html,
      text,
    };

    const details = await transporter.sendMail(mailOptions);
    return { messageId: details.messageId };
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
    return { error: err.message };
  }
};

module.exports = { sendEmail, transporter };
