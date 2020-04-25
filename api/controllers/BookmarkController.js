const bookmarkService = require('../services/bookmark.service');

const BookmarkController = () => {
    /**
     * @swagger
     * /bookmark:
     *   post:
     *     summary: Bookmark an Article
     *     description: Bookmark a specific Article
     *     tags:
     *       - article
     *       - bookmark
     */
    const addBookmark = async (req, res) => {
        const { body: { articleId, artistId }, user: { user } } = req;
        console.log(user);

        if (articleId && artistId) {
            if (await bookmarkService.createBookmark(user, articleId, artistId)) {
                return res.status(200).json(req.body);
            }
            return res.status(500).json(req.body);
        }

        return res.status(400).json({ msg: 'Bad Request: articleId and artistId are required' });
    };

    /**
     * @swagger
     * /bookmark:
     *   delete:
     *     summary: Remove Bookmarked an Article
     *     description: Removed an article from being bookmarked.
     *     tags:
     *       - article
     *       - bookmark
     */
    const removeBookmark = async (req, res) => {
        const { body: { articleId, artistId }, user: { user } } = req;

        if (articleId && artistId) {
            if (await bookmarkService.deleteBookmark(user, articleId, artistId)) {
                return res.status(200).json(req.body);
            }
            return res.status(500).json(req.body);
        }

        return res.status(400).json({ msg: 'Bad Request: articleId and artistId are required' });
    };

    /**
     * @swagger
     * /bookmark:
     *   get:
     *     summary: Get Bookmarked Articles
     *     description: Returns all bookmarked articles for a User or all bookmarked articles for a User for an Artist.
     *     tags:
     *       - article
     *       - bookmark
     */
    const getBookmark = async (req, res) => {
        const { user: { user } } = req;
        const { aid } = req.query;

        if (user) {
            let bookmarks = [];
            if (aid) {
                console.log('aid');
                bookmarks = await bookmarkService.getBookmarksForUserAndArtist(user, aid);
            } else {
                console.log('no aid');
                bookmarks = await bookmarkService.getBookmarksForUser(user);
            }
            return res.status(200).json({
                bookmarks,
            });
        }

        return res.status(500).json({
            msg: 'Error: Unable to get bookmarks',
            bookmarks: [],
        });
    };

    return {
        addBookmark,
        removeBookmark,
        getBookmark,
    };
};

module.exports = BookmarkController;
