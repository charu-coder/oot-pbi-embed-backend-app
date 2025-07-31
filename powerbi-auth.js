// powerbi-auth.js
const axios = require('axios');

let cachedToken = null;
let tokenExpiresAt = null;
require("dotenv").config();

const getAccessToken = async () => {
  const currentTime = Math.floor(Date.now() / 1000); // in seconds

  if (cachedToken && tokenExpiresAt && currentTime < tokenExpiresAt - 60) {
    // token is still valid (with a 60-sec buffer)
    return cachedToken;
  }

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID;

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://analysis.windows.net/powerbi/api/.default'
  });

  const response = await axios.post(url, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  cachedToken = response.data.access_token;
  tokenExpiresAt = currentTime + response.data.expires_in;

  return cachedToken;
};

module.exports = { getAccessToken };
