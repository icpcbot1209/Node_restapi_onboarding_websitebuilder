const songkickService = require('../services/songkick.service');

const ShowController = () => {
    /**
     * @swagger
     * /show/artist:
     *   get:
     *     summary: Get Shows for Artist
     *     description: Returns a list of shows for a specific Artist.
     *     tags:
     *       - artist
     *       - shows
     */
    const getShowByArtistId = async (req, res) => {
        const response = await songkickService.getArtistUpcomingEvents(244669);
        return res.status(200).json({ response });
    };

    /**
     * @swagger
     * /show/location:
     *   get:
     *     summary: Get Shows for a Location
     *     description: Returns a list of shows for a specific lat/long location.
     *     tags:
     *       - artist
     *       - shows
     */
    const getShowByLocation = async (req, res) => {
        const { lat, long } = req.query;
        const response = await songkickService.getEventsByLocation(lat, long)
            .catch((err) => console.log(err));
        return res.status(200).json({ response });
    };

    return {
        getShowByArtistId,
        getShowByLocation,
    };
};

module.exports = ShowController;
