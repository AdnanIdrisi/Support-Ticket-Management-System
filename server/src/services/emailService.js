const MailComposer = require('nodemailer/lib/mail-composer');
const env = require('../config/env');

const hasGoogleOAuthConfig = () =>
  Boolean(
    env.google.user &&
      env.google.clientId &&
      env.google.clientSecret &&
      env.google.refreshToken
  );

/**
 * Exchanges the Google OAuth2 refresh token for a short-lived access token over HTTPS.
 */
const getAccessToken = async () => {
  const params = new URLSearchParams({
    client_id: env.google.clientId,
    client_secret: env.google.clientSecret,
    refresh_token: env.google.refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to refresh OAuth2 access token');
  }
  return data.access_token;
};

/**
 * Builds a base64url-encoded RFC 2822 raw email message using Nodemailer's MailComposer.
 */
const buildRawEmail = (mailOptions) =>
  new Promise((resolve, reject) => {
    const mail = new MailComposer(mailOptions);
    mail.compile().build((err, message) => {
      if (err) return reject(err);
      const encoded = message
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      resolve(encoded);
    });
  });

if (env.nodeEnv !== 'test' && hasGoogleOAuthConfig()) {
  getAccessToken()
    .then(() => {
      console.log('Email transporter (Gmail OAuth2 HTTPS API) is ready to send emails');
    })
    .catch((err) => {
      console.error('Error setting up email transporter:', err.message);
    });
}

/**
 * Sends an email notification via Gmail REST API over HTTPS (port 443).
 * Works on Render free tier where outbound SMTP ports (465/587) are blocked.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (env.nodeEnv === 'test' || !to) {
    return { skipped: true };
  }

  if (!hasGoogleOAuthConfig()) {
    if (env.nodeEnv === 'development') {
      console.log(
        `[Email Skipped - Google OAuth2 credentials not configured] To: ${to} | Subject: ${subject}`
      );
    }
    return { skipped: true };
  }

  try {
    const accessToken = await getAccessToken();
    const raw = await buildRawEmail({
      from: env.google.from,
      to,
      subject,
      html,
      text,
    });

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gmail API send failed');
    }

    return { messageId: data.id };
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
    return { error: err.message };
  }
};

module.exports = { sendEmail };
