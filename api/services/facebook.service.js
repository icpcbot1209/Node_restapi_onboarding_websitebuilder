const axios = require('axios');
const Sentry = require('@sentry/node');

module.exports = {
    verifyAccessToken: async (fbToken) => axios
        .get(`https://graph.facebook.com/me?fields=name,email&access_token=${fbToken}`)
        .then((response) => response)
        .catch((error) => Sentry.captureException(error)),
};
