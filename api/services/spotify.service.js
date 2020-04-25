const Sentry = require('@sentry/node');
const SpotifyWebApi = require('spotify-web-api-node');
const config = require('../../config');

// credentials are optional
const spotifyApi = new SpotifyWebApi({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret,
});

// Retrieve an access token.
spotifyApi.clientCredentialsGrant().then(
    (data) => {
        console.log(`The access token expires in ${data.body.expires_in}`);
        console.log(`The access token is ${data.body.access_token}`);

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body.access_token);
    },
    (err) => {
        Sentry.captureException(err);
        console.log('Something went wrong when retrieving an access token', err);
    },
);

module.exports = {
    setAccessToken: (accessToekn) => {
        spotifyApi.setAccessToken(accessToekn);
    },
    getRelatedArtists: async (artistId) => {
        const response = await spotifyApi.getArtistRelatedArtists(artistId)
            .then((data) => {
                console.log(data);
                return data.body;
            })
            .catch((err) => {
                Sentry.captureException(err);
                console.log(err);
                return { msg: err };
            });
        return response;
    },
};
