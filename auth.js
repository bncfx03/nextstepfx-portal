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
    scope: 'identity identity.memberships identity.email'
  });
  return `https://www.patreon.com/oauth2/authorize?${params.toString()}`;
};

const getPatreonUserData = async (code) => {
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

  const identityResponse = await axios.get('https://www.patreon.com/api/oauth2/v2/identity', {
    headers: {
      Authorization: `Bearer ${access_token}`
    },
    params: {
      'include': 'memberships.currently_entitled_tiers',
      'fields[identity]': 'full_name,email',
      'fields[member]': 'patron_status',
      'fields[tier]': 'title'
    }
  });

  const user = identityResponse.data.data.attributes;
  const memberships = identityResponse.data.included || [];

  const hasActiveMembership = memberships.some(
    m => m.type === 'member' && m.attributes.patron_status === 'active_patron'
  );

  let tierName = '';
  if (memberships.length > 0) {
    const firstTier = memberships[0].relationships?.currently_entitled_tiers?.data?.[0];
    if (firstTier) {
      const tierId = firstTier.id;
      // In real app, you could map this ID to a tier name
      tierName = "NextStep Premium Access"; // hardcode since only 1 tier
    }
  }

  return {
    isPatron: hasActiveMembership,
    fullName: user.full_name || 'Unknown',
    email: user.email || 'Unknown',
    tierName,
    patronStatus: hasActiveMembership ? 'Active Patron' : 'Inactive'
  };
};

module.exports = { getPatreonAuthURL, getPatreonUserData };
