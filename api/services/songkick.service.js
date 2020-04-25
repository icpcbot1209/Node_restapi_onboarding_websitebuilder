const Sentry = require('@sentry/node');
const Songkick = require('songkick-api-node');
const config = require('../../config');

const songkickApi = new Songkick(config.songkick.apiKey);

module.exports = {
    getArtistUpcomingEvents: async (artistId) => songkickApi.getArtistUpcomingEvents(artistId, { order: 'desc' })
        .catch((error) => {
            console.log(error);
            Sentry.captureException(error);
        }),
    getEventsByLocation: async (lat, long) => {
        const minDate = new Date().toISOString().slice(0, 10);
        const aYearFromNow = new Date();
        aYearFromNow.setFullYear(aYearFromNow.getFullYear() + 1);
        const maxDate = aYearFromNow.toISOString().slice(0, 10);
        return songkickApi.searchEvents({ minDate, maxDate, location: `geo:${lat},${long}` })
            .catch((error) => {
                Sentry.captureException(error);
            });
    },
};
