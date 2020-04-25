const isEmpty = require('lodash.isempty');
const newsService = require('../services/news.service');
const songkickService = require('../services/songkick.service');

const FeedController = () => {
    /**
     * @swagger
     * /feed:
     *   get:
     *     summary: Get Article Feed
     *     description: Returns any type of feed (main, artist, or custom feed) and filter by type
     *     tags:
     *       - article
     *       - feed
     */
    const getFeed = async (req, res) => {
        const {
            page = 1,
            pageSize = 25,
            artistId,
            feedId,
            filterId = 0,
        } = req.query;
        const {
            user: {
                user,
            },
        } = req;

        const pageInt = parseInt(page, 10);
        const pageSizeInt = parseInt(pageSize, 10);
        const filterIdInt = parseInt(filterId, 10);

        // if artistId == null and feedId == null, default to get all feed w/ any filters
        let results = [];
        if (isEmpty(artistId) && isEmpty(feedId)) {
            if (filterIdInt === 0) {
                // get main feed
                results = await newsService.getUserNews(user, pageInt, pageSizeInt);
            } else if (filterIdInt === 1) {
                // get concerts
                // TODO Get User's artists, query for top 5 in parallel, join results, return
                results = await songkickService.getArtistUpcomingEvents(244669);
            } else if (filterIdInt === 2) {
                // get notifications
            } else if (filterIdInt === 3) {
                // get recommended news
            }
        } else if (!isEmpty(artistId)) {
            console.log('Not implemented yet');
        } else if (!isEmpty(feedId)) {
            console.log('Not implemented yet');
        }

        const response = {
            results,
            pagination: {
                currentPage: page,
                pageSize,
            },
        };

        return res.status(200).json(response);
    };

    return {
        getFeed,
    };
};

module.exports = FeedController;
