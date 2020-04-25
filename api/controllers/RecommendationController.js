const spotifyService = require('../services/spotify.service');

const RecommendationController = () => {
    /**
     * @swagger
     * /recommendation/artist:
     *   get:
     *     summary: Get Recommended Artists
     *     description: Returns a list of recommended Artists that are not already followed by the User.
     *     tags:
     *       - artist
     *       - recommendation
     */
    const getRecommendedArtists = async (req, res) => {
        const response = await spotifyService.getRelatedArtists(123);
        return res.status(200).json({ response });
    };

    return {
        getRecommendedArtists,
    };
};

module.exports = RecommendationController;
