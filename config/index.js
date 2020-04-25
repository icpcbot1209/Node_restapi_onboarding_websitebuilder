const publicRoutes = require('./routes/publicRoutes');
const privateRoutes = require('./routes/privateRoutes');
const adminRoutes = require('./routes/adminRoutes');
const feedly = require('./feedly');
const aws = require('./aws');
const songkick = require('./songkick');
const spotify = require('./spotify');
const godaddy = require('./godaddy');
const bitbucket = require('./bitbucket');
const stripe = require('./stripe');

const email = {
    source: process.env.EMAIL_SOURCE,
};

module.exports = {
    publicRoutes,
    privateRoutes,
    adminRoutes,
    port: process.env.PORT || '3002',
    host: process.env.JAMFEED_API_HOST || 'localhost',
    jwtSecret: process.env.JWT_SECRET || 'secret',
    feedly,
    aws,
    godaddy,
    bitbucket,
    sslCertificate: process.env.SSL_CERTIFICATE || '',
    email,
    songkick,
    spotify,
    stripe,
};
