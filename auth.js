const axios = require('axios');
const querystring = require('querystring');

const CLIENT_ID = process.env.PATREON_CLIENT_ID;
const CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET;
const REDIRECT_URI = process.env.PATREON_REDIRECT_URI;

const getPatreonAuthURL = () => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'identity identity.memberships'
  });
  return `https://www.patreon.com/oauth2/authorize?${params.toString()}`;
};

const checkPatreonMembership = async (code) => {
  // Exchange code for token
  const tokenResponse = await axios.post('https://www.patreon.com/api/oauth2/token', querystring.stringify({
    code,
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const { access_token } = tokenResponse.data;

  // Fetch user identity and memberships
  const identityResponse = await axios.get('https://www.patreon.com/api/oauth2/v2/identity', {
    headers: {
      Authorization: `Bearer ${access_token}`
    },
    params: {
      'include': 'memberships',
      'fields[member]': 'patron_status'
    }
  });

  const memberships = identityResponse.data.included || [];

  // Check if they are an active paying member
  const hasActiveMembership = memberships.some(m => m.type === 'member' && m.attributes.patron_status === 'active_patron');

  return hasActiveMembership;
};

module.exports = { getPatreonAuthURL, checkPatreonMembership };
