const axios = require('axios');
const env = require('./env');

const headers = () => ({
  Authorization: `Bearer ${env.HDM_API_KEY}`,
  'Content-Type': 'application/json',
});

const enabled = () => Boolean(env.HDM_BRIDGE_ENABLED && env.HDM_API_KEY);

async function sendEmail({ to, subject, htmlBody, textBody, replyTo, templateId }) {
  if (!enabled()) throw new Error('HDM Bridge disabled');
  const { data } = await axios.post(
    `${env.HDM_API_URL}/emails/send`,
    {
      from: env.HDM_FROM_EMAIL,
      fromName: env.HDM_FROM_NAME,
      to,
      subject,
      htmlBody,
      textBody,
      replyTo,
      templateId,
    },
    { headers: headers(), timeout: 15_000 }
  );
  return data;
}

async function sendSms({ to, content, type = 'transactional' }) {
  if (!enabled()) throw new Error('HDM Bridge disabled');
  const phone = String(to).replace(/\D/g, '');
  const { data } = await axios.post(
    `${env.HDM_API_URL}/sms/send`,
    { to: phone, content, type },
    { headers: headers(), timeout: 15_000 }
  );
  return data;
}

const bridgeConfig = {
  apiKey: env.HDM_API_KEY,
  apiUrl: env.HDM_API_URL,
  fromEmail: env.HDM_FROM_EMAIL,
  fromName: env.HDM_FROM_NAME,
  enabled,
  sendEmail,
  sendSms,
};

module.exports = bridgeConfig;
module.exports.bridgeConfig = bridgeConfig;